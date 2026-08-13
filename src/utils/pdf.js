/*
  Lightweight local PDF text extraction for THRUST.
  It intentionally avoids a large PDF framework. It handles common
  text-based PDFs with plain or Flate-compressed content streams.
  Scanned/image-only PDFs are reported as unsupported.
*/

function latin1(bytes){
  return new TextDecoder('latin1').decode(bytes);
}

async function inflate(bytes){
  if(typeof DecompressionStream==='undefined') throw new Error('PDF compression is not supported on this device');
  var ds=new DecompressionStream('deflate');
  var stream=new Blob([bytes]).stream().pipeThrough(ds);
  var buf=await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

function unescapePdfString(s){
  return s
    .replace(/\\([\\()])/g,'$1')
    .replace(/\\n/g,'\n')
    .replace(/\\r/g,'\r')
    .replace(/\\t/g,'\t')
    .replace(/\\b/g,'\b')
    .replace(/\\f/g,'\f')
    .replace(/\\([0-7]{1,3})/g,function(_,o){return String.fromCharCode(parseInt(o,8))});
}

function decodeHex(s){
  var clean=s.replace(/\s/g,'');
  if(clean.length%2) clean+='0';
  var out='';
  for(var i=0;i<clean.length;i+=2) out+=String.fromCharCode(parseInt(clean.slice(i,i+2),16));
  return out;
}

function stringsFromStream(text){
  var out=[];
  var m;
  var re=/\(((?:\\.|[^\\)])*)\)\s*Tj/g;
  while((m=re.exec(text))) out.push(unescapePdfString(m[1]));

  var hr=/<([0-9A-Fa-f\s]+)>\s*Tj/g;
  while((m=hr.exec(text))) out.push(decodeHex(m[1]));

  var ar=/\[((?:\\.|[^\]])*)\]\s*TJ/g;
  while((m=ar.exec(text))){
    var inside=m[1], sm, parts=[];
    var sr=/\(((?:\\.|[^\\)])*)\)|<([0-9A-Fa-f\s]+)>/g;
    while((sm=sr.exec(inside))) parts.push(sm[1]!==undefined?unescapePdfString(sm[1]):decodeHex(sm[2]));
    out.push(parts.join(''));
  }
  return out;
}

function cleanText(text){
  return text
    .replace(/[^\S\r\n]+/g,' ')
    .replace(/\r/g,'\n')
    .split('\n')
    .map(function(x){return x.trim()})
    .filter(Boolean)
    .join('\n');
}

function dedupeLines(text){
  var lines=text.split('\n'), seen=new Map(), result=[];
  lines.forEach(function(line){
    var key=line.toLowerCase().replace(/\s+/g,' ').trim();
    if(!key || key.length<2) return;
    var n=seen.get(key)||0;
    if(n<3){ result.push(line); seen.set(key,n+1); }
  });
  return result.join('\n');
}

export async function extractPdfText(file){
  var max=30*1024*1024;
  if(file.size>max) throw new Error('PDF is larger than 30 MB. Please use a smaller file.');
  var bytes=new Uint8Array(await file.arrayBuffer());
  var raw=latin1(bytes);
  if(raw.slice(0,5)!=='%PDF-') throw new Error('That file is not a valid PDF.');

  var pageCount=(raw.match(/\/Type\s*\/Page\b/g)||[]).length;
  var chunks=[];
  var pos=0, foundCompressed=false;

  while(true){
    var start=raw.indexOf('stream',pos);
    if(start<0) break;
    var dataStart=start+6;
    if(raw[dataStart]==='\r'&&raw[dataStart+1]==='\n') dataStart+=2;
    else if(raw[dataStart]==='\n'||raw[dataStart]==='\r') dataStart+=1;
    var end=raw.indexOf('endstream',dataStart);
    if(end<0) break;

    var dict=raw.slice(Math.max(0,start-1200),start);
    var chunk=bytes.slice(dataStart,end);
    try{
      if(/\/FlateDecode\b/.test(dict)){
        chunk=await inflate(chunk);
        foundCompressed=true;
      }
      var text=latin1(chunk);
      var strings=stringsFromStream(text);
      if(strings.length) chunks.push(strings.join('\n'));
    }catch(_){
      // Some streams are images/fonts or use unsupported filters. Ignore them.
    }
    pos=end+9;
  }

  var text=dedupeLines(cleanText(chunks.join('\n')));
  if(!text || text.length<40){
    throw new Error('This PDF appears to be scanned or image-based. Text extraction is not available for this PDF yet.');
  }

  return {text:text,pageCount:pageCount||null,compressed:foundCompressed};
}

