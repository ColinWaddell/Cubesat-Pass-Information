
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


function satelliteDatamap(target, settings){
  var properties = 
  {
    _map : [] ,
    _target : [],
  };


  /*************************************
   * Public plugin settings and methods
   ************************************/

  var plugin = {

    // settings for the plugin
    settings: {
      TLEurl : "mirror/cubesat.txt",
      satelliteName : "UKUBE-1                 "
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
              console.log(Number(opacity).noExponents());
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

      // Take TLE data and turn into trajectories.
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
