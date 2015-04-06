function colourMap(){
  var properties = 
  {
    _colours: [
       {name : 'Light Green', code: '#99b433'},
       {name : 'Blue',        code: '#2d89ef'},
       {name : 'Dark Green',  code: '#1e7145'},
       {name : 'Dark Blue',   code: '#2b5797'},
       {name : 'Light Purple',code: '#9f00a7'},
       {name : 'Dark Orange', code: '#da532c'},
       {name : 'Dark Purple', code: '#603cba'},
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

