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

router.use(requireVerified);

/* GET home page. */
router.get('/', requireLogin, (req, res, next) => {
    res.locals.pageTitle = 'Setup';

    res.render('setup/index');
});

router.post('/', (req, res, next) => {
    const phoneNumber = req.body.phoneNumber;

    if(!phoneNumber) return next(new Error('Invalid phone number.'));
    req.user.phoneNumber = phoneNumber;

    req.user.setup = true;
    return req.user.save().then(() => {
        req.flash('success', `Successfully setup account!`)
        res.redirect('/');
    })
    .catch(next);
});

router.post('/profilepicture', upload.single('profileImage'), (req, res, next) => {
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
    })
    .then(user => {
        req.flash('success', 'Uploaded photo');
        res.redirect('/setup');
    })
    .catch(next);
});

module.exports = router;
