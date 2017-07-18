const express = require('express');
const router = express.Router();

router.use(requireAdmin);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('administration/index');
});

router.get('/fundraising', (req, res, next) => {
    req.db.Funds.find()
        .exec()
        .then(fundsList => {
            res.locals.fundsList = fundsList;
            res.render('administration/fundraising');
        })
        .catch(next);
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
            const message = "<h3>Your account has just been verified by an Administrator!</h3><p>You can now use the services on the KidsTales web app.</p>";
            sendEmail(user.email, "You've Been Verified", message);
            req.flash('success', `Successfully verified and emailed ${user.name.full}.`);
            res.redirect('/administration/unverified');
        })
        .catch(next);
});

module.exports = router;
