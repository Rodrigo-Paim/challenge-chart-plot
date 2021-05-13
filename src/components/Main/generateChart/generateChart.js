import { msToTime, addBrackets, separateByComma } from '../util/utils.js';
import JSON5 from 'json5';

export default function generateGraph(value, options) {
  if (!value) {
    throw new Error();
  }

  value = addBrackets(value);

  value = separateByComma(value);

  var json = JSON5.parse(value);

  json.sort(function (a, b) {
    return a.timestamp - b.timestamp;
  });

  var events = json.slice(
    json.findIndex((v) => {
      return v.type === 'start';
    }),
    json.findIndex((v) => {
      return v.type === 'stop';
    })
  );

  var max;
  var min;
  var groups;
  var selects;

  options.xAxis.categories = [];
  options.series = [];

  events.forEach((event) => {
    if (event.type === 'start') {
      groups = event.group;
      selects = event.select;
    } else if (event.type === 'span') {
      min = event.begin;
      max = event.end;

      options.xAxis.min = 0;
    } else if (event.type === 'data') {
      var time = msToTime(event.timestamp - min);

      if (
        options.xAxis.categories.find((v) => {
          return v === time;
        }) === undefined
      ) {
        options.xAxis.categories.push(time);
      }

      var serieName = '';

      groups.forEach((group) => {
        serieName = `${serieName} ${event[group]}`;
      });

      selects.forEach((select) => {
        if (event.timestamp >= min && event.timestamp <= max) {
          var completedSerieName = `${serieName} ${select}`;
          completedSerieName = completedSerieName.replace(/_/g, ' ');

          var ret = options.series.find((v) => {
            return v.name === `${completedSerieName}`;
          });

          if (ret === undefined) {
            options.series.push({
              name: `${completedSerieName}`,
              data: [],
              pointPlacement: 'on',
            });

            ret = options.series.find((v) => {
              return v.name === `${completedSerieName}`;
            });
          }

          var pos = options.xAxis.categories.findIndex((v) => {
            return v === time;
          });
          for (var k = 0; k < pos; k++) {
            if (ret.data[k] === undefined) {
              ret.data[k] = null;
            }
          }
          ret.data.splice(pos, 0, [event[select]]);
        }
      });
    }
  });
  return options;
}
