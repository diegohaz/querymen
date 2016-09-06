import _ from 'lodash'
import Param from 'rich-param'

/** QuerymenParam class. */
export default class QuerymenParam extends Param {

  /**
   * Create a param.
   * @param {string} name - Param name.
   * @param {*} [value] - The value of the param.
   * @param {Object} [options] - Options of the param.
   * @param {Object} [schema] - Schema of the param.
   */
  constructor (name, value, options = {}) {
    super(name, value, options)
    this.handlers.parsers = {}
    this.options = _.assign({
      paths: [name],
      operator: '$eq',
      parse: (value, path, operator, param) => {
        if (operator === '$eq') {
          return {[path]: value}
        } else if (_.isRegExp(value)) {
          return operator === '$ne' ? {[path]: {$not: value}} : {[path]: value}
        } else {
          return {[path]: {[operator]: value}}
        }
      }
    }, this.options)
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
      query = parser(value, path, operator, this)
    })

    return query
  }
}
