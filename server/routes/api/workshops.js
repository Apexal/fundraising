const express = require('express');
const router = express.Router();
const moment = require('moment');

router.use(requireLogin);

/* LIST all workshops (paginated) and allow filtering */
router.get('/', (req, res, next) => {
    req.db.Workshop.find()
        .select('region location startDate endDate dateAdded ambassador director teachers active')
        .populate('region')
        .populate('location', '-comments -region')
        .populate('ambassador', 'email age grade phoneNumber rank admin registeredDate profileImageName')
        .populate('director', 'email age grade phoneNumber rank admin registeredDate profileImageName')
        .populate('teachers', 'email age grade phoneNumber rank admin registeredDate profileImageName')
        .sort({ startDate: -1 })
        .then(workshops => {
            return res.json(workshops);
        })
        .catch(next);
});

// /events?start=2013-12-01&end=2014-01-12&_=1386054751381
router.get('/events', (req, res, next) => {
    const events = [];

    const start = moment(req.query.start).toDate();
    const end = moment(req.query.end).toDate();
    
    req.db.Workshop.find({ region: req.user.region })
        .sort({ startDate: -1 })
        .where('startDate').gte(start)
        .where('endDate').lte(end)
        .populate('location', 'name')
        .populate('director', 'id name')
        .populate('ambassador', 'id')
        .populate('teachers', 'id')
        .then(workshops => {
            workshops.forEach(w => {
                let bgColor = undefined;

                if (helpers.isInvolvedInWorkshop(w, req.user)) bgColor = 'green';
                if (!w.active) bgColor = 'grey';

                const event = {
                    title: w.location.name + (w.director ? ' | ' + w.director.name.full : ''),
                    start: w.startDate,
                    end: moment(w.endDate).endOf('day').toDate(),
                    url: w.active ? ('/workshops/' + w.id) : undefined,
                    backgroundColor: bgColor,
                    workshop: w
                };

                events.push(event);
            });

            return res.json(events);
        })
        .catch(next);
});

/* GET info on one workshop by its ID */
router.get('/:workshopId', (req, res, next) => {
    req.db.Workshop.findById(req.params.workshopId)
        .populate('location')
        .populate('ambassador')
        .populate('director')
        .populate('teachers')
        .exec()
        .then(workshop => {
            if (!workshop) throw new Error('Failed to find workshop. It may not exist.');

            res.locals.workshop = workshop;

            return req.db.Funds.find({ workshop: workshop._id })
                .populate('submittedBy')
                .sort('-dateAdded')
                .exec();
        }).then(funds => {
            const total = funds.reduce((a, b) => a + b.amount, 0);

            return res.json({workshop: res.locals.workshop, fundraising: { funds, total }});
        })
        .catch(next);
});

module.exports = router;