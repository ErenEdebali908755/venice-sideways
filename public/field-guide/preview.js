import {FieldGuide} from './guide.js?v=20261009-walk';
const root=document.getElementById('field-guide');let guide=null;
// No draft endpoint, token URL, persistence, analytics or location in this shell.
// Only the embedding same-origin admin may provide an entire snapshot.
addEventListener('message',async e=>{
 if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='sideways-preview')return;
 try{const {draft,locale,visitKey,view,sequence,compactPreview}=e.data;if(!draft?.key||!Array.isArray(draft.visits)||!Array.isArray(draft.segments))throw Error();
 if(!guide){let water=null;try{const r=await fetch('/field-guide/water.json');if(r.ok)water=await r.json();}catch{}guide=new FieldGuide(root,{routes:[draft],lang:locale,water,preview:true,compactPreview:compactPreview===true,onEdit:key=>parent.postMessage({type:'sideways-edit',key},location.origin)});}
 guide.update({routes:[draft],lang:locale,visitKey,view,compactPreview:compactPreview===true});parent.postMessage({type:'sideways-preview-rendered',sequence},location.origin);
 }catch{guide?.destroy();guide=null;root.className='fg-loading';root.textContent='Preview unavailable / Önizleme yüklenemedi';parent.postMessage({type:'sideways-preview-error'},location.origin);}
});
parent.postMessage({type:'sideways-preview-ready'},location.origin);
