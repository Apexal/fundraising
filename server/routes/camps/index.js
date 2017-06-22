const express = require('express');
const router = express.Router();
const moment = require('moment');

router.use(requireVerified);

/* GET home page. */
router.get('/', (req, res, next) => {
    req.db.Camp.find()
        .populate('location')
        .populate('ambassador')
        .populate('director')
        .populate('teachers')
        .exec()
        .then(camps => {
            res.locals.camps = camps;
            res.locals.activeCamps = camps.filter(c => c.active);
            res.locals.pastCamps = camps.filter(c => moment(c.endDate).isBefore(moment()))


            return req.db.Location.find().exec();
        })
        .then(locations => {
            res.locals.openLocations = locations;
            res.render('camps/index');
        })
        .catch(next);
});

router.post('/schedule', (req, res, next) => {
    const locationId = req.body.locationId;
    const info = req.body.info;
    const startDate = moment(req.body.startDate, "YYYY-MM-DD");
    const endDate = moment(req.body.endDate, "YYYY-MM-DD");

    // Validate
    if (startDate.isSame(endDate, 'day') || endDate.isBefore(startDate)) return next(new Error('Invalid dates! Make sure the end date comes after the start.'));

    const newCamp = new req.db.Camp({
        location: locationId,
        info,
        startDate: startDate.toDate(),
        endDate: endDate.toDate()
    });

    newCamp.save().then((camp) => {
        req.flash('success', `Scheduled new camp on ${startDate}.`);
        res.redirect(`/camps/${camp._id}`);
    }).catch(next);
});

router.all(['/:campId', '/:campId/*'], (req, res, next) => {
    req.db.Camp.findById(req.params.campId)
        .populate('location')
        .populate('ambassador')
        .populate('director')
        .populate('teachers')
        .exec()
        .then(camp => {
            if (!camp) throw new Error('Failed to find camp. It may not exist.');
            req.camp = camp;
            if (!req.camp.active) req.flash('error', 'This camp has ended the following saved information and fundraising data cannot be edited afterwards.');

            return req.db.Funds.find({ camp: req.camp._id })
                .limit(10)
                .populate('submittedBy')
                .exec()
        })
        .then(fundsList => {
            req.recentFunds = fundsList;
            next();
        })
        .catch(next);
});

router.get('/:campId', (req, res, next) => {
    // CHECK IF NEEDS TO ASSING TO CAMP
    res.locals.recentFunds = req.recentFunds;
    res.locals.apiKey = require('../../config').googleAuth.apiKey;
    res.locals.ofUser = (req.user.admin); // If its the teacher or program director's location

    if (req.query.assign) {
        const rank = req.query.assign;

        if(rank === 'teacher') {
            if (req.camp.teachers.map(t => t._id).includes(req.user._id)) {
                req.flash('error', 'You are already a teacher!');
                return res.redirect('/camps/' + req.camp._id);
            }
            
            req.camp.teachers.push(req.user._id);
        } else if (rank == 'director') {
            req.camp.director = req.user._id;
        } else if (rank == 'ambassador') {
            req.camp.ambassador = req.user._id;
        } else {
            req.flash('error', 'Invalid rank to assign!');
        }

        return req.camp.save()
            .then(camp => {
                req.flash('success', 'You have become ' + rank + '.');
                res.redirect('/camps/' + camp._id);
            })
            .catch(next);
    } else if (req.query.unassign) {
        // For unassign make sure they are the rank before removing it
        const rank = req.query.unassign;

        if(rank === 'teacher') {
            req.camp.teachers = req.camp.teachers.filter(t => t._id != req.user._id);
        } else if (rank == 'director' && req.camp.director._id == req.user._id) {
            req.camp.director = undefined;
        } else if (rank == 'ambassador' && req.camp.ambassador._id == req.user._id) {
            req.camp.ambassador = undefined;
        } else {
            req.flash('error', 'Invalid rank to unassign!');
        }

        return req.camp.save()
            .then(camp => {
                req.flash('success', 'You are no longer ' + rank + '.');
                res.redirect("/camps/" + camp._id);
            })
            .catch(next);
    }

    res.locals.camp = req.camp;
    return res.render('camps/camp');
});

router.get('/:campId/fundraising', (req, res, next) => {
    const campId = req.params.campId;

    // Make sure has permission to view
    // User is Administrator OR Ambassador of camp OR Program Director of camp OR Teacher of camp
    
    if (1 == 1/*req.user.admin || req.user.currentCamps.includes(campId) || req.user.currentCamp == req.camp*/) {
        res.locals.camp = req.camp;
        res.locals.recentFunds = req.recentFunds;

        req.db.Funds.find({ camp: req.camp._id })
            .populate('submittedBy')
            .sort('-dateAdded')
            .exec()
            .then(fundsList => {
                res.locals.funds = fundsList;
                
                let total = 0;
                fundsList.forEach(f => total += f.amount);
                res.locals.total = total;
                res.render('camps/fundraising/index');
            })
            .catch(next);
    } else {
        return next(new Error('You don\'t have permission to view this camp\'s finances.'));
    }
});

router.post('/:campId/addfunds', (req, res, next) => {
    const campId = req.camp._id;
    const submittedById = req.user._id;
    const amount = req.body.amount;
    const method = req.body.method;
    const form = req.body.form;
    const source = req.body.source;

    const newFunds = new req.db.Funds({
        camp: campId,
        submittedBy: submittedById,
        amount,
        method,
        form,
        source
    });

    newFunds.save().then(() => {
        req.flash('success', 'Added new funds for camp.');
        res.redirect(`/camps/${req.camp._id}/fundraising`);
    }).catch(next);
});

module.exports = router;
