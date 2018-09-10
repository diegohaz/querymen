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
npm install --save https://github.com/wesias7/querymen.git#master
```

## Advanced Examples

```
const querySchema = new QuerymenSchema({
  keywords: { search: true },
  joinedPlatform: { type: String, paths: ['joined'], elementMatch: 'platform' },
  joinedGroup: { type: String, paths: ['joined'], elementMatch: 'group' },
  joinedGrade: { type: String, paths: ['joined'], elementMatch: 'grade' },
  createdAtDate: { type: Date, paths: ['createdAt'], duration: 'date' },
  status: status.type,
  isAdult: isAdult.type,
  activatedToEmail: activatedToEmail.type,
  activatedToMobile: activatedToMobile.type,
  activatedToIdentify: activatedToIdentify.type,
  activatedToBankAccount: activatedToBankAccount.type,
  allowMailing: allowMailing.type,
  allowSms: allowSms.type,
  page: { max: 100000 },
  limit: { max: 100000 }
})
querySchema.parser('search', (search, value, path, operator) => {
  if (!value) { return value }
  const regValue = new RegExp(value, 'ig')
  if (search) {
    if (value * 1 >= 0) {
      value = { $or: [{ mobile: regValue }, { accountNo: value * 1 }] }
    } else {
      value = { $or: [{ email: regValue }, { name: regValue }, { realName: regValue }, { mobile: regValue }, { accountId: regValue }] }
    }
  }
  return value
})
querySchema.parser('elementMatch', (elementMatch, value, path, operator) => {
  if (!value) { return value }
  if (elementMatch) {
    value = { [path]: { $elemMatch: { [elementMatch]: value } } }
  }
  return value
})
querySchema.parser('duration', (duration, value, path, operator) => {
  if (!value) { return value }
  if (duration === 'date') {
    value = { [path]: { $gte: new Date(value).setHours(0, 0, 0, 0), $lte: new Date(value).setHours(23, 59, 59, 999) } }
  }
  return value
})
router.get('/',
  // token({ required: true, roles: ['admin'] }),
  query(querySchema),
  index)
  
 ```
