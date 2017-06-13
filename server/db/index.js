const fs = require('fs');
const config = require('../config.js');
const path = require('path');

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const dbURL = `mongodb://${config.database.host}:${config.database.port}/${config.database.name}`;
const basename = path.basename(module.filename);

let models = {};

mongoose.connect(dbURL);

fs.readdirSync(__dirname + '/schemas')
    .forEach(function(file) {
        console.log(file);
        var schema = require(path.join(__dirname + '/schemas/', file));
        models[schema.name] = mongoose.model(schema.name, schema.schema);
    });
console.log('Loaded schemas...');

module.exports = models;
