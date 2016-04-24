/** @module menquery */
import _ from 'lodash'
import MenqueryParam from './menquery-param'
import MenquerySchema from './menquery-schema'

/**
 * Validator object.
 * @typedef {Object} Validator
 * @property {boolean} valid - Indicates if the value is valid or not.
 * @property {string} message - The error message.
 * @property {string} [param] - The name of the param.
 * @property {*} [value] - The value of the param.
 */
/**
 * Param parser callback.
 * @callback parserFn
 * @param {*} parserValue - The value passed to the parser.
 * @param {*} paramValue - The value passed to the param.
 * @param {MenqueryParam} param - The `MenqueryParam` object.
 * @return {*} The parsed value
 */
/**
 * Param formatter callback.
 * @callback formatterFn
 * @param {*} formatterValue - The value passed to the formatter.
 * @param {*} paramValue - The value passed to the param.
 * @param {MenqueryParam} param - The `MenqueryParam` object.
 * @return {*} The formatted value
 */
/**
 * Param validator callback.
 * @callback validatorFn
 * @param {*} validatorValue - The value passed to the validator.
 * @param {*} paramValue - The value passed to the param.
 * @param {MenqueryParam} param - The `MenqueryParam` object.
 * @return {Validator}
 */

let handlers = {
  parsers: {},
  formatters: {},
  validators: {}
}

export {MenqueryParam as Param}
export {MenquerySchema as Schema}

/**
 * Get or set a handler.
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
 * @param {string} name - Parser name.
 * @param {parserFn} [fn] - Set the parser method.
 * @return {parserFn} The parser method.
 */
export function parser (name, fn) {
  return handler('parsers', ...arguments)
}

/**
 * Get or set a formatter.
 * @param {string} name - Formatter name.
 * @param {formatterFn} [fn] - Set the formatter method.
 * @return {formatterFn} The formatter method.
 */
export function formatter (name, fn) {
  return handler('formatters', ...arguments)
}

/**
 * Get or set a validator.
 * @param {string} name - Validator name.
 * @param {validatorFn} [fn] - Set the validator method.
 * @return {validatorFn} The validator method.
 */
export function validator (name, fn) {
  return handler('validators', ...arguments)
}

/**
 * Create a middleware.
 * @param {MenquerySchema|Object} [schema] - Schema object.
 * @param {Object} [options] - Options to be passed to schema.
 * @return {Function} The middleware.
 */
export function middleware (schema, options) {
  return function (req, res, next) {
    let _schema = schema instanceof MenquerySchema
                ? _.clone(schema)
                : new MenquerySchema(schema, options)

    _.forIn(handlers, (typedHandler, type) => {
      _.forIn(typedHandler, (handler, name) => {
        _schema.handler(type, name, handler)
      })
    })

    _schema.validate(req.query, (err) => {
      if (err) {
        res.status(400)
        return next(err)
      }

      req = _.merge(req, _schema.parse())
      next()
    })
  }
}

export default middleware
