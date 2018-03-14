const express = require('express');
const router = express.Router();
const config = require('config');
const ObjectId = require('mongodb').ObjectID;
const slack = require('../modules/slack');

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
    const region = 0; //REPLACE WITH REGION OBJECT ID
    const user = {
        region,
        name: {
            full: sm['firstName'] + ' ' + sm['lastName'],
            first: sm['firstName'],
            last: sm['lastName']
        },
        application: {
            applying: false,
            rank: sm['rank'],
            recommender: sm['recommender'],
            why: sm['why'],
            updatedAt: sm['when']
        },
        verified: true
    }

    const matching = ['email', 'age', 'grade', 'phoneNumber', 'rank'];
    for(let i = 0; i < matching.length; i++) {
       user[matching[i]] = sm[matching[i]]; 
    }

    req.db.User.findOneAndUpdate({ email: sm['email'], verified: false }, user, { upsert: true, new: true, setDefaultsOnInsert: true })
        .exec()
        .then(user => {
            if (!user) throw new Error('No such user.');

            log(user, 'transfer', `Transfer ${user.name.full} as ${user.rank}.`);
            return user.save();
        })
        .then(user => {
            req.user = user;
            // Invite to slack
            return slack.inviteToTeam(req.user.name.first, req.user.email);
        })
        .then(data => {
            data = JSON.parse(data);

            if (data.ok) {
                return res.json({ success: true, message: "Successful transfer and slack invite" });
            } else if (data.error == "already_in_team") {
                return res.json({ success: true, message: "Transfered, they are already on Slack." });
            } else {
                throw new Error("Failed to invite to Slack.");
            }
        })
        .catch(next);
    
    // Send emails

});

module.exports = router;
