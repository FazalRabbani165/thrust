const fs=require('fs'),path=require('path'),zlib=require('zlib');
function w(f,c){const d=path.dirname(f);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});fs.writeFileSync(f,c)}
function makePNG(sz){
  const w=sz,h=sz,px=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4,m=w*.15,bh=h*.12,sw=w*.12,cx=w/2;
    let r=10,g=10,b=15,a=255;
    if(x>=m&&x<w-m&&y>=m&&y<m+bh){r=255;g=107;b=53}
    if(x>=cx-sw/2&&x<cx+sw/2&&y>=m+bh&&y<h-m){r=255;g=107;b=53}
    px[i]=r;px[i+1]=g;px[i+2]=b;px[i+3]=a;
  }
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++){c^=b[i];for(let j=0;j<8;j++)c=(c>>>1)^(c&1?0xEDB88320:0)}return(c^0xFFFFFFFF)>>>0}
  function chunk(t,d){const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const tb=Buffer.from(t),cb=Buffer.alloc(4);cb.writeUInt32BE(crc32(Buffer.concat([tb,d])));return Buffer.concat([l,tb,d,cb])}
  const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;
  const raw=Buffer.alloc(h*(1+w*4));
  for(let y=0;y<h;y++){raw[y*(1+w*4)]=0;px.copy(raw,y*(1+w*4)+1,y*w*4,(y+1)*w*4)}
  const comp=zlib.deflateSync(raw);
  return Buffer.concat([sig,chunk('IHDR',ih),chunk('IDAT',comp),chunk('IEND',Buffer.alloc(0))]);
}
w('public/icon-192.png',makePNG(192));
w('public/icon-512.png',makePNG(512));
console.log('Icons created');

w('package.json',JSON.stringify({name:'thrust',private:true,version:'0.1.0',type:'module',scripts:{dev:'vite',build:'vite build',preview:'vite preview'},dependencies:{'react':'^18.3.1','react-dom':'^18.3.1'},devDependencies:{'@vitejs/plugin-react':'^4.3.1','vite':'^5.4.2'}},null,2));

w('vite.config.js',`import{defineConfig}from'vite';import react from'@vitejs/plugin-react';export default defineConfig({plugins:[react()],base:'./',server:{port:5173,host:true}});`);

w('index.html',`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover"/>
<meta name="theme-color" content="#0a0a0f"/>
<meta name="mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="apple-mobile-web-app-title" content="THRUST"/>
<meta name="application-name" content="THRUST"/>
<link rel="manifest" href="/manifest.json"/>
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"/>
<link rel="apple-touch-icon" href="/icon-192.png"/>
<title>THRUST</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>html,body{background:#0a0a0f;margin:0;padding:0}#root{min-height:100vh}</style>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.jsx"><\/script>
<script>if('serviceWorker'in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})<\/script>
</body>
</html>`);

w('public/manifest.json',JSON.stringify({name:'THRUST',short_name:'THRUST',description:'Personal Study & Revision System',start_url:'/',display:'standalone',orientation:'portrait',background_color:'#0a0a0f',theme_color:'#0a0a0f',categories:['productivity','education'],icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}],shortcuts:[{name:'New Task',short_name:'Task',url:'/?action=newtask',icons:[{src:'/icon-192.png',sizes:'192x192'}]}]},null,2));

w('public/sw.js',`const CACHE='thrust-v0.1.0';const ASSETS=['/','/index.html','/manifest.json','/icon-192.png','/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith('http'))return;e.respondWith(fetch(e.request).then(r=>{if(r.status===200){caches.open(CACHE).then(c=>c.put(e.request,r.clone()))}return r}).catch(()=>caches.match(e.request).then(c=>c||(e.request.mode==='navigate'?caches.match('/index.html'):new Response('Offline',{status:503})))))});`);

