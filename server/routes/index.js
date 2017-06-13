const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index/index');
});

router.get('/about', (req, res, next) => {
    res.locals.pageTitle = 'About';
    res.render('index/about');
});

module.exports = router;
