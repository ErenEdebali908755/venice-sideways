const languages = ['en','tr','it','fr','ru','zh','ja','ko'];
const names = {en:'English',tr:'Türkçe',it:'Italiano',fr:'Français',ru:'Русский',zh:'中文',ja:'日本語',ko:'한국어'};
const labels = {
en:{back:'Back to walks',event:'Venice Sideways event',date:'Date',time:'Meeting time',tba:'To be announced',join:'Join this walk',first:'First name',last:'Last name',phone:'Phone with country code',phoneHint:'For example +39 312 345 6789. Include the + and country code.',email:'Email',optional:'Optional',gender:'Gender',choose:'No answer',woman:'Woman',man:'Man',nonbinary:'Non-binary',prefer:'Prefer not to say',privacy:'Your name, phone number and any optional details are used only to manage this event by Venice Sideways organizers. They are deleted 180 days after the event. For access or deletion requests, write to',submit:'Register',sending:'Sending…',success:'You are registered for',duplicate:'This registration was already received for',closed:'Registration is closed.',full:'Registration is full.',cancelled:'This event has been cancelled.',upcoming:'Registration has not opened yet.',unavailable:'This event is unavailable.',error:'Could not submit. Please try again.',invalidName:'Enter a valid first and last name.',invalidPhone:'Enter a valid full phone number starting with + and country code.',invalidEmail:'Check the email address.',rate:'Too many attempts. Please try again later.',share:'Event link',copy:'Copy link',copied:'Copied',theme:'Theme',system:'System',light:'Light',dark:'Dark',lang:'Language',walk:'Explore the walk',capacity:'Places left',unlimited:'No capacity limit'},
tr:{back:'Yürüyüşlere dön',event:'Venice Sideways etkinliği',date:'Tarih',time:'Buluşma saati',tba:'Daha sonra duyurulacak',join:'Yürüyüşe katıl',first:'Ad',last:'Soyad',phone:'Ülke koduyla telefon',phoneHint:'Örneğin +39 312 345 6789. + ve ülke kodunu yaz.',email:'E-posta',optional:'İsteğe bağlı',gender:'Cinsiyet',choose:'Yanıt vermiyorum',woman:'Kadın',man:'Erkek',nonbinary:'İkili olmayan',prefer:'Belirtmek istemiyorum',privacy:'Adın, telefon numaran ve isteğe bağlı verdiğin bilgiler yalnızca Venice Sideways düzenleyicileri tarafından bu etkinliği yönetmek için kullanılır. Etkinlikten 180 gün sonra silinir. Verilerine erişmek veya sildirmek için yaz:',submit:'Kaydol',sending:'Gönderiliyor…',success:'Kaydın alındı:',duplicate:'Bu etkinlik için kaydın zaten alınmış:',closed:'Kayıt kapandı.',full:'Kontenjan doldu.',cancelled:'Bu etkinlik iptal edildi.',upcoming:'Kayıt henüz açılmadı.',unavailable:'Bu etkinlik şu an kullanılamıyor.',error:'Kayıt gönderilemedi. Lütfen tekrar dene.',invalidName:'Geçerli bir ad ve soyad gir.',invalidPhone:'Ülke kodu ve + ile başlayan geçerli bir numara gir.',invalidEmail:'E-posta adresini kontrol et.',rate:'Çok fazla deneme yapıldı. Daha sonra tekrar dene.',share:'Etkinlik bağlantısı',copy:'Bağlantıyı kopyala',copied:'Kopyalandı',theme:'Tema',system:'Sistem',light:'Açık',dark:'Koyu',lang:'Dil',walk:'Yürüyüşü keşfet',capacity:'Kalan yer',unlimited:'Kontenjan sınırı yok'},
it:{back:'Torna alle passeggiate',event:'Evento Venice Sideways',date:'Data',time:'Ora di ritrovo',tba:'Da comunicare',join:'Partecipa alla passeggiata',first:'Nome',last:'Cognome',phone:'Telefono con prefisso internazionale',phoneHint:'Per esempio +39 312 345 6789. Includi + e prefisso.',email:'Email',optional:'Facoltativo',gender:'Genere',choose:'Nessuna risposta',woman:'Donna',man:'Uomo',nonbinary:'Non binario',prefer:'Preferisco non dirlo',privacy:'Nome, numero di telefono e dati facoltativi sono usati solo dagli organizzatori di Venice Sideways per gestire questo evento. Vengono eliminati 180 giorni dopo l’evento. Per accesso o cancellazione scrivi a',submit:'Iscriviti',sending:'Invio…',success:'Iscrizione confermata per',duplicate:'Questa iscrizione è già stata ricevuta per',closed:'Le iscrizioni sono chiuse.',full:'I posti sono esauriti.',cancelled:'L’evento è stato annullato.',upcoming:'Le iscrizioni non sono ancora aperte.',unavailable:'Evento non disponibile.',error:'Invio non riuscito. Riprova.',invalidName:'Inserisci nome e cognome validi.',invalidPhone:'Inserisci un numero completo con + e prefisso internazionale.',invalidEmail:'Controlla l’indirizzo email.',rate:'Troppi tentativi. Riprova più tardi.',share:'Link dell’evento',copy:'Copia link',copied:'Copiato',theme:'Tema',system:'Sistema',light:'Chiaro',dark:'Scuro',lang:'Lingua',walk:'Esplora il percorso',capacity:'Posti rimasti',unlimited:'Nessun limite di posti'},
fr:{back:'Retour aux promenades',event:'Événement Venice Sideways',date:'Date',time:'Heure du rendez-vous',tba:'À venir',join:'Participer à la promenade',first:'Prénom',last:'Nom',phone:'Téléphone avec indicatif',phoneHint:'Par exemple +39 312 345 6789. Indiquez + et l’indicatif.',email:'E-mail',optional:'Facultatif',gender:'Genre',choose:'Ne pas répondre',woman:'Femme',man:'Homme',nonbinary:'Non binaire',prefer:'Je préfère ne pas répondre',privacy:'Votre nom, votre téléphone et les informations facultatives servent uniquement aux organisateurs de Venice Sideways pour gérer cet événement. Ils sont supprimés 180 jours après l’événement. Pour accéder à vos données ou demander leur suppression, écrivez à',submit:'S’inscrire',sending:'Envoi…',success:'Inscription confirmée pour',duplicate:'Cette inscription a déjà été reçue pour',closed:'Les inscriptions sont closes.',full:'Il n’y a plus de places.',cancelled:'Cet événement est annulé.',upcoming:'Les inscriptions ne sont pas encore ouvertes.',unavailable:'Événement indisponible.',error:'Envoi impossible. Réessayez.',invalidName:'Saisissez un prénom et un nom valides.',invalidPhone:'Saisissez un numéro complet avec + et indicatif.',invalidEmail:'Vérifiez l’adresse e-mail.',rate:'Trop de tentatives. Réessayez plus tard.',share:'Lien de l’événement',copy:'Copier le lien',copied:'Copié',theme:'Thème',system:'Système',light:'Clair',dark:'Sombre',lang:'Langue',walk:'Explorer la promenade',capacity:'Places restantes',unlimited:'Aucune limite de places'},
ru:{back:'К маршрутам',event:'Событие Venice Sideways',date:'Дата',time:'Время встречи',tba:'Будет объявлено позже',join:'Присоединиться к прогулке',first:'Имя',last:'Фамилия',phone:'Телефон с кодом страны',phoneHint:'Например, +39 312 345 6789. Укажите + и код страны.',email:'Эл. почта',optional:'Необязательно',gender:'Гендер',choose:'Не отвечать',woman:'Женщина',man:'Мужчина',nonbinary:'Небинарный',prefer:'Предпочитаю не указывать',privacy:'Имя, телефон и необязательные сведения используются организаторами Venice Sideways только для проведения этого события. Они удаляются через 180 дней после события. Запросить доступ или удаление можно по адресу',submit:'Зарегистрироваться',sending:'Отправка…',success:'Вы зарегистрированы на',duplicate:'Регистрация уже получена для',closed:'Регистрация закрыта.',full:'Свободных мест нет.',cancelled:'Событие отменено.',upcoming:'Регистрация ещё не открыта.',unavailable:'Событие недоступно.',error:'Не удалось отправить. Повторите попытку.',invalidName:'Укажите корректные имя и фамилию.',invalidPhone:'Укажите полный номер с + и кодом страны.',invalidEmail:'Проверьте адрес электронной почты.',rate:'Слишком много попыток. Попробуйте позже.',share:'Ссылка на событие',copy:'Копировать ссылку',copied:'Скопировано',theme:'Тема',system:'Системная',light:'Светлая',dark:'Тёмная',lang:'Язык',walk:'Открыть маршрут',capacity:'Осталось мест',unlimited:'Без ограничения мест'},
zh:{back:'返回步行路线',event:'Venice Sideways 活动',date:'日期',time:'集合时间',tba:'稍后公布',join:'报名参加',first:'名',last:'姓',phone:'含国家代码的电话号码',phoneHint:'例如 +39 312 345 6789。请填写 + 和国家代码。',email:'电子邮箱',optional:'选填',gender:'性别',choose:'不回答',woman:'女性',man:'男性',nonbinary:'非二元性别',prefer:'不愿透露',privacy:'姓名、电话及选填信息仅供 Venice Sideways 组织者管理本次活动使用，并将在活动结束 180 天后删除。如需查阅或删除，请联系',submit:'提交报名',sending:'正在提交…',success:'已报名参加',duplicate:'您已报名参加',closed:'报名已结束。',full:'名额已满。',cancelled:'活动已取消。',upcoming:'报名尚未开始。',unavailable:'此活动暂不可用。',error:'提交失败，请重试。',invalidName:'请输入有效的姓和名。',invalidPhone:'请输入以 + 和国家代码开头的完整电话号码。',invalidEmail:'请检查邮箱地址。',rate:'尝试次数过多，请稍后重试。',share:'活动链接',copy:'复制链接',copied:'已复制',theme:'主题',system:'跟随系统',light:'浅色',dark:'深色',lang:'语言',walk:'查看路线',capacity:'剩余名额',unlimited:'不限人数'},
ja:{back:'散歩コースに戻る',event:'Venice Sideways イベント',date:'日付',time:'集合時刻',tba:'後日お知らせします',join:'この散歩に参加',first:'名',last:'姓',phone:'国番号付き電話番号',phoneHint:'例: +39 312 345 6789。+ と国番号を入力してください。',email:'メールアドレス',optional:'任意',gender:'性別',choose:'回答しない',woman:'女性',man:'男性',nonbinary:'ノンバイナリー',prefer:'回答を控える',privacy:'氏名、電話番号および任意の情報は、Venice Sideways の主催者がこのイベントを運営するためにのみ使用します。イベントの180日後に削除します。開示や削除の依頼先:',submit:'申し込む',sending:'送信中…',success:'申し込みを受け付けました:',duplicate:'このイベントへの申し込みは受け付け済みです:',closed:'申し込みは締め切りました。',full:'定員に達しました。',cancelled:'このイベントは中止されました。',upcoming:'申し込みはまだ始まっていません。',unavailable:'イベントを表示できません。',error:'送信できませんでした。もう一度お試しください。',invalidName:'有効な姓と名を入力してください。',invalidPhone:'国番号と + を含む電話番号を入力してください。',invalidEmail:'メールアドレスをご確認ください。',rate:'試行回数が多すぎます。後ほどお試しください。',share:'イベントのリンク',copy:'リンクをコピー',copied:'コピーしました',theme:'テーマ',system:'システム',light:'ライト',dark:'ダーク',lang:'言語',walk:'コースを見る',capacity:'残りの枠',unlimited:'定員なし'},
ko:{back:'산책 코스로 돌아가기',event:'Venice Sideways 행사',date:'날짜',time:'모임 시간',tba:'추후 안내',join:'산책 참가 신청',first:'이름',last:'성',phone:'국가번호를 포함한 전화번호',phoneHint:'예: +39 312 345 6789. +와 국가번호를 입력하세요.',email:'이메일',optional:'선택 사항',gender:'성별',choose:'응답하지 않음',woman:'여성',man:'남성',nonbinary:'논바이너리',prefer:'밝히고 싶지 않음',privacy:'이름, 전화번호 및 선택 정보는 Venice Sideways 주최자가 이 행사를 운영하는 데에만 사용합니다. 행사 180일 후 삭제합니다. 열람 또는 삭제 요청:',submit:'신청하기',sending:'전송 중…',success:'신청이 완료되었습니다:',duplicate:'이미 신청이 접수되었습니다:',closed:'신청이 마감되었습니다.',full:'정원이 찼습니다.',cancelled:'행사가 취소되었습니다.',upcoming:'아직 신청이 시작되지 않았습니다.',unavailable:'행사를 이용할 수 없습니다.',error:'전송하지 못했습니다. 다시 시도하세요.',invalidName:'올바른 이름과 성을 입력하세요.',invalidPhone:'+와 국가번호로 시작하는 전체 전화번호를 입력하세요.',invalidEmail:'이메일 주소를 확인하세요.',rate:'시도 횟수가 너무 많습니다. 나중에 다시 시도하세요.',share:'행사 링크',copy:'링크 복사',copied:'복사됨',theme:'테마',system:'시스템',light:'라이트',dark:'다크',lang:'언어',walk:'산책 코스 보기',capacity:'남은 자리',unlimited:'인원 제한 없음'}
};
const extraLabels = {
  en:{loading:'Loading event…',settings:'Settings',required:'Required',validation:'Check the highlighted fields.',uncertain:'Your registration could not be confirmed. It may have been received. Retry with the same details to check without creating another registration.',retry:'Retry safely'},
  tr:{loading:'Etkinlik yükleniyor…',settings:'Ayarlar',required:'Zorunlu',validation:'İşaretlenen alanları kontrol et.',uncertain:'Kaydın doğrulanamadı; alınmış olabilir. Yeni kayıt oluşturmadan kontrol etmek için aynı bilgilerle tekrar dene.',retry:'Güvenle tekrar dene'},
  it:{loading:'Caricamento evento…',settings:'Impostazioni',required:'Obbligatorio',validation:'Controlla i campi evidenziati.',uncertain:'Non è stato possibile confermare l’iscrizione. Potrebbe essere stata ricevuta. Riprova con gli stessi dati per verificarla senza crearne un’altra.',retry:'Riprova in sicurezza'},
  fr:{loading:'Chargement de l’événement…',settings:'Réglages',required:'Obligatoire',validation:'Vérifiez les champs signalés.',uncertain:'Votre inscription n’a pas pu être confirmée. Elle a peut-être été reçue. Réessayez avec les mêmes informations pour vérifier sans créer une autre inscription.',retry:'Réessayer en sécurité'},
  ru:{loading:'Загрузка события…',settings:'Настройки',required:'Обязательно',validation:'Проверьте отмеченные поля.',uncertain:'Не удалось подтвердить регистрацию. Она могла быть получена. Повторите с теми же данными, чтобы проверить без новой регистрации.',retry:'Повторить безопасно'},
  zh:{loading:'正在加载活动…',settings:'设置',required:'必填',validation:'请检查标出的字段。',uncertain:'无法确认报名是否成功，报名可能已收到。请使用相同信息重试，以查询结果而不重复报名。',retry:'安全重试'},
  ja:{loading:'イベントを読み込んでいます…',settings:'設定',required:'必須',validation:'表示された入力欄をご確認ください。',uncertain:'申し込みを確認できませんでした。受け付けられている可能性があります。同じ内容で再試行すると、重複せずに確認できます。',retry:'安全に再試行'},
  ko:{loading:'행사를 불러오는 중…',settings:'설정',required:'필수',validation:'표시된 입력란을 확인하세요.',uncertain:'신청 결과를 확인할 수 없습니다. 이미 접수되었을 수 있습니다. 같은 정보로 다시 시도하면 중복 신청 없이 확인할 수 있습니다.',retry:'안전하게 다시 시도'}
};
for (const code of languages) Object.assign(labels[code],extraLabels[code]);
const root = document.getElementById('event-app');
const slug = /^\/events\/([a-z][a-z0-9-]{0,79})\/?$/.exec(location.pathname)?.[1];
const normalizeLanguage = value => typeof value === 'string' ? value.toLowerCase().split(/[-_]/)[0] : '';
const query = normalizeLanguage(new URLSearchParams(location.search).get('lang'));
let saved; try { saved = normalizeLanguage(localStorage.getItem('sideways-language')); } catch {}
let lang = languages.includes(query) ? query : languages.includes(saved) ? saved :
  (navigator.languages || [navigator.language]).map(normalizeLanguage).find(value => languages.includes(value)) || 'en';
