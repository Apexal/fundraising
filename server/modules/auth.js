const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('../config').googleAuth;

module.exports = (User) => {
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    // Get user by ID
    passport.deserializeUser((id, done) => {
        User.findById(id)
        .exec()
        .then(user => {
            done(null, user);
        })
        .catch(done);
    });

    passport.use(new GoogleStrategy(config, 
        (req, token, refreshToken, profile, done) => {
            const email = profile.emails[0].value;

            // Find user
            User.findById(profile.id)
            .exec()
            .then(user => {
                if (!user) {
                    console.log(`Creating user with email ${email}...`);
                    user = new User({
                        _id: profile.id,
                        email,
                        camps: [],
                        name: {
                            first: profile.name.givenName,
                            last: profile.name.familyName
                        }
                    });

                    sendEmail(user.email, 'Welcome to Kids Tales', `<h2>Welcome to Kids Tales!</h2><p>Please fill out the application on the website and wait for a higher up to approve your application. You will be emailed once this happens and will then have full access to the website.</p>`);

                    user.save();
                }
                console.log(`Logging in ${email}...`)
                return done(null, user);
            })
            .catch(err => {
                console.log(`Failed to login user with email ${email}.`)
                return done(err, false, { message: 'There was an error logging you in, please try again later.' });
            });
        }
    ));

    return passport;
};
