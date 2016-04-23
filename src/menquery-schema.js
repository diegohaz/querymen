import _ from 'lodash'
import MenqueryParam from './menquery-param'

export default class MenquerySchema {

  // constructor
  constructor (params = {}, options = {}) {
    this.options = options
    this.params = {}
    this._params = {
      q: {
        type: RegExp,
        normalize: true,
        paths: ['_q']
      },
      page: {
        type: Number,
        default: 1,
        max: 30,
        min: 1,
        bindTo: 'options'
      },
      limit: {
        type: Number,
        default: 30,
        max: 100,
        min: 1,
        bindTo: 'options'
      },
      sort: {
        type: String,
        default: 'name',
        multiple: true,
        bindTo: 'options'
      }
    }

    this.param(params)
  }
  // change to options
  // must add options if it is passed
  param (name, value, properties, set = !_.isNil(value) || !_.isNil(properties)) {
    if (name instanceof MenqueryParam) {
      this.param[name.name] = name
      return name
    } else if (_.isObject(name)) {
      let params = name
      let keys = _.union(_.keys(this._params), _.keys(params))

      keys.forEach((key) => this.param(key, null, params[key], true))

      return this.params
    }

    name = this._getSchemaParamName(name)

    if (!set) {
      return this.params[name]
    }

    if (this.options[name] === false) {
      return false
    }

    if (this.params[name]) {
      this.params[name].value(value)
      return this.params[name]
    }

    if (_.isString(properties)) {
      properties = {default: properties}
    } else if (_.isNumber(properties)) {
      properties = {type: Number, default: properties}
    } else if (_.isDate(properties)) {
      properties = {type: Date, default: properties}
    } else if (_.isFunction(properties)) {
      properties = {type: properties}
    }

    properties = _.assign(this._params[name], properties)
    this.params[name] = new MenqueryParam(name, value, properties)

    return this.params[name]
  }

  parse (values = {}) {
    let query = {}

    _.forIn(this.params, (param) => {
      let value = values[this._getQueryParamName(param.name)]

      if (!_.isNil(value)) {
        param.value(value)
      }
    })

    _.forIn(this.params, (param) => {
      let value = param.value()
      let bind = param.options.bindTo

      query[bind] = query[bind] || {}

      if (param.name === 'sort') {
        let fields = _.isArray(value) ? value : [value]
        query[bind].sort = {}
        for (let i = 0; i < fields.length; i++) {
          let field = fields[i]
          if (field.charAt(0) === '-') {
            query[bind].sort[field.slice(1)] = -1
          } else if (field.charAt(0) === '+') {
            query[bind].sort[field.slice(1)] = 1
          } else {
            query[bind].sort[field] = 1
          }
        }
      } else if (param.name === 'limit') {
        query[bind].limit = value
      } else if (param.name === 'page') {
        query[bind].skip = this.params.limit.value() * (value - 1)
      } else {
        query[bind] = _.assign(query[bind], param.parse())
      }
    })

    return query
  }

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

  _getSchemaParamName (paramName) {
    return _.findKey(this.options, (option) => option === paramName) || paramName
  }

  _getQueryParamName (paramName) {
    return this.options[paramName] || paramName
  }

}
