// Copyright (c) 2018 InMon Corp. ALL RIGHTS RESERVED

(function ($) {
    "use strict";
    var fps = 60;

    var requestAnimationFrame = window.requestAnimationFrame
            || window.mozRequestAnimationFrame
            || window.webkitRequestAnimationFrame
            || window.oRequestAnimationFrame
            || window.msRequestAnimationFrame
            || function (f) {
                return setTimeout(f, 1000 / fps);
            };

    var twoPi = Math.PI * 2;
    var damping = 1 / fps;

    function pointDist(x1, y1, x2, y2) {
        var vx = x2 - x1;
        var vy = y2 - y1;
        return Math.sqrt((vx * vx) + (vy * vy));
    }

    $.widget('inmon.flow', {
        options: {
            highlightColor: 'black',
            velocity: 0.1,
            radius: 2,
            color: 'blue',
            maxProbability: 0.1,
            maxParticles: 5000,
            axisShow: true,
            axisColor: '#eee',
            axisLabelColor: '#eee',
            colors: [
                '#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6',
                '#dd4477', '#66aa00', '#b82e2e', '#316395', '#994499', '#22aa99',
                '#aaaa11', '#6633cc', '#e67300', '#8b0707', '#651067', '#329262',
                '#5574a6', '#3b3eac', '#b77322', '#16d620', '#b91383', '#f4359e',
                '#9c5935', '#a9c413', '#2a778d', '#668d1c', '#bea413', '#0c5922',
                '#743411'
            ]
        },

        _create: function () {
            var _canvas, info, canvas, h, w, ctx, locs;
            var option = this.options;
            var stop = false;
            var particles = {};
            var nparticles = 0;
            var pid = 0;
            var prev = 0;
            var particleRate = 0;
            var maxParticleRate = option.maxParticles > 0 ? (option.maxParticles / (1 / Math.min(1, option.velocity))) / fps : 0;
            var ratio = window.devicePixelRatio;
            var _this = this;

            this.flows = {};

            function flowX(flow, t) {
                return Math.pow(1 - t, 2) * flow.startX + 2 * (1 - t) * t * 0.5 + Math.pow(t, 2) * flow.endX;
            }
            function flowY(flow, t) {
                return Math.pow(1 - t, 2) * flow.startY + 2 * (1 - t) * t * 0.5 + Math.pow(t, 2) * flow.endY;
            }

            function hash(str, seed) {
                var i, l, hval = (seed === undefined) ? 0x811c9dc5 : seed;
                for (i = 0, l = str.length; i < l; i++) {
                    hval ^= str.charCodeAt(i);
                    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
                }
                return hval >>> 0;
            }

            function getColor(flow) {
                if (flow.color)
                    return flow.color;
                if (!flow.hasOwnProperty('type'))
                    return option.color;
                if (typeof flow.type === 'number')
                    return option.colors[Math.round(flow.type) % option.colors.length];
                return option.colors[hash(flow.type.toString(), option.seed) % option.colors.length];
            }

            function clear() {
                ctx.clearRect(0, 0, w, h);

                if (option.axisShow) {
                    ctx.strokeStyle = option.axisColor;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(w, h);
                    ctx.moveTo(0, h);
                    ctx.lineTo(w, 0);
                    ctx.stroke();
                }

                if (option.axisN) {
                    ctx.font = '40px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = option.axisLabelColor;
                    ctx.fillText(option.axisN, w * 0.5, h * 0.1);
                }
                if (option.axisS) {
                    ctx.font = '40px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.fillStyle = option.axisLabelColor;
                    ctx.fillText(option.axisS, w * 0.5, h * 0.9);
                }
                if (option.axisW) {
                    ctx.font = '40px sans-serif';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = option.axisLabelColor;
                    ctx.fillText(option.axisW, w * 0.1, h * 0.5);
                }
                if (option.axisE) {
                    ctx.font = '40px sans-serif';
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = option.axisLabelColor;
                    ctx.fillText(option.axisE, w * 0.9, h * 0.5);
                }
            }

            function highlightParticle(mouseX, mouseY) {
                var i, mx, my, lh, ll, lr, loc, meas, locMin, dist;
                var distMin = 2;
                var locMin;
                var x = mouseX / w;
                var y = mouseY / h;
                var th = 14;
                var r = 4;
                var loff = 10;
                var font = (th - 2).toString() + 'px sans-serif';
                clear();
                for (i = 0; i < locs.length; i++) {
                    loc = locs[i];
                    dist = pointDist(x, y, loc.x, loc.y);
                    if (dist < distMin) {
                        distMin = dist;
                        locMin = loc;
                    }
                    ctx.beginPath();
                    ctx.arc(loc.x * w, loc.y * h, loc.r, 0, twoPi);
                    ctx.fillStyle = getColor(loc.flow);
                    ctx.fill();
                }
                if (locMin) {
                    mx = locMin.x * w;
                    my = locMin.y * h;

                    ctx.beginPath();
                    ctx.arc(mx, my, locMin.r + 4, 0, twoPi);
                    ctx.fillStyle = option.highlightColor;
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(mx, my, locMin.r, 0, twoPi);
                    ctx.fillStyle = getColor(locMin.flow);
                    ctx.fill();

                    info = locMin.flow.info;
                    if (!info)
                        return;

                    ll = 0;
                    lr = 0;
                    for (i = 0; i < info.length; i++) {
                        ctx.font = 'bold ' + font;
                        meas = ctx.measureText(info[i].name);
                        ll = Math.max(ll, meas.width);
                        ctx.font = font;
                        meas = ctx.measureText(info[i].value);
                        lr = Math.max(lr, meas.width);
                    }

                    ll += 4;
                    lr += 4;
                    lh = info.length * th;
                    if (my + loff + lh > h)
                        my -= (lh + loff);
                    else
                        my += loff;
                    if (mx + lr + loff > w)
                        mx -= lr + loff;
                    else if (mx - loff < ll)
                        mx += ll + loff;

                    ctx.fillStyle = '#fff';
                    ctx.strokeStyle = '#000';
                    ctx.beginPath();
                    ctx.moveTo(mx - ll + r, my);
                    ctx.lineTo(mx + lr - r, my);
                    ctx.quadraticCurveTo(mx + lr, my, mx + lr, my + r);
                    ctx.lineTo(mx + lr, my + lh - r);
                    ctx.quadraticCurveTo(mx + lr, my + lh, mx + lr - r, my + lh);
                    ctx.lineTo(mx - ll + r, my + lh);
                    ctx.quadraticCurveTo(mx - ll, my + lh, mx - ll, my + lh - r);
                    ctx.lineTo(mx - ll, my + r);
                    ctx.quadraticCurveTo(mx - ll, my, mx - ll + r, my);
                    ctx.closePath();
                    ctx.globalAlpha = 1.0;
                    ctx.stroke();
                    ctx.globalAlpha = 0.8;
                    ctx.fill();

                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = '#000';
                    ctx.textBaseline = 'top';
                    for (i = 0; i < info.length; i++) {
                        ctx.textAlign = 'right';
                        ctx.font = 'bold ' + font;
                        ctx.fillText(info[i].name, mx - 2, th * i + my);
                        ctx.font = font;
                        ctx.textAlign = 'left';
                        ctx.fillText(info[i].value, mx + 2, th * i + my);
                    }
                }
            }

            this.element.addClass('flow');
            if (option.height)
                this.element.css('height', option.height);
            if (option.width)
                this.element.css('width', option.width);
            _canvas = $('<canvas/>').appendTo(this.element);
            this._canvas = _canvas;
            _canvas.click(function (e) {
                if (info)
                    _canvas.trigger('flowclick', {info: info});
            })
                    .mousemove(function (e) {
                        if (!locs)
                            return;

                        var position = $(this).position();
                        var x = e.pageX - position.left;
                        var y = e.pageY - position.top;

                        highlightParticle(x, y);
                    })
                    .hover(
                            function (e) {
                                var id, particle, flow, t;
                                stop = true;
                                locs = [];
                                for (id in particles) {
                                    particle = particles[id];
                                    flow = particle.flow;
                                    t = particle.t;
                                    locs.push({
                                        x: flowX(flow, t),
                                        y: flowY(flow, t),
                                        r: particle.r,
                                        flow: flow
                                    });
                                }
                            },
                            function (e) {
                                stop = false;
                                locs = null;
                                info = null;
                            }
                    );

            canvas = _canvas[0];

            function initializeCanvas() {
                ctx = canvas.getContext('2d');
                h = _canvas.height();
                w = _canvas.width();

                if (ratio && ratio > 1) {
                    canvas.height = h * ratio;
                    canvas.width = w * ratio;
                    ctx.scale(ratio, ratio);
                } else {
                    canvas.height = h;
                    canvas.width = w;
                }
            }

            $(window).resize(initializeCanvas);
            initializeCanvas();

            function update(flows, now) {
                var i, flow, particle, x, y, t, r, p, dt, np, pk, id;
                dt = (prev ? now - prev : 0) / 1000;
                prev = now;
                if (!stop)
                    clear();

                pk = 1;
                if (maxParticleRate > 0 && particleRate > 0) {
                    pk = Math.max(0, 1 - (particleRate / maxParticleRate));
                }

                np = nparticles;
                for (i = 0; i < _this.flows.length; i++) {
                    flow = _this.flows[i];
                    p = flow.frequency / fps;
                    r = option.radius;
                    if (p > option.maxProbability) {
                        r *= Math.sqrt(p / option.maxProbability);
                        p = option.maxProbability;
                    }
                    if (Math.random() < p * pk) {
                        particle = {flow: flow, t: 0, r: r};
                        particles[pid++] = particle;
                        nparticles++;
                    }
                }
                particleRate = particleRate * (1 - damping) + (nparticles - np) * damping;

                for (id in particles) {
                    particle = particles[id];
                    particle.t += option.velocity * dt;
                    if (particle.t > 1) {
                        delete particles[id];
                        nparticles--;
                    } else if (!stop) {
                        flow = particle.flow;
                        t = particle.t;
                        r = particle.r;
                        x = flowX(flow, t);
                        y = flowY(flow, t);
                        ctx.beginPath();
                        ctx.arc(x * w, y * h, r, 0, twoPi);
                        ctx.fillStyle = getColor(flow);
                        ctx.fill();
                    }
                }
            }

            function animate(now) {
                update(_this.flows, now || Date.now());
                _this.id = requestAnimationFrame(animate);
            }
            _this.id = requestAnimationFrame(animate);
        },

        data: function (update) {
            var i, flow;
            for (i = 0; i < update.length; i++) {
                flow = update[i];

                switch (flow.startSide.toLowerCase()) {
                    case 'n':
                        flow.startX = flow.startVal;
                        flow.startY = 0;
                        break;
                    case 's':
                        flow.startX = flow.startVal;
                        flow.startY = 1;
                        break;
                    case 'w':
                        flow.startX = 0;
                        flow.startY = flow.startVal;
                        break;
                    case 'e':
                        flow.startX = 1;
                        flow.startY = flow.startVal;
                        break;
                    default:
                        flow.startX = 0;
                        flow.endX = 0;
                }
                switch (flow.endSide.toLowerCase()) {
                    case 'n':
                        flow.endX = flow.endVal;
                        flow.endY = 0;
                        break;
                    case 's':
                        flow.endX = flow.endVal;
                        flow.endY = 1;
                        break;
                    case 'w':
                        flow.endX = 0;
                        flow.endY = flow.endVal;
                        break;
                    case 'e':
                        flow.endX = 1;
                        flow.endY = flow.endVal;
                        break;
                    default:
                        flow.startX = 0;
                        flow.endX = 0;
                }
            }
            this.flows = update;
        }
    });
})(jQuery);
