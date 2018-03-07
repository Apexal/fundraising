const config = require('config');
const NodeGeocoder = require('node-geocoder');

const options = {
    provider: 'google',
    httpAdapter: 'https', // Default
    apiKey: config.get('googleAuth.apiKey'),
    formatter: null
};

module.exports = NodeGeocoder(options);
