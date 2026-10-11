import {createServer} from 'node:http';
import express from 'express';
import {ExpressPeerServer} from 'peer';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
export function createWebServer(directory:string){
 const root=resolve(directory);if(!existsSync(resolve(root,'index.html')))throw new Error(`Missing web export: ${root}. Run the web export or unpack web.zip first.`);
 const app=express(),server=createServer(app);
 app.disable('x-powered-by');
 app.use((_req,res,next)=>{res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');next();});
 // PeerServer is part of this process. Discovery is disabled; it holds signaling only.
 app.use('/peer',ExpressPeerServer(server,{path:'/',proxied:process.env.BEHIND_PROXY==='1',allow_discovery:false,concurrent_limit:250,expire_timeout:30000,corsOptions:{origin:process.env.SHARE_ORIGIN || true}}));
 app.get('/health',(_req,res)=>res.json({web:true,peer:true}));
 app.get('/.well-known/apple-app-site-association',(_req,res)=>{const team=process.env.APPLE_TEAM_ID;if(!team)return res.status(404).end();res.json({applinks:{apps:[],details:[{appID:`${team}.${process.env.APP_IDENTIFIER || 'app.velunivo.mobile'}`,paths:['/share/*']}]}});});
 app.use(express.static(root,{index:false,setHeaders:(res,path)=>{if(path.endsWith('.mjs'))res.setHeader('Content-Type','application/javascript');if(/\.(html|webmanifest)$|\/sw\.js$/.test(path))res.setHeader('Cache-Control','no-cache');}}));
 app.use((req,res)=>{if(req.method!=='GET'||req.path.startsWith('/peer')||req.path.startsWith('/.well-known')||req.path.match(/\.[a-z0-9]+$/i))return res.status(404).end();res.setHeader('Cache-Control','no-cache');res.sendFile(resolve(root,'index.html'));});
 return server;
}
