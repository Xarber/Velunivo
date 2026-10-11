import {createWebServer} from './web';
const server=createWebServer(process.env.WEB_DIR || 'dist');
const port=Number(process.env.PORT || 8790);
server.listen(port,process.env.HOST || '127.0.0.1',()=>console.log(`Velunivo web + PeerServer listening on ${(server.address() as {port:number}).port}; signaling at /peer`));
const stop=()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),5000).unref();};process.on('SIGINT',stop);process.on('SIGTERM',stop);
