/* Map-page localization only. Local dictionaries; no translation API, billing or geolocation.
   Source-aware text translation leaves route data, coordinates and event handlers unchanged. */
(() => {
  'use strict';
  const ROOT='/walk-i18n/v9/', KEY='walk-guide-language-v9';
  const codes=['tr','ru','fr','zh','ja','ko'];
  const names={en:'English',tr:'Türkçe',ru:'Русский',fr:'Français',zh:'简体中文',ja:'日本語',ko:'한국어'};
  const locales={en:'en-GB',tr:'tr-TR',ru:'ru-RU',fr:'fr-FR',zh:'zh-Hans',ja:'ja-JP',ko:'ko-KR'};
  const dictionaries={},templates={},stopPacks={},promptPacks={},loads=new Map();
  const texts=new WeakMap(), attributes=new WeakMap(), missing=new Set(), glBound=new WeakSet();
  let lang='en',selection='auto',sequence=0,ready=false,englishIdeas=null,scheduled=false,busy=false,observer,activeMap;
  const norm=s=>String(s).replace(/\s+/gu,' ').trim();
  const base=s=>{const c=String(s||'').toLowerCase().split(/[-_]/)[0];return Object.hasOwn(names,c)?c:null;};
  const $=id=>document.getElementById(id);
  for(const c of codes){dictionaries[c]=new Map();templates[c]={};stopPacks[c]={};}
  function rows(raw,fn){for(const line of raw.trim().split('\n')){if(!line.trim())continue;const f=line.split('|');if(f.length!==7||f.some(v=>!v.trim()))throw Error('Invalid locale row: '+f[0]);fn(f[0],f.slice(1));}}
  function parsePrompts(raw){let id='',out={};for(const row of raw.trim().split('\n')){const line=row.trim();if(!line)continue;if(/^\[[a-z]+\]$/.test(line)){id=line.slice(1,-1);out[id]=[];}else{const f=line.split('|');if(!id||f.length!==4||f.some(x=>!x.trim()))throw Error('Invalid prompt row');out[id].push(f);}}const expected=Object.keys(POINTS);if(Object.keys(out).length!==expected.length||expected.some(k=>out[k]?.length!==5||new Set(out[k].map(v=>v[0])).size!==5))throw Error('Incomplete five-idea pack');return out;}
  function add(c,source,target){dictionaries[c].set(norm(source),target);}
  window.WalkI18n={
    registerUI(raw){rows(raw,(key,values)=>codes.forEach((c,i)=>add(c,key,values[i])));},
    registerTemplates(raw){rows(raw,(key,values)=>codes.forEach((c,i)=>templates[c][key]=values[i]));},
    registerStops(raw){rows(raw,(id,values)=>codes.forEach((c,i)=>stopPacks[c][id]=values[i]));},
    registerPrompts(c,raw){if(!codes.includes(c))throw Error('Unknown locale');const pack=parsePrompts(raw);
      // Review corrections, applied before any translated content is displayed.
      if(c==='tr')pack.lucia[4][0]='Bir arkadaşının ilk izleniminden yola çık';
      if(c==='fr')pack.stefano[3][2]='Avec les bords architecturaux publics, donnez à la place l’impression d’un espace clos. Puis essayez un cadre qui la laisse respirer.';
      promptPacks[c]=pack;
    },
    get language(){return lang;},get selection(){return selection;},get ready(){return ready;},
    choose(value){return choose(value,true);},refresh(){apply();},
    audit(){return {language:lang,selection,ready,missing:[...missing].sort(),packs:Object.fromEntries(Object.entries(promptPacks).map(([c,p])=>[c,{stops:Object.keys(p).length,ideas:Object.values(p).reduce((a,v)=>a+v.length,0)}]))};},
    translate(s){return translate(norm(s));},
    pack(c){return promptPacks[c];}
  };
  const bar=document.createElement('div');bar.className='walk-language-bar';bar.setAttribute('data-no-translate','');
  const label=document.createElement('label');label.htmlFor='walk-language';label.textContent='Language';
  const select=document.createElement('select');select.id='walk-language';select.setAttribute('aria-describedby','walk-language-help');
  select.innerHTML='<option value="auto">Automatic (device)</option>'+Object.entries(names).map(([c,n])=>'<option value="'+c+'" lang="'+(c==='zh'?'zh-Hans':c)+'">'+n+'</option>').join('');
  const help=document.createElement('span');help.id='walk-language-help';help.className='walk-language-help';
  const notification=document.createElement('span');notification.id='walk-language-status';notification.setAttribute('role','status');
  bar.append(label,select,help,notification);document.querySelector('body > header').after(bar);document.body.classList.add('walk-multilingual');
  function loadScript(file){if(loads.has(file))return loads.get(file);const promise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=ROOT+file;s.async=true;let finished=false;const timer=setTimeout(()=>{if(!finished){finished=true;s.remove();loads.delete(file);reject(Error('Language load timeout'));}},15000);s.onload=()=>{if(finished)return;finished=true;clearTimeout(timer);resolve();};s.onerror=()=>{if(finished)return;finished=true;clearTimeout(timer);loads.delete(file);s.remove();reject(Error('Language load failed'));};document.head.append(s);});loads.set(file,promise);return promise;}
  let englishPromise;
  async function loadEnglish(){if(englishIdeas)return englishIdeas;if(!englishPromise)englishPromise=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch('/walk-map-phone-ideas-v8.js',{signal:controller.signal,cache:'force-cache'});if(!response.ok)throw Error('English source unavailable');const source=await response.text();const start=source.indexOf('const content = `');if(start<0)throw Error('English prompt source not found');const from=start+'const content = `'.length,end=source.indexOf('`;',from);if(end<0)throw Error('English prompt source incomplete');englishIdeas=parsePrompts(source.slice(from,end));return englishIdeas;}finally{clearTimeout(timer);}})().catch(e=>{englishPromise=null;throw e;});return englishPromise;}
  const commonPromise=Promise.all([loadScript('interface.js'),loadScript('content.js')]);
  function explicitLanguage(){const h=new URLSearchParams(location.hash.slice(1)),q=new URLSearchParams(location.search);return base(h.get('lang')||q.get('lang'));}
  function stored(){try{return base(localStorage.getItem(KEY));}catch{return null;}}
  function detected(){for(const value of navigator.languages||[navigator.language]){const c=base(value);if(c)return c;}return base(navigator.language)||'en';}
  function preferred(){return explicitLanguage()||stored()||'auto';}
  function template(key,values){let text=templates[lang]?.[key]||'';for(const [k,v] of Object.entries(values))text=text.replaceAll('{'+k+'}',String(v));return text;}
  const suffixes={
    'Dorsoduro side':['Dorsoduro tarafı','сторона Dorsoduro','côté Dorsoduro','Dorsoduro一侧','Dorsoduro側','Dorsoduro 쪽'],
    'San Polo side':['San Polo tarafı','сторона San Polo','côté San Polo','San Polo一侧','San Polo側','San Polo 쪽'],
    'northern approach':['kuzey yaklaşımı','северный подход','approche nord','北侧桥头','北側の通路','북쪽 진입부'],
    'view from the quay':['kıyıdan bakış','вид с набережной','vue depuis le quai','从岸边观看','岸からの眺め','물가 길에서 보기'],
    'squero surroundings':['tekne atölyesi çevresi','окрестности верфи','abords du chantier naval','船厂周边','造船所周辺','조선소 주변'],
    'Biennale exterior':['Biennale dış alanı','снаружи Биеннале','extérieur de la Biennale','双年展外部','ビエンナーレの外','비엔날레 바깥'],
    'outside':['dış alan','снаружи','extérieur','外部','外側','바깥']
  };
  function place(s){let result=s;for(const [en,values] of Object.entries(suffixes))result=result.replaceAll(en,values[codes.indexOf(lang)]||en);return result;}
  function number(n){return new Intl.NumberFormat(locales[lang],{maximumFractionDigits:1}).format(Number(n));}
  function knownName(s){return s==='Venice Sideways'|| Object.values(POINTS).some(p=>p.name===s)||Object.values(names).includes(s)||/^(?:[\d\s+−←↻◎▣↗×©.,:;°–—/()]+|WhatsApp ↗|Google Maps(?: ↗)?|OpenFreeMap|OpenMapTiles|FOSSGIS \/ OSRM|SunCalc 1\.9\.0|Leaflet|Cannaregio|Dorsoduro|Castello|Sant’Elena|Aperture: The Photographer’s Playspace|Tom Bol \/ Nikon: The Composition Triangle)$/.test(s)||s.startsWith(': Cannaregio 1227')||s.startsWith('Santa Lucia →')||s.startsWith('Venezia Santa Lucia →');}
  function translate(s){if(s==='Venice Photography Walk Map'||s==='Venice Sideways')return 'Venice Sideways';if(!s||lang==='en')return s;const dict=dictionaries[lang];if(dict?.has(s))return dict.get(s);if(s==='Venice photography walk map')return dict.get('Venice Photography Walk Map');
    let m;
    if((m=s.match(/^(Main Walk|Full 28-Stop Walk) · (\d+) stops · (\d+) optional phone-friendly ideas$/)))return template('caption',{route:translate(m[1]),n:m[2],total:m[3]});
    if((m=s.match(/^Idea ([1-5]) of 5$/)))return template('idea',{n:m[1]});
    if((m=s.match(/^Phone-friendly · idea ([1-5]) of 5$/)))return template('phoneIdea',{n:m[1]});
    if((m=s.match(/^(Next|Previous) photo idea for (.+)$/)))return template(m[1]==='Next'?'nextIdea':'prevIdea',{place:place(m[2])});
    if((m=s.match(/^Five optional phone-friendly photo ideas for (.+)$/)))return template('fiveIdeas',{place:place(m[1])});
    if((m=s.match(/^(.+): idea ([1-5]) of 5\. (.+)$/)))return template('announcement',{place:place(m[1]),n:m[2],title:translate(m[3])});
    if((m=s.match(/^Walk (\d+) → (\d+) · (.+?)(?: in Google Maps)? ↗$/)))return template('leg',{a:m[1],b:m[2],place:place(m[3])});
    if((m=s.match(/^Open (\d+) → (\d+) in Google Maps$/)))return template('openLeg',{a:m[1],b:m[2]});
    if((m=s.match(/^Walk to (?:stop )?(\d+)(?: in Google Maps)? ↗$/)))return template('walkTo',{n:m[1]});
    if((m=s.match(/^Part (\d+) · stops (\d+)–(\d+) ↗$/)))return template('part',{n:m[1],a:m[2],b:m[3]});
    if((m=s.match(/^All (\d+) stops exceed a single Google Maps directions link\. Use the (\d+) numbered parts below; every stop is included, in order\.$/)))return template('exportLong',{n:m[1],parts:m[2]});
    if((m=s.match(/^Approx\. ([\d.]+) km · (\d+) min walking$/)))return template('approxWalk',{km:number(m[1]),min:number(m[2])});
    if((m=s.match(/^All (\d+) selected stops remain listed; no stop has been removed\.$/)))return template('allStops',{n:m[1]});
    if((m=s.match(/^Selected finish: (.+)\. Current access still needs a scouting check\.$/)))return template('selectedFinish',{place:place(m[1])});
    if((m=s.match(/^Sun direction: (\d+)° clockwise from north\. After the sunset pause, leave about ([\d:]+)\.$/)))return template('sunDirection',{deg:m[1],time:m[2]});
    if(s.endsWith(' · Venice local time (Europe/Rome). Astronomical estimate, not a weather forecast.')&&eventDate){const date=new Intl.DateTimeFormat(locales[lang],{timeZone:'Europe/Rome',weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(new Date(eventDate+'T12:00:00Z'));return template('dateInfo',{date});}
    if((m=s.match(/^(\d+) STOPS$/)))return template('stops',{n:m[1]});
    if((m=s.match(/^(START|FINISH)(: | · )(.*)$/)))return translate(m[1])+m[2]+translate(m[3]);
    if((m=s.match(/^(SUNSET-LIGHT STOP|SUNSET LIGHT|STOP) ·? ?(\d+)(.*)$/)))return translate(m[1])+' · '+m[2]+(m[3]?translate(m[3]):'');
    if((m=s.match(/^(Main Walk|Full 28-Stop Walk)(.*)$/))){let rest=m[2];rest=rest.replace(/(\d+) stops/g,(_,n)=>template('stops',{n}));return translate(m[1])+rest;}
    if((m=s.match(/^\d+ · (.+)$/)))return s.replace(m[1],place(m[1]));
    const renamed=place(s);if(renamed!==s)return renamed;
    if(s==='Legacy route option')return '';
    if(!knownName(s)&&/[A-Za-z]{3}/.test(s))missing.add(s);
    return s;
  }
  function buildDictionary(c){if(c==='en')return;const pack=promptPacks[c];for(const [id,group] of Object.entries(englishIdeas)){for(let i=0;i<5;i++){for(let f=0;f<4;f++)add(c,group[i][f],pack[id][i][f]);}}
    for(const [id,p] of Object.entries(POINTS)){if(!stopPacks[c][id])throw Error('Missing stop translation '+id);add(c,p.about,stopPacks[c][id]);}
    add(c,'The northern approach by Rialto, on the Cannaregio side of the canal crossing. Continue north towards Guglie; this point avoids an extra stop on the San Polo side.',stopPacks[c].rialtoMain);
  }
  const skip=element=>!element||element.closest('script,style,noscript,[data-no-translate],.leaflet-control-attribution');
  function translateText(node){if(skip(node.parentElement))return;const now=node.nodeValue,record=texts.get(node);let source=record&&now===record.output?record.source:now;const value=norm(source);if(!value)return;const replacement=translate(value),output=source.match(/^\s*/u)[0]+replacement+source.match(/\s*$/u)[0];texts.set(node,{source,output});if(now!==output)node.nodeValue=output;}
  function translateAttributes(node){if(skip(node))return;let records=attributes.get(node);if(!records){records={};attributes.set(node,records);}for(const key of ['title','aria-label','placeholder']){if(!node.hasAttribute(key))continue;const now=node.getAttribute(key),r=records[key],source=r&&now===r.output?r.source:now,output=translate(norm(source));records[key]={source,output};if(now!==output)node.setAttribute(key,output);}}
  function configureSelector(){label.textContent=translate('Language');select.options[0].textContent=translate('Automatic (device)');select.value=selection;help.textContent=translate('Language follows your browser preferences. Your manual choice is remembered on this device.');select.setAttribute('aria-label',translate('Language'));}
  function mapLanguage(){if(!map)return;if(activeMap!==map){activeMap=map;map.on('layeradd',()=>setTimeout(mapLanguage,0));}map.eachLayer(layer=>{const gl=layer.getMaplibreMap?.();if(!gl)return;const applyStyle=()=>{if(!gl.isStyleLoaded())return;const nameExpression=['coalesce',['get','name:'+ (lang==='zh'?'zh':lang)],['get','name:latin'],['get','name']];for(const l of gl.getStyle().layers||[]){if(l.type!=='symbol'||!l.layout?.['text-field'])continue;const field=JSON.stringify(l.layout['text-field']);if(!field.includes('name'))continue;try{gl.setLayoutProperty(l.id,'text-field',nameExpression);}catch{}}};if(!glBound.has(gl)){glBound.add(gl);gl.on('load',applyStyle);}applyStyle();});}
  function apply(){if(busy||!ready)return;busy=true;observer?.disconnect();try{missing.clear();const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())translateText(n);document.querySelectorAll('[title],[aria-label],[placeholder]').forEach(translateAttributes);document.documentElement.lang=lang==='zh'?'zh-Hans':lang;document.documentElement.dir='ltr';document.body.dataset.walkLanguage=lang;document.title='Venice Sideways';configureSelector();const og=document.querySelector('meta[property="og:title"]');if(og)og.content=document.title;updateShare();}finally{busy=false;observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});}}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});}
  observer=new MutationObserver(schedule);
  const originalStateHash=stateHash;
  stateHash=function(...args){const h=new URLSearchParams(originalStateHash(...args).slice(1));if(selection!=='auto')h.set('lang',selection);return '#'+h.toString();};
  const originalShare=shareURL;
  shareURL=function(){const url=new URL(originalShare(),location.href),h=new URLSearchParams(url.hash.slice(1));h.set('lang',lang);url.hash=h.toString();return url.href;};
  updateShare=function(){const a=$('whatsapp');if(a)a.href='https://wa.me/?text='+encodeURIComponent(translate('Venice Photography Walk Map')+' 📷\n'+translate(ROUTES[mode].label)+'\n'+shareURL());};
  const originalToast=toast;
  toast=function(message){if(message==='Link copied with your route, date and map view.')message='Link copied with your route, date and language.';originalToast(translate(message));};
  function updateURL(){const url=new URL(location.href),h=new URLSearchParams(url.hash.slice(1));url.searchParams.delete('lang');if(selection==='auto')h.delete('lang');else h.set('lang',selection);url.hash=h.toString();try{history.replaceState(null,'',url.pathname+url.search+url.hash);}catch{}}
  async function choose(value,persist=false){const pref=value==='auto'?'auto':base(value)||'en',target=pref==='auto'?detected():pref,id=++sequence;select.disabled=true;notification.textContent=translate('Loading language…');try{await commonPromise;if(target!=='en'){await Promise.all([loadEnglish(),loadScript('prompts-'+target+'.js')]);buildDictionary(target);}if(id!==sequence)return;lang=target;selection=pref;ready=true;if(persist){try{if(pref==='auto')localStorage.removeItem(KEY);else localStorage.setItem(KEY,pref);}catch{}updateURL();}notification.textContent='';apply();mapLanguage();window.dispatchEvent(new CustomEvent('walklanguagechange',{detail:{language:lang,selection}}));}catch(error){if(id!==sequence)return;ready=true;notification.textContent=translate('Could not load this language. Your current language has been kept. Please try again.');console.warn('Walking guide language unavailable:',error.message);apply();}finally{if(id===sequence)select.disabled=false;}}
  select.addEventListener('change',()=>choose(select.value,true));
  window.addEventListener('languagechange',()=>{if(selection==='auto')choose('auto');});
  window.addEventListener('hashchange',()=>{const p=preferred();if(p!==selection||(p==='auto'&&detected()!==lang))choose(p);else schedule();});
  // First use follows an explicit shared language, then saved choice, then browser order.
  choose(preferred());
  let attempts=0;const timer=setInterval(()=>{if(map){clearInterval(timer);mapLanguage();schedule();}else if(++attempts>45)clearInterval(timer);},500);
})();
