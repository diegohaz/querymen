import _ from 'lodash'
import MenqueryParam from './menquery-param'
import MenquerySchema from './menquery-schema'

export {MenqueryParam, MenquerySchema}

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
