var faker = require('faker')



var door = exports.door = function () {
  return {
    name: faker.lorem.words().join(' '),
    isOpen: faker.random.boolean()
  }
}

exports.doors = function (number) {
  var results = []
  for (var i = 0; i < number; i++) {
    results.push(door())
  }
  return results
}
