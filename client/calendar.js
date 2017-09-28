
/*
 * Federated Wiki : Calendar Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-calendar/blob/master/LICENSE.txt
 */

(function() {
  var apply, bind, dateAsValue, emit, format, months, parse, precisionFor, radarSource, show, span, spans, unitsFor;

  months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  spans = ['EARLY', 'LATE', 'DECADE', 'DAY', 'MONTH', 'YEAR'];

  span = function(result, span) {
    var m;
    if ((m = spans.indexOf(result.span)) < 0) {
      return result.span = span;
    } else if ((spans.indexOf(span)) < m) {
      return result.span = span;
    }
  };

  parse = function(text) {
    var i, j, k, len, len1, line, m, ref, result, rows, word, words;
    rows = [];
    ref = text.split(/\n/);
    for (j = 0, len = ref.length; j < len; j++) {
      line = ref[j];
      result = {};
      words = line.match(/\S+/g);
      for (i = k = 0, len1 = words.length; k < len1; i = ++k) {
        word = words[i];
        if (word.match(/^\d\d\d\d$/)) {
          result.year = +word;
          span(result, 'YEAR');
        } else if (m = word.match(/^(\d0)S$/)) {
          result.year = +m[1] + 1900;
          span(result, 'DECADE');
        } else if ((m = spans.indexOf(word)) >= 0) {
          result.span = spans[m];
        } else if ((m = months.indexOf(word.slice(0, 3))) >= 0) {
          result.month = m + 1;
          span(result, 'MONTH');
        } else if (m = word.match(/^([1-3]?[0-9])$/)) {
          result.day = +m[1];
          span(result, 'DAY');
        } else {
          result.label = words.slice(i, 1000).join(' ');
          break;
        }
      }
      rows.push(result);
    }
    return rows;
  };

  apply = function(input, output, date, rows) {
    var j, len, radarValue, ref, ref1, result, row;
    result = [];
    for (j = 0, len = rows.length; j < len; j++) {
      row = rows[j];
      if (((ref = input[row.label]) != null ? ref.date : void 0) != null) {
        date = input[row.label].date;
      }
      if (((ref1 = output[row.label]) != null ? ref1.date : void 0) != null) {
        date = output[row.label].date;
      }
      if (row.year != null) {
        date = new Date(row.year, 1 - 1);
      }
      if (row.month != null) {
        date = new Date(date.getYear() + 1900, row.month - 1);
      }
      if (row.day != null) {
        date = new Date(date.getYear() + 1900, date.getMonth(), row.day);
      }
      if (row.label != null) {
        output[row.label] = {
          date: date
        };
        if (row.span != null) {
          output[row.label].span = row.span;
        }
      }
      row.date = date;
      radarValue = dateAsValue(row.date, row.span);
      row.units = radarValue.units;
      row.value = radarValue.value;
      row.precision = radarValue.precision;
      result.push(row);
    }
    return result;
  };

  show = function(date, span) {
    switch (span) {
      case 'YEAR':
        return date.getFullYear();
      case 'DECADE':
        return (date.getFullYear()) + "'S";
      case 'EARLY':
        return "Early " + (date.getFullYear()) + "'S";
      case 'LATE':
        return "Late " + (date.getFullYear()) + "'S";
      case 'MONTH':
        return months[date.getMonth()] + " " + (date.getFullYear());
      default:
        return (date.getDate()) + " " + months[date.getMonth()] + " " + (date.getFullYear());
    }
  };

  format = function(rows) {
    var j, len, results1, row;
    results1 = [];
    for (j = 0, len = rows.length; j < len; j++) {
      row = rows[j];
      results1.push("<tr><td>" + (show(row.date, row.span)) + "<td>" + row.label);
    }
    return results1;
  };

  precisionFor = {
    DAY: 1000 * 60 * 60 * 24,
    MONTH: 1000 * 60 * 60 * 24 * 365.25 / 12,
    YEAR: 1000 * 60 * 60 * 24 * 365.25,
    DECADE: 1000 * 60 * 60 * 24 * 365.25 * 10,
    EARLY: 1000 * 60 * 60 * 24 * 365.25 * 10,
    LATE: 1000 * 60 * 60 * 24 * 365.25 * 10
  };

  unitsFor = {
    DAY: 'day',
    MONTH: 'month',
    YEAR: 'year',
    DECADE: 'decade',
    EARLY: 'decade',
    LATE: 'decade'
  };

  dateAsValue = function(date, span) {
    var precisionInMilliseconds, ref, ref1;
    precisionInMilliseconds = (ref = precisionFor[span]) != null ? ref : precisionFor.DAY;
    return {
      units: [(ref1 = unitsFor[span]) != null ? ref1 : unitsFor.DAY],
      value: Math.floor(date.getTime() / precisionInMilliseconds),
      precision: precisionInMilliseconds
    };
  };

  radarSource = function($item, results) {
    var data, j, len, row;
    data = {};
    for (j = 0, len = results.length; j < len; j++) {
      row = results[j];
      data[row.label] = {
        units: row.units,
        value: row.value,
        precision: row.precision
      };
    }
    $item.addClass('radar-source');
    return $item.get(0).radarData = function() {
      return data;
    };
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      parse: parse,
      apply: apply,
      format: format,
      radarSource: radarSource
    };
  }

  emit = function(div, item) {
    var results, rows;
    rows = parse(item.text);
    wiki.log('calendar rows', rows);
    results = apply({}, {}, new Date(), rows);
    wiki.log('calendar results', results);
    radarSource(div, results);
    return div.append("<table style=\"width:100%; background:#eee; padding:.8em; margin-bottom:5px;\">" + (format(results).join('')) + "</table>");
  };

  bind = function(div, item) {
    return div.dblclick(function() {
      return wiki.textEditor(div, item);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.calendar = {
      emit: emit,
      bind: bind
    };
  }

}).call(this);

//# sourceMappingURL=calendar.js.map
