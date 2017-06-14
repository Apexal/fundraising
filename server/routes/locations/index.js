const express = require('express');
const router = express.Router();

router.use(requireVerified);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('locations/index');
});

router.get('/:locationId', (req, res, next) => {
    req.db.Location.findById(req.params.locationId)
        .exec()
        .then(location => {
            res.locals.apiKey = require('../../config').googleAuth.apiKey;
            res.locals.ofUser = location == req.user.location; // If its the teacher or program director's location

            res.locals.location = location;

            return location.getTeachers();
        })
        .then(teachers => {
            res.locals.teachers = teachers;

            next();
        })
        .catch(next);
});

router.get('/:locationId', (req, res, next) => {
    res.render('locations/location');
});

router.get('/:locationId/fundraising', (req, res, next) => {
    // Make sure has permission to view
    

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

module.exports = router;
