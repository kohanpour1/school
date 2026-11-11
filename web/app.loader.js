async function loadBoshra(){
  const a = await (await fetch('app.b64.1.txt')).text();
  const b = await (await fetch('app.b64.2.txt')).text();
  const bin = atob(a+b);
  const bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  const buf = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const code = new TextDecoder().decode(buf);
  (0, eval)(code);
}
loadBoshra().catch(e=>{
  document.getElementById('app').innerHTML = '<p style="padding:2rem;text-align:center;font-family:Tahoma">خطا: '+e+'</p>';
});
