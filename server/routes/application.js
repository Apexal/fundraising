const express = require('express');
const router = express.Router();
const moment = require('moment');
const multer = require('multer');

const DOC_TYPES = ['.txt', '.doc', '.docx'];

/* Save uploaded writing sample files to the writingsamples directory with the naming scheme 'user-<user-id>.<extension>' */
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, __dirname + '/../../client/public/writingsamples'),
    filename: (req, file, cb) => cb(null, 'user-' + req.user._id + '.' + file.originalname.split('.')[1]),
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
router.use(requireLogin);

/* GET application. */
router.get('/', (req, res, next) => {
    res.locals.pageTitle = 'Application';

    if (req.user.verified) {
        req.flash('warning', 'You have already applied and been accepted.');    
        return res.redirect('/');
    }

    // Get open camps
    req.db.User.where('rank').ne('teacher')
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
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const grade = req.body.grade;
    const age = req.body.age;
    const phoneNumber = req.body.phoneNumber;
    const location = req.body.location;
    
    const rank = req.body.rank;
    const superiorId = (rank == 'teacher' ? req.body.directorId : req.body.ambassadorId);
    const why = req.body.why;

    // Update user properties
    req.user.name.first = firstName;
    req.user.name.last = lastName;
    req.user.grade = grade;
    req.user.age = age;
    req.user.phoneNumber = phoneNumber;
    req.user.location = location;
    
    req.user.application.updatedAt = new Date();

    // Only set if uploaded, otherwise it would reset if nothing was uploaded
    if (req.file)
        req.user.application.writingFileName = req.file.filename;

    req.user.application.why = why;
    
    const newSuperior = (rank !== 'none' && req.user.superior != superiorId);
    if (rank !== 'none') {
        req.user.rank = rank;
        req.user.superior = superiorId;
    }

    req.user.save()
        .then(user => {
            req.user = user;
            return req.db.User.findById(user.superior).exec();
        })
        .then(superior => {
            if (newSuperior) {
                sendEmail(superior.email, 'New Applicant', 'newApplicant', { fullName: req.user.name.full, rankName: req.user.rank });
                sendEmail(req.user.email, 'Application Updated', 'applicationUpdated', { firstName: req.user.name.first, superiorFirstName: superior.name.first });
            }

            const message = (newSuperior ? `Your application has been submitted! ${superior.name.full} has been alerted and will review your application soon. You will be emailed when it is accepted.` : `Your application has been updated. It will be submitted once you choose a rank and superior.`);

            req.flash('info', message);
            res.redirect('/application');
        })
        .catch(next);
});

module.exports = router;
