const allowed_paths = require('./allowed_paths')
const file_descriptors = require('./file_descriptors')

module.exports = {
  ...allowed_paths,
  ...file_descriptors
}