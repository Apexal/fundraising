const express = require('express');
const router = express.Router();

router.use(requireAdmin);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.locals.pageTitle = 'Regions';

    req.db.Region.find()
        .exec()
        .then(regions => {
            res.locals.regions = regions;
            res.render('regions/index');
        })
        .catch(next);
});

router.get('/new', (req, res, next) => {
    res.locals.pageTitle = 'New Region';
    res.render('regions/new');
});

router.post('/new', (req, res, next) => {
    const name = req.body.name;
    const description = req.body.description;

    const newRegion = new req.db.Region({
        name,
        description,
        dateAdded: new Date()
    });

    newRegion.save()
        .then(region => {
            log(req.user, 'new_region', `${req.user.name.full} (${req.user.email}) created new region ${region.name}.`);

            req.flash('success', `Added Region ${region.name}.`);
            res.redirect('/regions');
        })
        .catch(next);
});

router.get('/:regionId', (req, res, next) => {
    res.locals.pageTitle = 'Region';

    req.db.Region.findById(req.params.regionId)
        .exec()
        .then(region => {
            if (!region) throw new Error('Region doesn\'t exist!');

            res.locals.region = region;
            res.render('regions/region');
        })
        .catch(next);
});

module.exports = router;