'use strict';
/* Presentation-only extension for walk-map-v5.js. Route IDs, order, pins,
   Google Maps splitting and solar calculations stay in the existing engine. */
(() => {
  const IDEAS = {
    lucia: [
      ['A city in a suitcase', 'Timing', 'From a quiet spot outside the station, frame a bag, a pair of shoes or a waiting hand with a hint of water behind. Suggest an arrival without needing a face.', 'Ask a friend to be your subject; keep the entrance clear.'],
      ['The first thing you nearly missed', 'Attention', 'Ignore the postcard view for a moment. Find a small mark, reflection or colour near the station that says “I have arrived” to you.', 'Try the normal lens and move closer only where there is room.']
    ],
    guglie: [
      ['Stone meets water', 'Framing', 'From the quay, put a crisp stone edge beside the restless canal. Try a frame where the solid shape and its broken reflection almost touch.', 'Keep both feet on the quay; no leaning over the edge is needed.'],
      ['A boat changes the drawing', 'Timing', 'Choose a reflection near the bridge and watch what a passing boat does to it. Compare the still pattern with the ripples rather than chasing the boat.', 'Hold the same frame while the water changes.']
    ],
    ghetto: [
      ['A conversation between windows', 'Framing', 'Find two windows with different proportions, colours or shutters. Photograph the relationship between them, without looking into anyone’s home.', 'Point towards the facades from public space; respect memorials and worship.'],
      ['The square, quietly', 'Attention', 'Let the square be itself. Look for the meeting of wall, paving and light; make a calm picture that does not need a person to complete it.', 'No need to invent a story or turn religious objects into props.']
    ],
    ormesini: [
      ['A reflection without its owner', 'Reflection', 'Find a coloured facade reflected in the canal, then leave the actual building out. Let the water turn a familiar street into an uncertain painting.', 'Frame from a safe standing position; wait for a ripple you like.'],
      ['One colour, two lives', 'Colour', 'Look for the same colour in a solid object and in water. Place both in the frame so the eye can move from the real thing to its less certain echo.', 'A tighter crop is enough; a long lens is not required.']
    ],
    orto: [
      ['A facade with a missing piece', 'Framing', 'Rather than fitting the whole church in, let an edge of it leave the photograph. See how much architecture you can remove while keeping its character.', 'Compare your usual view with a closer, incomplete one.'],
      ['Borrow a sense of scale', 'Scale', 'Ask a willing friend to stand well away from the facade, then include them as a small part of the scene. Try the empty version too; neither is the correct answer.', 'Stay in the public square and keep church access clear.']
    ],
    misericordia: [
      ['An empty stage', 'Timing', 'Choose a frame containing a doorway, a stretch of quay and some water. Wait briefly for a small change, or keep the empty version if it feels more interesting.', 'Observe a scene, not an individual; do not follow people.'],
      ['The evening has two temperatures', 'Light', 'If windows or lamps are lit, place their warm light beside cooler water or sky. On a bright day, try sunlit stone against open shade instead.', 'On a phone, tap different parts of the scene and compare the brightness.']
    ],
    chiodo: [
      ['A bridge made of gaps', 'Negative space', 'From the public quay, look at the empty shapes around the bridge rather than the bridge itself. Can a patch of water or sky become the main subject?', 'Do not step onto the bridge or into private property for an angle.'],
      ['Two curves, one frame', 'Shape', 'Look for a curve in the bridge and a second curve in the water or surroundings. Let the shapes echo each other without forcing perfect symmetry.', 'Try a small sideways move while staying on the public path.']
    ],
    rialto: [
      ['The canal, partly hidden', 'Layers', 'Use a safe foreground edge to hide a little of the Grand Canal. Let the viewer discover the water instead of showing the entire scene at once.', 'Work from a place where stopping does not block the bridge.'],
      ['A postcard with the landmark missing', 'Framing', 'Make a photograph of the Rialto atmosphere without including the bridge. Boats, reflected signs, stone and water can carry the sense of place.', 'Choose what to leave out before changing camera settings.']
    ],
    giacomo: [
      ['The border of light', 'Light', 'Find where a bright patch meets shade. Frame the boundary itself, then move slightly and see which version feels quieter or more unsettled.', 'Tap or meter on the bright area, then the shade; compare rather than correct.'],
      ['A photograph for a sound', 'Attention', 'Listen to the square for a moment. Make a picture of a surface, object or empty space that seems to belong to one sound you noticed.', 'There does not have to be an obvious explanation.']
    ],
    polo: [
      ['Let the square breathe', 'Negative space', 'Place a small detail near an edge and give most of the photograph to paving or open space. See whether the empty area makes the detail stronger.', 'Try a horizontal and a vertical frame from the same safe spot.'],
      ['An invisible diagonal', 'Framing', 'Find two far-apart details that make your eye travel across the square. Connect them with the composition, without needing a literal line.', 'Move your feet a little instead of automatically zooming.']
    ],
    frari: [
      ['Old stone, small interruption', 'Contrast', 'Put a modest everyday detail beside the large church exterior: a sign, a bag carried by a willing friend, or a patch of colour. Explore the contrast in scale.', 'Use a friend’s belongings only with permission; leave the site untouched.'],
      ['Architecture as a texture', 'Detail', 'Leave the whole facade out and look at how light crosses brick or stone. Make an image that might be read as a pattern before it is read as a building.', 'Avoid digital zoom where possible; crop afterwards from a safe viewpoint.']
    ],
    margherita: [
      ['The pause between actions', 'Timing', 'Ask a friend whether you can photograph a small in-between moment: setting down a cup, folding a map or listening. The pause can matter more than the action.', 'No one needs to pose or buy a drink to take part.'],
      ['The same square, different attention', 'Together', 'Stand beside a friend and each choose something different in the square. Afterwards, compare what caught your eyes rather than which photograph is better.', 'Sharing is optional; describing what you noticed is enough.']
    ],
    barnaba: [
      ['A colour that leads you', 'Colour', 'Pick a colour in the square and look for its echo near the canal. Make a frame where the colour quietly connects two otherwise unrelated details.', 'Keep the search within the meeting area; no need to wander away.'],
      ['A square in a sliver', 'Framing', 'Look for a narrow view between public architectural edges. Use it to show only a sliver of the square, like a scene glimpsed while passing.', 'Do not use private doorways as viewing positions.']
    ],
    trovaso: [
      ['The craft without the craftsman', 'Detail', 'From the public side, look for a boat shape, a surface or a reflection that suggests making and repair. The work can be present without a portrait of a worker.', 'Stay outside the yard; never interrupt work for a photograph.'],
      ['A gondola becomes a line', 'Abstraction', 'Isolate a curve of a visible boat against water or another simple surface. Let the curve be read as a drawing before it is read as a boat.', 'Use the part of the scene visible from public space; no special access needed.']
    ],
    zattere: [
      ['Give the water more room', 'Framing', 'Try the same view with the horizon high, then low. Notice how the balance of water and sky changes the feeling without changing the subject.', 'Both versions are experiments, not a rule about where a horizon belongs.'],
      ['A small thing, a wide world', 'Scale', 'Place a safe foreground detail against the expanse of the Giudecca Canal. Let the difference in scale do the storytelling.', 'Keep back from the edge; never put equipment on an unsafe ledge.']
    ],
    dogana: [
      ['At the edge of the picture', 'Negative space', 'Place a distant boat or a consenting friend near one edge of the frame and leave a broad area of water. Try making the subject almost too small.', 'You can photograph water alone if nothing else feels right.'],
      ['Three ways to be still', 'Sequence', 'From one public viewpoint, try a wide water scene, a tighter geometric detail and a reflection. Think of them as possible neighbours, not a required set.', 'One image, several images or just looking are all fine.']
    ],
    salute: [
      ['A dome answered by a detail', 'Shape', 'Look for a small rounded shape in the public surroundings that echoes the basilica’s forms. Frame the relationship, or make two separate pictures to compare.', 'Do not move objects or enter restricted areas to manufacture the match.'],
      ['Monument, almost absent', 'Framing', 'Allow only a small piece of the basilica into a photograph mostly about sky, water or a foreground surface. How little is enough to suggest it?', 'Use a simple crop rather than trying to fit everything in.']
    ],
    accademia: [
      ['A view with a frame inside', 'Layers', 'From a place where you can stop safely, include a little of the bridge approach or another public edge around the canal view. Let the frame become part of the photograph.', 'Do not linger on narrow steps or lean out for a clearer view.'],
      ['Turn away from the famous view', 'Attention', 'Before leaving the Dorsoduro side, turn your attention away from the canal panorama. Find a quieter detail behind you that you would otherwise have missed.', 'You do not need to cross the bridge for this idea.']
    ],
    stefano: [
      ['A rhythm with one wrong note', 'Pattern', 'Find repeated windows, paving lines or shapes, then look for one interruption. Let the exception give the pattern its character.', 'A small colour change can be enough; no person is required.'],
      ['Only the shadow tells', 'Light', 'When there are distinct shadows, photograph one without showing the object casting it. In flat light, try a cropped outline that keeps its source uncertain.', 'No need to wait for sunshine or force a mystery.']
    ],
    marco: [
      ['An incomplete repetition', 'Pattern', 'Choose a run of arches or architectural details and let the repetition continue beyond the edges of your frame. Resist the urge to show the whole square.', 'Keep your pause short wherever the pedestrian flow is busy.'],
      ['A human-scale postcard', 'Scale', 'Ask a friend to hold a small personal object in the foreground while the square remains a hint behind. Make the place part of their experience rather than the whole subject.', 'Use an ordinary object, not anything taken from the site.']
    ],
    schiavoni: [
      ['Three distances', 'Layers', 'Find a nearby public detail, something moving on the water and a far shoreline. Let all three distances share the frame without competing equally.', 'Shift sideways a little to separate shapes; watch the people around you.'],
      ['Motion outside the frame', 'Timing', 'Watch a passing boat leave the picture. Photograph the wake or disturbed reflection it leaves behind rather than the boat itself.', 'Stay on the public promenade and away from boarding areas.']
    ],
    arsenale: [
      ['The gate as a silhouette', 'Shape', 'Concentrate on the outline of the exterior gate and the spaces around it. Try a frame where shape matters more than visible surface detail.', 'If the light is flat, simplify the crop instead of forcing a dark silhouette.'],
      ['Heavy stone, light water', 'Contrast', 'Bring a solid architectural detail and a moving reflection into one composition. Let weight and movement answer each other.', 'Remain outside restricted areas; the historical gate is not a route into the exhibition.']
    ],
    tana: [
      ['Before entering', 'Threshold', 'Stay outside the exhibition boundary and look at the idea of a threshold: a line, an opening or the space before a doorway. Make a picture about anticipation.', 'Do not obstruct the entrance or photograph security procedures.'],
      ['Letters lose their meaning', 'Abstraction', 'If a public sign catches your eye, crop part of a letter until it becomes a shape. Look for another shape nearby that seems to answer it.', 'Use public signage, not tickets, passes or visitors’ personal information.']
    ],
    garibaldi: [
      ['A street in a colour pair', 'Colour', 'Choose two colours on a shopfront or public facade and build a frame around their relationship. Let the rest of the street remain outside.', 'Ask before photographing inside a shop or making a close portrait.'],
      ['The shop after the customer', 'Timing', 'Look at what an everyday interaction leaves behind: an empty patch of light, a reflection or an open stretch of pavement. Observe the scene without following anyone.', 'Nothing has to happen; the empty version can be the photograph.']
    ],
    viale: [
      ['Trees as punctuation', 'Pattern', 'Use the gaps between trunks as carefully as the trunks themselves. Try a frame that feels like a sentence with a deliberate pause.', 'Stay on public paths; no climbing or stepping into planted areas.'],
      ['The moving ceiling', 'Light', 'Look up from a safe stopping place and see how leaves divide the sky. Try a bright, airy frame and a darker, more graphic one.', 'On your phone, tap the sky, then the leaves, and compare what changes.']
    ],
    giardini: [
      ['An exhibition without entering', 'Attention', 'Outside the ticketed area, treat an ordinary public detail as something worth looking at closely: a shadow, a line or a meeting of surfaces.', 'The exercise needs neither a ticket nor a photograph of an artwork.'],
      ['A frame made of green', 'Framing', 'Use visible foliage to partly frame an open space outside the entrance. Try leaving the centre almost empty rather than filling it with a subject.', 'Respect barriers and follow access signs; keep entrances clear.']
    ],
    sette: [
      ['A horizon interrupted once', 'Minimalism', 'Make a quiet waterfront frame with a single interruption: a boat, a post or a distant shape. See how its position changes the balance.', 'Wait only as long as you enjoy it; an empty horizon is also an option.'],
      ['Water as a mood, not a view', 'Abstraction', 'Leave the shore and horizon out. Work only with the water’s colour, texture and movement until the place becomes a feeling.', 'Choose a safe position and crop; you do not need to reach over the edge.']
    ],
    elena: [
      ['The last frame can be quiet', 'Closing image', 'Use a tree, a patch of sky or the shoreline to make a gentle closing image. It does not need to summarise Venice or be your best photograph.', 'Take a moment to look without the screen before deciding to shoot.'],
      ['An echo of the beginning', 'Sequence', 'Recall a colour or shape you noticed at the start of your walk. Look for a loose echo here, so two very different places can sit together in your memory.', 'The connection can be personal; it does not have to be obvious to anyone else.']
    ],
    majer: [
      ['A shopfront with two worlds', 'Reflection', 'From outside, look for street reflections mixing with visible shapes in the window. Change your angle slightly to let one layer become stronger than the other.', 'Do not press against the glass; ask before photographing inside or including staff.'],
      ['A small still life, with permission', 'Detail', 'With a willing friend, try a close view of their cup, hands or folded map. Let an edge of the bakery stay in the background as a quiet clue.', 'No purchase is necessary: the storefront alone offers plenty to notice.']
    ],
    trearchi: [
      ['The same canal, a different colour', 'Changing light', 'Choose a simple frame from the quay before sunset, then revisit it as the light fades. Compare the changing mood rather than trying to catch the sun itself.', 'Keep a safe position beside the bridge. Cloudy light counts too.'],
      ['The sky is not the only sunset', 'Reflection', 'Turn your attention down to the water or towards illuminated stone. Look for a trace of the evening colour away from the brightest sky.', 'A darker exposure is one experiment, not a requirement; protect your footing.']
    ],
    vino: [
      ['The picture behind the picture', 'Conversation', 'Choose a photograph you feel comfortable sharing and talk about what made you stop. It might be an unfinished experiment rather than a favourite.', 'Listening, describing an unmade picture or simply enjoying the pause are valid choices.'],
      ['A final reflection', 'Closing image', 'From public space near the finish, look for a quiet reflection or small detail you would like to remember. End with curiosity rather than a photograph quota.', 'Respect other guests; sharing, taking another photo and buying anything are optional.']
    ]
  };
  const indexById = new Map();
  const mq = window.matchMedia('(max-width:900px)');
  const scrollPositions = {ideas:0, plan:0};
  let panel = 'ideas', view = 'map', lastMode = mode, pendingFit = false;
  const byId = id => document.getElementById(id);
  const chosen = id => IDEAS[id][indexById.get(id) || 0];
  const regionName = p => p.area === 'east' ? 'Castello & Biennale' : p.area === 'core' ? 'Centre & Dorsoduro' : 'Cannaregio';
  if (Object.keys(POINTS).some(id => !IDEAS[id])) throw Error('A stop is missing its photo ideas.');

  // A separate ideas panel keeps long planning notes off the small-screen map.
  const aside = byId('route-panel');
  const oldHeading = aside.querySelector('.section-heading');
  const list = byId('stops');
  const selection = document.createElement('div');
  selection.className = 'guide-selection';
  const label = aside.querySelector('label[for="route"]');
  selection.append(label, byId('route'), byId('rialto-option'));
  const planPanel = document.createElement('section');
  planPanel.id = 'guide-plan';
  planPanel.setAttribute('aria-label', 'Route, Google Maps and sunset planning');
  [...aside.childNodes].forEach(node => {
    if (node !== oldHeading && node !== list) planPanel.append(node);
  });
  oldHeading.remove();
  const ideasPanel = document.createElement('section');
  ideasPanel.id = 'guide-ideas';
  ideasPanel.setAttribute('aria-label', 'Stop-by-stop photo ideas');
  ideasPanel.innerHTML = '<div class="guide-heading"><div class="eyebrow">YOUR POCKET FIELD GUIDE</div><h2>Small ideas.<br>Different ways of seeing.</h2><p>Pick an idea, change it, or skip it. No shot quota, no need to share. Phones and cameras are equally welcome.</p></div><label class="field-label" for="idea-stop-picker">Jump to a stop</label><select id="idea-stop-picker"></select><p id="guide-route-caption" class="small-note"></p>';
  ideasPanel.append(list);
  const tabs = document.createElement('nav');
  tabs.className = 'guide-tabs';
  tabs.setAttribute('aria-label', 'Field guide panels');
  tabs.innerHTML = '<button type="button" data-guide-view="ideas">Photo ideas</button><button type="button" data-guide-view="plan">Route & Google Maps</button>';
  aside.append(selection, tabs, ideasPanel, planPanel);
  const dock = document.createElement('nav');
  dock.className = 'guide-dock';
  dock.setAttribute('aria-label', 'Mobile walk navigation');
  dock.innerHTML = '<button type="button" data-guide-view="map"><span aria-hidden="true">◎</span>Map</button><button type="button" data-guide-view="ideas"><span aria-hidden="true">▣</span>Photo ideas</button><button type="button" data-guide-view="plan"><span aria-hidden="true">↗</span>Route & sunset</button>';
  document.body.append(dock);
  document.body.classList.add('walk-enhanced');
  document.body.dataset.guidePanel = panel;
  document.body.dataset.guideView = view;
  const mapWrap = document.querySelector('.map-wrap');
  mapWrap.setAttribute('tabindex', '-1');
  byId('whatsapp').innerHTML = '<span class="share-long">Share on WhatsApp ↗</span><span class="share-short">WhatsApp ↗</span>';
  byId('jump').textContent = 'Photo ideas';
  byId('fit').textContent = 'Fit walk';
  byId('refresh').textContent = 'Retry streets';
  const mobileAll = document.createElement('button');
  mobileAll.id = 'guide-overview'; mobileAll.className = 'btn small'; mobileAll.type = 'button'; mobileAll.textContent = 'All areas';
  mobileAll.onclick = () => byId('all-areas').click();
  document.querySelector('.map-tools').prepend(mobileAll);
  const planCopy = document.createElement('button');
  planCopy.className = 'btn guide-copy'; planCopy.type='button'; planCopy.textContent='Copy this walk’s link';
  planCopy.onclick=()=>byId('copy').click();
  planPanel.querySelector('.export-box').append(planCopy);

  function syncView() {
    document.body.dataset.guidePanel = panel;
    document.body.dataset.guideView = view;
    document.querySelectorAll('button[data-guide-view]').forEach(button => {
      const current = button.closest('.guide-dock') ? view : panel;
      button.setAttribute('aria-pressed', String(button.dataset.guideView === current));
    });
  }
  function showView(next, focus = false) {
    if (!['map','ideas','plan'].includes(next)) return;
    if (view !== 'map' || !mq.matches) scrollPositions[panel] = aside.scrollTop;
    view = next;
    if (next !== 'map') panel = next;
    syncView();
    requestAnimationFrame(() => {
      if (mq.matches && next !== 'map') aside.scrollTop = scrollPositions[panel];
      if (map && (!mq.matches || next === 'map')) {
        map.invalidateSize({pan:false});
        if (pendingFit) { pendingFit = false; fitBounds(); }
      }
      if (focus && mq.matches) {
        const target = next === 'map' ? mapWrap : byId(next === 'ideas' ? 'guide-ideas' : 'guide-plan');
        target.setAttribute('tabindex', '-1');
        target.focus({preventScroll:true});
      }
    });
  }
  function ideaMarkup(id) {
    const [title, theme, text, tip] = chosen(id), n = (indexById.get(id) || 0) + 1;
    return '<div class="prompt-top"><span class="prompt-theme">'+esc(theme)+'</span><span class="prompt-count">Optional idea '+n+' / 2</span></div><h4>'+esc(title)+'</h4><p class="prompt-text" aria-live="polite">'+esc(text)+'</p><p class="prompt-tip"><b>Keep it simple</b> '+esc(tip)+'</p><button class="btn small change-idea" type="button" data-another="'+id+'" aria-label="Another photo idea for '+esc(POINTS[id].name)+'">Another idea <span aria-hidden="true">↻</span></button>';
  }
  function renderCards() {
    const all = stops();
    list.innerHTML = all.map((p,i) => '<li class="stop guide-card" id="photo-stop-'+p.id+'" data-id="'+p.id+'"><div class="stop-head"><span class="num" style="--c:'+pointColor(p,all.at(-1).id)+'">'+p.n+'</span><div><div class="tag">'+(i===0?'START · ':i===all.length-1?'FINISH · ':'')+esc(regionName(p))+'</div><h3>'+esc(p.name)+'</h3></div></div><p class="place-about">'+esc(p.about)+'</p><section class="photo-prompt" data-prompt="'+p.id+'" aria-label="Optional photo idea for '+esc(p.name)+'">'+ideaMarkup(p.id)+'</section><div class="stop-actions"><button class="btn small" type="button" data-focus="'+p.id+'">Show on map</button><a class="btn small" href="'+esc(googlePlace(p))+'" target="_blank" rel="noopener">Google Maps place ↗</a></div>'+(i<all.length-1?'<a class="leg-link" href="'+esc(googleRoute([p,all[i+1]]))+'" target="_blank" rel="noopener">Walk '+p.n+' → '+all[i+1].n+' · '+esc(all[i+1].name)+' ↗</a>':'<p class="finish-note">End of this selected walk. Take a pause; there is nothing to submit.</p>')+'<a class="source-link" href="'+esc(p.source)+'" target="_blank" rel="noopener">About this place · source ↗</a></li>').join('');
    byId('idea-stop-picker').innerHTML = all.map(p => '<option value="'+p.id+'">'+p.n+' · '+esc(p.name)+'</option>').join('');
    byId('guide-route-caption').textContent = ROUTES[mode].title+' · '+all.length+' stops · '+all.length*2+' optional ideas';
    list.querySelectorAll('[data-focus]').forEach(b => b.onclick = () => focusStop(b.dataset.focus));
    if (lastMode !== mode) { aside.scrollTop = 0; scrollPositions.ideas = 0; scrollPositions.plan = 0; lastMode = mode; }
    syncView();
  }
  function openIdea(id) {
    if (!POINTS[id]) return;
    if (!routeIds().includes(id)) {
      const matching = ['main','short','castello','cannaregio','full','biennale'].find(r => ROUTES[r].ids.includes(id));
      if (matching) changeMode(matching);
    }
    showView('ideas');
    requestAnimationFrame(() => {
      const card = byId('photo-stop-'+id);
      if (!card) return;
      byId('idea-stop-picker').value = id;
      aside.scrollTop += card.getBoundingClientRect().top - aside.getBoundingClientRect().top - 14;
      card.setAttribute('tabindex','-1');
      card.focus({preventScroll:true});
      scrollPositions.ideas = aside.scrollTop;
    });
  }
  function popupContent(p, i, all) {
    const [title,,text] = chosen(p.id);
    return '<div class="tag">STOP '+p.n+' · '+esc(regionName(p))+'</div><div class="popup-title">'+esc(p.name)+'</div><div class="popup-prompt"><b>'+esc(title)+'</b><p>'+esc(text)+'</p></div><button class="btn primary small popup-ideas" type="button" data-open-idea="'+p.id+'">Open photo ideas</button><div class="stop-actions"><a class="btn small" href="'+esc(googlePlace(p))+'" target="_blank" rel="noopener">Google Maps ↗</a>'+(i<all.length-1?'<a class="btn small" href="'+esc(googleRoute([p,all[i+1]]))+'" target="_blank" rel="noopener">Walk to stop '+all[i+1].n+' ↗</a>':'')+'</div>';
  }
  function enhancePopups() {
    if (!map) return;
    const all = stops();
    all.forEach((p,i) => {
      const marker = markerById.get(p.id);
      if (!marker) return;
      marker.setIcon(L.divIcon({className:'guide-marker-target',html:'<div class="pin" style="--c:'+pointColor(p,all.at(-1).id)+'">'+p.n+'</div>',iconSize:[44,44],iconAnchor:[22,22]}));
      marker.bindPopup(popupContent(p,i,all),{maxWidth:300,minWidth:210,maxHeight:mq.matches?230:330,autoPanPaddingTopLeft:[16,80],autoPanPaddingBottomRight:[16,75]});
    });
  }
  // Hook only rendering. The underlying six route definitions remain untouched.
  const baseBadge=updateBadge;
  updateBadge=function(){baseBadge();mobileAll.setAttribute('aria-pressed',String(overview));};
  const baseRender = render, baseMarkers = renderMarkers, baseOther = renderOtherMarkers, baseFocus = focusStop, baseFit = fitBounds;
  render = function() { baseRender(); renderCards(); };
  renderMarkers = function() { baseMarkers(); enhancePopups(); };
  renderOtherMarkers = function() {
    baseOther();
    if (!otherMarkers || !overview) return;
    otherMarkers.eachLayer(layer => {
      const popup = layer.getPopup?.(), latlng = layer.getLatLng?.();
      if (!popup || !latlng) return;
      const p = Object.values(POINTS).find(s => Math.abs(s.lat-latlng.lat)<1e-7 && Math.abs(s.lon-latlng.lng)<1e-7);
      if (!p) return;
      layer.setRadius?.(7);
      const [title,,text] = IDEAS[p.id][0];
      popup.setContent(popup.getContent()+'<div class="popup-prompt"><b>'+esc(title)+'</b><p>'+esc(text)+'</p></div><button class="btn primary small" type="button" data-open-idea="'+p.id+'">Open this stop’s photo ideas</button>');
    });
  };
  fitBounds = function() {
    if (mq.matches && view !== 'map') { pendingFit = true; return; }
    baseFit();
  };
  focusStop = function(id) {
    showView('map');
    requestAnimationFrame(() => {
      if (map) map.invalidateSize({pan:false});
      baseFocus(id);
    });
  };
  byId('idea-stop-picker').onchange = e => openIdea(e.target.value);
  byId('jump').onclick = () => showView('ideas', true);
  const allAreasClick = byId('all-areas').onclick;
  byId('all-areas').onclick = () => { showView('map'); requestAnimationFrame(allAreasClick); };
  document.addEventListener('click', e => {
    const viewButton = e.target.closest('button[data-guide-view]');
    if (viewButton) { showView(viewButton.dataset.guideView, true); return; }
    const openButton = e.target.closest('[data-open-idea]');
    if (openButton) { openIdea(openButton.dataset.openIdea); return; }
    const nextButton = e.target.closest('[data-another]');
    if (nextButton) {
      const id = nextButton.dataset.another;
      indexById.set(id, ((indexById.get(id) || 0)+1)%IDEAS[id].length);
      const section = list.querySelector('[data-prompt="'+id+'"]');
      section.innerHTML = ideaMarkup(id);
      section.querySelector('button').focus({preventScroll:true});
      const all = stops(), i = all.findIndex(p => p.id===id), marker = markerById.get(id);
      if (marker && i>=0) marker.setPopupContent(popupContent(all[i],i,all));
    }
  });
  // Reveal the link field before focusing when clipboard permission is unavailable.
  byId('copy').onclick = async () => {
    try { await navigator.clipboard.writeText(shareURL()); toast('Link copied with your route, date and map view.'); }
    catch { showView('plan'); requestAnimationFrame(() => { const field=byId('manual-copy');field.hidden=false;field.value=shareURL();field.focus();field.select();toast('Copy the selected link.'); }); }
  };
  mq.addEventListener('change', () => { syncView(); requestAnimationFrame(() => { if(map){map.invalidateSize({pan:false});if(!mq.matches||view==='map')fitBounds();} }); });
  // Explicit shared overview links are respected; a fresh phone visit fits its walk.
  if (mq.matches && !new URLSearchParams(location.hash.slice(1)).has('view')) { overview=false;saveState(); }
  renderCards();
  if (map) { renderMarkers();fitBounds(); }
  updateBadge();
  syncView();
})();
