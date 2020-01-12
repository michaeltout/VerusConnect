const flattenObjectProps = (obj) => {
  const isNonEmptyObject = val => typeof val === "object" && !Array.isArray(val) && Object.values(val).length > 0;

  const addDelimiter = (a, b) => (a ? `${a}.${b}` : b);

  const paths = (obj = {}, head = "") => {
    return Object.entries(obj).reduce((product, [key, value]) => {
      let fullPath = addDelimiter(head, key);
      return isNonEmptyObject(value)
        ? product.concat(paths(value, fullPath))
        : product.concat(fullPath);
    }, []);
  };

  return paths(obj);
}

module.exports = flattenObjectProps