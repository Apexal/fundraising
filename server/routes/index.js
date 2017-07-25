const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const easyimg = require('easyimage');
const fs = require('fs');

const IMAGE_TYPES = ['image/jpeg', 'image/png'];

/* Save uploaded files (profile images) in the public images folder under the naming scheme 'user-<user-id>.<extenstion>' */
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, __dirname + '/../../client/public/images'),
    filename: (req, file, cb) => cb(null, 'user-' + req.user._id + '.' + file.originalname.split('.')[1]),
    fileFilter: (req, file, cb) => {
        if(IMAGE_TYPES.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(null, false)
        }
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 1000000, // 1 Megabyte
        files: 1,
    }
});

/* Determine which homepage to show based on whether logged in and verified or not */
router.get('/', (req, res, next) => {
    
    // TODO: make customizable
    res.locals.latestNews = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec suscipit justo in orci auctor rhoncus. Sed vitae odio dignissim, suscipit lacus eget, laoreet dolor.";
    
    // Not logged in users get shown the info page
    if (!req.isAuthenticated()) return res.render('index/info');
    
    // Unverified users get sent to the application
    if (!req.user.verified) return res.redirect('/application');

    if (req.user.rank == 'teacher') return res.render('index/homepage');

    req.db.User.find({ 'application.superior': req.user._id, verified: false })
        .exec()
        .then(applicants => {
            res.locals.applicants = applicants;

            return res.render('index/homepage');
        })
        .catch(next);
});

/* Show login form page */
router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        req.flash('warning', 'You are already logged in!');
        return res.redirect('/');
    }

    res.redirect('/auth/google');
});

/* Allow admins to login as any user based on email */
router.get('/loginas', /*requireAdmin,*/ (req, res, next) => {
    //if (!req.query.email) return next(new Error('Invalid user email.'));

    req.db.User.findById(req.query.id)//One({ email: req.query.email })
        .exec()
        .then(user => {
            return req.logIn(user, err => {
                if (err) throw err;

                req.flash('info', `Successfully logged in as ${req.user.name.full}`);
                res.redirect('/');
            });
        })
        .catch(next);
});

router.get('/logout', function(req, res){
    req.logout();
    req.flash('info', 'Successful logout.');
    res.redirect('/');
});

router.get('/profile', requireVerified, (req, res, next) => {
    res.locals.pageTitle = 'Your Profile';

    res.render('users/profile');
});

/* Update logged in user's profile */
router.post('/profile', requireVerified, upload.single('profileImage'), (req, res, next) => {
    // Gather form data
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const grade = req.body.grade;
    const age = req.body.age;
    const phoneNumber = req.body.phoneNumber;
    const location = req.body.location;

    // Update user (isn't saved until user.save() is called)
    req.user.name.first = firstName;
    req.user.name.last = lastName;
    req.user.grade = grade;
    req.user.age = age;
    req.user.phoneNumber = phoneNumber;
    req.user.location = location;

    /* If a profile picture was uploaded then resize and convert the picture to standards then save the user, otherwise just save the user */
    if (req.file) {
        req.user.profileImageName = req.file.filename;
        const imgPath = path.join(__dirname, '..', '..', 'client', 'public', 'images', req.file.filename);

        // Resize image to roughly 200 by 250 (keeps ratio so may not be perfect)
        return easyimg.resize({
            src: imgPath, dst: imgPath,
            width: 200, height: 250,
        })
        .then(image => {
            const newPath = imgPath.replace('.' + imgPath.split('.')[1], '.jpg');

            // Convert to JPG image
            return easyimg.convert({
                src: imgPath, dst: newPath, quality: 90
            });
        }).then(image => {
            if (req.user.profileImageName !== image.name) {
                fs.unlinkSync(imgPath, err => {
                    if (err) console.error(err);
                });
            }

            // Set profile image name (url) to new one with JPG extension
            req.user.profileImageName = image.name;
            return req.user.save();
        }).then(user => {
            req.flash('success', 'Successfully updated profile and photo.');
            res.redirect('/profile');
        })
        .catch(next);
    }

    // Called if no profile picture was uploaded
    return req.user.save()
        .then(user => {
            req.flash('success', 'Successfully updated profile.');
            res.redirect('/profile');
        })
        .catch(next);
});

module.exports = router;
