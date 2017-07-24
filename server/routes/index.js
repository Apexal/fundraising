const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const easyimg = require('easyimage');
const fs = require('fs');

const IMAGE_TYPES = ['image/jpeg', 'image/png'];

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

/* GET home page. */
router.get('/', (req, res) => {
    res.locals.latestNews = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec suscipit justo in orci auctor rhoncus. Sed vitae odio dignissim, suscipit lacus eget, laoreet dolor.";
    if (req.isAuthenticated()) {
        if (req.user.verified) {
            return res.render('index/homepage');
        } else {
            return res.redirect('/application');
        }
    } else {
        return res.render('index/info');
    }
});

router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
      req.flash('warning', 'You are already logged in!');
      return res.redirect('/');
    }

    res.redirect('/auth/google');
});

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

router.post('/profile', requireVerified, upload.single('profileImage'), (req, res, next) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const grade = req.body.grade;
    const age = req.body.age;
    const phoneNumber = req.body.phoneNumber;
    const location = req.body.location;

    req.user.name.first = firstName;
    req.user.name.last = lastName;
    req.user.grade = grade;
    req.user.age = age;
    req.user.phoneNumber = phoneNumber;
    req.user.location = location;

    if (req.file) {
        req.user.profileImageName = req.file.filename;
        const imgPath = path.join(__dirname, '..', '..', 'client', 'public', 'images', req.file.filename);
        console.log(imgPath);

        return easyimg.resize({
            src: imgPath, dst: imgPath,
            width: 200, height: 250,
        })
        .then(image => {
            const newPath = imgPath.replace('.' + imgPath.split('.')[1], '.jpg');

            return easyimg.convert({
                src: imgPath, dst: newPath, quality: 90
            });
        }).then(image => {
            if (req.user.profileImageName !== image.name) {
                fs.unlinkSync(imgPath, err => {
                    if (err) console.error(err);
                });
            }
            req.user.profileImageName = image.name;
            return req.user.save();
        }).then(user => {
            req.flash('success', 'Successfully updated profile and photo.');
            res.redirect('/profile');
        })
        .catch(next);
    }

    return req.user.save()
        .then(user => {
            req.flash('success', 'Successfully updated profile.');
            res.redirect('/profile');
        })
        .catch(next);
});

module.exports = router;
