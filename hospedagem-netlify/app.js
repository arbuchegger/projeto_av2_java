// Resolve links a partir da pasta real do script, inclusive em subpastas.
const siteBase = new URL('.', document.currentScript.src);
const siteUrl = path => new URL(path.replace(/^\//, ''), siteBase).href;
function localLinks(html) {
  return html.replace(/(href|src)="\/([^"]*)"/g, (_, attribute, path) => `${attribute}="${siteUrl(path)}"`);
}
async function api(path, options = {}) {
  if (path === '/api/carros') {
    const response = await fetch(siteUrl('/assets/catalogo.json'));
    if (!response.ok) throw new Error('Não foi possível carregar os carros.');
    return response.json();
  }
  throw new Error('Esta versão no Netlify apresenta o catálogo. Para consultar disponibilidade e registrar reservas, use a versão com servidor Java. Nenhuma reserva foi enviada.');
}

const cars = [
 {id:'golf-gti',name:'Golf GTI',version:'MK7 · O ÍCONE HOT HATCH',brand:'VOLKSWAGEN',category:'Hot hatch',tag:'Seu primeiro encontro com a pista',color:'Prata',story:'O ronco que você reconhece. A emoção que você ainda não conhece.',description:'Direção precisa, motor turbo e a agilidade que transformou três letras em uma lenda. O Golf GTI Mk7 combina confiança nas curvas com respostas rápidas do câmbio DSG. Uma porta de entrada inesquecível para a pilotagem esportiva.',traits:['Equilíbrio entre conforto e esportividade','Trocas rápidas com câmbio DSG','Tração dianteira e resposta progressiva']},
 {id:'porsche-gt4-rs',name:'Porsche GT4 RS',version:'718 CAYMAN · FEITO PARA A PISTA',brand:'PORSCHE',category:'Superesportivo',tag:'O ápice da sua experiência',color:'Prata',story:'Alguns sonhos fazem barulho. Este chega a 9.000 rpm.',description:'Motor central, aerodinâmica extrema e um seis-cilindros aspirado que transforma cada reta em um acontecimento. O 718 Cayman GT4 RS entrega precisão e uma conexão visceral com o asfalto. Uma experiência para guardar muito além da bandeirada.',traits:['Motor central e equilíbrio nas curvas','Aerodinâmica inspirada no automobilismo','Câmbio PDK e motor de alto giro']},
 {id:'sandero-rs',name:'Sandero RS',version:'2.0 · DIVERSÃO SEM FILTRO',brand:'RENAULT SPORT',category:'Manual',tag:'Você, o câmbio e a próxima curva',color:'Amarelo',story:'Menos distração. Mais conexão. Pilotagem em sua forma mais pura.',description:'Leve, direto e cheio de personalidade. O Sandero RS mostra que a emoção está na conexão entre piloto e carro. Com câmbio manual de seis marchas e acerto Renault Sport, cada troca e cada trajetória fazem parte da sua conquista.',traits:['Câmbio manual de seis marchas','Acerto esportivo Renault Sport','150 cv com etanol e muita personalidade']},
 {id:'gr-yaris',name:'GR Yaris',version:'1.6 TURBO · DNA DE RALI',brand:'TOYOTA GAZOO RACING',category:'Manual',tag:'Nascido no rali. Livre na pista.',color:'Branco',story:'Agarre o volante. Sinta as quatro rodas escreverem a sua história.',description:'Um compacto extraordinário, criado com o espírito da competição. O GR Yaris combina motor turbo, tração integral GR-FOUR e câmbio manual para uma pilotagem envolvente. Esta experiência considera a versão original de 261 cv, com transmissão manual.',traits:['Tração integral GR-FOUR','Câmbio manual de seis marchas','Construção compacta e foco em desempenho']}
];
const money = value => value.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const arrow = '<span aria-hidden="true">↗</span>';
function icons(html){return localLinks(html).replaceAll('↗','<svg class="arrow-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 19 19 5M5 5h14v14"/></svg>');}
const logo = '<img src="/assets/logo.svg" alt="Rancing Experience" width="225" height="44">';
const header = `<header class="header"><a href="/" class="logo" aria-label="Rancing Experience, início">${logo}</a><nav id="main-nav" aria-label="Navegação principal"><a href="/#frota">Os carros</a><a href="/#experiencia">A experiência</a><a href="/#como-funciona">Como funciona</a><a href="/#faq">Dúvidas</a></nav><button class="button small nav-cta" data-book>Quero pilotar ${arrow}</button><button class="menu-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="main-nav">☰</button></header>`;
const footer = `<footer><div class="footer-main"><a class="logo" href="/">${logo}</a><p>Mais do que dirigir.<br>Uma história para contar.</p><a class="text-link" href="/#frota">Encontre sua próxima emoção ${arrow}</a></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Rancing Experience</span><span>Projeto demonstrativo · Sem vínculo oficial com o autódromo ou as marcas.</span><button class="plain" data-saved>Minhas reservas</button></div></footer>`;
function card(c,i){return `<article class="car-card"><a href="/carros/${c.id}.html" class="car-image"><span class="number">0${i+1} /</span><img src="/assets/${c.id}.png" alt="Ilustração conceitual do ${c.name}" loading="lazy"><span class="car-tag">${c.category}</span><span class="image-arrow">↗</span></a><div class="car-info"><span class="eyebrow">${c.brand}</span><h3><a href="/carros/${c.id}.html">${c.name}</a></h3><p>${c.tag}</p><div class="car-specs"><span><strong>${c.power}</strong> cv</span><span><strong>${c.zero}s</strong> 0–100 km/h</span></div><div class="card-bottom"><div><strong>${money(c.price)}</strong><span> / hora</span></div><a href="/carros/${c.id}.html" aria-label="Conhecer ${c.name}">Conhecer ${arrow}</a></div></div></article>`;}
function home(){return `${header}<main><section class="hero"><div class="hero-photo"></div><div class="hero-overlay"></div><div class="hero-content"><div class="eyebrow light"><span class="live-dot"></span> AUTÓDROMO INTERNACIONAL DA PARAÍBA</div><h1>O próximo<br>limite é <em>seu.</em></h1><p>Saia da arquibancada. Entre no cockpit.<br>Transforme a vontade de acelerar em uma<br class="desktop-break"> história que só você pode contar.</p><a class="button" href="#frota">Escolha sua máquina ${arrow}</a><div class="hero-caption"><span class="tiny-line"></span> O asfalto está esperando por você.</div></div><div class="hero-bottom"><span>O SEU PRÓXIMO DESTINO<br><b>PARAÍBA · BRASIL</b></span><span class="hero-scroll">SINTA. ACELERE. VIVA. <a href="#experiencia" aria-label="Conhecer experiência">↓</a></span></div><span class="photo-credit">Imagem ilustrativa gerada por IA</span></section><div class="ticker"><span>ADRENALINA DE VERDADE</span><i>✦</i><span>VOCÊ NO COMANDO</span><i>✦</i><span>MEMÓRIAS EXTRAORDINÁRIAS</span><i>✦</i><span>DNA DE COMPETIÇÃO</span><i>✦</i></div><section class="section fleet" id="frota"><div class="section-top"><div><span class="eyebrow">01 / ESCOLHA SUA EMOÇÃO</span><h2>Quatro máquinas.<br><span>Infinitas sensações.</span></h2></div><p>Da primeira curva ao último suspiro de adrenalina.<br>Encontre o carro que faz seu coração acelerar.</p></div><div class="fleet-toolbar"><div class="filters" role="group" aria-label="Filtrar carros">${['Todos','Manual','Hot hatch','Superesportivo'].map((x,i)=>`<button class="filter ${i===0?'active':''}" data-filter="${x}" aria-pressed="${i===0}">${x}</button>`).join('')}</div><span id="car-count" aria-live="polite">04 carros. Um deles é o seu.</span></div><div class="car-grid" id="car-grid">${cars.map(card).join('')}</div><p class="fineprint">Valores por hora propostos para demonstração. Imagens ilustrativas geradas por IA. Especificações de referência; configuração e disponibilidade precisam ser confirmadas antes da contratação.</p></section><section class="experience section" id="experiencia"><div class="experience-intro"><span class="eyebrow">02 / NÃO É SÓ SOBRE VELOCIDADE</span><h2>Tem coisas que<br>você precisa<br><em>sentir.</em></h2><p>O frio na barriga antes de sair dos boxes.<br>O motor respondendo ao seu pé.<br>O sorriso que fica depois da última volta.</p><a href="#frota" class="text-link">Encontre a sua experiência ${arrow}</a><div class="circuit-art" aria-hidden="true"><svg viewBox="0 0 300 170"><path d="M30 112Q12 135 43 145L212 145Q270 145 271 115Q271 92 242 90L214 90Q198 90 201 69L209 38Q210 19 189 21L160 24Q143 24 145 43L146 68Q146 82 126 82L70 81Q47 80 48 98L48 112Z"/></svg><span>SEU LUGAR É NA PISTA.</span></div></div><div class="benefit-grid"><article><span class="benefit-icon">↗</span><span class="eyebrow">01</span><h3>Carros que despertam</h3><p>Quatro personalidades de pilotagem. Do prazer do câmbio manual à precisão de um superesportivo.</p></article><article><span class="benefit-icon">◎</span><span class="eyebrow">02</span><h3>Um cenário à altura</h3><p>A proposta é viver a experiência em circuito fechado, no Autódromo Internacional da Paraíba.</p></article><article><span class="benefit-icon">◷</span><span class="eyebrow">03</span><h3>No seu ritmo</h3><p>Reserve de uma a quatro horas e descubra o formato que combina com a sua vontade de pilotar.</p></article><article><span class="benefit-icon">⚑</span><span class="eyebrow">04</span><h3>Uma nova história</h3><p>Um presente para você ou para quem compartilha a paixão por carros. Memórias que vão além de uma foto.</p></article></div></section><section class="section steps-section" id="como-funciona"><div class="section-top"><div><span class="eyebrow">03 / DO SONHO AOS BOXES</span><h2>A próxima volta<br>começa aqui.</h2></div><a href="#frota" class="button dark">Vamos para a pista ${arrow}</a></div><div class="steps"><article><span>01</span><h3>Escolha seu carro</h3><p>Conheça as máquinas, compare as sensações e encontre a que combina com você.</p></article><article><span>02</span><h3>Monte sua experiência</h3><p>Escolha uma data e a duração. Veja o valor calculado antes de registrar sua reserva.</p></article><article><span>03</span><h3>Prepare-se para sentir</h3><p>Em uma operação real, disponibilidade, briefing e condições seriam confirmados pela equipe.</p></article></div></section><section class="faq-section section" id="faq"><div><span class="eyebrow">04 / ANTES DE ACELERAR</span><h2>Tire a dúvida.<br>Fique com a vontade.</h2></div><div class="faqs">${[['Preciso ter experiência em pista?','A proposta contempla diferentes níveis de pilotagem. Em uma contratação real, a equipe deve avaliar seu perfil e definir orientação, briefing e regras de participação antes de qualquer atividade.'],['Como funciona o aluguel por hora?','Escolha carro, data, horário e duração de 1 a 4 horas, entre 08h e 18h. O Java verifica conflitos e calcula o total pelo preço por hora multiplicado pela duração. Os valores são demonstrativos e não incluem uma proposta comercial válida.'],['O GR Yaris tem câmbio manual?','Sim. A versão apresentada é o GR Yaris original de 261 cv, com câmbio manual de seis marchas e tração integral GR-FOUR.'],['O que acontece ao registrar uma reserva?','O servidor Java valida o horário, calcula o valor e salva a reserva em arquivo. Você pode consultá-la e cancelá-la em Minhas reservas neste navegador. É um registro acadêmico, sem pagamento ou contratação de uma experiência real.'],['Onde acontece a experiência?','O local proposto é o Autódromo Internacional da Paraíba. Este projeto não representa uma operação oficial ou parceria confirmada com o autódromo.']].map(([q,a])=>`<details><summary>${q}<span>+</span></summary><p>${a}</p></details>`).join('')}</div></section><section class="final-cta"><span class="eyebrow">ALGUNS MOMENTOS NÃO CABEM NA ROTINA.</span><h2>Esse pode ser <em>o seu.</em></h2><a href="#frota" class="button">Quero viver essa experiência ${arrow}</a><span class="cta-watermark" aria-hidden="true">RACING SPIRIT.</span></section></main>${footer}`;}
function detail(c){return `${header}<main class="detail-main"><div class="breadcrumb"><a href="/">Início</a><span>/</span><a href="/#frota">Os carros</a><span>/</span><span>${c.name}</span></div><section class="detail-hero"><div class="detail-copy"><span class="eyebrow">${c.version}</span><h1>${c.name}</h1><h2>${c.story}</h2><p>${c.description}</p><div class="detail-stats"><div><strong>${c.zero}<small>s</small></strong><span>0–100 km/h</span></div><div><strong>${c.power}<small>cv</small></strong><span>Potência</span></div><div><strong>${c.id==='gr-yaris'?'4×4':'Foco'}</strong><span>${c.id==='gr-yaris'?'GR-FOUR':'na pilotagem'}</span></div></div></div><div class="detail-visual"><span class="eyebrow">${c.brand}</span><img src="/assets/${c.id}.png" alt="Ilustração conceitual do ${c.name}"><span>IMAGEM GERADA POR IA · CONFIGURAÇÃO DE REFERÊNCIA</span></div></section><section class="detail-lower"><div><span class="eyebrow">A MÁQUINA EM DETALHES</span><h2>Conexão em cada curva.</h2><ul class="traits">${c.traits.map(x=>`<li><span>↗</span>${x}</li>`).join('')}</ul><dl class="spec-table"><div><dt>Motor</dt><dd>${c.engine}</dd></div><div><dt>Transmissão</dt><dd>${c.gear}</dd></div><div><dt>Local proposto</dt><dd>Autódromo Internacional da Paraíba</dd></div></dl><p class="fineprint">Dados de referência de fábrica para as versões indicadas. O desempenho varia com configuração, combustível e condições de uso.</p></div><aside class="booking-panel"><span class="eyebrow">SEU PRÓXIMO GRANDE MOMENTO</span><div class="detail-price">${money(c.price)}<small>/ hora</small></div><p>Escolha quanto tempo a emoção vai durar.</p><label for="detail-hours">Duração <strong id="duration-label">1 hora</strong></label><input id="detail-hours" type="range" min="1" max="4" value="1"><div class="range-labels"><span>1h</span><span>2h</span><span>3h</span><span>4h</span></div><div class="total-row"><span>Total da experiência</span><strong id="detail-total">${money(c.price)}</strong></div><button class="button full" data-book="${c.id}">Quero pilotar esse carro ${arrow}</button><p class="fineprint">Reserva registrada pelo Java. Preço demonstrativo.<br>Sem cobrança ou contratação comercial.</p></aside></section><section class="section related"><div class="section-top"><div><span class="eyebrow">AINDA ESTÁ EM DÚVIDA?</span><h2>Outras formas de sentir.</h2></div><a href="/#frota" class="text-link">Ver todos ${arrow}</a></div><div class="car-grid related-grid">${cars.filter(x=>x.id!==c.id).map(card).join('')}</div></section></main>${footer}`;}
async function initialize() {
try {
  const catalogue=await api('/api/carros');
  for(const car of cars) {
    const data=catalogue.find(item=>item.id===car.id);
    if(!data)throw new Error('Catálogo incompleto.');
    Object.assign(car,data);
  }
} catch {
  document.getElementById('app').innerHTML=localLinks('<main class="section"><h1>Abra o site pelo Java.</h1><p>Use o arquivo RancingExperience.jar ou ABRIR-SITE.bat. Ele inicia o site e abre seu navegador. Abrir index.html ou usar apenas um servidor de arquivos não inicia as reservas.</p><a class="button" href="/">Tentar novamente</a></main>');
  return;
}
const selected = cars.find(c=>location.pathname===new URL(`carros/${c.id}.html`,siteBase).pathname);
document.getElementById('app').innerHTML=icons(selected?detail(selected):home());
let lastFocus;
function closeModal(){document.getElementById('modal-root').innerHTML='';document.body.classList.remove('modal-open');lastFocus?.focus();}
function readReferences() {
  try {
    const refs = JSON.parse(localStorage.getItem('rancing-reservations') || '[]');
    return Array.isArray(refs) ? refs.filter(r => /^[a-f0-9-]{36}$/.test(r.id) && /^[a-f0-9-]{36}$/.test(r.token)) : [];
  } catch { return []; }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function reservationSummary(booking) {
  const c = cars.find(c => c.id === booking.car);
  return `<div class="saved-summary"><strong>${escapeHtml(c?.name || booking.car)}</strong><p>${new Date(booking.date+'T12:00:00').toLocaleDateString('pt-BR')} · ${escapeHtml(booking.time)} · ${booking.hours} hora(s)</p><p>Em nome de ${escapeHtml(booking.name)}</p><b>${money(booking.total)}</b><span class="reservation-status ${booking.cancelled?'cancelled':''}">${booking.cancelled?'Cancelada':'Registrada no projeto'}</span><small>Código: ${escapeHtml(booking.id)}</small></div>`;
}
function showReservation(booking, reference) {
  showModal(`<button class="close-modal" aria-label="Fechar">×</button><span class="eyebrow">${booking.cancelled?'RESERVA CANCELADA':'RESERVA SALVA NO SERVIDOR JAVA'}</span><h2>${booking.cancelled?'Até a próxima<br>experiência.':'Sua próxima história<br>começa aqui.'}</h2>${reservationSummary(booking)}<p>Horário de Brasília. Registro acadêmico, sem pagamento ou contratação de uma experiência real.</p><p id="reservation-error" role="alert"></p>${booking.cancelled?'':`<button class="button full" id="cancel-book">Cancelar esta reserva</button>`}<button class="plain full remove-book" id="all-bookings">Ver minhas reservas</button>`);
  document.getElementById('all-bookings').onclick = showSaved;
  const cancel = document.getElementById('cancel-book');
  if (cancel) cancel.onclick = async () => {
    cancel.disabled = true;
    cancel.textContent = 'Cancelando…';
    try {
      const result = await api(`/api/reservas/${reference.id}`, {method:'DELETE',headers:{Authorization:`Bearer ${reference.token}`}});
      if (document.getElementById('cancel-book') === cancel) showReservation(result, reference);
    } catch (error) {
      const message = document.getElementById('reservation-error');
      if (message) message.textContent = error.message;
      cancel.disabled = false;
      cancel.textContent = 'Cancelar esta reserva';
    }
  };
}
async function showSaved() {
  showModal('<button class="close-modal" aria-label="Fechar">×</button><span class="eyebrow">MINHAS RESERVAS</span><h2>Suas próximas<br>histórias.</h2><div id="reservation-list" aria-live="polite">Consultando o servidor Java…</div><button class="button full" id="new-book">Nova reserva ↗</button><p class="fineprint">As chaves de consulta ficam neste navegador. Não limpe o armazenamento se quiser manter o acesso.</p>');
  document.getElementById('new-book').onclick = () => openBooking();
  const list = document.getElementById('reservation-list');
  const refs = readReferences();
  if (!refs.length) { list.textContent = 'Você ainda não tem reservas salvas neste navegador.'; return; }
  const results = await Promise.all(refs.map(async reference => {
    try { return {reference,booking:await api(`/api/reservas/${reference.id}`,{headers:{Authorization:`Bearer ${reference.token}`}})}; }
    catch (error) { return {reference,error:error.message}; }
  }));
  if (!list.isConnected) return;
  list.innerHTML = results.map((result,index) => result.booking
    ? `<article class="reservation-entry">${reservationSummary(result.booking)}<button class="plain" data-reservation-index="${index}">Consultar reserva ↗</button></article>`
    : `<p class="reservation-error">${escapeHtml(result.error)}</p>`).join('');
  list.querySelectorAll('[data-reservation-index]').forEach(button => {
    button.onclick = () => { const result=results[Number(button.dataset.reservationIndex)]; showReservation(result.booking,result.reference); };
  });
}
function showModal(content) {
  if (!document.querySelector('.modal-backdrop')) lastFocus=document.activeElement;
  document.getElementById('modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="Reserva de experiência">${icons(content)}</section></div>`;
  document.body.classList.add('modal-open');
  document.querySelector('.close-modal').onclick=closeModal;
  document.querySelector('.modal-backdrop').onclick=e=>{if(e.target===e.currentTarget)closeModal();};
  document.querySelector('.close-modal').focus();
}
function openBooking(id) {
  const c=cars.find(c=>c.id===id)||selected||cars[0];
  const hours=Number(document.getElementById('detail-hours')?.value)||1;
  const dateParts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part=type=>dateParts.find(p=>p.type===type).value;
  const min=`${part('year')}-${part('month')}-${part('day')}`;
  showModal(`<button class="close-modal" aria-label="Fechar">×</button><span class="eyebrow">SEU LUGAR É NO COCKPIT</span><h2>Reserve sua<br>experiência.</h2><p>Escolha seu carro e um horário. Nesta hospedagem, as reservas estão indisponíveis. Use a versão com servidor Java para reservar.</p><form id="booking-form"><label for="booking-name">Seu nome</label><input id="booking-name" name="name" type="text" required minlength="2" maxlength="80" autocomplete="name" placeholder="Como podemos chamar você?"><label for="booking-car">Sua máquina</label><select id="booking-car" name="car">${cars.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${x.name} — ${money(x.price)}/h</option>`).join('')}</select><label for="booking-date">Data desejada</label><input id="booking-date" type="date" name="date" required min="${min}"><div class="form-row"><div><label for="booking-time">Início · Brasília</label><select id="booking-time" name="time">${Array.from({length:10},(_,i)=>i+8).map(hour=>`<option value="${String(hour).padStart(2,'0')}:00" ${hour===9?'selected':''}>${String(hour).padStart(2,'0')}:00</option>`).join('')}</select></div><div><label for="booking-hours">Duração</label><select id="booking-hours" name="hours">${[1,2,3,4].map(x=>`<option value="${x}" ${x===hours?'selected':''}>${x} hora${x>1?'s':''}</option>`).join('')}</select></div></div><p class="fineprint">Funcionamento do projeto: 08h às 18h. Duração de 1 a 4 horas.</p><div class="modal-estimate"><span>Total estimado</span><strong id="booking-total" aria-live="polite">${money(c.price*hours)}</strong></div><button type="button" class="plain" id="check-availability">Consultar disponibilidade</button><p id="availability-result" aria-live="polite"></p><label class="checkbox"><input type="checkbox" name="accepted" required> <span>Entendo que a reserva é um registro neste projeto acadêmico, com preços demonstrativos, sem pagamento ou contratação real.</span></label><p id="form-error" role="alert"></p><button class="button full" type="submit">Registrar minha reserva ${arrow}</button><p class="fineprint">O nome e a reserva serão salvos no servidor. Nenhum pagamento é solicitado.</p></form>`);
  const form=document.getElementById('booking-form');
  const fields=()=>new URLSearchParams({car:form.elements.car.value,name:form.elements.name.value.trim(),date:form.elements.date.value,time:form.elements.time.value,hours:form.elements.hours.value,accepted:String(form.elements.accepted.checked)});
  let version=0;
  function update() {
    version++;
    const car=cars.find(x=>x.id===form.elements.car.value);
    document.getElementById('booking-total').textContent=money(car.price*Number(form.elements.hours.value));
    document.getElementById('availability-result').textContent='';
    document.getElementById('form-error').textContent='';
    const limit=18-Number(form.elements.hours.value);
    [...form.elements.time.options].forEach(option=>option.disabled=Number(option.value.slice(0,2))>limit);
    if (Number(form.elements.time.value.slice(0,2))>limit) form.elements.time.value=`${String(limit).padStart(2,'0')}:00`;
  }
  form.onchange=update;
  update();
  document.getElementById('check-availability').onclick=async()=>{
    const date=form.elements.date;
    if(!date.reportValidity())return;
    const revision=version;
    const message=document.getElementById('availability-result');
    message.textContent='Consultando…';
    try {
      const values=fields();
      const query=new URLSearchParams(['car','date','time','hours'].map(key=>[key,values.get(key)]));
      const result=await api('/api/disponibilidade?'+query);
      if (form.isConnected&&revision===version) {
        message.textContent=result.available?'Horário disponível. Registre a reserva para garantir o período no projeto.':'Esse período já está ocupado. Escolha outro horário ou carro.';
        message.className=result.available?'available':'unavailable';
        document.getElementById('booking-total').textContent=money(result.total);
      }
    } catch(error) { if(message.isConnected&&revision===version) message.textContent=error.message; }
  };
  form.onsubmit=async e=>{
    e.preventDefault();
    const submit=form.querySelector('button[type=submit]');
    submit.disabled=true;
    submit.textContent='Registrando…';
    try {
      // Verifica o armazenamento antes de criar para não perder a chave de consulta.
      try {localStorage.setItem('rancing-storage-check','1');localStorage.removeItem('rancing-storage-check');}
      catch {throw new Error('Permita o armazenamento local para guardar a chave de acesso à sua reserva.');}
      const result=await api('/api/reservas',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:fields()});
      const reference={id:result.id,token:result.token};
      const refs=readReferences();
      refs.push(reference);
      localStorage.setItem('rancing-reservations',JSON.stringify(refs));
      if(form.isConnected)showReservation(result,reference);
    } catch(error) {
      if(form.isConnected){document.getElementById('form-error').textContent=error.message;submit.disabled=false;submit.innerHTML=icons(`Registrar minha reserva ${arrow}`);}
    }
  };
}
document.addEventListener('click',e=>{const book=e.target.closest('[data-book]');if(book)openBooking(book.dataset.book);if(e.target.closest('[data-saved]'))showSaved();const filter=e.target.closest('[data-filter]');if(filter){document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===filter);b.setAttribute('aria-pressed',String(b===filter));});const filtered=cars.filter(c=>filter.dataset.filter==='Todos'||(filter.dataset.filter==='Hot hatch'?c.id!=='porsche-gt4-rs':c.category===filter.dataset.filter));document.getElementById('car-grid').innerHTML=icons(filtered.map(c=>card(c,cars.indexOf(c))).join(''));document.getElementById('car-count').textContent=`${String(filtered.length).padStart(2,'0')} carro${filtered.length>1?'s':''} para descobrir.`;}const menu=e.target.closest('.menu-toggle');if(menu){const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));document.getElementById('main-nav').classList.toggle('open',open);}if(e.target.closest('#main-nav a')){document.getElementById('main-nav').classList.remove('open');document.querySelector('.menu-toggle').setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{const modal=document.querySelector('.modal');if(!modal)return;if(e.key==='Escape')closeModal();if(e.key==='Tab'){const els=[...modal.querySelectorAll('a,button,input,select,[tabindex="0"]')].filter(el=>!el.disabled);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
const range=document.getElementById('detail-hours');if(range)range.oninput=()=>{document.getElementById('duration-label').textContent=range.value+' hora'+(range.value>1?'s':'');document.getElementById('detail-total').textContent=money(selected.price*Number(range.value));};

}
initialize();
