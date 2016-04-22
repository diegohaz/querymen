import _ from 'lodash'

export default class MenqueryParam {

  constructor (name, value, options) {
    this._validators = []
    this.name = name
    this.options = _.assign({
      type: String,
      paths: [name],
      bindTo: 'filter',
      multiple: false,
      separator: ',',
      minlength: false,
      maxlength: false,
      lowercase: false,
      uppercase: false,
      normalize: false,
      required: false,
      regex: false,
      match: false,
      enum: false,
      min: false,
      max: false,
      trim: true,
      operator: '$eq',
      set: (value, param) => value,
      get: (value, param) => value
    }, options)

    this.value(value)
  }

  default (value, defaultValue) {
    if (_.isNil(value) || _.isNaN(value) || value === '') {
      return _.isFunction(defaultValue) ? defaultValue(this) : defaultValue
    }
    return value
  }

  normalize (value, normalize) {
    if (normalize && !_.isNil(value)) {
      value = _.kebabCase(value).replace(/\-/g, ' ')
    }
    return value
  }

  lowercase (value, lowercase) {
    if (lowercase && !_.isNil(value)) {
      value = _.toLower(value)
    }
    return value
  }

  uppercase (value, uppercase) {
    if (uppercase && !_.isNil(value)) {
      value = _.toUpper(value)
    }
    return value
  }

  trim (value, trim) {
    if (trim && !_.isNil(value)) {
      value = _.trim(value)
    }
    return value
  }

  required (value, required) {
    if (required) {
      let validate = (value) => !_.isNil(value) && !_.isNaN(value) && value !== ''
      this.addValidator({
        validate: validate,
        name: 'required',
        required: required,
        error: `${this.name} is required`
      }, 0)
    }
    return value
  }

  min (value, min) {
    if (_.isNumber(min)) {
      let validate = (value) => _.isNil(value) || value >= min
      this.addValidator({
        validate: validate,
        name: 'min',
        min: min,
        error: `${this.name} must be greater than or equal to ${min}`
      })
    }
    return value
  }

  max (value, max) {
    if (_.isNumber(max)) {
      let validate = (value) => _.isNil(value) || value <= max
      this.addValidator({
        validate: validate,
        name: 'max',
        max: max,
        error: `${this.name} must be lower than or equal to ${max}`
      })
    }
    return value
  }

  minlength (value, minlength) {
    if (_.isNumber(minlength)) {
      let validate = (value) => _.isNil(value) || value.length >= minlength
      this.addValidator({
        validate: validate,
        name: 'minlength',
        minlength: minlength,
        error: `${this.name} must have length greater than or equal to ${minlength}`
      })
    }
    return value
  }

  maxlength (value, maxlength) {
    if (_.isNumber(maxlength)) {
      let validate = (value) => _.isNil(value) || value.length <= maxlength
      this.addValidator({
        validate: validate,
        name: 'maxlength',
        maxlength: maxlength,
        error: `${this.name} must have length lower than or equal to ${maxlength}`
      })
    }
    return value
  }

  enum (value, _enum) {
    if (_.isArray(_enum)) {
      let validate = (value) => _.isNil(value) || _enum.indexOf(value) !== -1
      this.addValidator({
        validate: validate,
        name: 'enum',
        enum: _enum,
        error: `${this.name} must be one of: ${_enum.join(', ')}`
      })
    }
    return value
  }

  match (value, match) {
    if (_.isRegExp(match)) {
      let validate = (value) => _.isNil(value) || match.test(value)
      this.addValidator({
        validate: validate,
        name: 'match',
        match: match,
        error: `${this.name} must match regular expression ${match}`
      })
    }
    return value
  }

  addValidator (validator, at = this._validators.length) {
    _.remove(this._validators, {name: validator.name})
    this._validators.splice(at, 0, validator)
  }

  parse (value = this._value, path = this.options.paths) {
    let options = this.options
    let query = {}

    if (_.isNil(value)) {
      return query
    } else if (value !== this._value) {
      value = this.value(value)
    }

    if (_.isArray(path) && path.length > 1) {
      query.$or = path.map((p) => this.parse(value, p))
      return query
    } else if (_.isArray(path)) {
      path = path[0]
    }

    if (_.isArray(value) && options.operator === '$eq') {
      options.operator = '$in'
    } else if (_.isArray(value) && options.operator === '$ne') {
      options.operator = '$nin'
    }

    if (options.operator === '$eq' || _.isRegExp(value) && options.operator !== '$in') {
      query[path] = value
    } else {
      query[path] = {}
      query[path][options.operator] = value
    }

    return query
  }

  value (value, set = !_.isNil(value)) {
    let options = this.options

    if (!set && this._value) {
      if (_.isArray(this._value)) {
        return this._value.map((v) => options.get(v))
      } else {
        return options.get(this._value, this)
      }
    }

    if (set && this._value === value) {
      return this._value
    }

    if (options.multiple && _.isString(value) && value.search(options.separator) !== -1) {
      let values = value.split(options.separator).map((v) => this.value(v))
      this._value = values
      return values
    }

    _.forIn(this.options, (optionValue, option) => {
      if (_.isFunction(this[option])) {
        value = this[option](value, optionValue)
      }
    })

    if (!_.isNil(value)) {
      if (options.regex) {
        value = new RegExp(value, 'i')
      } else if (options.type.name === 'Date') {
        value = new Date(value)
      } else {
        value = options.type(value)
      }
      this._value = options.set(value, this)
    }

    return this._value
  }

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

    for (let i = 0; i < this._validators.length; i++) {
      if (error) break
      let validator = this._validators[i]

      if (_.isFunction(validator.validate) && !validator.validate(value)) {
        error = _.assign({
          param: this.name,
          value: value
        }, _.omit(validator, 'validate'))
      }
    }

    return next(error)
  }
}
