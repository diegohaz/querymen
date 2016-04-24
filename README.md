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

## Examples

### Pagination
```js
var menquery = require('menquery');

app.get('/posts', menquery.middleware(), function(req, res) {
  // user requests /posts?page=2&limit=20&sort=-createdAt
  // req.options is {limit: 20, skip: 20, sort: {createdAt: -1}}

  Post.find({}, null, req.options).then(function(posts) {
    // posts have up to 20 items of the second page sorted by `createdAt` field
  });
});
```

### Custom schema
```js
var menquery = require('menquery');

app.get('/posts', menquery.middleware({
  after: {
    type: Date,
    paths: ['createdAt']
    operator: '$gte'
  }
}), function(req, res) {
  // user requests /posts?after=2016-04-23
  // req.options is default {limit: 30, skip: 0, sort: {name: 1}}
  // req.filter is {createdAt: {$gte: 1461369600000}}

  Post.find(req.filter).then(function(posts) {
    // posts have only items with `createdAt` after date 2016-04-23
  });
});
```

### Reusable schemas
```js
var menquery = require('menquery');

var schema = new menquery.Schema({
  tags: {
    type: String,
    multiple: true
  }
});

// user requests /posts?tags=world,travel
// req.filter is {tags: {$in: ['world', 'travel']}}
app.get('/posts', menquery.middleware(schema));
app.get('/articles', menquery.middleware(schema));
```

### Advanced schema
```js
var menquery = require('menquery');

var schema = new menquery.Schema({
  active: Boolean, // shorthand to {type: Boolean}
  sort: '-createdAt', // shorthand to {type: String, default: '-createdAt'}
  term: {
    type: RegExp,
    paths: ['title', 'description'],
    bindTo: 'search' // default was 'filter'
  },
  with_picture: {
    type: Boolean,
    paths: ['picture'],
    operator: '$exists'
  }
}, {
  page: false, // disallow default parameter `page`
  limit: 'max_items' // change name of default parameter `limit` to `max_items`
});

app.get('/posts', menquery.middleware(schema), function(req, res) {
  // user requests /posts?term=awesome&with_picture=true&active=true&max_items=100
  // req.filter is {picture: {$exists: true}, active: true}
  // req.options is {limit: 100, sort: {createdAt: -1}}
  // req.search is {$or: [{title: /awesome/i}, {description: /awesome/i}]}
});
```

### Dynamic advanced schema
```js
var menquery = require('menquery');
var schema = new menquery.Schema();

schema.formatter('scream', function(scream, value, param) {
  if (scream) {
    value = value.toUpperCase() + '!!!!!!!';
  }
  return value;
});

schema.param('text', null, {type: String}); // {type: String}
schema.param('text').option('scream', true); // {type: String, scream: true}
schema.param('text').value('help');
console.log(schema.param('text').value()); // HELP!!!!!!!

schema.validator('isPlural', function(isPlural, value, param) {
  return {
    valid: !isPlural || value.substr(-1) === 's',
    message: param.name + ' must be in plural form.'
  };
});

schema.param('text').option('isPlural', true); // {type: String, scream: true, isPlural: true}
console.log(schema.validate()); // false
schema.param('text', 'helps');
console.log(schema.validate()); // true
console.log(schema.param('text').value()); // HELPS!!!!!!!

schema.parser('elemMatch', function(elemMatch, value, param) {
  if (elemMatch) {
    value = {$elemMatch: {[elemMatch]: value}};
  }
  return value;
});

schema.param('text', 'ivegotcontrols');
console.log(schema.param('text').parse()); // {text: 'IVEGOTCONTROLS!!!!!!!'}

schema.param('text').option('elemMatch', 'prop');
console.log(schema.param('text').parse()); // {text: {$elemMatch: {prop: 'IVEGOTCONTROLS!!!!!!!'}}}
```

### Error handling
```js
// user requests /posts?category=world
var menquery = require('menquery');

var schema = new menquery.Schema({
  category: {
    type: String,
    enum: ['culture', 'general', 'travel']
  }
});

app.get('/posts', menquery.middleware(schema));

app.use(function(err, req, res, next) {
  res.status(400).json(err);
});
```
Response body will look like:
```json
{
  "valid": false,
  "name": "enum",
  "enum": ["culture", "general", "travel"],
  "value": "world",
  "message": "category must be one of: culture, general, travel"
}
```

## Reference

### MenquerySchema

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

#### Parse

`menquery()` middleware automatically call this method with `req.query` as argument, but you can also use this if you have a MenquerySchema object:
```js
var schema = new menquery.Schema({q: {paths: ['name']}});
var query = schema.parse({q: 'text', page: 3, limit: 20, sort: '-createdAt'});

console.log(query);
// {filter: {name: /text/i}, options: {limit: 20, skip: 40, sort: {createdAt: -1}}}

Post.find(query.filter, null, query.options)
```

#### Validate

`menquery()` middleware automatically call this method with `req.query` as argument (and call `next(err)` passing the error to the next middleware), but you can also use this if you have a MenquerySchema object:
```js
var schema1 = new menquery.Schema({page: {max: 10}});
var schema2 = new menquery.Schema({page: {max: 100}});
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
    message: 'page must be lower than or equal to 10'
  } */
});
```

### MenqueryParam

#### Default param options

| Option    | Type      | Default     | Description |
|-----------|-----------|-------------|-------------|
| type      | Built in  | `String`    | Parameter type.
| paths     | Built in  | `['foo']`   | MongoDB collection field which the parameter will be parsed to e.g. `{foo: 'bar,baz'}`. If more than one path was set, it will be parsed as `{$or: [{foo1: 'bar,baz'}, {foo2: 'bar,baz'}]}`.
| bindTo    | Built in  | `'filter'`  | Which property the parameter will be parsed to e.g. `{filter: {foo: 'bar,baz'}}`. Useful to group different types of parameters.
| multiple  | Built in  | `false`     | If it's true, parameter will be parsed looking for `separator` to split content e.g. `/posts?foo=bar,baz` will be `{foo: {$in: ['bar', 'baz']}}`.
| separator | Built in  | `','`       | Separator used in multiple option (see above).
| operator  | Built in  | `'$eq'`     | MongoDB query operator. If `multiple` is true and it finds `separator` in value, `$eq` becomes `$in`, and `$ne` becomes `$nin`.
| set       | Built in  | `'bar,baz'` | Called when set parameter value with two arguments (value, menqueryParam). Must return a value.
| get       | Built in  | `'bar,baz'` | Called when get parameter value with two arguments (value, menqueryParam). Must return a value.
| lowecase  | Formatter | `false`     | Formats `PÃO DE MEL` to `pão de mel`.
| uppercase | Formatter | `false`     | Formats `pão de mel` to `PÃO DE MEL`.
| normalize | Formatter | `false`     | Formats `Pão :dE meL!!` to `pao de mel`.
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
