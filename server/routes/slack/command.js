const express = require('express');
const router = express.Router();
const config = require('config');

const verifyFromSlack = (req, res, next) => {
    if (req.body.token !== config.get('slack.commandToken')) {
        res.status(401);
        return res.json({ error: 'Invalid token!' });
    }

    return next();
}

router.post('/', verifyFromSlack, (req, res, next) => {
    console.log(req.body);
    res.end('It works!');
});

module.exports = router;