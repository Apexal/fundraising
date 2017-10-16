const express = require('express');
const router = express.Router();
const config = require('../../config');

const verifyFromSlack = (req, res, next) => {
    if (req.body.token !== config.slack.commandToken) {
        res.status(401);
        return res.json({ error: 'Invalid token!' });
    }

    return next();
}

router.post('/', /*verifyFromSlack,*/ (req, res, next) => {
    console.log(JSON.parse(req.body.payload));
    res.end('It works!');
});

module.exports = router;