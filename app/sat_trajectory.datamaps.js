
function handleSatTrajectory (layer, data, options) {
  var self = this,
      svg = this.svg;

  if ( !data || (data && !data.slice) ) {
    throw "Datamaps Error - arcs must be an array";
  }

  if ( typeof options === "undefined" ) {
    options = defaultOptions.arcConfig;
  }

  var arcs = layer.selectAll('path.datamaps-arc').data( data,
      function(d,i){
      d.index = i;
      d = JSON.stringify(d);
      return d;
      });

  var totalNodes = data.length;
  arcs
    .enter()
    .append('svg:path')
    .attr('class', 'datamaps-arc')
    .style('stroke-linecap', 'round')
    .style('stroke', function(datum) {
        if ( datum.options && datum.options.strokeColor) {
        return datum.options.strokeColor;
        }
        return  options.strokeColor;
        })
  .style('fill', 'none')
    .style('stroke-width', function(datum) {
        if ( datum.options && datum.options.strokeWidth) {
        return datum.options.strokeWidth;
        }
        return options.strokeWidth;
        })
  .attr('d', function(datum) {
      var originXY = self.latLngToXY(datum.origin.latitude, datum.origin.longitude);
      var destXY = self.latLngToXY(datum.destination.latitude, datum.destination.longitude);
      var midXY = [ (originXY[0] + destXY[0]) / 2, (originXY[1] + destXY[1]) / 2];

      return "M" + originXY[0] + ',' + originXY[1] + "S" + midXY[0] +  "," + midXY[1] + "," + destXY[0] + "," + destXY[1];
      })
  .style('opacity', function(datum){
      var opacity = Math.pow(datum.index < (totalNodes/2) ? (2*datum.index)/totalNodes : 2 - ((2*datum.index)/totalNodes), 10);
      return Number(opacity).noExponents();
      });
}
