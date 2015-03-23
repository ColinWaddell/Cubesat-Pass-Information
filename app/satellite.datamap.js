
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

Date.prototype.subTime= function(h,m){
  this.setHours(this.getHours()-h);
  this.setMinutes(this.getMinutes()-m);
  return this;
}

Date.prototype.addTime= function(h,m){
  this.setHours(this.getHours()+h);
  this.setMinutes(this.getMinutes()+m);
  return this;
}

function colourMap(){
  var properties = 
  {
    _colours: [
       {name : 'RED',code: '#FF0000'},
       {name : 'GREEN',code: '#00FF00'},
       {name : 'BLUE',code: '#0000FF'},
       {name : 'defaultFill', code: 'rgb(57, 118, 171)'},
       {name : 'UKUBE',code: '#444444'}
    ],

    _fills: {},
    _index: 0
  };

  var plugin = {

    next: function(){
      if(this._index >= this._colours.length)
        this._index = 0;

      return this._colours[this._index++];
    },
    
    init: function(){
      this._colours.forEach(function(value){
        var title = value.name;
        this._fills[title] = value.code;
      }.bind(this));
    },

    allFills: function(){
      return this._fills;
    },


    // replacement for $.extend
    _extend: function(destination, source) {
      var property;
      for (property in source) {
        if (source.hasOwnProperty(property)){
          if(source[property] && source[property].constructor && source[property].constructor === Object) {
            destination[property] = destination[property] || {};
            this._extend(destination[property], source[property]);
          }
          else {
            destination[property] = source[property];
          }
        }
      }
      return destination;
    }

  }

  plugin._extend(this, plugin);
  plugin._extend(this, properties);
  this.init();
}

function satelliteModel(TLEData){
  var properties = 
  {
    _data:{
      TLE:[]
    }
  };

  var plugin = {
    settings: {

    },

    init: function(TLEData){
      this._data.TLE = TLEData;
      this.updateModel();
    },

    updateModel: function(TLEData){
      // Make sure we've got valid TLE to work with
      if (typeof(TLEData)!=="object")
        TLEData = this._data.TLE;

      if (typeof(TLEData)!=="object")
        return;

      // Update our TLE data
      this._data.TLE = TLEData; 

      // Build our satellite
      this.satellite = satellite.twoline2satrec (
                        this._data.TLE[1], 
                        this._data.TLE[2]);
    },

    name: function(){
      var name = this._data.TLE[0];
      name = name.slice(0,name.search("  "));
      return name;
    },

    getLatLng: function(datetime){

      var now;
      if (typeof(datetime)==="undefined")
        now = new Date();
      else
        now = new Date(datetime);

      // NOTE: while Javascript Date returns months in range 0-11, all satellite.js methods require months in range 1-12.
      var position_and_velocity = satellite.propagate (
                                    this.satellite,
                                    now.getUTCFullYear(), 
                                    now.getUTCMonth() + 1, // Note, this function requires months in range 1-12. 
                                    now.getUTCDate(),
                                    now.getUTCHours(), 
                                    now.getUTCMinutes(), 
                                    now.getUTCSeconds());

      // The position_velocity result is a key-value pair of ECI coordinates.
      // These are the base results from which all other coordinates are derived.
      var position_eci = position_and_velocity["position"];

      // You will need GMST for some of the coordinate transforms
      // Also, be aware that the month range is 1-12, not 0-11.
      var gmst = satellite.gstime_from_date (now.getUTCFullYear(), 
                                             now.getUTCMonth() + 1, // Note, this function requires months in range 1-12. 
                                             now.getUTCDate(),
                                             now.getUTCHours(), 
                                             now.getUTCMinutes(), 
                                             now.getUTCSeconds());


      // You can get ECF, Geodetic, Look Angles, and Doppler Factor.
      var position_gd    = satellite.eci_to_geodetic (position_eci, gmst);

      // Geodetic coords are accessed via "longitude", "latitude", "height".
      var longitude = position_gd["longitude"];
      var latitude  = position_gd["latitude"];

      //  Convert the RADIANS to DEGREES for pretty printing (appends "N", "S", "E", "W". etc).
      var longitude_str = satellite.degrees_long (longitude);
      var latitude_str  = satellite.degrees_lat  (latitude);          

      return { longitude: longitude_str, latitude: latitude_str };
    },

    // replacement for $.extend
    _extend: function(destination, source) {
      var property;
      for (property in source) {
        if (source.hasOwnProperty(property)){
          if(source[property] && source[property].constructor && source[property].constructor === Object) {
            destination[property] = destination[property] || {};
            this._extend(destination[property], source[property]);
          }
          else {
            destination[property] = source[property];
          }
        }
      }
      return destination;
    }

  }

  plugin._extend(this, plugin);
  plugin._extend(this, properties);
  this.init(TLEData);
}

