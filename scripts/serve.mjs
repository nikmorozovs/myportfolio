// Optional local development server. It mirrors GitHub Pages directory routes.
import http from 'node:http';
import path from 'node:path';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.png':'image/png'};
const port=Number(process.env.PORT||4173);
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');let pathname=decodeURIComponent(url.pathname);
    if(pathname.startsWith('/myportfolio/'))pathname=pathname.slice('/myportfolio'.length);
    let file=path.resolve(root,`.${pathname}`);
    const base=path.resolve(root);
    if(file!==base&&!file.startsWith(base+path.sep))throw Error('Forbidden');
    if((await stat(file)).isDirectory()){
      if(!url.pathname.endsWith('/')){res.writeHead(301,{Location:`${url.pathname}/${url.search}`});res.end();return;}
      file=path.join(file,'index.html');
    }
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(await readFile(file));
  }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(path.join(root,'404.html')));}
}).listen(port,'0.0.0.0',()=>console.log(`Local: http://localhost:${port}/myportfolio/`));
