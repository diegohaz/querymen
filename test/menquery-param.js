import test from 'tape'
import _ from 'lodash'
import {Param} from '../src/'

let param = (value, options) => new Param('test', value, options)

test('MenqueryParam type', (t) => {
  t.equal(
    param(23, {type: String}).value(),
    '23',
    'should be converted to string')

  t.equal(
    param('23', {type: Number}).value(),
    23,
    'should be converted to number')

  t.equal(
    param('1', {type: Boolean}).value(),
    true,
    'should be converted to boolean')

  t.deepEqual(
    param('testing', {type: RegExp}).value(),
    new RegExp('testing', 'i'),
    'should be converted to RegExp')

  t.deepEqual(
    param('2016-04-18', {type: Date}).value(),
    new Date('2016-04-18'),
    'should be converted to date')

  t.end()
})

test('MenqueryParam type with multiple value', (t) => {
  t.deepEqual(
    param('23, 24', {type: String, multiple: true}).value(),
    ['23', '24'],
    'should be converted to string')

  t.deepEqual(
    param('23, 24', {type: Number, multiple: true}).value(),
    [23, 24],
    'should be converted to number')

  t.deepEqual(
    param('1,false,0,-1', {type: Boolean, multiple: true}).value(),
    [true, false, false, true],
    'should be converted to boolean')

  t.deepEqual(
    param('testing, test', {type: RegExp, multiple: true}).value(),
    [new RegExp('testing', 'i'), new RegExp('test', 'i')],
    'should be converted to RegExp')

  t.deepEqual(
    param('2016-04-18,2018-04-18', {type: Date, multiple: true}).value(),
    [new Date('2016-04-18'), new Date('2018-04-18')],
    'should be converted to date')

  t.end()
})

test('MenqueryParam value', (t) => {
  t.equal(
    param(null, {default: 'Hello'}).value(),
    'Hello',
    'should set default value string')

  t.equal(
    param(null, {type: Number, default: 30}).value(),
    30,
    'should set default value number')

  t.equal(
    param('Test', {default: 'Hello'}).value(),
    'Test',
    'should not set default value string')

  t.equal(
    param(20, {type: Number, default: 30}).value(),
    20,
    'should not set default value number')

  t.equal(
    param(null, {default: () => 'Hello'}).value(),
    'Hello',
    'should set default value with function')

  t.equal(
    param(null, {type: String, default: 12}).value(),
    '12',
    'should set default value with different type')

  t.equal(
    param('Bé_ free!', {normalize: true}).value(),
    'be free',
    'should normalize value')

  t.equal(
    param('lower', {uppercase: true}).value(),
    'LOWER',
    'should uppercase value')

  t.equal(
    param('UPPER', {lowercase: true}).value(),
    'upper',
    'should lowercase value')

  t.equal(
    param('   trim ', {trim: true}).value(),
    'trim',
    'should trim value')

  t.equal(
    param('   trim ', {trim: false}).value(),
    '   trim ',
    'should not trim value')

  t.deepEqual(
    param('Hello', {get: (value, param) => param.name + value + '!'}).value(),
    'testHello!',
    'should get value')

  t.deepEqual(
    param('Hello', {set: (value, param) => param.name + value + '!'}).value(),
    'testHello!',
    'should set value')

  t.end()
})

test('MenqueryParam value with multiple value', (t) => {
  t.deepEqual(
    param('Bé_ free!,Bê smart!', {normalize: true, multiple: true}).value(),
    ['be free', 'be smart'],
    'should normalize value')

  t.deepEqual(
    param('lower,lower', {uppercase: true, multiple: true}).value(),
    ['LOWER', 'LOWER'],
    'should uppercase value')

  t.deepEqual(
    param('UPPER,UPPER', {lowercase: true, multiple: true}).value(),
    ['upper', 'upper'],
    'should lowercase value')

  t.deepEqual(
    param('   trim , trim ', {trim: true, multiple: true}).value(),
    ['trim', 'trim'],
    'should trim value')

  t.deepEqual(
    param('   trim , trim ', {trim: false, multiple: true}).value(),
    ['   trim ', ' trim '],
    'should not trim value')

  t.deepEqual(
    param('Hello,Hi', {get: (value) => value + '!', multiple: true}).value(),
    ['Hello!', 'Hi!'],
    'should get value')

  t.deepEqual(
    param('Hello,Hi', {set: (value) => value + '!', multiple: true}).value(),
    ['Hello!', 'Hi!'],
    'should set value')

  t.end()
})

