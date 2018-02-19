const express = require('express');
const router = express.Router();

router.use(requireAdmin);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.locals.pageTitle = 'Regions';

    req.db.Region.find()
        .populate('ambassador')
        .exec()
        .then(regions => {
            res.locals.regions = regions.filter(r => r.approved);
            res.locals.unapprovedRegions = regions.filter(r => !r.approved);

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
        approved: true,
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
            if (!region.approved) throw new Error('Region is not yet approved!');

            res.locals.region = region;
            res.render('regions/region');
        })
        .catch(next);
});

router.post('/:regionId/approve', (req, res, next) => {
    req.db.Region.update({ _id: req.params.regionId, approved: false }, { $set: { approved: true } })
        .exec()
        .then(region => {
            req.flash('success', `Approved region ${region.name}.`);
            res.redirect('back');
        })
        .catch(next);
});

router.post('/:regionId/deny', (req, res, next) => {
    req.db.Region.remove({ _id: req.params.regionId, approved: false })
        .exec()
        .then(region => {
            req.flash('success', `Denied region ${region.name}.`);
            res.redirect('back');
        })
        .catch(next);
});

module.exports = router;