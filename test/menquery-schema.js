import test from 'tape'
import {Schema, Param} from '../src/'

test('MenquerySchema', (t) => {
  let schema = (params, options) => new Schema(params, options)

  t.test('MenquerySchema add', (st) => {
    let add = (...args) => schema().add('test', ...args).value()
    st.true(schema().add(new Param('test')), 'should add a param with instance')
    st.true(schema().add('test'), 'should add a param')
    st.equal(add('123'), '123', 'should add a param with value')
    st.true(schema().add('test', null, {test: true}).option('test'), 'should add a param with option')
    st.equal(add(null, '123'), '123', 'should add a param with default option string')
    st.equal(add(null, 123), 123, 'should add a param with default option number')
    st.equal(add(null, true), true, 'should add a param with default option boolean')
    st.same(add(null, new Date('2016')), new Date('2016'), 'should add a param with default option date')
    st.same(add(null, /123/i), /123/i, 'should add a param with default option regexp')
    st.equal(add(123, String), '123', 'should add a param with type option string')
    st.equal(add('123', Number), 123, 'should add a param with type option number')
    st.equal(add('123', Boolean), true, 'should add a param with type option boolean')
    st.same(add('2016', Date), new Date('2016'), 'should add a param with type option date')
    st.same(add('123', RegExp), /123/i, 'should add a param with type option regexp')
    st.end()
  })

  t.test('MenquerySchema get', (st) => {
    let mySchema = schema()
    mySchema.add('test')
    st.false(schema().get('test'), 'should not get a nonexistent param')
    st.true(mySchema.get('test'), 'should get a param')
    st.end()
  })

  t.test('MenquerySchema set', (st) => {
    let mySchema = schema()
    mySchema.add('test')
    st.false(schema().set('test', '123'), 'should not set a nonexistent param')
    st.true(mySchema.set('test', '123'), 'should set a param')
    st.true(mySchema.set('test', '123', {test: true}).option('test'), 'should set param option')
    st.end()
  })

  t.test('MenquerySchema option', (st) => {
    let mySchema = schema()
    st.equal(mySchema.option('test', false), false, 'should set option')
    st.equal(mySchema.option('test'), false, 'should get option')
    st.false(mySchema.add('test'), 'should not add disallowed param')
    st.end()
  })

  t.test('MenquerySchema param', (st) => {
    let mySchema = schema()
    st.false(mySchema.param('test'), 'should not get a nonexistent param')
    st.true(mySchema.param('test', null), 'should add a param')
    st.true(mySchema.param('test'), 'should get a param')
    st.true(mySchema.param('test', '123'), 'should set a param')
    st.end()
  })

  t.test('MenquerySchema formatter', (st) => {
    let mySchema = schema({test: '123'})
    let formatter = mySchema.formatter('scream', (scream, value) => {
      return scream ? value.toUpperCase() : value
    })
    st.true(formatter, 'should create a formatter')
    st.false(schema().formatter('scream'), 'should not get a nonexistent formatter')
    st.true(mySchema.formatter('scream'), 'should get a formatter')
    st.true(mySchema.param('test').formatter('scream'), 'should get param formatter')
    st.equal(mySchema.param('test').value(), '123', 'should not format value')
    st.true(mySchema.param('test').option('scream', true), 'should set param option')
    st.equal(mySchema.param('test').value('help'), 'HELP', 'should format value')
    st.true(mySchema.param('f', null).formatter('scream'), 'should get lazy param formatter')
    st.end()
  })

  t.test('MenquerySchema validator', (st) => {
    let mySchema = schema({test: 'help'})
    let validator = mySchema.validator('isPlural', (isPlural, value, param) => ({
      valid: !isPlural || value.toLowerCase().substr(-1) === 's',
      message: param.name + ' must be in plural form.'
    }))
    st.true(validator, 'should create a validator')
    st.false(schema().validator('isPlural'), 'should not get a nonexistent validator')
    st.true(mySchema.validator('isPlural'), 'should get a validator')
    st.true(mySchema.param('test').validator('isPlural'), 'should get param validator')
    st.true(mySchema.validate(), 'should not apply validator')
    st.true(mySchema.param('test').option('isPlural', true), 'should set param option')
    st.false(mySchema.validate(), 'should apply validator and validate false')
    st.true(mySchema.validate({test: 'helps'}), 'should apply validator and validate true')
    st.true(mySchema.param('v', null).validator('isPlural'), 'should get lazy param validator')
    mySchema.validate((err) => st.false(err, 'should call validation success'))
    mySchema.validate({test: 'help'}, (err) => st.false(err.valid, 'should call validation error'))
    st.end()
  })

  t.test('MenquerySchema parser', (st) => {
    let mySchema = schema({test: 'help'})
    let parser = mySchema.parser('elemMatch', (elemMatch, value) => {
      return elemMatch ? {$elemMatch: {[elemMatch]: value}} : value
    })
    st.true(parser, 'should create a parser')
    st.false(schema().parser('elemMatch'), 'should not get a nonexistent parser')
    st.true(mySchema.parser('elemMatch'), 'should get a parser')
    st.true(mySchema.param('test').parser('elemMatch'), 'should get param parser')
    st.same(mySchema.parse().filter, {test: 'help'}, 'should not apply parser')
    st.true(mySchema.param('test').option('elemMatch', 'prop'), 'should set param option')
    st.same(mySchema.parse().filter, {test: {$elemMatch: {prop: 'help'}}}, 'should apply parser')
    st.true(mySchema.param('p', null).parser('elemMatch'), 'should get lazy param parser')
    st.end()
  })

  t.test('MenquerySchema name', (st) => {
    let mySchema = schema({}, {page: 'p'})
    let name = (type, name) => mySchema[`_get${type}ParamName`](name)
    st.equal(name('Schema', 'p'), 'page', 'should get schema param name by query param name')
    st.equal(name('Schema', 'page'), 'page', 'should get schema param name by itself')
    st.equal(name('Query', 'page'), 'p', 'should get query param name by schema param name')
    st.equal(name('Query', 'p'), 'p', 'should get query param name by itself')
    mySchema = schema({test: String}, {test: 't'})
    st.equal(name('Schema', 't'), 'test', 'should get custom schema param name by query param name')
    st.equal(name('Schema', 'test'), 'test', 'should get custom schema param name by itself')
    st.equal(name('Query', 'test'), 't', 'should get custom query param name by schema param name')
    st.equal(name('Query', 't'), 't', 'should get custom query param name by itself')
    st.end()
  })

  t.test('MenquerySchema default parse', (st) => {
    let parse = (...args) => schema().parse(...args)
    st.same(parse({q: 'testing'}).filter._q, /testing/i, 'should parse q')
    st.same(parse({page: 2, limit: 10}).options.skip, 10, 'should parse page')
    st.same(parse({limit: 10}).options.limit, 10, 'should parse limit')
    st.same(parse({sort: '-createdAt'}).options.sort, {createdAt: -1}, 'should parse sort')
    st.same(parse({sort: '-createdAt,name,+test'}).options.sort, {createdAt: -1, name: 1, test: 1}, 'should parse multiple sort')
    st.same(schema({distance: 0}).parse({distance: 23}).filter.distance, 23, 'should parse any')
    st.end()
  })
})
