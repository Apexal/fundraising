const express = require('express');
const router = express.Router();
const moment = require('moment');

router.use(requireLogin);

/* GET application. */
router.get('/', (req, res, next) => {
    if (req.user.verified) return res.redirect('/');

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
    req.user.application.camp = campId;
    

    req.user.save()
        .then(user => {
            req.flash('info', 'Updated application.');
            res.redirect('/application');
        })
        .catch(next);
});

module.exports = router;
