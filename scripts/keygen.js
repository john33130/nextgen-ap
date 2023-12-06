/* eslint-disable no-console */

const { randomBytes } = require('crypto');

console.log(randomBytes(24).toString('hex'));