w('src/index.css',`
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{--font-display:'Space Grotesk',sans-serif;--font-mono:'JetBrains Mono',monospace;--text-xs:.6875rem;--text-sm:.8125rem;--text-base:.9375rem;--text-lg:1.125rem;--text-xl:1.375rem;--text-2xl:1.75rem;--space-1:.25rem;--space-2:.5rem;--space-3:.75rem;--space-4:1rem;--space-5:1.25rem;--space-6:1.5rem;--space-8:2rem;--space-10:2.5rem;--space-12:3rem;--radius-sm:4px;--radius-md:6px;--radius-lg:10px;--radius-xl:14px;--transition-fast:120ms ease;--transition-slow:350ms ease;--sidebar-width:230px;--bottom-nav-height:64px}
[data-theme="dark"]{--bg-primary:#0a0a0f;--bg-secondary:#101018;--bg-tertiary:#16161f;--bg-card:#13131b;--bg-card-hover:#1a1a25;--bg-input:#111119;--bg-overlay:rgba(0,0,0,.65);--border-primary:#1e1e2a;--border-secondary:#2a2a38;--border-focus:#ff6b35;--text-primary:#e8e8ec;--text-secondary:#8a8a9a;--text-tertiary:#55556a;--text-inverse:#0a0a0f;--accent:#ff6b35;--accent-dim:rgba(255,107,53,.12);--accent-hover:#ff8255;--accent-text:#ff6b35;--success:#2dd4a0;--success-dim:rgba(45,212,160,.12);--warning:#f5b731;--warning-dim:rgba(245,183,49,.12);--danger:#ef4444;--danger-dim:rgba(239,68,68,.12);--info:#38bdf8;--info-dim:rgba(56,189,248,.12);--priority-low:#38bdf8;--priority-medium:#f5b731;--priority-high:#ff6b35;--priority-critical:#ef4444;--progress-bg:#1e1e2a;--progress-fill:#ff6b35;--shadow-sm:0 1px 3px rgba(0,0,0,.3);--shadow-md:0 4px 12px rgba(0,0,0,.4);--shadow-lg:0 8px 30px rgba(0,0,0,.5);--scrollbar-track:#101018;--scrollbar-thumb:#2a2a38}
[data-theme="light"]{--bg-primary:#f5f5f0;--bg-secondary:#eaeae5;--bg-tertiary:#dfdfd8;--bg-card:#fff;--bg-card-hover:#f8f8f5;--bg-input:#f0f0eb;--bg-overlay:rgba(0,0,0,.4);--border-primary:#d4d4cc;--border-secondary:#c0c0b8;--border-focus:#d45a1e;--text-primary:#1a1a20;--text-secondary:#5a5a66;--text-tertiary:#8a8a96;--text-inverse:#f5f5f0;--accent:#d45a1e;--accent-dim:rgba(212,90,30,.1);--accent-hover:#c0501a;--accent-text:#d45a1e;--success:#0d9668;--success-dim:rgba(13,150,104,.1);--warning:#b8860b;--warning-dim:rgba(184,134,11,.1);--danger:#dc2626;--danger-dim:rgba(220,38,38,.1);--info:#0284c7;--info-dim:rgba(2,132,199,.1);--priority-low:#0284c7;--priority-medium:#b8860b;--priority-high:#d45a1e;--priority-critical:#dc2626;--progress-bg:#d4d4cc;--progress-fill:#d45a1e;--shadow-sm:0 1px 3px rgba(0,0,0,.06);--shadow-md:0 4px 12px rgba(0,0,0,.08);--shadow-lg:0 8px 30px rgba(0,0,0,.12);--scrollbar-track:#eaeae5;--scrollbar-thumb:#c0c0b8}
html{font-size:16px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{font-family:var(--font-display);background:var(--bg-primary);color:var(--text-primary);min-height:100vh;overflow-x:hidden;transition:background var(--transition-slow),color var(--transition-slow)}
::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:var(--scrollbar-track)}::-webkit-scrollbar-thumb{background:var(--scrollbar-thumb);border-radius:3px}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}:focus:not(:focus-visible){outline:none}
::selection{background:var(--accent);color:var(--text-inverse)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);font-family:var(--font-display);font-size:var(--text-sm);font-weight:500;padding:var(--space-2) var(--space-4);border:1px solid transparent;border-radius:var(--radius-md);cursor:pointer;transition:all var(--transition-fast);white-space:nowrap;user-select:none;-webkit-tap-highlight-color:transparent;min-height:36px}
.btn:active{transform:scale(.97)}
.btn-primary{background:var(--accent);color:var(--text-inverse);border-color:var(--accent)}.btn-primary:hover{background:var(--accent-hover)}
.btn-secondary{background:transparent;color:var(--text-primary);border-color:var(--border-secondary)}.btn-secondary:hover{background:var(--bg-tertiary);border-color:var(--text-tertiary)}
.btn-ghost{background:transparent;color:var(--text-secondary);border-color:transparent}.btn-ghost:hover{background:var(--bg-tertiary);color:var(--text-primary)}
.btn-danger{background:var(--danger-dim);color:var(--danger);border-color:transparent}.btn-danger:hover{background:var(--danger);color:#fff}
.btn-sm{padding:var(--space-1) var(--space-3);font-size:var(--text-xs);min-height:30px}
.btn-lg{padding:var(--space-3) var(--space-6);font-size:var(--text-base);min-height:44px}
.btn-block{width:100%}.btn:disabled{opacity:.4;cursor:not-allowed;pointer-events:none}
.input,.select,.textarea{width:100%;font-family:var(--font-display);font-size:var(--text-sm);padding:var(--space-2) var(--space-3);background:var(--bg-input);color:var(--text-primary);border:1px solid var(--border-primary);border-radius:var(--radius-md);transition:border-color var(--transition-fast),box-shadow var(--transition-fast);min-height:38px}
.input:focus,.select:focus,.textarea:focus{border-color:var(--border-focus);box-shadow:0 0 0 3px var(--accent-dim);outline:none}
.input::placeholder,.textarea::placeholder{color:var(--text-tertiary)}
.textarea{resize:vertical;min-height:80px;line-height:1.5}
.select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%238a8a9a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px;cursor:pointer}
.form-group{display:flex;flex-direction:column;gap:var(--space-1)}
.form-group label{font-size:var(--text-xs);font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em}
.card{background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-lg);padding:var(--space-4);transition:background var(--transition-fast),border-color var(--transition-fast)}
.card:hover{background:var(--bg-card-hover)}
.badge{display:inline-flex;align-items:center;gap:var(--space-1);font-family:var(--font-mono);font-size:var(--text-xs);font-weight:500;padding:2px 8px;border-radius:var(--radius-sm);white-space:nowrap}
.badge-low{background:rgba(56,189,248,.12);color:var(--priority-low)}.badge-medium{background:var(--warning-dim);color:var(--priority-medium)}.badge-high{background:var(--accent-dim);color:var(--priority-high)}.badge-critical{background:var(--danger-dim);color:var(--priority-critical)}
.progress-bar{width:100%;height:6px;background:var(--progress-bg);border-radius:3px;overflow:hidden}
.progress-fill{height:100%;background:var(--progress-fill);border-radius:3px;transition:width var(--transition-slow)}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--space-12) var(--space-6);text-align:center;color:var(--text-tertiary)}
.empty-state svg{margin-bottom:var(--space-4);opacity:.4}
.empty-state p{font-size:var(--text-sm);max-width:260px;line-height:1.5}
.toast-container{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:var(--space-2);pointer-events:none}
@media(min-width:769px){.toast-container{bottom:var(--space-6);left:calc(var(--sidebar-width) + var(--space-6));transform:none}}
.toast{font-family:var(--font-display);font-size:var(--text-sm);font-weight:500;padding:var(--space-3) var(--space-5);background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-secondary);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);animation:toastIn 300ms ease forwards;pointer-events:auto}
.toast.toast-exit{animation:toastOut 250ms ease forwards}
@keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes toastOut{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(-8px) scale(.96)}}
.task-checkbox{width:20px;height:20px;min-width:20px;border:2px solid var(--border-secondary);border-radius:var(--radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all var(--transition-fast);background:transparent;-webkit-tap-highlight-color:transparent}
.task-checkbox:hover{border-color:var(--accent)}.task-checkbox.checked{background:var(--accent);border-color:var(--accent)}.task-checkbox.checked svg{color:var(--text-inverse)}
.mono{font-family:var(--font-mono)}.text-accent{color:var(--accent-text)}.text-secondary{color:var(--text-secondary)}.text-tertiary{color:var(--text-tertiary)}.text-success{color:var(--success)}.text-danger{color:var(--danger)}
.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
[data-theme="dark"] body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 50% at 50% 0%,rgba(255,107,53,.03) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 100%,rgba(56,189,248,.02) 0%,transparent 50%);pointer-events:none;z-index:0}
@media(max-width:768px){.input,.select,.textarea{font-size:16px!important}}
html.standalone{overscroll-behavior-y:contain}
.btn,.nav-item,.mobile-nav-item,.filter-chip,.task-checkbox,.task-action-btn{-webkit-user-select:none;user-select:none}
.app{min-height:100vh;min-height:-webkit-fill-available}
body.modal-open{overflow:hidden!important;position:fixed;width:100%;height:100%}
button,a,[role="button"]{-webkit-tap-highlight-color:transparent}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`);

