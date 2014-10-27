var map = new Datamap({
  element: document.getElementById("container"),
  scope: 'world',
  projection: 'mercator',
  fills: {
    defaultFill: "#ABDDA4",
    win: '#0fa0fa'
  },
  geographyConfig: {
      hideAntarctica: true,
      popupOnHover: false, //disable the popup while hovering
      highlightOnHover: false
  }
});



function handleSatTrajectory (layer, data, options) {
    var self = this,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - arcs must be an array";
    }

    if ( typeof options === "undefined" ) {
      options = defaultOptions.arcConfig;
    }

    var arcs = layer.selectAll('path.datamaps-arc').data( data, JSON.stringify );

    arcs
      .enter()
        .append('svg:path')
        .attr('class', 'datamaps-arc')
        .style('stroke-linecap', 'round')
        .style('stroke', function(datum) {
          if ( datum.options && datum.options.strokeColor) {
            return datum.options.strokeColor;
          }
          return  options.strokeColor
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
            return "M" + originXY[0] + ',' + originXY[1] + "S" + (midXY[0] + (50 * options.arcSharpness)) + "," + (midXY[1] - (75 * options.arcSharpness)) + "," + destXY[0] + "," + destXY[1];
        })
        .transition()
          .delay(100)
          .style('fill', function() {
            /*
              Thank you Jake Archibald, this is awesome.
              Source: http://jakearchibald.com/2013/animated-line-drawing-svg/
            */
            var length = this.getTotalLength();
            this.style.transition = this.style.WebkitTransition = 'none';
            this.style.strokeDasharray = length + ' ' + length;
            this.style.strokeDashoffset = length;
            this.getBoundingClientRect();
            this.style.transition = this.style.WebkitTransition = 'stroke-dashoffset ' + options.animationSpeed + 'ms ease-out';
            this.style.strokeDashoffset = '0';
            return 'none';
          })

    arcs.exit()
      .transition()
      .style('opacity', 0)
      .remove();
}









map.addPlugin('sat_trajectory', handleSatTrajectory);




// Assign handlers immediately after making the request,
// and remember the jqxhr object for this request
var jqxhr = $.get( "../ukube_position.json", function( data ) {
  console.log( "success" );
  sat_arc = []
  prev_position = null;
  current_position = null;
  $.each(data, function(index, location){
    current_position = 
      {
        latitude: location.position.latitude, 
        longitude: location.position.longitude
      };

     if (prev_position!=null){
         sat_arc.push({
          origin: prev_position,
          destination: current_position
        });
     }
     prev_position = current_position;
  });

  map.sat_trajectory( sat_arc,  {strokeWidth: 1, arcSharpness: 0, animationSpeed: 0});
})
.done(function() {
})
.fail(function() {
})
.always(function() {
});


