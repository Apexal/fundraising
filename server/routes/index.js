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

router.get('/setup', requireLogin, (req, res) => {
    res.locals.pageTitle = 'Setup';
    res.render('index/setup');
});

router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
      //req.flash('warning', 'You are already logged in!');
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
