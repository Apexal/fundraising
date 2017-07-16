const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    res.locals.latestNews = "No latest news...";
    res.render('index/index');
});

router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
      req.flash('warning', 'You are already logged in!');
      return res.redirect('/');
    }

    res.redirect('/auth/google');
});

router.get('/loginas', requireAdmin, (req, res, next) => {
    if (!req.query.email) return next(new Error('Invalid user email.'));

    req.db.User.findOne({ email: req.query.email })
        .exec()
        .then(user => {
            return req.logIn(user, err => {
                if (err) throw err;

                req.flash('info', `Successfully logged in as ${req.user.name.full}`);
                res.redirect('/');
            });
        })
        .catch(next);
});

router.get('/logout', function(req, res){
    req.logout();
    req.flash('info', 'Successful logout.');
    res.redirect('/');
});

module.exports = router;
