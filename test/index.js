import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import test from 'tape'
import * as menquery from '../src'
import './menquery-param'
import './menquery-schema'

mongoose.connect('mongodb://localhost/menquery-test')

let schema = mongoose.Schema({
  title: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

let Test = mongoose.model('Test', schema)

let route = (...args) => {
  let app = express()
  app.get('/tests', menquery.middleware(...args), (err, req, res, next) => {
    return err ? res.json(err) : next()
  }, (req, res) => {
    Test.find(req.menquery.query, req.menquery.select, req.menquery.cursor).then((items) => {
      res.status(200).json(items)
    }).catch((err) => {
      res.status(500).send(err)
    })
  })
  return app
}

test('Menquery handler', (t) => {
  t.notOk(menquery.parser('testParser'), 'should not get nonexistent parser')
  t.notOk(menquery.formatter('testFormatter'), 'should not get nonexistent formatter')
  t.notOk(menquery.validator('testValidator'), 'should not get nonexistent validator')

  menquery.parser('testParser', () => 'test')
  menquery.formatter('testFormatter', () => 'test')
  menquery.validator('testValidator', () => ({valid: false}))

  t.ok(menquery.parser('testParser'), 'should get parser')
  t.ok(menquery.formatter('testFormatter'), 'should get formatter')
  t.ok(menquery.validator('testValidator'), 'should get validator')

  t.end()
})

test('Menquery middleware', (t) => {
  t.plan(8)

  Test.remove({}).then(() => {
    return Test.create(
      {title: 'Test', createdAt: new Date('2016-04-25T10:05')},
      {title: 'Example', createdAt: new Date('2016-04-24T10:05')},
      {title: 'Spaced test', createdAt: new Date('2016-04-23T10:05')},
      {title: 'nice!', createdAt: new Date('2016-04-22T10:05')}
    )
  }).then(() => {
    let app = route()

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
      .query({select: 'title,-_id'})
      .expect(200)
      .end((err, res) => {
        if (err) throw err
        t.equal(res.body.length, 4, 'should respond with 4 items')
        t.true(res.body[0].title, 'should have title property')
        t.false(res.body[0]._id, 'should not have _id property')
        t.false(res.body[0].createdAt, 'should not have createdAt property')
      })

    request(route(new menquery.Schema({
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
  })
})

test.onFinish(() => {
  mongoose.disconnect()
})