w('src/App.css',`
.app{display:flex;min-height:100vh;position:relative;z-index:1}
.sidebar{position:fixed;top:0;left:0;width:var(--sidebar-width);height:100vh;background:var(--bg-secondary);border-right:1px solid var(--border-primary);display:flex;flex-direction:column;z-index:100;transition:transform var(--transition-slow)}
.sidebar-brand{padding:var(--space-6) var(--space-5) var(--space-5);border-bottom:1px solid var(--border-primary)}
.sidebar-brand h1{font-family:var(--font-mono);font-size:var(--text-xl);font-weight:700;letter-spacing:.15em;color:var(--text-primary)}
.sidebar-brand span{display:block;font-size:var(--text-xs);color:var(--text-tertiary);margin-top:var(--space-1);font-weight:400;letter-spacing:.02em}
.sidebar-nav{flex:1;padding:var(--space-3);overflow-y:auto}
.sidebar-section-label{font-family:var(--font-mono);font-size:.625rem;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.12em;padding:var(--space-3) var(--space-3) var(--space-1)}
.nav-item{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);color:var(--text-secondary);font-size:var(--text-sm);font-weight:450;cursor:pointer;transition:all var(--transition-fast);border:none;background:none;width:100%;text-align:left;font-family:var(--font-display);-webkit-tap-highlight-color:transparent}
.nav-item:hover{background:var(--bg-tertiary);color:var(--text-primary)}
.nav-item.active{background:var(--accent-dim);color:var(--accent-text);font-weight:600}
.nav-item svg{width:18px;height:18px;min-width:18px}
.nav-item.disabled{opacity:.3;cursor:default;pointer-events:none}
.sidebar-footer{padding:var(--space-4);border-top:1px solid var(--border-primary);font-family:var(--font-mono);font-size:var(--text-xs);color:var(--text-tertiary)}
.main-content{flex:1;margin-left:var(--sidebar-width);min-height:100vh;padding:var(--space-6) var(--space-8);max-width:900px;width:100%}
.mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:var(--bottom-nav-height);background:var(--bg-secondary);border-top:1px solid var(--border-primary);z-index:100;padding:var(--space-1) var(--space-2)}
.mobile-nav-inner{display:flex;align-items:center;justify-content:space-around;height:100%}
.mobile-nav-item{display:flex;flex-direction:column;align-items:center;gap:2px;padding:var(--space-1) var(--space-2);border-radius:var(--radius-md);color:var(--text-tertiary);font-size:.625rem;font-weight:500;cursor:pointer;transition:all var(--transition-fast);border:none;background:none;font-family:var(--font-display);-webkit-tap-highlight-color:transparent;min-width:52px}
.mobile-nav-item svg{width:20px;height:20px}
.mobile-nav-item.active{color:var(--accent-text)}
.mobile-nav-item.disabled{opacity:.3;cursor:default;pointer-events:none}
.mobile-header{display:none;padding:var(--space-4) var(--space-4) var(--space-2)}
.mobile-header h1{font-family:var(--font-mono);font-size:var(--text-lg);font-weight:700;letter-spacing:.1em}
.modal-overlay{position:fixed;inset:0;background:var(--bg-overlay);z-index:200;display:flex;align-items:flex-end;justify-content:center;animation:fadeIn 200ms ease}
.modal-panel{background:var(--bg-secondary);border:1px solid var(--border-primary);border-bottom:none;border-radius:var(--radius-xl) var(--radius-xl) 0 0;width:100%;max-width:560px;max-height:85vh;overflow-y:auto;animation:slideUp 300ms ease}
.modal-header{display:flex;align-items:center;justify-content:space-between;padding:var(--space-5) var(--space-5) var(--space-3);position:sticky;top:0;background:var(--bg-secondary);z-index:1}
.modal-header h2{font-size:var(--text-lg);font-weight:600}
.modal-body{padding:0 var(--space-5) var(--space-5);display:flex;flex-direction:column;gap:var(--space-4)}
.modal-footer{padding:var(--space-4) var(--space-5);border-top:1px solid var(--border-primary);display:flex;gap:var(--space-3);justify-content:flex-end;position:sticky;bottom:0;background:var(--bg-secondary)}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.confirm-overlay{position:fixed;inset:0;background:var(--bg-overlay);z-index:300;display:flex;align-items:center;justify-content:center;padding:var(--space-6);animation:fadeIn 150ms ease}
.confirm-panel{background:var(--bg-secondary);border:1px solid var(--border-primary);border-radius:var(--radius-xl);padding:var(--space-6);width:100%;max-width:380px;animation:scaleIn 200ms ease}
.confirm-panel h3{font-size:var(--text-base);font-weight:600;margin-bottom:var(--space-2)}
.confirm-panel p{font-size:var(--text-sm);color:var(--text-secondary);line-height:1.5;margin-bottom:var(--space-5)}
.confirm-actions{display:flex;gap:var(--space-3);justify-content:flex-end}
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.dashboard-greeting{margin-bottom:var(--space-1)}
.dashboard-greeting .date{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.08em}
.dashboard-greeting h2{font-size:var(--text-2xl);font-weight:700;margin-top:var(--space-1)}
.dashboard-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-top:var(--space-6)}
.stat-card{background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-lg);padding:var(--space-4)}
.stat-card .stat-value{font-family:var(--font-mono);font-size:var(--text-2xl);font-weight:700;color:var(--text-primary);line-height:1}
.stat-card .stat-label{font-size:var(--text-xs);color:var(--text-tertiary);margin-top:var(--space-1);font-weight:500}
.dashboard-section{margin-top:var(--space-8)}
.dashboard-section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)}
.dashboard-section-header h3{font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.06em}
.daily-progress-section{margin-top:var(--space-6)}
.daily-progress-header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:var(--space-2)}
.daily-progress-header .label{font-size:var(--text-xs);font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.06em}
.daily-progress-header .percentage{font-family:var(--font-mono);font-size:var(--text-sm);font-weight:600;color:var(--accent-text)}
.current-mission{background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-lg);padding:var(--space-5)}
.current-mission .mission-label{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.1em;margin-bottom:var(--space-3)}
.current-mission .mission-title{font-size:var(--text-lg);font-weight:600;margin-bottom:var(--space-4);line-height:1.3}
.current-mission .mission-meta{display:flex;gap:var(--space-3);align-items:center;margin-bottom:var(--space-4);flex-wrap:wrap}
.current-mission .mission-meta span{font-size:var(--text-xs);color:var(--text-tertiary);font-family:var(--font-mono)}
.top-priorities-list{display:flex;flex-direction:column;gap:var(--space-2)}
.top-priority-item{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-md);font-size:var(--text-sm)}
.top-priority-item .priority-num{font-family:var(--font-mono);font-size:var(--text-xs);font-weight:700;color:var(--accent-text);min-width:18px}
.top-priority-item.completed .priority-text{text-decoration:line-through;color:var(--text-tertiary)}
.top-priority-item .priority-text{flex:1}
.no-mission{color:var(--text-tertiary);font-size:var(--text-sm);font-style:italic}
.tasks-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5);flex-wrap:wrap;gap:var(--space-3)}
.tasks-header h2{font-size:var(--text-xl);font-weight:700}
.tasks-filters{display:flex;gap:var(--space-2);overflow-x:auto;padding-bottom:var(--space-1);margin-bottom:var(--space-4)}
.tasks-filters::-webkit-scrollbar{display:none}
.filter-chip{font-family:var(--font-display);font-size:var(--text-xs);font-weight:500;padding:var(--space-1) var(--space-3);border-radius:100px;border:1px solid var(--border-primary);background:transparent;color:var(--text-secondary);cursor:pointer;white-space:nowrap;transition:all var(--transition-fast);-webkit-tap-highlight-color:transparent}
.filter-chip:hover{border-color:var(--border-secondary);color:var(--text-primary)}
.filter-chip.active{background:var(--accent-dim);border-color:var(--accent);color:var(--accent-text)}
.search-bar{position:relative;margin-bottom:var(--space-4)}
.search-bar svg{position:absolute;left:var(--space-3);top:50%;transform:translateY(-50%);color:var(--text-tertiary);width:16px;height:16px}
.search-bar input{padding-left:var(--space-8)}
.tasks-list{display:flex;flex-direction:column;gap:var(--space-2)}
.task-item{display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-3) var(--space-4);background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-md);transition:all var(--transition-fast);cursor:default}
.task-item:hover{background:var(--bg-card-hover)}
.task-item.completed{opacity:.5}
.task-item.completed .task-title{text-decoration:line-through;color:var(--text-tertiary)}
.task-content{flex:1;min-width:0}
.task-title{font-size:var(--text-sm);font-weight:500;line-height:1.4;margin-bottom:var(--space-1)}
.task-description{font-size:var(--text-xs);color:var(--text-tertiary);line-height:1.4;margin-bottom:var(--space-2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.task-meta{display:flex;gap:var(--space-2);align-items:center;flex-wrap:wrap}
.task-meta .meta-item{font-family:var(--font-mono);font-size:.6875rem;color:var(--text-tertiary)}
.task-actions{display:flex;gap:var(--space-1);flex-shrink:0}
.task-action-btn{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;color:var(--text-tertiary);border-radius:var(--radius-sm);cursor:pointer;transition:all var(--transition-fast);-webkit-tap-highlight-color:transparent}
.task-action-btn:hover{background:var(--bg-tertiary);color:var(--text-primary)}
.task-action-btn.delete:hover{background:var(--danger-dim);color:var(--danger)}
.task-action-btn svg{width:14px;height:14px}
.task-due-overdue{color:var(--danger)!important;font-weight:600}
.settings-section{margin-bottom:var(--space-8)}
.settings-section h3{font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);padding-bottom:var(--space-2);border-bottom:1px solid var(--border-primary)}
.settings-group{display:flex;flex-direction:column;gap:var(--space-3)}
.setting-row{display:flex;align-items:center;justify-content:space-between;gap:var(--space-4)}
.setting-row .setting-label{font-size:var(--text-sm);color:var(--text-primary)}
.setting-row .setting-desc{font-size:var(--text-xs);color:var(--text-tertiary);margin-top:2px}
.theme-options{display:flex;gap:var(--space-2)}
.theme-btn{font-family:var(--font-display);font-size:var(--text-xs);font-weight:500;padding:var(--space-2) var(--space-3);border:1px solid var(--border-primary);background:transparent;color:var(--text-secondary);border-radius:var(--radius-md);cursor:pointer;transition:all var(--transition-fast);-webkit-tap-highlight-color:transparent}
.theme-btn:hover{border-color:var(--border-secondary);color:var(--text-primary)}
.theme-btn.active{background:var(--accent-dim);border-color:var(--accent);color:var(--accent-text)}
.subjects-list{display:flex;flex-wrap:wrap;gap:var(--space-2);margin-top:var(--space-2)}
.subject-tag{display:inline-flex;align-items:center;gap:var(--space-2);font-family:var(--font-mono);font-size:var(--text-xs);padding:var(--space-1) var(--space-3);background:var(--bg-tertiary);border:1px solid var(--border-primary);border-radius:100px;color:var(--text-secondary)}
.subject-tag button{background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:0;display:flex}
.subject-tag button:hover{color:var(--danger)}
.subject-tag button svg{width:12px;height:12px}
.add-subject-row{display:flex;gap:var(--space-2);margin-top:var(--space-2)}
.add-subject-row input{flex:1}
.danger-zone{border:1px solid var(--danger);border-radius:var(--radius-lg);padding:var(--space-5)}
.danger-zone h3{color:var(--danger);border-bottom-color:transparent;margin-bottom:var(--space-2)}
.danger-zone p{font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--space-4);line-height:1.5}
@media(max-width:768px){
.sidebar{display:none!important}
.mobile-nav{display:block!important}
.mobile-header{display:block!important}
.main-content{margin-left:0!important;padding:0 var(--space-4) calc(var(--bottom-nav-height) + var(--space-6));max-width:100%!important;width:100%}
.stat-card{padding:var(--space-3)}.stat-card .stat-value{font-size:var(--text-xl)}
.modal-overlay{align-items:flex-end!important}
.modal-panel{max-height:92vh!important;border-radius:var(--radius-xl) var(--radius-xl) 0 0!important}
.task-item{padding:var(--space-4);gap:var(--space-4);min-height:60px}
.task-checkbox{width:24px;height:24px;min-width:24px;margin-top:2px}
.task-action-btn{width:36px;height:36px}.task-action-btn svg{width:16px;height:16px}
.tasks-header{flex-direction:column;align-items:stretch}
.tasks-header h2{margin-bottom:var(--space-2)}
.filter-chip{padding:var(--space-2) var(--space-4);font-size:var(--text-sm);min-height:36px;display:inline-flex;align-items:center}
.setting-row{flex-direction:column;align-items:flex-start;gap:var(--space-2)}
.setting-row .select,.setting-row .input{width:100%!important}
.theme-options{width:100%}.theme-btn{flex:1;text-align:center;min-height:40px}
.confirm-panel{border-radius:var(--radius-xl) var(--radius-xl) 0 0;max-width:100%;margin:auto 0 0 0}
.confirm-overlay{align-items:flex-end;padding:0}
.btn{min-height:42px}.btn-sm{min-height:34px}
.current-mission{padding:var(--space-4)}.current-mission .mission-title{font-size:var(--text-base)}
.dashboard-greeting h2{font-size:var(--text-xl)}
.add-subject-row{flex-direction:column}.add-subject-row .btn{width:100%}
}
@media(max-width:380px){.stat-card{padding:var(--space-2)}.stat-card .stat-value{font-size:var(--text-lg)}.stat-card .stat-label{font-size:.6rem}.main-content{padding-left:var(--space-3);padding-right:var(--space-3)}}
@media(min-width:769px){.mobile-header{display:none!important}.mobile-nav{display:none!important}}
`);

