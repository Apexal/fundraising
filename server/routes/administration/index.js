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

module.exports = router;
