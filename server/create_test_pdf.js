const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test_manual.pdf'));
doc.fontSize(25).text('Manual de Clases de Prueba', 100, 100);
doc.fontSize(12).text('Clase: Analista\nEstrato: Profesional\nCargo: Analista de Sistemas\nFunciones: Desarrollar software.\nRequisitos: Bachiller en computación.', 100, 150);
doc.end();

console.log('test_manual.pdf created');
