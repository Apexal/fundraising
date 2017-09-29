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
    email: 'thefrank.matranga@gmail.com',
    age: 17,
    grade: 12,
    phoneNumber: '888-888-8888',
    location: 'NYC',
    name: { full: 'Teacher Test', first: 'Teacher', last: 'Test' },
    rank: 'teacher',
    rankInfo: { directorId: 2 },
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
    email: 'fmatranga18@regis.org',
    age: 17,
    grade: 12,
    phoneNumber: '888-888-8888',
    location: 'NYC',
    name: { full: 'Director Test', first: 'Director', last: 'Test' },
    rank: 'director',
    rankInfo: { ambassadorId: 3 },
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
    email: 'the.frankmatranga@gmail.com',
    age: 17,
    grade: 12,
    phoneNumber: '888-888-8888',
    location: 'NYC',
    name: { full: 'Ambassador Test', first: 'Ambassador', last: 'Test' },
    rank: 'ambassador',
    rankInfo: { area: 'Tri-state Area' },
    application: { why: 'idek.' },
    registeredDate: Date.now(),
    admin: false,
    verified: true
};
models.User.findOneAndUpdate({ _id: 3 }, fakeAmbassador, options, function(error, result) {
    if (error) return console.error(error);
    console.log(result);
    // do something with the document
});

module.exports = models;
