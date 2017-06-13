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
            res.locals.location = location;
            res.locals.apiKey = require('../../config').googleAuth.apiKey;
            res.locals.ofUser = location == req.user.location; // If its the teacher or program director's location

            res.render('locations/location');
        })
        .catch(next);
});

module.exports = router;
