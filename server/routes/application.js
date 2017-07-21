const express = require('express');
const router = express.Router();
const moment = require('moment');
const multer = require('multer');

const IMAGE_TYPES = ['.txt', '.doc', '.docx'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, __dirname + '/../../client/public/writingsamples'),
    filename: (req, file, cb) => cb(null, 'user-' + req.user._id + '.' + file.originalname.split('.')[1]),
    fileFilter: (req, file, cb) => {
        if(IMAGE_TYPES.includes(file.mimetype)) {
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
    req.db.Camp.find({ endDate: { "$gt": moment().startOf('day').toDate() }})
        .populate('location')
        .populate('ambassador')
        .populate('director')
        .populate('teachers')
        .exec()
        .then(openCamps => {
            res.locals.openCamps = openCamps;
            
            return res.render('index/application');
        });
});

/* Save application data and alert higher ups */
router.post('/', upload.single('writingSample'), (req, res, next) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const grade = req.body.grade;
    const age = req.body.age;
    const phoneNumber = req.body.phoneNumber;
    const location = req.body.location;
    
    const role = req.body.role;
    const campId = req.body.campId;
    const why = req.body.why;

    req.user.name.first = firstName;
    req.user.name.last = lastName;
    req.user.grade = grade;
    req.user.age = age;
    req.user.phoneNumber = phoneNumber;
    req.user.location = location;
    
    req.user.application.writingFileName = (req.file ? req.file.filename : undefined);

    req.user.application.why = why;
    req.user.application.role = (['teacher', 'director', 'ambassador'].includes(role) ? role : 'teacher');
    let newCamp = false;
    if (!req.user.application.camp || req.user.application.camp.toString() != campId.toString()) newCamp = true;
    req.user.application.camp = campId;
    
    req.user.save()
        .then(user => {
            req.flash('info', 'Your application has been submitted! Camp leaders have been alerted and will review your application soon. You will be emailed when it is accepted.');
            res.redirect('/application');
            if (newCamp) {
                // Email program director and ambassador
                return req.db.Camp.findById(campId)
                    .populate('location')
                    .populate('ambassador')
                    .populate('director')
                    .exec();
            }
        })
        .then(camp => {
            if (!camp) return;
            
            sendEmail(req.user.email, 'Application Submitted', `test`);

            if (req.user.application.role === 'teacher') {
                sendEmail(camp.director.email, 'New Applicant', `test`);
            } else if (req.user.application.role === 'director') {
                sendEmail(camp.ambassador.email, 'New Applicant', `test`);
            }
        })
        .catch(next);
});

module.exports = router;
