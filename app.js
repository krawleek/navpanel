const $ = (selector, root = document) => root.querySelector(selector);
const stage = $('#stage');
const panel = $('#panel');
const overlay = $('#map-overlays');
const world = $('#map-world');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const image = (file, cls = '', alt = '') => `<img src="assets/${file}" class="${cls}" alt="${alt}">`;
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icons = {wardrobe:'b6a6e.svg',wc:'f341f.svg',lift:'6801e.svg',coworking:'02a2b.svg',pool:'9ed24.svg',stairs:'99bf0.svg',site:'ad46e.svg',news:'fcd63.svg',merch:'f15c9.svg'};
const state = {view:'home',query:'',floor:1,tab:'Все ответы',zoom:1,panX:0,panY:0,keyboard:false,missing:false,kind:'doctor',modal:false};
let searchTimer, idleTimer, countdownTimer, count = 15, demoController;
const screens = {home:'2272:1898',suggestions:'2272:1938',results:'2272:1970',empty:'2272:2518',loading:'2272:2526',doctor:'2272:2198',service:'2272:2442',route:'2272:2258',site:'2272:2472',news:'2272:2484',article:'2272:2716',merch:'2272:2729',closed:'2272:2550'};
function resize() {
  const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `scale(${scale})`;
  stage.style.left = `${Math.max(0,(innerWidth - 1920*scale)/2)}px`;
  stage.style.top = `${Math.max(0,(innerHeight - 1080*scale)/2)}px`;
}
window.addEventListener('resize',resize);resize();
function announce(message) { $('#announcement').textContent = message; }
function back(label='К результатам поиска',action='results') { return `<button class="back" data-action="${action}">${image('7c107.svg')}<span>${label}</span></button>`; }
function primary(label, action, arrow='f0479.svg') { return `<button class="primary" data-action="${action}"><span>${label}</span><span class="circle-arrow">${image(arrow)}</span></button>`; }
function disc(file) { return `<span class="icon-disc">${image(file)}</span>`; }
function row(title,subtitle,action,avatar='205',extra='') {
 const face = /\.(png|svg)$/.test(avatar) ? image(avatar,'avatar') : `<span class="avatar">${escape(avatar)}</span>`;
 return `<button class="result-row ${extra}" data-action="${action}">${face}<span class="row-copy"><strong>${escape(title)}</strong><small>${escape(subtitle)}</small></span>${image('a9e16.svg','chevron')}</button>`;
}
function searchField() { return `<form class="search" role="search">${image('75a63.svg')}<input id="search-input" autocomplete="off" aria-label="Врач, услуга или кабинет" placeholder="Врач, услуга или кабинет" value="${escape(state.query)}" data-cursor="ibeam">${state.query?`<button type="button" data-action="clear-search" aria-label="Очистить поиск">${image('cd16c.svg')}</button>`:''}${state.keyboard?`<button class="submit" aria-label="Найти">${image('39c62.svg')}</button>`:''}</form>`; }
function keyboard() {
 const rows = ['1234567890','ЙЦУКЕНГШЩЗХЪ','ФЫВАПРОЛДЖЭЁ','ЯЧСМИТЬБЮ.,-'];
 return `<div class="keyboard" aria-label="Экранная клавиатура">${rows.map((letters,index)=>`<div class="key-row">${[...letters].map(letter=>`<button class="key" data-key="${escape(letter)}">${letter}</button>`).join('')}${index===0?`<button class="key wide" data-action="backspace" aria-label="Удалить символ">${image('1c00f.svg')}</button>`:''}</div>`).join('')}<div class="key-row"><button class="key space" data-key=" " aria-label="Пробел"></button><button class="key find" data-action="search">Найти</button></div></div>`;
}
function home() {
 const destinations=[['wardrobe','Гардероб'],['wc','Туалеты'],['lift','Лифты'],['coworking','Коворкинг'],['pool','Бассейн'],['stairs','Лестницы']];
 return `<div class="home-title"><h1>Куда идёте?</h1></div>${searchField()}<div class="quick-grid">${destinations.map(([key,label])=>`<button class="quick" data-action="quick-${key}">${disc(icons[key])}<span>${label}</span></button>`).join('')}</div><button class="promo" data-action="article" aria-label="Берегите зрение — открыть статью"><span class="promo-art">${image('cf238.png','promo-eye')}${image('6419b.png','promo-wash')}</span><h2>Берегите<br>зрение</h2>${image('49cc7.svg','pagination')}<span class="circle-arrow">${image('f0479.svg')}</span></button><nav class="footer" aria-label="Информация о клинике">${[['site','Сайт'],['news','Новости'],['merch','Сувениры']].map(([key,label])=>`<button data-action="${key}">${disc(icons[key])}<span>${label}</span></button>`).join('')}</nav>`;
}
function suggestions() { return `<div class="list">${row('Махонин Денис Александрович','Остеопат ·','doctor','МД')}${row('Махонин Денис Александрович','Остеопат ·','doctor','d2ed7.png')}</div>`; }
function results() {
 const isDoctor = /мах|осте|денис|реаб/i.test(state.query);
 const isService = /колон|нарк|эндос|диагн/i.test(state.query);
 const options = isDoctor ? [row('Махонин Денис Александрович','Остеопат · Кабинет 205','doctor','d2ed7.png')] : isService ? [row('Колоноскопия под наркозом','Диагностика · ок. 40 мин','service','aee86.svg','accent'),row('Кабинет 204','2 этаж · Отделение диагностики','service','204')] : [row('Вакцинация детей','Акция! Прививка вакциной «Пентаксим»','service','aee86.svg','accent'),row('Кабинет 205','2 этаж · Мурадова Телли Мехмановна','closed','205'),row('Мурадова Телли Мехмановна','Терапевт · Кабинет 205','doctor','3e4ca.png')];
 const tabs=['Все ответы','Врачи','Кабинеты','Услуги'];
 let filtered=options;
 if(state.tab==='Врачи')filtered=[isDoctor?options[0]:row('Мурадова Телли Мехмановна','Терапевт · Кабинет 205','doctor','3e4ca.png')];
 if(state.tab==='Кабинеты')filtered=[row('Кабинет 205','2 этаж · Отделение реабилитации','closed','205')];
 if(state.tab==='Услуги')filtered=[row('Колоноскопия под наркозом','Диагностика · ок. 40 мин','service','aee86.svg')];
 return `<div class="tabs" role="tablist" aria-label="Тип результатов">${tabs.map(tab=>`<button role="tab" aria-selected="${state.tab===tab}" class="${state.tab===tab?'selected':''}" data-tab="${tab}">${tab}</button>`).join('')}</div><div class="list">${filtered.join('')}</div>`;
}
function searchContent() {
 let body;
 if(state.view==='suggestions') body=state.query?suggestions():'';
 else if(state.view==='loading')body=`<div class="list" aria-label="Загрузка результатов">${[1,2,3].map(()=>`<div class="result-row"><span class="skeleton avatar"></span><div><span class="skeleton skeleton-line"></span><span class="skeleton skeleton-line short"></span></div></div>`).join('')}</div>`;
 else if(state.view==='empty')body=`<div class="card empty">${disc('37064.svg')}<h3>Ничего не найдено</h3><p>Попробуйте изменить запрос или проверить его написание</p></div>`;
 else body=results();
 return `<div class="home-title"><h1>Куда идёте?</h1></div>${searchField()}<div class="search-body" aria-live="polite">${body}</div>${state.keyboard?keyboard():''}`;
}
const specialties=['Заместитель главного врача по реабилитации','Прикладной кинезиолог','Специалист P-DTR','Физиотерапевт','Подиатр','Врач ТМС-терапии','Врач по лечебной физкультуре и спортивной медицине','Врач физической и реабилитационной медицины'];
function status(title,description) {return `<div class="status">${image('be501.svg')}<div>${title}<small>${description}</small></div></div>`;}
function doctor() {
 return `${back()}<div class="card"><div class="doctor-header"><div><h2>Махонин Денис Александрович</h2><p>Остеопат · мануальный терапевт</p></div>${image('d2ed7.png','doctor-photo','Махонин Денис Александрович')}</div><div class="metadata"><div><span>Стаж</span>24+ лет</div><div><span>Пациенты</span>0+</div><div><span>Часы приёма</span>09:00–18:00</div></div><div class="specializations"><p>Специализации</p><div class="chips">${specialties.map((text,i)=>`<span class="${i===0?'wide':''}">${text}</span>`).join('')}</div></div></div>${state.missing?status('Обратитесь в регистратуру','Кабинет пока не назначен'):primary('Кабинет 205','route')}`;
}
function service() {
 return `${back()}<div class="card"><h2>Колоноскопия под наркозом</h2><p>Эндоскопическое исследование толстого кишечника с медикаментозной седацией.</p><div class="info">${image('10d3a.svg')}<p>${state.missing?'Перед процедурой необходима предварительная подготовка кишечника. Уточните необходимые обследования и рекомендации врача.':'Перед процедурой необходима предварительная подготовка кишечника. Уточните необходимые обследования и рекомендации врача.'}</p></div>${state.missing?'':`<hr>${row('Эндоскопический кабинет','2 этаж · Отделение диагностики','closed','204')}`}</div>${state.missing?status('Номер кабинета уточните в записи или на регистратуре.','Место проведения уточняется'):primary('Как пройти к кабинету 204','route')}`;
}
function route() {
 const room=state.kind==='service'?'204':'205';
 const steps1=['Вы здесь, у входа','Пройдите мимо регистратуры','Поверните налево к лифту','Поднимитесь на 2 этаж'];
 const steps2=['Выйдите из лифта направо','Пройдите мимо кабинета 203',`Кабинет ${room} справа`];
 const steps=(items,floor)=>`<div><div class="steps-heading ${state.floor===floor?'current':''}">${floor} этаж</div><ol class="steps">${items.map((text,index)=>{const type=index===0?(floor===1?'start':'lift'):index===items.length-1?(floor===1?'lift':'end'):'';return `<li><span class="step-marker ${type}">${image(type==='lift'?'4d093.svg':type==='start'||type==='end'?'ed4ca.svg':'bcdea.svg')}</span><span>${text}</span></li>`;}).join('')}</ol></div>`;
 return `${back('Назад к кабинету',state.kind)}<div class="card route-card"><h2>Кабинет ${room}</h2><p>2 этаж · ${state.kind==='service'?'Отделение диагностики':'Отделение реабилитации'}</p><hr>${state.kind==='service'?row('Колоноскопия под наркозом','Эндоскопическое исследование','service','aee86.svg'):row('Махонин Денис Александрович','Остеопат','doctor','d2ed7.png')}</div><div class="card route-steps">${steps(steps1,1)}<div class="steps-divider"></div>${steps(steps2,2)}</div>${primary(state.floor===2?'Вернуться на 1 этаж':'Показать 2 этаж','route-floor')}`;
}
function qr() {
 return `${back(state.view==='article'?'Назад к новости':'На главную','home')}<div class="card"><h2>Открыть сайт клиники</h2><p>Наведите камеру телефона на QR-код, чтобы перейти на сайт.</p><div class="qr-wrap">${image(state.view==='article'?'c804e.svg':'c5015.svg','qr-code','QR-код сайта клиники')}<a class="qr-link" href="https://nzdorovie.ru" target="_blank" rel="noopener noreferrer">nzdorovie.ru</a></div></div>`;
}
function merch() {
 const products=[['96d31.png','Шапочка для бассейна','Универсальный размер','650 ₽'],['9c23d.png','Тапочки для бассейна','Лёгкие, с нескользящей подошвой','890 ₽'],['08aaa.png','Ланчбокс','Удобный контейнер для перекуса','1 190 ₽'],['34546.png','Кружка','Керамика, объём 350 мл','790 ₽']];
 return `${back('На главную','home')}<h1>Сувениры клиники</h1><div class="list merch">${products.map(([file,title,sub,price])=>`<div class="result-row">${image(file,'avatar',title)}<div class="row-copy"><strong>${title}</strong><small>${sub}</small></div><span class="price">${price}</span></div>`).join('')}</div><div class="merch-note">${image('96edb.svg')}Покупка и выдача — на ресепшен</div>`;
}
function closed() {return `${back()}<div class="card"><h2>Кабинет 205</h2><p>Эндоскопический кабинет</p><p style="margin-top:16px">2 этаж · Отделение диагностики</p><div class="status" style="margin-top:28px">${image('11368.svg')}<div>Идёт ремонт<small>Кабинет временно недоступен</small></div></div><hr>${row('Колоноскопия под наркозом','Диагностика · ок. 40 мин','service','aee86.svg')}</div>`;}
function render(animate=true) {
 clearTimeout(searchTimer);
 panel.dataset.screen = state.missing?`missing-${state.view}`:state.view;
 const isSearch=['suggestions','results','empty','loading'].includes(state.view);
 const content=state.view==='home'?home():isSearch?searchContent():state.view==='doctor'?doctor():state.view==='service'?service():state.view==='route'?route():state.view==='merch'?merch():state.view==='closed'?closed():qr();
 panel.innerHTML=`<div class="panel-view ${['home',...['suggestions','results','empty','loading']].includes(state.view)?'':'details'} ${isSearch?'searching':''} ${animate?'enter':''}" data-node-id="${screens[state.view]||''}">${content}</div>`;
 renderMap();
 if(state.keyboard){const input=$('#search-input');input?.focus({preventScroll:true});input?.setSelectionRange(state.query.length,state.query.length);}
}
function renderMap() {
 $('.floor-controls').innerHTML=[1,2,3].map(floor=>`<button data-floor="${floor}" class="${state.floor===floor?'active':''}" aria-pressed="${state.floor===floor}">${floor}${state.floor===floor?' этаж':''}</button>`).join('');
 let html=`<div class="here"><span class="here-dot"></span>Вы здесь</div>`;
 if(state.view==='doctor'&&!state.missing){html+=`<div class="room-label">${image('1bcd4.svg')}Кабинет 205</div>`;}
 if(state.view==='route'){
  const two=state.floor===2;
  html=`${!two?`<div class="here"><span class="here-dot"></span>Вы здесь</div>`:image('f12cf.svg','room-highlight')}${image(two?'21df5.svg':'a3ad1.svg',`route-asset ${two?'floor2':'floor1'}`)}<div class="map-pin ${two?'lift2':'lift1'}">${image('4d093.svg')}Лифт</div>${two?`<div class="map-pin destination">${image('ed4ca.svg')}Кабинет ${state.kind==='service'?'204':'205'}</div>`:''}`;
 }
 overlay.innerHTML=html;
 world.style.transform=`translate(${state.panX}px,${state.panY}px) scale(${state.zoom})`;
}
function navigate(view, options={}) {
 clearTimeout(searchTimer);Object.assign(state,{view,keyboard:false,missing:false},options);
 if(view==='doctor'){state.kind='doctor';if(!state.missing)state.floor=2;}
 if(view==='service')state.kind='service';
 if(view==='home')Object.assign(state,{query:'',floor:1,zoom:1,panX:0,panY:0});
 render();announce(view==='route'?'Маршрут построен':view==='home'?'Главный экран':'Экран обновлён');resetIdle();
}
function search() {
 if(!state.query.trim()){navigate('home');return;}
 state.keyboard=false;state.view='loading';render();announce('Ищем…');
 searchTimer=setTimeout(()=>{
  state.view=/вак|мах|осте|денис|колон|нарк|эндос|диагн|205|204|мурад|терап|реаб|басс|лифт|гардер|лест|туал|ковор/i.test(state.query)?'results':'empty';state.tab='Все ответы';render();announce(state.view==='empty'?'Ничего не найдено':'Результаты поиска');
 },650);
}
function updateQuery(value) {
 state.query=value;state.view='suggestions';state.keyboard=true;
 const input=$('#search-input');if(input)input.value=value;
 const body=$('.search-body');if(body)body.innerHTML=value?suggestions():'';
 const form=$('.search');if(form&&!$('[data-action="clear-search"]',form)&&value){const button=document.createElement('button');button.type='button';button.dataset.action='clear-search';button.setAttribute('aria-label','Очистить поиск');button.innerHTML=image('cd16c.svg');form.insertBefore(button,$('.submit',form));}
}
function resetIdle() {
 clearTimeout(idleTimer);
 if(state.view!=='home'&&!state.modal&&!demoController)idleTimer=setTimeout(showTimeout,90000);
}
function showTimeout(){
 if(state.modal)return;state.modal=true;count=15;
 $('#modal-root').innerHTML=`<div class="modal-backdrop"><section class="timeout" role="dialog" aria-modal="true" aria-labelledby="timeout-title"><div class="countdown">${image('824d3.svg')}<strong id="countdown-number">15</strong><small>секунд</small></div><h2 id="timeout-title">Вы ещё здесь?</h2><p>Мы скоро вернёмся на главный экран, чтобы следующий посетитель мог воспользоваться терминалом</p>${primary('Продолжить работу','continue')}</section></div>`;
 $('[data-action="continue"]').focus();
 countdownTimer=setInterval(()=>{count--;$('#countdown-number').textContent=count;if(count<=0){closeTimeout();navigate('home');}},1000);
}
function closeTimeout(){clearInterval(countdownTimer);state.modal=false;$('#modal-root').innerHTML='';resetIdle();}
function action(name){
 if(name.startsWith('quick-')){const map={wardrobe:'Гардероб',wc:'Туалеты',lift:'Лифты',coworking:'Коворкинг',pool:'Бассейн',stairs:'Лестницы'};state.query=map[name.slice(6)];search();return;}
 if(name==='home')navigate('home');
 else if(name==='results'){if(!state.query)state.query='Вакцинация';navigate('results');}
 else if(['doctor','service','site','news','article','merch','closed'].includes(name))navigate(name);
 else if(name==='route')navigate('route',{floor:1});
 else if(name==='route-floor'){state.floor=state.floor===2?1:2;render();announce(`${state.floor} этаж`);}
 else if(name==='search')search();
 else if(name==='clear-search'){state.query='';navigate('suggestions',{keyboard:true});}
 else if(name==='backspace')updateQuery(state.query.slice(0,-1));
 else if(name==='continue')closeTimeout();
 else if(name==='zoom-in'||name==='zoom-out'){state.zoom=Math.max(.8,Math.min(2,state.zoom+(name==='zoom-in'?.2:-.2)));world.style.transform=`translate(${state.panX}px,${state.panY}px) scale(${state.zoom})`;}
 else if(name==='reset-map'){Object.assign(state,{zoom:1,panX:0,panY:0});world.style.transform='translate(0px,0px) scale(1)';}
}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.action)action(button.dataset.action);
 if(button.dataset.floor){state.floor=Number(button.dataset.floor);renderMap();announce(`${state.floor} этаж`);}
 if(button.dataset.tab){state.tab=button.dataset.tab;render(false);}
 if(button.dataset.key!==undefined)updateQuery(state.query+button.dataset.key.toLowerCase());
 resetIdle();
});
document.addEventListener('submit',event=>{if(event.target.matches('.search')){event.preventDefault();search();}});
document.addEventListener('focusin',event=>{
 if(event.target.id==='search-input'&&state.view!=='suggestions'){
  state.view='suggestions';state.keyboard=true;render(false);
 }
});
document.addEventListener('input',event=>{if(event.target.id==='search-input')updateQuery(event.target.value);});
document.addEventListener('keydown',event=>{
 if(state.modal){if(event.key==='Tab'){event.preventDefault();$('[data-action="continue"]').focus();}if(event.key==='Escape')closeTimeout();return;}
 if(event.key==='Escape'){if(demoController){demoController.abort();demoController=null;$('#demo-cursor').classList.remove('visible');}navigate('home');}
 if(!event.target.matches('input')&&event.key.toLowerCase()==='d')playDemo();
 if(!event.target.matches('input')&&event.key.toLowerCase()==='t')showTimeout();
 resetIdle();
});
let drag;
$('.map-viewport').addEventListener('pointerdown',event=>{if(state.zoom<=1)return;drag={x:event.clientX,y:event.clientY,panX:state.panX,panY:state.panY};event.currentTarget.setPointerCapture(event.pointerId);world.classList.add('dragging');});
$('.map-viewport').addEventListener('pointermove',event=>{if(!drag)return;const scale=stage.getBoundingClientRect().width/1920;state.panX=Math.max(-300,Math.min(300,drag.panX+(event.clientX-drag.x)/scale));state.panY=Math.max(-220,Math.min(220,drag.panY+(event.clientY-drag.y)/scale));world.style.transform=`translate(${state.panX}px,${state.panY}px) scale(${state.zoom})`;});
$('.map-viewport').addEventListener('pointerup',()=>{drag=null;world.classList.remove('dragging');});
$('.map-viewport').addEventListener('pointercancel',()=>{drag=null;world.classList.remove('dragging');});
// One optional, measured cursor walkthrough. No autoplay during normal use.
async function playDemo(){
 demoController?.abort();const controller=new AbortController();demoController=controller;closeTimeout();navigate('home');
 const cursor=$('#demo-cursor');cursor.classList.add('visible');
 const wait=ms=>new Promise((resolve,reject)=>{const timer=setTimeout(resolve,ms);controller.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new Error('cancelled'));},{once:true});});
 async function click(selector){
  const target=$(selector);if(!target)throw new Error(`Missing demo target: ${selector}`);
  const bounds=target.getBoundingClientRect(),stageBounds=stage.getBoundingClientRect(),scale=stageBounds.width/1920;
  const x=(bounds.left-stageBounds.left+bounds.width*.85)/scale,y=(bounds.top-stageBounds.top+bounds.height*.6)/scale;
  await cursor.animate([{transform:cursor.style.transform||'translate(1100px,700px)'},{transform:`translate(${x}px,${y}px)`}],{duration:reduced.matches?0:650,easing:'cubic-bezier(.45,0,.1,1)',fill:'forwards'}).finished;
  cursor.style.transform=`translate(${x}px,${y}px)`;await wait(180);await target.animate([{scale:1},{scale:.97},{scale:1}],{duration:180}).finished;target.click();
 }
 try{
  await wait(500);await click('#search-input');$('#search-input').focus();
  for(const char of 'Махонин'){updateQuery(state.query+char);await wait(115);}
  await wait(550);await click('[data-action="search"]');await wait(1050);
  await click('[data-action="doctor"]');await wait(1700);await click('[data-action="route"]');await wait(2400);await click('[data-action="route-floor"]');await wait(2400);
 }catch(error){if(!controller.signal.aborted)console.error(error);}
 finally{cursor.classList.remove('visible');demoController=null;resetIdle();}
}
const requested=new URLSearchParams(location.search).get('screen');
const aliases={'route1':'route','route2':'route','missing-doctor':'doctor','missing-service':'service','timeout':'doctor'};
if(requested){state.view=aliases[requested]|| (Object.hasOwn(screens,requested)?requested:'home');state.missing=requested.startsWith('missing-');state.floor=requested==='route2'||requested==='doctor'?2:1;if(['results','loading'].includes(state.view))state.query='Вакцинация';if(state.view==='empty')state.query='Ывапр';if(state.view==='suggestions'){state.query='Ма';state.keyboard=true;}}
render(false);resetIdle();if(requested==='timeout')showTimeout();if(new URLSearchParams(location.search).has('demo'))setTimeout(playDemo,600);
// Small inspection surface for automated acceptance; uses the same application actions.
window.prototype={navigate,search,state,playDemo};