w('src/utils/storage.js',`
var KEYS={TASKS:'thrust_tasks',CARDS:'thrust_cards',NOTES:'thrust_notes',PROJECTS:'thrust_projects',POMODORO:'thrust_pomodoro',REVIEWS:'thrust_reviews',SETTINGS:'thrust_settings',SUBJECTS:'thrust_subjects'};
var DEFAULT_SUBJECTS=['ECE','Digital Logic','Electronics','Networks','Signals','Communication','Programming','React','Python','C/C++','Linux','Cybersecurity','Data Science','Mathematics','Projects'];
var DEFAULT_SETTINGS={theme:'dark',pomodoroWork:25,pomodoroBreak:5,dailyFocusGoal:120,defaultSubject:'ECE'};
export function generateId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function read(k,fb){try{var r=localStorage.getItem(k);if(r===null||r===undefined)return fb;var p=JSON.parse(r);if(!Array.isArray(p)&&typeof p!=='object')return fb;return p}catch(e){console.warn('[THRUST] Bad read:',k,e.message);return fb}}
function write(k,d){try{localStorage.setItem(k,JSON.stringify(d));return true}catch(e){console.error('[THRUST] Bad write:',k,e.message);return false}}
export function getData(k){var m={};m[KEYS.TASKS]=[];m[KEYS.CARDS]=[];m[KEYS.NOTES]=[];m[KEYS.PROJECTS]=[];m[KEYS.POMODORO]=[];m[KEYS.REVIEWS]=[];return read(k,m[k]||[])}
export function saveData(k,d){return write(k,d)}
export function addItem(k,item){var d=getData(k);var n=Object.assign({},item,{id:generateId(),createdAt:new Date().toISOString()});d.unshift(n);saveData(k,d);return n}
export function updateItem(k,id,updates){var d=getData(k);var i=d.findIndex(function(x){return x.id===id});if(i===-1)return null;d[i]=Object.assign({},d[i],updates,{updatedAt:new Date().toISOString()});saveData(k,d);return d[i]}
export function deleteItem(k,id){var d=getData(k);var f=d.filter(function(x){return x.id!==id});if(f.length===d.length)return false;saveData(k,f);return true}
export function getTasks(){return getData(KEYS.TASKS)}
export function addTask(t){return addItem(KEYS.TASKS,t)}
export function updateTask(id,u){return updateItem(KEYS.TASKS,id,u)}
export function deleteTask(id){return deleteItem(KEYS.TASKS,id)}
export function getSubjects(){return read(KEYS.SUBJECTS,DEFAULT_SUBJECTS)}
export function saveSubjects(s){return write(KEYS.SUBJECTS,s)}
export function addSubject(name){var s=getSubjects();var t=name.trim();if(!t||s.indexOf(t)!==-1)return false;s.push(t);saveSubjects(s);return true}
export function deleteSubject(name){var s=getSubjects();var f=s.filter(function(x){return x!==name});if(f.length===s.length)return false;saveSubjects(f);return true}
export function getSettings(){return read(KEYS.SETTINGS,DEFAULT_SETTINGS)}
export function saveSettings(s){return write(KEYS.SETTINGS,s)}
export function getTodayString(){return new Date().toISOString().split('T')[0]}
export function isToday(d){if(!d)return false;return d.split('T')[0]===getTodayString()}
export function isPast(d){if(!d)return false;var dt=new Date(d);var t=new Date();t.setHours(0,0,0,0);return dt<t}
export function formatDate(d){if(!d)return '';return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
export function formatDuration(m){if(!m||m<=0)return '0m';var h=Math.floor(m/60);var r=m%60;if(h===0)return r+'m';if(r===0)return h+'h';return h+'h '+r+'m'}
export {KEYS};
`);

w('src/context/ThemeContext.jsx',`
import{createContext,useContext,useState,useEffect,useCallback}from'react';
import{getSettings,saveSettings}from'../utils/storage';
var C=createContext();
export function ThemeProvider(props){var s=getSettings();var initTheme=s.theme==='system'?(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):(s.theme||'dark');
var state=useState(initTheme);var theme=state[0];var setTS=state[1];
var setTheme=useCallback(function(t){var s=getSettings();s.theme=t;saveSettings(s);var e=t;if(t==='system')e=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';setTS(e);document.documentElement.setAttribute('data-theme',e)},[]);
useEffect(function(){document.documentElement.setAttribute('data-theme',theme);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',theme==='dark'?'#0a0a0f':'#f5f5f0')},[theme]);
useEffect(function(){var s=getSettings();if(s.theme!=='system')return;var mq=window.matchMedia('(prefers-color-scheme:dark)');var h=function(e){var t=e.matches?'dark':'light';setTS(t);document.documentElement.setAttribute('data-theme',t)};mq.addEventListener('change',h);return function(){mq.removeEventListener('change',h)}},[]);
return React.createElement(C.Provider,{value:{theme:theme,setTheme:setTheme}},props.children)}
export function useTheme(){var c=useContext(C);if(!c)throw new Error('No ThemeProvider');return c}
`);

w('src/context/AppContext.jsx',`
import{createContext,useContext,useState,useCallback}from'react';
var C=createContext();
export function AppProvider(props){var state=useState([]);var toasts=state[0];var setToasts=state[1];
var showToast=useCallback(function(msg,dur){if(dur===undefined)dur=2500;var id=Date.now();setToasts(function(p){return p.concat([{id:id,message:msg,exiting:false}])});setTimeout(function(){setToasts(function(p){return p.map(function(t){return t.id===id?Object.assign({},t,{exiting:true}):t})});setTimeout(function(){setToasts(function(p){return p.filter(function(t){return t.id!==id})})},260)},dur)},[]);
return React.createElement(C.Provider,{value:{toasts:toasts,showToast:showToast}},props.children)}
export function useApp(){var c=useContext(C);if(!c)throw new Error('No AppProvider');return c}
`);

