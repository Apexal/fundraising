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
const config = require('./server/config.js');
const packageInfo = require('./package.json');
const mongodb = require('./server/db');
const slack = require('./server/modules/slack.js');

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
    secret: config.secret,
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

// ALL REQUESTS PASS THROUGH HERE FIRST
app.locals.moment = moment;
app.locals.defaultTitle = 'Kids Tales';//packageInfo.name;
app.locals.appDescription = packageInfo.description;
app.use((req, res, next) => {
    res.locals.pageTitle = app.locals.defaultTitle; // Default page title is passed down
    res.locals.pagePath = req.path; // To access in views and helpers
    req.db = mongodb;
    
    if (req.user) res.locals.user = req.user; // To access in views

    // For convenience
    res.locals.loggedIn = req.isAuthenticated();

    next();
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

// To be used by routes
// When used as a middleware on a route, if user is not logged in or is not verified it redirects home
requireVerified = function(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated() && req.user.verified) return next();
    req.session.redirect = req.originalUrl;
    debug(req.originalUrl);
    debug(req.session);
    req.flash('error', 'You must be logged in and verified to view that page.');
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
        if (req.session.redirect !== undefined) {
            // Redirect to page after login if specified
            const redir = req.session.redirect;

            delete req.session.redirect;
            
            return res.redirect(redir);
        } else {
            return res.redirect('/management');
        }
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

    if (req.app.get('env') === 'development') {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = err;

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    } else {
        req.flash('error', 'An error occurred! Please try again later.');
        res.status(err.status || 500);
        res.redirect('/');
    }
});

module.exports = app;
