const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('../config').googleAuth;

module.exports = (User) => {
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    // Get user by ID
    passport.deserializeUser((id, done) => {
        User.findById(id, done);
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
                        name: {
                            first: profile.name.givenName,
                            last: profile.name.familyName
                        }
                    });

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