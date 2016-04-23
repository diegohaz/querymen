import request from 'supertest'
import express from 'express'
import test from 'tape'
import _ from 'lodash'
import menquery from '../src'
import './menquery-param'
import './menquery-schema'

let app = express()

app.get('/posts', menquery(), (err, req, res, next) => {
  if (err) {
    return res.json(err)
  }
  next()
}, (req, res) => {
  res.status(200).json(_.pick(req, ['filter', 'options', 'test']))
})

test('Menquery middleware', (t) => {
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
      t.equal(res.body.options.limit, 20, 'should respond with limit')
    })

  t.end()
})
