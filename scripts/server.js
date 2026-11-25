const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2] || 4173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.css':'text/css; charset=utf-8'};
const server = http.createServer((req,res)=>{
  const u = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = u === '/' ? 'index.html' : u.replace(/^\/+/, '');
  const file = path.resolve(root, rel);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err,data)=>{
    if(err){ res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(data);
  });
});
server.listen(port, '127.0.0.1', ()=>console.log('Serving '+root+' at http://127.0.0.1:'+port));
