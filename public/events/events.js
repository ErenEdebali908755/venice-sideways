const languages = ['en','tr','it','fr','ru','zh','ja','ko'];
const names = {en:'English',tr:'Türkçe',it:'Italiano',fr:'Français',ru:'Русский',zh:'简体中文',ja:'日本語',ko:'한국어'};
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
const loadingLabels = {en:'Loading event…',tr:'Etkinlik yükleniyor…',it:'Caricamento evento…',fr:'Chargement de l’événement…',ru:'Загрузка события…',zh:'正在加载活动…',ja:'イベントを読み込んでいます…',ko:'행사를 불러오는 중…'};

const root = document.getElementById('event-app');
const slug = /^\/events\/([a-z][a-z0-9-]{0,79})\/?$/.exec(location.pathname)?.[1];
const query = new URLSearchParams(location.search).get('lang');
let saved; try { saved = localStorage.getItem('sideways-language'); } catch {}
let lang = languages.includes(query) ? query : languages.includes(saved) ? saved :
  (navigator.languages || [navigator.language]).map(value => value.toLowerCase().split('-')[0]).find(value => languages.includes(value)) || 'en';
let theme; try { theme = localStorage.getItem('sideways-field-guide-theme'); } catch {}
theme = ['light','dark','system'].includes(theme) ? theme : 'system';
let event = null, state = '', idempotencyKey = crypto.randomUUID(), pending = !!slug;
const media = matchMedia('(prefers-color-scheme: dark)');
const t = key => labels[lang][key];
function applyTheme() {
  root.dataset.theme = theme === 'dark' || (theme === 'system' && media.matches) ? 'dark' : 'light';
  document.documentElement.style.colorScheme = root.dataset.theme;
}
media.addEventListener('change', applyTheme);
const dateLabel = value => new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : lang === 'ko' ? 'ko-KR' : lang,
  { timeZone: 'Europe/Rome', dateStyle: 'full' }).format(new Date(value + 'T12:00:00Z'));
