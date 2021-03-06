function moveSatMarker (layer, data, options){
  var self = this;

  function datumHasCoords (datum) {
    return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
  }

  var marker = d3.selectAll('circle#'+data.id+'-bubble');

  marker
  .attr('cx', function ( datum ) {
    var latLng = self.latLngToXY(options.latitude, options.longitude);
    return latLng[0];
  })
  .attr('cy', function ( datum ) {
    var latLng = self.latLngToXY(options.latitude, options.longitude);
    return latLng[1];
  });


  var label = d3.selectAll('text#'+data.id+'-label');

  label
  .attr('x', function ( datum ) {
    var latLng = self.latLngToXY(options.latitude, options.longitude);
    var middlelatLng = self.latLngToXY(0, 0);

    if (latLng[0] > middlelatLng[0])
      return latLng[0] - 10;
    else
      return latLng[0] + 10;

  })
  .attr('y', function ( datum ) {
    var latLng = self.latLngToXY(options.latitude, options.longitude);

    if ( datum.latitude > 0 ){
      return latLng[1] + 20;
    }
    else{
      return latLng[1] - 10;
    }
  })
  .attr('text-anchor', function ( datum ) {
    var latLng = self.latLngToXY(options.latitude, options.longitude);
    var middlelatLng = self.latLngToXY(0, 0);

    if (latLng[0] > middlelatLng[0])
      return "end"
    else
      return "start";

  });

}
