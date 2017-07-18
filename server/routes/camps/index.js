const express = require('express');
const router = express.Router();
const moment = require('moment');
const request = require('request-promise');

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
            res.locals.inactiveCamps = camps.filter(c => !c.active);

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
        endDate: endDate.toDate(),
        dateAdded: new Date()
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

            if (!req.camp.active) req.flash('warning', 'This camp is inactive so the following saved information and fundraising data cannot be edited.');

            return req.db.Funds.find({ camp: req.camp._id })
                .limit(10)
                .sort('-dateAdded')
                .populate('submittedBy')
                .exec()
        })
        .then(fundsList => {
            req.recentFunds = fundsList;

            return req.camp.findApplicants();
        }).then(applicants => {
            req.camp.applicants = applicants;

            next();
        })
        .catch(next);
});

router.post('/:campId/delete', requireAdmin, (req, res, next) => {
    req.camp.remove()
        .then(camp => {
            req.flash('success', `Deleted camp and funds at ${camp.location.name}.`);
            res.redirect('/camps');
        })
        .catch(next);
});

const hasRank = (camp, user) => {
    return camp.teachers.map(t => t._id).includes(user._id) || (!!camp.director && camp.director._id == user.id) || (!!camp.ambassador && camp.ambassador._id == user.id);
}

router.get('/:campId', (req, res, next) => {
    // CHECK IF NEEDS TO ASSING TO CAMP
    res.locals.recentFunds = req.recentFunds;
    res.locals.apiKey = require('../../config').googleAuth.apiKey;
    res.locals.ofUser = (req.user.admin); // If its the teacher or program director's location

    if (req.query.assign) {
        if (!req.camp.active) return next(new Error('This camp in inactive.'));

        const rank = req.query.assign;
        return helpers.assignRank(req.camp, req.user, rank)
            .then(req.camp.save)
            .then(camp => {
                req.flash('success', 'You have become ' + rank + '.');

                // Send emails
                try {
                    if (rank === 'teacher') {
                        sendEmail(req.camp.director.email, 'New Teacher', `<b><a href='http://localhost:3000/users/${req.user.email}'>${req.user.name.full}</a></b> assigned themselves as a <b>Teacher</b> to <b><a href='http://localhost:3000/camps/${req.camp._id}'>Camp ${req.camp.location.name}</a></b> which you are the Program Director of.`);
                    } else if (rank === 'director') {
                        sendEmail(req.camp.ambassador.email, 'New Director', `<b><a href='http://localhost:3000/users/${req.user.email}'>${req.user.name.full}</a></b> assigned themselves as <b>Program Director</b> to <b><a href='http://localhost:3000/camps/${req.camp._id}'>Camp ${req.camp.location.name}</a></b> which you are the Ambassador of.`);
                    }
                } catch(err) {

                }

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

                // Send emails
                try {
                    if (rank === 'teacher') {
                        sendEmail(req.camp.director.email, 'Teacher Left', `<b><a href='http://localhost:3000/users/${req.user.email}'>${req.user.name.full}</a></b> is no longer a <b>Teacher</b> at <b><a href='http://localhost:3000/camps/${req.camp._id}'>Camp ${req.camp.location.name}</a></b> which you are the Program Director of.`);
                    } else if (rank === 'director') {
                        sendEmail(req.camp.ambassador.email, 'Director Left', `<b><a href='http://localhost:3000/users/${req.user.email}'>${req.user.name.full}</a></b> is no longer <b>Program Director</b> of <b><a href='http://localhost:3000/camps/${req.camp._id}'>Camp ${req.camp.location.name}</a></b> which you are the Ambassador of.`);
                    }
                } catch(err) {

                }

                res.redirect('/camps/' + camp._id);
            })
            .catch(next);
    }

    res.locals.camp = req.camp;
    return res.render('camps/camp');
});

router.get('/:campId/applicants', (req, res, next) => {
    // Ensure admin, ambassador, or program director
    if (!helpers.isHigherUp(req.camp, req.user)) {
        req.flash('warning', 'Only admininstrators, ambassadors, and program directors can view applicants.');
        return res.redirect('/camps/' + req.camp._id);
    }
    
    res.locals.camp = req.camp;
    return res.render('camps/applicants');
});

