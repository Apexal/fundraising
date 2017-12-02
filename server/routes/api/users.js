const express = require('express');
const router = express.Router();

router.use(requireLogin);

router.get('/', (req, res, next) => {
    // Determine query
    req.db.User.find(req.query.query || {})
        .select('email age grade phoneNumber rank admin registeredDate profileImageName region')
        .populate('region')
        .exec()
        .then(users => {
            return res.json(users);
        })
        .catch(next);
});

router.get('/:email', (req, res, next) => {
    req.db.User.findOne({ email: req.params.email, verified: true })
        .select('email age grade phoneNumber rank admin registeredDate profileImageName region')
        .populate('region')
        .exec()
        .then(user => {
            if (!user) return next(new Error('Failed to find user.'));
            res.locals.targetUser = user;
            return user.getWorkshops();
        })
        .then(workshops => {
            res.locals.targetUser.activeWorkshops = workshops.filter(w => w.active);
            res.locals.targetUser.inactiveWorkshops = workshops.filter(w => !w.active);
            return res.json(res.locals.targetUser);
        })
        .catch(next);
});

module.exports = router;