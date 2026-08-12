import React from 'react';

import{createContext,useContext,useState,useCallback}from'react';
var C=createContext();
export function AppProvider(props){var state=useState([]);var toasts=state[0];var setToasts=state[1];
var showToast=useCallback(function(msg,dur){if(dur===undefined)dur=2500;var id=Date.now();setToasts(function(p){return p.concat([{id:id,message:msg,exiting:false}])});setTimeout(function(){setToasts(function(p){return p.map(function(t){return t.id===id?Object.assign({},t,{exiting:true}):t})});setTimeout(function(){setToasts(function(p){return p.filter(function(t){return t.id!==id})})},260)},dur)},[]);
return React.createElement(C.Provider,{value:{toasts:toasts,showToast:showToast}},props.children)}
export function useApp(){var c=useContext(C);if(!c)throw new Error('No AppProvider');return c}