router.post('/:campId/verify/:email', (req, res, next) => {
    if (!helpers.isHigherUp(req.camp, req.user)) {
        req.flash('warning', 'Only admininstrators, ambassadors, and program directors can verify applicants.');
        return res.redirect('/camps/' + req.camp._id);
    }

    req.db.User.findOne({ email: req.params.email })
        .exec()
        .then(applicant => {
            if (!applicant) throw new Error('Applicant does not exist!');
            req.applicant = applicant;

            applicant.verified = true;
            
            return applicant.save()
                .then(helpers.assignRank(req.camp, applicant, applicant.application.role));
        }).then(applicant => {
            sendEmail(applicant.email, 'Application Accepted', `<h2>Congratulations!</h2><p>Your application to become a Kids Tales <b>${applicant.application.role}</b> for <b>Camp ${req.camp.location.name}</b> has been accepted.`);

            try {
                if (applicant.application.role === 'teacher') {
                    sendEmail(req.camp.director.email, 'New Teacher', `<b><a href='http://localhost:3000/users/${req.user.email}'>${req.user.name.full}</a></b>'s application for <b>Teacher</b> to <b><a href='http://localhost:3000/camps/${req.camp._id}'>Camp ${req.camp.location.name}</a></b> (which you are the Program Director of) has been accepted.`);
                } else if (applicant.application.role === 'director') {
                    sendEmail(req.camp.ambassador.email, 'New Director', `<b><a href='http://localhost:3000/users/${req.user.email}'>${req.user.name.full}</a></b>'s application for <b>Program Director</b> to <b><a href='http://localhost:3000/camps/${req.camp._id}'>Camp ${req.camp.location.name}</a></b> (which you are the Ambassador of) has been accepted.`);
                }
            } catch(err) {}

            req.flash('success', `${req.applicant.name.full} has been verified and assigned as ${req.applicant.application.role}.`)
            res.redirect('/camps/' + req.camp._id + '/applicants');
        })
        .catch(next);
});

router.get('/:campId/edit', requireAdmin, (req, res, next) => {
    res.locals.camp = req.camp;

    req.db.Location.find()
        .exec()
        .then(locations => {
            res.locals.openLocations = locations;
            res.render('camps/edit');
        })
        .catch(next);
});

router.post('/:campId/edit', requireAdmin, (req, res, next) => {
    req.camp.location = req.body.locationId;
    req.camp.startDate = moment(req.body.startDate, "YYYY-MM-DD").toDate();
    req.camp.endDate = moment(req.body.endDate, "YYYY-MM-DD").toDate();
    req.camp.info = req.body.info;

    req.camp.save()
        .then(camp => {
            req.flash('success', `Saved edits to camp.`);
            res.redirect('/camps/' + camp._id);
        })
        .catch(next);
});

router.get('/:campId/fundraising', (req, res, next) => {
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
                        
            // For charts
            res.locals.fundsTypes = {};
            ['Cash', 'Check', 'Other'].forEach(t => {
                let tTotal = 0;
                fundsList.filter(f => f.form == t).forEach(f => tTotal += f.amount);

                res.locals.fundsTypes[t] = tTotal;
            });

            return req.camp.findFundraisingGoals();
        }).then(fundraisingGoals => {
            req.camp.fundraisingGoals = fundraisingGoals;
            res.locals.camp.fundraisingGoals = fundraisingGoals;

            res.render('camps/fundraising/index');
        })
        .catch(next);

});

router.post('/:campId/addfunds', (req, res, next) => {
    // Check permissions
    if (!req.user.admin && !helpers.getRankFromCamp(req.camp, req.user)) return next(new Error('You must be an admin and/or involved in the camp to add this.'));

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
        source,
        dateAdded: new Date()
    });

    newFunds.save()
        .then(funds => {
        // Email program director
        const message = `<h3>Teacher ${req.user.name.full} Added Funds to Camp ${req.camp.location.name}</h3><p>${req.user.name.first} just added <b>$${amount} in ${form}</b> by <b>${method}</b></p><a href="http://localhost:3000/camps/${req.camp._id}/fundraising">View Fundraising</a>`;

        if (req.camp.ambassador) sendEmail(req.camp.ambassador.email, "New Funds", message);
        if (req.camp.director) sendEmail(req.camp.director.email, "New Funds", message);

        const text = `<http://localhost:3000/users/${req.user.email}|${req.user.name.full}> added **$${amount}** in ${form} to <http://localhost:3000/camps/${campId}|Camp ${funds.camp}>`;
        return request({ method: 'POST', uri: require('../../config').slack.webhookUrl, body: { mrkdwn: true, text }, json: true });
    }).then(body => {
        req.flash('success', 'Added new funds for camp.');
        res.redirect(`/camps/${req.camp._id}/fundraising`);
    }).catch(next);
});

