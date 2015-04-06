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
        return typeof datum.id !== 'undefined' ? datum.id+"-bubble" : '';
        })
  .attr('cx', function ( datum ) {
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
      return typeof datum.borderColor !== 'undefined' ? datum.borderColor : options.borderColor;
      })
  .style('stroke-width', function ( datum ) {
      return typeof datum.borderWidth !== 'undefined' ? datum.borderWidth : options.borderWidth;
      })
  .style('fill-opacity', function ( datum ) {
      return typeof datum.fillOpacity !== 'undefined' ? datum.fillOpacity : options.fillOpacity;
      })
  .style('fill', function ( datum ) {
      var fillColor = fillData[ datum.fillKey ];
      return fillColor || fillData.defaultFill;
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
        return datum.radius;
        });

  bubbles
    .enter()
    .append("text")
    .attr('id', function (datum){
        return typeof datum.id !== 'undefined' ? datum.id+"-label" : '';
        })
  .attr('x', function ( datum ) {
      var latLng;
      if ( datumHasCoords(datum) ) {
      latLng = self.latLngToXY(datum.latitude, datum.longitude);
      }
      else if ( datum.centered ) {
      latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
      }
      if ( latLng ) return latLng[0] + 10;
      })
  .attr('y', function ( datum ) {
      var latLng;
      if ( datumHasCoords(datum) ) {
      latLng = self.latLngToXY(datum.latitude, datum.longitude);
      }
      else if ( datum.centered ) {
      latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
      }
      if ( latLng ) return latLng[1] - 10;
      })
  .text( function (d) { 
      return d.name; 
      })
  .attr("font-family", "sans-serif")
    .attr("font-size", "18px")
    .style('fill', function ( datum ) {
        var fillColor = fillData[ datum.fillKey ];
        return fillColor || fillData.defaultFill;
        });


  bubbles.exit()
    .transition()
    .delay(options.exitDelay)
    .attr("r", 0)
    .remove();

  function datumHasCoords (datum) {
    return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
  }
}


