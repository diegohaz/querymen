import _ from 'lodash'
import MenqueryParam from './menquery-param'

export default class MenquerySchema {

  // constructor
  constructor (params = {}, options = {}) {
    this.options = options
    this.params = {}
    this._params = {
      q: {
        type: String,
        normalize: true,
        regex: true,
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

    this.addAll(params)
  }

  get (paramName) {
    return this.params[this._getSchemaParamName(paramName)]
  }

  set (paramName, value, properties = {}) {
    paramName = this._getSchemaParamName(paramName)

    if (!this.params[paramName]) {
      this.add(paramName, value, properties)
    } else {
      this.params[paramName].value(value)
    }

    return this.params[paramName]
  }

  add (paramName, value, properties = {}) {
    if (paramName instanceof MenqueryParam) {
      this.params[paramName.name] = paramName
      return paramName
    }

    paramName = this._getSchemaParamName(paramName)

    if (_.isString(properties)) {
      properties = {default: properties}
    } else if (_.isNumber(properties)) {
      properties = {type: Number, default: properties}
    } else if (_.isDate(properties)) {
      properties = {type: Date, default: properties}
    } else if (_.isFunction(properties)) {
      properties = {type: properties}
    }

    if (this.options[paramName] === false) {
      return false
    }

    properties = _.assign(this._params[paramName], properties)
    this.params[paramName] = new MenqueryParam(paramName, value, properties)

    return this.params[paramName]
  }

  addAll (params) {
    let paramsKeys = _.keys(params)
    let keys = _.union(_.keys(this._params), paramsKeys)

    keys.forEach((paramName) => {
      this.add(paramName, null, params[paramName])
    })

    return this.params
  }

  remove (paramName) {
    delete this.params[paramName]
  }

  parse (values = {}) {
    let query = {}

    _.forIn(this.params, (param) => {
      let value = values[this._getQueryParamName(param.name)]
      param.value(value)
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
        query[bind] = param.parse()
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
      param.value(value, true)
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
