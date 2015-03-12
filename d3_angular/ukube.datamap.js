
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
      satellite : []
    }
  };

  /*************************************
   * Public plugin settings and methods
   ************************************/

  var plugin = {

    // settings for the plugin
    settings: {
      TLEurl : "mirror/cubesat.txt",
      satelliteName : "UKUBE-1                 ",
      trajectory : {
        past_mins: 360,
        post_mins: 360,
        steps: 720
      }
    },

    // constructor function
    init: function(){
      this.settings.satelliteName += String.fromCharCode(13); 
      this._target.innerHTML = "";
      this._target.classList.add("satellite-datamap");
      this._buildDatamap();
      this._pullTLEData();
    },



    /*************************************
     * Private methods for Datamaps
     ************************************/

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
        fills: {
          defaultFill: 'rgb(57, 118, 171)',
          UKUBE: '#444444'
        }
      });


      this._map.addPlugin('sat_trajectory', this._handleSatTrajectory);
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

      var index = TLEDataFull.indexOf(this.settings.satelliteName);
      if (index === -1)
        return;
      
      var TLEData = [];
      TLEData[0] = TLEDataFull[index];
      TLEData[1] = TLEDataFull[index+1];
      TLEData[2] = TLEDataFull[index+2];

      this._data.TLE = TLEData;
      this._buildSatellite();
      this._drawTrajectory();
      this._drawSatellite();
      this._startSatelliteTimer();
    },
                     
    _startSatelliteTimer : function(){
      if(typeof(this._timer)!=="undefined" && this._timer!==0)
        return;

      var that = this;
      this._timer = 
        setInterval(function(){
          that._drawSatellite();
        }, 5000);
    },


    _buildSatellite: function(){
      this._data.satellite = new satelliteModel(this._data.TLE);
    },

    _drawSatellite: function(){
      var latlng = this._data.satellite.getLatLng();

      this._satelliteMarker =
        this._map.bubbles([
          {
            radius: 10,
            fillKey: 'UKUBE',
            date: '1954-03-01',
            popupOnHover: false,
            latitude: latlng.latitude,
            longitude: latlng.longitude
          }], 
          {
            popupTemplate: function(geo, data) {
              return '';//  '<div class="hoverinfo">Info about UKUBE</div>';
            }
          }
        );
    },

    _drawTrajectory: function(){
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

      latlng = this._data.satellite.getLatLng(dt_list[0]);
      for (var i = 1; i<dt_list.length; i++){
        next_latlng = this._data.satellite.getLatLng(dt_list[i]);

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
          strokeColor: '#DD1C77', 
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


/*
 *
 * TODO: handle TLE and turn it into trajectory
 *
 * */
