import test from 'tape'
import {Schema, Param} from '../src/'

let schema = (params, options) => new Schema(params, options)

test('QuerymenSchema add', (t) => {
  let add = (...args) => schema().add('test', ...args).value()
  t.true(schema().add(new Param('test')), 'should add a param with instance')
  t.true(schema().add('test'), 'should add a param')
  t.equal(add('123'), '123', 'should add a param with value')
  t.true(schema().add('test', null, {test: true}).option('test'), 'should add a param with option')
  t.equal(add(null, '123'), '123', 'should add a param with default option string')
  t.equal(add(null, 123), 123, 'should add a param with default option number')
  t.equal(add(null, true), true, 'should add a param with default option boolean')
  t.same(add(null, new Date('2016')), new Date('2016'), 'should add a param with default option date')
  t.same(add(null, /123/i), /123/i, 'should add a param with default option regexp')
  t.equal(add(123, String), '123', 'should add a param with type option string')
  t.equal(add('123', Number), 123, 'should add a param with type option number')
  t.equal(add('123', Boolean), true, 'should add a param with type option boolean')
  t.same(add('2016', Date), new Date('2016'), 'should add a param with type option date')
  t.same(add('123', RegExp), /123/i, 'should add a param with type option regexp')

  t.same(add(null, ['123']), '123', 'should add a param with default option string array')
  t.same(add(null, [123]), 123, 'should add a param with default option number array')
  t.same(add(null, [true]), true, 'should add a param with default option boolean array')
  t.same(add(null, [new Date('2016')]), new Date('2016'), 'should add a param with default option date array')
  t.same(add(null, [/123/i]), /123/i, 'should add a param with default option regexp array')
  t.same(add(123, [String]), '123', 'should add a param with type option string array')
  t.same(add('123,456', [Number]), [123, 456], 'should add a param with type option number array')
  t.same(add('123,0', [Boolean]), [true, false], 'should add a param with type option boolean array')
  t.same(add('2016,2017', [Date]), [new Date('2016'), new Date('2017')], 'should add a param with type option date array')
  t.same(add('123,456', [RegExp]), [/123/i, /456/i], 'should add a param with type option regexp array')
  t.end()
})

test('QuerymenSchema get', (t) => {
  let mySchema = schema()
  mySchema.add('test')
  t.false(schema().get('test'), 'should not get a nonexistent param')
  t.true(mySchema.get('test'), 'should get a param')
  t.end()
})

test('QuerymenSchema set', (t) => {
  let mySchema = schema()
  mySchema.add('test')
  t.false(schema().set('test', '123'), 'should not set a nonexistent param')
  t.true(mySchema.set('test', '123'), 'should set a param')
  t.true(mySchema.set('test', '123', {test: true}).option('test'), 'should set param option')
  t.end()
})

test('QuerymenSchema option', (t) => {
  let mySchema = schema()
  t.equal(mySchema.option('test', false), false, 'should set option')
  t.equal(mySchema.option('test'), false, 'should get option')
  t.false(mySchema.add('test'), 'should not add disallowed param')
  t.end()
})

test('QuerymenSchema param', (t) => {
  let mySchema = schema()
  t.false(mySchema.param('test'), 'should not get a nonexistent param')
  t.true(mySchema.param('test', null), 'should add a param')
  t.true(mySchema.param('test'), 'should get a param')
  t.true(mySchema.param('test', '123'), 'should set a param')
  t.end()
})

test('QuerymenSchema formatter', (t) => {
  let mySchema = schema({test: '123'})
  let formatter = mySchema.formatter('scream', (scream, value) => {
    return scream ? value.toUpperCase() : value
  })
  t.true(formatter, 'should create a formatter')
  t.false(schema().formatter('scream'), 'should not get a nonexistent formatter')
  t.true(mySchema.formatter('scream'), 'should get a formatter')
  t.true(mySchema.param('test').formatter('scream'), 'should get param formatter')
  t.equal(mySchema.param('test').value(), '123', 'should not format value')
  t.true(mySchema.param('test').option('scream', true), 'should set param option')
  t.equal(mySchema.param('test').value('help'), 'HELP', 'should format value')
  t.true(mySchema.param('f', null).formatter('scream'), 'should get lazy param formatter')
  t.end()
})

test('QuerymenSchema validator', (t) => {
  let mySchema = schema({test: 'help'})
  let validator = mySchema.validator('isPlural', (isPlural, value, param) => ({
    valid: !isPlural || value.toLowerCase().substr(-1) === 's',
    message: param.name + ' must be in plural form.'
  }))
  t.true(validator, 'should create a validator')
  t.false(schema().validator('isPlural'), 'should not get a nonexistent validator')
  t.true(mySchema.validator('isPlural'), 'should get a validator')
  t.true(mySchema.param('test').validator('isPlural'), 'should get param validator')
  t.true(mySchema.validate(), 'should not apply validator')
  t.true(mySchema.param('test').option('isPlural', true), 'should set param option')
  t.false(mySchema.validate(), 'should apply validator and validate false')
  t.true(mySchema.validate({test: 'helps'}), 'should apply validator and validate true')
  t.true(mySchema.param('v', null).validator('isPlural'), 'should get lazy param validator')
  mySchema.validate((err) => t.false(err, 'should call validation success'))
  mySchema.validate({test: 'help'}, (err) => t.false(err.valid, 'should call validation error'))
  t.end()
})

