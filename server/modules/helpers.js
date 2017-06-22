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
    isTeacher: (camp, user) => camp.teachers.map(t => t._id).includes(user._id)
};