w('src/components/Icons.jsx',`
export var DashI=function(){return React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('rect',{x:'3',y:'3',width:'7',height:'7',rx:'1'}),React.createElement('rect',{x:'14',y:'3',width:'7',height:'7',rx:'1'}),React.createElement('rect',{x:'3',y:'14',width:'7',height:'7',rx:'1'}),React.createElement('rect',{x:'14',y:'14',width:'7',height:'7',rx:'1'}))};
export var TaskI=function(){return React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M9 11l3 3L22 4'}),React.createElement('path',{d:'M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11'}))};
export var CardI=function(){return React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('rect',{x:'2',y:'4',width:'20',height:'16',rx:'2'}),React.createElement('path',{d:'M2 8h20'}))};
export var TimerI=function(){return React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('circle',{cx:'12',cy:'13',r:'8'}),React.createElement('path',{d:'M12 9v4l2 2'}),React.createElement('path',{d:'M9 2h6'}),React.createElement('path',{d:'M12 2v2'}))};
export var NoteI=function(){return React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z'}),React.createElement('polyline',{points:'14,2 14,8 20,8'}),React.createElement('line',{x1:'16',y1:'13',x2:'8',y2:'13'}),React.createElement('line',{x1:'16',y1:'17',x2:'8',y2:'17'}))};
export var ProjI=function(){return React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z'}))};
export var StatI=function(){return React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M18 20V10'}),React.createElement('path',{d:'M12 20V4'}),React.createElement('path',{d:'M6 20v-6'}))};
export var SetI=function(){return React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('circle',{cx:'12',cy:'12',r:'3'}),React.createElement('path',{d:'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z'}))};
export var HomeI=function(){return React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'}),React.createElement('polyline',{points:'9,22 9,12 15,12 15,22'}))};
`);

w('src/components/Sidebar.jsx',`
import{DashI,TaskI,CardI,TimerI,NoteI,ProjI,StatI,SetI}from'./Icons';
var main=[{id:'dashboard',label:'Dashboard',Icon:DashI},{id:'tasks',label:'Tasks',Icon:TaskI},{id:'cards',label:'Quick Cards',Icon:CardI,disabled:true},{id:'pomodoro',label:'Pomodoro',Icon:TimerI,disabled:true},{id:'notes',label:'Notes',Icon:NoteI,disabled:true},{id:'projects',label:'Projects',Icon:ProjI,disabled:true}];
var bot=[{id:'statistics',label:'Statistics',Icon:StatI,disabled:true},{id:'settings',label:'Settings',Icon:SetI}];
export default function Sidebar(props){return React.createElement('aside',{className:'sidebar'},React.createElement('div',{className:'sidebar-brand'},React.createElement('h1',null,'THRUST'),React.createElement('span',null,'Personal Study System')),React.createElement('nav',{className:'sidebar-nav'},React.createElement('div',{className:'sidebar-section-label'},'Main'),main.map(function(i){return React.createElement('button',{key:i.id,className:'nav-item'+(props.currentPage===i.id?' active':'')+(i.disabled?' disabled':''),onClick:function(){if(!i.disabled)props.onNavigate(i.id)},title:i.disabled?'Coming soon':i.label},React.createElement(i.Icon,null),i.label)}),React.createElement('div',{className:'sidebar-section-label',style:{marginTop:'var(--space-4)'}},'System'),bot.map(function(i){return React.createElement('button',{key:i.id,className:'nav-item'+(props.currentPage===i.id?' active':'')+(i.disabled?' disabled':''),onClick:function(){if(!i.disabled)props.onNavigate(i.id)},title:i.disabled?'Coming soon':i.label},React.createElement(i.Icon,null),i.label)})),React.createElement('div',{className:'sidebar-footer'},'v0.1.0'))}
`);

w('src/components/MobileNav.jsx',`
import{HomeI,TaskI,CardI,TimerI,SetI}from'./Icons';
var items=[{id:'dashboard',label:'Home',Icon:HomeI},{id:'tasks',label:'Tasks',Icon:TaskI},{id:'cards',label:'Cards',Icon:CardI,disabled:true},{id:'pomodoro',label:'Focus',Icon:TimerI,disabled:true},{id:'settings',label:'Settings',Icon:SetI}];
export default function MobileNav(props){return React.createElement('nav',{className:'mobile-nav'},React.createElement('div',{className:'mobile-nav-inner'},items.map(function(i){return React.createElement('button',{key:i.id,className:'mobile-nav-item'+(props.currentPage===i.id?' active':'')+(i.disabled?' disabled':''),onClick:function(){if(!i.disabled)props.onNavigate(i.id)}},React.createElement(i.Icon,null),i.label)})))}
`);

w('src/components/Modal.jsx',`
import{useEffect,useRef}from'react';
export default function Modal(props){var ref=useRef(null);useEffect(function(){if(!props.isOpen)return;var sy=window.scrollY;document.body.classList.add('modal-open');document.body.style.top='-'+sy+'px';var h=function(e){if(e.key==='Escape')props.onClose()};document.addEventListener('keydown',h);return function(){document.body.classList.remove('modal-open');document.body.style.top='';window.scrollTo(0,sy);document.removeEventListener('keydown',h)}},[props.isOpen,props.onClose]);if(!props.isOpen)return null;return React.createElement('div',{className:'modal-overlay',ref:ref,onClick:function(e){if(e.target===ref.current)props.onClose()}},React.createElement('div',{className:'modal-panel',role:'dialog','aria-modal':'true'},React.createElement('div',{className:'modal-header'},React.createElement('h2',null,props.title),React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:props.onClose,'aria-label':'Close',style:{minWidth:'40px',minHeight:'40px'}},React.createElement('svg',{width:'18',height:'18',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('line',{x1:'18',y1:'6',x2:'6',y2:'18'}),React.createElement('line',{x1:'6',y1:'6',x2:'18',y2:'18'})))),React.createElement('div',{className:'modal-body'},props.children),props.footer&&React.createElement('div',{className:'modal-footer'},props.footer)))}
`);

w('src/components/ConfirmDialog.jsx',`
export default function ConfirmDialog(props){if(!props.isOpen)return null;return React.createElement('div',{className:'confirm-overlay',onClick:function(e){if(e.target===e.currentTarget)props.onCancel()}},React.createElement('div',{className:'confirm-panel'},React.createElement('h3',null,props.title||'Confirm'),React.createElement('p',null,props.message||'Are you sure?'),React.createElement('div',{className:'confirm-actions'},React.createElement('button',{className:'btn btn-secondary',onClick:props.onCancel},'Cancel'),React.createElement('button',{className:'btn '+(props.danger?'btn-danger':'btn-primary'),onClick:props.onConfirm},props.confirmText||'Confirm'))))}
`);

