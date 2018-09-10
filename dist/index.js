'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handlers = exports.Schema = exports.Param = undefined;
exports.handler = handler;
exports.parser = parser;
exports.formatter = formatter;
exports.validator = validator;
exports.middleware = middleware;
exports.errorHandler = errorHandler;

var _querymenParam = require('./querymen-param');

var _querymenParam2 = _interopRequireDefault(_querymenParam);

var _querymenSchema = require('./querymen-schema');

var _querymenSchema2 = _interopRequireDefault(_querymenSchema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @module querymen */
exports.Param = _querymenParam2.default;
exports.Schema = _querymenSchema2.default;
var handlers = exports.handlers = {
  parsers: {},
  formatters: {},
  validators: {}

  /**
   * Get or set a handler.
   * @memberof querymen
   * @param {string} type - Handler type.
   * @param {string} name - Handler name.
   * @param {Function} [fn] - Set the handler method.
   */
};function handler(type, name, fn) {
  if (arguments.length > 2) {
    handlers[type][name] = fn;
  }

  return handlers[type][name];
}

/**
 * Get or set a parser.
 * @memberof querymen
 * @param {string} name - Parser name.
 * @param {parserFn} [fn] - Set the parser method.
 * @return {parserFn} The parser method.
 */
function parser(name, fn) {
  return handler.apply(undefined, ['parsers'].concat(Array.prototype.slice.call(arguments)));
}

/**
 * Get or set a formatter.
 * @memberof querymen
 * @param {string} name - Formatter name.
 * @param {formatterFn} [fn] - Set the formatter method.
 * @return {formatterFn} The formatter method.
 */
function formatter(name, fn) {
  return handler.apply(undefined, ['formatters'].concat(Array.prototype.slice.call(arguments)));
}

/**
 * Get or set a validator.
 * @memberof querymen
 * @param {string} name - Validator name.
 * @param {validatorFn} [fn] - Set the validator method.
 * @return {validatorFn} The validator method.
 */
function validator(name, fn) {
  return handler.apply(undefined, ['validators'].concat(Array.prototype.slice.call(arguments)));
}

/**
 * Create a middleware.
 * @memberof querymen
 * @param {QuerymenSchema|Object} [schema] - Schema object.
 * @param {Object} [options] - Options to be passed to schema.
 * @return {Function} The middleware.
 */
function middleware(schema, options) {
  return function (req, res, next) {
    var _schema = schema instanceof _querymenSchema2.default ? schema : new _querymenSchema2.default(schema, options);

    _schema.validate(req.query, function (err) {
      if (err) {
        req.querymen = { error: err };
        res.status(400);
        return next(err.message);
      }

      req.querymen = _schema.parse();
      req.querymen.schema = _schema;
      next();
    });
  };
}

/**
 * Error handler middleware.
 * @memberof querymen
 * @return {Function} The middleware.
 */
function errorHandler() {
  return function (err, req, res, next) {
    if (req.querymen && req.querymen.error) {
      res.status(400).json(req.querymen.error);
    } else {
      next(err);
    }
  };
}

exports.default = { Schema: _querymenSchema2.default, Param: _querymenParam2.default, handlers: handlers, handler: handler, parser: parser, formatter: formatter, validator: validator, middleware: middleware, errorHandler: errorHandler };