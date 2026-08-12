import{useState,useEffect,useRef}from'react';import{h}from'../h';import{getTasks,getSessions,addSession,getSettings,getDailyFocusMin,formatDuration,getTodayStr}from'../utils/storage';
export default function PomodoroPage(props){var settings=getSettings();var ms=useState(settings.pomodoroMode||'short');var mode=ms[0];var setMode=ms[1];var ss=useState('idle');var state=ss[0];var setState=ss[1];var ts=useState(0);var timeLeft=ts[0];var setTimeLeft=ts[1];var bs=useState(false);var isBreak=bs[0];var setIsBreak=bs[1];var scs=useState(0);var sessions=scs[0];var setSessions=scs[1];var tks=useState('');var selectedTask=tks[0];var setSelectedTask=tks[1];var tasks=getTasks().filter(function(t){return !t.completed});var intervalRef=useRef(null);
var getWorkMin=function(){if(mode==='deep')return 50;if(mode==='custom')return 45;return settings.pomodoroWork||25};
var getBreakMin=function(){if(mode==='deep')return 10;if(mode==='custom')return 10;return settings.pomodoroBreak||5};
var workSec=getWorkMin()*60;var breakSec=getBreakMin()*60;var totalSec=isBreak?breakSec:workSec;
useEffect(function(){setTimeLeft(isBreak?breakSec:workSec)},[mode,isBreak,workSec,breakSec]);
useEffect(function(){var todaySess=getSessions().filter(function(s){return(s.completedAt||'').split('T')[0]===getTodayStr()});setSessions(todaySess.filter(function(s){return s.type==='work'}).length)},[state]);
useEffect(function(){
if(state!=='running'){clearInterval(intervalRef.current);return}
intervalRef.current=setInterval(function(){
setTimeLeft(function(t){
if(t<=1){
clearInterval(intervalRef.current);
if(!isBreak){
addSession({duration:getWorkMin(),type:'work',mode:mode,taskTitle:selectedTask,completedAt:new Date().toISOString()});
props.showToast('Work session complete!');
try{if('Notification' in window){new Notification('THRUST',{body:'Work session done! Take a break.'})}}catch(e){}
setIsBreak(true);
setState('idle');
}else{
props.showToast('Break over!');
setIsBreak(false);
setState('idle');
setSessions(function(s){return s+1});
}
return 0;
}
return t-1;
});
},1000);
return function(){clearInterval(intervalRef.current)}
},[state,isBreak,mode,selectedTask,props.showToast,getWorkMin]);

var start=function(){if(timeLeft<=0)setTimeLeft(isBreak?breakSec:workSec);setState('running')};
var pause=function(){setState('paused')};
var reset=function(){clearInterval(intervalRef.current);setState('idle');setIsBreak(false);setTimeLeft(workSec)};
var skip=function(){clearInterval(intervalRef.current);if(!isBreak){setIsBreak(true);setTimeLeft(breakSec);setState('idle')}else{setIsBreak(false);setTimeLeft(workSec);setState('idle');setSessions(function(s){return s+1})}};
var mins=Math.floor(timeLeft/60);var secs=timeLeft%60;var timeStr=(mins<10?'0':'')+mins+':'+(secs<10?'0':'')+secs;
var progress=totalSec>0?(totalSec-timeLeft)/totalSec:0;var circumference=2*Math.PI*100;var offset=circumference*(1-progress);var dailyFocus=getDailyFocusMin();
if(props.focusMode){return h('div',{className:'focus-overlay'},h('div',{className:'focus-info'},'FOCUS MODE'),h('div',{className:'focus-task'},selectedTask||'No task selected'),h('div',{className:'focus-timer'},timeStr),h('div',{className:'focus-info'},isBreak?'Break':'Work Session'),h('div',{className:'focus-info'},'Today: '+formatDuration(dailyFocus)),h('div',{className:'focus-actions'},state==='running'?h('button',{className:'btn btn-secondary btn-lg',onClick:pause},'Pause'):h('button',{className:'btn btn-primary btn-lg',onClick:start},'Resume'),h('button',{className:'btn btn-ghost btn-lg',onClick:function(){reset();props.onExitFocus()}},'Exit Focus')))}
var dots=[];for(var i=0;i<Math.max(sessions,4);i++)dots.push(h('div',{key:i,className:'session-dot'+(i<sessions?' done':'')}));
var modeLabels={short:'Short ('+getWorkMin()+'m)',deep:'Deep ('+getWorkMin()+'m)',custom:'Custom (45m)'};
return h('div',{className:'pomo-container'},h('h2',{style:{marginBottom:'var(--space-2)'}},'Pomodoro'),h('div',{className:'pomo-modes'},['short','deep','custom'].map(function(m){return h('button',{key:m,className:'pomo-mode'+(mode===m?' active':''),onClick:function(){if(state==='idle'){setMode(m);setIsBreak(false)}}},modeLabels[m])})),h('div',{className:'session-dots'},dots),h('div',{className:'pomo-timer'},h('svg',{viewBox:'0 0 220 220'},h('circle',{className:'bg-ring',cx:'110',cy:'110',r:'100'}),h('circle',{className:'fg-ring',cx:'110',cy:'110',r:'100',strokeDasharray:circumference,strokeDashoffset:offset})),h('div',{className:'pomo-time'},h('div',{className:'time'},timeStr),h('div',{className:'label'},isBreak?'BREAK':'FOCUS'))),h('div',{className:'pomo-controls'},state==='running'?h('button',{className:'btn btn-secondary btn-lg',onClick:pause},'Pause'):h('button',{className:'btn btn-primary btn-lg',onClick:start},timeLeft<totalSec&&timeLeft>0?'Resume':'Start'),h('button',{className:'btn btn-ghost btn-lg',onClick:reset},'Reset'),h('button',{className:'btn btn-ghost btn-lg',onClick:skip},'Skip')),h('div',{className:'pomo-task-selector'},h('select',{className:'select',value:selectedTask,onChange:function(e){setSelectedTask(e.target.value)}},h('option',{value:''},'No task selected'),tasks.map(function(t){return h('option',{key:t.id,value:t.title},t.title)}))),h('div',{style:{marginTop:'var(--space-4)'}},h('button',{className:'btn btn-secondary',onClick:props.onEnterFocus},'Enter Focus Mode')),h('div',{className:'pomo-sessions-list'},h('div',{className:'section-label'},'Today: '+formatDuration(dailyFocus)+' focused'),getSessions().filter(function(s){return(s.completedAt||'').split('T')[0]===getTodayStr()}).slice(0,10).map(function(s,i){return h('div',{className:'pomo-session-item',key:i},h('span',null,s.taskTitle||s.mode||'Session'),h('span',{className:'mono'},s.duration+'m'))})))}
