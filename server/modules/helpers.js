// All helper methods for all views.

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
    isInvolved: (involvements, camp) => involvements.map(i => i.camp._id.toString()).includes(camp._id.toString()) // Not sure why I need toString() but I do
};