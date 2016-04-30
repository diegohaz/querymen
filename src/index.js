/** @module menquery */
import _ from 'lodash'
import Param from './menquery-param'
import Schema from './menquery-schema'

export {Param, Schema}

export let handlers = {
  parsers: {},
  formatters: {},
  validators: {}
}

/**
 * Get or set a handler.
 * @memberof menquery
 * @param {string} type - Handler type.
 * @param {string} name - Handler name.
 * @param {Function} [fn] - Set the handler method.
 */
export function handler (type, name, fn) {
  if (arguments.length > 2) {
    handlers[type][name] = fn
  }

  return handlers[type][name]
}

/**
 * Get or set a parser.
 * @memberof menquery
 * @param {string} name - Parser name.
 * @param {parserFn} [fn] - Set the parser method.
 * @return {parserFn} The parser method.
 */
export function parser (name, fn) {
  return handler('parsers', ...arguments)
}

/**
 * Get or set a formatter.
 * @memberof menquery
 * @param {string} name - Formatter name.
 * @param {formatterFn} [fn] - Set the formatter method.
 * @return {formatterFn} The formatter method.
 */
export function formatter (name, fn) {
  return handler('formatters', ...arguments)
}

/**
 * Get or set a validator.
 * @memberof menquery
 * @param {string} name - Validator name.
 * @param {validatorFn} [fn] - Set the validator method.
 * @return {validatorFn} The validator method.
 */
export function validator (name, fn) {
  return handler('validators', ...arguments)
}

/**
 * Create a middleware.
 * @memberof menquery
 * @param {MenquerySchema|Object} [schema] - Schema object.
 * @param {Object} [options] - Options to be passed to schema.
 * @return {Function} The middleware.
 */
export function middleware (schema, options) {
  return function (req, res, next) {
    let _schema = schema instanceof Schema
                ? _.clone(schema)
                : new Schema(schema, options)

    _schema.validate(req.query, (err) => {
      if (err) {
        req.menquery = {error: err}
        return next(err)
      }

      req.menquery = _schema.parse()
      req.menquery.schema = _schema
      next()
    })
  }
}

/**
 * Error handler middleware.
 * @memberof menquery
 * @return {Function} The middleware.
 */
export function errorHandler () {
  return function (err, req, res, next) {
    if (req.menquery && req.menquery.error) {
      res.status(400).json(req.menquery.error)
    } else {
      next(err)
    }
  }
}

export default {Schema, Param, handlers, handler, parser, formatter, validator, middleware, errorHandler}
