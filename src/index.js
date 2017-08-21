/** @module querymen */
import _ from 'lodash'
import Param from './querymen-param'
import Schema from './querymen-schema'

export { Param, Schema }

export let handlers = {
  parsers: {},
  formatters: {},
  validators: {}
}

/**
 * Get or set a handler.
 * @memberof querymen
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
 * @memberof querymen
 * @param {string} name - Parser name.
 * @param {parserFn} [fn] - Set the parser method.
 * @return {parserFn} The parser method.
 */
export function parser (name, fn) {
  return handler('parsers', ...arguments)
}

/**
 * Get or set a formatter.
 * @memberof querymen
 * @param {string} name - Formatter name.
 * @param {formatterFn} [fn] - Set the formatter method.
 * @return {formatterFn} The formatter method.
 */
export function formatter (name, fn) {
  return handler('formatters', ...arguments)
}

/**
 * Get or set a validator.
 * @memberof querymen
 * @param {string} name - Validator name.
 * @param {validatorFn} [fn] - Set the validator method.
 * @return {validatorFn} The validator method.
 */
export function validator (name, fn) {
  return handler('validators', ...arguments)
}

/**
 * Create a middleware.
 * @memberof querymen
 * @param {QuerymenSchema|Object} [schema] - Schema object.
 * @param {Object} [options] - Options to be passed to schema.
 * @return {Function} The middleware.
 */
export function middleware (schema, options) {
  return function (req, res, next) {
    let _schema
    // If option near is enable with make a simple clone
    // In otherwise we make a _.cloneDeep
    if (schema && schema.options && schema.options.near) {
      _schema = schema instanceof Schema
        ? _.clone(schema)
        : new Schema(schema, options)
    } else {
      _schema = schema instanceof Schema
        ? _.cloneDeep(schema)
        : new Schema(schema, options)
    }

    _schema.validate(req.query, (err) => {
      if (err) {
        req.querymen = { error: err }
        res.status(400)
        return next(err.message)
      }

      req.querymen = _schema.parse()
      req.querymen.schema = _schema
      next()
    })
  }
}

/**
 * Error handler middleware.
 * @memberof querymen
 * @return {Function} The middleware.
 */
export function errorHandler () {
  return function (err, req, res, next) {
    if (req.querymen && req.querymen.error) {
      res.status(400).json(req.querymen.error)
    } else {
      next(err)
    }
  }
}

export default { Schema, Param, handlers, handler, parser, formatter, validator, middleware, errorHandler }