test('MenqueryParam validate', (t) => {
  t.equal(
    param().validate(),
    true,
    'should validate no options with success')

  t.equal(
    param().validate((err) => !!err),
    false,
    'should return callback return')

  t.equal(
    param('Test', {required: true}).validate(),
    true,
    'should validate required with success')

  t.equal(
    param(null, {required: true}).validate(),
    false,
    'should validate required with error')

  t.equal(
    param(4, {type: Number, min: 4}).validate(),
    true,
    'should validate min with success')

  t.equal(
    param(3, {type: Number, min: 4}).validate(),
    false,
    'should validate min with error')

  t.equal(
    param(4, {type: Number, max: 4}).validate(),
    true,
    'should validate max with success')

  t.equal(
    param(5, {type: Number, max: 4}).validate(),
    false,
    'should validate max with error')

  t.equal(
    param('test', {minlength: 4}).validate(),
    true,
    'should validate minlength with success')

  t.equal(
    param('tests', {minlength: 4}).validate(),
    true,
    'should validate minlength with success')

  t.equal(
    param('tes', {minlength: 4}).validate(),
    false,
    'should validate minlength with error')

  t.equal(
    param('test', {maxlength: 4}).validate(),
    true,
    'should validate maxlength with success')

  t.equal(
    param('tes', {maxlength: 4}).validate(),
    true,
    'should validate maxlength with success')

  t.equal(
    param('tests', {maxlength: 4}).validate(),
    false,
    'should validate maxlength with error')

  t.equal(
    param('test', {enum: ['test']}).validate(),
    true,
    'should validate enum with success')

  t.equal(
    param('tests', {enum: ['test']}).validate(),
    false,
    'should validate enum with error')

  t.equal(
    param('Test', {match: /^[a-z]+$/i}).validate(),
    true,
    'should validate match with success')

  t.equal(
    param('23', {match: /^[a-z]$/}).validate(),
    false,
    'should validate match with error')

  t.end()
})

test('MenqueryParam validate with multiple value', (t) => {
  t.equal(
    param(null, {multiple: true}).validate(',,,'),
    true,
    'should validate no options with success')

  t.equal(
    param('Test,Test', {required: true, multiple: true}).validate(),
    true,
    'should validate required with success')

  t.equal(
    param(',,Test', {required: true, multiple: true}).validate(),
    false,
    'should validate required with error')

  t.equal(
    param('4,5', {type: Number, min: 4, multiple: true}).validate(),
    true,
    'should validate min with success')

  t.equal(
    param('3,4', {type: Number, min: 4, multiple: true}).validate(),
    false,
    'should validate min with error')

  t.equal(
    param('3,4', {type: Number, max: 4, multiple: true}).validate(),
    true,
    'should validate max with success')

  t.equal(
    param('4,5', {type: Number, max: 4, multiple: true}).validate(),
    false,
    'should validate max with error')

  t.equal(
    param('test,tests', {minlength: 4, multiple: true}).validate(),
    true,
    'should validate minlength with success')

  t.equal(
    param('test,tes', {minlength: 4, multiple: true}).validate(),
    false,
    'should validate minlength with error')

  t.equal(
    param('test,tes', {maxlength: 4, multiple: true}).validate(),
    true,
    'should validate maxlength with success')

  t.equal(
    param('test,tests', {maxlength: 4, multiple: true}).validate(),
    false,
    'should validate maxlength with error')

  t.equal(
    param('test,test', {enum: ['test'], multiple: true}).validate(),
    true,
    'should validate enum with success')

  t.equal(
    param('test,tests', {enum: ['test'], multiple: true}).validate(),
    false,
    'should validate enum with error')

  t.equal(
    param('Test,aaaa', {match: /^[a-z]+$/i, multiple: true}).validate(),
    true,
    'should validate match with success')

  t.equal(
    param('Test,23', {match: /^[a-z]$/, multiple: true}).validate(),
    false,
    'should validate match with error')

  t.end()
})

test('MenqueryParam parse', (t) => {
  t.deepEqual(
    param().parse(),
    {},
    'should parse nothing')

  t.deepEqual(
    param().parse(123),
    {test: '123'},
    'should parse $eq')

  t.deepEqual(
    param(null, {multiple: true}).parse('123,456'),
    {test: {$in: ['123', '456']}},
    'should parse $in')

  t.deepEqual(
    param(123, {operator: '$ne'}).parse(),
    {test: {$ne: '123'}},
    'should parse $ne')

  t.deepEqual(
    param('123,456', {operator: '$ne', multiple: true}).parse(),
    {test: {$nin: ['123', '456']}},
    'should parse $nin')

  t.deepEqual(
    param(123, {type: Number, operator: '$gt'}).parse(),
    {test: {$gt: 123}},
    'should parse $gt')

  t.deepEqual(
    param(123, {type: Number, operator: '$gte'}).parse(),
    {test: {$gte: 123}},
    'should parse $gte')

  t.deepEqual(
    param(123, {type: Number, operator: '$lt'}).parse(),
    {test: {$lt: 123}},
    'should parse $lt')

  t.deepEqual(
    param(123, {type: Number, operator: '$lte'}).parse(),
    {test: {$lte: 123}},
    'should parse $lte')

  t.end()
})