const timeLabel = value => value ? new Intl.DateTimeFormat(lang, { timeZone: 'Europe/Rome', timeStyle: 'short' }).format(new Date(value)) : t('tba');
const el = (tag, className, content) => { const node = document.createElement(tag); if (className) node.className = className; if (content != null) node.textContent = content; return node; };
function render() {
  const values = Object.fromEntries([...root.querySelectorAll('form [name]')].map(node => [node.name, node.value]));
  document.documentElement.lang = lang;
  root.className = 'event-app'; applyTheme();
  root.replaceChildren();
  const wrap = el('div','event-wrap'); root.append(wrap);
  const header = el('header','event-header'); wrap.append(header);
  const brand = el('a','event-brand'); brand.href = '/?lang=' + lang;
  const mark = el('img'); mark.src = '/field-guide/yana-mark.svg'; mark.alt = '';
  brand.append(mark, el('span','', 'Venice Sideways')); header.append(brand);
  const tools = el('div','event-header-tools'); header.append(tools);
  const back = el('a','',t('back')); back.href = '/?lang=' + lang; tools.append(back);
  const language = el('select'); language.setAttribute('aria-label',t('lang'));
  for (const code of languages) { const option = new Option(names[code],code); language.add(option); }
  language.value = lang; tools.append(language);
  language.onchange = () => { lang = language.value; try { localStorage.setItem('sideways-language',lang); } catch {}
    const url = new URL(location.href); url.searchParams.set('lang',lang); history.replaceState(null,'',url); render(); };
  const themeSelect = el('select'); themeSelect.setAttribute('aria-label',t('theme'));
  for (const key of ['system','light','dark']) themeSelect.add(new Option(t(key),key));
  themeSelect.value = theme; tools.append(themeSelect);
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
    meta.append(el('p','',event.capacity == null ? t('unlimited') : `${t('capacity')}: ${event.remaining}`));
    const walk = el('a','',t('walk') + ' ↗'); walk.href = '/?lang=' + lang + '#route=' + encodeURIComponent(event.routeKey); intro.append(walk);
    const share = el('div','event-share'); intro.append(share);
    const linkLabel = el('label','',t('share')); linkLabel.htmlFor = 'event-link'; share.append(linkLabel);
    const link = el('input'); link.id = 'event-link'; link.readOnly = true; link.value = 'https://venicesideways.com/events/' + event.slug; share.append(link);
    const copy = el('button','',t('copy')); copy.type = 'button'; copy.onclick = async () => { try { await navigator.clipboard.writeText(link.value); copy.textContent = t('copied'); } catch { link.select(); } }; share.append(copy);
  }
  const card = el('section','event-card'); main.append(card);
  card.append(el('h2','',t('join')));
  if (!event) card.append(el('p','event-note',pending ? loadingLabels[lang] : t('unavailable')));
  else if (state === 'registered' || state === 'already_registered') card.append(el('p','event-note',`${t(state === 'registered' ? 'success' : 'duplicate')} ${event.translations?.[lang]?.title || event.translations?.en?.title} · ${dateLabel(event.eventDate)}`));
  else if (event.state !== 'open') card.append(el('p','event-note',t(event.state)));
  else {
    const form = el('form','event-form'); form.noValidate = true; card.append(form);
    const field = (key,type,required,placeholder) => { const label = el('label','',t(key)); if (!required) label.append(el('small','',t('optional')));
      const input = el('input'); input.name = key === 'first' ? 'firstName' : key === 'last' ? 'lastName' : key; input.type = type; input.required = required; input.autocomplete = input.name === 'firstName' ? 'given-name' : input.name === 'lastName' ? 'family-name' : input.name === 'phone' ? 'tel' : 'email'; if (placeholder) input.placeholder = placeholder;
      input.value = values[input.name] || ''; label.append(input); form.append(label); return input; };
    const first = field('first','text',true,''); const last = field('last','text',true,'');
    const phone = field('phone','tel',true,'+39 312 345 6789'); phone.inputMode = 'tel'; phone.setAttribute('aria-describedby','phone-hint');
    const hint = el('small','',t('phoneHint')); hint.id = 'phone-hint'; form.append(hint);
    const email = field('email','email',false,'');
    const genderLabel = el('label','',t('gender')); genderLabel.append(el('small','',t('optional')));
    const gender = el('select'); gender.name = 'gender'; for (const [value,key] of [['','choose'],['woman','woman'],['man','man'],['nonbinary','nonbinary'],['prefer_not_to_say','prefer']]) gender.add(new Option(t(key),value)); gender.value = values.gender || ''; genderLabel.append(gender); form.append(genderLabel);
    const privacy = el('p','event-privacy',t('privacy') + ' '); const contact = el('a','',event.privacyContact); contact.href = 'mailto:' + event.privacyContact; privacy.append(contact); form.append(privacy);
    const status = el('p','event-error',''); status.setAttribute('role','alert'); form.append(status);
    const submit = el('button','',t('submit')); submit.type = 'submit'; form.append(submit);
    form.addEventListener('input', () => { idempotencyKey = crypto.randomUUID(); status.textContent = ''; });
    form.onsubmit = async e => {
      e.preventDefault();
      const nameOk = value => /^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}'’.-]*$/u.test(value.trim()) && value.trim().length <= 80;
      if (!nameOk(first.value) || !nameOk(last.value)) { status.textContent = t('invalidName'); (!nameOk(first.value) ? first : last).focus(); return; }
      if (!/^\+[1-9][\d\s().-]{7,25}$/.test(phone.value.trim())) { status.textContent = t('invalidPhone'); phone.focus(); return; }
      if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { status.textContent = t('invalidEmail'); email.focus(); return; }
      submit.disabled = true; submit.textContent = t('sending'); status.textContent = '';
      try {
        const response = await fetch('/api/events/' + event.slug + '/register', {method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify({firstName:first.value,lastName:last.value,phone:phone.value,email:email.value,gender:gender.value,idempotencyKey})});
        if (!response.ok) { const data = await response.json().catch(() => null); status.textContent = t(labels[lang][data?.error] ? data.error : 'error'); return; }
        const result = await response.json(); state = result.result; render();
      } catch { status.textContent = t('error'); }
      finally { submit.disabled = false; submit.textContent = t('submit'); }
    };
  }
  wrap.append(el('footer','event-footer','Venice Sideways · Venezia'));
}
render();
if (slug) fetch('/api/events/' + slug,{credentials:'omit',cache:'no-store'}).then(async response => { if (!response.ok) throw Error(); event = await response.json(); pending = false; render(); }).catch(() => { pending = false; render(); });
