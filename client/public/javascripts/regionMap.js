function initMap() {
    var uluru = {lat: 40.783060, lng: -73.971249};
    var map = new google.maps.Map(document.getElementById('region-map'), {
        zoom: 10,
        center: uluru
    });
    var marker = new google.maps.Marker({
        position: {lat: 40.779332, lng: -73.959009},
        map: map,
        title: 'Regis High School'
    });

    var infoWindow = new google.maps.InfoWindow({
        content: `<div class='region-marker-window'><h4>Location Name</h4><hr><span class="address"><a href="/locations">Location Address</a></div>`
    });
    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });
}