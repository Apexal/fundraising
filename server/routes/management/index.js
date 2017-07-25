const express = require('express');
const router = express.Router();
const moment = require('moment');

router.use(requireVerified);

/* GET home page. */
router.get('/', (req, res, next) => {
    res.locals.pageTitle = 'Management';

    res.render('');
});

/* Accept an applicant */
router.post(['/accept', '/deny'], (req, res, next) => {
    req.db.User.findOne({ _id: req.query.userId, verified: false })
        .populate('application.superior')
        .exec()
        .then(applicant => {
            if (!applicant) throw new Error(`Failed to find unverified user with id ${req.query.userId}.`);

            req.applicant = applicant;

            return next();
        })
        .catch(next);
});

router.post('/accept', (req, res, next) => {
    req.applicant.rank = req.applicant.application.rank;
    req.applicant.verified = true;

    return req.applicant.save()
        .then(applicant => {
            sendEmail(applicant.email, 'Application Accepted', 'applicationAccepted', { firstName: applicant.name.first, rank: applicant.rank, superiorFullName: applicant.application.superior.name.full });

            req.flash('success', `You have successfully verified ${applicant.name.full} to be ${applicant.rank} under you.`);
            res.redirect('/');
        })
        .catch(next);
});

/* Deny an applicant */
router.post('/deny', (req, res, next) => {
    
    const oldSuperior = req.applicant.application.superior;
    req.applicant.application.superior = undefined;
    req.applicant.application.rank = undefined;

    return req.applicant.save()
        .then(applicant => {
            sendEmail(applicant.email, 'Application Denied', 'applicationDenied', { firstName: applicant.name.first, rank: applicant.rank, superiorFullName: oldSuperior.name.full });

            req.flash('danger', `You have denied ${applicant.name.full}'s application to be ${applicant.rank} under you. They have been notified.`);
            res.redirect('/');
        })
        .catch(next);
});

module.exports = router;
