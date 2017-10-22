// All helper methods
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

h.cap = string => { return string.charAt(0).toUpperCase() + string.slice(1); };

h.getRankFromWorkshop = (workshop, user) => {
    let rank = null;
    
    if (workshop.ambassador && (workshop.ambassador == user.id || workshop.ambassador.id == user.id)) rank = 'ambassador';
    if (workshop.director && (workshop.director == user.id || workshop.director.id == user.id)) rank = 'director';
    if (workshop.teachers.includes(user.id) || workshop.teachers.map(t => t.id).includes(user.id)) rank = 'teacher';
    return rank;
};

h.isHigherUpInWorkshop = (workshop, user) => {
    if (user.admin) return true;
    if (['ambassador', 'director'].includes(h.getRankFromWorkshop(workshop, user))) return true;
    return false;
}

h.workshopRanksFilled = workshop => {
    return (workshop.ambassador && workshop.director && workshop.teachers.length > 0);
}

h.getHelpInfo = label => {
    if (label in helpInfo) {
        return helpInfo[label];
    } else {
        return 'No help info found!'
    }
};

module.exports = h;