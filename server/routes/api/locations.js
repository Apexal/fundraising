const express = require('express');
const router = express.Router();
const moment = require('moment');

router.use(requireLogin);

/* LIST all locations */
router.get('/', (req, res, next) => {
    
    if (!!req.query.regionId && !req.user.admin) return next(new Error('Only admins can view other region locations.'));
    const region = req.query.regionId ? req.query.regionId : req.user.region; 

    req.db.Location.find({ region })
        .sort({ dateAdded: -1 })
        .populate('region')
        .populate('comments')
        .then(locations => {
            return res.json(locations);
        })
        .catch(next);
});

module.exports = router;