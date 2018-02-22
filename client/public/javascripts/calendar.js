$(function() {
    $('#homepage-calendar').fullCalendar({
        events: '/api/workshops/events',
        weekends: false,
        header: {
            left:   'title',
            center: '',
            right:  'today prev,next'
        }
    });
});