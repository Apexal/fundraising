function initMap() {
    const geocoder = new google.maps.Geocoder();
    const regionName = document.title.split(' | ')[0].split(' ')[1];

    // Geocode region center
    geocode(regionName, g => {
        var center = g[0].geometry.location;
        var map = new google.maps.Map(document.getElementById('region-map'), {
            zoom: 10,
            center
        });

        let marker;
        $.getJSON('/api/locations', data => {
            data.forEach(l => {
                geocode(l.address, g => {
                    if (!g) return;

                    let marker = new google.maps.Marker({
                        position: g[0].geometry.location,
                        map: map,
                        title: l.name
                    });

                    let infoWindow = new google.maps.InfoWindow({
                        content: `<div class='region-marker-window'><h4>${l.name}</h4><hr><span class="address"><a href="/locations/${l._id}">${l.address}</a></div>`
                    });
                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                    });
                });
            });
        });
    });

    function geocode(address, callback) {
        geocoder.geocode({ address }, function(results, status) {
            console.log(status);
            if (status == 'OK') {
                return callback(results);
            } else {
                console.log(status)
            }

            return null;
        });
    }
}
