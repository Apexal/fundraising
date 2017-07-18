const config = require('../config');
const nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.googleAuth.email,
        pass: config.googleAuth.password
    }
});

module.exports = (to, subject, html) => {
    transporter.sendMail({ from: `Kids Tales <${config.googleAuth.email}>`, to, subject, html }, (error, info) => {
        if (error) {
            console.log(error);
            return error;
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        return info;
    });
};