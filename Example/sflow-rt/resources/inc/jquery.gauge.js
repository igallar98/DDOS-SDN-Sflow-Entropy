(function ($) {
    "use strict";
    var suffixes = ["\uD835\uDF07", "\uD835\uDC5A", "", "K", "M", "G", "T", "P", "E"];

    function valueStr(value, includeMillis, base2) {
        if (value === 0)
            return value;
        var i = 2;
        var divisor = 1;
        var factor = base2 ? 1024 : 1000;
        var absVal, scaled, idx;
        if (includeMillis) {
            i = 0;
            divisor = base2 ? 1 / (1024 * 1024) : 0.000001;
        }
        absVal = Math.abs(value);
        while (i < suffixes.length) {
            if ((absVal / divisor) < factor)
                break;
            divisor *= factor;
            i++;
        }
        scaled = (Math.round(absVal * factor / divisor) / factor).toString();
        idx = scaled.indexOf('.');
        if(scaled.length > 3 && idx > 0) scaled = scaled.substring(0,idx >= 3 ? idx : 4); 
        return scaled + suffixes[i];
    }

    function polarToCartesian(x, y, radius, angle) {
        var radians = (angle - 90) * Math.PI / 180.0;
        return [Math.round((y + (radius * Math.cos(radians))) * 100) / 100, Math.round((y + (radius * Math.sin(radians))) * 100) / 100];
    };

    function svgArcPath(x, y, radius, start_angle, end_angle) {
        var end_xy, start_xy;
        start_xy = polarToCartesian(x, y, radius, end_angle);
        end_xy = polarToCartesian(x, y, radius, start_angle);
        return "M " + start_xy[0] + " " + start_xy[1] + " A " + radius + " " + radius + " 0 0 0 " + end_xy[0] + " " + end_xy[1];
    };

    function scaleValue(value, maxValue, logScale) {
       var min = 0, max = maxValue, val = value;
       if(logScale) {
         max = Math.log10(max+1);
         min = Math.log10(min+1);
         val = Math.log10(val+1);
       }
       return Math.min(90,(val * 180 / (max - min)) - 90); 
    }

    $.widget('inmon.gauge', {
        options: {
            includeMillis: false,
            base2: false,
            logScale: false,
            counter: false,
            value: 0,
            threshold: 0,
            maxValue: 100,
            label: 'Value',
            suffix: '',

            // counter state
            prevValue: 0,
            prevTime: 0
        },
        valueStr: valueStr,
        _create: function () {
            var option = this.options, svg;
            this.element.addClass('gauge');
            if(option.threshold && option.value >= option.threshold) this.element.addClass('warn');
            svg = '<svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">';
            var value = option.value;
            if(option.counter) {
              option.prevValue = value;
              option.prevTime = value ? Date.now() : 0;
              value = 0;
            }
            if(option.maxValue) {
               svg += '<path d="' + svgArcPath(0, 500, 450, -90, 90) + '"></path>';
               svg += '<path class="data-arc" d="' + svgArcPath(0, 500, 450, -90, scaleValue(value,option.maxValue,option.logScale)) + '"></path>';
            }
            svg += '<text class="value" text-anchor="middle" alignment-baseline="bottom" x="500" y="320" font-size="130" font-weight="normal">';
            svg += '<tspan>'+valueStr(value,option.includeMillis,option.base2)+'</tspan>';
            if(option.suffix) svg += '<tspan font-size="100"> '+option.suffix+'</tspan>';
            svg += '</text>';
            svg += '<text class="title" text-anchor="middle" alignment-baseline="middle" x="500" y="450" font-size="90" font-weight="normal">'+option.label+'</text>';
            svg += '</svg>'; 
            this._svg = $(svg).appendTo(this.element);
        },
        _destroy: function () {
            this.element.removeClass('gauge');
            this.element.removeClass('warn');
            this.element.empty();
            delete this._svg;
        },
        update: function (vars) {
            var rate, option = this.options, svg = this._svg, now = Date.now();
            if (!svg) return;

            var value = vars.value || option.value;
            if(option.counter) {
              rate = 0;
              if(option.prevTime) {
                rate = 1000 * Math.max(0, value - option.prevValue) / (now - option.prevTime);
              }
              option.prevTime = now;
              option.prevValue = value;
              value = rate;
            }
            var maxValue = vars.maxValue || option.maxValue;
            var threshold = vars.threshold || option.threshold;
            if(threshold && value >= threshold) this.element.addClass('warn');
            else this.element.removeClass('warn');

            var label = valueStr(value,option.includeMillis,option.base2);
            svg.find('.value tspan:first').text(label);
            if(maxValue) {
              svg.find('.data-arc').attr('d',svgArcPath(0, 500, 450, -90, scaleValue(value,maxValue,option.logScale)));
            }
        }
    });
})(jQuery);