function satelliteDatamap(target, settings){
  var properties = 
  {
    _map : [] ,
    _target : [],
    _data : {
      TLE : [],
      satellite : [],
      colours : new colourMap() 
    }
  };

  /*************************************
   * Public plugin settings and methods
   ************************************/

  var plugin = {
    // settings for the plugin
    settings: {
      TLEurl : "mirror/mirror.php?url=http://www.celestrak.com/NORAD/elements/cubesat.txt",
      satelliteName : ["UKUBE-1", "WNISAT-1"],
      trajectory : {
        past_mins: 360,
        post_mins: 360,
        steps: 720
      }
    },

    // constructor function
    init: function(){
      this._target.innerHTML = "";
      this._target.classList.add("satellite-datamap");
      this._data.colourMap = new colourMap();
      this._buildDatamap();
      this._pullTLEData();
      this._startSatelliteTimer();          
    },

    /*************************************
     * Private methods for Datamaps
     ************************************/
     
    // Take a satellite name and return it as a 
    // correctly formatted TLE identifier
    _nameToTLEString: function(satelliteName){
      var blankName = "                        " + String.fromCharCode(13);
      if (!satelliteName.length || satelliteName.length > blankName.length){
        satelliteName = "UKUBE-1                 ";
      }

      return satelliteName + blankName.slice(satelliteName.length,blankName.length);    
    },


    // take repo activity data and format for d3
    _buildDatamap: function(){

      this._map = new Datamap({
        element: this._target,
        scope: 'world',
        projection: 'equirectangular',
        geographyConfig: {
            hideAntarctica: true,
            popupOnHover: false, //disable the popup while hovering
            highlightOnHover: false
        },
        fills: this._data.colours.allFills()
      });

      this._map.addPlugin('sat_trajectory', this._handleSatTrajectory);
      this._map.addPlugin('sat_marker', this._handleSatMarker);
      this._map.addPlugin('move_marker', this._moveSatMarker);
    },


    _moveSatMarker: function(later, data, options){
      var self = this;

      function datumHasCoords (datum) {
        return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
      }

      d3.select('#'+data.name)
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
        });
    },

    _handleSatMarker: function (layer, data, options ) {

      function datumHasCoords (datum) {
        return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
      }

      var self = this,
          fillData = this.options.fills,
          svg = this.svg;

      if ( !data || (data && !data.slice) ) {
        throw "Datamaps Error - bubbles must be an array";
      }

      var bubbles = layer.selectAll('circle.datamaps-satmarker').data( data, JSON.stringify );

      bubbles
        .enter()
          .append('svg:circle')
          .attr('class', 'datamaps-satmarker')
          .attr('id', function (datum){
            return typeof datum.name !== 'undefined' ? datum.name : '';
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

      bubbles.exit()
        .transition()
          .delay(options.exitDelay)
          .attr("r", 0)
          .remove();

    },


    _handleSatTrajectory: function (layer, data, options) {
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
              var opacity = Math.pow(datum.index < (totalNodes/2) ? (2*datum.index)/totalNodes : 2 - ((2*datum.index)/totalNodes), 4);
              return Number(opacity).noExponents();
          });
    },

    /*************************************
     * private AJAX methods and handlers
     *************************************/

    // grab json user data
    _pullTLEData: function(){
      this._pullData(
        this.settings.TLEurl, 
        this._handleTLEData, 
        "Error Loading User Data"
      );
    },

    _handleTLEData : function (data){
      if(typeof(data)!=="string")
        return;

      var TLEDataFull = data.split('\n');
      if(typeof(TLEDataFull)!=="object")
        return;

      var satList = [];

      if (typeof(this.settings.satelliteName)==="string"){
        // Sat name needs to be in correct format to search TLE Data
        satList[0] = this._nameToTLEString(this.settings.satelliteName);
      }
      else if (Array.isArray(this.settings.satelliteName)){
        // Copy elements over and convert as we go
        this.settings.satelliteName.forEach(function(satName){
          satList.push(this._nameToTLEString(satName));
        }.bind(this)); 
      }
      else{
        console.log("error loading satellite names");
        return;
      }

      satList.forEach(function(satName){
        var satellite = this._buildSatelliteFromTLEName(satName, TLEDataFull);
        this._data.satellite.push(satellite);
        this._drawTrajectory(satellite);
      }.bind(this));

    },

    _buildSatelliteFromTLEName: function(satName, TLEData){
      var index = TLEData.indexOf(satName);
      if (index === -1)
        return;
      
      var SatTLEData = [];
      SatTLEData[0] = TLEData[index];
      SatTLEData[1] = TLEData[index+1];
      SatTLEData[2] = TLEData[index+2];

      var satellite = new satelliteModel(SatTLEData);

      return satellite;
    },
                     
    _startSatelliteTimer : function(satellite){
      if(typeof(this._timer)!=="undefined" && this._timer!==0)
        return;

      var that = this;
      this._timer = 
        setInterval(function(){
          that._updateSatellites();
        }, 1000);
    },

    _updateSatellites: function(){

      if(typeof this._data.satellite == 'undefined')
        return;

      if(typeof this._data.satelliteMarkers !== 'undefined'){
        this._data.satellite.forEach(function(sat){
          sat.updateModel();

          var latlng = sat.getLatLng();
          var marker = {
            latitude: latlng.latitude,
            longitude: latlng.longitude,
            name: sat.name()
          };

          this._map.move_marker(marker,{});  
        }.bind(this));
      }
      else{
        this._data.satelliteMarkers = [];

        this._data.satellite.forEach(function(sat){
          var marker = this._buildSatelliteMarker(sat);
          this._data.satelliteMarkers.push(marker);
          this._drawSatellite(marker);
        }.bind(this));     

      }

    },

    _buildSatelliteMarker: function(satellite){
      var latlng = satellite.getLatLng();

      if (!Array.isArray(this._data.satelliteMarkers)){
        this._data.satelliteMarkers = [];
      }

      satellite.marker = {
        radius: 10,
        date: '1954-03-01',
        popupOnHover: false,
        latitude: latlng.latitude,
        longitude: latlng.longitude,
        fillKey: this._data.colours.next().name,
        name: satellite.name()
      };

      return satellite.marker;
    },

    _drawSatellite: function(marker){
      this._map.sat_marker([marker],{
        popupTemplate: function(geo, data) {
          return '';//  '<div class="hoverinfo">Info about UKUBE</div>';
      }});
    },

    _drawTrajectory: function(satellite){
      var dt_list = [];
      var dt_step_mins = (this.settings.trajectory.post_mins + this.settings.trajectory.past_mins) / this.settings.trajectory.steps;
      var dt_val;
      var dt_from = new Date();
      var dt_to = new Date();
      var latlng, next_latlng;
      var trajectories = []

      dt_from.subTime(0, this.settings.trajectory.past_mins);
      dt_to.addTime(0, this.settings.trajectory.post_mins);

      dt_val = dt_from;
      while(dt_val < dt_to){
        dt_list.push(new Date(dt_val));
        dt_val.addTime(0, dt_step_mins);
      }

      latlng = satellite.getLatLng(dt_list[0]);
      for (var i = 1; i<dt_list.length; i++){
        next_latlng = satellite.getLatLng(dt_list[i]);

        if (next_latlng.longitude < latlng.longitude){
          trajectories.push({
            "origin":  latlng,
            "destination": next_latlng
          }); 
        }

        latlng = next_latlng;
      }

      this._map.sat_trajectory(
        trajectories,  
        {
          strokeWidth: 1, 
          strokeColor: this._data.colours.next().code, 
          animationSpeed: 1000
        });
    },

    /*************************************
     * jquery replacement methods
     *************************************/

    // replacement for $.extend
    _extend: function(destination, source) {
      var property;
      for (property in source) {
        if (source.hasOwnProperty(property)){
          if(source[property] && source[property].constructor && source[property].constructor === Object) {
            destination[property] = destination[property] || {};
            this._extend(destination[property], source[property]);
          }
          else {
            destination[property] = source[property];
          }
        }
      }
      return destination;
    },

    // replacement for $.ajax
    _pullData: function(url, success, errorMessage){
      var xhr = new XMLHttpRequest();
      var that = this;

      xhr.open("GET", url, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4){
          if (typeof(xhr.response) !== "undefined") {
            success.call(that, xhr.response);
          }
          else{
            that._showMessage(errorMessage);
          }
        }

      };
      xhr.send();         
    }

  };

  plugin._extend(this, plugin);
  plugin._extend(this, properties);
  plugin._extend(this.settings, settings);
  this._target = document.getElementById(target);
  this.init();
}

var mymap = new satelliteDatamap('container');
