import _ from 'lodash'
import MenqueryParam from './menquery-param'
import MenquerySchema from './menquery-schema'

/**
 * Validator object.
 * @typedef {Object} Validator
 * @property {boolean} valid - Indicates if the value is valid or not.
 * @property {string} message - The error message.
 * @property {string} [param] - The name of the param.
 * @property {*} [value] - The value of the param.
 */
/**
 * Param parser callback.
 * @callback parserFn
 * @param {*} parserValue - The value passed to the parser.
 * @param {*} paramValue - The value passed to the param.
 * @param {MenqueryParam} param - The `MenqueryParam` object.
 * @return {*} The parsed value
 */
/**
 * Param formatter callback.
 * @callback formatterFn
 * @param {*} formatterValue - The value passed to the formatter.
 * @param {*} paramValue - The value passed to the param.
 * @param {MenqueryParam} param - The `MenqueryParam` object.
 * @return {*} The formatted value
 */
/**
 * Param validator callback.
 * @callback validatorFn
 * @param {*} validatorValue - The value passed to the validator.
 * @param {*} paramValue - The value passed to the param.
 * @param {MenqueryParam} param - The `MenqueryParam` object.
 * @return {Validator}
 */

export {MenqueryParam as Param}
export {MenquerySchema as Schema}

export default function menquery (schema, options) {
  return function (req, res, next) {
    let _schema = schema instanceof MenquerySchema
                ? _.clone(schema)
                : new MenquerySchema(schema, options)

    _schema.validate(req.query, (err) => {
      if (err) {
        res.status(400)
        return next(err)
      }

      req = _.merge(req, _schema.parse())
      next()
    })
  }
}
