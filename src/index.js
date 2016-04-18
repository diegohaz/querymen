import _ from 'lodash'
import MenqueryParam from './menquery-param'
import MenquerySchema from './menquery-schema'

export {MenqueryParam, MenquerySchema}

export default function menquery (schema, options) {
  if (schema instanceof MenquerySchema === false) {
    schema = new MenquerySchema(schema, options)
  }

  return function (req, res, next) {
    schema.validate(req.query, (err) => {
      if (err) {
        return next(err)
      }

      req = _.merge(req, schema.parse())
      next()
    })
  }
}