function scoreSection(title, body){
  var t=(title+' '+body).toLowerCase();
  var score=0;
  var high=['important','key','definition','theorem','law','principle','formula','equation','property','properties','method','algorithm','rule','concept','summary','conclusion','resonance','transform'];
  high.forEach(function(k){if(t.indexOf(k)>=0) score+=2});
  var symbols=(body.match(/[=∫∑√±≤≥→↔]/g)||[]).length;
  score+=Math.min(8,symbols);
  if(/^[A-Z0-9][A-Z0-9\s:–—-]{4,}$/.test(title.trim())) score+=4;
  if(title.length>=4&&title.length<=90) score+=2;
  if(body.length>=80&&body.length<=1800) score+=2;
  return score;
}

function makeBullets(body){
  var parts=body
    .replace(/\n+/g,' ')
    .split(/(?<=[.!?])\s+|(?<=;)\s+/)
    .map(function(x){return x.trim()})
    .filter(function(x){return x.length>=18});
  var unique=[], seen={};
  parts.forEach(function(x){
    var k=x.toLowerCase();
    if(!seen[k]&&unique.length<4){seen[k]=1;unique.push(x)}
  });
  if(!unique.length) unique=body.split(/\n/).filter(Boolean).slice(0,4);
  return unique.map(function(x){return x.length>180?x.slice(0,177)+'…':x});
}

export function generateImportantSlides(text, density){
  var lines=text.split('\n').map(function(x){return x.trim()}).filter(Boolean);
  var headings=[];
  lines.forEach(function(line,i){
    var short=line.length<=90;
    var upper=/^[A-Z0-9][A-Z0-9\s:–—()\-&/]{4,}$/.test(line);
    var numbered=/^\d+(\.\d+)*[\s.)-]+[A-Za-z]/.test(line);
    var keyword=/(theorem|definition|law|principle|formula|property|properties|algorithm|method|concept|introduction|summary|resonance|transform|circuit|network)/i.test(line);
    var sentencePunct=/[.!?]$/.test(line);
    if(i<lines.length-1 && short && (upper||numbered||keyword) && !sentencePunct) headings.push(i);
  });

  var sections=[];
  if(headings.length){
    headings.forEach(function(idx,n){
      var end=n+1<headings.length?headings[n+1]:lines.length;
      var title=lines[idx];
      var body=lines.slice(idx+1,end).join(' ');
      if(body.length>40) sections.push({title:title,body:body});
    });
  }
  if(!sections.length){
    var chunk=70;
    for(var i=0;i<lines.length;i+=chunk){
      var b=lines.slice(i,i+chunk).join(' ');
      if(b.length>60) sections.push({title:'Key concepts '+(sections.length+1),body:b});
    }
  }

  sections.forEach(function(s,i){s.score=scoreSection(s.title,s.body)-i*0.01});
  sections.sort(function(a,b){return b.score-a.score});

  var target=density==='quick'?8:density==='deep'?20:12;
  target=Math.min(target,sections.length);
  var selected=sections.slice(0,target);
  selected.sort(function(a,b){return sections.indexOf(a)-sections.indexOf(b)});

  return selected.map(function(s,i){
    var bullets=makeBullets(s.body);
    var formulaLines=bullets.filter(function(x){return /[=∫∑√±≤≥→]/.test(x)});
    return {
      id:'slide-'+Date.now()+'-'+i,
      title:s.title.replace(/\s+/g,' ').trim(),
      summary:bullets[0]||s.body.slice(0,220),
      keyPoints:bullets.slice(0,4),
      formulas:formulaLines.slice(0,2),
      importance:Math.max(3,Math.min(5,Math.round(s.score/4))),
      sourcePages:[]
    };
  });
}
