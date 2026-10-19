const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.ttf':'font/ttf'};
const server = http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end('Requisição inválida'); }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  const publicFile = ['/index.html','/app.js','/style.css'].includes(pathname === '/' ? '/index.html' : pathname) || (pathname.startsWith('/assets/') && file.startsWith(path.join(root,'assets') + path.sep)) || /^\/carros\/[a-z0-9-]+\.html$/.test(pathname);
  if (!file.startsWith(root + path.sep) || !publicFile) { res.writeHead(404); return res.end('Página não encontrada'); }
  fs.readFile(file,(err,data) => { if(err){res.writeHead(404);return res.end('Página não encontrada');} res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(data); });
});
server.listen(Number(process.env.PORT || 3000),'0.0.0.0',() => console.log('RANCING EXPERIENCE na porta ' + (process.env.PORT || 3000)));
