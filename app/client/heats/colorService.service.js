'use strict';

function colorService() {

  var colors = [
    { name: "Red", value: "#FF0000" },
    { name: "Yellow", value: "#FFFF00" },
    { name: "Black", value: "#2E2E2E" },
    { name: "White", value: "#DBDBDB" },
    { name: "Green", value: "#00FF00" },
    { name: "Blue", value: "#0000FF" },
    { name: "Orange", value: "#FF9300" },
    { name: "Grey", value: "#808080" },
    { name: "Purple", value: "#800080" },
    { name: "Teal", value: "#008080" },
    { name: "Pink", value: "#FF1493" }
  ];

  var getLighterColor = function(color, percent) {
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
  };

  var hexToRgb = function(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  var getContrastingColor = function contrast(hexColor) {
    if(hexColor == '#FF0000') {
      return '#FFFFFF';
    }

    var rgbObject = hexToRgb(hexColor);

    var C, L;
    var R = rgbObject.r;
    var G = rgbObject.g;
    var B = rgbObject.b;

      C = [ R/255, G/255, B/255 ];

      for ( var i = 0; i < C.length; ++i ) {
        if ( C[i] <= 0.03928 ) {
          C[i] = C[i] / 12.92
        } else {
          C[i] = Math.pow( ( C[i] + 0.055 ) / 1.055, 2.4);
        }
      }

      L = 0.2126 * C[0] + 0.7152 * C[1] + 0.0722 * C[2];

      if ( L > 0.179 ) {
        return '#000000';
      } else {
        return '#FFFFFF';
      }
  };

   return {
     getLighterColor : getLighterColor,
     getContrastingColor: getContrastingColor,
     colors : colors
   };
}

module.exports = colorService;
