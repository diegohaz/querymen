'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _2 = require('./');

var _3 = _interopRequireDefault(_2);

var _querymenParam = require('./querymen-param');

var _querymenParam2 = _interopRequireDefault(_querymenParam);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * QuerymenSchema class.
 */
var QuerymenSchema = function () {

  /**
   * Create a schema.
   * @param {Object} [params] - Params object.
   * @param {Object} [options] - Options object.
   */
  function QuerymenSchema() {
    var _this = this;

    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, QuerymenSchema);

    this.params = {};
    this.options = _lodash2.default.assign({
      near: false
    }, options);
    this.handlers = {
      parsers: {},
      formatters: {},
      validators: {}
    };
    this._params = {
      q: {
        type: RegExp,
        normalize: true,
        paths: ['keywords']
      },
      fields: {
        type: [String],
        bindTo: 'select',
        parse: function parse(value) {
          var fields = _lodash2.default.isArray(value) ? value : [value];
          var query = {};
          fields.forEach(function (field) {
            if (_lodash2.default.isNil(field) || _lodash2.default.isEmpty(field)) return;
            field = field.replace(/^([-+]?)id/, '$1_id');
            if (field.charAt(0) === '-') {
              query[field.slice(1)] = 0;
            } else if (field.charAt(0) === '+') {
              query[field.slice(1)] = 1;
            } else {
              query[field] = 1;
            }
          });
          return query;
        }
      },
      near: {
        type: [Number],
        maxlength: 2,
        minlength: 2,
        max: 180,
        min: -180,
        paths: ['location'],
        max_distance: true,
        min_distance: true,
        geojson: true,
        format: function format(value, param) {
          if (param.option('min_distance') && !_this.param('min_distance')) {
            _this.param('min_distance', null, { type: Number, min: 0, parse: function parse() {
                return false;
              } });
          }
          if (param.option('max_distance') && !_this.param('max_distance')) {
            _this.param('max_distance', null, { type: Number, parse: function parse() {
                return false;
              } });
          }
          return value;
        },
        parse: function parse(value, path, operator, param) {
          var query = _defineProperty({}, path, { $near: {} });
          var minDistance = _this.param('min_distance');
          var maxDistance = _this.param('max_distance');
          if (param.option('geojson')) {
            query[path].$near = { $geometry: { type: 'Point', coordinates: [value[1], value[0]] } };
            if (minDistance && minDistance.value()) {
              query[path].$near.$minDistance = minDistance.value();
            }
            if (maxDistance && maxDistance.value()) {
              query[path].$near.$maxDistance = maxDistance.value();
            }
          } else {
            query[path].$near = [value[1], value[0]];
            if (minDistance && minDistance.value()) {
              query[path].$minDistance = minDistance.value() / 6371000;
            }
            if (maxDistance && maxDistance.value()) {
              query[path].$maxDistance = maxDistance.value() / 6371000;
            }
          }
          _this.option('sort', false);
          return query;
        }
      },
      page: {
        type: Number,
        default: 1,
        max: 30,
        min: 1,
        bindTo: 'cursor',
        parse: function parse(value, path, operator, param) {
          return { skip: _this.param('limit').value() * (value - 1) };
        }
      },
      limit: {
        type: Number,
        default: 30,
        max: 100,
        min: 1,
        bindTo: 'cursor',
        parse: function parse(value) {
          return { limit: value };
        }
      },
      sort: {
        type: [String],
        default: '-createdAt',
        bindTo: 'cursor',
        parse: function parse(value) {
          var fields = _lodash2.default.isArray(value) ? value : [value];
          var sort = {};
          fields.forEach(function (field) {
            if (field.charAt(0) === '-') {
              sort[field.slice(1)] = -1;
            } else if (field.charAt(0) === '+') {
              sort[field.slice(1)] = 1;
            } else {
              sort[field] = 1;
            }
          });
          return { sort: sort };
        }
      }
    };

    var keys = _lodash2.default.union(_lodash2.default.keys(this._params), _lodash2.default.keys(params));

    keys.forEach(function (key) {
      return _this.add(key, undefined, params[key]);
    });

    _lodash2.default.forIn(_3.default.handlers, function (typedHandler, type) {
      _lodash2.default.forIn(typedHandler, function (handler, name) {
        _this.handler(type, name, handler);
      });
    });
  }

  /**
   * Get or set an option.
   * @param {string} name - Option name.
   * @param {*} [value] - Set the value of the option.
   * @return {*} Value of the option.
   */


  _createClass(QuerymenSchema, [{
    key: 'option',
    value: function option(name, value) {
      if (arguments.length > 1) {
        this.options[name] = value;
      }

      return this.options[name];
    }

    /**
     * Get or set a handler.
     * @param {string} type - Handler type.
     * @param {string} name - Handler name.
     * @param {Function} [fn] - Set the handler method.
     */

  }, {
    key: 'handler',
    value: function handler(type, name, fn) {
      if (arguments.length > 2) {
        this.handlers[type][name] = fn;
        this._refreshHandlersInParams(_defineProperty({}, type, _defineProperty({}, name, fn)));
      }

      return this.handlers[type][name];
    }

    /**
     * Get or set a parser.
     * @param {string} name - Parser name.
     * @param {parserFn} [fn] - Set the parser method.
     * @return {parserFn} The parser method.
     */

  }, {
    key: 'parser',
    value: function parser(name, fn) {
      return this.handler.apply(this, ['parsers'].concat(Array.prototype.slice.call(arguments)));
    }

    /**
     * Get or set a formatter.
     * @param {string} name - Formatter name.
     * @param {formatterFn} [fn] - Set the formatter method.
     * @return {formatterFn} The formatter method.
     */

  }, {
    key: 'formatter',
    value: function formatter(name, fn) {
      return this.handler.apply(this, ['formatters'].concat(Array.prototype.slice.call(arguments)));
    }

    /**
     * Get or set a validator.
     * @param {string} name - Validator name.
     * @param {validatorFn} [fn] - Set the validator method.
     * @return {validatorFn} The validator method.
     */

  }, {
    key: 'validator',
    value: function validator(name, fn) {
      return this.handler.apply(this, ['validators'].concat(Array.prototype.slice.call(arguments)));
    }

    /**
     * Get a param
     * @param {string} name - Param name.
     * @return {QuerymenParam|undefined} The param or undefined if it doesn't exist.
     */

  }, {
    key: 'get',
    value: function get(name) {
      name = this._getSchemaParamName(name);

      return this.params[name];
    }

    /**
     * Set param value.
     * @param {string} name - Param name.
     * @param {*} value - Param value.
     * @param {Object} [options] - Param options.
     * @return {QuerymenParam|undefined} The param or undefined if it doesn't exist.
     */

  }, {
    key: 'set',
    value: function set(name, value, options) {
      name = this._getSchemaParamName(name);

      if (this.params[name]) {
        var param = this.params[name];

        param.value(value);

        _lodash2.default.forIn(options, function (optionValue, option) {
          param.option(option, optionValue);
        });

        return param;
      } else {
        return;
      }
    }

    /**
     * Add param.
     * @param {string} name - Param name.
     * @param {*} [value] - Param value.
     * @param {Object} [options] - Param options.
     * @return {QuerymenParam|boolean} The param or false if param is set to false in schema options.
     */

  }, {
    key: 'add',
    value: function add(name, value, options) {
      if (name instanceof _querymenParam2.default) {
        options = name.options;
        value = name.value();
        name = name.name;
      }

      name = this._getSchemaParamName(name);

      if (this.options[name] === false) {
        return false;
      }

      options = this._parseParamOptions(options);

      options = _lodash2.default.assign({ bindTo: 'query' }, this._params[name], options);
      this.params[name] = new _querymenParam2.default(name, value, options, this);

      this._refreshHandlersInParams(undefined, _defineProperty({}, name, this.params[name]));

      return this.params[name];
    }

    /**
     * Get, set or add param.
     * @param {string} name - Param name.
     * @param {*} [value] - Param value.
     * @param {Object} [options] - Param options.
     * @return {QuerymenParam|undefined} The param or undefined if it doesn't exist.
     */

  }, {
    key: 'param',
    value: function param(name, value, options) {
      if (arguments.length === 1) {
        return this.get(name);
      }

      return this.set(name, value, options) || this.add(name, value, options);
    }

    /**
     * Parse values of the schema params.
     * @param {Object} [values] - Object with {param: value} pairs to parse.
     * @return {Object} Parsed object.
     */

  }, {
    key: 'parse',
    value: function parse() {
      var _this2 = this;

      var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var query = {};

      _lodash2.default.forIn(this.params, function (param) {
        var value = values[_this2._getQueryParamName(param.name)];

        if (!_lodash2.default.isNil(value)) {
          param.value(value);
        }
      });

      _lodash2.default.forIn(this.params, function (param) {
        if (_this2.options[_this2._getSchemaParamName(param.name)] === false) return;
        var bind = param.options.bindTo;

        query[bind] = _lodash2.default.merge(query[bind], param.parse());
      });

      return query;
    }

    /**
     * Validate values of the schema params.
     * @param {Object} [values] - Object with {param: value} pairs to validate.
     * @param {Function} [next] - Callback to be called with error
     * @return {boolean} Result of the validation.
     */

  }, {
    key: 'validate',
    value: function validate() {
      var _this3 = this;

      var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var next = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (error) {
        return !error;
      };

      var error = void 0;

      if (_lodash2.default.isFunction(values)) {
        next = values;
        values = {};
      }

      _lodash2.default.forIn(this.params, function (param) {
        var value = values[_this3._getQueryParamName(param.name)];

        if (!_lodash2.default.isNil(value)) {
          param.value(value);
        }
      });

      for (var i in this.params) {
        if (error) break;
        var param = this.params[i];
        param.validate(function (err) {
          error = err;
        });
      }

      return next(error);
    }
  }, {
    key: '_refreshHandlersInParams',
    value: function _refreshHandlersInParams() {
      var handlers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.handlers;
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.params;

      _lodash2.default.forIn(handlers, function (typedHandler, type) {
        _lodash2.default.forIn(typedHandler, function (handler, name) {
          _lodash2.default.forIn(params, function (param) {
            param.handler(type, name, handler);
          });
        });
      });
    }
  }, {
    key: '_getSchemaParamName',
    value: function _getSchemaParamName(paramName) {
      return _lodash2.default.findKey(this.options, function (option) {
        return option === paramName;
      }) || paramName;
    }
  }, {
    key: '_getQueryParamName',
    value: function _getQueryParamName(paramName) {
      return _lodash2.default.isString(this.options[paramName]) ? this.options[paramName] : paramName;
    }
  }, {
    key: '_parseParamOptions',
    value: function _parseParamOptions(options) {
      if (_lodash2.default.isArray(options) && options.length) {
        var innerOption = this._parseParamOptions(options[0]);
        options = {};
        if (innerOption.type) {
          options.type = [innerOption.type];
        }
        if (innerOption.default) {
          options.default = innerOption.default;
        }
      } else if (_lodash2.default.isString(options)) {
        options = { default: options };
      } else if (_lodash2.default.isNumber(options)) {
        options = { type: Number, default: options };
      } else if (_lodash2.default.isBoolean(options)) {
        options = { type: Boolean, default: options };
      } else if (_lodash2.default.isDate(options)) {
        options = { type: Date, default: options };
      } else if (_lodash2.default.isRegExp(options)) {
        options = { type: RegExp, default: options };
      } else if (_lodash2.default.isFunction(options)) {
        options = { type: options };
      }

      return options || {};
    }
  }]);

  return QuerymenSchema;
}();

exports.default = QuerymenSchema;