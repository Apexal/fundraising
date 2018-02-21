const express = require('express');
const router = express.Router();

router.use(requireLogin);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.locals.pageTitle = 'Volunteers';

    const page = parseInt(req.query.page) || 1;
    if (page < 1) return res.redirect('/users?page=1');

    const s = req.query.search;
    const query = {
        verified: true,
        region: req.user.region,
        $or: [
            { 'name.full': { $regex: s, $options: 'i' } },
            { email: { $regex: s, $options: 'i' } },
            { phoneNumber: { $regex: s, $options: 'i' } },
            { location: { $regex: s, $options: 'i' } }
        ]
    };

    req.db.User.paginate((s ? query : { region: req.user.region, verified: true }), { page, limit: 10, sort: { registeredDate: 1 } })
        .then(result => {
            res.locals.page = result.page;
            res.locals.pages = result.pages;
            res.locals.users = result.docs;

            if (s) res.locals.search = s;

            res.render('users/index');
        })
        .catch(next);
});

router.get('/:email', (req, res, next) => {
    req.db.User.findOne({ email: req.params.email, region: req.user.region, verified: true })
        .exec()
        .then(user => {
            if (!user) throw new Error('Failed to find user.');

            res.locals.targetUser = user;
            res.locals.pageTitle = `${user.rankName} ${user.name.full}`;

            return user.getWorkshops();
        })
        .then(workshops => {
            res.locals.activeWorkshops = workshops.filter(w => w.active);
            res.locals.inactiveWorkshops = workshops.filter(w => !w.active);
            return res.render('users/user');
        })
        .catch(next);
});

router.get('/:email/edit', requireAdmin, (req, res, next) => {
    if (req.params.email == req.user.email) return res.redirect('/profile');

    req.db.User.findOne({ email: req.params.email, region: req.user.region, verified: true })
        .exec()
        .then(user => {
            if (!user) throw new Error('Failed to find user.');

            res.locals.targetUser = user;
            res.locals.pageTitle = `Edit User ${user.name.full}`;
            return req.db.Workshop.find()
                .populate('location')
                .exec();
        })
        .then(workshops => {
            res.locals.workshops = workshops;
            res.locals.noDirector = workshops.filter(w => !w.director);
            res.locals.noAmbassador = workshops.filter(w => !w.ambassador);

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

    req.db.User.findOne({ email: req.params.email, region: req.user.region, verified: true })
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
            log(req.user, 'User Edit', `Edited profile of ${user.name.full}.`);

            req.flash('success', `Updated ${user.name.full}.`);
            res.redirect('/users/' + user.email);
        })
        .catch(next);
});

module.exports = router;
