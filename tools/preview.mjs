import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../web/',import.meta.url));
const mime={'.html':'text/html','.css':'text/css','.mjs':'application/javascript','.js':'application/javascript','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root))throw Error();const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
server.listen(4173,'127.0.0.1',()=>console.log('Cotton Ledger: http://127.0.0.1:4173'));
