/* Presentation only. Move existing controls, retaining their handlers and state. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),mq=matchMedia('(max-width:900px)');
 const header=document.querySelector('body>header'),dock=document.querySelector('.guide-dock'),wrap=document.querySelector('.map-wrap');
 const words={fit:['Route','Rota','Маршрут','Parcours','路线','ルート','경로','Percorso'],location:['Location','Konum','Позиция','Position','位置','現在地','내 위치','Posizione'],settings:['Settings','Ayarlar','Настройки','Réglages','设置','設定','설정','Impostazioni'],close:['Close','Kapat','Закрыть','Fermer','关闭','閉じる','닫기','Chiudi'],nearby:['Nearby','Yakındakiler','Рядом','À proximité','附近','周辺','주변','Dintorni']};
 const locationLabel=document.createElement('span');locationLabel.className='mobile-only mobile-location-label';locationLabel.dataset.mobileWord='location';$('my-location').append(locationLabel);
 const fit=$('fit');fit.setAttribute('data-no-translate','');
 const languages=['en','tr','ru','fr','zh','ja','ko','it'];
 const text=k=>words[k][Math.max(0,languages.indexOf(WalkI18n.language))];
 function button(id,key){const b=document.createElement('button');b.type='button';b.id=id;b.className='btn mobile-only';b.dataset.mobileWord=key;b.setAttribute('data-no-translate','');return b;}
 const settings=button('mobile-settings','settings');settings.classList.add('mobile-settings-button');header.append(settings);
 const tools=document.createElement('nav');tools.className='mobile-only mobile-map-tools';tools.setAttribute('aria-label','Map controls');tools.setAttribute('data-no-translate','');dock.before(tools);
 const nearby=button('mobile-nearby','nearby');tools.append(nearby);
 function panel(id,key,trigger){const p=document.createElement('section');p.id=id;p.className='mobile-only mobile-panel';p.hidden=true;const head=document.createElement('div');head.className='mobile-panel-heading';const title=document.createElement('h2');title.dataset.mobileWord=key;title.setAttribute('data-no-translate','');title.id=id+'-title';const close=button(id+'-close','close');head.append(title,close);p.append(head);p.setAttribute('aria-labelledby',title.id);trigger.setAttribute('aria-controls',id);trigger.setAttribute('aria-expanded','false');close.onclick=()=>{p.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();};trigger.onclick=()=>{const open=p.hidden;closePanels();p.hidden=!open;trigger.setAttribute('aria-expanded',String(open));};return p;}
 const prefs=panel('mobile-preferences','settings',settings),places=panel('mobile-places','nearby',nearby);header.after(prefs);tools.before(places);
 const moved=[];let compact=false;
 function move(node,parent){if(!node)return;const anchor=document.createComment('mobile original position');node.before(anchor);moved.push({node,anchor});parent.append(node);}
 function closePanels(){for(const id of ['mobile-preferences','mobile-places','location-panel','place-sheet'])if($(id))$(id).hidden=true;for(const b of [settings,nearby,$('my-location')])b?.setAttribute('aria-expanded','false');}
 function resize(){if(map&&(!mq.matches||document.body.dataset.guideView==='map'))map.invalidateSize({pan:false,animate:false});}
 function layout(){if(mq.matches===compact)return;compact=mq.matches;closePanels();if(compact){move(document.querySelector('.walk-language-bar'),prefs);move(header.querySelector('.actions'),prefs);move(document.querySelector('.nearby-controls'),places);move($('refresh'),prefs);move($('fit'),tools);move($('my-location'),tools);for(const id of ['location-panel','place-sheet']){const n=$(id);if(n){move(n,document.body);tools.before(n);}}}else{for(const {node,anchor} of moved.splice(0)){anchor.replaceWith(node);}}labels();resize();}
 function labels(){fit.textContent=mq.matches?text('fit'):WalkI18n.translate('Fit walk');fit.setAttribute('aria-label',WalkI18n.translate('Fit walk'));document.querySelectorAll('[data-mobile-word]').forEach(n=>{n.textContent=text(n.dataset.mobileWord);});tools.setAttribute('aria-label',WalkI18n.translate('Map'));}
 $('my-location').addEventListener('click',()=>{if(!compact)return;prefs.hidden=true;places.hidden=true;$('place-sheet').hidden=true;settings.setAttribute('aria-expanded','false');nearby.setAttribute('aria-expanded','false');});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&compact){if(!prefs.hidden){prefs.hidden=true;settings.focus();}if(!places.hidden){places.hidden=true;nearby.focus();}settings.setAttribute('aria-expanded','false');nearby.setAttribute('aria-expanded','false');}});
 const panels=[prefs,places,$('location-panel'),$('place-sheet')];
 const panelObserver=new MutationObserver(records=>{if(!compact)return;const opened=records.map(r=>r.target).findLast(n=>!n.hidden);if(!opened)return;for(const p of panels)if(p!==opened)p.hidden=true;for(const b of [settings,nearby,$('my-location')])b.setAttribute('aria-expanded',String(b.getAttribute('aria-controls')===opened.id));});
 panels.forEach(p=>panelObserver.observe(p,{attributes:true,attributeFilter:['hidden']}));
 const closePlace=$('close-place').onclick;$('close-place').onclick=()=>{if(!compact)return closePlace();$('place-sheet').hidden=true;nearby.focus();};
 dock.addEventListener('click',closePanels);
 mq.addEventListener('change',layout);window.addEventListener('walklanguagechange',labels);
 new ResizeObserver(resize).observe($('map'));
 labels();layout();
})();
