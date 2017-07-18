// All helper methods for all views.
var helpInfo = require('./helpInfo.js');
var h = {}


h.activeLink = (href, current) => {
    current = (current == '/home' ? '/' : current);
    if ((href === '/' && current === href) || (href !== '/' && current.startsWith(href))) {
        return 'active';
    }
};

h.limit = (string, maxLength) => {
    return (string.length > maxLength ? string.substring(0, maxLength) + '...' : string);
};

h.isTeacher = (camp, user) => camp.teachers.map(t => t.id).includes(user.id);

h.isInvolved = (involvements, camp) => involvements.map(i => i.camp.id).includes(camp.id); // Not sure why I need toString() but I do

h.rank = (involvements, camp) => {
    const possible = involvements.filter(i => i.camp.id == camp.id);
    return (possible.length > 0 ? possible[0].rank : null);
};

h.getRankFromCamp =  (camp, user) => {
    let rank = null;
    if (camp.ambassador && (camp.ambassador.equals(user._id) || camp.ambassador._id.equals(user._id))) rank = 'ambassador';
    if (camp.director && (camp.director.equals(user._id) || camp.director._id.equals(user._id))) rank = 'director';
    if (camp.teachers.includes(user._id) || camp.teachers.map(t => t._id).includes(user._id)) rank = 'teacher';
    return rank;
};

h.getHelpInfo = label => {
    if (label in helpInfo) {
        return helpInfo[label];
    } else {
        return 'No help info found!'
    }
};

h.assignRank = (camp, user, rank) => {
    // Make sure no rank already
    if (h.getRankFromCamp(camp, user)) throw new Error('User already has a rank!');

    if(rank === 'teacher') {
        camp.teachers.push(user._id);
    } else if (rank === 'director') {
        if (camp.director && !camp.director.equals(user.id)) throw new Error('Director rank is already taken.');
        camp.director = user._id;
    } else if (rank === 'ambassador') {
        if (camp.ambassador && !camp.ambassador.equals(user.id)) throw new Error('Ambassador rank is already taken.');
        camp.ambassador = user._id;
    } else {
        throw new Error('Invalid rank to assign.');
    }

    return camp.save();
};

module.exports = h;