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
            const rank = req.body.rank;
            if(rank < 0 || rank > 3) return next(new Error('Invalid rank!'));
            
            user.rank = rank;
            return user.save();
        })
        .then(() => {
            req.flash('success', 'Successfully verified user.');
            res.redirect('/unverified');
        })
        .catch(next);
});

module.exports = router;
