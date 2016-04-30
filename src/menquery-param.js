import _ from 'lodash'

/** MenqueryParam class. */
export default class MenqueryParam {

  /**
   * Create a param.
   * @param {string} name - Param name.
   * @param {*} [value] - The value of the param.
   * @param {Object} [options] - Options of the param.
   * @param {Object} [schema] - Schema of the param.
   */
  constructor (name, value, options = {}, schema = {}) {
    this.name = name
    this.schema = schema
    this.handlers = {
      parsers: {},
      formatters: {},
      validators: {}
    }
    this.options = _.assign({
      type: String,
      paths: [name],
      bindTo: 'query',
      multiple: false,
      separator: ',',
      operator: '$eq',
      trim: true,
      format: (value, param, schema) => value,
      validate: (value, param, schema) => ({valid: true}),
      parse: (value, path, operator, param, schema) => {
        if (operator === '$eq' || _.isRegExp(value)) {
          return {[path]: value}
        } else {
          return {[path]: {[operator]: value}}
        }
      }
    }, options)

    if (_.isNil(options.type) && !_.isNil(value)) {
      this.options.type = this._getType(value)
    }

    if (_.isArray(this.options.type)) {
      this.options.multiple = true
      this.options.type = this.options.type[0]
    }

    this.formatter('default', (defaultValue, value, param) => {
      if (_.isNil(value) || _.isNaN(value) || value === '') {
        value = _.isFunction(defaultValue) ? defaultValue(this) : defaultValue
        if (_.isNil(options.type)) {
          param.option('type', this._getType(value))
        }
      }
      return value
    })

    this.formatter('normalize', (normalize, value, param) => {
      if (normalize && !_.isNil(value)) {
        value = _.kebabCase(value).replace(/\-/g, ' ')
      }
      return value
    })

    this.formatter('lowercase', (lowercase, value, param) => {
      if (lowercase && _.isString(value)) {
        value = _.toLower(value)
      }
      return value
    })

    this.formatter('uppercase', (uppercase, value, param) => {
      if (uppercase && _.isString(value)) {
        value = _.toUpper(value)
      }
      return value
    })

    this.formatter('trim', (trim, value, param) => {
      if (trim && _.isString(value)) {
        value = _.trim(value)
      }
      return value
    })

    this.validator('required', (required, value, param) => ({
      valid: !required || !_.isNil(value) && !_.isNaN(value) && value !== '',
      message: `${param.name} is required`
    }))

    this.validator('min', (min, value, param) => ({
      valid: _.isNil(value) || value >= min,
      message: `${param.name} must be greater than or equal to ${min}`
    }))

    this.validator('max', (max, value, param) => ({
      valid: _.isNil(value) || value <= max,
      message: `${param.name} must be lower than or equal to ${max}`
    }))

    this.validator('minlength', (minlength, value, param) => {
      let valid = true
      if (_.isNumber(minlength) && !_.isNil(value)) {
        if (param.option('multiple')) {
          value = _.isArray(param.value()) ? param.value() : [param.value()]
        }
        valid = value.length >= minlength
      }
      return {
        valid: valid,
        message: `${param.name} must have length greater than or equal to ${minlength}`
      }
    })

    this.validator('maxlength', (maxlength, value, param) => {
      let valid = true
      if (_.isNumber(maxlength) && !_.isNil(value)) {
        if (param.option('multiple')) {
          value = _.isArray(param.value()) ? param.value() : [param.value()]
        }
        valid = value.length <= maxlength
      }
      return {
        valid: valid,
        message: `${param.name} must have length lower than or equal to ${maxlength}`
      }
    })

    this.validator('enum', (_enum, value, param) => ({
      valid: !_.isArray(_enum) || _.isNil(value) || ~_enum.indexOf(value),
      message: `${param.name} must be one of: ${_enum.join(', ')}`
    }))

    this.validator('match', (match, value, param) => ({
      valid: !_.isRegExp(match) || _.isNil(value) || match.test(value),
      message: `${param.name} must match regular expression ${match}`
    }))

    this.value(value)
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
   * Parse the param.
   * @param {*} [value] - Set the param value.
   * @param {string|string[]} path - Set the param path/paths.
   * @return {Object} The parsed value.
   */
  parse (value = this._value, path = this.options.paths) {
    let operator = this.options.operator
    let query = {}

    if (_.isNil(value)) {
      return query
    } else if (value !== this._value) {
      value = this.value(value)
    }

    if (_.isArray(path)) {
      let paths = path
      if (paths.length > 1) {
        query.$or = paths.map((path) => this.parse(value, path))
        return query
      }
      path = paths[0]
    }

    if (_.isArray(value)) {
      operator = operator === '$ne' ? '$nin' : '$in'
    }

    _.forIn(this.options, (optionValue, option) => {
      let parser
      if (option === 'parse' && _.isFunction(optionValue)) {
        parser = optionValue
      } else if (_.isFunction(this.handlers.parsers[option])) {
        parser = this.handlers.parsers[option].bind(this, optionValue)
      } else {
        return
      }
      query = parser(value, path, operator, this, this.schema)
    })

    return query
  }

  /**
   * Get or set the param value.
   * @param {*} [value] - Set the param value.
   * @param {boolean} [bind=true] - Set if value must be bound to parameter or not.
   * @return {*} The formatted value.
   */
  value (value, bind = true) {
    let options = this.options

    if (arguments.length === 0) {
      return this._value
    }

    if (options.multiple) {
      let values = value

      if (_.isString(value) && ~value.search(options.separator)) {
        values = value.split(options.separator)
      }

      if (_.isArray(values)) {
        values = values.map((value) => this.value(value, false))

        if (bind) {
          this._value = values
        }

        return values
      }
    }

    _.forIn(this.options, (optionValue, option) => {
      let formatter = this.handlers.formatters[option]
      if (_.isFunction(formatter)) {
        value = formatter(optionValue, value, this, this.schema)
      }
    })

    if (!_.isNil(value)) {
      if (options.type.name === 'RegExp') {
        value = new RegExp(value, 'i')
      } else if (options.type.name === 'Date') {
        value = new Date(/^\d{5,}$/.test(value) ? Number(value) : value)
      } else if (options.type.name === 'Boolean') {
        value = !(value === 'false' || value === '0' || !value)
      } else {
        value = options.type(value)
      }
    }

    value = options.format(value, this, this.schema)

    if (bind) {
      this._value = value
    }

    return value
  }

  /**
   * Validates the param.
   * @param {*} [value] - Set the param value.
   * @param {Function} [next] - Callback to be called with error
   * @return {boolean} Result of the validation.
   */
  validate (value = this._value, next = (error) => !error) {
    let error

    if (_.isFunction(value)) {
      next = value
      value = this._value
    }

    if (_.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        this.validate(value[i], (err) => { error = err })
        if (error) break
      }

      return next(error)
    }

    for (let option in this.options) {
      let optionValue = this.options[option]
      let validator

      if (option === 'validate' && _.isFunction(optionValue)) {
        validator = optionValue
      } else if (_.isFunction(this.handlers.validators[option])) {
        validator = this.handlers.validators[option].bind(this, optionValue)
      } else {
        continue
      }

      let validation = validator(value, this, this.schema)

      if (!validation.valid) {
        error = _.assign({
          name: option,
          param: this.name,
          value: value,
          [option]: optionValue
        }, validation)
        break
      }
    }

    return next(error)
  }

  _getType (value) {
    if (_.isNumber(value)) {
      return Number
    } else if (_.isBoolean(value)) {
      return Boolean
    } else if (_.isDate(value)) {
      return Date
    } else if (_.isRegExp(value)) {
      return RegExp
    } else if (_.isArray(value)) {
      this.option('multiple', true)
      return this._getType(value[0])
    } else {
      return String
    }
  }
}
