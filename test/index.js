import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import test from 'tape'
import querymen from '../src'
import './querymen-param'
import './querymen-schema'

mongoose.connect('mongodb://localhost/querymen-test')

const entitySchema = mongoose.Schema({})
const testSchema = mongoose.Schema({
  title: String,
  entity: {
    type: mongoose.Schema.ObjectId,
    ref: 'Entity'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  location: {
    type: [Number],
    index: '2d'
  }
})

const Entity = mongoose.model('Entity', entitySchema)
const Test = mongoose.model('Test', testSchema)

const route = (...args) => {
  const app = express()
  app.get('/tests', querymen.middleware(...args), (req, res) => {
    Test.find(req.querymen.query, req.querymen.select, req.querymen.cursor).then((items) => {
      res.status(200).json(items)
    }).catch((err) => {
      res.status(500).send(err)
    })
  })

  app.use(querymen.errorHandler())
  return app
}

test('Prototype pollution', (t) => {
  const { toString } = {}

  querymen.handler('__proto__', 'toString', 'JHU')
  t.ok({}.toString === toString, 'should not be vulnerable to prototype pollution')

  querymen.handler('formatters', '__proto__', { toString: 'JHU' })
  t.ok({}.toString === toString, 'should not be vulnerable to prototype pollution')

  querymen.handler('validators', '__proto__', { toString: 'JHU' })
  t.ok({}.toString === toString, 'should not be vulnerable to prototype pollution')

  t.end()
})

test('Querymen handler', (t) => {
  t.notOk(querymen.parser('testParser'), 'should not get nonexistent parser')
  t.notOk(querymen.formatter('testFormatter'), 'should not get nonexistent formatter')
  t.notOk(querymen.validator('testValidator'), 'should not get nonexistent validator')

  querymen.parser('testParser', () => 'test')
  querymen.formatter('testFormatter', () => 'test')
  querymen.validator('testValidator', () => ({valid: false}))

  t.ok(querymen.parser('testParser'), 'should get parser')
  t.ok(querymen.formatter('testFormatter'), 'should get formatter')
  t.ok(querymen.validator('testValidator'), 'should get validator')

  let schema = new querymen.Schema({test: String})

  t.ok(schema.parser('testParser'), 'should get parser in schema')
  t.ok(schema.formatter('testFormatter'), 'should get formatter in schema')
  t.ok(schema.validator('testValidator'), 'should get validator in schema')

  t.ok(schema.param('test').parser('testParser'), 'should get parser in param')
  t.ok(schema.param('test').formatter('testFormatter'), 'should get formatter in param')
  t.ok(schema.param('test').validator('testValidator'), 'should get validator in param')

  t.end()
})

test('Querymen middleware', (t) => {
  t.plan(12)

  Test.remove({}).then(() => {
    return Entity.create({})
  }).then((entity) => {
    return Test.create(
      {title: 'Test', entity, createdAt: new Date('2016-04-25T10:05'), location: [-44.1, -22.0]},
      {title: 'Example', createdAt: new Date('2016-04-24T10:05'), location: [-44.3, -22.0]},
      {title: 'Spaced test', createdAt: new Date('2016-04-23T10:05'), location: [-44.2, -22.0]},
      {title: 'nice!', createdAt: new Date('2016-04-22T10:05'), location: [-44.4, -22.0]}
    )
  }).then((test1) => {
    let app = route({
      entity: testSchema.tree.entity
    })

    request(app)
      .get('/tests')
      .query({entity: test1.entity.id})
      .expect(200)
      .end((err, res) => {
        if (err) throw err
        t.equal(res.body.length, 1, 'should respond to id filter')
      })

    request(app)
      .get('/tests')
      .query({page: 50})
      .expect(400)
      .end((err, res) => {
        if (err) throw err
        t.equal(res.body.param, 'page', 'should respond with error object')
      })

    request(app)
      .get('/tests')
      .expect(200)
      .end((err, res) => {
        if (err) throw err
        t.equal(res.body.length, 4, 'should respond with 4 items')
      })

    request(app)
      .get('/tests')
      .query({fields: 'title,-id'})
      .expect(200)
      .end((err, res) => {
        if (err) throw err
        t.equal(res.body.length, 4, 'should respond with 4 items')
        t.true(res.body[0].title, 'should have title property')
        t.false(res.body[0]._id, 'should not have _id property')
        t.false(res.body[0].createdAt, 'should not have createdAt property')
      })

    request(route(new querymen.Schema({
      before: {
        type: Date,
        operator: '$lte',
        paths: ['createdAt']
      },
      after: {
        type: Date,
        operator: '$gte',
        paths: ['createdAt']
      }
    })))
      .get('/tests')
      .query({before: '2016-04-23T10:00', after: '2016-04-22T10:00'})
      .expect(200)
      .end((err, res) => {
        if (err) throw err
        t.equal(res.body.length, 1, 'should respond with 1 item')
        t.equal(res.body[0].title, 'nice!', 'should respond with item after and before date')
      })

    request(route(new querymen.Schema({
      after: {
        type: Date,
        operator: '$gte',
        paths: ['createdAt']
      }
    })))
      .get('/tests')
      .query({after: '2016-04-25T10:00'})
      .expect(200)
      .end((err, res) => {
        if (err) throw err
        t.equal(res.body.length, 1, 'should respond with 1 item')
        t.equal(res.body[0].title, 'Test', 'should respond with item after date')
      })

    request(route(new querymen.Schema({
      near: {
        geojson: false
      }
    }, {near: true})))
      .get('/tests')
      .query({near: '-22.0,-44.0'})
      .expect(200)
      .end((err, res) => {
        if (err) throw err
        t.equal(res.body[1].title, 'Spaced test', 'should respond with item near')
      })
  })
})

test.onFinish(() => {
  mongoose.disconnect()
})
