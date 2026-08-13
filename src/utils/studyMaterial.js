import{addCard,addNote,getSettings}from'./storage';

function clean(s){return(s||'').replace(/\s+/g,' ').trim()}
function sentences(text){return clean(text).split(/(?<=[.!?])\s+/).filter(s=>s.length>=45&&s.length<=420)}
function pageText(doc){return(doc.pages||[]).map(p=>'[Page '+p.page+'] '+(p.text||'')).join('\n')}
function titleFromSentence(s){return clean(s.replace(/^(the|a|an|what|why|how)\s+/i,'')).slice(0,70)}
function formulaRegex(){return[
 /(?:[A-Za-z][A-Za-z0-9_]*(?:\s*[\+\-\*\/=^]\s*)+[-+*/=^A-Za-z0-9_()²³√.]+)/g,
 /[A-Za-z]\s*=\s*[^.;,\n]{2,100}/g,
 /[A-Za-z]{1,4}\s*\([^)]{1,40}\)\s*=\s*[^.;,\n]{2,100}/g
]}
function extractFormulas(text){
 var found=[], seen={};formulaRegex().forEach(function(rx){var m;while((m=rx.exec(text))){var f=clean(m[0]);f=f.replace(/\s{2,}/g,' ');if(f.length>=3&&f.length<=120&&!seen[f.toLowerCase()]){seen[f.toLowerCase()]=1;found.push(f)}}});
 return found.slice(0,80)
}
function extractHeadings(text){
 return text.split(/\n+/).map(clean).filter(function(s){return s.length>=4&&s.length<=90&&!/[.!?]$/.test(s)&&(/[A-Z][A-Za-z ]{3,}/.test(s)||/^\d+(\.\d+)*\s/.test(s))}).slice(0,30)
}
function extractTableData(text){
 var rows=text.split(/\n+/).map(function(l){return l.trim()}).filter(Boolean),out=[];
 rows.forEach(function(row){var cells=row.split(/\s{2,}|\t|\|/).map(clean).filter(Boolean);if(cells.length>=2){var nums=cells.map(function(c){var n=Number(c.replace(/,/g,''));return isFinite(n)?n:null});if(nums.filter(function(n){return n!==null}).length>=1)out.push({label:cells[0].slice(0,40),value:nums[nums.length-1]!==null?nums[nums.length-1]:nums.find(function(n){return n!==null})})}});
 return out.filter(function(x){return x.value!==null}).slice(0,20)
}
export function buildStudyPack(doc){
 var text=pageText(doc), ss=sentences(text), formulas=extractFormulas(text), headings=extractHeadings(text), table=extractTableData(text), cards=[], used={};
 headings.slice(0,12).forEach(function(h){var key=h.toLowerCase();if(used[key])return;var related=ss.find(function(s){return s.toLowerCase().includes(h.toLowerCase().replace(/^\d+(\.\d+)*\s*/,''))});if(related){cards.push({title:h,question:'What is '+h+'?',answer:related,formula:'',keyPoints:related,subject:(getSettings().defaultSubject||'General'),tags:'pdf,auto-generated',difficulty:'medium',sourcePdf:doc.name,sourcePages:findPages(doc,related)});used[key]=1}});
 ss.slice(0,25).forEach(function(s,i){if(cards.length>=30)return;var words=s.split(/\s+/);if(words.length<9)return;var subject=getSettings().defaultSubject||'General';var question='Explain: '+titleFromSentence(s);var key=s.toLowerCase();if(used[key])return;cards.push({title:'PDF Q'+(cards.length+1),question,answer:s,formula:'',keyPoints:s,subject,tags:'pdf,auto-generated',difficulty:i%5===0?'hard':'medium',sourcePdf:doc.name,sourcePages:findPages(doc,s)});used[key]=1});
 formulas.forEach(function(f){if(cards.length>=36)return;cards.push({title:'Formula',question:'What does this formula represent and what do its terms mean?',answer:'Extracted formula: '+f,formula:f,keyPoints:f,subject:getSettings().defaultSubject||'General',tags:'pdf,formula,auto-generated',difficulty:'medium',sourcePdf:doc.name,sourcePages:findPages(doc,f)})});
 return{cards,formulas,table,headings:headings.slice(0,20),summary:makeSummary(ss,headings),source:doc.name}
}
function findPages(doc,needle){var n=String(needle||'').slice(0,120).toLowerCase();return(doc.pages||[]).filter(function(p){return(p.text||'').toLowerCase().includes(n)}).map(function(p){return p.page}).slice(0,5)}
function makeSummary(ss,heads){
 var lead=heads.slice(0,8).join(' • ');var key=ss.slice(0,6).map(function(s){return'• '+s}).join('\n');return (lead?'Topics: '+lead+'\n\n':'')+'Key points:\n'+key
}
export function saveGeneratedCards(cards){
 var added=0;cards.forEach(function(c){addCard(c);added++});return added
}
export function saveGeneratedNotes(doc,pack){
 var note=addNote({title:'Study notes — '+doc.name,content:pack.summary,tags:'pdf,auto-generated',sourcePdf:doc.name});return note
}
export function getStudyData(doc){return buildStudyPack(doc)}
