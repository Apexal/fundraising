const config = require('config');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const templatePath = path.join(__dirname, 'emailTemplates');
const templateNames = fs.readdirSync(templatePath);

const templates = {};
templateNames.map(fileName => {
    templates[fileName] = fs.readFileSync(path.join(templatePath, fileName), 'utf8');
});

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.get('googleAuth.email'),
        pass: config.get('googleAuth.password')
    }
});

/* Replace all data in the template */
const renderTemplate = (template, data) => {
    for (let d in data) {
        template = template.replace(new RegExp(`{{${d}}}`, 'g'), data[d]);
    }

    return template;
}

module.exports = (to, subject, template, data) => {
    if (!(template+'.html' in templates)) throw new Error(`Email template '${template}' not found.`);
    
    // Render template
    const html = renderTemplate(templates[template+'.html'], data);

    transporter.sendMail({ from: `Kids Tales <${config.get('googleAuth.email')}>`, to, subject, html }, (error, info) => {
        if (error) {
            console.log(error);
            return error;
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        return info;
    });
};