const fs = require('fs');
const config = require('../config.js');
const path = require('path');

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const dbURL = `mongodb://${config.database.host}:${config.database.port}/${config.database.name}`;
// const basename = path.basename(module.filename);

let models = {};

mongoose.connect(dbURL);

fs.readdirSync(__dirname + '/schemas')
    .forEach(function(file) {
        console.log(file);
        var schema = require(path.join(__dirname + '/schemas/', file));
        models[schema.name] = mongoose.model(schema.name, schema.schema);
    });
console.log('Loaded schemas...');


const options = { upsert: true, new: true, setDefaultsOnInsert: true };

const fakeTeacher = {
    email: 'the.frankmatranga@gmail.com',
    age: 17,
    grade: 12,
    phoneNumber: '8888888888',
    location: 'Narnia',
    name: {
        full: 'Ambas Sador',
        first: 'Ambas',
        last: 'Sador'
    },
    rank: 'ambassador',
    admin: true,
    verified: true
};
models.User.findOneAndUpdate({ email: 'the.frankmatranga@gmail.com' }, fakeTeacher, options, function(error, result) {
    if (error) return console.error(error);
    console.log(result);
    // do something with the document
});

module.exports = models;