test('QuerymenSchema parser', (t) => {
  let mySchema = schema({test: 'help'})
  let parser = mySchema.parser('elemMatch', (elemMatch, value, path) => {
    return elemMatch ? {[path]: {$elemMatch: {[elemMatch]: value}}} : value
  })
  t.true(parser, 'should create a parser')
  t.false(schema().parser('elemMatch'), 'should not get a nonexistent parser')
  t.true(mySchema.parser('elemMatch'), 'should get a parser')
  t.true(mySchema.param('test').parser('elemMatch'), 'should get param parser')
  t.same(mySchema.parse().query, {test: 'help'}, 'should not apply parser')
  t.true(mySchema.param('test').option('elemMatch', 'prop'), 'should set param option')
  t.same(mySchema.parse().query, {test: {$elemMatch: {prop: 'help'}}}, 'should apply parser')
  t.true(mySchema.param('p', null).parser('elemMatch'), 'should get lazy param parser')
  t.end()
})

test('QuerymenSchema name', (t) => {
  let mySchema = schema({}, {page: 'p'})
  let name = (type, name) => mySchema[`_get${type}ParamName`](name)
  t.equal(name('Schema', 'p'), 'page', 'should get schema param name by query param name')
  t.equal(name('Schema', 'page'), 'page', 'should get schema param name by itself')
  t.equal(name('Query', 'page'), 'p', 'should get query param name by schema param name')
  t.equal(name('Query', 'p'), 'p', 'should get query param name by itself')
  mySchema = schema({test: String}, {test: 't'})
  t.equal(name('Schema', 't'), 'test', 'should get custom schema param name by query param name')
  t.equal(name('Schema', 'test'), 'test', 'should get custom schema param name by itself')
  t.equal(name('Query', 'test'), 't', 'should get custom query param name by schema param name')
  t.equal(name('Query', 't'), 't', 'should get custom query param name by itself')
  t.end()
})

test('QuerymenSchema default parse', (t) => {
  let parse = (...args) => schema().parse(...args)
  t.same(parse({q: 'testing'}).query.keywords, /testing/i, 'should parse q')
  t.same(parse().select, {}, 'should not parse undefined select')
  t.same(parse({fields: ''}).select, {}, 'should not parse empty select')
  t.same(parse({fields: 'a'}).select, {a: 1}, 'should parse one select')
  t.same(parse({fields: '-id'}).select, {_id: 0}, 'should parse fields=id to fields=_id')
  t.same(parse({fields: 'id'}).select, {_id: 1}, 'should parse fields=id to fields=_id')
  t.same(parse({fields: '-a,b,+c'}).select, {a: 0, b: 1, c: 1}, 'should parse multiple select')
  t.same(parse({page: 2, limit: 10}).cursor.skip, 10, 'should parse page')
  t.same(parse({limit: 10}).cursor.limit, 10, 'should parse limit')
  t.same(parse({sort: ''}).cursor.sort, {createdAt: -1}, 'should not parse empty sort')
  t.same(parse({sort: '-a'}).cursor.sort, {a: -1}, 'should parse sort')
  t.same(parse({sort: '-a,b,+c'}).cursor.sort, {a: -1, b: 1, c: 1}, 'should parse multiple sort')
  t.same(schema({distance: 0}).parse({distance: 23}).query.distance, 23, 'should parse any')

  let near = (params, values) => schema(params, {near: true}).parse(values).query

  t.false(parse({near: '-22.84377,-44.3213214'}).query.location, 'should not enable near param by default')

  t.same(
    near({}, {near: '-22.84377,-44.3213214'}).location,
    {$near: {$geometry: {type: 'Point', coordinates: [-44.3213214, -22.84377]}}},
    'should parse near')

  t.same(
    near({}, {near: '-22.84377,-44.3213214', min_distance: 56}).location,
    {$near: {$geometry: {type: 'Point', coordinates: [-44.3213214, -22.84377]}, $minDistance: 56}},
    'should parse near min_distance')

  t.same(
    near({}, {near: '-22.84377,-44.3213214', max_distance: 56}).location,
    {$near: {$geometry: {type: 'Point', coordinates: [-44.3213214, -22.84377]}, $maxDistance: 56}},
    'should parse near max_distance')

  t.same(
    near({near: {min_distance: false}}, {near: '-22.84377,-44.3213214', min_distance: 56}).location,
    {$near: {$geometry: {type: 'Point', coordinates: [-44.3213214, -22.84377]}}},
    'should not parse near min_distance')

  t.same(
    near({near: {max_distance: false}}, {near: '-22.84377,-44.3213214', max_distance: 56}).location,
    {$near: {$geometry: {type: 'Point', coordinates: [-44.3213214, -22.84377]}}},
    'should not parse near max_distance')

  t.false(near({}, {min_distance: 56}).min_distance, 'should not parse min_distance without near')
  t.false(near({}, {max_distance: 56}).max_distance, 'should not parse max_distance without near')
  t.false(near({}, {near: '-22.84377,-44.3213214', min_distance: 56}).min_distance, 'should not parse min_distance')
  t.false(near({}, {near: '-22.84377,-44.3213214', max_distance: 56}).max_distance, 'should not parse max_distance')

  t.same(
    near({near: {geojson: false}}, {near: '-22.84377,-44.3213214'}).location,
    {$near: [-44.3213214, -22.84377]},
    'should parse near no geojson')

  t.same(
    near({near: {geojson: false}}, {near: '-22.84377,-44.3213214', min_distance: 56}).location,
    {$near: [-44.3213214, -22.84377], $minDistance: 56 / 6371000},
    'should parse near min_distance no geojson')

  t.same(
    near({near: {geojson: false}}, {near: '-22.84377,-44.3213214', max_distance: 56}).location,
    {$near: [-44.3213214, -22.84377], $maxDistance: 56 / 6371000},
    'should parse near max_distance no geojson')

  t.end()
})
