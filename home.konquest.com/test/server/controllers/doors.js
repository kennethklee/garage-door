var assert = require('assert')
var request = require('supertest')
var fake = require('test/fixtures')

var db = require('database')
var Server = require('server')

describe('Doors', function() {
  var server
  var doors

  before(function (next) {
    server = new Server()
    doors = fake.doors(10)

    db.Door.destroy({truncate: true})
      .then(function () {
        return db.Door.bulkCreate(doors, {validate: true, individualHooks: true})
          .then(function (records) {
            for (var i = 0; i < records.length; i++) {
              doors[i].id = records[i].id
              doors[i].slug = records[i].slug
            }
          })
      })
      .then(function () {
        next()
      })
      .catch(function (err) {
        throw err
      })
  })

  describe('GET /doors', function () {
    it('should list', function (done) {
      request(server)
        .get('/doors')
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err)

          res.body.should.be.an.Array
          for (var i = 0; i < doors.length; i++) {
            res.body[i].should.have.property('name').and.equal(doors[i].name)
            res.body[i].should.have.property('isOpen').and.equal(doors[i].isOpen)
          }

          done()
        })
    })
  })

  describe('POST /doors', function () {
    // TODO test to fail creation
    it('should create', function (done) {
      var newDoor = fake.door()

      request(server)
        .post('/doors')
        .send(newDoor)
        .expect(201)
        .end(function (err, res) {
          assert.ifError(err)

          res.body.should.be.an.Object
          res.body.should.have.property('name').and.equal(newDoor.name)
          res.body.should.have.property('isOpen').and.equal(newDoor.isOpen)

          done()
        })
    })
  })

  describe('GET /doors/:door', function () {
    it('should show by id', function (done) {
      request(server)
        .get('/doors/' + doors[0].id)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err)

          res.body.should.be.an.Object
          res.body.should.have.property('id').and.equal(doors[0].id)
          res.body.should.have.property('name').and.equal(doors[0].name)

          done()
        })
    })

    it('should show by slug', function (done) {
      request(server)
        .get('/doors/' + doors[0].slug)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err)

          res.body.should.be.an.Object
          res.body.should.have.property('id').and.equal(doors[0].id)
          res.body.should.have.property('slug').and.equal(doors[0].slug)
          res.body.should.have.property('name').and.equal(doors[0].name)

          done()
        })
    })
  })

  describe('PUT /doors/:door', function () {
    // TODO test to fail update
    it('should update', function (done) {
      var changedIsOpen = !doors[0].isOpen

      request(server)
        .put('/doors/' + doors[0].id)
        .send({ isOpen: changedIsOpen })
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err)

          res.body.should.be.an.Object
          res.body.should.have.property('id').and.equal(doors[0].id)
          res.body.should.have.property('slug').and.equal(doors[0].slug)
          res.body.should.have.property('name').and.equal(doors[0].name)
          res.body.should.have.property('isOpen').and.not.equal(doors[0].isOpen)
          res.body.should.have.property('isOpen').and.equal(changedIsOpen)

          done()
        })
    })
  })

  describe('DELETE /doors/:door', function () {
    it('should destroy', function (done) {
      request(server)
        .delete('/doors/' + doors[0].id)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err)

          res.text.should.equal('')

          done()
        })
    })
  })
})
