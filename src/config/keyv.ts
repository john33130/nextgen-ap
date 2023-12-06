import Keyv = require('keyv');

export default (() => new Keyv(process.env.CACHE_CONNECTION_URL))();
