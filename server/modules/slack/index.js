const config = require('config');

const request = require('request-promise');
const token = config.get('slack.legacyToken');
const teamInviteUrl = `https://${config.get(
  'slack.teamName'
)}.slack.com/api/users.admin.invite?t=`;
const channels = config.get('slack.startChannels');

const inviteToTeam = (firstName, email) => {
  const url = teamInviteUrl + ((new Date() / 1e3) | 0);
  const form = {
    email,
    //channels: channels.join(','),
    first_name: firstName,
    token,
    set_active: true
  };

  return request.post({ url, form });
};

module.exports = { inviteToTeam };
