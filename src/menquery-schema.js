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
        multiple: false,
        max: 30,
        min: 1,
        bindTo: 'options'
      },
      limit: {
        type: Number,
        default: 30,
        multiple: false,
        max: 100,
        min: 1,
        bindTo: 'options'
      },
      sort: {
        type: String,
        default: 'name',
        bindTo: 'options'
      }
    }

    this.addAll(params)
  }

  get (param) {
    return this.params[this._getSchemaParamName(param)]
  }

  set (param, value, properties = {}) {
    param = this._getSchemaParamName(param)

    if (!this.params[param]) {
      this.add(param, value, properties)
    } else {
      this.params[param].value(value)
    }

    return this.params[param]
  }

  add (param, value, properties = {}) {
    if (param instanceof MenqueryParam) {
      this.params[param.name] = param
      return param
    }

    param = this._getSchemaParamName(param)
    properties = _.clone(properties)

    if (_.isString(properties)) {
      properties = {default: properties}
    } else if (_.isFunction(properties)) {
      properties = {type: properties}
    }

    if (this.options[param] === false) {
      return false
    }

    properties = _.assign(this._params[param], properties)
    this.params[param] = new MenqueryParam(param, value, properties)

    return this.params[param]
  }

  addAll (params) {
    let keys = _.union(_.keys(this._params), _.keys(params))

    keys.forEach((param) => {
      this.add(param, null, params[param])
    })

    return this.params
  }

  remove (param) {
    delete this.params[param]
  }

  parse (values) {
    let query = {}

    _.forIn(this.params, (param) => {
      let value = values[this._getQueryParamName(param.name)]
      param.value(value)
    })

    _.forIn(this.params, (param) => {
      let value = param.value()
      let bind = param.options.bindTo

      query[bind] = {}

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
        query[bind].skip = this.params.limit.value * (value - 1)
      } else {
        query[bind] = param.parse()
      }
    })

    return query
  }

  validate (values, next = () => {}) {
    let error = false

    _.forIn(this.params, (param) => {
      let value = values[this._getQueryParamName(param.name)]
      param.value(value)
    })

    for (let i in this.params) {
      if (error) break
      let param = this.params[i]
      param.validate((err) => { error = err })
    }

    return next(error)
  }

  _getSchemaParamName (param) {
    return _.findKey(this.options, (option) => option === param) || param
  }

  _getQueryParamName (param) {
    return _.find(this.options, param) || param
  }

}
