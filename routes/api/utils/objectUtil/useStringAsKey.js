//ref: https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
/**
 * Uses a string as a key to search through an object and find a property.
 * E.g. the string "animalNoises.cat" would return "meow" on { animalNoises: { cat: "meow" }}
 * @param {Object} o The object to search through
 * @param {String} s The string to use as a key
 */
const useStringAsKey = (o, s) => {
  s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  s = s.replace(/^\./, '');           // strip a leading dot
  var a = s.split('.');
  for (var i = 0, n = a.length; i < n; ++i) {
      var k = a[i];
      if (k in o) {
          o = o[k];
      } else {
          return;
      }
  }
  return o;
}

module.exports = useStringAsKey