/* Main-walk extension only: preserve the 28-stop route, map provider and five ideas.
   Load after the language runtime so new route copy is available in every locale. */
(() => {
  'use strict';
  const MAIN = ['lucia','giacomo','frari','margherita','barnaba','trovaso','zattere','accademia','elena','rialto','guglie','majer','ghetto','trearchi','ormesini','vino'];
  const plan = 'A longer walk through Dorsoduro, across Ponte dell’Accademia to Sant’Elena, then back through Rialto and Cannaregio to Vino Vero. This is no longer a short first meetup: allow a full day with photo and rest breaks. Distance and walking estimates appear only after street routing succeeds. Majer and the Tre Archi evening-light pause stay on the route.';
  const intro = 'The Main Walk now includes the Accademia Bridge and Sant’Elena before returning to Vino Vero. The Full 28-Stop Walk remains separate and ends at Sant’Elena. Pins are places to notice, not compulsory group stops.';
  const bridgeAbout = 'Cross Ponte dell’Accademia from Dorsoduro towards San Marco before continuing to Sant’Elena. Keep the bridge and steps clear; regroup on a public approach. This stop is the bridge itself, not the gallery or vaporetto stop.';
  const elenaAbout = 'Pause by the waterfront and Parco delle Rimembranze at Sant’Elena. On the Main Walk this is an intermediate stop, not the finish: continue back towards Rialto, then through Cannaregio to Vino Vero. The eastward detour adds substantial walking.';
  const routeNote = 'The 16-stop Main Walk has 4 mobile-friendly Google Maps parts; the Full 28-Stop Walk has 7. Shared end/start stops keep each route continuous. One supported directions link cannot contain every stop in either walk.';

  // The UI row format is English | Turkish | Russian | French | Simplified Chinese | Japanese | Korean.
  // Proper place names remain unchanged so they match signage and navigation.
  WalkI18n.registerUI([
    [plan,
      'Dorsoduro’dan Accademia Köprüsü üzerinden Sant’Elena’ya uzanan, ardından Rialto ve Cannaregio üzerinden Vino Vero’ya dönen uzun bir yürüyüş. Bu artık kısa bir ilk buluşma rotası değil; fotoğraf ve dinlenme molalarıyla tam gün ayır. Mesafe ve yürüyüş tahmini ancak sokak güzergâhı hesaplanınca gösterilir. Majer ve Tre Archi’deki akşam ışığı molası rotada kalıyor.',
      'Длинная прогулка через Dorsoduro и мост Ponte dell’Accademia до Sant’Elena, затем обратно через Rialto и Cannaregio к Vino Vero. Это уже не короткая первая встреча: выделите целый день с перерывами на съёмку и отдых. Расстояние и время ходьбы появятся после расчёта маршрута по улицам. Majer и остановка ради вечернего света у Tre Archi остаются на маршруте.',
      'Une longue promenade à travers Dorsoduro, puis par le pont de l’Accademia jusqu’à Sant’Elena, avant de revenir par Rialto et Cannaregio vers Vino Vero. Ce n’est plus une courte première rencontre : prévoyez une journée entière avec des pauses photo et repos. La distance et le temps de marche ne s’affichent qu’après le calcul de l’itinéraire. Majer et la pause de lumière du soir à Tre Archi restent au programme.',
      '这是一条较长的路线：从Dorsoduro穿过Ponte dell’Accademia前往Sant’Elena，再经Rialto和Cannaregio返回Vino Vero。它已不适合作为简短的首次聚会；加上拍摄和休息，建议预留一整天。只有成功计算街道步行路线后，才会显示距离和步行时间估算。路线仍经过Majer，并在Tre Archi停留欣赏傍晚光线。',
      'Dorsoduroからアカデミア橋を渡ってSant’Elenaへ向かい、RialtoとCannaregioを通ってVino Veroへ戻る長い散歩です。短時間の初回イベント向けではないため、撮影と休憩を含めて一日を見込んでください。距離と徒歩時間の目安は、道路に沿ったルートの計算後に表示されます。MajerとTre Archiで夕方の光を楽しむ立ち寄りも残しています。',
      'Dorsoduro에서 아카데미아 다리를 건너 Sant’Elena로 간 뒤, Rialto와 Cannaregio를 거쳐 Vino Vero로 돌아오는 긴 코스입니다. 이제 짧은 첫 모임용 코스는 아니므로 촬영과 휴식을 포함해 하루를 잡으세요. 거리와 예상 도보 시간은 실제 길을 따라 경로 계산이 완료된 뒤 표시됩니다. Majer와 Tre Archi의 저녁빛 감상 지점도 그대로 포함됩니다.'],
    [intro,
      'Ana rota artık Accademia Köprüsü ve Sant’Elena’dan geçip Vino Vero’ya dönüyor. Tam 28 duraklı yürüyüş ayrı kalıyor ve Sant’Elena’da bitiyor. İşaretler zorunlu grup molaları değil, dikkatini verebileceğin yerler.',
      'Основной маршрут теперь проходит по мосту Accademia и через Sant’Elena, а заканчивается у Vino Vero. Полный маршрут из 28 остановок остаётся отдельным и заканчивается на Sant’Elena. Метки обозначают места для наблюдения, а не обязательные остановки всей группы.',
      'La promenade principale passe désormais par le pont de l’Accademia et Sant’Elena avant de rejoindre Vino Vero. Le parcours complet de 28 étapes reste distinct et se termine à Sant’Elena. Les repères sont des lieux à observer, pas des arrêts obligatoires pour tout le groupe.',
      '主路线现已包含Accademia桥和Sant’Elena，随后返回Vino Vero。完整的28站路线仍独立保留，终点为Sant’Elena。地图标记是可供观察的地点，不是全组必须停留的任务点。',
      'メインルートにアカデミア橋とSant’Elenaを加え、その後Vino Veroへ戻ります。全28スポットのルートは別の選択肢として残し、終点はSant’Elenaです。ピンは目を向ける場所であり、全員で必ず立ち止まる場所ではありません。',
      '메인 코스는 이제 아카데미아 다리와 Sant’Elena를 지나 Vino Vero로 돌아옵니다. 전체 28개 지점 코스는 별도로 유지되며 Sant’Elena에서 끝납니다. 핀은 관찰할 만한 곳을 표시하며, 모두가 반드시 멈춰야 하는 지점은 아닙니다.'],
    [bridgeAbout,
      'Dorsoduro’dan San Marco yönüne Accademia Köprüsü’nü geç, ardından Sant’Elena’ya devam et. Köprüyü ve basamakları açık tut; grubu köprü girişindeki uygun kamusal alanda topla. Bu işaret galeri veya vaporetto durağı değil, köprünün kendisi.',
      'Перейдите мост Ponte dell’Accademia из Dorsoduro в сторону San Marco, затем продолжайте к Sant’Elena. Не перекрывайте мост и ступени; соберитесь у подхода к мосту в общедоступном месте. Метка обозначает сам мост, а не галерею или остановку вапоретто.',
      'Traversez le Ponte dell’Accademia de Dorsoduro vers San Marco, puis continuez vers Sant’Elena. Laissez le pont et les marches libres ; regroupez-vous dans un espace public près de l’accès. Ce repère désigne le pont lui-même, pas la galerie ni l’arrêt de vaporetto.',
      '从Dorsoduro经Ponte dell’Accademia过桥，前往San Marco方向，再继续走向Sant’Elena。请勿堵塞桥面和台阶；在桥头合适的公共区域集合。此标记指桥本身，而非美术馆或水上巴士站。',
      'DorsoduroからSan Marco方面へアカデミア橋を渡り、Sant’Elenaへ進みます。橋や階段をふさがず、橋のたもとの適切な公共スペースで集合してください。このピンは美術館や水上バス乗り場ではなく、橋そのものを示しています。',
      'Dorsoduro에서 San Marco 방향으로 아카데미아 다리를 건넌 다음 Sant’Elena로 계속 가세요. 다리와 계단의 통행을 막지 말고, 다리 입구의 적절한 공공 공간에서 모이세요. 이 핀은 미술관이나 수상버스 정류장이 아니라 다리 자체를 가리킵니다.'],
    [elenaAbout,
      'Sant’Elena kıyısında ve Parco delle Rimembranze çevresinde mola ver. Ana rotada burası bitiş değil, ara durak: Rialto yönüne dön, ardından Cannaregio üzerinden Vino Vero’ya devam et. Doğuya yapılan bu uzatma yürüyüşü belirgin biçimde uzatıyor.',
      'Сделайте паузу у набережной и Parco delle Rimembranze на Sant’Elena. На основном маршруте это промежуточная остановка, а не финиш: вернитесь в сторону Rialto, затем идите через Cannaregio к Vino Vero. Этот заход на восток заметно удлиняет прогулку.',
      'Faites une pause sur le front de mer et près du Parco delle Rimembranze à Sant’Elena. Sur la promenade principale, il s’agit d’une étape intermédiaire, pas de l’arrivée : repartez vers Rialto, puis traversez Cannaregio jusqu’à Vino Vero. Ce détour vers l’est allonge nettement la marche.',
      '在Sant’Elena的水岸和Parco delle Rimembranze附近稍作休息。在主路线中，这里是中途站而非终点：之后返回Rialto方向，再穿过Cannaregio前往Vino Vero。这段向东的绕行会明显增加步行距离。',
      'Sant’Elenaの水辺とParco delle Rimembranze周辺で休憩しましょう。メインルートでは終点ではなく途中の立ち寄りです。その後はRialto方面へ戻り、Cannaregioを通ってVino Veroへ進みます。東側へ足を延ばすため、歩く距離はかなり長くなります。',
      'Sant’Elena의 물가와 Parco delle Rimembranze 주변에서 쉬어 가세요. 메인 코스에서는 종점이 아닌 중간 지점입니다. 이후 Rialto 방향으로 돌아가 Cannaregio를 거쳐 Vino Vero로 향하세요. 동쪽으로 다녀오는 구간 때문에 도보 거리가 상당히 늘어납니다.'],
    [routeNote,
      '16 duraklı ana rota Google Maps için 4 mobil uyumlu parçaya, tam 28 duraklı rota ise 7 parçaya ayrılır. Her parçanın bitişi sonrakinin başlangıcıdır; rota kesintisiz devam eder. İki rotanın da tüm durakları tek bir desteklenen yol tarifi bağlantısına sığmaz.',
      'Основной маршрут из 16 остановок разделён на 4 удобные для мобильного Google Maps части, а полный маршрут из 28 остановок — на 7. Конец каждой части совпадает с началом следующей. Все остановки любого из этих маршрутов не помещаются в одну поддерживаемую ссылку с направлениями.',
      'La promenade principale de 16 étapes comprend 4 parties adaptées à Google Maps sur mobile ; le parcours complet de 28 étapes en comprend 7. La fin de chaque partie correspond au départ de la suivante. Aucun de ces parcours ne tient intégralement dans un seul lien d’itinéraire pris en charge.',
      '16站主路线分为4段适用于手机的Google Maps路线，完整28站路线分为7段。每段的终点与下一段的起点重合，便于连续步行。这两条路线都无法在一个受支持的导航链接中完整保留所有站点。',
      '16スポットのメインルートはモバイル向けGoogle Mapsリンク4区間、全28スポットのルートは7区間に分かれます。各区間の終点と次の始点が重なるため、順番に進めます。どちらも対応する1本の経路リンクに全スポットを収めることはできません。',
      '16개 지점의 메인 코스는 모바일 Google Maps용 4개 구간으로, 전체 28개 지점 코스는 7개 구간으로 나뉩니다. 각 구간의 끝과 다음 구간의 시작이 같아 순서대로 이어 걸을 수 있습니다. 두 코스 모두 지원되는 경로 링크 하나에 모든 지점을 담을 수는 없습니다.'],
    ['Ponte dell’Accademia','Ponte dell’Accademia','Ponte dell’Accademia','Ponte dell’Accademia','Ponte dell’Accademia','Ponte dell’Accademia','Ponte dell’Accademia'],
    ['Open entire route · 7 stops in Google Maps ↗','7 duraklı rotayı Google Maps’te aç ↗','Открыть маршрут из 7 остановок в Google Maps ↗','Ouvrir les 7 étapes dans Google Maps ↗','在Google Maps中打开全部7站 ↗','7スポットのルートをGoogle Mapsで開く ↗','Google Maps에서 7개 지점 전체 경로 열기 ↗']
  ].map(row => row.join('|')).join('\n'));

  ROUTES.main.ids = MAIN;
  ROUTES.main.label = 'Main Walk · 16 stops · Vino Vero';
  ROUTES.main.plan = plan;
  const originalStops = stops;
  stops = function () {
    return originalStops().map(p => {
      if (mode !== 'main') return p;
      if (p.id === 'accademia') return {...p,name:'Ponte dell’Accademia',lat:45.43166,lon:12.32891,query:'Ponte dell\'Accademia, Venice, Italy',about:bridgeAbout,source:'https://www.openstreetmap.org/way/556239027'};
      if (p.id === 'elena') return {...p,about:elenaAbout};
      return p;
    });
  };
  const pIntro = document.querySelector('#guide-plan .intro + .muted');
  if (pIntro) pIntro.textContent = intro;
  for (const paragraph of document.querySelectorAll('.fineprint details p')) {
    if (paragraph.textContent.startsWith('Main Walk:')) {
      paragraph.innerHTML='<b>Main Walk:</b> Santa Lucia → San Giacomo → Frari → Santa Margherita → San Barnaba → San Trovaso → Zattere → Ponte dell’Accademia → Sant’Elena → Rialto → Guglie → Majer → Ghetto Nuovo → Tre Archi → Ormesini → Vino Vero.';
    }
    if (paragraph.querySelector('a[href*="maps/documentation/urls"]')) {
      paragraph.innerHTML='<a href="https://developers.google.com/maps/documentation/urls/get-started" target="_blank" rel="noopener">Google Maps</a> · <span>'+esc(routeNote)+'</span>';
    }
  }

  // Automatic mode should let a recipient's browser choose their language.
  const originalShare = shareURL;
  shareURL = function () {
    const url = new URL(originalShare(), location.href);
    const h = new URLSearchParams(url.hash.slice(1));
    if (WalkI18n.selection === 'auto') h.delete('lang');
    else h.set('lang', WalkI18n.language);
    url.hash = h.toString();
    return url.href;
  };

  // Marker focus must use the selected route's bridge coordinate, not the old approach.
  const previousFocus = focusStop;
  focusStop = function (id) {
    previousFocus(id);
    if (mode !== 'main' || id !== 'accademia') return;
    requestAnimationFrame(() => {
      if (map) { const p=stops().find(s=>s.id===id);map.setView(xy(p),17,{animate:false});markerById.get(id)?.openPopup(); }
    });
  };
  routeDistance='';
  render();
  if (map) { renderMarkers();fitBounds();calculate(); }
  updateShare();
  WalkI18n.refresh();
})();
