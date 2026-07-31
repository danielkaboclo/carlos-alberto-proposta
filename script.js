const deck = document.getElementById('deck');
const slides = [...document.querySelectorAll('.slide')];
const dotsRoot = document.getElementById('slideDots');
const progressBar = document.getElementById('progressBar');
const currentSlide = document.getElementById('currentSlide');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
let index = 0;
let locked = false;

slides.forEach((slide, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Ir para ${slide.dataset.title || `tela ${i + 1}`}`);
  dot.addEventListener('click', () => goTo(i));
  dotsRoot.appendChild(dot);
});
const dots = [...dotsRoot.children];

document.querySelectorAll('[data-go]').forEach(el => {
  el.addEventListener('click', () => goTo(Number(el.dataset.go) - 1));
});

function updateUI() {
  slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  currentSlide.textContent = String(index + 1).padStart(2, '0');
  progressBar.style.width = `${((index + 1) / slides.length) * 100}%`;
}

function goTo(target) {
  index = Math.max(0, Math.min(slides.length - 1, target));
  if (window.innerWidth > 900) {
    deck.scrollTo({ left: index * window.innerWidth, behavior: 'smooth' });
  } else {
    slides[index].scrollIntoView({ behavior: 'smooth' });
  }
  updateUI();
}

function step(direction) {
  if (locked || window.innerWidth <= 900) return;
  locked = true;
  goTo(index + direction);
  setTimeout(() => locked = false, 750);
}

window.addEventListener('wheel', (event) => {
  if (window.innerWidth <= 900) return;
  event.preventDefault();
  const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (Math.abs(delta) > 8) step(delta > 0 ? 1 : -1);
}, { passive: false });

window.addEventListener('keydown', (event) => {
  if (event.target.matches('input, textarea, select, button, [contenteditable=\"true\"]')) return;
  if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); step(1); }
  if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); step(-1); }
  if (event.key === 'Home') goTo(0);
  if (event.key === 'End') goTo(slides.length - 1);
});

prevBtn.addEventListener('click', () => step(-1));
nextBtn.addEventListener('click', () => step(1));
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) deck.scrollLeft = index * window.innerWidth;
});

updateUI();

// Interactive Carlos Virtual chat — autoplay when the slide becomes active
(() => {
  const slide = document.getElementById('slide-4');
  const chat = document.getElementById('chatArea');
  const input = document.getElementById('chatInput');
  const send = document.getElementById('chatTrigger');
  if (!slide || !chat || !input || !send) return;

  const initialConversation = [
    { type: 'client', text: 'Carlos, o evento S-1200 do colaborador João Silva foi transmitido corretamente?' },
    { type: 'typing', wait: 850 },
    { type: 'bot', text: 'Vou localizar a empresa e consultar a base documental vinculada ao atendimento.' },
    { type: 'card', company: 'Grupo Atlântico S.A.', detail: '248 documentos indexados · histórico tributário disponível' },
    { type: 'typing', wait: 1100 },
    { type: 'bot', text: 'Com base na documentação enviada pela Grupo Atlântico S.A., identifiquei que o evento S-1200 referente ao colaborador João Silva foi transmitido corretamente.' },
    { type: 'typing', wait: 700 },
    { type: 'bot', text: 'Deseja que eu gere um parecer técnico sobre este caso?' }
  ];

  const autoReplies = [
    'Consultei a base da empresa. Organizei a resposta com contexto, risco e próximos passos para validação final.',
    'Os documentos mais recentes foram localizados e vinculados ao histórico. Há um ponto que precisa de revisão técnica.',
    'A análise preliminar foi concluída. Posso gerar um resumo executivo ou detalhar a fundamentação técnica.'
  ];

  let runId = 0;
  let replyIndex = 0;
  let hasPlayed = false;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function scrollChat() {
    requestAnimationFrame(() => chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' }));
  }

  function addBubble(kind, text) {
    const el = document.createElement('div');
    el.className = `bubble ${kind}`;
    el.textContent = text;
    chat.appendChild(el);
    scrollChat();
    return el;
  }

  function addTyping() {
    const el = document.createElement('div');
    el.className = 'bubble bot typing-bubble';
    el.innerHTML = '<i></i><i></i><i></i>';
    chat.appendChild(el);
    scrollChat();
    return el;
  }

  function addDataCard(item) {
    const el = document.createElement('div');
    el.className = 'data-card';
    el.innerHTML = `<small>EMPRESA</small><strong>${item.company}</strong><span>${item.detail}</span>`;
    chat.appendChild(el);
    scrollChat();
  }

  async function playConversation(force = false) {
    if (hasPlayed && !force) return;
    hasPlayed = true;
    const currentRun = ++runId;
    chat.innerHTML = '';
    await sleep(350);
    for (const item of initialConversation) {
      if (currentRun !== runId || !slide.classList.contains('active')) return;
      if (item.type === 'typing') {
        const typing = addTyping();
        await sleep(item.wait);
        typing.remove();
      } else if (item.type === 'card') {
        addDataCard(item);
        await sleep(700);
      } else {
        addBubble(item.type, item.text);
        await sleep(item.type === 'client' ? 650 : 850);
      }
    }
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addBubble('client', text);
    send.disabled = true;
    const typing = addTyping();
    await sleep(950);
    typing.remove();
    addBubble('bot', autoReplies[replyIndex++ % autoReplies.length]);
    send.disabled = false;
    input.focus();
  }

  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });

  const observer = new MutationObserver(() => {
    if (slide.classList.contains('active')) playConversation(true);
    else runId++;
  });
  observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
  if (slide.classList.contains('active')) playConversation(true);
})();

// Fully interactive platform dashboard
(() => {
  const dashboard = document.getElementById('interactiveDashboard');
  const content = document.getElementById('dashboardContent');
  const toast = document.getElementById('dashToast');
  const slide = document.getElementById('slide-5');
  if (!dashboard || !content || !slide) return;

  const companies = [
    { name: 'Grupo Atlântico', cnpj: '12.345.678/0001-90', files: 42, status: 'Ativa', owner: 'Marina Costa', risk: 'Baixo' },
    { name: 'Nova Energia', cnpj: '48.222.111/0001-04', files: 18, status: 'Ativa', owner: 'Paulo Mendes', risk: 'Médio' },
    { name: 'Orbe Industrial', cnpj: '09.554.321/0001-77', files: 31, status: 'Revisão', owner: 'Juliana Rocha', risk: 'Alto' },
    { name: 'Ventura Logística', cnpj: '66.010.332/0001-15', files: 24, status: 'Ativa', owner: 'Rafael Lima', risk: 'Baixo' }
  ];
  const documents = [
    { name: 'Intimação_RFB_2026.pdf', company: 'Grupo Atlântico', type: 'PDF', status: 'Processado' },
    { name: 'Planilha_Créditos.xlsx', company: 'Nova Energia', type: 'XLSX', status: 'Analisando' },
    { name: 'Defesa_Administrativa.docx', company: 'Orbe Industrial', type: 'DOCX', status: 'Revisão' },
    { name: 'DCTFWeb_06-2026.pdf', company: 'Ventura Logística', type: 'PDF', status: 'Processado' }
  ];
  let activeTab = 'overview';

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function header(label, title, action = '') {
    return `<div class="dash-head"><div><small>${label}</small><h3>${title}</h3></div>${action}</div>`;
  }

  function renderOverview() {
    content.innerHTML = `
      ${header('Visão geral', 'Olá, Carlos.', '<button data-action="new-company">+ Nova empresa</button>')}
      <div class="kpi-grid">
        <article data-kpi><span>Empresas ativas</span><strong data-value="28">0</strong><small>+4 este mês</small></article>
        <article data-kpi><span>Documentos</span><strong data-value="1284">0</strong><small>98% processados</small></article>
        <article data-kpi><span>Interações IA</span><strong data-value="642">0</strong><small>87% resolvidas</small></article>
      </div>
      <div class="dash-grid">
        <article class="company-list"><h4>Empresas recentes</h4>${companies.slice(0,3).map((c,i)=>`<button class="company-row" data-company="${i}"><b>${c.name}</b><span>${c.files} arquivos</span><i>${c.status}</i></button>`).join('')}</article>
        <article class="upload-card"><h4>Upload centralizado</h4><button class="dropzone" id="dropzone" type="button"><span>＋</span>Arraste documentos ou clique para enviar</button><small>PDF, DOCX, XLSX e imagens</small></article>
      </div>`;
    animateCounters();
  }

  function renderCompanies() {
    content.innerHTML = `
      ${header('Empresas', 'Clientes cadastrados', '<button data-action="new-company">+ Nova empresa</button>')}
      <div class="dash-toolbar"><input id="companySearch" placeholder="Buscar empresa ou CNPJ"><select id="companyFilter"><option>Todos os status</option><option>Ativa</option><option>Revisão</option></select></div>
      <div class="interactive-table" id="companyTable">${companies.map((c,i)=>`<button class="table-row" data-company="${i}"><span><b>${c.name}</b><small>${c.cnpj}</small></span><span>${c.files} arquivos</span><span class="status ${c.status.toLowerCase()}">${c.status}</span><span>→</span></button>`).join('')}</div>
      <div class="detail-panel" id="companyDetail"><p>Selecione uma empresa para visualizar as informações.</p></div>`;
  }

  function renderDocuments() {
    content.innerHTML = `
      ${header('Documentos', 'Central de arquivos', '<button data-action="upload">Enviar documentos</button>')}
      <div class="dash-toolbar"><input id="docSearch" placeholder="Buscar documento"><select><option>Todos os tipos</option><option>PDF</option><option>DOCX</option><option>XLSX</option></select></div>
      <div class="document-grid">${documents.map((d,i)=>`<button class="document-card" data-document="${i}"><span class="file-icon">${d.type}</span><b>${d.name}</b><small>${d.company}</small><i>${d.status}</i></button>`).join('')}</div>
      <button class="dropzone wide" id="dropzone" type="button"><span>＋</span>Solte novos arquivos aqui ou clique para selecionar</button>`;
  }

  function renderKnowledge() {
    content.innerHTML = `
      ${header('Base da IA', 'Conhecimento do Carlos Virtual', '<button data-action="train">Treinar base</button>')}
      <div class="knowledge-search"><input id="knowledgeSearch" placeholder="Pergunte à base de conhecimento"><button data-action="ask-base">Consultar</button></div>
      <div class="knowledge-grid">
        <button class="knowledge-card active"><small>METODOLOGIA</small><b>Contencioso fiscal</b><span>184 fontes conectadas</span><i>Ativo</i></button>
        <button class="knowledge-card active"><small>CLIENTES</small><b>Históricos empresariais</b><span>28 bases contextualizadas</span><i>Ativo</i></button>
        <button class="knowledge-card"><small>JURISPRUDÊNCIA</small><b>Decisões e fundamentos</b><span>Atualizado há 2 dias</span><i>Sincronizar</i></button>
      </div>
      <div class="ai-answer" id="aiAnswer"><small>RESPOSTA DA BASE</small><p>Digite uma pergunta para consultar documentos, histórico e metodologia.</p></div>`;
  }

  function renderSettings() {
    content.innerHTML = `
      ${header('Configurações', 'Preferências da plataforma', '<button data-action="save-settings">Salvar alterações</button>')}
      <div class="settings-grid">
        <label><span>Nome do assistente<small>Como a IA será apresentada aos clientes.</small></span><input value="Carlos Virtual"></label>
        <label><span>Canal principal<small>Origem das conversas automatizadas.</small></span><select><option>WhatsApp</option><option>Portal do cliente</option></select></label>
        <label class="switch-row"><span>Revisão humana<small>Solicitar aprovação em respostas sensíveis.</small></span><input type="checkbox" checked><i></i></label>
        <label class="switch-row"><span>Notificações<small>Avisar sobre riscos e documentos pendentes.</small></span><input type="checkbox" checked><i></i></label>
        <label class="switch-row"><span>Resposta fora do horário<small>Atendimento contínuo para empresas clientes.</small></span><input type="checkbox" checked><i></i></label>
      </div>`;
  }

  const renderers = { overview: renderOverview, companies: renderCompanies, documents: renderDocuments, knowledge: renderKnowledge, settings: renderSettings };

  function render(tab) {
    activeTab = tab;
    dashboard.querySelectorAll('[data-dash-tab]').forEach(btn => btn.classList.toggle('on', btn.dataset.dashTab === tab));
    content.classList.remove('content-enter');
    renderers[tab]();
    requestAnimationFrame(() => content.classList.add('content-enter'));
  }

  function animateCounters() {
    content.querySelectorAll('[data-value]').forEach(el => {
      const target = Number(el.dataset.value);
      const start = performance.now();
      const duration = 900;
      const tick = now => {
        const p = Math.min(1, (now - start) / duration);
        const value = Math.round(target * (1 - Math.pow(1-p, 3)));
        el.textContent = value.toLocaleString('pt-BR');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function openNewCompany() {
    content.insertAdjacentHTML('beforeend', `<div class="dash-modal open" id="dashModal"><form><button type="button" class="modal-close">×</button><small>NOVA EMPRESA</small><h4>Cadastrar cliente</h4><input required placeholder="Razão social"><input required placeholder="CNPJ"><input placeholder="Responsável"><button class="modal-submit" type="submit">Salvar empresa</button></form></div>`);
    const modal = document.getElementById('dashModal');
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.querySelector('form').onsubmit = e => { e.preventDefault(); modal.remove(); notify('Empresa cadastrada com sucesso.'); };
  }

  async function simulateUpload(zone) {
    if (!zone || zone.classList.contains('uploading')) return;
    zone.classList.add('uploading');
    zone.innerHTML = '<span class="spinner"></span> Processando 8 documentos…';
    await new Promise(r => setTimeout(r, 1200));
    zone.classList.remove('uploading');
    zone.classList.add('done');
    zone.innerHTML = '<span>✓</span> 8 documentos enviados e vinculados';
    notify('Documentos disponíveis para a IA.');
  }

  dashboard.querySelectorAll('[data-dash-tab]').forEach(button => button.addEventListener('click', () => render(button.dataset.dashTab)));

  content.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'new-company') openNewCompany();
    if (action === 'upload') simulateUpload(content.querySelector('#dropzone') || (()=>{ const z=document.createElement('button'); return z; })());
    if (action === 'train') notify('Treinamento da base iniciado.');
    if (action === 'save-settings') notify('Configurações salvas.');
    if (action === 'ask-base') {
      const q = content.querySelector('#knowledgeSearch')?.value.trim();
      const answer = content.querySelector('#aiAnswer p');
      if (!q) { notify('Digite uma pergunta para consultar a base.'); return; }
      answer.textContent = 'Consultando documentos e metodologia…';
      setTimeout(() => answer.textContent = 'Foram localizadas 12 fontes relacionadas. A resposta pode ser estruturada com histórico, risco, prazo e recomendação técnica.', 800);
    }
    const zone = event.target.closest('#dropzone');
    if (zone) simulateUpload(zone);
    const companyButton = event.target.closest('[data-company]');
    if (companyButton) {
      const c = companies[Number(companyButton.dataset.company)];
      const detail = content.querySelector('#companyDetail');
      if (detail) detail.innerHTML = `<small>EMPRESA SELECIONADA</small><h4>${c.name}</h4><div><span>CNPJ</span><b>${c.cnpj}</b></div><div><span>Responsável</span><b>${c.owner}</b></div><div><span>Risco</span><b>${c.risk}</b></div><button data-action="open-company">Abrir cadastro completo</button>`;
      else notify(`${c.name}: ${c.files} arquivos, status ${c.status}.`);
    }
    const documentButton = event.target.closest('[data-document]');
    if (documentButton) {
      const d = documents[Number(documentButton.dataset.document)];
      notify(`${d.name} aberto em modo de visualização.`);
    }
    if (action === 'open-company') notify('Cadastro completo aberto.');
  });

  content.addEventListener('input', event => {
    if (event.target.id === 'companySearch') {
      const q = event.target.value.toLowerCase();
      content.querySelectorAll('#companyTable .table-row').forEach((row, i) => row.hidden = !`${companies[i].name} ${companies[i].cnpj}`.toLowerCase().includes(q));
    }
    if (event.target.id === 'docSearch') {
      const q = event.target.value.toLowerCase();
      content.querySelectorAll('.document-card').forEach((card, i) => card.hidden = !`${documents[i].name} ${documents[i].company}`.toLowerCase().includes(q));
    }
  });

  const observer = new MutationObserver(() => {
    if (slide.classList.contains('active')) render(activeTab);
  });
  observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
  render('overview');
})();
