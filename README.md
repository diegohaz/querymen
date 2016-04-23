# Menquery

[![JS Standard Style][standard-image]][standard-url]
[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coveralls Status][coveralls-image]][coveralls-url]
[![Dependency Status][depstat-image]][depstat-url]
[![Downloads][download-badge]][npm-url]

> Querystring parser middleware for MongoDB, Express and Nodejs

## Install

```sh
npm install --save menquery
```

## Usage

Simple example using [express](https://github.com/expressjs/express) and [mongoose](https://github.com/Automattic/mongoose), when a user requests `/posts?page=2&limit=20&sort=-createdAt`
```js
var menquery = require('menquery');

app.get('/posts', menquery(), function(req, res) {
  console.log(req.options); // {limit: 20, skip: 20, sort: {createdAt: -1}}

  Post.find({}, null, req.options).then(function(posts) {
    // do something
  });
});
```

### MenquerySchema

#### Defining a schema

With Menquery you can set a schema similar to [Mongoose Schemas](http://mongoosejs.com/docs/guide.html). It helps you to take control of which and how querystring parameters are parsed. For example, when a user requests `/posts?after_date=2016-04-21`
```js
var menquery = require('menquery');
var MenquerySchema = require('menquery').MenquerySchema;

var schema = new MenquerySchema({
  after_date: {
    type: Date,
    paths: ['createdAt'],
    operator: '$gte'
  }
});

app.get('/posts', menquery(schema), function(req, res) {
  console.log(req.filter); // {createdAt: {$gte: new Date('2016-04-21')}}
});
```
Or just pass directly to menquery():

```js
var menquery = require('menquery');

app.get('/posts', menquery({
  after_date: {
    type: Date,
    paths: ['createdAt'],
    operator: '$gte'
  }
}), function(err, req, res, next) {
  console.log(req.filter); // {createdAt: {$gte: new Date('2016-04-21')}}
});
```

#### Default schema

Every instance of MenquerySchema has some parameters set by default:

```js
q: {
  type: String,
  normalize: true,
  regex: true,
  paths: ['_q']
},
page: {
  type: Number,
  default: 1,
  max: 30,
  min: 1,
  bindTo: 'options'
},
limit: {
  type: Number,
  default: 30,
  max: 100,
  min: 1,
  bindTo: 'options'
},
sort: {
  type: String,
  default: 'name',
  multiple: true,
  bindTo: 'options'
}
```

#### Overriding default schema

You can override some properties of default parameters:
```js
var schema = new MenquerySchema({
  q: {
    paths: ['name'] // overrides paths: ['_q']
  },
  page: {
    max: 50 // overrides max: 30
  },
  sort: {
    default: '-createdAt' // overrides default: 'name'
  }
});
```
You can change parameters names passing options as the second parameter (in this case, users will request `/posts?term=text` instead of `/posts?q=text`):
```js
var schema = new MenquerySchema({
  q: {
    paths: ['name']
  }
}, {q: 'term'});
```
You can also disable one or more default parameters (in this case, even the users request `/posts?q=text`, it will not be passed to `req.filter`):
```js
var schema = new MenquerySchema({}, {q: false}); 
```

#### Schema shorthands

You can use some shorthands similar to [Mongoose Schema](http://mongoosejs.com/docs/guide.html):

```js
var schema = new MenquerySchema({
  after_date: Date, // {type: Date}
  user: mongoose.Types.ObjectId, // {type: mongoose.Types.ObjectId}
  limit: 100, // {type: Number, default: 100}
  gender: 'F' // {type: String, default: 'F'}
});
```

#### Parsing schema

`menquery()` middleware automatically call this method with `req.query` as argument, but you can also use this if you have a MenquerySchema object:
```js
var schema = new MenquerySchema({q: {paths: ['name']}});
var query = schema.parse({q: 'text', page: 3, limit: 20, sort: '-createdAt'});

console.log(query);
// {filter: {name: /text/i}, options: {limit: 20, skip: 40, sort: {createdAt: -1}}}

Post.find(query.filter, null, query.options)
```

#### Validating schema

`menquery()` middleware automatically call this method with `req.query` as argument (and call `next(err)` passing the error to the next middleware), but you can also use this if you have a MenquerySchema object:
```js
var schema1 = new MenquerySchema({page: {max: 10}});
var schema2 = new MenquerySchema({page: {max: 100}});
var query = {page: 50};

schema1.validate(query); // false
schema2.validate(query); // true

// With callback
schema1.validate(query, function(err) {
  console.log(err);
  /* {
    param: 'page',
    value: 50,
    name: 'max',
    max: 10,
    error: 'page must be lower than or equal to 10'
  } */
});
```

#### Manipulating parameters in schema

Even after a MenquerySchema object was created, you can manipulate its parameters:
```js
var schema = new MenquerySchema();

// schema.add(paramName, value, options)
schema.param('min_distance', null, {type: Number, default: 10, max: 40});

schema.param('min_distance').value(); // null
schema.param('min_distance', 48);
schema.param('min_distance').value(); // 48
schema.validate(); // false (48 is greater than 40)
```

### MenqueryParam

#### Defining a param

Although you will not use this often, you can create individual MenqueryParam:
```js
// MenqueryParam(name, value, options)
var param = new MenqueryParam('foo', 'bar', {maxlength: 4});

param.value(); // get value 'bar'
param.parse(); // {foo: 'bar'}
param.validate(); // true
param.value('bar,baz'); // set value 'bar,baz'
param.parse(); // {foo: 'bar,baz'}
param.validate(); // false
param.validate(function(err) {
  console.log(err);
  /* {
    param: 'foo',
    value: 'bar,baz',
    name: 'maxlength',
    maxlength: 4,
    error: 'foo must have length lower than or equal to 4'
  } */
});

var schema = new MenquerySchema();
schema.param(param);
schema.parse(); // {filter: {foo: 'bar,baz'}}
schema.validate(); // false
```

#### Param options


| Option    | Type      | Default     | Description |
|-----------|-----------|-------------|-------------|
| type      | Parser    | `String`    | Parameter type.
| paths     | Parser    | `['foo']`   | MongoDB collection field which the parameter will be parsed to e.g. `{foo: 'bar,baz'}`. If more than one path was set, it will be parsed as `{$or: [{foo1: 'bar,baz'}, {foo2: 'bar,baz'}]}`.
| bindTo    | Parser    | `'filter'`  | Which property the parameter will be parsed to e.g. `{filter: {foo: 'bar,baz'}}`. Useful to group different types of parameters.
| multiple  | Parser    | `false`     | If it's true, parameter will be parsed looking for `separator` to split content e.g. `/posts?foo=bar,baz` will be `{foo: {$in: ['bar', 'baz']}}`.
| separator | Parser    | `','`       | Separator used in multiple option (see above).
| operator  | Parser    | `'$eq'`     | MongoDB query operator. If `multiple` is true and it finds `separator` in value, `$eq` becomes `$in`, and `$ne` becomes `$nin`.
| set       | Parser    | `'bar,baz'` | Called when set parameter value with two arguments (value, menqueryParam). Must return a value.
| get       | Parser    | `'bar,baz'` | Called when get parameter value with two arguments (value, menqueryParam). Must return a value.
| lowecase  | Formatter | `false`     | Formats `PÃO DE MEL` to `pão de mel`.
| uppercase | Formatter | `false`     | Formats `pão de mel` to `PÃO DE MEL`.
| normalize | Formatter | `false`     | Formats `Pão :dE meL!!` to `pao de mel`.
| regex     | Formatter | `false`     | Formats `pão de mel` to `/pão de mel/i`.
| trim      | Formatter | `true`      | Formats ` pão de mel   ` to `pão de mel`.
| minlength | Validator | `false`     | Validates value length.
| maxlength | Validator | `false`     | Validates value length.
| required  | Validator | `false`     | Validates if value is present.
| match     | Validator | `false`     | Validates if value matches some regex. 
| enum      | Validator | `false`     | Validates if value is present in enum array.
| min       | Validator | `false`     | Validates value number.
| max       | Validator | `false`     | Validates value number.

## Contributing

This package was created with [generator-rise](https://github.com/bucaran/generator-rise). Please refer to there to understand the codestyle and workflow. Issues and PRs are welcome! 

## License

MIT © [Diego Haz](http://github.com/diegohaz)

[standard-url]: http://standardjs.com
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg

[npm-url]: https://npmjs.org/package/menquery
[npm-image]: https://img.shields.io/npm/v/menquery.svg?style=flat-square

[travis-url]: https://travis-ci.org/diegohaz/menquery
[travis-image]: https://img.shields.io/travis/diegohaz/menquery.svg?style=flat-square

[coveralls-url]: https://coveralls.io/r/diegohaz/menquery
[coveralls-image]: https://img.shields.io/coveralls/diegohaz/menquery.svg?style=flat-square

[depstat-url]: https://david-dm.org/diegohaz/menquery
[depstat-image]: https://david-dm.org/diegohaz/menquery.svg?style=flat-square

[download-badge]: http://img.shields.io/npm/dm/menquery.svg?style=flat-square
