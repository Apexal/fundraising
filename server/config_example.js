module.exports = {
    database: {
        host: 'localhost',
        name: 'app_name',
        port: '27017'
    },
    googleAuth: {
        clientID: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com',
        clientSecret: 'XXXXXXXXXXXXXXXXXXX',
        callbackURL: 'http://localhost:3000/auth/google/callback',
        passReqToCallback: true
    },
    secret: 'app secret'
};