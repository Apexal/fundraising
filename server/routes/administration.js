const express = require('express');
const router = express.Router();

router.use(requireAdmin);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.locals.pageTitle = 'Administration';
    res.render('administration/index');
});

router.get('/activities', (req, res, next) => {
    res.locals.pageTitle = 'User Activity';
    
    const page = parseInt(req.query.page) || 1;
    if (page < 1) return res.redirect('/administration/activities?page=1');

    const s = req.query.search;
    const query = {
        $or: [
            { action: s },
            { description: { $regex: s, $options: 'i' } }
        ]
    };

    req.db.Activity.paginate((s ? query : {}), { page, limit: 100, sort: { dateAdded: -1 }, populate: ['user'] })
        .then(result => {
            res.locals.page = result.page;
            res.locals.pages = result.pages;
            res.locals.activities = result.docs;

            if (s) res.locals.search = s;

            res.render('administration/activities');
        })
        .catch(next);
});

router.get('/fundraising', (req, res, next) => {
    req.db.Funds.find()
        .exec()
        .then(fundsList => {
            res.locals.fundsList = fundsList;
            
            let total = 0;
            fundsList.forEach(f => total += f.amount);
            res.locals.total = total;

            res.locals.pageTitle = 'Overall Fundraising';
            res.render('administration/fundraising');
        })
        .catch(next);
});

module.exports = router;
