import test from 'tape'
import {MenquerySchema, MenqueryParam} from '../src/'

let schema = (params, options) => new MenquerySchema(params, options)

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

test('MenquerySchema add', (t) => {
  t.equal(
    schema().param('test', 123).name,
    'test',
    'should add param')

  t.equal(
    schema().param('test', null, 'string').value(),
    'string',
    'should add param with default string value')

  t.equal(
    schema().param('test', null, 123).value(),
    123,
    'should add param with default number value')

  t.deepEqual(
    schema().param('test', null, new Date('2014-05-05')).value(),
    new Date('2014-05-05'),
    'should add param with default date value')

  t.equal(
    schema().param('test', '123', Number).value(),
    123,
    'should add param with type number')

  t.deepEqual(
    schema().param('test', '2014-05-05', Date).value(),
    new Date('2014-05-05'),
    'should add param with type date')

  t.equal(
    schema({}, {test: false}).param('test', '123'),
    false,
    'should not add param')

  t.deepEqual(
    schema().param(new MenqueryParam('test', '123')).value(),
    '123',
    'should add MenqueryParam instance')

  t.end()
})

test('MenquerySchema manipulation', (t) => {
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

  t.equal(
    Object.keys(schema().param({test: '123', test2: Number})).length,
    6,
    'should add all params')

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
