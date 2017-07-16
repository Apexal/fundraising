// All helper methods for all views.
var helpInfo = require('./helpInfo.js');

module.exports = {
    activeLink: (href, current) => {
        current = (current == '/home' ? '/' : current);
        if ((href === '/' && current === href) || (href !== '/' && current.startsWith(href))) {
            return 'active';
        }
    },
    limit: (string, maxLength) => {
        return (string.length > maxLength ? string.substring(0, maxLength) + '...' : string);
    },
    isTeacher: (camp, user) => camp.teachers.map(t => t._id).includes(user._id),
    isInvolved: (involvements, camp) => involvements.map(i => i.camp._id.toString()).includes(camp._id.toString()), // Not sure why I need toString() but I do
    rank: (involvements, camp) => {
        const possible = involvements.filter(i => i.camp._id.toString() == camp._id.toString());
        return (possible.length > 0 ? possible[0].rank : null);
    },
    getRankFromCamp: (camp, user) => {
        let rank = null;
        if (camp.ambassador && (camp.ambassador == user._id || camp.ambassador._id == user._id)) rank = 'ambassador';
        if (camp.director && (camp.director == user._id || camp.director._id == user._id)) rank = 'director';
        if (camp.teachers.includes(user._id) || camp.teachers.map(t => t._id).includes(user._id)) rank = 'teacher';
        return rank;
    },
    getHelpInfo: label => {
        if (label in helpInfo) {
            return helpInfo[label];
        } else {
            return 'No help info found!'
        }
    }
};