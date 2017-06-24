const express = require('express');
const router = express.Router();

router.use(requireVerified);

/* GET home page. */
router.get('/', (req, res, next) => {
    req.db.Location.find()
        .exec()
        .then(locations => {
            res.locals.locations = locations;
            res.render('locations/index');
        })
        .catch(next);
});

router.get('/:locationId', (req, res, next) => {
    req.db.Location.findById(req.params.locationId)
        .exec()
        .then(location => {
            if (!location) throw new Error('Location does not exist!');
            res.locals.location = location;
        
            return req.db.Camp.find({}).exec();
        }).then(camps => {
            res.locals.camps = camps;
            res.locals.activeCamps = camps.filter(c => c.active);
            res.locals.inactiveCamps = camps.filter(c => !c.active);
            
            res.render('locations/location');
        })
        .catch(next);
});

router.get('/:locationId/edit', requireAdmin, (req, res, next) => {
    req.db.Location.findById(req.params.locationId)
        .exec()
        .then(location => {
            if (!location) throw new Error('Location does not exist!');
            
            res.locals.location = location;
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
            
            return location.save();
        }).then(location => {
            req.flash('success', `Saved edits to location #{location.name}`);
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
            req.flash('success', `Deleted location and all camps at ${location.name}.`);
            res.redirect('/locations');
        })
        .catch(next);
});

router.post('/add', requireAdmin, (req, res, next) => {
    const name = req.body.name;
    const address = req.body.address;
    const description = req.body.description;

    const newLocation = new req.db.Location({
        name,
        address,
        description
    });

    newLocation.save()
        .then(l => {
            req.flash(`Added location ${l.name}`);
            res.redirect('/locations');
        })
        .catch(next);
});

module.exports = router;
