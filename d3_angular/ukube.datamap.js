var map = new Datamap({
  element: document.getElementById("container"),
  scope: 'world',
  projection: 'equirectangular',
  fills: {
    defaultFill: "#ABDDA4",
    lt50: 'rgba(0,244,244,0.9)',
    gt50: 'red'
  },
  geographyConfig: {
      hideAntarctica: false,
      popupOnHover: false, //disable the popup while hovering
      highlightOnHover: false
  },
  fills: {
    defaultFill: '#ABDDA4',
    UKUBE: 'blue'
  }
});


Number.prototype.noExponents= function(){
    var data= String(this).split(/[eE]/);
    if(data.length== 1) return data[0]; 

    var  z= '', sign= this<0? '-':'',
    str= data[0].replace('.', ''),
    mag= Number(data[1])+ 1;

    if(mag<0){
        z= sign + '0.';
        while(mag++) z += '0';
        return z + str.replace(/^\-/,'');
    }
    mag -= str.length;  
    while(mag--) z += '0';
    return str + z;
}

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
           
            return "M" + originXY[0] + ',' + originXY[1] + "S" + midXY[0] +  "," + midXY[1] + "," + destXY[0] + "," + destXY[1]; 
        })
        .style('opacity', function(datum){
            var opacity = Math.pow(datum.index < (totalNodes/2) ? (2*datum.index)/totalNodes : 2 - ((2*datum.index)/totalNodes), 4);
            console.log(Number(opacity).noExponents());
            return Number(opacity).noExponents();
        });
}






map.addPlugin('sat_trajectory', handleSatTrajectory);




// Assign handlers immediately after making the request,
// and remember the jqxhr object for this request
var jqxhr = $.get( "../ukube_position.json", function( data ) {
  console.log( "success" );
  sat_arc = []
  prev_position = null;
  current_position = null;
  if (typeof(data) === "string"){
    data = JSON.parse(data);
  }
  $.each(data, function(index, location){
    current_position = 
      {
        latitude: location.position.latitude, 
        longitude: location.position.longitude,
        datetime: location.datetime
      };

     if (prev_position!=null 
         && prev_position.longitude > current_position.longitude){
         sat_arc.push({
          origin: prev_position,
          destination: current_position
        });
     }
     prev_position = current_position;
  });

  map.sat_trajectory( sat_arc,  {strokeWidth: 1, strokeColor: '#DD1C77', animationSpeed: 1000});

  var middle = sat_arc[ Math.round(sat_arc.length/2) ];

  map.bubbles([
    {
      radius: 25,
      yeild: 15000,
      fillKey: 'UKUBE',
      date: 'middle.origin.datetime',
      latitude: middle.origin.latitude,
      longitude: middle.origin.longitude
    }], {
    popupTemplate: function(geo, data) {
      return '<div class="hoverinfo">Info about UKUBE</div>';
    }
  });

})
.done(function() {
})
.fail(function() {
})
.always(function() {
});


