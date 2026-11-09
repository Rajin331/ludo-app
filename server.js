const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const srv=http.createServer((q,r)=>fs.readFile(path.join(__dirname,'public','portal.html'),(e,d)=>{r.writeHead(200,{'Content-Type':'text/html'});r.end(d)}));
const wss=new WebSocketServer({server:srv}),rooms={},OK=['force','clear','roll'];
const send=(w,o)=>w&&w.readyState===1&&w.send(typeof o==='string'?o:JSON.stringify(o));
wss.on('connection',(ws,req)=>{
  const u=new URL(req.url,'http://x'),room=u.searchParams.get('room'),role=u.searchParams.get('role');
  if(!room||!['app','portal'].includes(role))return ws.close();
  const R=rooms[room]=rooms[room]||{app:null,portals:new Set(),last:null};
  if(role==='app'){R.app=ws;R.portals.forEach(p=>send(p,{type:'link',app:true}))}
  else{R.portals.add(ws);send(ws,{type:'link',app:!!R.app});if(R.last)send(ws,R.last)}
  ws.on('message',d=>{
    const s=d.toString();let m;try{m=JSON.parse(s)}catch{return}
    if(role==='app'){R.last=s;R.portals.forEach(p=>send(p,s))}
    else if(OK.includes(m.type))send(R.app,s);
  });
  ws.on('close',()=>{
    if(role==='app'&&R.app===ws){R.app=null;R.portals.forEach(p=>send(p,{type:'link',app:false}))}
    else R.portals.delete(ws);
  });
});
srv.listen(process.env.PORT||3000,()=>console.log('Portal on port '+(process.env.PORT||3000)));
