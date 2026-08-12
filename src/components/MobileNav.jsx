
import{h}from'../h';import{HomeI,TaskI,CardI,TimerI,SetI}from'./Icons';
var items=[{id:'dashboard',label:'Home',Icon:HomeI},{id:'tasks',label:'Tasks',Icon:TaskI},{id:'cards',label:'Cards',Icon:CardI},{id:'pomodoro',label:'Focus',Icon:TimerI},{id:'settings',label:'More',Icon:SetI}];
export default function MobileNav(props){return h('nav',{className:'mobile-nav'},h('div',{className:'mobile-nav-inner'},items.map(function(i){return h('button',{key:i.id,className:'mobile-nav-item'+(props.currentPage===i.id?' active':''),onClick:function(){props.onNavigate(i.id)}},h(i.Icon,null),i.label)})))}
