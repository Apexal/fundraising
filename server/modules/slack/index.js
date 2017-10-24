const config = require('config');

const token = config.get('slack.webToken');
const teamInviteURL = `https://${config.get('slack.teamName')}.slack.com/api/users.admin.invite?t=`;
const channels = config.get('slack.startChannels');

const inviteToTeam = (firstName, email) => {
    const url = teamInviteUrl + (new Date/1E3|0);
    const data = {
        email,
        channels: channels.join(','),
        first_name: firstName,
        token,
        set_active: true,
        _attempts: 1
    };
};

module.exports = { inviteToTeam };
