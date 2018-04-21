function initMap() {
  const geocoder = new google.maps.Geocoder();
  const regionName = document.title.split(' | ')[0].split(' ')[1];

  // Geocode region center

  let marker;
  $.getJSON('/api/workshops', data => {
    geocode(data[0].location.address, g => {
      var center = g[0].geometry.location;
      var map = new google.maps.Map(document.getElementById('workshop-map'), {
        zoom: 10,
        center
      });

      data.forEach(w => {
        if (!w.active) return;

        geocode(w.location.address, g => {
          if (!g) return;

          let marker = new google.maps.Marker({
            position: g[0].geometry.location,
            map: map,
            title: w.location.name
          });

          let infoWindow = new google.maps.InfoWindow({
            content: `<div class='workshop-marker-window'><h4>${
              workshop.location.name
            }</h4><hr><span class="address"><a href="/workshops/${
              w._id
            }">View</a></div>`
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
        console.log(status);
      }

      return null;
    });
  }
}
