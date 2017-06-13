const express = require('express');
const router = express.Router();

router.use(requireAdmin);

/* GET home page. */
router.get('/', (req, res) => {
    res.render('administration/index');
});

module.exports = router;
