
import React from'react';
import ReactDOM from'react-dom/client';
import App from'./App';
import{ThemeProvider}from'./context/ThemeContext';
import{AppProvider}from'./context/AppContext';
import'./index.css';
class EB extends React.Component{constructor(p){super(p);this.state={error:null,stack:null}}static getDerivedStateFromError(e){return{error:String(e),stack:e.stack||''}}componentDidCatch(e,i){console.error('THRUST:',e,i)}render(){if(this.state.error){return React.createElement('div',{style:{padding:24,fontFamily:'monospace',fontSize:13,color:'#ef4444',background:'#0a0a0f',minHeight:'100vh',whiteSpace:'pre-wrap',wordBreak:'break-word'}},React.createElement('div',{style:{color:'#ff6b35',fontSize:18,marginBottom:16,fontWeight:'bold'}},'THRUST crashed'),React.createElement('div',{style:{color:'#e8e8ec',marginBottom:12}},this.state.error),this.state.stack&&React.createElement('div',{style:{color:'#8a8a9a',fontSize:11,lineHeight:1.6}},this.state.stack))}return this.props.children}}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(EB,null,React.createElement(ThemeProvider,null,React.createElement(AppProvider,null,React.createElement(App,null)))));
