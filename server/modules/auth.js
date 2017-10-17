const passport = require('passport');
const SlackStrategy = require('passport-slack').Strategy;
const config = require('../config').slack;
const slack = require('./slack');

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
            User.findOne({ email, verified: true })
                .exec()
                .then(user => {
                    if (!user) throw new Error('You must apply first!');

                    if (user.slackId !== profile.id) {
                        // First login
                        sendEmail(user.email, 'Welcome to Kids Tales', 'newUser', { firstName: user.name.first });
                        user.slackId = profile.id;

                        user.save()
                            .then(u => {
                                u.sendSlackMessage('Welcome to Kids Tales!');
                            });
                    }
                    console.log(`Logging in ${email}...`);

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
