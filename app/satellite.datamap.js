
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
  this.setMilliseconds(this.getMilliseconds()-(m*60000));
  return this;
}

Date.prototype.addTime= function(h,m){
  this.setHours(this.getHours()+h);
  this.setMilliseconds(this.getMilliseconds()+(m*60000));
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

    name: function(){
      var name = this._data.TLE[0];
      name = name.slice(0,name.search("  "));
      return name;
    },

    nameID: function(){
      var valid_name = this.name();
      valid_name = valid_name.replace(/\W/g,'_');
      return valid_name;
    },

    getColour: function(){
      console.log(this);
    },

    getAttitude: function(datetime, forcenew){

      if(!this._data.attitude) this._data.attitude = {'time':0, 'backup': {}};

      var now;
      if (typeof(datetime)==="undefined" || datetime===null)
        now = new Date();
      else
        now = new Date(datetime);

      if(!forcenew && this._data.attitude.time && (performance.now() - this._data.attitude.time) < 1000)
        return this._data.attitude.backup;

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
      var velocity_eci = position_and_velocity["velocity"];
      var velocity = Math.sqrt(
                      Math.pow(velocity_eci.x, 2) +
                      Math.pow(velocity_eci.y, 2) +
                      Math.pow(velocity_eci.z, 2)
                    ) * 3600;

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
      var heightkm  = position_gd["height"];

      //  Convert the RADIANS to DEGREES for pretty printing (appends "N", "S", "E", "W". etc).
      var longitude_str = satellite.degrees_long (longitude);
      var latitude_str  = satellite.degrees_lat  (latitude);

      var attitude = {
        longitude: longitude_str,
        latitude: latitude_str,
        altitude: heightkm,
        velocity: velocity
      };

      this._data.attitude.time = performance.now();
      this._data.attitude.backup = attitude;
      return attitude;
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
      TLEurl : [
        "mirror/mirror.php?url=http://www.celestrak.com/NORAD/elements/resource.txt",
        "mirror/mirror.php?url=http://www.celestrak.com/NORAD/elements/cubesat.txt"

      ],
      satelliteName : [],
      trajectory : {
        past_mins: 180,
        post_mins: 180,
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
      this._startRedrawTimer();
    },

    getSatelliteInfo: function(name){

      var n = 0;
      var sat_n = null;

      this._data.satellite.forEach(function(sat){
        if (typeof(sat)==="undefined") return;
        if(sat.name()==name) sat_n = sat;
      });

      if (sat_n==null) return null;

      var sat_info = {
        'name': sat_n.name(),
        'colour': sat_n.colour.code,
        'attitude': sat_n.getAttitude()
      };

      return sat_info;
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
        fills: this._data.colours.all()
      });

      this._map.addPlugin('sat_trajectory', handleSatTrajectory);
      this._map.addPlugin('sat_marker', handleSatMarker);
      this._map.addPlugin('move_marker', moveSatMarker);
    },

    /*************************************
     * private AJAX methods and handlers
     *************************************/

    // grab json user data
    _pullTLEData: function(){
      var that = this;
      this.settings.TLEurl.forEach(
        function(tleurl){
          that._pullData(
            tleurl,
            that._handleTLEData,
            "Error Loading User Data"
          );
        });
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
          var name = this._nameToTLEString(satName)
          satList.push(name);
        }.bind(this));
      }
      else{
        console.log("error loading satellite names");
        return;
      }

      satList.forEach(function(satName){
        var satellite = this._buildSatelliteFromTLEName(satName, TLEDataFull);

        if(!satellite) return;

        var colour = this._data.colours.next();
        satellite.colour = colour;
        this._data.satellite.push(satellite);
        this._drawTrajectory(satellite);

        if(typeof(this._data.satelliteMarkers)==="undefined")
          this._data.satelliteMarkers = [];

        // Draw Marker
        var marker = this._buildSatelliteMarker(satellite);
        this._data.satelliteMarkers.push(marker);
        this._drawSatellite(marker);
      }.bind(this));

    },

    _buildSatelliteFromTLEName: function(satName, TLEData){
      var index = TLEData.indexOf(satName);
      if (index === -1){
        return;
      }

      var SatTLEData = [];
      SatTLEData[0] = TLEData[index];
      SatTLEData[1] = TLEData[index+1];
      SatTLEData[2] = TLEData[index+2];

      var satellite = new satelliteModel(SatTLEData);

      return satellite;
    },

    /*************************************
     * Timer code
     *************************************/

    _startSatelliteTimer : function(satellite){
      if(typeof(this._timer)!=="undefined" && this._timer!==0)
        if(typeof(this._timer)==="number")
          clearTimeout(this._timer);
        else
          return;

      this._timer = setTimeout(this._satelliteTimerThread.bind(this), 1000);
    },

    _satelliteTimerThread: function(){
      this._updateSatellites();
      this._timer = setTimeout(this._satelliteTimerThread.bind(this), 1000);
    },

    _startRedrawTimer : function(){
      if(typeof(this._redrawTimer )!=="undefined" && this._redrawTimer !==0)
        return;

      this._redrawTimer = setTimeout(this._redrawTimerThread.bind(this), 900000);
    },

    _redrawTimerThread: function(){
      this._redraw();
      this._redrawTimer = setTimeout(this._redrawTimerThread.bind(this), 900000);
    },

    /*************************************
     * Redraw Code
     *************************************/

    _updateSatellites: function(){

      if(typeof this._data.satellite === 'undefined' || !this._data.satellite.length)
        return;

      if(typeof this._data.satelliteMarkers !== 'undefined'){
        this._data.satellite.forEach(function(sat){
          if(!sat) return;

          var latlng = sat.getAttitude();
          var marker = {
            latitude: latlng.latitude,
            longitude: latlng.longitude,
            id: sat.nameID(),
            name: sat.name()
          };

          this._map.move_marker(marker,marker);
        }.bind(this));
      }
    },

    _redraw: function(){

      if(typeof this._data.satellite === 'undefined' || !this._data.satellite.length)
        return;

      d3.selectAll('path.datamaps-arc').remove();
      d3.selectAll('circle.datamaps-bubble').remove();
      d3.selectAll('text.satellite-label').remove();

      this._data.satellite = [];
      this._data.satelliteMarkers = [];

      this._pullTLEData();
    },

    _buildSatelliteMarker: function(satellite){
      if(!satellite) return;

      var latlng = satellite.getAttitude(null, true);

      if (!Array.isArray(this._data.satelliteMarkers)){
        this._data.satelliteMarkers = [];
      }

      satellite.marker = {
        radius: 8,
        date: '1954-03-01',
        latitude: latlng.latitude,
        longitude: latlng.longitude,
        popupOnHover: true,
        fillKey: satellite.colour.name,
        id: satellite.nameID(),
        name: satellite.name()
      };

      return satellite.marker;
    },

    _drawSatellite: function(marker){
      this._map.sat_marker([marker],{
        popupTemplate: function(geo, data) {
          return '<div class="hoverinfo">Info about UKUBE</div>';
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

      if(satellite){
        latlng = satellite.getAttitude(dt_list[0], true);
        for (var i = 1; i<dt_list.length; i++){
          next_latlng = satellite.getAttitude(dt_list[i], true);

          if (Math.abs(next_latlng.longitude - latlng.longitude) < 170){
            trajectories.push({
              "origin":  latlng,
              "destination": next_latlng
            });
          }

          latlng = next_latlng;
        }
      }

      this._map.sat_trajectory(
        trajectories,
        {
          strokeWidth: 1,
          strokeColor: satellite.colour.code,
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
