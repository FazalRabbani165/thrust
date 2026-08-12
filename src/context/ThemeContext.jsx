import React from 'react';

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
