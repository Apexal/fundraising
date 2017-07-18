const express = require('express');
const router = express.Router();
const moment = require('moment');

router.use(requireLogin);

/* GET application. */
router.get('/', (req, res, next) => {
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
router.post('/', (req, res, next) => {
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
    
    req.user.application.why = why;
    req.user.application.role = (['teacher', 'director', 'ambassador'].includes(role) ? role : 'teacher');
    let newCamp = false;
    if (!req.user.application.camp || req.user.application.camp.toString() != campId.toString()) newCamp = true;
    req.user.application.camp = campId;
    
    req.user.save()
        .then(user => {
            req.flash('info', 'Updated application.');
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
            if (req.user.application.role === 'teacher') {
                sendEmail(camp.director.email, 'New Applicant', `test`);
            } else if (req.user.application.role === 'director') {
                sendEmail(camp.ambassador.email, 'New Applicant', `test`);
            }
        })
        .catch(next);
});

module.exports = router;
