/*
 * @plugin jQuery d3Charts v0.1
 *
 * @author Carlos Andres Vega carlosvega20@gmail.com
 *
 * Copyright (c) 2012
 * Licensed under the MIT License:
 *   http://www.opensource.org/licenses/mit-license.php
 *


 easing:
  linear - the identity function, t.
  poly(k) - raises t to the specified power k (e.g., 3).
  quad - equivalent to poly(2).
  cubic - equivalent to poly(3).
  sin - applies the trigonometric function sin.
  exp - raises 2 to a power based on t.
  circle - the quarter circle.
  elastic(a, p) - simulates an elastic band; may extend slightly beyond 0 and 1.
  back(s) - simulates backing into a parking space.
  bounce - simulates a bouncy collision.
 */

 (function($) {
  $.fn.d3Charts = function(obj) {
    var Main = function() {
      return {
        init: function(options) {
          options = $.extend({
            width: 264,
            height: 264,
            shape: null,
            colors: null,
            centered: true,
            duration: 2500,
            ease: 'linear',
            transformations: null,
            initDataset: null,
            endDataset: null
          }, options);

          return this.each(function() {
            var $this = $(this),
            data = $this.data('d3Charts');

            if (!data) {
              $this.data('d3Charts', {
                settings: options,
                svg: null
              });
              data = $(this).data('d3Charts');
            }

            d3.select(this).select("svg").remove();


            //Define svg object
            data.svg = d3.select(this).append("svg")
              .attr("width", data.settings.width)
              .attr("height", data.settings.height)
              .append("g");

            if (data.settings.centered === true) {
              data.svg.attr("transform", "translate(" + data.settings.width / 2 + "," + data.settings.height / 2 + ") ");
            }

            var shape = null,
                Cdata = null;

            var pie = d3.layout.pie().sort(null);
            //Shapes
            if (data.settings.shape.type === 'donut' || data.settings.shape.type === 'pie') {
              Cdata = pie(data.settings.initDataset);
              shape = $this.d3Charts('_'+ data.settings.shape.type);
              data.svg.selectAll("path")
              .data(Cdata)
              .enter().append("path")
              .attr("fill", $this.d3Charts('_getColors', data.settings.colors))
              .attr("d", shape).each(function(d) { this._current = d; });

            } else if (data.settings.shape.type === 'bar') {

                $this.d3Charts('_createBars', data.settings.initDataset)[0]
                .enter()
                .append("rect")
                .attr("x", function(d, i) {
                  return $this.d3Charts('_createBars', data.settings.initDataset)[1](i);
                })
                .attr("y", function(d) {
                    return data.settings.height - $this.d3Charts('_createBars', data.settings.initDataset)[2](d.start);
                })
                .attr("width", $this.d3Charts('_createBars', data.settings.initDataset)[1].rangeBand())
                .attr("height", function(d) {
                    return $this.d3Charts('_createBars', data.settings.initDataset)[2](d.start);
                })
                .attr("fill", $this.d3Charts('_getColors', data.settings.colors))
                .attr("transform", data.settings.transformations);
            }





            if ( data.settings.endDataset !== undefined){
              $this.d3Charts('animateTo', data.settings.endDataset);
            }

          });
        },
        _createBars: function (dataset) {
          var $this = $(this),
            data = $this.data('d3Charts');

          var xScale = d3.scale.ordinal()
              .domain(d3.range(data.settings.initDataset.length))
              .rangeRoundBands([0, data.settings.width+55], 0.45);

              var yScale = d3.scale.linear()
              .domain([0, d3.max(data.settings.initDataset, function(d) {return d.start;})])
              .range([0, data.settings.height]);

              return [data.svg.selectAll("rect")
              .data(dataset), xScale, yScale];

        },

        _getColors: function (colors) {
          switch (typeof(colors)) {
            case 'string':
              return colors;
            case 'object':
              return function (d, i) {
                return colors[i];
              };
            default:
              return '#ff0000';
          }
        },

        _gradToRad: function(grad) {
          return (Math.PI * grad) / 180;
        },

        _donut: function (){
          var $this = $(this),
              data = $(this).data('d3Charts');

          return d3.svg.arc()
            .innerRadius(function (d) {
              return data.settings.shape.radius + (d.data.index * data.settings.shape.tubeWidth);
            })
            .outerRadius(function (d) {
              return data.settings.shape.radius + (d.data.index * data.settings.shape.tubeWidth) + data.settings.shape.tubeWidth;
            })
            .startAngle(function (d) {
              //calulate radians between 0 - 100%
              return $this.d3Charts('_gradToRad',((d.data.start*360)/100));
            })
            .endAngle(function (d) {
              return $this.d3Charts('_gradToRad',((d.data.end*360)/100));
            });
        },

        _pie: function (){
          var $this = $(this),
              data = $(this).data('d3Charts');

          return d3.svg.arc()
            .innerRadius(0)
            .outerRadius(function (d) {
              return data.settings.shape.radius + (d.data.index * data.settings.shape.tubeWidth) + data.settings.shape.tubeWidth;
            })
            .startAngle(function (d) {
              //calulate radians between 0 - 100%
              return $this.d3Charts('_gradToRad',((d.data.start*360)/100));
            })
            .endAngle(function (d) {
              return $this.d3Charts('_gradToRad',((d.data.end*360)/100));
            });
        },

        _tween: function(a, that) {
            var shape = $(this).d3Charts('_'+$(this).data('d3Charts').settings.shape.type),
                i = d3.interpolate(that._current, a);
            that._current = i(0);
            return function(t) {
              return shape(i(t));
            };
        },

        animateTo: function (dataset) {
          return this.each(function() {
            var $this = $(this),
              data = $(this).data('d3Charts'),
              pie = d3.layout.pie().sort(null);

              if (data.settings.shape.type !== 'bar'){
                d3.select(this).select('svg').selectAll("path")
                .data(pie(dataset))
                .transition()
                .duration(data.settings.duration)
                .ease(data.settings.ease)
                .attrTween("d", function (animationData) {
                  return $this.d3Charts('_tween', animationData, this);
                });
              } else {
                $this.d3Charts('_createBars', dataset)[0]
                .transition()
                .duration(data.settings.duration)
                .ease(data.settings.ease)
                .attr("y", function(d, i, a) {
                    return data.settings.height - $this.d3Charts('_createBars', dataset)[2](d.start);
                })
                .attrTween("height", function(d, i, a) {
                  return d3.interpolate(a, $this.d3Charts('_createBars', dataset)[2](d.start));
                })
                .attr("fill", $this.d3Charts('_getColors', data.settings.colors))
                .attr("transform", data.settings.transformations);


              }

          });
        },

        destroy: function() {
          return this.each(function() {
            var $this = $(this);
            d3.select(this).select("svg").remove();
            $this.removeData('d3Charts');
          });
        }
      };
    }();

    if (Main[obj]) {
      if ($.isFunction(Main[obj])) {
        return Main[obj].apply(this, Array.prototype.slice.call(arguments, 1));
      } else {
        return Main[obj];
      }
    } else if (typeof obj === 'object' || !obj) {
      return Main.init.apply(this, arguments);
    } else {
      $.error(obj + ' does not exist');
    }
  };
})(jQuery);
