'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _richParam = require('rich-param');

var _richParam2 = _interopRequireDefault(_richParam);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** QuerymenParam class. */
var QuerymenParam = function (_Param) {
  _inherits(QuerymenParam, _Param);

  /**
   * Create a param.
   * @param {string} name - Param name.
   * @param {*} [value] - The value of the param.
   * @param {Object} [options] - Options of the param.
   * @param {Object} [schema] - Schema of the param.
   */
  function QuerymenParam(name, value) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, QuerymenParam);

    var _this = _possibleConstructorReturn(this, (QuerymenParam.__proto__ || Object.getPrototypeOf(QuerymenParam)).call(this, name, value, options));

    _this.handlers.parsers = {};
    _this.options = _lodash2.default.assign({
      paths: [name],
      operator: '$eq',
      parse: function parse(value, path, operator, param) {
        if (operator === '$eq') {
          return _defineProperty({}, path, value);
        } else if (_lodash2.default.isRegExp(value)) {
          return operator === '$ne' ? _defineProperty({}, path, { $not: value }) : _defineProperty({}, path, value);
        } else {
          return _defineProperty({}, path, _defineProperty({}, operator, value));
        }
      }
    }, _this.options);
    return _this;
  }

  /**
   * Get or set a parser.
   * @param {string} name - Parser name.
   * @param {parserFn} [fn] - Set the parser method.
   * @return {parserFn} The parser method.
   */


  _createClass(QuerymenParam, [{
    key: 'parser',
    value: function parser(name, fn) {
      return this.handler.apply(this, ['parsers'].concat(Array.prototype.slice.call(arguments)));
    }

    /**
     * Parse the param.
     * @param {*} [value] - Set the param value.
     * @param {string|string[]} path - Set the param path/paths.
     * @return {Object} The parsed value.
     */

  }, {
    key: 'parse',
    value: function parse() {
      var _this2 = this;

      var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._value;
      var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.options.paths;

      var operator = this.options.operator;
      var query = {};

      if (_lodash2.default.isNil(value)) {
        return query;
      } else if (value !== this._value) {
        value = this.value(value);
      }

      if (_lodash2.default.isArray(path)) {
        var paths = path;
        if (paths.length > 1) {
          query.$or = paths.map(function (path) {
            return _this2.parse(value, path);
          });
          return query;
        }
        path = paths[0];
      }

      if (_lodash2.default.isArray(value)) {
        operator = operator === '$ne' ? '$nin' : '$in';
      }

      _lodash2.default.forIn(this.options, function (optionValue, option) {
        var parser = void 0;
        if (option === 'parse' && _lodash2.default.isFunction(optionValue)) {
          parser = optionValue;
        } else if (_lodash2.default.isFunction(_this2.handlers.parsers[option])) {
          parser = _this2.handlers.parsers[option].bind(_this2, optionValue);
        } else {
          return;
        }
        query = parser(value, path, operator, _this2);
      });

      return query;
    }
  }]);

  return QuerymenParam;
}(_richParam2.default);

exports.default = QuerymenParam;