import _ from 'lodash'

export default class MenqueryParam {

  /**
   * Create a param.
   * @param {string} name - Param name.
   * @param {*} [value] - The value of the param.
   * @param {Object} [options] - Options of the param.
   */
  constructor (name, value, options) {
    this.name = name
    this.handlers = {
      parsers: {},
      formatters: {},
      validators: {}
    }
    this.options = _.assign({
      type: String,
      paths: [name],
      bindTo: 'filter',
      multiple: false,
      separator: ',',
      operator: '$eq',
      trim: true,
      set: (value, param) => value,
      get: (value, param) => value
    }, options)

    this.formatter('default', (defaultValue, value, param) => {
      if (_.isNil(value) || _.isNaN(value) || value === '') {
        return _.isFunction(defaultValue) ? defaultValue(this) : defaultValue
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
      if (lowercase && !_.isNil(value)) {
        value = _.toLower(value)
      }
      return value
    })

    this.formatter('uppercase', (uppercase, value, param) => {
      if (uppercase && !_.isNil(value)) {
        value = _.toUpper(value)
      }
      return value
    })

    this.formatter('trim', (trim, value, param) => {
      if (trim && !_.isNil(value)) {
        value = _.trim(value)
      }
      return value
    })

    this.validator('required', (required, value, param) => ({
      valid: !required || !_.isNil(value) && !_.isNaN(value) && value !== '',
      message: `${param.name} is required`
    }))

    this.validator('min', (min, value, param) => ({
      valid: !_.isNumber(min) || _.isNil(value) || value >= min,
      message: `${param.name} must be greater than or equal to ${min}`
    }))

    this.validator('max', (max, value, param) => ({
      valid: !_.isNumber(max) || _.isNil(value) || value <= max,
      message: `${param.name} must be lower than or equal to ${max}`
    }))

    this.validator('minlength', (minlength, value, param) => ({
      valid: !_.isNumber(minlength) || _.isNil(value) || value.length >= minlength,
      message: `${param.name} must have length greater than or equal to ${minlength}`
    }))

    this.validator('maxlength', (maxlength, value, param) => ({
      valid: !_.isNumber(maxlength) || _.isNil(value) || value.length <= maxlength,
      message: `${param.name} must have length lower than or equal to ${maxlength}`
    }))

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
   * @param {Function} fn - Set the handler method.
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
   * @param {parserFn} fn - Set the parser method.
   * @return {parserFn} The parser method.
   */
  parser (name, fn) {
    return this.handler('parsers', ...arguments)
  }

  /**
   * Get or set a formatter.
   * @param {string} name - Formatter name.
   * @param {formatterFn} fn - Set the formatter method.
   * @return {formatterFn} The formatter method.
   */
  formatter (name, fn) {
    return this.handler('formatters', ...arguments)
  }

  /**
   * Get or set a validator.
   * @param {string} name - Validator name.
   * @param {validatorFn} fn - Set the validator method.
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
      let parser = this.handlers.parsers[option]
      if (_.isFunction(parser)) {
        if (_.isArray(value)) {
          value = value.map((v) => parser(optionValue, v))
        } else {
          value = parser(optionValue, value)
        }
      }
    })

    if (operator === '$eq' || _.isRegExp(value)) {
      query[path] = value
    } else {
      query[path] = {[operator]: value}
    }

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
      if (_.isArray(this._value)) {
        return this._value.map((v) => options.get(v))
      } else {
        return options.get(this._value, this)
      }
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
        value = formatter(optionValue, value)
      }
    })

    if (!_.isNil(value)) {
      if (options.type.name === 'RegExp') {
        value = new RegExp(value, 'i')
      } else if (options.type.name === 'Date') {
        value = new Date(value)
      } else {
        value = options.type(value)
      }
    }

    value = options.set(value, this)

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
        if (error) break
        this.validate(value[i], (err) => { error = err })
      }

      return next(error)
    }

    for (let option in this.options) {
      let validator = this.handlers.validators[option]
      if (error) break
      if (!_.isFunction(validator)) continue
      let optionValue = this.options[option]
      let validation = validator(optionValue, value, this)

      if (!validation.valid) {
        error = _.assign({
          name: option,
          param: this.name,
          value: value,
          [option]: optionValue
        }, validation)
      }
    }

    return next(error)
  }
}
