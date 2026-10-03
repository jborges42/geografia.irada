'use strict';
/* Geografia Irada — HUD da partida (frente Partida; guia de arte §5.4, §5.6–5.9, §5.19).
   Topo: ano/mandato/estado do mundo + 6 indicadores globais (com o Relógio do Juízo Final). Coluna esquerda: placar das
   delegações, com a equipe da vez expandida em painel (CP em pinos, recursos, missão secreta, 5 indicadores). Embaixo: a doca
   (barra de ações em tijolos + Encerrar vez), o letreiro do Jornal Mundial e as peças temporárias (ficha da ação, faixa de
   instrução, faixa "decidindo…" do computador, balão do território, detalhe do indicador).
   Contrato: Hud.montar(), Hud.atualizar(e, { mudancas, vez }), Hud.manchete(texto). O resto é usado por js/jogo.js. */

const Hud = (() => {
  const ic = (e, px = 48) => imgIcone(e, px);
  const nomePot = id => (typeof Simulacao !== 'undefined' ? Simulacao.nome(id) : id);
  const com = (id, prep) => (typeof Simulacao !== 'undefined' ? Simulacao.com(id, prep) : nomePot(id));
  const carta = id => POLITICAS.find(c => c.id === id);
  const r0 = v => Math.round(v);
  const vezDe = pid => `Vez ${prepDe(pid)} ${nomeCurto(pid)}`;   // "Vez dos EUA": cabe no painel
  const plural = pid => /s$/.test(TERRITORIOS.find(t => t.id === pid)?.artigo || POTENCIAS.find(p => p.id === pid)?.artigo || '');
  const maiuscula = t => t.charAt(0).toUpperCase() + t.slice(1);

  // ============================== INDICADORES GLOBAIS (guia §2.7) ==============================
  // nivel: bom ✓ · medio ! · risco !! · critico ✕ (sempre com o símbolo e a palavra)
  const SIMBOLO = { bom: GLIFOS.ok, medio: '!', risco: '!!', critico: GLIFOS.nao };
  const IND = [
    { k: 'comercio', nome: 'Comércio', ico: '🚢', marcas: [40, 75],
      estado: v => (v < 25 ? ['critico', 'Fragmentado'] : v < 40 ? ['risco', 'Fragmentado'] : v > 75 ? ['medio', 'Globalização acelerada'] : ['bom', 'Normal']),
      porque: 'Navios e acordos ligam as economias. Cai com tarifas, sanções e conflitos nas rotas; abaixo de 40, o mundo se fecha.' },
    { k: 'cooperacao', nome: 'Cooperação', ico: '🕊️', marcas: [30, 70],
      estado: v => (v < 20 ? ['critico', 'Cada um por si'] : v < 30 ? ['risco', 'Cada um por si'] : v < 45 ? ['medio', 'Normal'] : v > 70 ? ['bom', 'Multilateralismo forte'] : ['bom', 'Normal']),
      porque: 'Quanto os países confiam uns nos outros. Sobe com acordos e ajuda; cai com vetos, sanções e quem só pensa em si.' },
    { k: 'temperatura', nome: 'Temperatura', ico: '🌡️', termo: true,
      estado: v => (v <= 1.5 ? ['bom', 'Meta de Paris'] : v < 1.8 ? ['medio', 'Risco'] : v < 2.0 ? ['risco', 'Perigo'] : ['critico', 'Colapso à vista']),
      porque: 'Aquecimento desde a era pré-industrial. O Acordo de Paris pede até 1,5 °C; em 2,2 °C o clima sai do controle e a partida acaba.' },
    { k: 'tensao', nome: 'Relógio', relogio: true,
      estado: v => (v < 60 ? ['bom', 'Calmo'] : v < 80 ? ['medio', 'Alerta'] : v < 90 ? ['risco', 'Crise'] : ['critico', 'Meia-noite']),
      porque: 'Segundos até a meia-noite do Relógio do Juízo Final. Conflitos e corrida armamentista adiantam o relógio; mediação e desarmamento atrasam.' },
    { k: 'deslocados', nome: 'Deslocados', ico: '🧳', total: 20, max: 200, marcas: [75],
      estado: v => (v < 100 ? ['bom', 'Estável'] : v < 150 ? ['medio', 'Estável'] : v < 180 ? ['risco', 'Emergência'] : ['critico', 'Catástrofe']),
      porque: 'Pessoas forçadas a deixar suas casas por guerras e desastres. Em 150 milhões é emergência; em 200 milhões, catástrofe humanitária.' },
    { k: 'energia', nome: 'Energia', ico: '🛢️', marcas: [35, 50, 70],
      estado: v => (v < 35 ? ['bom', 'Energia barata'] : v < 55 ? ['bom', 'Normal'] : v < 70 ? ['medio', 'Normal'] : v < 85 ? ['risco', 'Crise do petróleo'] : ['critico', 'Crise do petróleo']),
      porque: 'Preço do petróleo e do gás. Dispara com guerras em regiões produtoras; energia limpa deixa o mundo menos dependente.' },
  ];
  const ORDEM_NIVEL = ['bom', 'medio', 'risco', 'critico'];
  const MUNDO = { bom: 'Calmo', medio: 'Em alerta', risco: 'Em crise', critico: 'À beira do colapso' };
  const segundos = tensao => Math.max(0, r0((100 - tensao) * 3));
  // valor na peça: número (que salta) + unidade a 55%
  const numDe = (k, v) => (k === 'tensao' ? segundos(v) : k === 'temperatura' ? v : r0(v));
  const UNIDADE = { temperatura: FINO + '°C', tensao: FINO + 's', deslocados: FINO + 'mi' };
  const valorFala = (k, v) => (k === 'temperatura' ? fmtGraus(v) : k === 'tensao' ? `${segundos(v)} segundos para a meia-noite`
    : k === 'deslocados' ? fmtMilhoes(r0(v)) : String(r0(v)));

  // ============================== NAÇÃO, RECURSOS, CONTINENTES ==============================
  const NACAO = [['economia', '💰', 'Economia'], ['bemEstar', '❤️', 'Bem-estar'], ['ambiente', '🌳', 'Ambiente'], ['seguranca', '🛡️', 'Segurança'], ['apoio', '🗳️', 'Apoio popular']];
  const RECURSOS = [['alimentos', '🌾', 'alimentos'], ['energia', '⚡', 'energia'], ['minerais', '💎', 'minerais'], ['tecnologia', '💻', 'tecnologia']];
  const ICO_REC = Object.fromEntries(RECURSOS.map(([k, e]) => [k, e]));
  const CONTINENTE = { an: 'América do Norte', as: 'América do Sul', eu: 'Europa', af: 'África', ai: 'Ásia', oc: 'Oceania', po: 'Polos' };

  // Nome do tijolo de ação: até 2 linhas de ~10 letras (guia §5.4). O campo `curto` do conteúdo vale mais (pendência).
  const CURTOS = {
    missao_diplomatica: 'Missão', cooperacao_sul_sul: 'Cooperação\nSul-Sul', propor_resolucao: 'Propor\nresolução', sancoes: 'Sanções\neconômicas',
    alianca: 'Aliança\nestratégica', cupula_regional: 'Cúpula\nregional', livre_comercio: 'Livre-\ncomércio', tarifas: 'Tarifas de\nimportação',
    infraestrutura_exterior: 'Obras no\nexterior', exportar_commodities: 'Exportar\ncommodities', politica_industrial: 'Política\nindustrial',
    transnacionais: 'Atrair\nempresas', emprestimo: 'Empréstimo\nde resgate', energia_renovavel: 'Energia\nrenovável', explorar_petroleo: 'Petróleo\ne gás',
    desmatamento_zero: 'Desmata-\nmento zero', fronteira_agricola: 'Fronteira\nagrícola', fundo_climatico: 'Fundo\nclimático',
    florestas_tropicais: 'Fundo para\nflorestas', meta_climatica: 'Meta\nclimática', minerais_criticos: 'Minerais\ncríticos', nuclear: 'Energia\nnuclear',
    adaptacao: 'Adaptação\nclimática', defesa: 'Ampliar a\ndefesa', ciberdefesa: 'Ciber-\ndefesa', mediacao: 'Mediação\nde paz', reconstrucao: 'Recons-\ntrução',
    base_militar: 'Base\nmilitar', crime_transnacional: 'Crime trans-\nnacional', desarmamento: 'Desarma-\nmento', acolher_refugiados: 'Acolher\nrefugiados',
    ajuda_humanitaria: 'Ajuda\nhumanitária', educacao: 'Investir em\neducação', saude: 'Saúde e\nvacinas', combate_fome: 'Combate\nà fome',
    povos_originarios: 'Indígenas e\nquilombolas', fechar_fronteiras: 'Fechar\nfronteiras', pesquisa: 'Pesquisa e\ninovação',
    combate_desinformacao: 'Checar\nnotícias', programa_espacial: 'Programa\nespacial', soft_power: 'Diplomacia\ncultural', internet_para_todos: 'Internet e\ncabos',
  };
  const curto = c => c.curto ?? CURTOS[c.id] ?? c.nome;

  // Efeito → chip em linguagem simples: [ícone, palavra, bom quando sobe? (1 sim, −1 não, 0 neutro), casas]
  const EFEITO = {
    economia: ['💰', 'Economia', 1], bemEstar: ['❤️', 'Bem-estar', 1], ambiente: ['🌳', 'Ambiente', 1], seguranca: ['🛡️', 'Segurança', 1],
    apoio: ['🗳️', 'Apoio popular', 1], cp: ['⭐', 'Capital Político', 1], limpa: ['⚡', 'Energia limpa', 1], militar: ['🛡️', 'Gasto militar', 0],
    desmatamento: ['🌳', 'Desmatamento', -1, 1], fossil: ['🏭', 'Queima de fósseis', -1, 1], vulnerabilidade: ['🌊', 'Vulnerabilidade', -1],
    influencia: ['🤝', 'Influência', 1], 'global.cooperacao': ['🕊️', 'Cooperação', 1], 'global.tensao': ['⏰', 'Tensão mundial', -1],
    'global.comercio': ['🚢', 'Comércio', 1], 'global.deslocados': ['🧳', 'Deslocados', -1], 'global.temperatura': ['🌡️', 'Temperatura', -1, 2],
    'global.energia': ['🛢️', 'Preço da energia', -1], 'global.transferencia': ['💡', 'Tecnologia limpa partilhada', 1, 2],
    'alvo.estabilidade': ['⚖️', 'Estabilidade do alvo', 1], 'alvo.desenvolvimento': ['📈', 'Desenvolvimento do alvo', 1],
    'alvo.pressao': ['🗣️', 'Pressão sobre o alvo', -1], 'alvo.conflito': ['⚠️', 'Conflito no alvo', -1], 'alvo.economia': ['💰', 'Economia do alvo', 0],
    'alvo.seguranca': ['🛡️', 'Segurança do aliado', 1], 'vizinhos.estabilidade': ['⚖️', 'Estabilidade dos vizinhos', 1],
    'vizinhosCasa.influencia': ['🤝', 'Influência nos vizinhos', 1], 'vizinhosCasa.estabilidade': ['⚖️', 'Estabilidade dos vizinhos', 1],
    'vulneraveis.influencia': ['🤝', 'Influência nos mais vulneráveis', 1], 'vulneraveis.desenvolvimento': ['📈', 'Desenvolvimento dos mais vulneráveis', 1],
    'vulneraveis.estabilidade': ['⚖️', 'Estabilidade dos mais vulneráveis', 1], 'emConflito.influencia': ['🤝', 'Influência onde há conflito', 1],
    'comFloresta.floresta': ['🌳', 'Desmatamento tropical', -1, 1], 'comFloresta.influencia': ['🤝', 'Influência nas florestas', 1],
    'territorios.vulnerabilidade': ['🌊', 'Vulnerabilidade no mundo', -1], 'escolhidos.influencia': ['🤝', 'Influência nos escolhidos', 1],
    'todos.economia': ['💰', 'Economia de todos', 1], 'imune.ciber': ['🔐', 'Proteção contra ciberataques', 1],
    'imune.desinfo': ['🔐', 'Proteção contra boatos', 1], 'imune.pandemia': ['💉', 'Proteção contra pandemias', 1],
  };
  RECURSOS.forEach(([k, e, n]) => { EFEITO['recursos.' + k] = [e, n[0].toUpperCase() + n.slice(1), 1]; EFEITO['producao.' + k] = [e, 'Produção de ' + n, 1]; });
  function chipsEfeitos(efeitos = []) {
    const vistos = new Set();
    return efeitos.filter(ef => EFEITO[ef.v] && !vistos.has(ef.v) && vistos.add(ef.v)).slice(0, 6).map(ef => {
      const [e, nome, bom, casas = 0] = EFEITO[ef.v];
      const d = ef.m !== undefined ? (ef.m - 1) * 100 : ef.d ?? 0;
      const txt = ef.m !== undefined ? sinal(Math.round(d)) + '%' : sinal(d, casas);
      const cls = !bom || !d ? '' : (d > 0) === (bom > 0) ? 'sobe' : 'desce';
      const extra = ef.atraso ? '<small>depois</small>' : ef.chance !== undefined ? `<small>talvez (${Math.round(ef.chance * 100)}%)</small>` : '';
      return `<span class="pilula efeito">${ic(e, 40)}${esc(nome)} <b class="${cls}">${txt}</b>${extra}</span>`;
    }).join('');
  }

  // ============================== ESTADO DO HUD ==============================
  let raiz = null, vez = null, cpInicio = 0, ultimo = null, chaveColuna = '', fichaAtual = null, maoDaVez = [];
  const ao = {};   // ganchos que o Jogo liga: acao(cid), trocar(), negociar(), encerrar(), reuniao(), menu(), som(), ajuda(), zoom(d), geral()
  const retratos = {};   // pid|tam → dataURL
  const manchetes = { lista: [], i: 0, timer: null };

  const avatarDe = pid => {
    const a = (typeof Jogo !== 'undefined' && Jogo.avatarDe(pid)) || { pid, cor: corDe(pid), forma: corDe(pid, 'forma') };
    const e = typeof Jogo !== 'undefined' ? Jogo.estado : null;
    return { ...a, humano: e ? !!e.potencias[pid]?.humano : a.humano };
  };
  function retratoHTML(pid, classe = '') {
    const url = retratos[pid + '|rosto'];
    return `<span class="retrato ${classe}" data-equipe="${pid}" data-retrato="${pid}">${url ? `<img src="${url}" alt="">` : formaDe(pid, { classe: 'vazio' })}${url ? formaDe(pid) : ''}</span>`;
  }
  // Retrato-rosto do boneco (Cenas3D.retrato, em cache); troca a forma provisória pela imagem quando fica pronto
  function pedirRetrato(pid) {
    const k = pid + '|rosto';
    if (retratos[k] || retratos[k] === null || typeof Cenas3D === 'undefined' || !Cenas3D.retrato) return;
    retratos[k] = null;
    Cenas3D.retrato(avatarDe(pid), { expressao: 'feliz', tamanho: 112, enquadramento: 'rosto' }).then(url => {
      retratos[k] = url;
      $$(`[data-retrato="${pid}"]`).forEach(el => { el.innerHTML = `<img src="${url}" alt="">${formaDe(pid)}`; });
    }).catch(() => { delete retratos[k]; });
  }
  const limparRetratos = () => Object.keys(retratos).forEach(k => delete retratos[k]);

  // ============================== MONTAR ==============================
  const btnIc = (nome, rotulo, extra = '', classe = '') => `<button class="btn btn-ic peca ${classe}" aria-label="${rotulo}" title="${rotulo}" ${extra}><img src="${ICONES_BOTAO[nome]}" alt=""></button>`;
  function montar() {
    const t = $('#tela-partida');
    t.innerHTML = `<div class="hud" data-fase="abertura">
      <header class="hud-topo">
        <div class="hud-ano peca amarela pinos" role="group" aria-label="Ano">
          <b class="marca" id="hud-ano">2026</b>
          <span class="hud-ano-lado"><span id="hud-mandato">Mandato 1/6</span><span class="hud-mundo" id="hud-mundo"></span></span>
        </div>
        <ul class="hud-inds" aria-label="Indicadores do mundo">${IND.map(d => `<li><button class="ind peca" data-ind="${d.k}" aria-expanded="false">
          ${d.relogio ? `<span class="ind-relogio">${relogioJuizo(84)}</span>` : `<span class="soquete">${ic(d.ico)}</span>`}
          <span class="ind-nome">${d.nome}</span><b class="ind-val num"><span class="v"></span>${UNIDADE[d.k] ? `<small>${UNIDADE[d.k]}</small>` : ''}</b>
          ${d.relogio ? '' : d.termo ? `<span class="termo" aria-hidden="true">${'<i></i>'.repeat(13)}<i class="band" style="left:38.5%"></i><i class="band" style="left:77%"></i></span>`
            : `<span class="seg" aria-hidden="true" style="--total:${d.total || 10}">${d.marcas.map(m => `<i class="limiar" style="left:${m}%"></i>`).join('')}</span>`}
          <span class="selo ind-selo" aria-hidden="true"></span><span class="zebra" hidden></span><span class="so-leitor ind-fala"></span></button></li>`).join('')}</ul>
      </header>
      <nav class="hud-menu" aria-label="Menu">${btnIc('pausa', 'Pausa e ajustes (P ou Esc)', 'data-teste="menu" data-ao="menu"')}
        ${btnIc(somLigado() ? 'som' : 'mudo', 'Som ligado ou desligado (M)', 'data-ao="som"', 'hud-som')}${btnIc('ajuda', 'Manual do Diplomata', 'data-ao="ajuda" data-teste="manual"')}
        <button class="btn btn-ic peca" data-ao="relacoes" data-teste="relacoes" aria-label="Relações entre as potências (R)" title="Relações entre as potências (R)">${ic('🤝', 64)}</button></nav>
      <nav class="hud-mapa" aria-label="Câmera do mapa">${btnIc('mais', 'Aproximar', 'data-ao="perto"', 'redondo')}${btnIc('menos', 'Afastar', 'data-ao="longe"', 'redondo')}
        ${btnIc('visao', 'Ver o mundo todo', 'data-ao="geral"', 'redondo')}</nav>
      <aside class="hud-coluna" tabindex="0" aria-label="Placar das delegações (role para ver todas)"><ol class="coluna-lista"></ol></aside>
      <div class="hud-doca" role="toolbar" aria-label="Ações do governo"></div>
      <button class="btn btn-principal peca pinos grandes hud-encerrar" data-teste="encerrar-vez" data-ao="encerrar" hidden>
        <span>Encerrar vez<small>Enter</small></span><span class="hud-tempo cronometro peca" role="timer" hidden></span></button>
      <section class="hud-ficha painel peca pinos flutua" hidden aria-live="polite"></section>
      <div class="hud-instrucao peca amarela flutua" hidden></div>
      <div class="hud-decidindo peca flutua" hidden></div>
      <div class="hud-balao balao peca flutua" role="tooltip" hidden></div>
      <div class="hud-detalhe balao peca flutua" hidden></div>
      <div class="hud-letreiro" role="region" aria-label="Jornal Mundial">
        ${cabecalhoJornal({ compacto: true })}
        <span class="soquete letreiro-cat" aria-hidden="true"></span>
        <p class="letreiro-texto"><span></span></p>
        <span class="letreiro-cont num" aria-hidden="true"></span>
        <button class="btn btn-neutro btn-mini peca letreiro-ver" data-ao="jornal">Ver todas</button>
      </div>
    </div>`;
    raiz = t.firstElementChild;
    ultimo = null; chaveColuna = ''; vez = null; fichaAtual = null;
    manchetes.lista = []; manchetes.i = 0; clearInterval(manchetes.timer); manchetes.timer = null;
    raiz.addEventListener('click', aoClicar);
    raiz.querySelectorAll('.ind').forEach(b => b.addEventListener('click', () => detalheIndicador(b)));
    PIDS.forEach(pedirRetrato);
    return raiz;
  }
  const somLigado = () => typeof Som === 'undefined' || Som.efeitosLigados || Som.musicaLigada;
  function aoClicar(ev) {
    const b = ev.target.closest('[data-ao]');
    if (!b) return;
    const f = ao[b.dataset.ao];
    if (f) { efeitoSom('clique'); f(b.dataset.id, b); }
  }

  // ============================== FASES (guia §5.19: o que aparece em cada uma) ==============================
  // só escreve se mudou: cada troca de data-fase recalcula o estilo do HUD inteiro (~20 ms no PC fraco)
  function fase(nome) { if (raiz && raiz.dataset.fase !== nome) raiz.dataset.fase = nome; if (nome !== 'decisoes') { ficha(null); instrucao(null); fecharReacoes(); } balao(null); }
  const ocultar = sim => raiz?.classList.toggle('oculto', sim ?? !raiz.classList.contains('oculto'));

  // ============================== ATUALIZAR ==============================
  function atualizar(e, { vez: v } = {}) {
    if (!e) return;
    if (!raiz || !raiz.isConnected) montar();
    if (v !== undefined) vez = v;
    const animar = !!ultimo;
    // Ano, mandato e estado do mundo
    $('#hud-ano').textContent = fmtAno(e.ano);
    $('#hud-mandato').textContent = `Mandato ${Math.min(e.rodada, e.config.rodadas)}/${e.config.rodadas}`;
    let pior = 'bom';
    for (const d of IND) {
      const v = e.global[d.k], [nivel, palavra] = d.estado(v), el = raiz.querySelector(`.ind[data-ind="${d.k}"]`);
      if (ORDEM_NIVEL.indexOf(nivel) > ORDEM_NIVEL.indexOf(pior)) pior = nivel;
      el.dataset.nivel = nivel;
      el.querySelector('.ind-selo').innerHTML = SIMBOLO[nivel];
      el.querySelector('.zebra').hidden = !(nivel === 'risco' || nivel === 'critico');
      el.querySelector('.ind-fala').textContent = `${d.nome}: ${valorFala(d.k, v)}, ${palavra}.`;
      el.setAttribute('aria-label', `${d.nome}: ${valorFala(d.k, v)}, ${palavra}. Toque para ver o porquê.`);
      const antes = ultimo?.global[d.k];
      if (!animar || antes === undefined || Math.abs(v - antes) < (d.k === 'temperatura' ? .005 : .5)) el.querySelector('.ind-val .v').textContent = fmt(numDe(d.k, v), d.k === 'temperatura' ? 2 : 0);
      if (d.termo) el.querySelectorAll('.termo i:not(.band)').forEach((b, i) => {
        const t = 1.0 + (i + 1) * .1;
        b.className = v >= t - .049 ? (t <= 1.5 ? 'a' : t <= 2.0 ? 'l' : 'v') : '';
      });
      else if (d.relogio) { const p = el.querySelector('.ponteiro'); if (p) p.style.transform = `rotate(${(360 - segundos(v) / 300 * 270).toFixed(1)}deg)`; }
      else el.querySelector('.seg').style.setProperty('--n', Math.round(v / (d.max || 100) * (d.total || 10)));
      if (animar && antes !== undefined && Math.abs(v - antes) >= (d.k === 'temperatura' ? .005 : .5)) mudou(el, d, antes, v);
    }
    const mundo = $('#hud-mundo');
    mundo.dataset.nivel = pior;
    mundo.innerHTML = `<span class="selo" data-nivel="${pior}">${SIMBOLO[pior]}</span>${MUNDO[pior]}`;
    raiz.querySelector('.hud-ano').setAttribute('aria-label', `Ano ${fmtAno(e.ano)}, mandato ${Math.min(e.rodada, e.config.rodadas)} de ${e.config.rodadas}. Mundo: ${MUNDO[pior].toLowerCase()}.`);
    atualizarColuna(e, animar);
    atualizarLetreiro(e);
    ultimo = { global: { ...e.global }, potencias: Object.fromEntries(PIDS.map(p => [p, snapPot(e.potencias[p])])), igi: Object.fromEntries(PIDS.map(p => [p, Simulacao.igi(e, p).total])) };
  }
  const snapPot = p => ({ cp: p.cp, ...p.recursos, ...Object.fromEntries(NACAO.map(([k]) => [k, p[k]])) });

  // Peça do topo mudou: anel amarelo, número que salta, chip "+4"/"−2" por 2 s e som (guia §5.6)
  function mudou(el, d, antes, depois) {
    const casas = d.k === 'temperatura' ? 2 : 0;
    const delta = d.k === 'tensao' ? segundos(depois) - segundos(antes) : depois - antes;
    const bomSubir = d.k === 'comercio' || d.k === 'cooperacao';
    const melhorou = d.k === 'tensao' ? delta > 0 : bomSubir ? delta > 0 : delta < 0;
    numeroQueSalta(el.querySelector('.ind-val .v'), numDe(d.k, antes), numDe(d.k, depois), { casas, som: false });
    el.classList.remove('mudou'); void el.offsetWidth; el.classList.add('mudou');
    const chip = document.createElement('span');
    chip.className = `pilula ind-chip ${melhorou ? 'ganho' : 'perda'}`;
    chip.textContent = sinal(delta, casas) + (d.k === 'tensao' ? ' s' : '');
    el.parentElement.append(chip);
    efeitoSom(melhorou ? 'subir' : 'descer');
    gsap.fromTo(chip, { y: -uPx() * 1.5, opacity: 0, scale: RM ? 1 : .6 }, { y: 0, opacity: 1, scale: 1, duration: RM ? .15 : .35, ease: 'back.out(2)' });
    gsap.to(chip, { opacity: 0, y: RM ? 0 : uPx(), duration: .3, delay: 2.2, onComplete: () => chip.remove() });
  }

  // Prévia de uma ação selecionada: chip tracejado "72 → 76" embaixo das peças do topo que ela mexe (guia §5.6)
  function previa(e, efeitos) {
    raiz?.querySelectorAll('.ind-previa').forEach(x => x.remove());
    if (!e || !efeitos) return;
    for (const ef of efeitos) {
      const k = ef.v.startsWith('global.') && ef.v.slice(7), d = IND.find(x => x.k === k);
      if (!d || ef.d === undefined) continue;
      const v = e.global[k], novo = v + ef.d, casas = k === 'temperatura' ? 2 : 0;
      const t = k === 'tensao' ? `${segundos(v)} → ${segundos(novo)} s` : `${fmt(v, casas)} → ${fmt(novo, casas)}`;
      const chip = document.createElement('span');
      chip.className = 'pilula fantasma ind-previa';
      chip.textContent = ef.chance !== undefined ? `talvez ${t} (${Math.round(ef.chance * 100)}%)` : t;
      raiz.querySelector(`.ind[data-ind="${k}"]`).parentElement.append(chip);
    }
  }

  // ============================== COLUNA: PLACAR + PAINEL DA VEZ (guia §5.8) ==============================
  function atualizarColuna(e, animar) {
    const placar = Simulacao.placar(e), pos = Object.fromEntries(placar.map((x, i) => [x.id, i]));
    const base = e.config.modo === 'cooperativo' ? PIDS : placar.map(x => x.id);   // cooperativo: ordem fixa, ninguém é ranqueado
    const ordem = vez ? [vez, ...base.filter(id => id !== vez)] : base;
    const chave = ordem.join() + '|' + vez + '|' + e.config.modo + '|' + !!e.reuniaoUsada;
    const lista = raiz.querySelector('.coluna-lista');
    lista.dataset.denso = PIDS.length > 8;   // 13 potências: linhas mais baixas e a coluna rola (css/jogo.css)
    if (chave !== chaveColuna) {
      const antes = Object.fromEntries([...lista.children].map(li => [li.dataset.pid, li.getBoundingClientRect()]));
      lista.innerHTML = ordem.map(id => (id === vez ? painelVez(e, id, pos[id]) : linha(e, id, pos[id]))).join('');
      chaveColuna = chave;
      if (animar && !RM) [...lista.children].forEach((li, i) => {   // FLIP: cada linha desliza do lugar antigo
        const a = antes[li.dataset.pid], b = li.getBoundingClientRect();
        if (a) gsap.from(li, { y: a.top - b.top, duration: .6, ease: 'power2.inOut', delay: i * .04, clearProps: 'transform' });
      });
      if (vez) ligarBinoculo(lista.querySelector('.vez-bino'), e, vez);
    }
    // valores (sem redesenhar a coluna)
    for (const id of ordem) {
      const li = lista.querySelector(`[data-pid="${id}"]`), igi = Simulacao.igi(e, id).total;
      const igiEl = li.querySelector('.igi-n');
      if (igiEl) saltar(igiEl, ultimo?.igi[id], igi, animar);
      const medalha = li.querySelector('.pos');
      if (medalha && e.config.modo !== 'cooperativo') { const p = pos[id]; medalha.className = `selo pos ${['ouro', 'prata', 'bronze'][p] || ''}`; medalha.textContent = `${p + 1}º`; medalha.hidden = p > 2; }
    }
    if (vez) atualizarPainel(e, vez, animar);
  }
  const saltar = (el, de, para, animar, casas = 0) => {
    if (animar && de !== undefined && Math.abs(de - para) >= .5) { numeroQueSalta(el, de, para, { casas, som: false }); pulso(el); } else el.textContent = fmt(para, casas);
  };
  const pulso = el => { el.classList.remove('pulsa'); void el.offsetWidth; el.classList.add('pulsa'); };
  function linha(e, id, p) {
    const pot = e.potencias[id];
    const quem = pot.humano ? esc(pot.nomeJogador && pot.nomeJogador !== 'Computador' ? pot.nomeJogador : nomeEquipe(id)) : 'Computador';
    return `<li class="linha peca" data-pid="${id}" data-humano="${!!pot.humano}">
      <span class="selo pos" ${e.config.modo === 'cooperativo' ? 'hidden' : ''}></span>
      <span class="aba" data-equipe="${id}">${retratoHTML(id)}</span>
      <span class="linha-nome"><b>${esc(nomeCurto(id))}</b><small>${quem}</small></span>
      <span class="igi" title="Índice Geografia Irada"><b class="igi-n num"></b><span class="so-leitor"> pontos no Índice Geografia Irada</span></span></li>`;
  }
  function painelVez(e, id, p) {
    const pot = e.potencias[id], quem = pot.humano ? esc(pot.nomeJogador && pot.nomeJogador !== 'Computador' ? pot.nomeJogador : nomeEquipe(id)) : 'Computador';
    const segredo = pot.humano && (pot.missao || e.config.infiltrado);
    const reuniao = pot.humano && e.config.modo === 'cooperativo' && e.config.infiltrado && !e.reuniaoUsada;
    const cp = pot.humano ? `<span class="pilula amarela vez-cpn"><b class="num">0</b>${FINO}CP</span><span class="vez-pinos" aria-hidden="true"></span>`
      : `<span class="pilula vez-parc">${ic('🤝', 40)}<b class="num">${Simulacao.parceirosDe(e, id).length}</b> <span class="vez-parc-rot">${Simulacao.parceirosDe(e, id).length === 1 ? 'parceiro' : 'parceiros'}</span></span>`;
    return `<li class="vez painel peca pinos" data-pid="${id}" data-equipe="${id}" aria-label="Vez ${esc(com(id, 'de'))}">
      ${ponteiroVez()}<span class="selo pos" ${e.config.modo === 'cooperativo' ? 'hidden' : ''}></span>
      <div class="vez-cab">${retratoHTML(id, 'medio')}<div><b class="letra-bolha">${esc(vezDe(id))}</b><small class="letra-bolha">${quem}</small></div></div>
      <div class="tela vez-tela">
        <div class="vez-cp">${cp}
          <span class="igi" title="Índice Geografia Irada"><b class="igi-n num"></b><span class="so-leitor"> pontos no Índice Geografia Irada</span></span></div>
        <div class="vez-rec">${RECURSOS.map(([k, ico, nome]) => `<span class="chip-rec" data-rec="${k}" title="${nome}">${ic(ico, 40)}<b class="num">0</b><span class="so-leitor"> de ${nome}</span></span>`).join('')}
          ${segredo ? `<button class="btn btn-ic peca redondo vez-bino" aria-label="Missão secreta: segure para ver (só a sua equipe)" title="Missão secreta: segure para ver">${arte('binoculo', { px: 96 })}</button>` : ''}</div>
        <div class="vez-nacao">${NACAO.map(([k, ico, nome]) => `<span class="cel-nacao" data-nac="${k}" title="${nome}">${ic(ico, 40)}<b class="num">0</b><i class="seta" aria-hidden="true"></i><span class="so-leitor"> de ${nome}</span></span>`).join('')}</div>
        ${reuniao ? `<button class="btn btn-perigo btn-mini peca vez-reuniao" data-ao="reuniao" data-teste="reuniao" aria-label="Reunião de emergência: custa 2 de Capital Político">
          ${ic('🚨', 40)}<span>Reunião de emergência</span><span class="vez-reuniao-custo" aria-hidden="true"><i class="pino-cp"></i><i class="pino-cp"></i></span></button>` : ''}
      </div></li>`;
  }
  function atualizarPainel(e, id, animar) {
    const li = raiz.querySelector(`.vez[data-pid="${id}"]`), p = e.potencias[id];
    if (!li) return;
    const antes = ultimo?.potencias[id];
    if (p.humano) {
      saltar(li.querySelector('.vez-cpn b'), antes?.cp, p.cp, animar && antes?.cp !== p.cp);
      const total = Math.min(8, Math.max(cpInicio, p.cp));
      li.querySelector('.vez-pinos').innerHTML = Array.from({ length: total }, (_, i) => `<i class="pino-cp${i < p.cp ? '' : ' vazio'}"></i>`).join('');
      li.querySelector('.vez-cpn').setAttribute('aria-label', `${p.cp} de Capital Político`);
    } else { const n = Simulacao.parceirosDe(e, id).length; li.querySelector('.vez-parc b').textContent = n; li.querySelector('.vez-parc-rot').textContent = n === 1 ? 'parceiro' : 'parceiros'; }
    RECURSOS.forEach(([k]) => {
      const el = li.querySelector(`[data-rec="${k}"] b`);
      saltar(el, antes?.[k], p.recursos[k], animar);
    });
    const ref = e.historico.at(-1)?.potencias?.[id];
    NACAO.forEach(([k]) => {
      const cel = li.querySelector(`[data-nac="${k}"]`), v = r0(p[k]);
      saltar(cel.querySelector('b'), antes?.[k] !== undefined ? r0(antes[k]) : undefined, v, animar);
      cel.classList.toggle('alerta', v < 30);
      const d = ref ? v - r0(ref[k]) : 0, seta = cel.querySelector('.seta');
      seta.className = 'seta' + (d >= 1 ? ' sobe' : d <= -1 ? ' desce' : '');
    });
    const reuniao = li.querySelector('.vez-reuniao');
    if (reuniao) { const ok = p.cp >= 2 && !e.reuniaoUsada; reuniao.setAttribute('aria-disabled', String(!ok)); reuniao.classList.toggle('bloqueado', !ok); }
  }
  // Missão secreta: segurar 2 s para ver; ao soltar, some. Mesmo layout e tempo para qualquer missão ou papel.
  function ligarBinoculo(btn, e, pid) {
    if (!btn) return;
    let timer = null, aberto = null;
    const soltar = () => { clearTimeout(timer); timer = null; btn.classList.remove('segurando'); if (aberto) { aberto.remove(); aberto = null; efeitoSom('virar'); } };
    const segurar = ev => {
      if (ev.type === 'keydown' && ![' ', 'Enter'].includes(ev.key)) return;
      ev.preventDefault();
      if (timer || aberto) return;
      btn.classList.add('segurando');
      timer = setTimeout(() => {
        timer = null;
        aberto = document.createElement('div');
        aberto.className = 'balao peca flutua vez-segredo';
        aberto.setAttribute('role', 'status');
        aberto.innerHTML = segredoHTML(e, pid);
        btn.closest('.vez').append(aberto);
        efeitoSom('virar');
        anunciar(aberto.textContent);
      }, RAPIDO ? 200 : 2000);
    };
    btn.addEventListener('pointerdown', segurar);
    btn.addEventListener('keydown', segurar);
    ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'].forEach(t => btn.addEventListener(t, soltar));
  }
  function segredoHTML(e, pid) {
    const p = e.potencias[pid];
    if (e.config.modo === 'cooperativo' && e.config.infiltrado) {
      const ag = p.papel !== 'diplomata' ? AGENDAS.find(a => a.id === p.agenda) : null;
      return `<span class="balao-tit">${arte('dossie', { px: 96, classe: 'segredo-obj' })} Só ${esc(nomeEquipe(pid) ? 'a ' + nomeEquipe(pid) : 'sua equipe')} olha!</span>
        <b class="segredo-nome">${ag ? 'Infiltrado: ' + esc(ag.nome) : 'Diplomata'}</b><span>${ag ? esc(ag.texto) : 'Ajude o mundo a cumprir 4 das 5 Metas 2050 e descubra quem é o infiltrado.'}</span>`;
    }
    const m = MISSOES.find(x => x.id === p.missao), ok = m && Simulacao.missaoCumprida(e, pid);
    return `<span class="balao-tit">${arte('dossie', { px: 96, classe: 'segredo-obj' })} Só ${esc(nomeEquipe(pid) ? 'a ' + nomeEquipe(pid) : 'sua equipe')} olha!</span>
      <b class="segredo-nome">${esc(m?.nome || 'Missão secreta')}</b><span>${esc(m?.texto || '')}</span>
      <span class="pilula ${ok ? 'ganho' : 'fantasma'}">${ok ? GLIFOS.ok + ' Cumprida por enquanto' : 'Ainda não cumprida'}</span>`;
  }
  const comecarVez = (pid, cp) => { vez = pid; cpInicio = cp; fecharReacoes(); };

  // ============================== DOCA: BARRA DE AÇÕES (guia §5.4, §5.9) ==============================
  // Estado de um tijolo: { ok, motivo, faltas: { cp?, recurso? } } (sem alvo: testa com um alvo possível)
  function estadoAcao(e, pid, cid) {
    const c = carta(cid), p = e.potencias[pid];
    if (p.jogadasNaVez?.includes(cid)) return { usado: true, ok: false, motivo: 'Já usada nesta vez.' };
    const custo = Simulacao.custoDe(e, pid, cid), faltas = {};
    if (p.cp < (custo.cp || 0)) faltas.cp = true;
    RECURSOS.forEach(([r]) => { if ((custo[r] || 0) > p.recursos[r]) faltas[r] = custo[r] - p.recursos[r]; });
    const alvos = alvosDe(e, pid, cid);
    const alvo = c.alvo === 'nenhum' ? null : c.alvo === 'territorios3' ? alvos.slice(0, 1) : alvos[0];
    if (c.alvo !== 'nenhum' && !alvos.length) return { ok: false, motivo: c.especial === 'mediacao' ? 'Não há conflito para mediar agora.' : 'Nenhum alvo possível agora.', faltas };
    const r = Simulacao.podeJogar(e, pid, cid, alvo);
    if (!r.ok && faltas.cp) r.motivo = `Falta${(custo.cp - p.cp) > 1 ? 'm' : ''} ${custo.cp - p.cp} de Capital Político.`;
    else if (!r.ok) { const [rk, n] = Object.entries(faltas).find(([k]) => k !== 'cp') || []; if (rk) r.motivo = `Falta ${n} de ${RECURSOS.find(x => x[0] === rk)[2]}.`; }
    return { ...r, faltas };
  }
  function alvosDe(e, pid, cid) {
    const c = carta(cid);
    if (c.alvo === 'nenhum') return [];
    const lista = Simulacao.alvosValidos(e, pid, cid);
    return c.especial === 'minerais' ? [pid, ...lista] : lista;
  }
  function bandeja(e, pid, cid, st) {
    const custo = Simulacao.custoDe(e, pid, cid);
    const pinos = Array.from({ length: custo.cp || 0 }, () => '<i class="pino-cp"></i>').join('') + (st.faltas?.cp ? '<span class="falta">!</span>' : '');
    const rec = RECURSOS.filter(([r]) => custo[r]).map(([r, e2]) => (st.faltas?.[r] ? `<span class="falta">${ic(e2, 40)}!</span>` : `${ic(e2, 40)}${custo[r]}`)).join('');
    const eco = custo.economia ? `${ic('💰', 40)}${custo.economia}` : '';
    return `<span class="bandeja">${pinos || '<b class="gratis">grátis</b>'}${rec}${eco}</span>`;
  }
  function tijolo(e, pid, cid, i) {
    const c = carta(cid), st = estadoAcao(e, pid, cid), cat = CATEGORIAS[c.categoria];
    const rot = `${c.nome}. ${cat.nome}. Custa ${Simulacao.custoDe(e, pid, cid).cp || 0} de Capital Político.${st.usado ? ' Já usada.' : !st.ok ? ' Bloqueada: ' + st.motivo : ''}`;
    return `<button class="tijolo peca pinos cat-${c.categoria}${st.usado ? ' usado' : !st.ok ? ' bloqueado' : ''}" data-teste="acao" data-id="${cid}" data-ao="acao"
        aria-label="${esc(rot)}" ${!st.ok ? 'aria-disabled="true"' : ''} style="--i:${i}">
      <span class="soquete">${ic(c.icone, 64)}</span><span class="nome">${esc(curto(c))}</span>${bandeja(e, pid, cid, st)}
      ${st.usado ? `<span class="selo ok">${GLIFOS.ok}</span>` : !st.ok ? `<span class="cadeado">${ic('🔒', 40)}</span>` : ''}</button>`;
  }
  // Desenha a doca da equipe da vez (mao = as 6 sorteadas desta vez, inclusive as já usadas)
  function doca(e, pid, mao, { entrar = false } = {}) {
    const d = raiz.querySelector('.hud-doca'), enc = raiz.querySelector('.hud-encerrar');
    if (!pid) { d.innerHTML = ''; enc.hidden = true; enc.classList.remove('chamando'); return; }
    maoDaVez = mao;
    const p = e.potencias[pid], fixa = POLITICAS.find(c => c.fixa), stF = estadoAcao(e, pid, fixa.id);
    const trocaOk = p.cp >= 1;
    d.innerHTML = `<div class="doca-fixas">
        <button class="tijolo baixo peca pinos fixa${stF.usado ? ' usado' : !stF.ok ? ' bloqueado' : ''}" data-teste="acao" data-id="${fixa.id}" data-ao="acao"
          aria-label="${esc(fixa.nome)}: custa 1 de Capital Político.${!stF.ok ? ' ' + esc(stF.motivo) : ''}" ${!stF.ok ? 'aria-disabled="true"' : ''}>
          <span class="soquete">${ic(fixa.icone, 64)}</span><span class="nome">${esc(curto(fixa))}</span><span class="preco">${Simulacao.custoDe(e, pid, fixa.id).cp}</span>
          ${stF.usado ? `<span class="selo ok">${GLIFOS.ok}</span>` : ''}</button>
        <button class="tijolo baixo peca pinos fixa" data-teste="negociar" data-ao="negociar" aria-label="Negociar recursos com outra potência (grátis)">
          <span class="soquete">${ic('🤝', 64)}</span><span class="nome">Negociar</span></button></div>
      <hr class="divisoria vertical">
      <div class="doca-acoes">${mao.map((cid, i) => tijolo(e, pid, cid, i)).join('')}</div>
      <div class="doca-trocar"><button class="btn btn-ic peca redondo${trocaOk ? '' : ' bloqueado'}" data-teste="trocar-acoes" data-ao="trocar"
          aria-label="Trocar as ações: sorteia outras 6 por 1 de Capital Político" title="Trocar as ações (1 CP)" ${trocaOk ? '' : 'aria-disabled="true"'}><img src="${ICONES_BOTAO.trocar}" alt=""></button>
        <span class="pilula amarela"><i class="pino-cp"></i>1${FINO}CP</span></div>`;
    enc.hidden = false;
    // nada mais para fazer com o CP que sobrou: o Encerrar vez chama a atenção
    enc.classList.toggle('chamando', !d.querySelector('[data-ao="acao"]:not(.bloqueado):not(.usado)'));
    d.querySelectorAll('[data-ao="acao"]').forEach(b => {
      b.addEventListener('pointerenter', () => ao.passar?.(b.dataset.id));
      b.addEventListener('focus', () => { if (viaTeclado) ao.passar?.(b.dataset.id); });
      b.addEventListener('pointerleave', () => ao.sair?.(b.dataset.id));
      b.addEventListener('blur', () => ao.sair?.(b.dataset.id));
    });
    if (entrar) {
      if (RM) gsap.fromTo(d.querySelectorAll('.tijolo'), { opacity: 0 }, { opacity: 1, duration: .2 });
      else gsap.from(d.querySelectorAll('.doca-acoes .tijolo'), { y: -uPx() * 6, opacity: 0, duration: .32, ease: 'back.out(2)', stagger: .06, clearProps: 'transform,opacity',
        onStart: () => efeitoSom('tijolo') });
    }
  }
  function selecionar(cid) {
    raiz?.querySelectorAll('.hud-doca [data-ao="acao"]').forEach(b => {
      const sim = b.dataset.id === cid;
      b.setAttribute('aria-pressed', String(sim));
      if (sim && !RM) gsap.fromTo(b.querySelector('.soquete'), { scale: .7 }, { scale: 1, duration: .5, ease: 'elastic.out(1, .5)' });
    });
  }
  const tijoloEl = cid => raiz?.querySelector(`.hud-doca [data-id="${cid}"]`);
  // Foco do jogo (começo da vez, volta de painel): não abre a ficha de prévia por cima do mapa
  // (a prévia por foco só vale quando a turma navega com Tab ou setas; o evento de foco pode chegar atrasado)
  let viaTeclado = false;
  document.addEventListener('keydown', ev => { if (ev.key === 'Tab' || ev.key.startsWith('Arrow')) viaTeclado = true; }, true);
  document.addEventListener('pointerdown', () => { viaTeclado = false; }, true);
  const focar = el => { if (!el) return; viaTeclado = false; el.focus({ preventScroll: true }); };

  // ============================== FICHA DA AÇÃO (guia §5.4) ==============================
  /* modo: 'previa' (passar o mouse), 'escolha' (selecionada), 'bloqueada', 'confirmar' (com alvo).
     op: { alvo, alvos, chance: { chance, fatores }, aoConfirmar, aoCancelar } */
  function ficha(e, pid, cid, modo = 'previa', op = {}) {
    const f = raiz?.querySelector('.hud-ficha');
    if (!f) return;
    if (!e) { if (!f.hidden) { f.hidden = true; fichaAtual = null; previa(null); } return; }
    const c = carta(cid), cat = CATEGORIAS[c.categoria], st = estadoAcao(e, pid, cid), custo = Simulacao.custoDe(e, pid, cid);
    const precisaAlvo = c.alvo !== 'nenhum' && op.alvo === undefined;
    const tensao = (c.efeitos || []).find(x => x.v === 'global.tensao' && x.d > 0);
    const efeitos = c.especial === 'mediacao' ? c.seSucesso : [...(c.efeitos || []), ...(c.extra?.[pid] || [])];
    const nomeAlvo = op.alvo === undefined ? '' : Array.isArray(op.alvo) ? op.alvo.map(nomePot).join(', ') : op.alvo === pid ? 'na própria casa' : nomePot(op.alvo);
    const rotuloOk = precisaAlvo ? (c.alvo === 'potencia' ? 'Escolher potência' : c.alvo === 'territorios3' ? 'Escolher lugares' : 'Escolher alvo') : 'Confirmar';
    const custoTxt = [custo.cp ? `${custo.cp}${FINO}CP` : 'Grátis', ...RECURSOS.filter(([r]) => custo[r]).map(([r, ico]) => `${ic(ico, 40)}${custo[r]}`), custo.economia ? `${ic('💰', 40)}${custo.economia}` : ''].filter(Boolean).join(' + ');
    f.className = `hud-ficha painel peca pinos flutua cat-${c.categoria} modo-${modo}`;
    f.innerHTML = `<div class="tela">
      <div class="ficha-tit">${ic(c.icone, 96)}<h2>${esc(c.nome)}</h2>
        <span class="pilula cat-${c.categoria}">${ic(cat.icone, 40)}${esc(cat.nome)}</span>
        <span class="ficha-custo">${Array.from({ length: custo.cp || 0 }, () => '<i class="pino-cp"></i>').join('')}<b>${custoTxt}</b></span></div>
      ${modo === 'previa' ? '' : `<div class="ficha-bts">${modo === 'bloqueada' ? `<span class="motivo">${esc(st.motivo || 'Indisponível agora.')}</span>`
        : `<button class="btn btn-principal peca pinos" data-teste="confirmar">${rotuloOk}${precisaAlvo ? ' ' + GLIFOS.seta : ''}</button>`}
        <button class="btn btn-neutro peca" data-teste="cancelar">${modo === 'bloqueada' ? 'Fechar' : 'Cancelar'}</button></div>`}
      ${nomeAlvo ? `<p class="ficha-alvo">${ic('📍', 40)} <b>Alvo:</b> ${esc(nomeAlvo)}</p>` : ''}
      ${op.chance ? chanceHTML(op.chance) : ''}
      <div class="ficha-efs">${c.especial === 'mediacao' ? '<b class="ficha-se">Se der certo:</b>' : ''}${chipsEfeitos(efeitos)}${c.especial === 'votacao' ? `<span class="pilula">${ic('🏛️', 40)}Abre uma votação na ONU</span>` : ''}</div>
      <p class="ficha-porque"><b>Por quê?</b> ${esc(c.porque || '')}</p>
      ${tensao ? `<p class="ficha-risco letra-bolha">${ic('⏰', 40)} Isso adianta o Relógio em ${r0(tensao.d * 3)} segundos!</p>` : ''}
    </div>`;
    if (op.aoConfirmar) f.querySelector('[data-teste="confirmar"]')?.addEventListener('click', () => { efeitoSom('clique'); op.aoConfirmar(); });
    if (op.aoCancelar) f.querySelector('[data-teste="cancelar"]')?.addEventListener('click', () => { efeitoSom('clique'); op.aoCancelar(); });
    const novo = f.hidden || fichaAtual !== cid + modo;
    f.hidden = false;
    fichaAtual = cid + modo;
    previa(e, efeitos);
    if (novo && modo !== 'previa') { if (RM) gsap.fromTo(f, { opacity: 0 }, { opacity: 1, duration: .18 }); else gsap.fromTo(f, { y: uPx() * 3, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .3, ease: 'back.out(1.6)' }); }
  }
  function chanceHTML({ chance, fatores }) {
    const pct = Math.round(chance * 100);
    return `<div class="ficha-chance"><span class="chance-num"><b class="num">${pct}%</b><small>de chance de dar certo</small></span>
      <ul>${fatores.map(f => `<li><b class="num ${f.valor >= 0 ? 'sobe' : 'desce'}">${f.valor >= 0 ? '+' : '−'}${Math.round(Math.abs(f.valor) * 100)}%</b> ${esc(f.texto)}</li>`).join('')}</ul></div>`;
  }

  // Faixa de instrução amarela (escolher alvo no mapa): op = { texto, contagem, aoLista, aoCancelar, aoPronto }
  function instrucao(op) {
    const el = raiz?.querySelector('.hud-instrucao');
    if (!el) return;
    if (!op) { el.hidden = true; return; }
    el.innerHTML = `${ic('📍', 64)}<span class="instr-texto">${esc(op.texto)}</span>
      <button class="btn btn-neutro btn-mini peca" data-teste="ver-lista"><img class="ico" src="${ICONES_BOTAO.lista}" alt=""> Ver lista</button>
      ${op.aoPronto ? `<button class="btn btn-principal btn-mini peca pinos" data-teste="pronto" ${op.contagem ? '' : 'disabled'}>Pronto${op.contagem ? ` (${op.contagem})` : ''}</button>` : ''}
      <button class="btn btn-neutro btn-mini peca" data-teste="cancelar">Cancelar <small>Esc</small></button>`;
    el.querySelector('[data-teste="ver-lista"]').onclick = () => { efeitoSom('clique'); op.aoLista(); };
    el.querySelector('[data-teste="cancelar"]').onclick = () => { efeitoSom('clique'); op.aoCancelar(); };
    el.querySelector('[data-teste="pronto"]')?.addEventListener('click', () => { efeitoSom('clique'); op.aoPronto(); });
    const novo = el.hidden;
    el.hidden = false;
    if (novo) { if (RM) gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .18 }); else gsap.fromTo(el, { y: uPx() * 3, opacity: 0, rotation: -6 }, { y: 0, opacity: 1, rotation: -2, duration: .3, ease: 'back.out(2)' }); }
    anunciar(op.texto);
  }

  // ============================== VEZ DO COMPUTADOR: "A China está decidindo…" + Pular (guia §5.9) ==============================
  function decidindo(pid, aoPular) {
    const el = raiz?.querySelector('.hud-decidindo');
    if (!el) return;
    gsap.killTweensOf(el.querySelectorAll('.dec-ampulheta'));   // o laço infinito da ampulheta antiga morre junto com ela
    if (!pid) { el.hidden = true; return; }
    el.style.setProperty('--faixa', corDe(pid));
    el.innerHTML = `<span class="dec-quem">${retratoHTML(pid, 'medio')}${arte('ampulheta', { px: 96, classe: 'dec-ampulheta' })}</span>
      <div class="dec-textos"><b class="dec-tit">${maiuscula(prepDe(pid).slice(1))} ${esc(nomeCurto(pid))} ${plural(pid) ? 'estão' : 'está'} decidindo…</b>
      <span class="dec-sub">Computador: cada governo pesa as coisas do seu jeito</span></div><ol class="dec-log" aria-live="polite"></ol>
      <button class="btn btn-neutro peca dec-pular" data-teste="pular">Pular <small>Espaço</small></button>`;
    el.querySelector('.dec-pular').onclick = () => { efeitoSom('clique'); aoPular?.(); };
    el.hidden = false;
    if (!RM) {
      gsap.fromTo(el, { y: uPx() * 4, opacity: 0 }, { y: 0, opacity: 1, duration: .32, ease: 'back.out(1.6)' });
      gsap.fromTo(el.querySelector('.dec-ampulheta'), { rotation: -12 }, { rotation: 12, duration: .9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }
  }
  // Uma jogada do computador aparece como tijolo que entra na faixa e "voa" para o mapa; a manchete fica embaixo
  function jogadaIA(pid, j) {
    const log = raiz?.querySelector('.dec-log');
    if (!log) return;
    const li = document.createElement('li');
    if (j.tipo === 'carta') {
      const c = carta(j.carta), alvo = Array.isArray(j.alvo) ? j.alvo.map(nomePot).join(', ') : j.alvo && j.alvo !== pid ? nomePot(j.alvo) : '';
      li.className = 'dec-jogada';
      li.innerHTML = `<span class="tijolo mini peca pinos cat-${c.categoria}"><span class="soquete">${ic(c.icone, 64)}</span></span>
        <span class="dec-txt"><b>${esc(c.nome)}</b>${alvo ? `<small>${ic('📍', 40)}${esc(alvo)}</small>` : ''}</span>`;
    } else if (j.tipo === 'nada') {
      li.className = 'dec-jogada';
      li.innerHTML = `<span class="tijolo mini peca pinos"><span class="soquete">${ic('⭐', 64)}</span></span><span class="dec-txt"><b>Guardou o Capital Político</b><small>para a próxima vez</small></span>`;
    } else {
      const d = typeof DILEMAS !== 'undefined' ? DILEMAS.find(x => x.id === j.id) : null, op = d?.opcoes[j.opcao];
      li.className = 'dec-jogada dilema';
      li.innerHTML = `<span class="tijolo mini peca pinos cat-${op?.categoria || 'diplomacia'}"><span class="soquete">${ic(d?.icone || '⚖️', 64)}</span></span>
        <span class="dec-txt"><b>${esc(op?.resumo || 'Decidiu um dilema')}</b><small>${esc(d ? Simulacao.preencher(d.titulo, pid, e2local(pid)) : '')}</small></span>`;
    }
    log.append(li);
    while (log.children.length > 2) log.firstElementChild.remove();
    efeitoSom('tijolo');
    if (RM) gsap.fromTo(li, { opacity: 0 }, { opacity: 1, duration: .18 });
    else {
      gsap.fromTo(li, { x: uPx() * 6, opacity: 0 }, { x: 0, opacity: 1, duration: .28, ease: 'back.out(2)' });
      const b = li.querySelector('.tijolo'), voo = b.cloneNode(true), r = b.getBoundingClientRect();
      voo.classList.add('voando');
      Object.assign(voo.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      document.body.append(voo);
      gsap.timeline({ onComplete: () => voo.remove() })
        .to(voo, { y: -uPx() * 22, x: -uPx() * 4, rotation: -14, scale: 1.3, duration: .32, ease: 'power2.out' })
        .to(voo, { y: -uPx() * 34, scale: .3, opacity: 0, duration: .3, ease: 'power2.in' });
    }
  }
  const e2local = pid => (typeof Jogo !== 'undefined' ? Jogo.estado?.potencias[pid]?.dilema?.local : null);

  // Cronômetro opcional em volta do Encerrar vez (s = segundos que faltam; null esconde)
  function cronometro(s, total) {
    const el = raiz?.querySelector('.hud-tempo'), enc = raiz?.querySelector('.hud-encerrar');
    if (!el) return;
    if (s == null) { el.hidden = true; enc.style.removeProperty('--resta'); enc.classList.remove('com-tempo'); return; }
    const seg = Math.ceil(s);
    el.hidden = false;
    enc.classList.add('com-tempo');
    enc.style.setProperty('--resta', Math.max(0, s / total).toFixed(3));
    const txt = `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
    if (el.textContent !== txt) {
      el.textContent = txt;
      if (seg <= 5 && seg > 0) { el.classList.add('acabando'); efeitoSom('tique', { semitons: 5 - seg }); if (!RM) gsap.fromTo(el, { scale: 1.08 }, { scale: 1, duration: .4, ease: 'power2.out' }); }
      else el.classList.remove('acabando');
    }
  }

  // ============================== LETREIRO DO JORNAL MUNDIAL (guia §5.9) ==============================
  function categoriaDe(m) {
    if (m.carta) return CATEGORIAS[carta(m.carta)?.categoria] && carta(m.carta).categoria;
    if (m.dilema && typeof DILEMAS !== 'undefined') return DILEMAS.find(d => d.id === m.dilema)?.opcoes[m.opcao]?.categoria;
    if (/ONU|Cúpula/.test(m.texto)) return 'diplomacia';
    return null;
  }
  function atualizarLetreiro(e) {
    const doAno = e.manchetes.filter(m => m.ano === e.ano);
    const lista = (doAno.length ? doAno : e.manchetes.slice(-3)).slice(-12);
    const novas = lista.length !== manchetes.lista.length || lista.at(-1)?.texto !== manchetes.lista.at(-1)?.texto;
    manchetes.lista = lista;
    if (novas && lista.length) mostrarManchete(lista.length - 1, true);
    else if (!lista.length) { raiz.querySelector('.letreiro-texto span').textContent = 'Missão 2050: o mundo inteiro depende das suas decisões.'; raiz.querySelector('.letreiro-cont').textContent = fmtAno(e.ano); }
    if (!manchetes.timer) manchetes.timer = setInterval(() => {
      if (!raiz?.isConnected) { clearInterval(manchetes.timer); manchetes.timer = null; return; }
      if (manchetes.lista.length > 1) mostrarManchete((manchetes.i + 1) % manchetes.lista.length, false);
    }, 7000);
  }
  function mostrarManchete(i, nova) {
    const m = manchetes.lista[i];
    if (!m || !raiz) return;
    manchetes.i = i;
    const p = raiz.querySelector('.letreiro-texto'), span = p.querySelector('span'), cat = categoriaDe(m), sel = raiz.querySelector('.letreiro-cat');
    const trocar = () => {
      span.textContent = m.texto;
      sel.className = `soquete letreiro-cat${cat ? ' cat-' + cat : ''}`;
      sel.style.setProperty('--soquete', cat ? corDe(cat) : '#E9E0CC');
      sel.innerHTML = ic(cat ? CATEGORIAS[cat].icone : m.evento ? '📰' : '🌍', 48);
      raiz.querySelector('.letreiro-cont').textContent = `${fmtAno(m.ano)} · ${i + 1}/${manchetes.lista.length}`;
      caberLetreiro(span);
    };
    if (RM) { trocar(); return; }
    gsap.timeline().to(span, { yPercent: -110, opacity: 0, duration: .15, ease: 'power2.in' }).add(trocar)
      .fromTo(span, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .15, ease: 'power2.out' });
    if (nova) { efeitoSom('virar'); p.classList.remove('nova'); void p.offsetWidth; p.classList.add('nova'); }
  }
  // Manchete longa demais: reduz até o piso; se ainda não couber, corta com reticências (a lista completa está em "Ver todas")
  const caberLetreiro = span => { span.style.fontSize = ''; caberNaLargura(span.parentElement); };
  function manchete(texto) {
    const e = typeof Jogo !== 'undefined' ? Jogo.estado : null;
    if (!raiz || !texto) return;
    if (!manchetes.lista.some(m => m.texto === texto)) manchetes.lista.push({ ano: e?.ano ?? 2026, texto });
    mostrarManchete(manchetes.lista.findIndex(m => m.texto === texto), true);
  }

  // ============================== BALÃO DO TERRITÓRIO (FICHAS + números ao vivo) ==============================
  function balao(id, x, y) {
    const el = raiz?.querySelector('.hud-balao'), e = typeof Jogo !== 'undefined' ? Jogo.estado : null;
    if (!el) return;
    // um foco por vez: com a ficha da ação aberta (escolha ou confirmação), o balão não aparece
    const f = raiz.querySelector('.hud-ficha');
    if (!id || !e || (!f.hidden && !f.classList.contains('modo-previa'))) { el.hidden = true; el.dataset.id = ''; return; }
    if (el.dataset.id !== id) { el.innerHTML = e.potencias[id] ? balaoPotencia(e, id) : balaoTerritorio(e, id); el.dataset.id = id; }
    el.hidden = false;
    // ao lado do ponteiro, dentro da área livre do mapa (guia §5.19): nunca cobre a doca, o topo nem a faixa de instrução
    const u = uPx(), w = el.offsetWidth, h = el.offsetHeight, instr = raiz.querySelector('.hud-instrucao');
    const chao = instr.hidden ? innerHeight - 24 * u : instr.getBoundingClientRect().top - 1.2 * u;
    let left = x + 3 * u;
    if (left + w > innerWidth - 8 * u) left = x - w - 3 * u;
    left = Math.max(33.4 * u, left);
    const top = Math.max(12.6 * u, Math.min(chao - h, y - h * .4));
    el.style.transform = `translate(${left.toFixed(0)}px, ${top.toFixed(0)}px)`;
  }
  function primeiraFrase(t = '') { const m = t.match(/^.+?[.!?](\s|$)/); return (m ? m[0] : t).trim(); }
  const CONFLITO = ['', 'Conflito leve', 'Conflito intenso', 'Guerra aberta'];
  function balaoTerritorio(e, id) {
    const t = e.territorios[id], dado = TERRITORIOS.find(x => x.id === id), ficha = typeof FICHAS !== 'undefined' ? FICHAS[id] : null;
    const inf = Object.entries(t.influencia).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const res = Simulacao.resistencia(t);
    const parceria = t.protegido ? `<span class="pilula">${ic('🐧', 40)}Protegida pelo Tratado da Antártida</span>`
      : t.parceiro ? `<span class="pilula" data-equipe="${t.parceiro}">${formaDe(t.parceiro, { branca: true })}Parceiro ${esc(com(t.parceiro, 'de'))}</span>`
        : `<span class="pilula">${ic('🏳️', 40)}Neutro</span>`;
    const conflito = t.conflito > 0 ? `<span class="pilula alerta">${'<i class="bloco-alerta">!</i>'.repeat(t.conflito)} ${CONFLITO[t.conflito]}</span>` : '';
    const rec = Object.entries(t.recursos).filter(([, n]) => n > 0).map(([r, n]) => `<span class="chip-rec">${ic(ICO_REC[r], 40)}<b class="num">${n}</b></span>`).join('');
    const med = (ico, rot, v, nivel) => `<span class="mini-med"><span class="mm-rot">${ic(ico, 40)}${rot}</span><b class="num">${r0(v)}</b>
      <span class="seg fina" data-nivel="${nivel}" style="--n:${Math.round(v / 10)};--total:10"></span></span>`;
    return `<div class="bal-cab"><span class="balao-tit">${ic('📍', 48)}${esc(dado?.nome || nomePot(id))}<small>${esc(CONTINENTE[t.continente] || '')}</small></span>
        <div class="balao-pilulas">${parceria}${conflito}</div></div>
      ${t.protegido ? '' : `<div class="bal-corpo"><div class="balao-meds">
          ${med('📈', 'Desenvolvimento', t.desenvolvimento, t.desenvolvimento < 50 ? 'risco' : t.desenvolvimento < 70 ? 'medio' : 'bom')}
          ${med('⚖️', 'Estabilidade', t.estabilidade, t.estabilidade < 35 ? 'risco' : t.estabilidade < 60 ? 'medio' : 'bom')}
          ${med('🌊', 'Risco climático', t.vulnerabilidade, t.vulnerabilidade >= 60 ? 'risco' : t.vulnerabilidade >= 40 ? 'medio' : 'bom')}</div>
        <div class="balao-inf"><span class="rot">${ic('🤝', 40)}Influência</span>${inf.length ? inf.map(([p, n]) => `<span class="inf-linha">${formaDe(p)}<span>${esc(nomeCurto(p))}</span>
          <span class="seg fina" data-equipe="${p}" style="--n:${n};--total:10"><i class="limiar" style="left:${res * 10}%"></i></span><b class="num">${n}</b></span>`).join('') : '<span class="rot">Ninguém ainda.</span>'}
          ${t.parceiro ? '' : `<span class="rot inf-regra">Parceria: ${res} de influência e 2 à frente</span>`}
          ${rec ? `<div class="balao-rec"><span class="rot">Produz</span>${rec}</div>` : ''}</div></div>`}
      ${ficha?.resumo ? `<p class="balao-resumo">${esc(primeiraFrase(ficha.resumo))}</p>` : ''}`;
  }
  function balaoPotencia(e, id) {
    const p = e.potencias[id], ficha = typeof FICHAS !== 'undefined' ? FICHAS[id] : null;
    return `<div class="bal-cab"><span class="balao-tit">${formaDe(id)}${esc(nomePot(id))}<small>${p.humano ? esc(nomeEquipe(id)) : 'Computador'}</small></span>
      <div class="balao-pilulas"><span class="pilula amarela">IGI <b class="num">${Simulacao.igi(e, id).total}</b></span>
        <span class="pilula">${ic('🤝', 40)}${Simulacao.parceirosDe(e, id).length} ${Simulacao.parceirosDe(e, id).length === 1 ? 'parceiro' : 'parceiros'}</span></div></div>
      <div class="vez-nacao">${NACAO.map(([k, ico, nome]) => `<span class="cel-nacao${p[k] < 30 ? ' alerta' : ''}" title="${nome}">${ic(ico, 40)}<b class="num">${r0(p[k])}</b><span class="so-leitor"> de ${nome}</span></span>`).join('')}</div>
      ${ficha?.resumo ? `<p class="balao-resumo">${esc(primeiraFrase(ficha.resumo))}</p>` : ''}`;
  }

  // ============================== VOO CAUSA → EFEITO (guia §6.11) ==============================
  // Uma pecinha com o ícone sai do lugar da ação no mapa e voa (Bézier, 0,7 s) até cada indicador do topo que mudou;
  // quem chama atualiza o HUD depois, e a peça conta ao "receber" o voo. RM: nada voa.
  function voo(deId, e) {
    const pos = typeof Mapa3D !== 'undefined' && Mapa3D.posicaoNaTela ? Mapa3D.posicaoNaTela(deId) : null;
    if (RM || !raiz || !ultimo || !e || !pos?.visivel) return Promise.resolve();
    const chaves = IND.filter(d => Math.abs(e.global[d.k] - ultimo.global[d.k]) >= (d.k === 'temperatura' ? .005 : .5)).map(d => d.k);
    const u = uPx(), tam = 5.2 * u;
    return Promise.all(chaves.map((k, i) => new Promise(ok => {
      const d = IND.find(x => x.k === k), b = raiz.querySelector(`.ind[data-ind="${k}"]`).getBoundingClientRect();
      const p0 = { x: pos.x, y: pos.y }, p2 = { x: b.left + (d.relogio ? 4.4 : 3.9) * u, y: b.top + b.height / 2 };
      const p1 = { x: (p0.x + p2.x) / 2 + (p2.x > p0.x ? -1 : 1) * 8 * u, y: Math.min(p0.y, p2.y) - 10 * u };
      const peca = document.createElement('span');
      peca.className = 'soquete hud-voo';
      peca.innerHTML = ic(d.relogio ? '⏰' : d.ico, 48);
      Object.assign(peca.style, { width: tam + 'px', height: tam + 'px', left: -tam / 2 + 'px', top: -tam / 2 + 'px' });
      document.body.append(peca);
      const o = { t: 0 }, por = () => {
        const t = o.t, a = (1 - t) * (1 - t), m = 2 * (1 - t) * t, c = t * t;
        gsap.set(peca, { x: a * p0.x + m * p1.x + c * p2.x, y: a * p0.y + m * p1.y + c * p2.y });
      };
      por();
      gsap.timeline({ delay: i * .12, onComplete: () => { peca.remove(); efeitoSom('moeda'); ok(); } })
        .fromTo(peca, { scale: 0 }, { scale: 1.15, duration: .2, ease: 'back.out(2.5)' })
        .to(o, { t: 1, duration: .7, ease: 'power2.inOut', onUpdate: por })
        .to(peca, { scale: .55, duration: .7, ease: 'power2.in' }, '<');
    })));
  }

  // "Por que mudou" no último balanço (guia §5.6): antes → depois e as causas que o motor apontou
  let ultimoBalanco = null;   // { ano, proximoAno, antes, depois, causas } (Jogo guarda e devolve ao continuar)
  const lembrarBalanco = b => (ultimoBalanco = b || null);
  function porqueMudou(k) {
    const b = ultimoBalanco;
    if (!b?.antes || !b.depois) return '';
    const curtoV = v => (k === 'tensao' ? `${segundos(v)} s` : k === 'temperatura' ? fmtGraus(v) : k === 'deslocados' ? fmtMilhoes(r0(v), true) : fmt(r0(v)));
    const c = b.causas?.[k] || [], linhas = [];
    if (k === 'temperatura' && c.length) linhas.push(`Quem mais emitiu (Gt de CO₂ por ano): ${c.map(x => `${x.quem === 'territorios' ? 'outros países' : nomeCurto(x.quem)} ${fmt(x.valor, 1)}`).join(' · ')}`);
    if ((k === 'tensao' || k === 'deslocados') && c.length) linhas.push(`${k === 'tensao' ? 'Conflitos que adiantaram o Relógio' : 'Conflitos que forçaram pessoas a fugir'}: ${c.map(x => nomePot(x.quem)).join(', ')}`);
    return `<p class="det-porque"><b>No balanço de ${fmtAno(b.ano)}:</b> ${curtoV(b.antes[k])} → ${curtoV(b.depois[k])}${linhas.map(l => `<br>${esc(l)}`).join('')}</p>`;
  }

  // ============================== DETALHE DE UM INDICADOR (clique na peça do topo) ==============================
  function detalheIndicador(btn) {
    const el = raiz.querySelector('.hud-detalhe'), e = Jogo.estado, k = btn.dataset.ind, d = IND.find(x => x.k === k);
    const fechar = () => { el.hidden = true; btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', fora, true); document.removeEventListener('keydown', esc1, true); };
    const fora = ev => { if (!el.contains(ev.target) && !btn.contains(ev.target)) fechar(); };
    const esc1 = ev => { if (ev.key === 'Escape') { ev.stopPropagation(); fechar(); btn.focus(); } };
    if (!el.hidden && el.dataset.ind === k) { fechar(); return; }
    if (!e) return;
    const val = k === 'tensao' ? v => segundos(v) : v => v;
    const pontos = e.historico.map(h => val(h.global[k])), anos = e.historico.map(h => fmtAno(h.ano));
    const [nivel, palavra] = d.estado(e.global[k]);
    el.dataset.ind = k;
    el.innerHTML = `<span class="balao-tit">${d.relogio ? ic('⏰', 48) : ic(d.ico, 48)}${d.nome}<small>${valorFala(k, e.global[k])} · ${palavra}</small></span>
      <p>${esc(d.porque)}</p>
      ${pontos.length > 1 ? graficoLinhas([{ pid: 'mundo', cor: 'anil', pontos }], { anos, casas: k === 'temperatura' ? 2 : 0, largura: 520, altura: 220, titulo: `${d.nome} ao longo da partida` }) : ''}
      ${porqueMudou(k)}`;
    el.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    const b = btn.getBoundingClientRect(), u = uPx();
    const left = Math.max(1.5 * u, Math.min(innerWidth - el.offsetWidth - 1.5 * u, b.left + b.width / 2 - el.offsetWidth / 2));
    el.style.setProperty('--ponta-x', (b.left + b.width / 2 - left - 1.5 * u) + 'px');
    Object.assign(el.style, { transform: '', left: left + 'px', top: b.bottom + 2.6 * u + 'px' });   // posição por left/top: o GSAP anima só o y
    el.dataset.nivel = nivel;
    if (!RM) gsap.fromTo(el, { opacity: 0, y: -u }, { opacity: 1, y: 0, duration: .22, ease: 'power2.out' });
    setTimeout(() => { document.addEventListener('pointerdown', fora, true); document.addEventListener('keydown', esc1, true); });
  }

  // Lista de todas as manchetes (botão "Ver todas"): página do Jornal Mundial
  function abrirJornal(e) {
    const p = document.createElement('section');
    p.className = 'painel peca pinos painel-m hud-jornal';
    p.setAttribute('aria-label', 'Jornal Mundial: todas as manchetes');
    const porAno = {};
    e.manchetes.forEach(m => (porAno[m.ano] ||= []).push(m));
    const anos = Object.keys(porAno).sort((a, b) => b - a);
    p.innerHTML = `<header class="painel-cab"><h2 class="painel-titulo so-leitor">Jornal Mundial</h2>
        <button class="btn btn-ic peca jornal-fechar" aria-label="Fechar o jornal"><img src="${ICONES_BOTAO.fechar}" alt=""></button></header>
      <div class="tela jornal">${cabecalhoJornal({ ano: e.ano, mandato: Math.min(e.rodada, e.config.rodadas), total: e.config.rodadas })}
        ${anos.length ? anos.map(a => `<h3 class="jornal-ano marca">${a}</h3><ul class="jornal-lista">${porAno[a].slice().reverse().map(m => {
          const cat = categoriaDe(m);
          return `<li><span class="soquete" style="--soquete:${cat ? corDe(cat) : '#E9E0CC'}">${ic(cat ? CATEGORIAS[cat].icone : m.evento ? '📰' : '🌍', 48)}</span><span>${esc(m.texto)}</span></li>`;
        }).join('')}</ul>`).join('') : '<p class="jornal-vazio">Ainda não há manchetes. O mundo está esperando as primeiras decisões!</p>'}</div>`;
    p.querySelector('.jornal-fechar').onclick = () => fecharPainel(p);
    return abrirPainel(p, { esc: true });
  }

  // ============================== RELAÇÕES (diplomacia): como as outras potências veem a da vez ==============================
  // Barra de −100 a +100 com o zero no meio, sempre com a palavra (Hostil … Aliada) e o número: nunca só a cor.
  const SINAL_REL = { '-3': '−−−', '-2': '−−', '-1': '−', 1: '+', 2: '++', 3: '+++' };
  const comercioTxt = c => (c >= .2 ? 'Comércio forte' : c >= .1 ? 'Comércio médio' : c > 0 ? 'Comércio pequeno' : '');
  function linhaRelacao(r) {
    const v = Math.round(r.valor), nivel = r.rotulo?.nivel ?? 0, texto = r.rotulo?.texto ?? '';
    const larg = Math.min(50, Math.abs(v) / 2), esq = v < 0 ? 50 - larg : 50;
    const selos = [r.aliada && `<span class="pilula rel-selo aliada">${ic('🤝', 40)}Aliança</span>`, r.sancionada && `<span class="pilula rel-selo sancao">${ic('🔒', 40)}Sanção</span>`,
      comercioTxt(r.comercio) && `<span class="pilula rel-selo comercio">${ic('🚢', 40)}${comercioTxt(r.comercio)}</span>`].filter(Boolean).join('');
    const sit = [texto, r.aliada ? 'aliança' : '', r.sancionada ? 'sanção' : '', comercioTxt(r.comercio).toLowerCase()].filter(Boolean).join(', ');
    return `<li><button class="rel-linha" data-id="${r.id}" data-nivel="${nivel}" aria-label="${esc(nomeCurto(r.id))}: ${esc(sit)}, ${sinal(v)} de 100. Ver no mapa.">
      <span class="rel-quem" data-equipe="${r.id}">${formaDe(r.id)}<b>${esc(nomeCurto(r.id))}</b></span>
      <span class="rel-barra" aria-hidden="true"><i class="rel-fill" style="left:${esq}%;width:${larg}%"></i><b class="rel-zero"></b></span>
      <span class="rel-rotulo"><span class="rel-sinal">${SINAL_REL[nivel] ?? ''}</span>${esc(texto)} <span class="num rel-valor">${sinal(v)}</span></span>
      <span class="rel-selos">${selos}</span></button></li>`;
  }
  function abrirRelacoes(e, de) {
    de ||= vez || Object.keys(e.potencias).find(p => e.potencias[p].humano) || PIDS[0];
    if (typeof Simulacao === 'undefined' || !Simulacao.relacoesDe) { aviso('A diplomacia ainda não está disponível.', { tipo: 'neutro' }); return null; }
    const lista = Simulacao.relacoesDe(e, de);
    const p = document.createElement('section');
    p.className = 'painel peca pinos painel-m hud-relacoes';
    p.dataset.equipe = de;
    p.setAttribute('aria-labelledby', 'rel-titulo');
    p.innerHTML = `<header class="painel-cab"><h2 class="painel-titulo" id="rel-titulo">Relações ${esc(prepDe(de))} ${esc(nomeCurto(de))}<small class="painel-sub">Como as outras potências enxergam vocês. Toque numa para ver no mapa.</small></h2>
        <button class="btn btn-ic peca rel-fechar" aria-label="Fechar as relações"><img src="${ICONES_BOTAO.fechar}" alt=""></button></header>
      <div class="tela rel-tela"><p class="rel-legenda">Esquerda do traço branco: relação ruim (listrada). Direita: boa (lisa). Quanto mais longe, mais forte.</p>
        <ul class="rel-lista">${lista.map(linhaRelacao).join('')}</ul></div>`;
    p.querySelector('.rel-fechar').onclick = () => fecharPainel(p);
    p.querySelector('.rel-lista').addEventListener('click', ev => {
      const b = ev.target.closest('.rel-linha');
      if (!b) return;
      fecharPainel(p);
      if (typeof Mapa3D !== 'undefined' && Mapa3D.focar) Mapa3D.focar(b.dataset.id, { duracao: RM ? 0 : 1.1 });
    });
    return abrirPainel(p, { esc: true });
  }

  // ============================== O QUE O MUNDO FEZ: reações às ações (resultado.reacoes do motor) ==============================
  const ICONE_REACAO = { relacao: '🤝', retaliacao: '⚔️', apoio: '🙌', corrida: '🚀', furaram: '🔓', aliados: '🛡️' };
  let reacoesEl = null, reacoesTimer = 0;
  const fecharReacoes = () => { clearTimeout(reacoesTimer); reacoesEl?.remove(); reacoesEl = null; };
  function reacoes(lista, { ms } = {}) {
    fecharReacoes();
    const itens = (lista || []).filter(r => r?.texto).slice(0, 7);
    if (!raiz || !itens.length) return null;
    const el = document.createElement('aside');
    el.className = 'hud-reacoes peca flutua';
    el.setAttribute('role', 'status');
    el.innerHTML = `<header><b>O que o mundo fez</b><button class="btn btn-ic peca" aria-label="Fechar"><img src="${ICONES_BOTAO.fechar}" alt=""></button></header>
      <ul>${itens.map(r => `<li data-tipo="${esc(r.tipo || '')}">${r.quem ? `<span data-equipe="${esc(r.quem)}">${formaDe(r.quem)}</span>` : ''}${ic(ICONE_REACAO[r.tipo] || '🌍', 40)}<span>${esc(r.texto)}</span></li>`).join('')}</ul>`;
    raiz.append(el);
    reacoesEl = el;
    const fechar = () => { clearTimeout(reacoesTimer); if (reacoesEl !== el) return; reacoesEl = null; gsap.to(el, { opacity: 0, y: RM ? 0 : uPx(), duration: RM ? .12 : .25, onComplete: () => el.remove() }); };
    el.querySelector('button').onclick = fechar;
    if (RM) gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .18 });
    else gsap.fromTo(el, { y: 3 * uPx(), opacity: 0, scale: .9 }, { y: 0, opacity: 1, scale: 1, duration: .35, ease: 'back.out(2)' });
    efeitoSom('pop');
    anunciar('O que o mundo fez: ' + itens.map(r => r.texto).join(' '));
    reacoesTimer = setTimeout(fechar, ms ?? 4500 + itens.reduce((n, r) => n + r.texto.length, 0) * 45);
    return el;
  }

  return {
    montar, atualizar, manchete, fase, ocultar, previa, doca, voo, lembrarBalanco, selecionar, tijoloEl, ficha, instrucao, decidindo, jogadaIA, cronometro, balao,
    abrirJornal, abrirRelacoes, reacoes, comecarVez, focar, estadoAcao, retratoUrl: pid => retratos[pid + '|rosto'] || null, alvosDe, chipsEfeitos, curto, retratoHTML, pedirRetrato, limparRetratos, ao,
    get raiz() { return raiz; }, get vez() { return vez; }, NACAO, RECURSOS,
  };
})();
