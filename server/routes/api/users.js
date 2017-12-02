const express = require('express');
const router = express.Router();

router.use(requireLogin);

router.get('/', (req, res, next) => {
    // Determine query
    req.db.User.find(req.query.query || {})
        .select('email age grade phoneNumber rank admin registeredDate profileImageName')
        .exec()
        .then(users => {
            return res.json(users);
        })
        .catch(next);
});

module.exports = router;