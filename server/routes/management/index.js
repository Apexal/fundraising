const express = require('express');
const router = express.Router();
const moment = require('moment');

router.use(requireVerified);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.locals.pageTitle = `${req.user.rankName} Management`;

    const done = () => res.render(`${req.user.rank}s/index`);

    if (req.user.rank == 'teacher') {
        return done();
    } else if (req.user.rank == 'director') {
        return req.db.User.find({ superior: req.user._id, verified: false })
            .exec()
            .then(applicants => {
                res.locals.applicants = applicants;

                return req.db.User.find({ rank: 'teacher', verified: true, superior: req.user._id })
                    .exec();
            })
            .then(teachers => {
                res.locals.teachers = teachers;
            })
            .then(done)
            .catch(next);
    } else {
        return done()
    }    
});

/* Send custom invitation email to invited */
router.post('/invite', (req, res, next) => {
    const email = req.body.email;
    sendEmail(email, 'Kids Tales Invite', 'teacherInvite', { superiorFullName: req.user.name.full });

    req.flash('success', `An invitation has been sent to ${email}.`);
    res.redirect('/management/applicants');
});

/* List all applicants and allow invites */
router.get('/applicants', (req, res, next) => {
    if (req.user.rank == 'teacher') {
        req.flash('warning', 'Teachers cannot have applicants.');
        return res.redirect('/management');
    }

    res.locals.pageTitle = `Your Applicants`;

    req.db.User.find({ superior: req.user._id, verified: false })
        .sort('application.updatedAt')
        .exec()
        .then(applicants => {
            res.locals.applicants = applicants;

            res.render('management/applicants')
        })
        .catch(next);
});

/* Display the specific application of one user and offer actions */
router.get('/applicants/:email', (req, res, next) => {
    if (req.user.rank == 'teacher') {
        req.flash('warning', 'Teachers cannot have applicants.');
        return res.redirect('/management');
    }
    
    req.db.User.findOne({ email: req.params.email, superior: req.user._id, verified: false })
        .exec()
        .then(applicant => {
            if (!applicant) throw new Error('Failed to find applicant.');

            res.locals.pageTitle = `Applicant ${applicant.name.full}`;
            res.locals.applicant = applicant;

            res.render('management/applicant');
        })
        .catch(next);
});

/* Get the user about to be denied/accepted */
router.post(['/applicants/:email/accept', '/applicants/:email/deny'], (req, res, next) => {
    req.db.User.findOne({ email: req.params.email, verified: false })
        .populate('superior')
        .exec()
        .then(applicant => {
            if (!applicant) throw new Error(`Failed to find unverified user with email ${req.params.email}.`);

            req.applicant = applicant;

            return next();
        })
        .catch(next);
});

/* Accept an applicant */
router.post('/applicants/:email/accept', (req, res, next) => {
    req.applicant.verified = true;

    return req.applicant.save()
        .then(applicant => {
            sendEmail(applicant.email, 'Application Accepted', 'applicationAccepted', { firstName: applicant.name.first, rank: applicant.rank, superiorFullName: applicant.superior.name.full });

            req.flash('success', `You have successfully verified ${applicant.name.full} to be ${applicant.rank} under you.`);
            res.redirect('/management/applicants');
        })
        .catch(next);
});

/* Deny an applicant */
router.post('/applicants/:email/deny', (req, res, next) => {
    
    const oldSuperior = req.applicant.superior;
    req.applicant.superior = undefined;
    
    const oldRank = req.applicant.rank;
    req.applicant.rank = undefined;

    return req.applicant.save()
        .then(applicant => {
            sendEmail(applicant.email, 'Application Denied', 'applicationDenied', { firstName: applicant.name.first, rank: applicant.rank, superiorFullName: oldSuperior.name.full });

            req.flash('danger', `You have denied ${applicant.name.full}'s application to be ${oldRank} under you. They have been notified.`);
            res.redirect('/management/applicants');
        })
        .catch(next);
});

module.exports = router;
