var arcs = new Datamap({
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





// Assign handlers immediately after making the request,
// and remember the jqxhr object for this request
var jqxhr = $.get( "http://ukube.colinwaddell.com/ukube_position.json", function( data ) {
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

  arcs.arc( sat_arc,  {strokeWidth: 1, arcSharpness: 0, animationSpeed: 0});
})
.done(function() {
})
.fail(function() {
})
.always(function() {
});


