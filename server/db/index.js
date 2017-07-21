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
    _id: 1,
    email: 'teacher@kidstales.org',
    age: 17,
    grade: 12,
    phoneNumber: '888-888-8888',
    location: 'NYC',
    name: { first: 'Teacher', last: 'Test' },
    rank: 'teacher',
    rankInfo: {},
    application: { why: 'Why not?' },
    registeredDate: Date.now(),
    admin: false,
    verified: true
};
models.User.findOneAndUpdate({ _id: 1 }, fakeTeacher, options, function(error, result) {
    if (error) return;
    console.log(result);
    // do something with the document
});


const fakeDirector = {
    _id: 2,
    email: 'director@kidstales.org',
    age: 17,
    grade: 12,
    phoneNumber: '888-888-8888',
    location: 'NYC',
    name: { first: 'Director', last: 'Test' },
    rank: 'director',
    rankInfo: {},
    application: { why: 'Because.' },
    registeredDate: Date.now(),
    admin: false,
    verified: true
};
models.User.findOneAndUpdate({ _id: 2 }, fakeDirector, options, function(error, result) {
    if (error) return;
    console.log(result);
    // do something with the document
});

const fakeAmbassador = {
    _id: 3,
    email: 'ambassador@kidstales.org',
    age: 17,
    grade: 12,
    phoneNumber: '888-888-8888',
    location: 'NYC',
    name: { first: 'Ambassador', last: 'Test' },
    rank: 'ambassador',
    rankInfo: {},
    application: { why: 'idek.' },
    registeredDate: Date.now(),
    admin: false,
    verified: true
};
models.User.findOneAndUpdate({ _id: 3 }, fakeAmbassador, options, function(error, result) {
    if (error) return;
    console.log(result);
    // do something with the document
});

module.exports = models;