w('src/pages/Dashboard.jsx',`
import{useMemo}from'react';
import{getTasks,isToday,isPast,formatDate}from'../utils/storage';
export default function Dashboard(props){var tasks=useMemo(function(){return getTasks()},[]);var todayTasks=useMemo(function(){return tasks.filter(function(t){return !t.completed&&(isToday(t.dueDate)||!t.dueDate)})},[tasks]);var completedToday=useMemo(function(){return tasks.filter(function(t){return t.completed&&isToday(t.completedAt)})},[tasks]);var totalToday=todayTasks.length+completedToday.length;var dailyProgress=totalToday>0?Math.round((completedToday.length/totalToday)*100):0;var topPriorities=useMemo(function(){return tasks.filter(function(t){return !t.completed&&(t.priority==='critical'||t.priority==='high')&&(isToday(t.dueDate)||!t.dueDate)}).slice(0,3)},[tasks]);var currentMission=useMemo(function(){var h=tasks.find(function(t){return !t.completed&&(t.priority==='critical'||t.priority==='high')});return h||tasks.find(function(t){return !t.completed})||null},[tasks]);var overdueCount=useMemo(function(){return tasks.filter(function(t){return !t.completed&&t.dueDate&&isPast(t.dueDate)&&!isToday(t.dueDate)}).length},[tasks]);var greeting=function(){var h=new Date().getHours();if(h<6)return'Late night session';if(h<12)return'Good morning';if(h<17)return'Good afternoon';if(h<21)return'Good evening';return'Night session'};var todayStr=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});return React.createElement('div',null,React.createElement('div',{className:'dashboard-greeting'},React.createElement('div',{className:'date'},todayStr),React.createElement('h2',null,greeting())),React.createElement('div',{className:'dashboard-stats'},React.createElement('div',{className:'stat-card'},React.createElement('div',{className:'stat-value'},todayTasks.length),React.createElement('div',{className:'stat-label'},'Remaining')),React.createElement('div',{className:'stat-card'},React.createElement('div',{className:'stat-value',style:{color:'var(--success)'}},completedToday.length),React.createElement('div',{className:'stat-label'},'Completed')),React.createElement('div',{className:'stat-card'},React.createElement('div',{className:'stat-value mono',style:{fontSize:'var(--text-lg)'}},'0m'),React.createElement('div',{className:'stat-label'},'Focused'))),overdueCount>0&&React.createElement('div',{style:{marginTop:'var(--space-4)',padding:'var(--space-3) var(--space-4)',background:'var(--danger-dim)',borderRadius:'var(--radius-md)',border:'1px solid rgba(239,68,68,0.2)'}},React.createElement('span',{className:'mono text-danger',style:{fontSize:'var(--text-xs)',fontWeight:600}},overdueCount+' overdue task'+(overdueCount>1?'s':''))),React.createElement('div',{className:'daily-progress-section'},React.createElement('div',{className:'daily-progress-header'},React.createElement('span',{className:'label'},'Daily Progress'),React.createElement('span',{className:'percentage'},dailyProgress+'%')),React.createElement('div',{className:'progress-bar'},React.createElement('div',{className:'progress-fill',style:{width:dailyProgress+'%'}}))),React.createElement('div',{className:'dashboard-section'},React.createElement('div',{className:'dashboard-section-header'},React.createElement('h3',null,'Current Mission')),currentMission?React.createElement('div',{className:'current-mission'},React.createElement('div',{className:'mission-label'},'Next Task'),React.createElement('div',{className:'mission-title'},currentMission.title),React.createElement('div',{className:'mission-meta'},currentMission.subject&&React.createElement('span',null,currentMission.subject),currentMission.priority&&React.createElement('span',{className:'badge badge-'+currentMission.priority},currentMission.priority),currentMission.estimatedMinutes&&React.createElement('span',null,currentMission.estimatedMinutes+' min'),currentMission.dueDate&&React.createElement('span',{style:{color:isPast(currentMission.dueDate)&&!isToday(currentMission.dueDate)?'var(--danger)':'var(--text-tertiary)'}},formatDate(currentMission.dueDate))),React.createElement('button',{className:'btn btn-primary',onClick:function(){props.onNavigate('tasks')}},'Go to Tasks')):React.createElement('div',{className:'current-mission'},React.createElement('div',{className:'mission-label'},'Next Task'),React.createElement('p',{className:'no-mission'},'No tasks pending. Add tasks to get started.'))),topPriorities.length>0&&React.createElement('div',{className:'dashboard-section'},React.createElement('div',{className:'dashboard-section-header'},React.createElement('h3',null,'Top Priorities')),React.createElement('div',{className:'top-priorities-list'},topPriorities.map(function(t,i){return React.createElement('div',{key:t.id,className:'top-priority-item'+(t.completed?' completed':'')},React.createElement('span',{className:'priority-num'},i+1),React.createElement('span',{className:'priority-text truncate'},t.title),t.estimatedMinutes&&React.createElement('span',{className:'mono text-tertiary',style:{fontSize:'var(--text-xs)'}},t.estimatedMinutes+'m'))}))),completedToday.length>0&&React.createElement('div',{className:'dashboard-section'},React.createElement('div',{className:'dashboard-section-header'},React.createElement('h3',null,'Done Today'),React.createElement('button',{className:'btn btn-ghost btn-sm',onClick:function(){props.onNavigate('tasks')}},'View All')),React.createElement('div',{className:'top-priorities-list'},completedToday.slice(0,5).map(function(t){return React.createElement('div',{key:t.id,className:'top-priority-item completed'},React.createElement('span',{className:'priority-num',style:{color:'var(--success)'}},'\u2713'),React.createElement('span',{className:'priority-text truncate'},t.title))}))))}
`);

