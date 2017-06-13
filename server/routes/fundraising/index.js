const express = require('express');
const router = express.Router();

router.use(requireVerified);

/* GET home page. */
router.get('/', (req, res, next) => {
    // Get recent funds for this location
    req.db.Funds.find({ location: req.user.location._id })
        .limit(10)
        .exec()
        .then(fundsList => {
            res.locals.recentFunds = fundsList;
            res.render('fundraising/index');
        })
        .catch(next);
});

module.exports = router;
