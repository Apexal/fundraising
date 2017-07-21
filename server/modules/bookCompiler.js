const JSZip = require('jszip');
const Docxtemplater = require('docxtemplater');

const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'public', 'template.docx'), 'binary');
const zip = new JSZip(content);

const ImageModule = require('docxtemplater-image-module')

const sizeOf = require('image-size');

const opts = {
    centered: false,
    getImage: (tagValue, tagName) => {
        return fs.readFileSync(tagValue);
    },
    getSize: (img, tagValue, tagName) => {
        if (tagName == 'locationImage') {
            sizeObj = sizeOf(img);
            return [sizeObj.width,sizeObj.height];
        }

        return [170, 130];
    }
}

const imageModule = new ImageModule(opts);

const doc = new Docxtemplater();
doc.attachModule(imageModule);
doc.loadZip(zip);

module.exports = {
    compile: (title, subtitle, location, introduction, stories, students) => {
        const data = {
            year: new Date().getFullYear(),
            title,
            subtitle,
            location,
            introduction,
            stories,
            students
        }

        doc.setData(data);
        doc.render();
        const buf = doc.getZip().generate({ type: 'nodebuffer' });
        return buf;
        //fs.writeFileSync(path.resolve(__dirname, 'output.docx'), buf);
    }
}