test('MenqueryParam parse $or', (t) => {
  let or = (value, options) => param(value, _.assign({paths: ['test1', 'test2']}, options))

  t.deepEqual(
    or(123).parse(),
    {$or: [{test1: '123'}, {test2: '123'}]},
    'should parse $eq')

  t.deepEqual(
    or('123,456', {multiple: true}).parse(),
    {$or: [{test1: {$in: ['123', '456']}}, {test2: {$in: ['123', '456']}}]},
    'should parse $in')

  t.deepEqual(
    or(123, {operator: '$ne'}).parse(),
    {$or: [{test1: {$ne: '123'}}, {test2: {$ne: '123'}}]},
    'should parse $ne')

  t.deepEqual(
    or('123,456', {operator: '$ne', multiple: true}).parse(),
    {$or: [{test1: {$nin: ['123', '456']}}, {test2: {$nin: ['123', '456']}}]},
    'should parse $nin')

  t.deepEqual(
    or(123, {type: Number, operator: '$gt'}).parse(),
    {$or: [{test1: {$gt: 123}}, {test2: {$gt: 123}}]},
    'should parse $gt')

  t.deepEqual(
    or(123, {type: Number, operator: '$gte'}).parse(),
    {$or: [{test1: {$gte: 123}}, {test2: {$gte: 123}}]},
    'should parse $gte')

  t.deepEqual(
    or(123, {type: Number, operator: '$lt'}).parse(),
    {$or: [{test1: {$lt: 123}}, {test2: {$lt: 123}}]},
    'should parse $lt')

  t.deepEqual(
    or(123, {type: Number, operator: '$lte'}).parse(),
    {$or: [{test1: {$lte: 123}}, {test2: {$lte: 123}}]},
    'should parse $lte')

  t.end()
})

test('MenqueryParam option', (t) => {
  t.ok(
    param().option('paths'),
    'should get option')

  t.notOk(
    param().option('isPlural'),
    'should not get nonexistent option')

  t.end()
})

test('MenqueryParam formatter', (t) => {
  let formatterParam = param()
  formatterParam.formatter('capitalize', (capitalize, value, param) => {
    return capitalize ? _.capitalize(value) : value
  })

  t.notOk(
    param().formatter('capitalize'),
    'should not get nonexistent formatter')

  t.ok(
    formatterParam.formatter('capitalize'),
    'should get custom formatter')

  t.equal(
    formatterParam.value('TEST'),
    'TEST',
    'should not apply custom formatter if option was not passed')

  t.ok(
    formatterParam.option('capitalize', true),
    'should set option')

  t.equal(
    formatterParam.value('TEST'),
    'Test',
    'should apply custom formatter')

  t.end()
})

test('MenqueryParam parser', (t) => {
  let parserParam = param()
  parserParam.parser('makeLowercase', parserParam.formatter('lowercase'))

  t.notOk(
    param().parser('makeLowercase'),
    'should not get nonexistent parser')

  t.ok(
    parserParam.parser('makeLowercase'),
    'should get custom parser')

  t.deepEqual(
    parserParam.parse('TEST'),
    {test: 'TEST'},
    'should not apply custom parser if option was not passed')

  t.ok(
    parserParam.option('makeLowercase', true),
    'should set option')

  t.deepEqual(
    parserParam.parse('TEST'),
    {test: 'test'},
    'should apply custom parser')

  parserParam.option('multiple', true)

  t.deepEqual(
    parserParam.parse('TEST,FOO'),
    {test: {$in: ['test', 'foo']}},
    'should apply custom parser to multiple values')

  t.end()
})

test('MenqueryParam validator', (t) => {
  let validatorParam = param()
  validatorParam.validator('isPlural', (isPlural, value, param) => ({
    valid: !isPlural || value.substr(-1) === 's'
  }))

  t.ok(
    param().validator('minlength'),
    'should get validator')

  t.notOk(
    param().validator('isPlural'),
    'should not get nonexistent validator')

  t.ok(
    validatorParam.validator('isPlural'),
    'should get custom validator')

  t.ok(
    validatorParam.validate('test'),
    'should not apply custom validator if option was not passed')

  t.ok(
    validatorParam.option('isPlural', true),
    'should set option')

  t.notOk(
    validatorParam.validate('test'),
    'should not apply custom validator and validate with error')

  t.ok(
    validatorParam.validate('tests'),
    'should not apply custom validator and validate with success')

  t.end()
})
