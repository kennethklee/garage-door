require('should')
var assert = require('assert')
var express = require('express')
var request = require('supertest')

var database = require('database')
var Controller = require('util/controller')
var Model = require('test/fixtures/model')

var jsonify = function (json) {
  var result =JSON.parse(JSON.stringify(json))  // clone
  result.toJson = function () {
    return json
  }
  return result
}

describe('Controller Creator', function () {
  it('should create a basic controller', function (done) {
    var controller = new Controller({ model: {}, key: 'key' })

    controller.should.have.property('param').and.is.a.Function
    controller.should.have.property('list').and.is.a.Function
    controller.should.have.property('create').and.is.a.Function
    controller.should.have.property('show').and.is.a.Function
    controller.should.have.property('update').and.is.a.Function
    controller.should.have.property('delete').and.is.a.Function

    done()
  })

  it('should list all records', function (done) {
    var FakeModel = new Model({ result: [jsonify({foo: 'bar'})] })
    var controller = new Controller({ model: FakeModel, key: 'record'})
    var server = express()

    server.get('/test', controller.list.bind(controller))

    request(server)
      .get('/test')
      .expect(200)
      .end(function (err, res) {
        assert.ifError(err)

        res.body.should.be.an.Array
        res.body[0].should.have.property('foo').and.equal('bar')

        FakeModel.lastCall.should.equal('findAll')

        done()
      })
  })

  it('should create record', function (done) {
    var FakeModel = new Model({ result: jsonify({foo: 'bar'}) })
    var controller = new Controller({ model: FakeModel, key: 'record'})
    var server = express()

    server.post('/test', controller.create.bind(controller))

    request(server)
      .post('/test')
      .send({foo: 'bar'})
      .expect(201)
      .end(function (err, res) {
        assert.ifError(err)

        res.body.should.be.an.Object
        res.body.should.have.property('foo').and.equal('bar')

        FakeModel.lastCall.should.equal('create')

        done()
      })
  })

  it('should show record using param', function (done) {
    var FakeModel = new Model({ result: jsonify({foo: 'bar'}) })
    var controller = new Controller({ model: FakeModel, key: 'record'})
    var server = express()

    server.param('test', controller.param.bind(controller))
    server.get('/test/:test', controller.show.bind(controller))

    request(server)
      .get('/test/:test')
      .expect(200)
      .end(function (err, res) {
        assert.ifError(err)

        res.body.should.be.an.Object
        res.body.should.have.property('foo').and.equal('bar')

        FakeModel.lastCall.should.equal('findOne')

        done()
      })
  })

  it('should update record', function (done) {
    var FakeModel = new Model({ result: jsonify({foo: 'bar'}) })
    var controller = new Controller({ model: FakeModel, key: 'record'})
    var server = express()

    server.param('test', controller.param.bind(controller))
    server.put('/test/:test', controller.update.bind(controller))

    request(server)
      .put('/test/:test')
      .send({foo: 'bar'})
      .expect(200)
      .end(function (err, res) {
        assert.ifError(err)

        res.body.should.be.an.Object
        res.body.should.have.property('foo').and.equal('bar')

        FakeModel.lastCall.should.equal('update')

        done()
      })
  })

  it('should delete record', function (done) {
    var FakeModel = new Model({ result: jsonify({foo: 'bar'}) })
    var controller = new Controller({ model: FakeModel, key: 'record'})
    var server = express()

    server.param('test', controller.param.bind(controller))
    server.put('/test/:test', controller.delete.bind(controller))

    request(server)
      .put('/test/:test')
      .send({foo: 'bar'})
      .expect(200)
      .end(function (err, res) {
        assert.ifError(err)

        res.text.should.equal('')

        FakeModel.lastCall.should.equal('destroy')

        done()
      })
  })
})
