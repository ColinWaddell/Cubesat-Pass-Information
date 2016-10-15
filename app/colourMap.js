function colorLuminance(hex, lum) {

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

function colourMap(){
  var properties =
  {
    _colours: [
       {name : 'White',         code: '#DDD'},
       {name : 'Light Green', code: '#99b433'},
       {name : 'Blue',        code: '#2d89ef'},
       {name : 'Dark Green',  code: '#1e7145'},
       {name : 'Dark Blue',   code: '#2b5797'},
       {name : 'Light Purple',code: '#d57ddb'},
       {name : 'Dark Orange', code: '#da532c'},
       {name : 'Dark Purple', code: '#8274a7'},
       {name : 'Green',       code: '#00a300'},
       {name : 'Teal',        code: '#28908E'},
       {name : 'Orange',      code: '#e3a21a'},
       {name : 'Purple',      code: '#7e3878'},
       {name : 'Yellow',      code: '#ffc40d'},
       {name : 'Magenta',     code: '#E21B91'},
       {name : 'Dark Red',    code: '#b91d47'},
       {name : 'Red',         code: '#ee1111'},
       {name : 'defaultFill', code: '#89BDEA'}
    ],

    _fills: {},
    _index: 0
  };

  var plugin = {

    current: function(){
      return this._colours[this._index];
    },

    next: function(){
      if(this._index >= this._colours.length-1)
        this._index = 0;

      var colour = this._colours[this._index];
      this._index++;
      return colour;
    },

    init: function(){
      this._colours.forEach(function(value){
        var title = value.name;
        this._fills[title] = value.code;
      }.bind(this));
    },

    all: function(){
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
