import{useState}from'react';import{h}from'../h';import{extractPdfText,generateImportantSlides}from'../utils/pdf';

function Stars({n}){return h('span',{className:'pdf-stars','aria-label':n+' out of 5'},'★★★★★'.slice(0,n)+'☆☆☆☆☆'.slice(0,5-n))}
function SlideViewer(props){
  var slides=props.slides, s=slides[props.index];
  return h('div',{className:'pdf-slide-viewer'},
    h('div',{className:'pdf-slide-top'},
      h('button',{className:'btn btn-ghost btn-sm',onClick:props.onBack},'← Slides'),
      h('span',{className:'mono'},(props.index+1)+' / '+slides.length)
    ),
    h('div',{className:'pdf-slide-progress'},h('div',{style:{width:((props.index+1)/slides.length*100)+'%'}})),
    h('article',{className:'pdf-slide-card'},
      h('div',{className:'pdf-slide-kicker'},'IMPORTANT CONCEPT'),
      h('h2',null,s.title),
      h('p',{className:'pdf-slide-summary'},s.summary),
      s.keyPoints&&s.keyPoints.length>1&&h('div',{className:'pdf-slide-section'},h('div',{className:'pdf-slide-label'},'KEY POINTS'),h('ul',null,s.keyPoints.map(function(x,i){return h('li',{key:i},x)}))),
      s.formulas&&s.formulas.length>0&&h('div',{className:'pdf-formula-box'},h('div',{className:'pdf-slide-label'},'FORMULAS'),s.formulas.map(function(x,i){return h('div',{key:i,className:'mono'},x)})),
      h('div',{className:'pdf-slide-importance'},h('span',null,'EXAM VALUE'),h(Stars,{n:s.importance}))
    ),
    h('div',{className:'pdf-slide-actions'},
      h('button',{className:'btn btn-secondary',disabled:props.index===0,onClick:function(){props.onChange(props.index-1)}},'← Previous'),
      h('button',{className:'btn btn-primary',disabled:props.index===slides.length-1,onClick:function(){props.onChange(props.index+1)}},'Next →')
    )
  );
}

export default function PdfLab(props){
  var fs=useState(null),file=fs[0],setFile=fs[1];
  var ts=useState(null),text=ts[0],setText=ts[1];
  var ps=useState(null),pdfInfo=ps[0],setPdfInfo=ps[1];
  var ss=useState([]),slides=ss[0],setSlides=ss[1];
  var ds=useState('standard'),density=ds[0],setDensity=ds[1];
  var ls=useState(false),loading=ls[0],setLoading=ls[1];
  var es=useState(''),error=es[0],setError=es[1];
  var is=useState(0),index=is[0],setIndex=is[1];

  var choose=function(e){
    var f=e.target.files&&e.target.files[0];
    if(!f)return;
    setError('');setSlides([]);setText(null);setIndex(0);
    if(f.type!=='application/pdf'&&!/\.pdf$/i.test(f.name)){setError('Please choose a PDF file.');return}
    setFile(f);
  };

  var readPdf=async function(){
    if(!file)return;
    setLoading(true);setError('');
    try{
      var result=await extractPdfText(file);
      setText(result.text);setPdfInfo({pages:result.pageCount||'—',size:(file.size/1048576).toFixed(1)+' MB'});
    }catch(e){setError(e&&e.message?e.message:'Could not read this PDF.')}
    finally{setLoading(false)}
  };

  var generate=function(){
    if(!text)return;
    setLoading(true);setError('');
    try{
      var generated=generateImportantSlides(text,density);
      if(!generated.length)throw new Error('Not enough structured text was found to build useful slides.');
      setSlides(generated);setIndex(0);
    }catch(e){setError(e.message||'Could not generate slides.')}
    finally{setLoading(false)}
  };

  if(slides.length)return h(SlideViewer,{slides:slides,index:index,onChange:setIndex,onBack:function(){setSlides([])}});

  return h('div',{className:'pdf-lab'},
    h('div',{className:'page-header'},
      h('div',null,h('div',{className:'eyebrow'},'STUDY TOOL'),h('h2',null,'PDF Lab'),h('p',{className:'page-subtitle'},'Turn a long PDF into high-value revision slides.'))
    ),
    h('div',{className:'pdf-hero'},
      h('div',{className:'pdf-hero-icon'},'PDF'),
      h('div',null,h('h3',null,'Important Slides'),h('p',null,'Find the concepts, definitions, laws and formulas worth revising — without turning every PDF page into a slide.'))
    ),
    h('label',{className:'pdf-dropzone'},
      h('input',{type:'file',accept:'application/pdf,.pdf',onChange:choose,style:{display:'none'}}),
      h('div',{className:'pdf-upload-symbol'},'＋'),
      h('strong',null,file?file.name:'Import a PDF'),
      h('span',null,file?'Tap to choose a different file':'Choose a PDF from your phone')
    ),
    file&&h('div',{className:'pdf-file-meta'},
      h('div',null,h('strong',null,file.name),h('span',null,(file.size/1048576).toFixed(1)+' MB')),
      !text&&h('button',{className:'btn btn-primary',disabled:loading,onClick:readPdf},loading?'Reading…':'Read PDF')
    ),
    text&&h('div',{className:'pdf-generator-card'},
      h('div',{className:'pdf-generator-title'},'Slide density'),
      h('div',{className:'pdf-density'},
        ['quick','standard','deep'].map(function(x){return h('button',{key:x,className:'pdf-density-btn'+(density===x?' active':''),onClick:function(){setDensity(x)}},x==='quick'?'Quick · ~8':x==='deep'?'Deep · ~20':'Standard · ~12')})
      ),
      h('button',{className:'btn btn-primary btn-lg pdf-generate',disabled:loading,onClick:generate},loading?'Building slides…':'Generate Important Slides'),
      h('div',{className:'pdf-coming'},h('span',null,'Coming next'),h('button',{className:'btn btn-ghost btn-sm',disabled:true},'Generate Quick Cards'),h('button',{className:'btn btn-ghost btn-sm',disabled:true},'Formula Sheet'))
    ),
    error&&h('div',{className:'pdf-error'},error),
    pdfInfo&&h('div',{className:'pdf-extract-note'},'Text extracted locally · '+pdfInfo.pages+' pages · '+pdfInfo.size)
  );
}
