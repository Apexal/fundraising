const express = require('express');
const router = express.Router();

router.use(requireVerified);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('camps/index');
});

router.get('/:campId', (req, res, next) => {
    req.db.Camp.findById(req.params.campId)
        .populate('location')
        .exec()
        .then(camp => {
            if (!camp) throw new Error('Failed to find camp. It may not exist.');
            req.camp = camp;

            res.locals.apiKey = require('../../config').googleAuth.apiKey;
            res.locals.ofUser = camp == req.user.camp; // If its the teacher or program director's location

            return camp.getTeachers();
        })
        .then(teachers => {
            console.log(teachers);
            req.teachers = teachers;
            return req.camp.getDirector();
        })
        .then(director => {
            console.log(director);
            req.director = director;
            return req.camp.getAmbassador();
        })
        .then(ambassador => {
            console.log(ambassador);
            req.ambassador = ambassador;
            return req.db.Funds.find({ camp: req.camp._id })
                .limit(10)
                .populate('submittedBy')
                .exec()
        })
        .then(fundsList => {
            req.recentFunds = fundsList;
            next();
        })
        .catch(err => {
            req.flash('error', err.message);
            return res.redirect('/');
        });
});

router.get('/:campId', (req, res) => {
    res.locals.camp = req.camp;
    res.locals.teachers = req.teachers;
    res.locals.director = req.director;
    res.locals.ambassador = req.ambassador;
    res.locals.recentFunds = req.recentFunds;

    res.render('camps/camp');
});

router.get('/:campId/fundraising', (req, res, next) => {
    const campId = req.params.campId;

    // Make sure has permission to view
    // User is Administrator OR Ambassador of camp OR Program Director of camp OR Teacher of camp
    
    if (req.user.rank > 2 || req.user.currentCamps.includes(campId) || req.user.currentCamp._id == campId) {
        req.db.Funds.find({ location: req.user.location._id })
        .limit(10)
        .populate('submittedBy')
        .exec()
        .then(fundsList => {
            res.locals.recentFunds = fundsList;
            res.render('fundraising/index');
        })
        .catch(next);
    } else {
        return next('You don\'t have permission to view this camp\'s finances.');
    }
});

module.exports = router;
