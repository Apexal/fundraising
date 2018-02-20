const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const slack = require('../modules/slack');

const DOC_TYPES = ['.txt', '.doc', '.docx'];

/* Save uploaded writing sample files to the writingsamples directory with the naming scheme 'user-<user-id>.<extension>' */
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, __dirname + '/../../client/public/writingsamples'),
    filename: (req, file, cb) => cb(null, 'user-' + req.body.email + '.' + file.originalname.split('.')[1]),
    fileFilter: (req, file, cb) => {
        if(DOC_TYPES.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(null, false)
        }
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 1000000, // 1 Megabytes
        files: 1,
    }
});

/* GET application. */
router.get('/', requireNotLogin, (req, res, next) => {
    res.locals.pageTitle = 'Application';
    res.locals.user = {
        email: '',
        name: {},
        application: {}
    };

    ['rank', 'directorId', 'ambassadorId'].forEach(prop => res.locals.user.application[prop] = req.query[prop] ); // Prefill rank and/or superior from link

    // Get possbile superiors
    req.db.User
        .where('rank').ne('teacher')
        .where('verified', true)
        .where('application.applying', false)
        .exec()
        .then(superiors => {
            res.locals.superiors = superiors;
            res.locals.directors = superiors.filter(s => s.rank == 'director');
            res.locals.ambassadors = superiors.filter(s => s.rank == 'ambassador');

            return req.db.Region.find();
        })
        .then(regions => {
            res.locals.regions = regions;
            return res.render('application/application');
        })
        .catch(next);
});

/* Save application data and alert higher ups */
router.post('/', requireNotLogin, upload.single('writingSample'), (req, res, next) => {
    // Get form data
    let rank = req.body.rank;
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const grade = req.body.grade;
    const age = req.body.age;
    const phoneNumber = req.body.phoneNumber;
    const location = req.body.location;

    let regionId = req.body.region;
    // New region?
    if (req.body.region == 'new' && !!req.body.newRegionName) {
        // If requesting new region, they will become ambassador of it if accepted
        const newRegion = new req.db.Region({ name: req.body.newRegionName, approved: false, dateAdded: new Date() });
        newRegion.save();
        regionId = newRegion.id;

        rank = 'ambassador';

        // Alert all board members (admins)
        req.db.User.find({ admin: true })
            .exec()
            .then(admins => {
                sendEmail(admins.map(a => a.email), 'New Region Request', 'newRegionRequest', {applicantFullName: firstName + ' ' + lastName, regionName: newRegion.name});
            })
            .catch(next);

        req.flash('info', `Your application to become ambassador of new region '${newRegion.name}' has been submitted. It will be reviewed shortly. Please check your email for updates.`);

        log(null, 'Region Request', `New region request for ${newRegion.name}.`);
    } else {
        req.flash('info', `Your application to become a ${rank} has been submitted. It will be reviewed shortly. Please check your email for updates.`);
    }

    const superiorId = (rank == 'teacher' ? req.body.directorId : req.body.ambassadorId);
    const why = req.body.why;

    const recommender = req.body.recommender;

    // Get/create user
    const user = {
        region: regionId,
        email,
        age,
        grade,
        phoneNumber: phoneNumber,
        location: location,
        name: {
            full: firstName + ' ' + lastName,
            first: firstName,
            last: lastName
        },
        rank,
        application: {
            applying: true,
            rank,
            superior: superiorId,
            recommender,
            why,
            updatedAt: new Date()
        },
        verified: false
    };

    // Only set if uploaded, otherwise it would reset if nothing was uploaded
    if (req.file) user.application.writingFileName = req.file.filename;

    if (['teacher', 'director'].includes(rank) || (rank == 'ambassador' && req.body.region == 'new')) {
        user.application.rank = rank;
    } else {
        return next(new Error('Invalid rank!'));
    }

    user.application.superior = superiorId; // Can be null

    req.db.User.findOneAndUpdate({ email }, user, { upsert: true, new: true, setDefaultsOnInsert: true })
        .exec()
        .then(user => {
            log(user, 'application', `New application for ${user.name.full}.`);
            return user.save();
        })
        .then(user => {
            req.user = user;

            // TODO: RETURN SUPERIOR FOR EMAILS
            return req.db.User.findOne({_id: superiorId});
        })
        .then(superior => {
            console.log('Emailing superior...');
            if (superior) sendEmail(superior.email, 'New Applicant', 'newApplicant', { fullName: req.user.name.full, rankName: req.user.rank });

            sendEmail(user.email, 'Application Submitted', 'applicationSubmitted', { firstName: req.user.name.first, rank: rank });
            return res.redirect('/application');
        })
        .catch(next);
});

