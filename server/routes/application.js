const express = require('express');
const router = express.Router();
const moment = require('moment');
const multer = require('multer');

const DOC_TYPES = ['.txt', '.doc', '.docx'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, __dirname + '/../../client/public/'),
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
        fileSize: 2000000, // 1 Megabyte
        files: 1,
    }
});

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

            return res.render('index/application');
        })
        .catch(next);
});

/* Save application data and alert higher ups */
router.post('/', upload.single('writingSample'), (req, res, next) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const grade = req.body.grade;
    const age = req.body.age;
    const phoneNumber = req.body.phoneNumber;
    const location = req.body.location;
    
    const rank = req.body.rank;
    const superiorId = (rank == 'teacher' ? req.body.directorId : req.body.ambassadorId);
    const why = req.body.why;

    req.user.name.first = firstName;
    req.user.name.last = lastName;
    req.user.grade = grade;
    req.user.age = age;
    req.user.phoneNumber = phoneNumber;
    req.user.location = location;
    
    if (req.file)
        req.user.application.writingFileName = req.file.filename;

    req.user.application.why = why;
    req.user.application.rank = (['teacher', 'director', 'ambassador'].includes(rank) ? rank : 'teacher');
    req.user.application.superior = superiorId;

    req.user.save()
        .then(user => {
            req.user = user;
            return req.db.User.findById(user.application.superior).exec();
        })
        .then(superior => {
            const message = `
            <h2>New Applicant</h2>
            <p>
                <b>${req.user.name.full}</b> has just applied to be a <b>${req.user.application.rankName}</b> under you.</b>
            </p>`;
            sendEmail(superior.email, 'New Applicant', message);

            req.flash('info', `Your application has been submitted! ${superior.name.full} has been alerted and will review your application soon. You will be emailed when it is accepted.`);
            res.redirect('/application');
        })
        .catch(next);
});

module.exports = router;
