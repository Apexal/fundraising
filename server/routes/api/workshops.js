const express = require('express');
const router = express.Router();
const moment = require('moment');

/* LIST all workshops (paginated) and allow filtering */
router.get('/', (req, res, next) => {
    req.db.Workshop.find()
        .select('region location startDate endDate dateAdded ambassador director teachers active')
        .populate('region')
        .populate('location', '-comments -region')
        .populate('ambassador', 'email age grade phoneNumber rank admin registeredDate profileImageName')
        .populate('director', 'email age grade phoneNumber rank admin registeredDate profileImageName')
        .populate('teachers', 'email age grade phoneNumber rank admin registeredDate profileImageName')
        .sort({ startDate: -1 })
        .then(workshops => {
            return res.json(workshops);
        })
        .catch(next);
});

module.exports = router;