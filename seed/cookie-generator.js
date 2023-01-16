const fs = require('fs');
const path = require('path');
const keyBuffer = fs.readFileSync(path.join(__dirname, 'secret-key'));
const hexString = keyBuffer.toString('hex');
console.log(hexString)