const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const fsSync=require('node:fs');
const java=process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME,'bin','java') : fsSync.existsSync('/workspace/.cloud-java/jdk/bin/java') ? '/workspace/.cloud-java/jdk/bin/java' : 'java';
async function launch(jar,cwd){
 const child=spawn(java,['-jar',jar,'--sem-navegador'],{cwd,env:{...process.env,PORT:'0',DATA_DIR:path.join(path.dirname(jar),'data')},stdio:['ignore','pipe','pipe']});
 let output='';
 const address=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Tempo esgotado ao iniciar o JAR: '+output)),15000);
  child.once('error',error=>{clearTimeout(timer);reject(error);});
  child.once('exit',code=>{clearTimeout(timer);reject(new Error('JAR encerrou: '+code+' '+output));});
  child.stderr.on('data',data=>output+=data);
  child.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/localhost:(\d+)/);if(match){clearTimeout(timer);resolve('http://127.0.0.1:'+match[1]);}});
 });
 return {child,address};
}
async function stop(child){const exited=once(child,'exit');child.kill();await exited;}
test('JAR sozinho entrega carros, grava reservas e recupera dados após reinício',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'rancing-jar-'));
 let running;
 try{
  const jar=path.join(directory,'RancingExperience.jar');await fs.copyFile(path.join(__dirname,'..','dist','RancingExperience.jar'),jar);
  const other=path.join(directory,'pasta-sem-site');await fs.mkdir(other);
  running=await launch(jar,other);
  for(const route of ['/','/carros/golf-gti.html','/carros/porsche-gt4-rs.html','/carros/sandero-rs.html','/carros/gr-yaris.html','/app.js','/style.css','/assets/golf-gti.png','/assets/fonts/DMSans.ttf','/assets/fonts/Anton-Regular.ttf','/api/carros']){
   const response=await fetch(running.address+route);assert.equal(response.status,200,route);assert.ok((await response.arrayBuffer()).byteLength>50);
  }
  assert.match(await (await fetch(running.address+'/style.css')).text(),/font-family:'Anton'/);
  assert.equal((await fetch(running.address+'/data/reservas.properties')).status,404);
  const date=new Date();date.setDate(date.getDate()+7);
  const form=new URLSearchParams({car:'golf-gti',name:'Teste do JAR',date:date.toISOString().slice(0,10),time:'09:00',hours:'2',accepted:'true'});
  const response=await fetch(running.address+'/api/reservas',{method:'POST',body:form});assert.equal(response.status,201);
  const reservation=await response.json();assert.equal(reservation.total,1380);
  await stop(running.child);running=null;
  assert.ok(await fs.stat(path.join(directory,'data','reservas.properties')));
  running=await launch(jar,other);
  const saved=await fetch(running.address+'/api/reservas/'+reservation.id,{headers:{Authorization:'Bearer '+reservation.token}});
  assert.equal(saved.status,200);assert.equal((await saved.json()).name,'Teste do JAR');
 }finally{if(running)await stop(running.child);await fs.rm(directory,{recursive:true,force:true});}
});
