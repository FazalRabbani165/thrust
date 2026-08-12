
var KEYS={TASKS:'thrust_tasks',CARDS:'thrust_cards',NOTES:'thrust_notes',PROJECTS:'thrust_projects',POMODORO:'thrust_pomodoro',REVIEWS:'thrust_reviews',SETTINGS:'thrust_settings',SUBJECTS:'thrust_subjects'};
var DSUB=['ECE','Digital Logic','Electronics','Networks','Signals','Communication','Programming','React','Python','C/C++','Linux','Cybersecurity','Data Science','Mathematics','Projects'];
var DSET={theme:'dark',pomodoroWork:25,pomodoroBreak:5,dailyFocusGoal:120,defaultSubject:'ECE'};
export function generateId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function read(k,fb){try{var r=localStorage.getItem(k);if(r===null||r===undefined)return fb;var p=JSON.parse(r);if(!Array.isArray(p)&&typeof p!=='object')return fb;return p}catch(e){return fb}}
function write(k,d){try{localStorage.setItem(k,JSON.stringify(d));return true}catch(e){return false}}
export function getData(k){var m={};m[KEYS.TASKS]=[];m[KEYS.CARDS]=[];m[KEYS.NOTES]=[];m[KEYS.PROJECTS]=[];m[KEYS.POMODORO]=[];m[KEYS.REVIEWS]=[];return read(k,m[k]||[])}
export function saveData(k,d){return write(k,d)}
export function addItem(k,item){var d=getData(k);var n=Object.assign({},item,{id:generateId(),createdAt:new Date().toISOString()});d.unshift(n);saveData(k,d);return n}
export function updateItem(k,id,updates){var d=getData(k);var i=d.findIndex(function(x){return x.id===id});if(i===-1)return null;d[i]=Object.assign({},d[i],updates,{updatedAt:new Date().toISOString()});saveData(k,d);return d[i]}
export function deleteItem(k,id){var d=getData(k);var f=d.filter(function(x){return x.id!==id});if(f.length===d.length)return false;saveData(k,f);return true}
export function getTasks(){return getData(KEYS.TASKS)}export function addTask(t){return addItem(KEYS.TASKS,t)}export function updateTask(id,u){return updateItem(KEYS.TASKS,id,u)}export function deleteTask(id){return deleteItem(KEYS.TASKS,id)}
export function getCards(){return getData(KEYS.CARDS)}export function addCard(c){return addItem(KEYS.CARDS,c)}export function updateCard(id,u){return updateItem(KEYS.CARDS,id,u)}export function deleteCard(id){return deleteItem(KEYS.CARDS,id)}
export function getNotes(){return getData(KEYS.NOTES)}export function addNote(n){return addItem(KEYS.NOTES,n)}export function updateNote(id,u){return updateItem(KEYS.NOTES,id,u)}export function deleteNote(id){return deleteItem(KEYS.NOTES,id)}
export function getProjects(){return getData(KEYS.PROJECTS)}export function addProject(pr){return addItem(KEYS.PROJECTS,pr)}export function updateProject(id,u){return updateItem(KEYS.PROJECTS,id,u)}export function deleteProject(id){return deleteItem(KEYS.PROJECTS,id)}
export function getSessions(){return getData(KEYS.POMODORO)}export function addSession(s){return addItem(KEYS.POMODORO,s)}
export function getReviews(){return getData(KEYS.REVIEWS)}export function addReview(r){return addItem(KEYS.REVIEWS,r)}
export function getSubjects(){return read(KEYS.SUBJECTS,DSUB)}export function saveSubjects(s){return write(KEYS.SUBJECTS,s)}
export function addSubject(n){var s=getSubjects();var t=n.trim();if(!t||s.indexOf(t)!==-1)return false;s.push(t);saveSubjects(s);return true}
export function deleteSubject(n){var s=getSubjects();var f=s.filter(function(x){return x!==n});if(f.length===s.length)return false;saveSubjects(f);return true}
export function getSettings(){return read(KEYS.SETTINGS,DSET)}export function saveSettings(s){return write(KEYS.SETTINGS,s)}
export function getTodayStr(){return new Date().toISOString().split('T')[0]}
export function isToday(d){if(!d)return false;return d.split('T')[0]===getTodayStr()}
export function isPast(d){if(!d)return false;var dt=new Date(d);var t=new Date();t.setHours(0,0,0,0);return dt<t}
export function formatDate(d){if(!d)return '';return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
export function formatDuration(m){if(!m||m<=0)return '0m';var h=Math.floor(m/60);var r=m%60;if(h===0)return r+'m';if(r===0)return h+'h';return h+'h '+r+'m'}
export function rateCard(card,rating){var iv={hard:1,good:3,easy:7};var base=iv[rating]||3;var mult=Math.min(card.reviewCount||0,5);var days=rating==='hard'?1:base*(mult+1);if(days>180)days=180;var nx=new Date();nx.setDate(nx.getDate()+days);var st='learning';if((card.reviewCount||0)>=4&&rating==='easy')st='mastered';return updateItem(KEYS.CARDS,card.id,{lastReviewed:new Date().toISOString(),nextReview:nx.toISOString(),reviewCount:(card.reviewCount||0)+1,lastRating:rating,status:st,interval:days})}
export function getDueCards(){var cards=getCards();var now=new Date();return cards.filter(function(c){if(!c.nextReview||c.status==='new')return true;return new Date(c.nextReview)<=now})}
export function exportAllData(){var data={};Object.keys(KEYS).forEach(function(k){data[k]=read(KEYS[k],null)});return JSON.stringify(data,null,2)}
export function importAllData(json){var data=JSON.parse(json);if(typeof data!=='object'||data===null)throw new Error('Invalid');Object.keys(KEYS).forEach(function(k){if(data[k]!==undefined)write(KEYS[k],data[k])});return true}
export function getSessionsInRange(days){var ss=getSessions();var co=new Date();co.setDate(co.getDate()-days);co.setHours(0,0,0,0);return ss.filter(function(s){return new Date(s.completedAt||s.createdAt)>=co})}
export function getTasksCompletedInRange(days){var ts=getTasks();var co=new Date();co.setDate(co.getDate()-days);co.setHours(0,0,0,0);return ts.filter(function(t){return t.completed&&t.completedAt&&new Date(t.completedAt)>=co})}
export function calcStreak(){var ts=getTasks();var ss=getSessions();var dates={};ts.forEach(function(t){if(t.completed&&t.completedAt)dates[t.completedAt.split('T')[0]]=1});ss.forEach(function(s){var d=(s.completedAt||s.createdAt||'').split('T')[0];if(d)dates[d]=1});var streak=0;var d=new Date();d.setHours(0,0,0,0);while(true){var ds=d.toISOString().split('T')[0];if(dates[ds]){streak++;d.setDate(d.getDate()-1)}else break}return streak}
export function getDailyFocusMin(){var ss=getSessions();var today=getTodayStr();var total=0;ss.forEach(function(s){if((s.completedAt||s.createdAt||'').split('T')[0]===today&&(s.type==='work'||!s.type))total+=(s.duration||0)});return total}
export function getLast7DaysFocus(){var result=[];for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var ds=d.toISOString().split('T')[0];var total=0;getSessions().forEach(function(s){if((s.completedAt||s.createdAt||'').split('T')[0]===ds&&(s.type==='work'||!s.type))total+=(s.duration||0)});result.push({date:ds,label:d.toLocaleDateString('en-US',{weekday:'short'}),minutes:total})}return result}
export function getLast7DaysTasks(){var result=[];for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var ds=d.toISOString().split('T')[0];var count=0;getTasks().forEach(function(t){if(t.completed&&t.completedAt&&t.completedAt.split('T')[0]===ds)count++});result.push({date:ds,label:d.toLocaleDateString('en-US',{weekday:'short'}),count:count})}return result}
export {KEYS};