/* Non-teacher members can manage applicants under them  */
router.get('/applicants', requireLogin, requireHigherUp, (req, res, next) => {
    res.locals.pageTitle = 'Your Applicants';

    let q = { 'application.applying': true };
    if (req.user.rank != 'ambassador') q['application.superior'] = req.user._id;
    console.log(q);
    
    req.db.User.find(q)
        .exec()
        .then(applicants => {
            req.session.applicantCount = applicants.length;
            res.locals.applicants = applicants;

            res.locals.newApplicants = applicants.filter(a => !a.verified); // People new to Kids Tales
            res.locals.memberApplicants = applicants.filter(a => a.verified); // Existing members

            res.render('application/applicants');
        })
        .catch(next);
});

router.post('/verify', requireHigherUp, (req, res, next) => {
    
    // IF APPLY FOR TEACHER
    req.db.User.findById(req.query.userId)
        .exec()
        .then(applicant => {
            if (!applicant) throw new Error("Invalid user id.");
            
            applicant.verified = true; // VITAL - ALLOWS LOGIN
            applicant.application.applying = false;
            applicant.rank = applicant.application.rank;
            
            req.applicant = applicant;

            log(applicant, 'Application Accepted', `User was accepted to be ${applicant.rank}.`);

            if (applicant.application.rank == 'teacher') {
                // Try to find active workshop of director to assign to
                req.db.Workshop.findOne({ director: applicant.application.superior, active: true})
                    .populate('location')
                    .exec()
                    .then(workshop => {
                        if (!workshop.teachers.includes(applicant._id)) {
                            workshop.teachers.push(applicant._id); // Add applicant (teacher) to workshop
                            workshop.save();
                            
                            req.flash('info', `Assigned ${applicant.name.first} as a teacher to your workshop at ${workshop.location.name}`);

                            sendEmail(applicant.email, 'Application Accepted', 'applicationAccepted', {applicantFirstName: applicant.name.first, location: workshop.location.name, rank: applicant.rank});
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        console.log('No workshop found for ' + applicant.name.full);
                        // Could not find workshop to add applicant to
                    });
                    return applicant.save();
            } else {

                return applicant.save();
            }
        })
        .then(applicant => {
            // Remove writing sample
            const p = path.join(__dirname, '..', '..', 'client', 'public', 'writingsamples', applicant.application.writingFileName);
            try {
                fs.unlinkSync(p, err => {
                    if (err) console.error(err);
                });
            } catch(e) {}
            
            return req.db.Region.findOneAndUpdate({_id: applicant.region }, { approved: true }).exec();
        })
        .then(region => {
            // Only alert if the region wasn't already approved
            if (!region.approved) req.flash('info', `Approved new region ${region.name} with Ambassador ${req.applicant.name.full}.`);

            // INVITE TO SLACK
            return slack.inviteToTeam(req.applicant.name.first, req.applicant.email);
        })
        .then(data => {
            data = JSON.parse(data);

            console.log(data);
            if (data.ok || data.error == "already_in_team") {
                req.flash("Application accepted!" + (data == "already_in_team" ? '' : " They have been invited to the Slack team and can now login to the website."));

                return res.redirect('back');
            } else { throw new Error("Failed to invite to Slack but everything else worked! Maybe they are already on Slack?"); }
        })
        .catch(next);
});

router.post('/invite', (req, res, next) => {
    const link = `https://kidstales.ddns.net:3000/application?${req.user.rank}Id=${req.user._id}`;
    const emails = req.body.name.split(', ');

    req.flash('info', `Invitations have been sent out.`);

    emails.forEach(e => sendEmail(e, 'Kids Tales Invite', 'invite', { superiorName: req.user.name.full, link }));

    return res.redirect('/application/applicants');
});

module.exports = router;
