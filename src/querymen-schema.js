import _ from 'lodash'
import querymen from './'
import QuerymenParam from './querymen-param'

/**
 * QuerymenSchema class.
 */
export default class QuerymenSchema {

  /**
   * Create a schema.
   * @param {Object} [params] - Params object.
   * @param {Object} [options] - Options object.
   */
  constructor (params = {}, options = {}) {
    // if it's already a QuerymenSchema
    // just make a copy of the original
    if (params instanceof QuerymenSchema) {
      _.keys(params).forEach(key => {
        this[key] = _.cloneDeep(params[key])
      })

      return
    }

    this.params = {}
    this.options = _.assign({
      near: false
    }, options)
    this.handlers = {
      parsers: {},
      formatters: {},
      validators: {}
    }
    this._params = {
      q: {
        type: RegExp,
        normalize: true,
        paths: ['keywords']
      },
      fields: {
        type: [String],
        bindTo: 'select',
        parse: (value) => {
          let fields = _.isArray(value) ? value : [value]
          let query = {}
          fields.forEach((field) => {
            if (_.isNil(field) || _.isEmpty(field)) return
            field = field.replace(/^([-+]?)id/, '$1_id')
            if (field.charAt(0) === '-') {
              query[field.slice(1)] = 0
            } else if (field.charAt(0) === '+') {
              query[field.slice(1)] = 1
            } else {
              query[field] = 1
            }
          })
          return query
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
        format: (value, param) => {
          if (param.option('min_distance') && !this.param('min_distance')) {
            this.param('min_distance', null, {type: Number, min: 0, parse: () => false})
          }
          if (param.option('max_distance') && !this.param('max_distance')) {
            this.param('max_distance', null, {type: Number, parse: () => false})
          }
          return value
        },
        parse: (value, path, operator, param) => {
          let query = {[path]: {$near: {}}}
          let minDistance = this.param('min_distance')
          let maxDistance = this.param('max_distance')
          if (param.option('geojson')) {
            query[path].$near = {$geometry: {type: 'Point', coordinates: [value[1], value[0]]}}
            if (minDistance && minDistance.value()) {
              query[path].$near.$minDistance = minDistance.value()
            }
            if (maxDistance && maxDistance.value()) {
              query[path].$near.$maxDistance = maxDistance.value()
            }
          } else {
            query[path].$near = [value[1], value[0]]
            if (minDistance && minDistance.value()) {
              query[path].$minDistance = minDistance.value() / 6371000
            }
            if (maxDistance && maxDistance.value()) {
              query[path].$maxDistance = maxDistance.value() / 6371000
            }
          }
          this.option('sort', false)
          return query
        }
      },
      page: {
        type: Number,
        default: 1,
        max: 30,
        min: 1,
        bindTo: 'cursor',
        parse: (value, path, operator, param) => {
          return {skip: this.param('limit').value() * (value - 1)}
        }
      },
      limit: {
        type: Number,
        default: 30,
        max: 100,
        min: 1,
        bindTo: 'cursor',
        parse: (value) => ({limit: value})
      },
      sort: {
        type: [String],
        default: '-createdAt',
        bindTo: 'cursor',
        parse: (value) => {
          let fields = _.isArray(value) ? value : [value]
          let sort = {}
          fields.forEach((field) => {
            if (field.charAt(0) === '-') {
              sort[field.slice(1)] = -1
            } else if (field.charAt(0) === '+') {
              sort[field.slice(1)] = 1
            } else {
              sort[field] = 1
            }
          })
          return {sort: sort}
        }
      }
    }

    let keys = _.union(_.keys(this._params), _.keys(params))

    keys.forEach((key) => this.add(key, undefined, params[key]))

    _.forIn(querymen.handlers, (typedHandler, type) => {
      _.forIn(typedHandler, (handler, name) => {
        this.handler(type, name, handler)
      })
    })
  }

  /**
   * Get or set an option.
   * @param {string} name - Option name.
   * @param {*} [value] - Set the value of the option.
   * @return {*} Value of the option.
   */
  option (name, value) {
    if (arguments.length > 1) {
      this.options[name] = value
    }

    return this.options[name]
  }

  /**
   * Get or set a handler.
   * @param {string} type - Handler type.
   * @param {string} name - Handler name.
   * @param {Function} [fn] - Set the handler method.
   */
  handler (type, name, fn) {
    if (arguments.length > 2) {
      this.handlers[type][name] = fn
      this._refreshHandlersInParams({[type]: {[name]: fn}})
    }

    return this.handlers[type][name]
  }

  /**
   * Get or set a parser.
   * @param {string} name - Parser name.
   * @param {parserFn} [fn] - Set the parser method.
   * @return {parserFn} The parser method.
   */
  parser (name, fn) {
    return this.handler('parsers', ...arguments)
  }

  /**
   * Get or set a formatter.
   * @param {string} name - Formatter name.
   * @param {formatterFn} [fn] - Set the formatter method.
   * @return {formatterFn} The formatter method.
   */
  formatter (name, fn) {
    return this.handler('formatters', ...arguments)
  }

  /**
   * Get or set a validator.
   * @param {string} name - Validator name.
   * @param {validatorFn} [fn] - Set the validator method.
   * @return {validatorFn} The validator method.
   */
  validator (name, fn) {
    return this.handler('validators', ...arguments)
  }

  /**
   * Get a param
   * @param {string} name - Param name.
   * @return {QuerymenParam|undefined} The param or undefined if it doesn't exist.
   */
  get (name) {
    name = this._getSchemaParamName(name)

    return this.params[name]
  }

  /**
   * Set param value.
   * @param {string} name - Param name.
   * @param {*} value - Param value.
   * @param {Object} [options] - Param options.
   * @return {QuerymenParam|undefined} The param or undefined if it doesn't exist.
   */
  set (name, value, options) {
    name = this._getSchemaParamName(name)

    if (this.params[name]) {
      let param = this.params[name]

      param.value(value)

      _.forIn(options, (optionValue, option) => {
        param.option(option, optionValue)
      })

      return param
    } else {
      return
    }
  }

  /**
   * Add param.
   * @param {string} name - Param name.
   * @param {*} [value] - Param value.
   * @param {Object} [options] - Param options.
   * @return {QuerymenParam|boolean} The param or false if param is set to false in schema options.
   */
  add (name, value, options) {
    if (name instanceof QuerymenParam) {
      options = name.options
      value = name.value()
      name = name.name
    }

    name = this._getSchemaParamName(name)

    if (this.options[name] === false) {
      return false
    }

    options = this._parseParamOptions(options)

    options = _.assign({bindTo: 'query'}, this._params[name], options)
    this.params[name] = new QuerymenParam(name, value, options, this)

    this._refreshHandlersInParams(undefined, {[name]: this.params[name]})

    return this.params[name]
  }

  /**
   * Get, set or add param.
   * @param {string} name - Param name.
   * @param {*} [value] - Param value.
   * @param {Object} [options] - Param options.
   * @return {QuerymenParam|undefined} The param or undefined if it doesn't exist.
   */
  param (name, value, options) {
    if (arguments.length === 1) {
      return this.get(name)
    }

    return this.set(name, value, options) || this.add(name, value, options)
  }

  /**
   * Parse values of the schema params.
   * @param {Object} [values] - Object with {param: value} pairs to parse.
   * @return {Object} Parsed object.
   */
  parse (values = {}) {
    let query = {}

    _.forIn(this.params, (param) => {
      let value = values[this._getQueryParamName(param.name)]

      if (!_.isNil(value)) {
        param.value(value)
      }
    })

    _.forIn(this.params, (param) => {
      if (this.options[this._getSchemaParamName(param.name)] === false) return
      let bind = param.options.bindTo

      query[bind] = _.merge(query[bind], param.parse())
    })

    return query
  }

  /**
   * Validate values of the schema params.
   * @param {Object} [values] - Object with {param: value} pairs to validate.
   * @param {Function} [next] - Callback to be called with error
   * @return {boolean} Result of the validation.
   */
  validate (values = {}, next = (error) => !error) {
    let error

    if (_.isFunction(values)) {
      next = values
      values = {}
    }

    _.forIn(this.params, (param) => {
      let value = values[this._getQueryParamName(param.name)]

      if (!_.isNil(value)) {
        param.value(value)
      }
    })

    for (let i in this.params) {
      if (error) break
      let param = this.params[i]
      param.validate((err) => { error = err })
    }

    return next(error)
  }

  _refreshHandlersInParams (handlers = this.handlers, params = this.params) {
    _.forIn(handlers, (typedHandler, type) => {
      _.forIn(typedHandler, (handler, name) => {
        _.forIn(params, (param) => {
          param.handler(type, name, handler)
        })
      })
    })
  }

  _getSchemaParamName (paramName) {
    return _.findKey(this.options, (option) => option === paramName) || paramName
  }

  _getQueryParamName (paramName) {
    return _.isString(this.options[paramName]) ? this.options[paramName] : paramName
  }

  _parseParamOptions (options) {
    if (_.isArray(options) && options.length) {
      let innerOption = this._parseParamOptions(options[0])
      options = {}
      if (innerOption.type) {
        options.type = [innerOption.type]
      }
      if (innerOption.default) {
        options.default = innerOption.default
      }
    } else if (_.isString(options)) {
      options = {default: options}
    } else if (_.isNumber(options)) {
      options = {type: Number, default: options}
    } else if (_.isBoolean(options)) {
      options = {type: Boolean, default: options}
    } else if (_.isDate(options)) {
      options = {type: Date, default: options}
    } else if (_.isRegExp(options)) {
      options = {type: RegExp, default: options}
    } else if (_.isFunction(options)) {
      options = {type: options}
    }

    return options || {}
  }

}
