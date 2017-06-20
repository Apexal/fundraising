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
    req.db.User.findOne({ email: req.params.email })
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

router.get('/:email/edit', requireAdmin, (req, res, next) => {
    req.db.User.findOne({ email: req.params.email })
        .populate('currentCamp')
        .populate('currentCamps')
        .exec()
        .then(user => {
            if (!user) throw new Error('Failed to find user.');

            res.locals.targetUser = user;
            return req.db.Camp.find()
                .populate('location')
                .exec();
        })
        .then(camps => {
            res.locals.camps = camps;
            res.locals.noDirector = camps.filter(c => !c.director);
            res.locals.noAmbassador = camps.filter(c => !c.ambassador);

            res.render('users/edit');
        })
        .catch(next);
});

module.exports = router;
