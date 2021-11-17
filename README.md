# node-filen.io
Filen.io API for Node.JS

## Features

- [x] Login
- [x] Account storage usage 
- [x] Directory listing
- [ ] Download
- [ ] Upload

## Usage


### Initialization

Import `Filen` class to your project.

```js
const Filen = require('./filen');
```

Class takes two arguments. First one is email and second one is password. 

```js
const filen = new Filen('<email>', '<password>')
```

### Login

Authentication does not happen immediately (will happen in the future) so you need to call the `login` method.

```js
filen.login().then((status) => {
    console.log(status)
})
```

### Account storage usage

Listing the usage works by calling `usage` method.
```js
filen.usage().then((info) => {
    console.log(info)
})
```

This info is an object which looks similar to this: ADD LATER


### List files and directories

ADD LATER


Full example can be found in [example.js](./example.js).