let theme; try { theme = localStorage.getItem('sideways-field-guide-theme'); } catch {}
theme = ['light','dark','system'].includes(theme) ? theme : 'system';
let event = null, state = '', idempotencyKey = crypto.randomUUID(), pending = !!slug, sending = false;
let message = '', fieldErrors = {}, settingsOpen = false;
// PII stays in this document's memory and the registration request only.
const draft = {firstName:'',lastName:'',phone:'',email:'',gender:''};
const media = matchMedia('(prefers-color-scheme: dark)');
const t = key => labels[lang][key] || labels[lang].unavailable;
function applyTheme() {
  root.dataset.theme = theme === 'dark' || (theme === 'system' && media.matches) ? 'dark' : 'light';
  document.documentElement.style.colorScheme = root.dataset.theme;
}
media.addEventListener('change', applyTheme);
const dateLabel = value => new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : lang === 'ko' ? 'ko-KR' : lang,
  { timeZone: 'Europe/Rome', dateStyle: 'full' }).format(new Date(value + 'T12:00:00Z'));
const timeLabel = value => value ? new Intl.DateTimeFormat(lang, { timeZone: 'Europe/Rome', timeStyle: 'short' }).format(new Date(value)) : t('tba');
const el = (tag, className, content) => { const node = document.createElement(tag); if (className) node.className = className; if (content != null) node.textContent = content; return node; };
const nameOk = value => /^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}'’.-]*$/u.test(value.trim()) && value.trim().length <= 80;
function validate() {
  const errors = {};
  for (const key of ['firstName','lastName']) if (!nameOk(draft[key])) errors[key] = 'invalidName';
  if (!/^\+[1-9]\d{7,14}$/.test(draft.phone.replace(/[\s().-]/g,''))) errors.phone = 'invalidPhone';
  if (draft.email && (draft.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))) errors.email = 'invalidEmail';
  return errors;
}
function focusField(name) {
  const field = root.querySelector('[name="' + name + '"]');
  field?.focus(); field?.scrollIntoView({block:'center',behavior:'auto'});
}
function render({focusID,focusName} = {}) {
  const focused = document.activeElement;
  const previousID = focusID || (root.contains(focused) ? focused.id : '');
  const previousName = focusName || (root.contains(focused) ? focused.name : '');
  document.documentElement.lang = lang;
  root.className = 'event-app'; applyTheme(); root.replaceChildren();
  const wrap = el('div','event-wrap'); root.append(wrap);
  const header = el('header','event-header'); wrap.append(header);
  const brand = el('a','event-brand'); brand.href = '/?lang=' + lang;
  const mark = el('img'); mark.src = '/field-guide/yana-mark.svg'; mark.alt = ''; mark.width=36; mark.height=36;
  brand.append(mark, el('span','', 'Venice Sideways')); header.append(brand);
  const tools = el('div','event-header-tools'); header.append(tools);
  const back = el('a','event-back',t('back')); back.href = '/?lang=' + lang; tools.append(back);
  const settings = el('details','event-settings'); settings.open = settingsOpen; tools.append(settings);
  settings.append(el('summary','',t('settings')));
  settings.addEventListener('toggle',()=>{settingsOpen=settings.open});
  settings.addEventListener('keydown',e=>{if(e.key==='Escape'&&settings.open){e.preventDefault();settings.open=false;settingsOpen=false;settings.querySelector('summary').focus();}});
  const settingsFields=el('div','event-settings-fields');settings.append(settingsFields);
  const languageLabel=el('label','',t('lang'));settingsFields.append(languageLabel);
  const language = el('select'); language.id='event-language'; language.setAttribute('aria-label',t('lang'));
  for (const code of languages) language.add(new Option(names[code],code));
  language.value = lang; languageLabel.append(language);
  language.onchange = () => { lang = language.value; settingsOpen=settings.open; try { localStorage.setItem('sideways-language',lang); } catch {}
    const url = new URL(location.href); url.searchParams.set('lang',lang); history.replaceState(null,'',url); render({focusID:'event-language'}); };
  const themeLabel=el('label','',t('theme'));settingsFields.append(themeLabel);
  const themeSelect = el('select'); themeSelect.id='event-theme'; themeSelect.setAttribute('aria-label',t('theme'));
  for (const key of ['system','light','dark']) themeSelect.add(new Option(t(key),key));
  themeSelect.value = theme; themeLabel.append(themeSelect);
  themeSelect.onchange = () => { theme = themeSelect.value; try { localStorage.setItem('sideways-field-guide-theme',theme); } catch {} applyTheme(); };
  const main = el('div','event-main'); wrap.append(main);
  const intro = el('section'); main.append(intro);
  intro.append(el('span','event-kicker',t('event')));
  intro.append(el('h1','',event?.translations?.[lang]?.title || event?.translations?.en?.title || 'Venice Sideways'));
  if (event) {
    intro.append(el('p','event-description',event.translations?.[lang]?.description || event.translations?.en?.description || ''));
    const meta = el('div','event-meta'); intro.append(meta);
    const day = el('p'); day.append(el('strong','',t('date')),document.createTextNode(dateLabel(event.eventDate))); meta.append(day);
    const time = el('p'); time.append(el('strong','',t('time')),document.createTextNode(timeLabel(event.startAt))); meta.append(time);
    meta.append(el('p','',event.capacity == null ? t('unlimited') : t('capacity') + ': ' + event.remaining));
    const walk = el('a','event-walk',t('walk') + ' ↗'); walk.href = '/?lang=' + lang + '#route=' + encodeURIComponent(event.routeKey); intro.append(walk);
    const share = el('div','event-share'); intro.append(share);
    const linkLabel = el('label','',t('share')); linkLabel.htmlFor = 'event-link'; share.append(linkLabel);
    const link = el('input'); link.id = 'event-link'; link.readOnly = true; link.value = 'https://venicesideways.com/events/' + event.slug; share.append(link);
    const copy = el('button','',t('copy')); copy.type = 'button'; copy.onclick = async () => { try { await navigator.clipboard.writeText(link.value); copy.textContent = t('copied'); } catch { link.select(); } }; share.append(copy);
  }
  const card = el('section','event-card'); main.append(card); card.append(el('h2','',t('join')));
  const note = (text,kind) => {const node=el('p','event-note',text);node.dataset.state=kind;node.setAttribute('role','status');node.tabIndex=-1;card.append(node);return node;};
  if (!event) note(pending ? t('loading') : t('unavailable'),pending?'loading':'unavailable');
  else if (state === 'registered' || state === 'already_registered') note(t(state === 'registered' ? 'success' : 'duplicate') + ' ' + (event.translations?.[lang]?.title || event.translations?.en?.title) + ' · ' + dateLabel(event.eventDate),state);
  else if (event.state !== 'open') note(t(event.state),event.state);
  else {
    const form = el('form','event-form'); form.noValidate = true; form.setAttribute('aria-busy',String(sending)); card.append(form);
    const field = (key,name,type,required,placeholder) => {
      const label = el('label','event-field',t(key)); label.htmlFor='event-'+name;
      label.append(el('small','',t(required?'required':'optional')));
      const input=el('input');input.id='event-'+name;input.name=name;input.type=type;input.required=required;
      input.autocomplete=name==='firstName'?'given-name':name==='lastName'?'family-name':name==='phone'?'tel':'email';
      input.maxLength=name==='phone'?40:name==='email'?254:80;input.disabled=sending;input.value=draft[name];if(placeholder)input.placeholder=placeholder;
      const error=el('small','event-field-error',fieldErrors[name]?t(fieldErrors[name]):'');error.id=input.id+'-error';
      input.setAttribute('aria-invalid',String(!!fieldErrors[name]));input.setAttribute('aria-describedby',error.id + (name==='phone'?' phone-hint':''));
      label.append(input,error);form.append(label);return input;
    };
    field('first','firstName','text',true,'');field('last','lastName','text',true,'');
    const phone=field('phone','phone','tel',true,'+39 312 345 6789');phone.inputMode='tel';
    const hint=el('small','event-hint',t('phoneHint'));hint.id='phone-hint';phone.closest('label').append(hint);
    field('email','email','email',false,'');
    const genderLabel=el('label','event-field',t('gender'));genderLabel.htmlFor='event-gender';genderLabel.append(el('small','',t('optional')));
    const gender=el('select');gender.id='event-gender';gender.name='gender';gender.disabled=sending;
    for(const [value,key] of [['','choose'],['woman','woman'],['man','man'],['nonbinary','nonbinary'],['prefer_not_to_say','prefer']])gender.add(new Option(t(key),value));
    gender.value=draft.gender;genderLabel.append(gender);form.append(genderLabel);
    const privacy=el('p','event-privacy',t('privacy')+' ');const contact=el('a','',event.privacyContact);contact.href='mailto:'+event.privacyContact;privacy.append(contact);form.append(privacy);
    const status=el('p','event-error',message?t(message):'');status.id='event-status';status.setAttribute('role','alert');status.dataset.state=message;form.append(status);
    const submit=el('button','event-submit',t(sending?'sending':message==='uncertain'?'retry':'submit'));submit.type='submit';submit.disabled=sending;form.append(submit);
    const edit=e=>{
      const field=e.target;if(!(field.name in draft)||draft[field.name]===field.value)return;
      draft[field.name]=field.value;idempotencyKey=crypto.randomUUID();delete fieldErrors[field.name];
      field.setAttribute('aria-invalid','false');const error=document.getElementById(field.id+'-error');if(error)error.textContent='';
      message='';status.textContent='';status.dataset.state='';submit.textContent=t('submit');
    };
    form.addEventListener('input',edit);form.addEventListener('change',edit);
    form.onsubmit=async e=>{
      e.preventDefault();if(sending)return;
      fieldErrors=validate();if(Object.keys(fieldErrors).length){message='validation';render();focusField(Object.keys(fieldErrors)[0]);return;}
      sending=true;message='';const attempt={...draft,idempotencyKey};render();
      try{
        const response=await fetch('/api/events/'+event.slug+'/register',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',signal:AbortSignal.timeout(12000),body:JSON.stringify(attempt)});
        const result=await response.json().catch(()=>null);
        if(response.ok){
          if(!['registered','already_registered'].includes(result?.result)||result?.event?.slug!==event.slug){message='uncertain';}
          else state=result.result;
        }else{
          const code=result?.error;
          if(['full','closed','cancelled','upcoming'].includes(code)){event.state=code;}
          else if(['invalidName','invalidPhone','invalidEmail'].includes(code)){
            fieldErrors=code==='invalidName'?{firstName:code,lastName:code}:{[code==='invalidPhone'?'phone':'email']:code};message='validation';
          }else if(response.status===429||code==='rate'||code==='rate_limit'){message='rate';}
          else if(response.status>=500||!result){message='uncertain';}
          else message='error';
        }
      }catch{message='uncertain';}
      finally{sending=false;render();if(Object.keys(fieldErrors).length)focusField(Object.keys(fieldErrors)[0]);else if(state)root.querySelector('.event-note')?.focus();}
    };
  }
  wrap.append(el('footer','event-footer','Venice Sideways · Venezia'));
  if(previousID)document.getElementById(previousID)?.focus({preventScroll:true});
  else if(previousName)root.querySelector('[name="'+previousName+'"]')?.focus({preventScroll:true});
}
render();
if(slug)fetch('/api/events/'+slug,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000)}).then(async response=>{
  if(!response.ok)throw Error();const result=await response.json();
  if(result?.slug!==slug||!['open','upcoming','full','closed','cancelled'].includes(result.state))throw Error();
  event=result;pending=false;render();
}).catch(()=>{pending=false;render();});