router.post('/:campId/removefunds', (req, res, next) => {
    req.db.Funds.findById(req.query.fundsId)
        .exec()
        .then(funds => {
            if (!funds) throw new Error('Funds does not exist.');
            if (funds.camp != req.camp.id) throw new Error('Those funds are not associated with that camp!');

            // Check permissions
            if (!req.user.admin) {
                const rank = helpers.getRankFromCamp(req.camp, req.user);
                if (!rank || (rank == 'teacher' && !funds.submittedBy.equals(req.user.id))) throw new Error('You must be an admin, the ambassador, director, or the teacher who added the funds to remove this.');
            }

            return funds.remove();
        })
        .then(funds => {
            req.flash('success', 'Removed funds for camp.');
            res.redirect('/camps/' + req.camp._id + '/fundraising');
        })
        .catch(next);
});

/* FUNDRAISING GOALS */
router.post('/:campId/addfundraisinggoal', (req, res, next) => {
    if (!req.user.admin && !helpers.getRankFromCamp(req.camp, req.user)) return next(new Error('You must be an admin and/or involved in the camp to add this.'));

    const campId = req.camp._id;
    const submittedById = req.user._id;
    const amount = req.body.amount;
    const deadline = moment(req.body.deadline);

    // Validate
    if (deadline.isBefore(moment())) return next(new Error('Deadline must be in the future!'));

    const newFundraisingGoal = new req.db.FundraisingGoal({
        camp: campId,
        submittedBy: submittedById,
        amount,
        deadline,
        dateAdded: new Date()
    });

    newFundraisingGoal.save()
        .then(goal => {
        // Email program director
        const message = `<h3>Teacher ${req.user.name.full} Added Fundraising Goal to Camp ${req.camp.location.name}</h3><a href="http://localhost:3000/camps/${req.camp._id}/fundraising">View Fundraising</a>`;

        if (req.camp.ambassador) sendEmail(req.camp.ambassador.email, "New Fundraising Goal", message);
        if (req.camp.director) sendEmail(req.camp.director.email, "New Fundraising Goal", message);

        const text = `<http://localhost:3000/users/${req.user.email}|${req.user.name.full}> added **$${amount}** in ${form} to <http://localhost:3000/camps/${campId}|Camp ${funds.camp}>`;
        return request({ method: 'POST', uri: require('../../config').slack.webhookUrl, body: { mrkdwn: true, text }, json: true });
    }).then(body => {
        req.flash('success', 'Added new fundraising goal for camp.');
        res.redirect(`/camps/${req.camp._id}/fundraising`);
    }).catch(next);
});

router.post('/:campId/removefundraisinggoal', (req, res, next) => {
    req.db.FundraisingGoal.findById(req.query.fundraisingGoalId)
        .exec()
        .then(goal => {
            if (!goal) throw new Error('Fundraising goal does not exist.');
            if (goal.camp != req.camp.id) throw new Error('That goal is not associated with that camp!');

            // Check permissions
            if (!req.user.admin) {
                const rank = helpers.getRankFromCamp(req.camp, req.user);
                if (!rank || (rank == 'teacher' && !goal.submittedBy.equals(req.user.id))) throw new Error('You must be an admin, the ambassador, director, or the teacher who added the goal to remove this.');
            }

            return goal.remove();
        })
        .then(funds => {
            req.flash('success', 'Removed fundraising goal for camp.');
            res.redirect('/camps/' + req.camp._id + '/fundraising');
        })
        .catch(next);
});

module.exports = router;
