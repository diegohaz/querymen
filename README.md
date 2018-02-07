# Querymen

[![JS Standard Style][standard-image]][standard-url]
[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coveralls Status][coveralls-image]][coveralls-url]
[![Dependency Status][depstat-image]][depstat-url]
[![Downloads][download-badge]][npm-url]

> Querystring parser middleware for MongoDB, Express and Nodejs

## Install

```sh
npm install --save querymen
```

## Examples

### Pagination
Querymen has a default schema to handle pagination. This is the most simple and common usage.
```js
import { middleware as query } from 'querymen';

app.get('/posts', query(), ({ querymen: { query, select, cursor } }, res) => {

  Post.find(query, select, cursor).then(posts => {
    // posts are proper paginated here
  });
});
```
User requests `/posts?page=2&limit=20&sort=-createdAt` querymen will be:
```js
querymen = {
  query: {},
  select: {},
  cursor: {
    limit: 20, 
    skip: 20, 
    sort: { createdAt: -1 }
  }
}
```
User requests `/posts?q=term&fields=title,desc` querymen will be:
> When user requests `/posts?q=term`, querymen parses it to `{keywords: /term/i}`. It was designed to work with [mongoose-keywords](https://github.com/diegohaz/mongoose-keywords) plugin, which adds a `keywords` field to schemas (check that out).

```js
querymen = {
  query: {
    keywords: /term/i
  },
  select: {
    title: 1,
    desc: 1
  },
  cursor: {
    // defaults
    limit: 30, 
    skip: 0, 
    sort: { createdAt: -1 }
  }
}
```
User requests `/posts?fields=-title&sort=name,-createdAt` querymen will be:
```js
querymen = {
  query: {},
  select: {
    title: 0
  },
  cursor: {
    limit: 30, 
    skip: 0, 
    sort: {
      name: 1,
      createdAt: -1
    }
  }
}
```

### Custom schema
You can define a custom schema, which will be merged into querymen default schema (explained above).
```js
import { middleware as query } from 'querymen';

app.get('/posts', query({
  after: {
    type: Date,
    paths: ['createdAt']
    operator: '$gte'
  }
}), ({ querymen }, res) => {
  Post.find(querymen.query).then(posts => {
    // ...
  });
});
```
User requests `/posts?after=2016-04-23` querymen will be:
```js
querymen = {
  query: {
    createdAt: { $gte: 1461369600000 }
  },
  select: {},
  cursor: {
    // defaults
    limit: 30, 
    skip: 0, 
    sort: { createdAt: -1 }
  }
}
```

### Reusable schemas
You can create reusable schemas as well. Just instantiate a `Schema` object.
```js
import { middleware as query, Schema } from 'querymen';

const schema = new Schema({
  tags: {
    type: [String],
  }
});

// user requests /posts?tags=world,travel
// querymen.query is { tags: { $in: ['world', 'travel'] }}
app.get('/posts', query(schema));
app.get('/articles', query(schema));
```

### Advanced schema
```js
import { middleware as query, Schema } from 'querymen';

const schema = new Schema({
  active: Boolean, // shorthand to { type: Boolean }
  sort: '-createdAt', // shorthand to { type: String, default: '-createdAt' }
  term: {
    type: RegExp,
    paths: ['title', 'description'],
    bindTo: 'search' // default was 'query'
  },
  with_picture: {
    type: Boolean,
    paths: ['picture'],
    operator: '$exists'
  }
}, {
  page: false, // disable default parameter `page`
  limit: 'max_items' // change name of default parameter `limit` to `max_items`
});

app.get('/posts', query(schema), ({ querymen }, res) => {
  // user requests /posts?term=awesome&with_picture=true&active=true&max_items=100
  // querymen.query is { picture: { $exists: true }, active: true }
  // querymen.cursor is { limit: 100, sort: { createdAt: -1 } }
  // querymen.search is { $or: [{ title: /awesome/i }, { description: /awesome/i }]}
});
```

### Dynamic advanced schema
```js
import { middleware as query, Schema } from 'querymen';
const schema = new Schema();

schema.formatter('scream', (scream, value, param) => {
  if (scream) {
    value = value.toUpperCase() + '!!!!!!!';
  }
  return value;
});

schema.param('text', null, { type: String }); // { type: String }
schema.param('text').option('scream', true); // { type: String, scream: true }
schema.param('text').value('help');
console.log(schema.param('text').value()); // HELP!!!!!!!

schema.validator('isPlural', (isPlural, value, param) => {
  return {
    valid: !isPlural || value.substr(-1) === 's',
    message: param.name + ' must be in plural form.'
  };
});

schema.param('text').option('isPlural', true); // { type: String, scream: true, isPlural: true }
console.log(schema.validate()); // false
schema.param('text', 'helps');
console.log(schema.validate()); // true
console.log(schema.param('text').value()); // HELPS!!!!!!!

schema.parser('elemMatch', (elemMatch, value, path, operator) => {
  if (elemMatch) {
    value = { [path]: { $elemMatch: {[elemMatch]: {[operator]: value } }}};
  }
  return value;
});

schema.param('text', 'ivegotcontrols');
console.log(schema.param('text').parse()); // { text: 'IVEGOTCONTROLS!!!!!!!' }

schema.param('text').option('elemMatch', 'prop');
console.log(schema.param('text').parse()); // { text: { $elemMatch: { prop: { $eq: 'IVEGOTCONTROLS!!!!!!!'} }}}
```

### Geo queries
Querymen also support geo queries, but it's disabled by default. To enable geo queries you just need to set `near` option to true in schema options.
```js
import { middleware as query } from 'querymen';

app.get('/places', query({}, { near: true }), (req, res) => {
  
});
```
Its `paths` option is set to `['location']` by default, but you can change this as well:
```js
import { middleware as query } from 'querymen';

app.get('/places', 
  query({
    near: { paths: ['loc'] }
  }, {
    near: true
  }), 
  (req, res) => {
  
  });
```
User requests `/places?near=-22.332113,-44.312311` (latitude, longitude), req.querymen.query will be:
```js
req.querymen.query = {
  loc: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [-44.312311, -22.332113]
      }
    }
  }
}
```
User requests `/places?near=-22.332113,-44.312311&min_distance=200&max_distance=2000` (min_distance and max_distance in meters), req.querymen.query will be:
```js
req.querymen.query = {
  loc: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [-44.312311, -22.332113]
      },
      $minDistace: 200,
      $maxDistance: 2000
    }
  }
}
```
You can also use legacy geo queries as well. Just set `geojson` option in param:
```js
import { middleware as query } from 'querymen';

app.get('/places', 
  query({
    near: {
      paths: ['loc'],
      geojson: false
    }
  }, {
    near: true
  }), 
  (req, res) => {
  
  });
```
User requests `/places?near=-22.332113,-44.312311&min_distance=200&max_distance=2000`, req.querymen.query will be:
```js
req.querymen.query = {
  loc: {
    $near: [-44.312311, -22.332113],
    // convert meters to radians automatically
    $minDistace: 0.000031,
    $maxDistance: 0.00031
  }
}
```

### Error handling
```js
// user requests /posts?category=world
import { middleware as query, querymen, Schema } from 'querymen';

const schema = new Schema({
  category: {
    type: String,
    enum: ['culture', 'general', 'travel']
  }
});

app.get('/posts', query(schema));

// create your own handler
app.use((err, req, res, next) => {
  res.status(400).json(err);
});

// or use querymen error handler
app.use(querymen.errorHandler());
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

## Contributing

This package was created with [generator-rise](https://github.com/bucaran/generator-rise). Please refer to there to understand the codestyle and workflow. Issues and PRs are welcome! 

## License

MIT © [Diego Haz](http://github.com/diegohaz)

[standard-url]: http://standardjs.com
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg

[npm-url]: https://npmjs.org/package/querymen
[npm-image]: https://img.shields.io/npm/v/querymen.svg?style=flat-square

[travis-url]: https://travis-ci.org/diegohaz/querymen
[travis-image]: https://img.shields.io/travis/diegohaz/querymen.svg?style=flat-square

[coveralls-url]: https://coveralls.io/r/diegohaz/querymen
[coveralls-image]: https://img.shields.io/coveralls/diegohaz/querymen.svg?style=flat-square

[depstat-url]: https://david-dm.org/diegohaz/querymen
[depstat-image]: https://david-dm.org/diegohaz/querymen.svg?style=flat-square

[download-badge]: http://img.shields.io/npm/dm/querymen.svg?style=flat-square
