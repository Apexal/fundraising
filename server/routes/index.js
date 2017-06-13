const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    res.render('index/index');
});

router.get('/about', (req, res) => {
    res.locals.pageTitle = 'About';
    res.render('index/about');
});

router.get('/setup', requireLogin, (req, res, next) => {
    res.locals.pageTitle = 'Setup';
    /* Get list of possible superiors (all non-Teachers), and locations */

    req.db.User.find({ rank: { $gt: 0 } }) // Greater than 0 because 0 means Teacher
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
