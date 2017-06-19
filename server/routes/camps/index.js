const express = require('express');
const router = express.Router();

router.use(requireVerified);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('camps/index');
});

router.all(['/:campId', '/:campId/*'], (req, res, next) => {
    req.db.Camp.findById(req.params.campId)
        .populate('location')
        .exec()
        .then(camp => {
            if (!camp) throw new Error('Failed to find camp. It may not exist.');
            req.camp = camp;
            return camp.getTeachers();
        })
        .then(teachers => {
            req.teachers = teachers;
            return req.camp.getDirector();
        })
        .then(director => {
            req.director = director;
            return req.camp.getAmbassador();
        })
        .then(ambassador => {
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
        .catch(next);
});

router.get('/:campId', (req, res) => {
    res.locals.camp = req.camp;
    res.locals.teachers = req.teachers;
    res.locals.director = req.director;
    res.locals.ambassador = req.ambassador;
    res.locals.recentFunds = req.recentFunds;

    res.locals.apiKey = require('../../config').googleAuth.apiKey;
    res.locals.ofUser = (req.user.rank > 2 || req.user.currentCamps.includes(req.camp) || req.camp == req.user.camp); // If its the teacher or program director's location

    res.render('camps/camp');
});

router.get('/:campId/fundraising', (req, res, next) => {
    const campId = req.params.campId;

    // Make sure has permission to view
    // User is Administrator OR Ambassador of camp OR Program Director of camp OR Teacher of camp
    
    if (1 == 1/*req.user.rank > 2 || req.user.currentCamps.includes(campId) || req.user.currentCamp == req.camp*/) {
        res.locals.camp = req.camp;
        res.locals.recentFunds = req.recentFunds;
        res.render('camps/fundraising/index');
    } else {
        return next(new Error('You don\'t have permission to view this camp\'s finances.'));
    }
});

router.post('/:campId/addfunds', (req, res, next) => {
    const campId = req.camp._id;
    const submittedById = req.user._id;
    const amount = req.body.amount;
    const method = req.body.method;
    const form = req.body.form;
    const source = req.body.source;

    const newFunds = new req.db.Funds({
        camp: campId,
        submittedBy: submittedById,
        amount,
        method,
        form,
        source
    });

    newFunds.save().then(() => {
        req.flash('success', 'Added new funds for camp.');
        res.redirect(`/camps/${req.camp._id}/fundraising`);
    }).catch(next);
});

module.exports = router;
