function Estimator(data, key){
  var properties =
  {
    data: [], // raw data
    key: '',  // the key for the y-axis in this.data
    y: {},    // list of data on y-axis,
    ddy: {},  // 2nd derivative of y.
    x_n: [],  // knots on the x-axis (i.e. time)
  };

  var plugin = {

    init: function(){
      this.organize();
      this.calculateDerivatives();
    },

    // run through each object entry
    // and calculate its 2nd derivative
    // with respect to this.key.
    calculateDerivatives: function(){

    },

    // return the interpolated value
    // for entry this.data[key][]
    estimate: function(x, key){

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
  plugin._extend(this, data);
  this.init();
}
