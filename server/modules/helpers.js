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

h.isTeacher = (workshop, user) => workshop.teachers.map(t => t.id).includes(user.id);

h.isInvolved = (involvements, workshop) => involvements.map(i => i.workshop.id).includes(workshop.id); // Not sure why I need toString() but I do

h.rank = (involvements, workshop) => {
    const possible = involvements.filter(i => i.workshop.id == workshop.id);
    return (possible.length > 0 ? possible[0].rank : null);
};

h.getRankFromWorkshop = (workshop, user) => {
    let rank = null;
    // I can use ._id == ._id becauses User ID's are Numbers not ObjectID's
    if (workshop.ambassador && (workshop.ambassador == user._id || workshop.ambassador._id == user._id)) rank = 'ambassador';
    if (workshop.director && (workshop.director == user._id || workshop.director._id == user._id)) rank = 'director';
    if (workshop.teachers.includes(user._id) || workshop.teachers.map(t => t._id).includes(user._id)) rank = 'teacher';
    return rank;
};

h.isHigherUp = (workshop, user) => {
    if (user.admin) return true;
    if (['ambassador', 'director'].includes(h.getRankFromWorkshop(workshop, user))) return true;
    return false;
}

h.getHelpInfo = label => {
    if (label in helpInfo) {
        return helpInfo[label];
    } else {
        return 'No help info found!'
    }
};

h.assignRank = (workshop, user, rank) => {
    // Make sure no rank already
    if (h.getRankFromWorkshop(workshop, user)) throw new Error('User already has a rank!');

    if(rank === 'teacher') {
        workshop.teachers.push(user._id);
    } else if (rank === 'director') {
        if (workshop.director && !workshop.director.equals(user.id)) throw new Error('Director rank is already taken.');
        workshop.director = user._id;
    } else if (rank === 'ambassador') {
        if (workshop.ambassador && !workshop.ambassador.equals(user.id)) throw new Error('Ambassador rank is already taken.');
        workshop.ambassador = user._id;
    } else {
        throw new Error('Invalid rank to assign.');
    }

    return workshop.save();
};

module.exports = h;