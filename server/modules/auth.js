const passport = require('passport');
const SlackStrategy = require('passport-slack').Strategy;
const config = require('../config').slack;

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

    passport.use(new SlackStrategy(config, 
        (req, token, refreshToken, profile, done) => {
            console.log(profile);
            
            // Make sure user is in Kids Tales Slack team 
            if (profile.team.id !== config.teamID) return done(null, false, { message: 'You must be on the Kids Tales Slack team!' });

            const email = profile.user.email;

            // Find user
            User.findOne({ slackId: profile.slackId })
            .exec()
            .then(user => {
                if (!user) {
                    console.log(`Creating user with email ${email}...`);
                    user = new User({
                        slackId: profile.id,
                        email,
                        name: {
                            full: profile.user.name,
                            first: profile.user.name.split(' ')[0],
                            last: profile.user.name.split(' ')[1],
                        },
                        profileImageName: profile.user.image_192,
                        verified: false,
                        admin: false
                    });

                    user.save();
                    sendEmail(user.email, 'Welcome to Kids Tales', 'newUser', { firstName: user.name.first });
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