w('src/pages/Tasks.jsx',`
import{useState,useMemo,useEffect,useCallback}from'react';
import{getTasks,addTask,updateTask,deleteTask,getSubjects,isToday,isPast,formatDate}from'../utils/storage';
import Modal from'../components/Modal';
import ConfirmDialog from'../components/ConfirmDialog';
var PRI=['low','medium','high','critical'];
var FILTERS=[{id:'today',label:'Today'},{id:'upcoming',label:'Upcoming'},{id:'all',label:'All'},{id:'completed',label:'Completed'},{id:'high',label:'High Priority'}];
var EMPTY={title:'',description:'',priority:'medium',subject:'',dueDate:'',estimatedMinutes:'',completed:false};
export default function TasksPage(props){var ts=useState([]);var tasks=ts[0];var setTasks=ts[1];var ss=useState([]);var subjects=ss[0];var setSubjects=ss[1];var fs=useState('today');var filter=fs[0];var setFilter=fs[1];var ss2=useState('');var search=ss2[0];var setSearch=ss2[1];var ss3=useState('priority');var sortField=ss3[0];var setSortField=ss3[1];var ms=useState(false);var modalOpen=ms[0];var setModalOpen=ms[1];var es=useState(null);var editing=es[0];var setEditing=es[1];var fs2=useState(Object.assign({},EMPTY));var form=fs2[0];var setForm=fs2[1];var cs=useState(null);var confirmDel=cs[0];var setConfirmDel=cs[1];
var refresh=useCallback(function(){setTasks(getTasks());setSubjects(getSubjects())},[]);useEffect(function(){refresh()},[refresh]);
var filtered=useMemo(function(){var r=tasks.slice();if(search.trim()){var q=search.toLowerCase();r=r.filter(function(t){return t.title.toLowerCase().indexOf(q)!==-1||(t.description&&t.description.toLowerCase().indexOf(q)!==-1)||(t.subject&&t.subject.toLowerCase().indexOf(q)!==-1)})}switch(filter){case'today':r=r.filter(function(t){return !t.completed&&(isToday(t.dueDate)||!t.dueDate)});break;case'upcoming':r=r.filter(function(t){return !t.completed&&t.dueDate&&!isPast(t.dueDate)});break;case'completed':r=r.filter(function(t){return t.completed});break;case'high':r=r.filter(function(t){return !t.completed&&(t.priority==='high'||t.priority==='critical')});break}var po={critical:0,high:1,medium:2,low:3};r.sort(function(a,b){if(sortField==='priority')return(po[a.priority]||2)-(po[b.priority]||2);if(sortField==='dueDate'){if(!a.dueDate)return 1;if(!b.dueDate)return-1;return new Date(a.dueDate)-new Date(b.dueDate)}if(sortField==='created')return new Date(b.createdAt)-new Date(a.createdAt);return 0});return r},[tasks,filter,search,sortField]);
var openAdd=function(){setEditing(null);setForm(Object.assign({},EMPTY,{subject:subjects[0]||''}));setModalOpen(true)};
var openEdit=function(t){setEditing(t);setForm({title:t.title||'',description:t.description||'',priority:t.priority||'medium',subject:t.subject||'',dueDate:t.dueDate?t.dueDate.split('T')[0]:'',estimatedMinutes:t.estimatedMinutes||'',completed:t.completed||false});setModalOpen(true)};
var handleSave=function(){var tr=form.title.trim();if(!tr){props.showToast('Task title is required');return}var min=form.estimatedMinutes?parseInt(form.estimatedMinutes,10):0;var data={title:tr,description:form.description.trim(),priority:form.priority,subject:form.subject.trim(),dueDate:form.dueDate?new Date(form.dueDate+'T23:59:59').toISOString():'',estimatedMinutes:isNaN(min)?0:Math.max(0,min)};if(editing){updateTask(editing.id,data);props.showToast('Task updated')}else{addTask(data);props.showToast('Task added')}setModalOpen(false);refresh()};
var toggleComplete=function(t){var nc=!t.completed;updateTask(t.id,{completed:nc,completedAt:nc?new Date().toISOString():''});props.showToast(nc?'Task completed':'Task reopened');refresh()};
var handleDelete=function(id){deleteTask(id);props.showToast('Task deleted');setConfirmDel(null);refresh()};
var fc=function(f,v){setForm(function(p){var n=Object.assign({},p);n[f]=v;return n})};
useEffect(function(){var h=function(e){if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;if(e.key==='n'||e.key==='N'){e.preventDefault();openAdd()}};window.addEventListener('keydown',h);return function(){window.removeEventListener('keydown',h)}},[subjects]);
var checkSvg=React.createElement('svg',{width:'12',height:'12',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'3',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('polyline',{points:'20,6 9,17 4,12'}));
var editSvg=React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7'}),React.createElement('path',{d:'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'}));
var delSvg=React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('polyline',{points:'3,6 5,6 21,6'}),React.createElement('path',{d:'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2'}));
var plusSvg=React.createElement('svg',{width:'14',height:'14',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2.5',strokeLinecap:'round'},React.createElement('line',{x1:'12',y1:'5',x2:'12',y2:'19'}),React.createElement('line',{x1:'5',y1:'12',x2:'19',y2:'12'}));
var searchSvg=React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('circle',{cx:'11',cy:'11',r:'8'}),React.createElement('line',{x1:'21',y1:'21',x2:'16.65',y2:'16.65'}));
var emptySvg=React.createElement('svg',{width:'48',height:'48',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'1.5',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M9 11l3 3L22 4'}),React.createElement('path',{d:'M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11'}));
return React.createElement('div',null,React.createElement('div',{className:'tasks-header'},React.createElement('h2',null,'Tasks'),React.createElement('button',{className:'btn btn-primary',onClick:openAdd},plusSvg,' Add Task')),React.createElement('div',{className:'search-bar'},searchSvg,React.createElement('input',{className:'input',type:'text',placeholder:'Search tasks...',value:search,onChange:function(e){setSearch(e.target.value)}})),React.createElement('div',{className:'tasks-filters'},FILTERS.map(function(f){return React.createElement('button',{key:f.id,className:'filter-chip'+(filter===f.id?' active':''),onClick:function(){setFilter(f.id)}},f.label)}),React.createElement('select',{className:'filter-chip',style:{appearance:'none',paddingRight:'20px',cursor:'pointer'},value:sortField,onChange:function(e){setSortField(e.target.value)}},React.createElement('option',{value:'priority'},'By Priority'),React.createElement('option',{value:'dueDate'},'By Due Date'),React.createElement('option',{value:'created'},'By Created'))),React.createElement('div',{className:'tasks-list'},filtered.length===0?React.createElement('div',{className:'empty-state'},emptySvg,React.createElement('p',null,search?'No tasks match your search.':filter==='completed'?'No completed tasks yet.':'No tasks here. Press N or click Add Task.')):filtered.map(function(t){var over=!t.completed&&t.dueDate&&isPast(t.dueDate)&&!isToday(t.dueDate);return React.createElement('div',{key:t.id,className:'task-item'+(t.completed?' completed':'')},React.createElement('button',{className:'task-checkbox'+(t.completed?' checked':''),onClick:function(){toggleComplete(t)},'aria-label':t.completed?'Mark incomplete':'Mark complete'},t.completed?checkSvg:null),React.createElement('div',{className:'task-content'},React.createElement('div',{className:'task-title'},t.title),t.description&&React.createElement('div',{className:'task-description'},t.description),React.createElement('div',{className:'task-meta'},t.subject&&React.createElement('span',{className:'meta-item'},t.subject),t.priority&&React.createElement('span',{className:'badge badge-'+t.priority},t.priority),t.estimatedMinutes>0&&React.createElement('span',{className:'meta-item'},t.estimatedMinutes+' min'),t.dueDate&&React.createElement('span',{className:'meta-item'+(over?' task-due-overdue':'')},formatDate(t.dueDate)))),React.createElement('div',{className:'task-actions'},React.createElement('button',{className:'task-action-btn',onClick:function(){openEdit(t)},'aria-label':'Edit',title:'Edit'},editSvg),React.createElement('button',{className:'task-action-btn delete',onClick:function(){setConfirmDel(t.id)},'aria-label':'Delete',title:'Delete'},delSvg)))})),React.createElement(Modal,{isOpen:modalOpen,onClose:function(){setModalOpen(false)},title:editing?'Edit Task':'New Task',footer:React.createElement(React.Fragment,null,React.createElement('button',{className:'btn btn-secondary',onClick:function(){setModalOpen(false)}},'Cancel'),React.createElement('button',{className:'btn btn-primary',onClick:handleSave},editing?'Save Changes':'Add Task'))},React.createElement('div',{className:'form-group'},React.createElement('label',{htmlFor:'tt'},'Title *'),React.createElement('input',{id:'tt',className:'input',type:'text',placeholder:'What needs to be done?',value:form.title,onChange:function(e){fc('title',e.target.value)},autoFocus:true})),React.createElement('div',{className:'form-group'},React.createElement('label',{htmlFor:'td'},'Description'),React.createElement('textarea',{id:'td',className:'textarea',placeholder:'Additional details (optional)',value:form.description,onChange:function(e){fc('description',e.target.value)},rows:3})),React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-4)'}},React.createElement('div',{className:'form-group'},React.createElement('label',{htmlFor:'tp'},'Priority'),React.createElement('select',{id:'tp',className:'select',value:form.priority,onChange:function(e){fc('priority',e.target.value)}},PRI.map(function(p){return React.createElement('option',{key:p,value:p},p.charAt(0).toUpperCase()+p.slice(1))}))),React.createElement('div',{className:'form-group'},React.createElement('label',{htmlFor:'ts'},'Subject'),React.createElement('select',{id:'ts',className:'select',value:form.subject,onChange:function(e){fc('subject',e.target.value)}},React.createElement('option',{value:''},'None'),subjects.map(function(s){return React.createElement('option',{key:s,value:s},s)})))),React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-4)'}},React.createElement('div',{className:'form-group'},React.createElement('label',{htmlFor:'tdd'},'Due Date'),React.createElement('input',{id:'tdd',className:'input',type:'date',value:form.dueDate,onChange:function(e){fc('dueDate',e.target.value)}})),React.createElement('div',{className:'form-group'},React.createElement('label',{htmlFor:'tdur'},'Duration (min)'),React.createElement('input',{id:'tdur',className:'input',type:'number',min:'0',max:'480',placeholder:'30',value:form.estimatedMinutes,onChange:function(e){fc('estimatedMinutes',e.target.value)}})))),React.createElement(ConfirmDialog,{isOpen:!!confirmDel,title:'Delete Task',message:'This task will be permanently removed.',confirmText:'Delete',danger:true,onConfirm:function(){handleDelete(confirmDel)},onCancel:function(){setConfirmDel(null)}}))}
`);

