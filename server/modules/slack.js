const SlackBot = require('slackbots');
const config = require('../config').slack;

const bot = new SlackBot({
    token: config.botToken,
    name: 'Kids Tales Bot'
})

bot.on('start', () => {
    bot.postMessageToUser('U4QFHCPRQ', 'I\'m on!'); 
});

/*
const webhookURL = require('../config').slack.webhookUrl;
const request = require('request');

module.exports = {
    sendMessage: attachment => {
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
*/

module.exports = bot;