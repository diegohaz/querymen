import test from 'tape'
import {Schema, Param} from '../src/'

let schema = (params, options) => new Schema(params, options)

test('MenquerySchema param name', (t) => {
  t.equal(
    schema({}, {page: 'p'})._getSchemaParamName('p'),
    'page',
    'should get schema param name by query param name')

  t.equal(
    schema({}, {page: 'p'})._getSchemaParamName('page'),
    'page',
    'should get schema param name by schema param name')

  t.equal(
    schema({}, {page: 'p'})._getQueryParamName('page'),
    'p',
    'should get query param name by schema param name')

  t.equal(
    schema({}, {page: 'p'})._getQueryParamName('p'),
    'p',
    'should get query param name by query param name')

  t.equal(
    schema({test: String}, {test: 't'})._getSchemaParamName('t'),
    'test',
    'should get schema param name by query param name for custom param')

  t.equal(
    schema({test: String}, {test: 't'})._getSchemaParamName('test'),
    'test',
    'should get schema param name by schema param name for custom param')

  t.equal(
    schema({test: String}, {test: 't'})._getQueryParamName('test'),
    't',
    'should get query param name by schema param name for custom param')

  t.equal(
    schema({test: String}, {test: 't'})._getQueryParamName('t'),
    't',
    'should get query param name by query param name for custom param')

  t.end()
})

test('MenquerySchema get/set/add', (t) => {
  t.notOk(
    schema().get('test'),
    'should not get nonexistent param')

  t.equal(
    schema({test: 123}).get('test').value(),
    123,
    'should get param')

  t.notOk(
    schema({test: 123}, {test: false}).get('test'),
    'should not get param')

  t.notOk(
    schema().set('test', 123),
    'should not set nonexistent param')

  t.equal(
    schema({test: 123}).set('test', '456').value(),
    456,
    'should set param')

  t.ok(
    schema({test: 123}).set('test', '456', {required: true}).option('required'),
    'should set param with options')

  t.equal(
    schema().add('test', 123).name,
    'test',
    'should add param')

  t.equal(
    schema().add('test', null, 'string').value(),
    'string',
    'should add param with default string value')

  t.equal(
    schema().add('test', null, 123).value(),
    123,
    'should add param with default number value')

  t.deepEqual(
    schema().add('test', null, new RegExp('test', 'i')).value(),
    new RegExp('test', 'i'),
    'should add param with default regexp value')

  t.deepEqual(
    schema().add('test', null, new Date('2014-05-05')).value(),
    new Date('2014-05-05'),
    'should add param with default date value')

  t.equal(
    schema().add('test', '123', Number).value(),
    123,
    'should add param with type number')

  t.deepEqual(
    schema().add('test', 'test', RegExp).value(),
    new RegExp('test', 'i'),
    'should add param with type regexp')

  t.deepEqual(
    schema().add('test', '2014-05-05', Date).value(),
    new Date('2014-05-05'),
    'should add param with type date')

  t.notOk(
    schema({}, {test: false}).add('test', '123'),
    'should not add param')

  t.deepEqual(
    schema().add(new Param('test', '123')).value(),
    '123',
    'should add MenqueryParam instance')

  t.notOk(
    schema({}, {test: false}).add(new Param('test', '123')),
    'should not add MenqueryParam instance')

  t.end()
})

test('MenquerySchema option', (t) => {
  let mySchema = schema()

  t.notOk(
    mySchema.option('test'),
    'should not get nonexistent option')

  t.ok(
    mySchema.option('test', true),
    'should set option')

  t.ok(
    mySchema.option('test'),
    'should get option')

  t.end()
})

test('MenquerySchema handler', (t) => {
  let handlerSchema = schema()
  let param = handlerSchema.add('testParam')

  t.notOk(param.parser('testParser'), 'should not exist parser in param')
  t.notOk(param.formatter('testFormatter'), 'should not exist formatter in param')
  t.notOk(param.validator('testValidator'), 'should not exist validator in param')

  t.notOk(handlerSchema.parser('testParser'), 'should not get nonexistent parser')
  t.notOk(handlerSchema.formatter('testFormatter'), 'should not get nonexistent formatter')
  t.notOk(handlerSchema.validator('testValidator'), 'should not get nonexistent validator')

  handlerSchema.parser('testParser', () => 'test')
  handlerSchema.formatter('testFormatter', () => 'test')
  handlerSchema.validator('testValidator', () => ({valid: false}))

  t.ok(param.parser('testParser'), 'should exist parser in param')
  t.ok(param.formatter('testFormatter'), 'should exist formatter in param')
  t.ok(param.validator('testValidator'), 'should exist validator in param')

  t.ok(handlerSchema.parser('testParser'), 'should get parser')
  t.ok(handlerSchema.formatter('testFormatter'), 'should get formatter')
  t.ok(handlerSchema.validator('testValidator'), 'should get validator')

  let param2 = handlerSchema.add('testParam2')

  t.ok(param2.parser('testParser'), 'should exist parser in param2')
  t.ok(param2.formatter('testFormatter'), 'should exist formatter in param2')
  t.ok(param2.validator('testValidator'), 'should exist validator in param2')

  t.end()
})

test('MenquerySchema param', (t) => {
  t.equal(
    schema().param('test', '123').value(),
    '123',
    'should set new param')

  t.equal(
    schema({test: 123}).param('test', 456).value(),
    456,
    'should set existing param')

  t.equal(
    schema().param('sort').name,
    'sort',
    'should get param')

  t.end()
})

test('MenquerySchema parse', (t) => {
  t.deepEqual(
    schema().parse({q: 'testing'}).filter._q,
    /testing/i,
    'should parse q')

  t.deepEqual(
    schema().parse({page: 2, limit: 10}).options.skip,
    10,
    'should parse page')

  t.deepEqual(
    schema().parse({limit: 10}).options.limit,
    10,
    'should parse limit')

  t.deepEqual(
    schema().parse({sort: '-createdAt'}).options.sort,
    {createdAt: -1},
    'should parse sort')

  t.deepEqual(
    schema().parse({sort: '-createdAt,name,+test'}).options.sort,
    {createdAt: -1, name: 1, test: 1},
    'should parse multiple sort')

  t.deepEqual(
    schema({distance: 0}).parse({distance: 23}).filter.distance,
    23,
    'should parse any')

  t.end()
})

test('MenquerySchema validate', (t) => {
  t.equal(
    schema().validate(),
    true,
    'should validate no options with success')

  t.equal(
    schema().validate((err) => !!err),
    false,
    'should return callback return')

  t.equal(
    schema().validate({page: 50}),
    false,
    'should validate with error')

  t.end()
})
