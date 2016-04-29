import request from 'supertest'
import express from 'express'
import test from 'tape'
import _ from 'lodash'
import * as menquery from '../src'
import './menquery-param'
import './menquery-schema'

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
  let app = express()

  app.get('/posts', menquery.middleware(), (err, req, res, next) => {
    if (err) {
      return res.json(err)
    }
    next()
  }, (req, res) => {
    res.status(200).json(_.pick(req, ['query', 'cursor', 'test']))
  })

  request(app)
    .get('/posts')
    .query({page: 50})
    .expect(400)
    .end((err, res) => {
      if (err) throw err
      t.equal(res.body.param, 'page', 'should respond with error')
    })

  request(app)
    .get('/posts')
    .query({limit: 20})
    .expect(200)
    .end((err, res) => {
      if (err) throw err
      t.equal(res.body.cursor.limit, 20, 'should respond with limit')
    })

  t.end()
})
