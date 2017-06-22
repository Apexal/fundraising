const express = require('express');
const router = express.Router();

router.use(requireAdmin);

/* GET home page. */
router.get('/', (req, res, next) => {
    
    res.render('administration/index');
});

router.get('/unverified', (req, res, next) => {
    req.db.User.find({ verified: false })
        .exec()
        .then(users => {
            res.locals.unverifiedUsers = users;

            res.render('administration/unverified');
        })
        .catch(next);
});

router.post('/verify/:id', (req, res, next) => {
    req.db.User.findById(req.params.id)
        .exec()
        .then(user => {
            user.verified = true;
            return user.save();
        })
        .then((user) => {
            req.flash('success', `Successfully verified ${user.name.full}.`);
            res.redirect('/administration/unverified');
        })
        .catch(next);
});

module.exports = router;
