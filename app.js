const express = require('express');
const path = require('path');
const compression = require('compression');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helpers = require('./server/modules/helpers.js');
const fs = require('fs');
const moment = require('moment');
const recursiveReadSync = require('recursive-readdir-sync');
const session = require('express-session');
const config = require('./server/config.js');
const packageInfo = require('./package.json');
const mongodb = require('./server/db');

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

// View helper methods
app.locals.helpers = {};
for (var h in helpers) {
    if (typeof(helpers[h]) === 'function') {
        app.locals.helpers[h] = helpers[h];
    }
}

// ALL REQUESTS PASS THROUGH HERE FIRST
app.locals.moment = moment;
app.locals.defaultTitle = 'Kids Tales';//packageInfo.name;
app.locals.appDescription = packageInfo.description;
app.use((req, res, next) => {
    res.locals.pageTitle = app.locals.defaultTitle;
    res.locals.pagePath = req.path;
    req.db = mongodb;
    
    if (req.user) res.locals.user = req.user;

    res.locals.loggedIn = req.isAuthenticated();

    next();
});

// To be used by routes
requireLogin = function(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();
    req.session.redirect = req.originalUrl;
    req.flash('error', 'You must be logged in to view that page.');
    return res.redirect('/');
}

// To be used by routes
requireVerified = function(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated() && req.user.verified) return next();
    req.session.redirect = req.originalUrl;
    req.flash('error', 'You must be logged in and verified to view that page.');
    return res.redirect('/');
}

// To be used by routes
requireAdmin = function(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated() && req.user.verified && req.user.rank > 2) return next();
    req.session.redirect = req.originalUrl;
    req.flash('error', 'You must be logged in as an Administrator to view that page.');
    return res.redirect('/');
}

app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/',
        failureFlash: true
    }),
    (req, res) => {
        if (req.session.redirect !== undefined) {
            // Redirect to page after login if specified
            const redir = req.session.redirect;

            delete req.session.redirect;
            
            res.redirect(redir);
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
    req.flash('error', err.message);
    console.error(err);
    res.status(err.status || 500);
    res.redirect('/');
});

module.exports = app;
