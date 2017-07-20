const webhookURL = require('../config').slack.webhookUrl;
const request = require('request');

module.exports = {
    sendMessage: (attachment) => {
        return request({ method: 'POST', uri: webhookURL, body: {
            username: 'Kids Tales Site',
            text: ' ',
            attachments: [
                attachment
            ],
            mrkdwn: true
        }, json: true });
    }
}