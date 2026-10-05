/* Controlled local event/boot acceptance. Every request is intercepted; no event,
   registration, location permission or production write is performed. This is not
   physical-device keyboard/GPS acceptance or a live-release test. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/erenedebali/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),publicRoot=resolve(repo,'public');
const output=resolve(repo,'../visual-integration-20261005/events-boot');await mkdir(output,{recursive:true});
const base='https://venicesideways.com',languages=['en','tr','it','fr','ru','zh','ja','ko'];
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const fixture={slug:'controlled-mobile-fixture',routeKey:'main',eventDate:'2026-10-11',startAt:null,state:'open',capacity:null,remaining:null,translations:Object.fromEntries(languages.map(locale=>[locale,{title:'Controlled event fixture',description:'Local acceptance fixture; not a published event.'}])),privacyContact:'controlled-fixture@example.invalid',retentionDays:180};
let checks=0;const issues=[],errors=[];const check=(value,message)=>{checks++;if(!value)issues.push(message)};
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
async function open({language='tr',width=390,height=844,eventState='open',boot=false,saved='',browserLanguages=[],query,unavailable=false}={}) {
  const context=await browser.newContext({viewport:{width,height},locale:language,colorScheme:'light'});
  await context.addInitScript(({saved,browserLanguages})=>{
    window.__gpsCalls=0;Object.defineProperty(navigator,'geolocation',{value:{watchPosition(){window.__gpsCalls++;throw Error('No GPS in event/boot fixture')},getCurrentPosition(){window.__gpsCalls++;throw Error('No GPS in event/boot fixture')}}});
    if(saved)localStorage.setItem('sideways-language',saved);
    if(browserLanguages.length)Object.defineProperty(navigator,'languages',{value:browserLanguages});
  },{saved,browserLanguages});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const registrations=[];let registerMode='uncertain',holdResolve=null,bootRequests=0;
  await page.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==base){issues.push('Unexpected external request');await route.abort();return}
    if(url.pathname==='/api/events/'+fixture.slug+'/register') {
      registrations.push(JSON.parse(request.postData()));
      if(registerMode==='uncertain'){await route.abort('connectionfailed');return}
      if(registerMode==='hold')await new Promise(resolve=>{holdResolve=resolve});
      if(registerMode==='rate'){await route.fulfill({status:429,json:{error:'rate_limit'}});return}
      if(registerMode==='invalidPhone'){await route.fulfill({status:400,json:{error:'invalidPhone'}});return}
      if(registerMode==='full'){await route.fulfill({status:409,json:{error:'full'}});return}
      await route.fulfill({status:200,json:{result:'already_registered',event:{slug:fixture.slug}}});return;
    }
    if(url.pathname==='/api/events/'+fixture.slug){await route.fulfill(unavailable?{status:404,json:{error:'not_found'}}:{json:{...fixture,state:eventState}});return}
    if(url.pathname==='/api/events'){await route.fulfill({json:{events:[]}});return}
    if(url.pathname==='/api/route-catalog'){bootRequests++;await route.fulfill({status:503,json:{error:'unavailable'}});return}
    if(boot&&url.pathname==='/field-guide/guide.js') {
      await route.fulfill({contentType:'application/javascript',body:`export class FieldGuide{constructor(root,options){window.__bootOptions=options;this.disposed=false;this.root=root;this.render()}render(){this.root.className='fg';this.root.textContent='Loaded actual bundled route data';}choose(key){window.__chosenRoute=key}destroy(){this.disposed=true}}`});return;
    }
    const path=resolve(publicRoot,'.'+(url.pathname==='/'?'/index.html':url.pathname.startsWith('/events/')&&!extname(url.pathname)?'/events.html':url.pathname));
    if(!path.startsWith(publicRoot+'/')){await route.abort();return}
    try{await route.fulfill({body:await readFile(path),contentType:mime[extname(path)]||'application/octet-stream'})}catch{await route.fulfill({status:404,body:'Controlled fixture unavailable'})}
  });
  const search=query===null?'':'?lang='+encodeURIComponent(query===undefined?language:query);
  await page.goto(base+(boot?'/':'/events/'+fixture.slug)+search);
  if(boot)await page.locator('.fg-loading h1').waitFor();else await page.locator('.event-form,.event-note:not([data-state=loading])').waitFor();
  return {page,context,registrations,mode:value=>{registerMode=value},release:()=>holdResolve?.(),bootRequests:()=>bootRequests};
}
async function contrast(page) {
  return page.locator('[name=phone]').evaluate(node=>{
    const rgb=value=>value.match(/\d+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    const luminance=value=>rgb(value).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
    const ratio=(a,b)=>{const values=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(values[0]+.05)/(values[1]+.05)};
    const style=getComputedStyle(node);return {text:ratio(style.color,style.backgroundColor),boundary:ratio(style.borderTopColor,style.backgroundColor)};
  });
}
async function settings(page){const details=page.locator('.event-settings');if(!(await details.evaluate(node=>node.open)))await details.locator('summary').click()}
async function fillValid(page) {
  for(const [key,value] of Object.entries({firstName:'Controlled',lastName:'Fixture',phone:'+39 347 123 4567',email:'fixture@example.invalid'}))await page.locator('[name='+key+']').fill(value);
  await page.locator('[name=gender]').selectOption('');
}
async function screenshot(page,name){await page.evaluate(()=>{const label=document.createElement('p');label.id='qa-note';label.textContent='Controlled local fixture · not a published event';label.style.cssText='position:relative;z-index:2;margin:0;padding:8px;font:12px Arial;background:#fff;color:#222;text-align:center';document.body.prepend(label)});await page.screenshot({path:resolve(output,name),fullPage:true});await page.locator('#qa-note').evaluate(node=>node.remove())}
try {
  for(const language of languages)for(const [width,height]of [[320,568],[390,844],[844,390],[1440,900]]) {
    const app=await open({language,width,height}),{page,context}=app;const label=language+'/'+width+'x'+height;
    check(await page.evaluate(()=>document.documentElement.lang)===language,label+': locale');
    check(await page.locator('form').count()===1,label+': one long form');
    check(await page.locator('[name=phone]').getAttribute('type')==='tel',label+': native tel');
    check(await page.locator('[name=phone]').getAttribute('autocomplete')==='tel',label+': tel autocomplete');
    check(await page.locator('[name=email]').getAttribute('type')==='email',label+': native email');
    check(await page.locator('[name=email]').getAttribute('required')===null,label+': optional email');
    check(await page.locator('[name=gender]').inputValue()==='',label+': empty gender');
    const lightContrast=await contrast(page);check(lightContrast.text>=4.5&&lightContrast.boundary>=3,label+': actual light input contrast');
    await page.locator('form').evaluate(form=>form.requestSubmit());
    check(await page.evaluate(()=>document.activeElement.name)==='firstName',label+': first invalid field focus');
    check(await page.locator('[name=firstName]').getAttribute('aria-invalid')==='true',label+': invalid semantics');
    check(await page.locator('#event-firstName-error').textContent()!=='',label+': adjacent error');
    const validation=await page.locator('#event-status').textContent();
    await fillValid(page);await settings(page);await page.locator('#event-language').selectOption(language==='en'?'tr':'en');
    check(await page.locator('[name=phone]').inputValue()==='+39 347 123 4567',label+': locale preserves phone');
    check(await page.locator('[name=email]').inputValue()==='fixture@example.invalid',label+': locale preserves optional field');
    await page.locator('#event-theme').selectOption('dark');
    check(await page.locator('[name=firstName]').inputValue()==='Controlled',label+': theme preserves name');
    const darkContrast=await contrast(page);check(darkContrast.text>=4.5&&darkContrast.boundary>=3,label+': actual dark input contrast');
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+': no horizontal overflow');
    check(await page.locator('.event-submit').evaluate(node=>node.getBoundingClientRect().height>=48),label+': submit target');
    check(await page.evaluate(()=>__gpsCalls===0),label+': no GPS');
    check(app.registrations.length===0,label+': invalid form makes no POST');
    await context.close();
  }
  const app=await open({language:'tr',width:320,height:568}),{page}=app;
  await fillValid(page);await page.locator('form').evaluate(form=>form.requestSubmit());await page.locator('#event-status[data-state=uncertain]').waitFor();
  check(app.registrations.length===1,'uncertain: first attempt only');
  check(await page.locator('[name=phone]').inputValue()==='+39 347 123 4567','uncertain: preserve form');
  const uncertainTR=await page.locator('#event-status').textContent();
  await settings(page);await page.locator('#event-language').selectOption('ja');
  check(await page.locator('#event-status').textContent()!==uncertainTR,'uncertain: state translates after locale change');
  app.mode('hold');await page.locator('form').evaluate(form=>{form.requestSubmit();form.requestSubmit()});await page.waitForFunction(()=>document.querySelector('form').getAttribute('aria-busy')==='true');
  await page.waitForTimeout(80);check(app.registrations.length===2,'sending: ignores double submit');
  await settings(page);await page.locator('#event-language').selectOption('fr');
  check(await page.locator('.event-submit').isDisabled(),'sending: locale rerender keeps submit disabled');
  check(app.registrations[0].idempotencyKey===app.registrations[1].idempotencyKey,'retry: same idempotency key');
  check(JSON.stringify(app.registrations[0])===JSON.stringify(app.registrations[1]),'retry: same body');
  app.release();await page.locator('.event-note[data-state=already_registered]').waitFor();
  check(await page.locator('form').count()===0,'duplicate: no second form');
  check(await page.locator('.event-note').textContent().then(text=>!text.includes('fixture@example.invalid')&&!text.includes('+39')),'success: no contact details exposed');
  await screenshot(page,'event-already-registered-320-fr.png');await app.context.close();
  const validationApp=await open({language:'tr',width:320,height:568});await fillValid(validationApp.page);validationApp.mode('invalidPhone');
  await validationApp.page.locator('form').evaluate(form=>form.requestSubmit());await validationApp.page.locator('[name=phone][aria-invalid=true]').waitFor();
  check(await validationApp.page.evaluate(()=>document.activeElement.name)==='phone','server validation: focus phone');
  check(await validationApp.page.locator('[name=phone]').getAttribute('aria-describedby').then(value=>value.includes('phone-hint')&&value.includes('phone-error')),'server validation: hint and error association');
  await screenshot(validationApp.page,'event-validation-320-tr.png');validationApp.mode('rate');await validationApp.page.locator('form').evaluate(form=>form.requestSubmit());await validationApp.page.locator('#event-status[data-state=rate]').waitFor();
  check(await validationApp.page.locator('[name=phone]').inputValue()==='+39 347 123 4567','rate limit: preserves phone');
  await validationApp.context.close();
  const landscape=await open({language:'ru',width:844,height:390});await fillValid(landscape.page);await settings(landscape.page);await screenshot(landscape.page,'event-landscape-settings-ru.png');await landscape.context.close();
  const zoom=await open({language:'fr',width:640,height:1136});await zoom.page.evaluate(()=>document.documentElement.style.zoom='2');await settings(zoom.page);
  check(await zoom.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'CSS 200% zoom: event reflows');await screenshot(zoom.page,'event-css-200-percent-fr.png');await zoom.context.close();
  for(const eventState of ['upcoming','full','closed','cancelled']) {
    const status=await open({eventState});check(await status.page.locator('.event-note[data-state='+eventState+']').count()===1,eventState+': distinct server state');check(await status.page.locator('form').count()===0,eventState+': registration unavailable');await status.context.close();
  }
  for(const language of languages) {
    const unavailable=await open({language,unavailable:true});check(await unavailable.page.locator('.event-note[data-state=unavailable]').count()===1,language+': unavailable');await unavailable.context.close();
    const boot=await open({language,boot:true});check(await boot.page.evaluate(()=>!window.__bootOptions),language+': no fake selected stop before route boot');
    check(await boot.page.locator('.fg-loading h1').textContent()!=='Walks could not load'||language==='en',language+': localized boot error');
    await boot.page.locator('.fg-loading button').last().click();await boot.page.waitForFunction(()=>window.__bootOptions);
    check(await boot.page.evaluate(()=>__bootOptions.routes.length===2&&__bootOptions.bundledNotice===true),language+': fallback only after actual bundled data');
    check(await boot.page.evaluate(()=>__bootOptions.lang)===language,language+': fallback locale');check(await boot.page.evaluate(()=>__gpsCalls===0),language+': fallback no automatic GPS');await boot.context.close();
  }
  const limited=await open({boot:true,language:'tr',width:320,height:568});
  await limited.page.locator('.fg-loading button').first().click();await limited.page.locator('.fg-loading h1').waitFor();await limited.page.locator('.fg-loading button').first().click();await limited.page.locator('.fg-loading h1').waitFor();
  check(await limited.page.locator('.fg-loading button').first().isDisabled(),'boot: three bounded online attempts');check(limited.bootRequests()===3,'boot: no automatic retry loop');await screenshot(limited.page,'boot-recovery-320-tr.png');await limited.context.close();
  for(const [query,saved,browserLanguages,expected] of [['FR-FR','tr',['it-IT'],'fr'],['xx','JA',['tr-TR'],'ja'],[null,'',['de-DE','ko-KR'],'ko'],[null,'',['ar'],'en']]) {
    const language=await open({boot:true,query,saved,browserLanguages});check(await language.page.evaluate(()=>document.documentElement.lang)===expected,'boot precedence: '+expected);await language.context.close();
  }
} finally {
  await browser.close();await writeFile(resolve(output,'verification.json'),JSON.stringify({createdAt:new Date().toISOString(),scope:'Controlled local browser interception only; no live API writes or physical keyboard/GPS acceptance. Boot recovery uses an isolated guide constructor, real bundled JSON, and actual entry.js.',checks,issues,errors,screenshots:['event-already-registered-320-fr.png','event-validation-320-tr.png','event-landscape-settings-ru.png','event-css-200-percent-fr.png','boot-recovery-320-tr.png']},null,2));
}
console.log(JSON.stringify({checks,issues,errors}));if(issues.length||errors.length)process.exitCode=1;
