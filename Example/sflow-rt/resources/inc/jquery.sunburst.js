// Copyright (c) 2021 InMon Corp. ALL RIGHTS RESERVED

(function ($) {
  "use strict";
  function hash(str, seed) {
    var i, l, hval = (seed === undefined) ? 0x811c9dc5 : seed;
    for (i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i);
      hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    return hval >>> 0;
  }

  function draw(ctx, cR, step, depth, startAngle, node, total, options) {
    var keys, start, i, child, end;

    if(!node.children) return;

    keys = Object.keys(node.children).sort();
    start = startAngle;
    for(i = 0; i < keys.length; i++) {
      child = node.children[keys[i]];

      end = start + ((child.value / total) * 2 * Math.PI);
      draw(ctx, cR + step, step, depth + 1, start, child, total, options);

      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0, 0, cR + step, start, end);
      ctx.closePath();
      ctx.fillStyle = options.colors[hash(keys[i],options.seed) % options.colors.length];
      ctx.strokeStyle = options.segmentOutlineColor;
      ctx.fill();
      ctx.stroke();

      start = end;
    }
  }

  function label(ctx, cR, step, depth, startAngle, node, total, options) {
    var keys, start, i, child, end, textSize, textAngle, textRadius;

    if(!node.children) return;

    keys = Object.keys(node.children).sort();
    start = startAngle;
    for(i = 0; i < keys.length; i++) {
      child = node.children[keys[i]];

      end = start + ((child.value / total) * 2 * Math.PI); 
      label(ctx, cR + step, step, depth + 1, start, child, total, options);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      textAngle = start + ((end - start) / 2);
      textRadius = cR + (step / 2);
      ctx.fillStyle = options.segmentTextColor;
      if(options.segmentFontRotate) { 
        textSize = Math.min(options.segmentFontSize, Math.floor((end - start) * cR));
        if(textSize > 0) {
          ctx.font = textSize + 'px ' + options.fontFamily;
          var width = ctx.measureText(keys[i]).width;
          if(width > step) {
            textSize = Math.floor(textSize * (step / width));
            ctx.font = textSize + 'px ' + options.fontFamily;
          }
          if(textSize > 0) {
            ctx.save();
            ctx.translate(textRadius * Math.cos(textAngle), textRadius * Math.sin(textAngle));
            if(textAngle > Math.PI * 0.5 && textAngle < Math.PI * 1.5) {
              ctx.rotate(Math.PI + textAngle);
            } else {
              ctx.rotate(textAngle);
            }
            ctx.fillText(keys[i], 0, 0);
            ctx.restore();
          }
        }
      } else {
        ctx.font = options.segmentFontSize + 'px ' + options.fontFamily;
        ctx.fillText(keys[i], textRadius * Math.cos(textAngle), textRadius * Math.sin(textAngle));
      }

      start = end; 
    } 
  }

  function center(ctx, cR, data, options) {
    ctx.beginPath();
    ctx.arc(0, 0, cR, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = options.centerColor;
    ctx.strokeStyle = options.centerOutlineColor;
    ctx.fill();
    ctx.stroke();

    if(data.label) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = options.centerFontSize + 'px ' + options.fontFamily;
      ctx.fillStyle = options.centerTextColor;
      ctx.fillText(data.label, 0, 0);
    } 
  }

  function findSegment(cR, step, depth, startAngle, node, total, radius, angle) {
    var keys, start, i, child, end, segment;

    if(!node.children) return null;

    keys = Object.keys(node.children).sort();
    start = startAngle;
    for(i = 0; i < keys.length; i++) {
      child = node.children[keys[i]];
      end = start + ((child.value / total) * 2 * Math.PI);
      if(start <= angle && end >= angle && radius >= cR && radius <= cR + step) {
        return {id:child.id,filter:child.filter};
      } 
      segment = findSegment(cR + step, step, depth + 1, start, child, total, radius, angle);
      if(segment) return segment;
      start = end;
    }
    return null;
  }

  function clickFunction(widget) {
    return function(e) { 
      var $canvas, data, off, cX, cY, cR, x, y, step, radius, angle, seg;
      data = widget._data;
      $canvas = $(widget._canvas);
      off = $canvas.offset();
      cX = ($canvas.width() / 2);
      cY = ($canvas.height() / 2);
      cR = widget.options.centerRadius;
      x = e.pageX - off.left - cX;
      y = e.pageY - off.top - cY;
      step = (Math.min(cX, cY) - cR) / data.depth;
      radius = Math.sqrt(x*x + y*y);
      angle = Math.atan2(y,x);
      if(angle < 0) angle += Math.PI*2;
      seg = findSegment(cR,step,0,0,data,data.value,radius,angle);
      if(seg) $canvas.trigger('sunburstclick', seg);
    }
  }

  $.widget('inmon.sunburst', {
    options: {
      clickable: false,
      fontFamily: 'sans-serif',
      centerRadius: 60,
      centerColor: '#ffffff',
      centerOutlineColor: '#000000',
      centerTextColor: '#000000',
      centerFontSize: 20,
      segmentOutlineColor: '#000000',
      segmentTextColor: '#f8f8ff',
      segmentFontSize: 15,
      segmentFontRotate: true,
      colors: [
        '#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6',
        '#dd4477', '#66aa00', '#b82e2e', '#316395', '#994499', '#22aa99',
        '#aaaa11', '#6633cc', '#e67300', '#8b0707', '#651067', '#329262',
        '#5574a6', '#3b3eac', '#b77322', '#16d620', '#b91383', '#f4359e',
        '#9c5935', '#a9c413', '#2a778d', '#668d1c', '#bea413', '#0c5922',
        '#743411'
      ]
    },
    _create: function() {
      this.element.addClass('sunburst');
      this._canvas = $('<canvas/>').appendTo(this.element);
      this._data = {};
      if(this.options.clickable) {
        this._canvas.addClass('clickable').click(clickFunction(this));
      }
    },
    _destroy: function() {
      if (this.options.clickable)
        this._canvas.removeClass('clickable').unbind('click');
      this.element.removeClass('sunburst');
      this.element.empty();
      delete this._canvas;
      delete this._data;
    },
    draw: function(data) {
      var canvas, ctx, h, w, ratio, colors, cX, cY, cR, step;
      canvas = this._canvas[0];
      if (!canvas || !canvas.getContext)
        return;

      this._data = data;

      ctx = canvas.getContext('2d');
      h = this._canvas.height();
      w = this._canvas.width();
      ratio = window.devicePixelRatio;
      if (ratio && ratio > 1) {
        canvas.height = h * ratio;
        canvas.width = w * ratio;
        ctx.scale(ratio, ratio);
      } else {
        canvas.height = h;
        canvas.width = w;
      }

      cX = w / 2;
      cY = h / 2;
      cR = this.options.centerRadius;
      step = (Math.min(cX, cY) - cR) / data.depth;

      ctx.translate(cX, cY);

      draw(ctx, cR, step, 0, 0, data, data.value, this.options);
      label(ctx, cR, step, 0, 0, data, data.value, this.options);
      center(ctx, cR, data, this.options);
    }
  });
})(jQuery);
