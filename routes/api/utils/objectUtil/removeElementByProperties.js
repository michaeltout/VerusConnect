//ref: https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
/**
 * Uses an array of properties (in parent -> child order) 
 * as a key to search through an object and remove an
 * element, assuming the property list correctly maps the object.
 * Returns the modified object.
 * 
 * @param {Object} o The object to search through
 * @param {String[]} propList The property list
 */
const removeElementByProperties = (o, propList) => {
  if (propList.length === 1) {
		let newO = { ...o }
    delete newO[propList[0]]
    return newO
	} else {
  	let newProps = propList.slice()
    const newProp = newProps.shift()
    
  	return {...o, [newProp]: removeElementByProperties(o[newProp], newProps)}
  }
}

module.exports = removeElementByProperties