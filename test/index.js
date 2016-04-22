import request from 'supertest'
import express from 'express'
import test from 'tape'
import _ from 'lodash'
import menquery from '../src'
import './menquery-param'
import './menquery-schema'

let route = (middleware = menquery()) => {
  let app = express()

  app.get('/posts', middleware, (err, req, res, next) => {
    if (err) {
      return res.status(400).json(err)
    }
    next()
  }, (req, res) => {
    res.status(200).json(_.pick(req, ['filter', 'options', 'test']))
  })

  return app
}

test('Menquery middleware', (t) => {
  request(route())
    .get('/posts')
    .query({q: 'test'})
    .expect(200)
    .end((err, res) => {
      if (err) throw err
      t.deepEqual(res.body.filter._q, /test/i, 'should respond with parsed data')
    })

  request(route())
    .get('/posts')
    .query({page: 50})
    .expect(400)
    .end((err, res) => {
      if (err) throw err
      t.equal(res.body.param, 'page', 'should respond with error')
    })

  t.end()
})
