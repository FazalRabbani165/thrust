import{useState,useEffect,useMemo,useCallback}from'react';
import{h}from'../h';
import{savePdfDocument,getPdfDocuments,deletePdfDocument}from'../utils/pdfStore';
import{saveGeneratedCards,saveGeneratedNotes,getStudyData}from'../utils/studyMaterial';
import*as pdfjsLib from'pdfjs-dist';
import{createWorker}from'tesseract.js';
import pdfWorkerUrl from'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc=pdfWorkerUrl;

function cleanText(text){return(text||'').replace(/\r/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').replace(/[ \t]{2,}/g,' ').trim()}
function looksLikeText(text){var t=cleanText(text);if(t.length<40)return false;var letters=(t.match(/[A-Za-zÀ-ÿ]/g)||[]).length;return letters/Math.max(t.length,1)>0.25}
function basicStats(pages){var text=pages.map(p=>p.text||'').join('\n');var words=(text.match(/\S+/g)||[]).length;var chars=text.length;var lines=text?text.split('\n').filter(Boolean).length:0;var avg=words?Math.round(chars/words):0;return{words,chars,lines,avg}}

export default function PDFLibraryPage(props){
 var ds=useState([]),docs=ds[0],setDocs=ds[1];var ss=useState(''),search=ss[0],setSearch=ss[1];var sel=useState(null),selected=sel[0],setSelected=sel[1];var ps=useState({active:false,page:0,total:0,stage:'',ocrPages:0}),progress=ps[0],setProgress=ps[1];var es=useState('eng'),lang=es[0],setLang=es[1];var er=useState(''),error=er[0],setError=er[1];var pk=useState(null),studyPack=pk[0],setStudyPack=pk[1];var tab=useState('overview'),activeTab=tab[0],setActiveTab=tab[1];var gen=useState(false),generating=gen[0],setGenerating=gen[1];
 var refresh=useCallback(async()=>{try{setDocs(await getPdfDocuments())}catch(e){setError('Could not open the local PDF library. '+e.message)}},[]);useEffect(()=>{refresh()},[refresh]);
 var filtered=useMemo(()=>{var q=search.trim().toLowerCase();return docs.filter(d=>!q||(d.name||'').toLowerCase().includes(q)||(d.pages||[]).some(p=>(p.text||'').toLowerCase().includes(q)))},[docs,search]);
 async function processFile(file){
   if(!file||file.type!=='application/pdf'){setError('Please choose a PDF file.');return}
   setError('');setSelected(null);setStudyPack(null);setProgress({active:true,page:0,total:0,stage:'Opening PDF…',ocrPages:0});
   try{
    var data=new Uint8Array(await file.arrayBuffer());var pdf=await pdfjsLib.getDocument({data}).promise;var pages=[];var ocrPages=0;var worker=null;
    for(var i=1;i<=pdf.numPages;i++){
      setProgress({active:true,page:i,total:pdf.numPages,stage:'Reading page '+i+' of '+pdf.numPages,ocrPages});
      var page=await pdf.getPage(i);var content=await page.getTextContent();var direct=cleanText(content.items.map(x=>x.str||'').join(' '));
      if(looksLikeText(direct)){pages.push({page:i,text:direct,source:'text'});continue}
      setProgress({active:true,page:i,total:pdf.numPages,stage:'OCR page '+i+' of '+pdf.numPages,ocrPages});
      var viewport=page.getViewport({scale:1.8});var canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);var ctx=canvas.getContext('2d',{willReadFrequently:true});
      await page.render({canvasContext:ctx,viewport}).promise;
      if(!worker)worker=await createWorker(lang,1,{logger:m=>{if(m.status)setProgress(p=>Object.assign({},p,{stage:'OCR page '+i+': '+m.status,ocrPages}))}});
      var result=await worker.recognize(canvas);var text=cleanText(result.data.text);ocrPages++;pages.push({page:i,text,source:'ocr',confidence:Math.round(result.data.confidence||0)});canvas.width=1;canvas.height=1;
    }
    if(worker)await worker.terminate();var stats=basicStats(pages);var doc={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),name:file.name,size:file.size,createdAt:new Date().toISOString(),pageCount:pdf.numPages,ocrPages,language:lang,pages,stats};await savePdfDocument(doc);setProgress({active:false,page:pdf.numPages,total:pdf.numPages,stage:'Done',ocrPages});await refresh();setSelected(doc);props.showToast('PDF processed — '+ocrPages+' page'+(ocrPages===1?'':'s')+' OCR processed');
   }catch(e){setProgress({active:false,page:0,total:0,stage:'',ocrPages:0});setError('PDF processing failed: '+(e&&e.message?e.message:String(e)))}
 }
 function onFile(e){var f=e.target.files&&e.target.files[0];if(f)processFile(f);e.target.value=''}
 async function remove(id){await deletePdfDocument(id);if(selected&&selected.id===id)setSelected(null);setStudyPack(null);await refresh();props.showToast('PDF removed')}
 async function makeStudyPack(){
   if(!selected)return;setGenerating(true);setError('');try{var pack=getStudyData(selected);setStudyPack(pack);setActiveTab('cards');props.showToast('Study material generated');}catch(e){setError('Could not generate study material: '+e.message)}finally{setGenerating(false)}
 }
 function saveCards(){if(!studyPack||!studyPack.cards.length)return;var n=saveGeneratedCards(studyPack.cards);props.showToast(n+' flashcards added to Cards');}
 function saveNotes(){if(!studyPack)return;saveGeneratedNotes(selected,studyPack);props.showToast('Summary saved to Notes')}
 function chart(){
   if(!studyPack||!studyPack.table.length)return h('div',{className:'empty-state'},h('h3',null,'No numeric table detected'),h('p',null,'A chart needs rows containing labels and numeric values.'));
   var max=Math.max.apply(null,studyPack.table.map(x=>x.value).concat([1]));
   return h('div',{className:'study-chart'},studyPack.table.map((x,i)=>h('div',{className:'study-chart-row',key:i},h('div',{className:'study-chart-label'},x.label),h('div',{className:'study-chart-track'},h('div',{className:'study-chart-bar',style:{width:Math.max(2,Math.round(x.value/max*100))+'%'}})),h('div',{className:'study-chart-value'},String(x.value)))));
 }
 var selectedStats=selected?selected.stats:null;
 return h('div',null,
  h('div',{className:'tasks-header'},h('div',null,h('h2',null,'PDF Library'),h('p',{className:'text-secondary',style:{marginTop:'4px'}},'Text PDFs + scanned/image PDFs with automatic OCR')),h('label',{className:'btn btn-primary',style:{cursor:'pointer'}},'Import PDF',h('input',{type:'file',accept:'application/pdf,.pdf',onChange:onFile,style:{display:'none'}}))),
  error&&h('div',{className:'pdf-error'},error),
  progress.active&&h('div',{className:'pdf-progress'},h('div',{className:'pdf-progress-top'},h('strong',null,progress.stage),h('span',null,progress.page+'/'+progress.total)),h('div',{className:'progress-bar'},h('div',{className:'progress-fill',style:{width:(progress.total?Math.round(progress.page/progress.total*100):0)+'%'}})),h('div',{className:'pdf-progress-meta'},'OCR pages: '+progress.ocrPages+' · '+lang.toUpperCase())),
  h('div',{className:'pdf-toolbar'},h('div',{className:'search-bar',style:{flex:1}},h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'},h('circle',{cx:'11',cy:'11',r:'8'}),h('line',{x1:'21',y1:'21',x2:'16.65',y2:'16.65'})),h('input',{placeholder:'Search PDFs and OCR text…',value:search,onChange:e=>setSearch(e.target.value)})),h('select',{className:'select',value:lang,onChange:e=>setLang(e.target.value),title:'OCR language'},h('option',{value:'eng'},'OCR: English'),h('option',{value:'eng+hin'},'OCR: English + Hindi'))),
  selected&&h('div',{className:'pdf-detail'},
    h('div',{className:'pdf-detail-header'},h('div',null,h('h3',null,selected.name),h('p',{className:'text-secondary'},selected.pageCount+' pages · '+selected.ocrPages+' OCR · '+new Date(selected.createdAt).toLocaleString())),h('div',{style:{display:'flex',gap:'8px'}},h('button',{className:'btn btn-primary',onClick:makeStudyPack,disabled:generating},generating?'Generating…':'Generate Study Pack'),h('button',{className:'btn btn-secondary',onClick:()=>{setSelected(null);setStudyPack(null)}},'Close'))),
    h('div',{className:'stats-overview'},[{v:selectedStats.words,l:'Words'},{v:selected.pageCount,l:'Pages'},{v:selected.ocrPages,l:'OCR Pages'},{v:selectedStats.avg,l:'Chars / Word'}].map((s,i)=>h('div',{className:'stat-block',key:i},h('div',{className:'sb-value'},s.v),h('div',{className:'sb-label'},s.l)))),
    studyPack&&h('div',{className:'study-pack'},h('div',{className:'filter-chips'},['overview','cards','formulas','chart'].map(function(x){return h('button',{key:x,className:'filter-chip'+(activeTab===x?' active':''),onClick:function(){setActiveTab(x)}},x==='overview'?'Summary':x==='cards'?'Flashcards':x==='formulas'?'Formulas':'Graph')})),
      activeTab==='overview'&&h('div',{className:'study-panel'},h('h3',null,'Study Summary'),h('pre',{className:'pdf-page-text'},studyPack.summary||'No summary generated.'),h('div',{style:{display:'flex',gap:'8px',marginTop:'12px'}},h('button',{className:'btn btn-secondary',onClick:saveNotes},'Save Summary to Notes'))),
      activeTab==='cards'&&h('div',{className:'study-panel'},h('div',{className:'pdf-detail-header'},h('div',null,h('h3',null,'Generated Flashcards'),h('p',{className:'text-secondary'},studyPack.cards.length+' cards · source pages are preserved')),h('button',{className:'btn btn-primary',onClick:saveCards},'Add All to Cards')),studyPack.cards.map(function(c,i){return h('article',{className:'task-item',key:i},h('div',{className:'task-content'},h('div',{className:'task-title'},c.title),h('div',{className:'task-meta'},h('span',{className:'meta-item'},c.sourcePages&&c.sourcePages.length?'Page '+c.sourcePages.join(', '):'Source page unavailable'),c.formula&&h('span',{className:'badge badge-medium'},'Formula')),h('div',{style:{marginTop:'8px',fontWeight:600},className:'text-secondary'},c.question),h('div',{style:{marginTop:'5px'}},c.answer))) })),
      activeTab==='formulas'&&h('div',{className:'study-panel'},h('div',{className:'pdf-detail-header'},h('div',null,h('h3',null,'Formula Sheet'),h('p',{className:'text-secondary'},studyPack.formulas.length+' formulas detected')),h('button',{className:'btn btn-secondary',onClick:saveNotes},'Save to Notes')),studyPack.formulas.length?studyPack.formulas.map(function(f,i){return h('div',{className:'formula-card',key:i},h('div',{className:'formula-number'},'#'+(i+1)),h('code',null,f))}):h('div',{className:'empty-state'},h('p',null,'No formulas detected.'))),
      activeTab==='chart'&&h('div',{className:'study-panel'},h('h3',null,'Detected Numeric Data'),h('p',{className:'text-secondary'},'A simple graph is generated from numeric table-like rows found in the PDF.'),chart())),
    !studyPack&&h('div',{className:'study-callout'},h('strong',null,'Turn this PDF into study material'),h('p',null,'Generate flashcards, a summary, formulas and a graph when numeric table data is detected. Everything stays local to Thrust.')),
    h('div',{className:'pdf-page-list'},selected.pages.map(p=>h('article',{className:'pdf-page',key:p.page},h('div',{className:'pdf-page-title'},h('strong',null,'Page '+p.page),h('span',{className:'pdf-source '+p.source},p.source.toUpperCase()+(p.confidence!=null?' · '+p.confidence+'%':''))),h('pre',{className:'pdf-page-text'},p.text||'[No text recognized on this page]'))))
  ),
  filtered.length===0&&!selected&&h('div',{className:'empty-state'},h('div',{className:'empty-icon'},'▧'),h('h3',null,docs.length?'No matching PDFs':'Your PDF library is empty'),h('p',null,docs.length?'Try another search.':'Import a PDF. Thrust automatically uses OCR when a page has no usable text layer.')),
  !selected&&filtered.length>0&&h('div',{className:'pdf-grid'},filtered.map(d=>{var st=d.stats||basicStats(d.pages||[]);return h('article',{className:'pdf-card',key:d.id,onClick:()=>setSelected(d)},h('div',{className:'pdf-card-icon'},'PDF'),h('div',{className:'pdf-card-body'},h('h3',{className:'truncate'},d.name),h('p',{className:'text-secondary'},d.pageCount+' pages · '+st.words+' words'),h('div',{className:'pdf-card-meta'},h('span',null,d.ocrPages+' OCR pages'),h('button',{className:'btn btn-ghost btn-sm',onClick:e=>{e.stopPropagation();remove(d.id)}},'Delete'))))}))
 )
}
