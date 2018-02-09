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

    // Get open workshops
    req.db.User
        .where('rank').ne('teacher')
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
    const regionId = req.body.region;

    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const grade = req.body.grade;
    const age = req.body.age;
    const phoneNumber = req.body.phoneNumber;
    const location = req.body.location;

    const rank = req.body.rank;
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
        }
    };

    // Only set if uploaded, otherwise it would reset if nothing was uploaded
    if (req.file) user.application.writingFileName = req.file.filename;

    if (['teacher', 'director'].includes(rank)) {
        user.application.rank = rank;
    } else {
        return next(new Error('Invalid rank!'));
    }

    user.application.superior = superiorId;

    req.db.User.findOneAndUpdate({ email }, user, { upsert: true, new: true, setDefaultsOnInsert: true })
        .exec()
        .then(user => {
            console.log(user);
            return user.save();
        })
        .then(user => {
            req.user = user;
            req.flash('info', `Your application has been submitted. It will be reviewed shortly. Please check your email for updates.`);
            sendEmail(user.email, 'Application Submitted', 'applicationSubmitted', { firstName: req.user.name.first, rank: rank });
            return res.redirect('/application');
        })
        /*.then(superior => {
            if (newSuperior) {
                sendEmail(superior.email, 'New Applicant', 'newApplicant', { fullName: req.user.name.full, rankName: req.user.rank });
                sendEmail(req.user.email, 'Application Updated', 'applicationUpdated', { firstName: req.user.name.first, superiorFirstName: superior.name.first });
            }



            const message = (newRank ? `Your application has been submitted! ${superior.name.full} has been alerted and will review your application soon. You will be emailed when it is accepted.` : `Your application has been updated. It will be submitted once you choose a rank and superior.`);
            req.flash('info', message);

            res.redirect('/application');
        })*/
        .catch(next);
});

/* Non-teacher members can manage applicants under them  */
router.get('/applicants', requireLogin, requireHigherUp, (req, res, next) => {
    res.locals.pageTitle = 'Your Applicants';

    req.db.User.find({ 'application.superior': req.user._id, 'application.applying': true })
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

            if (applicant.application.rank == 'teacher') {
                // Try to find active workshop of director to assign to
                req.db.Workshop.findOne({ director: applicant.application.superior, active: true})
                    .populate('location')
                    .exec()
                    .then(workshop => {
                        if (!workshop.teachers.include(applicant._id)) workshop.teachers.push(applicant._id); // Add applicant (teacher) to workshop
                        req.flash('info', `Assigned ${applicant.name.first} as a teacher to your workshop at ${workshop.location.name}`);
                        
                        workshop.save();
                    })
                    .catch(err => {
                        console.log('No workshop found for ' + applicant.name.full);
                        // Could not find workshop to add applicant to
                    });
                    return applicant.save();
            } else if (applicant.application.rank == 'director') {

                return applicant.save();
            }
        })
        .then(applicant => {
            //sendEmail(applicant.email, 'Application Accepted', `<h2>Congratulations!</h2><p>Your application to become a Kids Tales <b>${applicant.rank}</b> has been accepted.`);

            // Remove writing sample
            const p = path.join(__dirname, '..', '..', 'client', 'public', 'writingsamples', applicant.application.writingFileName);
            try {
                fs.unlinkSync(p, err => {
                    if (err) console.error(err);
                });
            } catch(e) {}

            // INVITE TO SLACK
            return slack.inviteToTeam(applicant.name.first, applicant.email);
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
