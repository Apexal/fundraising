const express = require('express');
const router = express.Router();

router.use(requireVerified);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.locals.pageTitle = 'Users';

    req.db.User.find({ verified: true })
        .exec()
        .then(users => {
            res.locals.users = users;
            
            if (req.query.search) {
                const s = req.query.search;
                // SEARCH
                res.locals.users = users.filter(user => {
                    if (user.name.full.includes(s)) return true;
                    if (user.email.includes(s)) return true;
                    if (user.phoneNumber.includes(s)) return true;
                    if (user.location.includes(s)) return true;

                    return false;
                });

                res.locals.search = s;
            }

            res.render('users/index');
        })
        .catch(next);
});

router.get('/:email', (req, res, next) => {
    req.db.User.findOne({ email: req.params.email })
        .exec()
        .then(user => {
            if (!user) return next(new Error('Failed to find user.'));

            res.locals.targetUser = user;
            res.locals.pageTitle = `User ${user.name.full}`;
            return user.findCamps();
        }).then(camps => {
            res.locals.camps = camps;
            res.render('users/user');
        })
        .catch(next);
});

router.get('/:email/edit', requireAdmin, (req, res, next) => {
    if (req.params.email == req.user.email) return res.redirect('/setup');

    req.db.User.findOne({ email: req.params.email })
        .exec()
        .then(user => {
            if (!user) throw new Error('Failed to find user.');

            res.locals.targetUser = user;
            res.locals.pageTitle = `Edit User ${user.name.full}`;
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

router.post('/:email/edit', requireAdmin, (req, res, next) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const phoneNumber = req.body.phoneNumber;
    const verified = !!req.body.verified;
    const admin = !!req.body.admin;

    if (req.params.email == req.user.email) return next(new Error('You can\'t edit yourself!'));

    req.db.User.findOne({ email: req.params.email })
        .exec()
        .then(user => {
            user.name.first = firstName;
            user.name.last = lastName;
            user.phoneNumber = phoneNumber;
            user.verified = verified;
            user.admin = admin;

            return user.save();
        })
        .then(user => {
            req.flash('success', `Updated ${user.name.full}.`);
            res.redirect('/users/' + user.email);
        })
        .catch(next);
});

module.exports = router;
