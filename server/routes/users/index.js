const express = require('express');
const router = express.Router();

router.use(requireVerified);

/* GET home page. */
router.get('/', (req, res, next) => {
    req.db.User.find({ verified: true })
        .exec()
        .then(users => {
            res.locals.users = users;
            
            res.locals.teachers = users.filter(u => u.rank == 0);
            res.locals.directors = users.filter(u => u.rank == 1);
            res.locals.ambassadors = users.filter(u => u.rank == 2);
            res.locals.administrators = users.filter(u => u.rank == 3);

            res.render('users/index');
        })
        .catch(next);
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
