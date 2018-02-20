const express = require('express');
const router = express.Router();

router.use(requireLogin);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.locals.pageTitle = 'Fundraising Leaderboard';

    return res.render('fundraising/leaderboard');
});

module.exports = router;