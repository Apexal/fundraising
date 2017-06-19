const express = require('express');
const router = express.Router();

router.use(requireVerified);

router.use((req, res, next) => {
    req.db.User.find({ rank: { $gt: 0 }, accountStatus: { $gt: 1 } }) // Greater than 0 because 0 means Teacher and greater than 1 for setup and verified
        .exec()
        .then(superiors => {
            res.locals.superiors = superiors;

            return req.db.Location.find().populate('director').populate('ambassador').exec();
        })
        .then(locations => {
            res.locals.locations = locations;
            res.locals.locationsNoAmbassador = locations.filter(l => { return l.ambassador == undefined; });
            res.locals.locationsNoDirector = locations.filter(l => { return l.director == undefined; });
            next();
        })
        .catch(next);
});

/* GET home page. */
router.get('/', requireLogin, (req, res, next) => {
    if (req.user.accountStatus > 1) { req.flash('warning', 'You have already set up your account!'); res.redirect('/'); }

    res.locals.pageTitle = 'Setup';
    /* Get list of possible superiors (all non-Teachers), and locations */

    const ranks = ['teacher', 'programdirector', 'ambassador', 'administrator'];
    const rank = ranks.indexOf(req.query.rank) > -1 ? req.query.rank : 'index'; 
    
    res.render('setup/' + rank);
});

router.post('/', (req, res, next) => {
    // Get all body values

    const phoneNumber = req.body.phoneNumber;
    const rank = req.body.rank;

    if(!phoneNumber) return next(new Error('Invalid phone number.'));
    req.user.phoneNumber = phoneNumber;

    req.user.setup = true;
    return req.user.save().then(() => {
        req.flash('success', `Successfully setup ${rank} account!`)
        res.redirect('/');
    })
    .catch(next);
});

module.exports = router;
