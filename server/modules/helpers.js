// All helper methods for all views.

module.exports = {
    activeLink: (href, current) => {

        current = (current == '/home' ? '/' : current);
        if ((href === '/' && current === href) || (href !== '/' && current.startsWith(href))) {
            return 'active';
        }
    }
};