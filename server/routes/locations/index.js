const express = require('express');
const router = express.Router();
const moment = require('moment');
const config = require('config');

router.use(requireLogin);

/* LIST all locations (paginated) and allow filtering */
router.get('/', (req, res, next) => {
    res.locals.pageTitle = 'Locations';

    const page = parseInt(req.query.page) || 1;
    if (page < 1) return res.redirect('/locations?page=1');

    const s = req.query.search;
    const query = {
        $or: [
            { name: { $regex: s, $options: 'i' } },
            { location: { $regex: s, $options: 'i' } },
            { description: { $regex: s, $options: 'i' } }
        ]
    };

    req.db.Location.paginate((s ? query : {}), { page, limit: 10, sort: { dateAdded: -1 } })
        .then(result => {
            res.locals.page = result.page;
            res.locals.pages = result.pages;
            res.locals.locations = result.docs;

            if (s) res.locals.search = s;

            res.render('locations/index');
        })
        .catch(next);
});

/* Show page with form for adding a new location */
router.get('/new', requireHigherUp, (req, res, next) => {
    res.locals.pageTitle = 'New Location';
    res.render('locations/new');
});

/* Add a new location (if allowed to) */
router.post('/new', requireHigherUp, (req, res, next) => {
    const name = req.body.name;
    const address = req.body.address;
    const description = req.body.description; // Optional
    const link = req.body.link; // Optional
    const imageUrl = req.body.imageUrl; // Optional

    const newLocation = new req.db.Location({
        name,
        address,
        description,
        link,
        imageUrl,
        dateAdded: new Date()
    });

    newLocation.save()
        .then(l => {
            req.flash(`New location ${l.name} added.`);
            res.redirect('/locations');
        })
        .catch(next);
});

router.get('/:locationId', (req, res, next) => {
    req.db.Location.findById(req.params.locationId)
        .populate('comments.author')
        .exec()
        .then(location => {
            if (!location) throw new Error('Location does not exist!');
            res.locals.location = location;
            
            res.locals.pageTitle = `Location ${location.name}`;
            res.locals.apiKey = config.get('googleAuth.apiKey');

            return location.getWorkshops();
        }).then(workshops => {
            res.locals.workshops = workshops;
            res.locals.activeWorkshops = workshops.filter(w => w.active);
            res.locals.inactiveWorkshops = workshops.filter(w => !w.active);
            
            res.render('locations/location');
        })
        .catch(next);
});

router.post('/:locationId/comment', (req, res, next) => {
    const comment = { author: req.user._id, content: req.body.comment, dateAdded: new Date() };

    req.db.Location.update({ _id: req.params.locationId }, { $push: { comments: comment } })
        .exec()
        .then(location => {
            req.flash('success', 'Added comment.');
            res.redirect('back');
        })
        .catch(next);
});

router.get('/:locationId/edit', requireAdmin, (req, res, next) => {
    req.db.Location.findById(req.params.locationId)
        .exec()
        .then(location => {
            if (!location) throw new Error('Location does not exist!');
            
            res.locals.location = location;
            res.locals.pageTitle = `Edit Location ${location.name}`;
            res.render('locations/edit');
        })
        .catch(next);
});

router.post('/:locationId/edit', requireAdmin, (req, res, next) => {
    req.db.Location.findById(req.params.locationId)
        .exec()
        .then(location => {
            if (!location) throw new Error('Location does not exist!');    
            
            location.name = req.body.name;
            location.address = req.body.address;
            location.description = req.body.description;
            location.link = req.body.link;
            location.imageUrl = req.body.imageUrl;

            return location.save();
        }).then(location => {
            req.flash('success', `Saved edits to location ${location.name}.`);
            res.redirect('/locations/' + location._id);
        })
        .catch(next);
});

router.post('/:locationId/delete', requireAdmin, (req, res, next) => {
    req.db.Location.findById(req.params.locationId)
        .exec()
        .then(location => {
            if (!location) throw new Error('Location does not exist!');
            
            return location.remove();
        })
        .then(location => {
            req.flash('success', `Deleted location and all Workshops at ${location.name}.`);
            res.redirect('/locations');
        })
        .catch(next);
});

module.exports = router;
