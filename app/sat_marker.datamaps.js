function ColorLuminance(hex, lum) {

	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	}
	lum = lum || 0;

	// convert to decimal and change luminosity
	var rgb = "#", c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i*2,2), 16);
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
		rgb += ("00"+c).substr(c.length);
	}

	return rgb;
}

function handleSatMarker (layer, data, options ) {

  var self = this,
      fillData = this.options.fills,
      svg = this.svg;

  if ( !data || (data && !data.slice) ) {
    throw "Datamaps Error - bubbles must be an array";
  }

  var bubbles = layer.selectAll('circle.datamaps-bubble').data( data, JSON.stringify );

  bubbles
    .enter()
    .append('svg:circle')
    .attr('class', 'datamaps-bubble')
    .attr('id', function (datum){
        if(!datum) return;
        return typeof datum.id !== 'undefined' ? datum.id+"-bubble" : '';
        })
  .attr('cx', function ( datum ) {
      if(!datum) return;

      var latLng;
      if ( datumHasCoords(datum) ) {
      latLng = self.latLngToXY(datum.latitude, datum.longitude);
      }
      else if ( datum.centered ) {
      latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
      }
      if ( latLng ) return latLng[0];
      })
  .attr('cy', function ( datum ) {
      if(!datum) return;

      var latLng;
      if ( datumHasCoords(datum) ) {
      latLng = self.latLngToXY(datum.latitude, datum.longitude);
      }
      else if ( datum.centered ) {
      latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
      }
      if ( latLng ) return latLng[1];;
      })
  .attr('r', 0) //for animation purposes
    .attr('data-info', function(d) {
        return JSON.stringify(d);
        })
  .style('stroke', function ( datum ) {
      if (!datum) return;
      return typeof datum.borderColor !== 'undefined' ? datum.borderColor : options.borderColor;
      })
  .style('stroke-width', function ( datum ) {
      if (!datum) return;
      return typeof datum.borderWidth !== 'undefined' ? datum.borderWidth : options.borderWidth;
      })
  .style('fill-opacity', function ( datum ) {
      if (!datum) return;
      return typeof datum.fillOpacity !== 'undefined' ? datum.fillOpacity : options.fillOpacity;
      })
  .style('fill', function ( datum ) {
      if (!datum) return;
      var fillColor = fillData[ datum.fillKey ];
      return ColorLuminance(fillColor, 0.1) || fillData.defaultFill;
      })
  .on('mouseover', function ( datum ) {
      var $this = d3.select(this);

      if (options.highlightOnHover) {
      //save all previous attributes for mouseout
      var previousAttributes = {
      'fill':  $this.style('fill'),
      'stroke': $this.style('stroke'),
      'stroke-width': $this.style('stroke-width'),
      'fill-opacity': $this.style('fill-opacity')
      };

      $this
      .style('fill', options.highlightFillColor)
      .style('stroke', options.highlightBorderColor)
      .style('stroke-width', options.highlightBorderWidth)
      .style('fill-opacity', options.highlightFillOpacity)
      .attr('data-previousAttributes', JSON.stringify(previousAttributes));
      }

      if (options.popupOnHover) {
        self.updatePopup($this, datum, options, svg);
      }
  })
  .on('mouseout', function ( datum ) {
      var $this = d3.select(this);

      if (options.highlightOnHover) {
      //reapply previous attributes
      var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
      for ( var attr in previousAttributes ) {
      $this.style(attr, previousAttributes[attr]);
      }
      }

      d3.selectAll('.datamaps-hoverover').style('display', 'none');
      })
  .transition().duration(400)
    .attr('r', function ( datum ) {
        if (!datum) return;
        return datum.radius;
        });

  bubbles
    .enter()
    .append("text")
    .attr('class', 'satellite-label')
    .attr('id', function (datum){
        if (!datum) return;
        return typeof datum.id !== 'undefined' ? datum.id+"-label" : '';
        })
  .attr('x', function ( datum ) {
      if (!datum) return;
      var latLng;
      var middlelatLng = self.latLngToXY(0, 0);

      if ( datumHasCoords(datum) ) {
      latLng = self.latLngToXY(datum.latitude, datum.longitude);
      }
      else if ( datum.centered ) {
      latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
      }
      if ( latLng ){
        if (latLng[0] > middlelatLng[0])
          return latLng[0] - 10;
        else
          return latLng[0] + 10;
      }
      })
  .attr('y', function ( datum ) {
      if (!datum) return;
      var latLng;
      if ( datumHasCoords(datum) ) {
      latLng = self.latLngToXY(datum.latitude, datum.longitude);
      }
      else if ( datum.centered ) {
      latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
      }
      if ( latLng ){
        if ( datum.latitude > 0 ){
          return latLng[1] + 20;
        }
        else{
          return latLng[1] - 10;
        }
      }
      })
  .text( function (d) {
      if (!d) return;
      return d.name;
      })
  .attr('text-anchor', function ( datum ) {
      if ( !datumHasCoords(datum)) return "start"

      var latLng = self.latLngToXY(datum.latitude, datum.longitude);
      var middlelatLng = self.latLngToXY(0, 0);

      if (latLng[0] > middlelatLng[0])
        return "end"
      else
        return "start";

  })
  .attr("font-family", "sans-serif")
  .attr("font-size", "12px")
  .attr("font-weight", "light")
  .style('fill', function ( datum ) {
      if (!datum) return;
      var fillColor = fillData[ datum.fillKey ];
      return ColorLuminance(fillColor, 0.25) || fillData.defaultFill;
      })
  .style('margin', "0 10px");


  bubbles.exit()
    .transition()
    .delay(options.exitDelay)
    .attr("r", 0)
    .remove();

  function datumHasCoords (datum) {
    return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
  }
}
