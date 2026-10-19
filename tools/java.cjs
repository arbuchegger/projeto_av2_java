// Compatibilidade com npm start/npm test no Windows, Linux e macOS.
// O servidor continua sendo Java; Node é apenas um lançador opcional.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync, spawn} = require('node:child_process');
process.chdir(path.join(__dirname, '..'));
const testing = process.argv.includes('--test');
const suffix = process.platform === 'win32' ? '.exe' : '';
let jdk = process.env.JAVA_HOME;
if (!jdk && !spawnSync('javac', ['-version']).error) jdk = null;
else if (!jdk && fs.existsSync('/workspace/.cloud-java/jdk/bin/javac')) jdk = '/workspace/.cloud-java/jdk';
const tool = name => jdk ? path.join(jdk, 'bin', name + suffix) : name;
const source = dir => fs.readdirSync(dir).filter(name => name.endsWith('.java')).map(name => path.join(dir, name));
const output = testing ? 'build/test-classes' : 'build/classes';
const files = source('src/main/java/br/com/rancing');
if (testing) files.push(...source('src/test/java/br/com/rancing'));
fs.mkdirSync(output, {recursive:true});
const compiled = spawnSync(tool('javac'), ['--release','21','-encoding','UTF-8','-d',output,...files], {stdio:'inherit'});
if (compiled.error) { console.error('Instale o JDK 21 ou superior e configure JAVA_HOME.'); process.exit(1); }
if (compiled.status !== 0) process.exit(compiled.status || 1);
const child = spawn(tool('java'), ['-cp',output,testing ? 'br.com.rancing.ReservasTest' : 'br.com.rancing.App'], {stdio:'inherit'});
child.on('error', () => {console.error('Não foi possível iniciar o Java. Confira JAVA_HOME.');process.exit(1);});
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => child.kill(signal));
