const express = require('express');
const router = express.Router();
const config = require('config');

/* Validate request */
router.use((req, res, next) => {
    if (req.body.secret == config.get('secret')) return next();
  
    res.status(500);
    res.json({ error: 'Invalid secret.' });
});

/* Transfer from survey monkey to website */
router.post('/transfer', (req, res, next) => {
    // Create user
    const sm = req.body;
    const region = 0; //???
    const user = {
        region,
        name: {
            full: sm['firstName'] + ' ' + sm['lastName'],
            first: sm['firstName'],
            last: sm['lastName']
        },
        application: {
            applying: true,
            rank: sm['rank'],
            recommender: sm['recommender'],
            why: sm['why'],
            updatedAt: sm['when']
        },
        verified: false
    }

    ['email', 'age', 'grade', 'phoneNumber'].forEach(v => user[v] = sm[v]);
    // Invite to slack
    // Send emails

    res.json(user);
});

module.exports = router;
