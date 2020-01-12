const deepmerge = require('./deepmerge')
const flattenObjectProps = require('./flattenObjectProps')

/**
 * Adds properties object 2 includes that object 1 may be missing into 
 * object 1 and returns the modified object
 * @param {Object} obj1 Object 1
 * @param {Object} obj2 Object 2
 */
const addMerge = (obj1, obj2) => {
  const flatObj1 = flattenObjectProps(obj1);
  const flatObj2 = flattenObjectProps(obj2);
  let resObj = obj1;

  flatObj2.forEach(propertyList => {
    if (!flatObj1.includes(propertyList)) {
      const propertyArr = propertyList.split(".");
      let updateObj = propertyArr.reduce(function(
        accumulator,
        currentValue
      ) {
        return accumulator[currentValue];
      },
      obj2);

      propertyArr
        .slice()
        .reverse()
        .forEach((property, index) => {
          updateObj = { [property]: updateObj };
        });

      resObj = deepmerge(updateObj, resObj);
    }
  });

  return resObj;
}

module.exports = addMerge