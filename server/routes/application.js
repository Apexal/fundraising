const express = require('express');
const router = express.Router();
const multer = require('multer');

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

/* Users must be at least logged in to access ANY routes here */
router.use(requireNotLogin);

/* GET application. */
router.get('/', (req, res, next) => {
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

            return res.render('application/application');
        })
        .catch(next);
});

/* Save application data and alert higher ups */
router.post('/', upload.single('writingSample'), (req, res, next) => {
    // Get form data
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

    // Get/create user
    const user = {
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
        rank: 'teacher', // placeholder
        application: {
            rank,
            superior: superiorId,
            //recommender: { type: Number, ref: 'User' },
            why,
            updatedAt: new Date()
        }
    };

    // Only set if uploaded, otherwise it would reset if nothing was uploaded
    if (req.file) user.application.writingFileName = req.file.filename;

    if (['teacher', 'director', 'ambassador'].includes(rank)) {
        user.application.rank = rank;
    } else {
        return next(new Error('Invalid rank!'));
    }

    if (['teacher', 'director'].includes(rank)) user.application.superior = superiorId;

    req.db.User.findOneAndUpdate({ email }, user, { upsert: true, new: true, setDefaultsOnInsert: true })
        .exec()
        .then(user => {
            console.log(user);
            return user.save();
        })
        .then(user => {
            req.user = user;
            req.flash('info', `Your application has been submitted. It will be reviewed shortly. Please check your email for updates.`);
            sendEmail(user.email, 'Application Submitted', 'applicationSubmitted', user);
            return res.redirect('/application');
            //return req.db.User.findById(user.superior).exec();
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

module.exports = router;
