const express = require('express');
const router = express.Router();

router.use(requireVerified);

/* GET home page. */
router.get('/', (req, res, next) => {
    // Get recent funds for this location
    req.db.Funds.find({ location: req.user.location._id })
        .limit(10)
        .populate('submittedBy')
        .exec()
        .then(fundsList => {
            res.locals.recentFunds = fundsList;
            res.render('fundraising/index');
        })
        .catch(next);
});

router.post('/addfunds', (req, res, next) => {
    const locationId = req.user.location._id;
    const submittedById = req.user._id;
    const amount = req.body.amount;
    const method = req.body.method;
    const form = req.body.form;
    const source = req.body.source;

    const newFunds = new req.db.Funds({
        location: locationId,
        submittedBy: submittedById,
        amount,
        method,
        form,
        source
    });

    newFunds.save().then(() => {
        req.flash('success', 'Added new funds for ' + req.user.location.name);
        res.redirect('/fundraising');
    }).catch(next);
});

module.exports = router;
