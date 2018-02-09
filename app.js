const express = require('express');
const path = require('path');
const compression = require('compression');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const moment = require('moment');
const recursiveReadSync = require('recursive-readdir-sync');
const session = require('express-session');
const config = require('config');
const packageInfo = require('./package.json');
const mongodb = require('./server/db');
const slack = require('./server/modules/slack');

const debug = require('debug')('http');

const app = express();
const passport = require('./server/modules/auth.js')(mongodb.User);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.locals.basedir = path.join(__dirname, 'views');

app.use(favicon(path.join(__dirname, 'client/public', 'favicon.png')));
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: config.get('secret'),
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 5 }
}));
app.use(require('flash')());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'client/public')));


// These two will be GLOBAL to all js files
// View helper methods
helpers = require('./server/modules/helpers.js');
sendEmail = require('./server/modules/email.js');

// Make helpers available in views
app.locals.helpers = helpers;
log = helpers.logActivity

// ALL REQUESTS PASS THROUGH HERE FIRST
app.locals.moment = moment;
app.locals.defaultTitle = 'Kids Tales';//packageInfo.name;
app.locals.appDescription = packageInfo.description;
app.use((req, res, next) => {
    res.locals.pageTitle = app.locals.defaultTitle; // Default page title is passed down
    res.locals.pagePath = req.path; // To access in views and helpers
    req.db = mongodb;

    req.isAPI = req.path.startsWith('/api');

    if (req.user) res.locals.user = req.user; // To access in views

    res.locals.env = config.util.getEnv('NODE_ENV'); // To let views know if in dev or prod
    
    // For convenience
    res.locals.loggedIn = req.isAuthenticated();
    res.locals.applicantCount = req.session.applicantCount;

    if (req.user) {
        return req.user.getWorkshops()
            .then(involvements => {
                res.locals.involvements = involvements;
                return next();
            })
            .catch(next);
    } else {
        return next();
    }
});

// To be used by routes
// When used as a middleware on a route, if user is not logged it redirects home
requireLogin = function(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();
    req.session.redirect = req.originalUrl;
    req.flash('error', 'You must be logged in to view that page.');
    return res.redirect('/');
}

requireNotLogin = function(req, res, next) {
    if (!req.isAuthenticated()) return next();
    return next(new Error('You are logged in!'));
}

requireHigherUp = function(req, res, next) {
    if (req.user.rank !== 'teacher' || req.user.admin) return next();
    req.session.redirect = req.originalUrl;
    req.flash('error', 'You must be a higher up to view that page.');
    return res.redirect('/');
}

// To be used by routes
// When used as a middleware on a route, if user is not logged in or is not an admin it redirects home
requireAdmin = function(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated() && req.user.verified && req.user.admin) return next();
    req.session.redirect = req.originalUrl;
    req.flash('error', 'You must be logged in as an Administrator to view that page.');
    return res.redirect('/');
}

/* Login with Google using Passport */
app.get('/auth/slack', passport.authenticate('slack'));
app.get('/auth/slack/callback',
    passport.authenticate('slack', {
        //successRedirect: '/',
        failureRedirect: '/',
        failureFlash: true
    }),
    (req, res) => {
        req.db.User.find({ 'application.superior': req.user._id, applying: false })
            .exec()
            .then(applicants => {
                req.session.applicantCount = res.locals.applicantCount = applicants.length;
            
                if (req.session.redirect !== undefined) {
                    // Redirect to page after login if specified
                    const redir = req.session.redirect;
        
                    delete req.session.redirect;
                    
                    return res.redirect(redir);
                } else {
                    return res.redirect('/');
                }
            });
    });

// Dynamically load routes
const routePath = path.join(__dirname, 'server/routes') + '/';
const files = recursiveReadSync(routePath);
for (let index in files) {
    const path = files[index].replace(`${__dirname}/server/routes/`, '');

    const router = require(files[index]);
    const name = ( path == 'index.js' ? '' : path.replace('.js', '') ).replace('/index', '');
    try {
        app.use('/' + name, router);
        console.log(`Using ${path} for '/${name}'.`);
    } catch(err) {
        console.log(`Failed to load route '/${name}': ${err}`);
    }
}

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500);

    if (err.message == 'on_slack_but_didnt_apply') {
        // set locals, only providing error in development
        res.locals.message = 'You are somehow on the Kids Tales Slack but have not yet applied and been accepted on the website yet! Make sure you apply first.';
        res.locals.error = "On Slack but Didn't Apply";

        // render the error page
        if (req.isAPI) return res.json({error: err, message: err.message});
        return res.render('error');
    }

    if (req.app.get('env') === 'development') {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = err;

        // render the error page
        if (req.isAPI) return res.json({error: err, message: err.message});
        res.render('error');
    } else {
        req.flash('error', 'An error occurred! Please try again later.');

        if (req.isAPI) return res.json({error: false, message: 'An error occured! Please try again later.'});
        res.redirect('/');
    }
});

module.exports = app;
