const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    res.render('users/index');
});

router.get('/:email', (req, res, next) => {
    const email = req.params.email;
    req.db.User.findOne({ email: email })
        .populate('currentCamp')
        .populate('currentCamps')
        .populate('pastCamps')
        .exec()
        .then(user => {
            if (!user) return next(new Error('Failed to find user.'));

            res.locals.targetUser = user;
            res.render('users/user');
        })
        .catch(next);
});

module.exports = router;
