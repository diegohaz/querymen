import test from 'tape'
import {MenqueryParam} from '../src/'

let param = (value, options) => new MenqueryParam('test', value, options)

test('MenqueryParam type', (t) => {
  t.equal(param(23, {type: String}).value(), '23', 'should be converted to string')
  t.equal(param('23', {type: Number}).value(), 23, 'should be converted to number')
  t.end()
})

test('MenqueryParam type with multiple value', (t) => {
  t.deepEqual(param('23, 24', {type: String}).value(), ['23', '24'], 'should be converted to string')
  t.deepEqual(param('23, 24', {type: Number}).value(), [23, 24], 'should be converted to number')
  t.end()
})

test('MenqueryParam filter', (t) => {
  t.equal(param(null, {default: 'Hello'}).value(), 'Hello', 'should set default value')
  t.equal(param(null, {type: String, default: 12}).value(), '12', 'should set default value with type')
  t.equal(param('Bé_ free!', {normalize: true}).value(), 'be free', 'should normalize value')
  t.equal(param('lower', {uppercase: true}).value(), 'LOWER', 'should uppercase value')
  t.equal(param('UPPER', {lowercase: true}).value(), 'upper', 'should lowercase value')
  t.equal(param('   trim ', {trim: true}).value(), 'trim', 'should trim value')
  t.equal(param('   trim ', {trim: false}).value(), '   trim ', 'should not trim value')
  t.end()
})

test('MenqueryParam filter with multiple value', (t) => {
  t.deepEqual(param('Bé_ free!,Bê smart!', {normalize: true}).value(), ['be free', 'be smart'], 'should normalize value')
  t.deepEqual(param('lower,lower', {uppercase: true}).value(), ['LOWER', 'LOWER'], 'should uppercase value')
  t.deepEqual(param('UPPER,UPPER', {lowercase: true}).value(), ['upper', 'upper'], 'should lowercase value')
  t.end()
})

test('MenqueryParam validation', (t) => {
  t.equal(param().validate(), true, 'should validate no options with success')
  t.equal(param('Test', {required: true}).validate(), true, 'should validate required with success')
  t.equal(param(null, {required: true}).validate(), false, 'should validate required with error')
  t.equal(param(4, {type: Number, min: 4}).validate(), true, 'should validate min with success')
  t.equal(param(3, {type: Number, min: 4}).validate(), false, 'should validate min with error')
  t.equal(param(4, {type: Number, max: 4}).validate(), true, 'should validate max with success')
  t.equal(param(5, {type: Number, max: 4}).validate(), false, 'should validate max with error')
  t.equal(param('test', {minlength: 4}).validate(), true, 'should validate minlength with success')
  t.equal(param('tests', {minlength: 4}).validate(), true, 'should validate minlength with success')
  t.equal(param('tes', {minlength: 4}).validate(), false, 'should validate minlength with error')
  t.equal(param('test', {maxlength: 4}).validate(), true, 'should validate maxlength with success')
  t.equal(param('tes', {maxlength: 4}).validate(), true, 'should validate maxlength with success')
  t.equal(param('tests', {maxlength: 4}).validate(), false, 'should validate maxlength with error')
  t.equal(param('test', {enum: ['test']}).validate(), true, 'should validate enum with success')
  t.equal(param('tests', {enum: ['test']}).validate(), false, 'should validate enum with error')
  t.equal(param('Test', {match: /^[a-z]+$/i}).validate(), true, 'should validate match with success')
  t.equal(param('23', {match: /^[a-z]$/}).validate(), false, 'should validate match with error')
  t.end()
})

test('MenqueryParam validation with multiple value', (t) => {
  t.equal(param().validate(',,,'), true, 'should validate no options with success')
  t.equal(param('Test,Test', {required: true}).validate(), true, 'should validate required with success')
  t.equal(param(',,Test', {required: true}).validate(), false, 'should validate required with error')
  t.equal(param('4,5', {type: Number, min: 4}).validate(), true, 'should validate min with success')
  t.equal(param('3,4', {type: Number, min: 4}).validate(), false, 'should validate min with error')
  t.equal(param('3,4', {type: Number, max: 4}).validate(), true, 'should validate max with success')
  t.equal(param('4,5', {type: Number, max: 4}).validate(), false, 'should validate max with error')
  t.equal(param('test,tests', {minlength: 4}).validate(), true, 'should validate minlength with success')
  t.equal(param('test,tes', {minlength: 4}).validate(), false, 'should validate minlength with error')
  t.equal(param('test,tes', {maxlength: 4}).validate(), true, 'should validate maxlength with success')
  t.equal(param('test,tests', {maxlength: 4}).validate(), false, 'should validate maxlength with error')
  t.equal(param('test,test', {enum: ['test']}).validate(), true, 'should validate enum with success')
  t.equal(param('test,tests', {enum: ['test']}).validate(), false, 'should validate enum with error')
  t.equal(param('Test,aaaa', {match: /^[a-z]+$/i}).validate(), true, 'should validate match with success')
  t.equal(param('Test,23', {match: /^[a-z]$/}).validate(), false, 'should validate match with error')
  t.end()
})
