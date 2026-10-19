// Limpa apenas os dados de teste ANTES de iniciar o Java.
// A pasta data/ usada pelo site nunca é alterada por este lançador.
const fs = require('node:fs');
const path = require('node:path');
const directory = path.join(__dirname, '..', '.e2e-data');
fs.rmSync(directory, {recursive:true,force:true});
process.env.DATA_DIR = directory;
require('./java.cjs');