w('src/pages/Settings.jsx',`
import{useState,useMemo}from'react';
import{useTheme}from'../context/ThemeContext';
import{getSettings,saveSettings,getSubjects,addSubject,deleteSubject,KEYS}from'../utils/storage';
import ConfirmDialog from'../components/ConfirmDialog';
export default function SettingsPage(props){var themeCtx=useTheme();var setTheme=themeCtx.setTheme;var ss=useState(function(){return getSettings()});var settings=ss[0];var setS=ss[1];var ss2=useState(function(){return getSubjects()});var subjects=ss2[0];var setSub=ss2[1];var ss3=useState('');var newSub=ss3[0];var setNewSub=ss3[1];var ss4=useState(false);var confirmClear=ss4[0];var setConfirmClear=ss4[1];var curTheme=useMemo(function(){return getSettings().theme||'dark'},[settings]);
var handleTheme=function(t){setTheme(t);var u=Object.assign({},settings,{theme:t});setS(u);saveSettings(u)};
var handleSetting=function(k,v){var u=Object.assign({},settings);u[k]=v;setS(u);saveSettings(u)};
var handleAddSub=function(){var t=newSub.trim();if(!t)return;if(subjects.indexOf(t)!==-1){props.showToast('Subject already exists');return}if(addSubject(t)){setSub(getSubjects());setNewSub('');props.showToast('Subject added')}};
var handleDelSub=function(n){deleteSubject(n);setSub(getSubjects());props.showToast('Subject removed')};
var handleClear=function(){try{Object.values(KEYS).forEach(function(k){localStorage.removeItem(k)});props.showToast('All data cleared');setS(getSettings());setSub(getSubjects())}catch(e){props.showToast('Failed to clear data')}setConfirmClear(false)};
var xSvg=React.createElement('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round'},React.createElement('line',{x1:'18',y1:'6',x2:'6',y2:'18'}),React.createElement('line',{x1:'6',y1:'6',x2:'18',y2:'18'}));
return React.createElement('div',null,React.createElement('div',{className:'tasks-header'},React.createElement('h2',null,'Settings')),React.createElement('div',{className:'settings-section'},React.createElement('h3',null,'Appearance'),React.createElement('div',{className:'settings-group'},React.createElement('div',{className:'setting-row'},React.createElement('div',null,React.createElement('div',{className:'setting-label'},'Theme'),React.createElement('div',{className:'setting-desc'},'Choose your preferred color scheme')),React.createElement('div',{className:'theme-options'},['dark','light','system'].map(function(t){return React.createElement('button',{key:t,className:'theme-btn'+(curTheme===t?' active':''),onClick:function(){handleTheme(t)}},t.charAt(0).toUpperCase()+t.slice(1))}))))),React.createElement('div',{className:'settings-section'},React.createElement('h3',null,'Pomodoro'),React.createElement('div',{className:'settings-group'},React.createElement('div',{className:'setting-row'},React.createElement('div',null,React.createElement('div',{className:'setting-label'},'Work Duration (minutes)')),React.createElement('input',{className:'input',type:'number',min:'5',max:'120',style:{width:'80px',textAlign:'center'},value:settings.pomodoroWork||25,onChange:function(e){handleSetting('pomodoroWork',parseInt(e.target.value,10)||25)}})),React.createElement('div',{className:'setting-row'},React.createElement('div',null,React.createElement('div',{className:'setting-label'},'Break Duration (minutes)')),React.createElement('input',{className:'input',type:'number',min:'1',max:'60',style:{width:'80px',textAlign:'center'},value:settings.pomodoroBreak||5,onChange:function(e){handleSetting('pomodoroBreak',parseInt(e.target.value,10)||5)}})),React.createElement('div',{className:'setting-row'},React.createElement('div',null,React.createElement('div',{className:'setting-label'},'Daily Focus Goal (minutes)')),React.createElement('input',{className:'input',type:'number',min:'0',max:'720',style:{width:'80px',textAlign:'center'},value:settings.dailyFocusGoal||120,onChange:function(e){handleSetting('dailyFocusGoal',parseInt(e.target.value,10)||0)}})))),React.createElement('div',{className:'settings-section'},React.createElement('h3',null,'Subjects'),React.createElement('div',{className:'settings-group'},React.createElement('div',{className:'subjects-list'},subjects.map(function(s){return React.createElement('span',{key:s,className:'subject-tag'},s,React.createElement('button',{onClick:function(){handleDelSub(s)},'aria-label':'Remove '+s},xSvg))})),React.createElement('div',{className:'add-subject-row'},React.createElement('input',{className:'input',type:'text',placeholder:'New subject name',value:newSub,onChange:function(e){setNewSub(e.target.value)},onKeyDown:function(e){if(e.key==='Enter'){e.preventDefault();handleAddSub()}}}),React.createElement('button',{className:'btn btn-secondary',onClick:handleAddSub},'Add')))),React.createElement('div',{className:'settings-section'},React.createElement('h3',null,'Defaults'),React.createElement('div',{className:'settings-group'},React.createElement('div',{className:'setting-row'},React.createElement('div',null,React.createElement('div',{className:'setting-label'},'Default Subject')),React.createElement('select',{className:'select',style:{width:'160px'},value:settings.defaultSubject||'',onChange:function(e){handleSetting('defaultSubject',e.target.value)}},React.createElement('option',{value:''},'None'),subjects.map(function(s){return React.createElement('option',{key:s,value:s},s)}))))),React.createElement('div',{className:'settings-section'},React.createElement('div',{className:'danger-zone'},React.createElement('h3',null,'Danger Zone'),React.createElement('p',null,'Clear all application data including tasks, settings, and subjects. This cannot be undone.'),React.createElement('button',{className:'btn btn-danger',onClick:function(){setConfirmClear(true)}},'Clear All Data'))),React.createElement(ConfirmDialog,{isOpen:confirmClear,title:'Clear All Data',message:'This will permanently delete all data. This cannot be undone.',confirmText:'Clear Everything',danger:true,onConfirm:handleClear,onCancel:function(){setConfirmClear(false)}}))}
`);

w('src/main.jsx',`
import React from'react';
import ReactDOM from'react-dom/client';
import App from'./App';
import{ThemeProvider}from'./context/ThemeContext';
import{AppProvider}from'./context/AppContext';
import'./index.css';
class EB extends React.Component{constructor(p){super(p);this.state={error:null,stack:null}}static getDerivedStateFromError(e){return{error:String(e),stack:e.stack||''}}componentDidCatch(e,i){console.error('THRUST:',e,i)}render(){if(this.state.error){return React.createElement('div',{style:{padding:24,fontFamily:'monospace',fontSize:13,color:'#ef4444',background:'#0a0a0f',minHeight:'100vh',whiteSpace:'pre-wrap',wordBreak:'break-word'}},React.createElement('div',{style:{color:'#ff6b35',fontSize:18,marginBottom:16,fontWeight:'bold'}},'THRUST crashed'),React.createElement('div',{style:{color:'#e8e8ec',marginBottom:12}},this.state.error),this.state.stack&&React.createElement('div',{style:{color:'#8a8a9a',fontSize:11,lineHeight:1.6}},this.state.stack))}return this.props.children}}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(EB,null,React.createElement(ThemeProvider,null,React.createElement(AppProvider,null,React.createElement(App,null)))));
`);

w('src/App.jsx',`
import{useState,useCallback}from'react';
import{useApp}from'./context/AppContext';
import Sidebar from'./components/Sidebar';
import MobileNav from'./components/MobileNav';
import Dashboard from'./pages/Dashboard';
import Tasks from'./pages/Tasks';
import Settings from'./pages/Settings';
import'./App.css';
function ComingSoon(p){return React.createElement('div',null,React.createElement('h2',{style:{fontSize:'var(--text-xl)',fontWeight:700,marginBottom:'var(--space-4)'}},p.name),React.createElement('div',{className:'empty-state'},React.createElement('svg',{width:'48',height:'48',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'1.5',strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('circle',{cx:'12',cy:'12',r:'10'}),React.createElement('polyline',{points:'12,6 12,12 16,14'})),React.createElement('p',null,'This section is planned for a future version.')))}
export default function App(){var cs=useState('dashboard');var currentPage=cs[0];var setCurrentPage=cs[1];var app=useApp();var toasts=app.toasts;var showToast=app.showToast;var navigate=useCallback(function(p){setCurrentPage(p);window.scrollTo(0,0)},[]);var renderPage=function(){switch(currentPage){case'dashboard':return React.createElement(Dashboard,{onNavigate:navigate});case'tasks':return React.createElement(Tasks,{showToast:showToast});case'settings':return React.createElement(Settings,{showToast:showToast});case'cards':return React.createElement(ComingSoon,{name:'Quick Cards'});case'pomodoro':return React.createElement(ComingSoon,{name:'Pomodoro'});case'notes':return React.createElement(ComingSoon,{name:'Notes'});case'projects':return React.createElement(ComingSoon,{name:'Projects'});case'statistics':return React.createElement(ComingSoon,{name:'Statistics'});default:return React.createElement(Dashboard,{onNavigate:navigate})}};return React.createElement('div',{className:'app'},React.createElement(Sidebar,{currentPage:currentPage,onNavigate:navigate}),React.createElement('header',{className:'mobile-header'},React.createElement('h1',null,'THRUST')),React.createElement('main',{className:'main-content'},renderPage()),React.createElement(MobileNav,{currentPage:currentPage,onNavigate:navigate}),React.createElement('div',{className:'toast-container','aria-live':'polite'},toasts.map(function(t){return React.createElement('div',{key:t.id,className:'toast'+(t.exiting?' toast-exit':'')},t.message)})))}
`);

console.log('\\n=== ALL FILES CREATED ===');
console.log('Run: npm run dev');
console.log('Then open http://localhost:5173');
