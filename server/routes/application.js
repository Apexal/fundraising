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

module.exports = router;
