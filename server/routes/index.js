const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    res.render('index/index');
});

router.get('/setup', requireLogin, (req, res, next) => {
    if (req.user.accountStatus > 0) { req.flash('warning', 'You have already set up your account!'); res.redirect('/'); }

    res.locals.pageTitle = 'Setup';
    /* Get list of possible superiors (all non-Teachers), and locations */

    req.db.User.find({ rank: { $gt: 0 }, accountStatus: { $gt: 1 } }) // Greater than 0 because 0 means Teacher and greater than 1 for setup and verified
        .exec()
        .then(superiors => {
            res.locals.superiors = superiors;

            return req.db.Location.find();
        })
        .then(locations => {
            res.locals.locations = locations;

            res.render('index/setup');
        })
        .catch(next);
});

/* Set all new user data and set accountStatus to 1 */
router.post('/setup', requireLogin, (req, res, next) => {
    // Get all body values
    const phoneNumber = req.body.phoneNumber;
    const userType = req.body.userType;
    const locationId = req.body.locationId;
    const superiorId = req.body.superiorId;

    req.user.phoneNumber = phoneNumber;
    req.user.rank = parseInt(userType);
    if (locationId && locationId !== 'None') req.user.location = locationId;
    if (superiorId && superiorId !== 'None') req.user.superior = superiorId;
    req.user.accountStatus = 1;
    req.user.save().then(() => {
        req.flash('success', 'Successfully setup account!')
        res.redirect('/');
    })
    .catch(next);
});

router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
      req.flash('warning', 'You are already logged in!');
      return res.redirect('/');
    }

    res.redirect('/auth/google');
});

router.get('/logout', function(req, res){
    req.logout();
    //req.flash('info', 'Successful logout.');
    res.redirect('/');
});

module.exports = router;
