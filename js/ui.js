'use strict';
/* Geografia Irada — peças de interface compartilhadas: telas, painéis, faixa de anúncio, avisos, carimbo, chuva de
   tijolinhos, números que saltam, cores e formas das equipes, formatação pt-BR e leitura para leitor de tela.
   Tudo o que espera (animação, clique, tempo) é cancelável: ao encerrar a partida, novaPartidaUI() invalida as esperas.
   Visual: css/base.css (catálogo em docs/ARQUITETURA.md). Movimento reduzido (RM) tira movimento, nunca tempo de leitura;
   ?rapido na URL (RAPIDO) acelera animações e esperas para o teste automático. */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
// Movimento reduzido: pedido pelo sistema ou pelo ajuste do jogo (gravarPref('movimento-reduzido', true) + recarregar)
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || lerPref('movimento-reduzido', false) === true;
// Ajustes de acessibilidade guardados (menu de pausa): texto maior e contraste alto
if (lerPref('texto', 1) !== 1) document.documentElement.style.setProperty('--texto', lerPref('texto', 1));
if (lerPref('contraste', false)) document.documentElement.dataset.contraste = 'alto';
const RAPIDO = new URLSearchParams(location.search).has('rapido');
// O navegador tem 3D (WebGL)? O Chrome desliga o WebGL depois de travar a placa de vídeo algumas vezes, até ser reiniciado.
const TEM_3D = (() => {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();   // só testa: devolve o contexto na hora
    return !!gl;
  } catch { return false; }
})();
function avisoSem3D() {
  document.body.insertAdjacentHTML('beforeend', `<div class="painel sem-3d" role="alert" style="position:fixed;inset:auto 0 0 0;margin:auto;top:0;max-width:640px;height:fit-content;padding:32px;z-index:100;text-align:center;background:#FFF9EC;color:#1A1433;border:5px solid #1A1433;border-radius:24px;box-shadow:0 8px 0 #1A1433;font-size:20px">
    <h2>O 3D do navegador está desligado</h2>
    <p>O mapa do jogo precisa de aceleração gráfica (WebGL). Feche <b>todas</b> as janelas do navegador e abra de novo.
    Se continuar, ative em Configurações → Sistema → "Usar aceleração gráfica quando disponível" e reinicie o navegador.</p></div>`);
}
if (RAPIDO && window.gsap) gsap.globalTimeline.timeScale(10);
document.documentElement.classList.toggle('rm', RM);

const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sortear = lista => lista[Math.floor(Math.random() * lista.length)];
const embaralhar = lista => { const a = [...lista]; for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };
const listaNomes = nomes => (nomes.length < 2 ? nomes.join('') : nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1]);
const fmt = (n, casas = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const sinal = (n, casas = 0) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n), casas);
const loop = (alvo, props) => (RM ? null : gsap.to(alvo, { repeat: -1, yoyo: true, ease: 'sine.inOut', ...props }));

// ---------- Números, anos e unidades em pt-BR (guia §3.3) ----------
const FINO = ' ';                                     // espaço fino não separável antes da unidade
const fmtAno = ano => String(Math.round(ano));             // 2030 (fmt daria "2.030")
const fmtGraus = (t, casas = 2) => fmt(t, casas) + FINO + '°C';                                   // "1,45 °C"
const fmtMilhoes = (n, curto = false) => fmt(n, Number.isInteger(n) ? 0 : 1) + FINO + (curto ? 'mi' : Math.abs(n) < 2 ? 'milhão' : 'milhões');  // "120 mi" / "120 milhões"
const uPx = () => (document.documentElement.classList.contains('retrato') ? Math.min(innerWidth / 52, innerHeight / 112) : Math.min(innerHeight, innerWidth * .5625) / 100);                              // 1u em px
// Tamanho em px de uma ficha de fonte (ex.: pxDe('--fs-min') → 18 em 1366×768)
function pxDe(ficha) {
  const s = document.createElement('i');
  s.style.cssText = `position:absolute;visibility:hidden;font-size:var(${ficha})`;
  document.body.append(s);
  const px = parseFloat(getComputedStyle(s).fontSize);
  s.remove();
  return px;
}
const efeitoSom = (nome, o) => { if (nome && typeof Som !== 'undefined') Som.efeito(nome, o); };
const abafarTrilha = () => { if (typeof Som !== 'undefined') Som.abafar?.(pilhaPaineis.length > 0); };   // painel aberto: música abafada
// Fontes do jogo carregadas (para medir texto ou desenhar em canvas/textura)
const fontesProntas = document.fonts
  ? Promise.all(['700 20px Fredoka', '800 20px Nunito', '900 20px Nunito', '20px "Titan One"'].map(f => document.fonts.load(f))).then(() => {}, () => {})
  : Promise.resolve();

// ---------- Cores e formas das equipes (guia §2: os valores do guia valem mais que os de conteudo/*.js) ----------
// Caminhos SVG das formas (viewBox 0 0 100 100). Propriedade de window para não brigar com cópias locais em outros arquivos.
window.FORMAS = {
  circulo: 'M50,9A41,41 0 1,1 49.99,9Z',
  quadrado: 'M13.0,27.0A14,14 0 0,1 27.0,13.0L73.0,13.0A14,14 0 0,1 87.0,27.0L87.0,73.0A14,14 0 0,1 73.0,87.0L27.0,87.0A14,14 0 0,1 13.0,73.0Z',
  triangulo: 'M42.2,19.9A9,9 0 0,1 57.8,19.9L87.5,72.6A9,9 0 0,1 79.6,86.0L20.4,86.0A9,9 0 0,1 12.5,72.6Z',
  estrela: 'M45.3,17.1A5,5 0 0,1 54.7,17.1L61.9,35.8A2,2 0 0,0 63.6,37.1L83.7,38.2A5,5 0 0,1 86.5,47.0L71.0,59.7A2,2 0 0,0 70.3,61.7L75.5,81.1A5,5 0 0,1 67.9,86.6L51.1,75.7A2,2 0 0,0 48.9,75.7L32.1,86.6A5,5 0 0,1 24.5,81.1L29.7,61.7A2,2 0 0,0 29.0,59.7L13.5,47.0A5,5 0 0,1 16.3,38.2L36.4,37.1A2,2 0 0,0 38.1,35.8Z',
  losango: 'M43.6,9.4A9,9 0 0,1 56.4,9.4L90.6,43.6A9,9 0 0,1 90.6,56.4L56.4,90.6A9,9 0 0,1 43.6,90.6L9.4,56.4A9,9 0 0,1 9.4,43.6Z',
  hexagono: 'M46.0,5.3A8,8 0 0,1 54.0,5.3L86.7,24.2A8,8 0 0,1 90.7,31.1L90.7,68.9A8,8 0 0,1 86.7,75.8L54.0,94.7A8,8 0 0,1 46.0,94.7L13.3,75.8A8,8 0 0,1 9.3,68.9L9.3,31.1A8,8 0 0,1 13.3,24.2Z',
  // as sete formas das potências novas (cruz, anel, gota, pentágono, octógono, escudo, trapézio): mesma área visual, cantos por arcos
  cruz: 'M36,18A6,6 0 0,1 42,12L58,12A6,6 0 0,1 64,18L64,33A3,3 0 0,0 67,36L82,36A6,6 0 0,1 88,42L88,58A6,6 0 0,1 82,64L67,64A3,3 0 0,0 64,67L64,82A6,6 0 0,1 58,88L42,88A6,6 0 0,1 36,82L36,67A3,3 0 0,0 33,64L18,64A6,6 0 0,1 12,58L12,42A6,6 0 0,1 18,36L33,36A3,3 0 0,0 36,33Z',
  anel: 'M50,9A41,41 0 1,1 49.99,9ZM50,28A22,22 0 1,0 50.01,28Z',
  gota: 'M46.8,13.5A4,4 0 0,1 53.2,13.5L75.1,43.9A31,31 0 1,1 24.9,43.9Z',
  pentagono: 'M45.9,14.1A7,7 0 0,1 54.1,14.1L86.8,37.8A7,7 0 0,1 89.3,45.7L76.8,84.1A7,7 0 0,1 70.2,88.9L29.8,88.9A7,7 0 0,1 23.2,84.1L10.7,45.7A7,7 0 0,1 13.2,37.8Z',
  octogono: 'M91.1,65.7A3.2,3.2 0 0,1 90.2,68L68,90.2A3.2,3.2 0 0,1 65.7,91.1L34.3,91.1A3.2,3.2 0 0,1 32,90.2L9.8,68A3.2,3.2 0 0,1 8.9,65.7L8.9,34.3A3.2,3.2 0 0,1 9.8,32L32,9.8A3.2,3.2 0 0,1 34.3,8.9L65.7,8.9A3.2,3.2 0 0,1 68,9.8L90.2,32A3.2,3.2 0 0,1 91.1,34.3Z',
  trapezio: 'M26.5,25A7,7 0 0,1 33.2,20L66.8,20A7,7 0 0,1 73.5,25L87.3,71A7,7 0 0,1 80.6,80L19.4,80A7,7 0 0,1 12.7,71Z',
  escudo: 'M24,13L76,13A9,9 0 0,1 85,22L85,50C85,71 70,82 50,92C30,82 15,71 15,50L15,22A9,9 0 0,1 24,13Z',
};
// Equipes, categorias, continentes e cores de interface por id (tons: cor, lado, clara, contorno, brilho, b)
const CORES_GUIA = {
  brasil: { cor: '#27B263', lado: '#0D6E4E', clara: '#73CD9A', contorno: '#011C13', forma: 'circulo', nomeCor: 'Verde', curto: 'Brasil' },
  eua: { cor: '#0A32B4', lado: '#0B2384', clara: '#3657C2', contorno: '#00041C', forma: 'quadrado', nomeCor: 'Azul', curto: 'EUA' },
  china: { cor: '#D0180E', lado: '#81001C', clara: '#DB4F48', contorno: '#1C0006', forma: 'triangulo', nomeCor: 'Vermelha', curto: 'China' },
  ue: { cor: '#9645EE', lado: '#651C94', clara: '#AD6EF2', contorno: '#12031C', forma: 'estrela', nomeCor: 'Roxa', curto: 'UE' },
  india: { cor: '#FF9C0A', lado: '#9E3400', clara: '#FFC267', contorno: '#1C0900', forma: 'losango', nomeCor: 'Laranja', curto: 'Índia' },
  russia: { cor: '#F2248F', lado: '#960773', clara: '#F66EB5', contorno: '#1C0015', forma: 'hexagono', nomeCor: 'Rosa', curto: 'Rússia' },
  reino_unido: { cor: '#00B3A4', lado: '#00666B', clara: '#46E5D7', contorno: '#011917', forma: 'cruz', nomeCor: 'Turquesa', curto: 'Reino Unido' },
  japao: { cor: '#6C7A96', lado: '#414B5A', clara: '#A4ABB8', contorno: '#0E1118', forma: 'anel', nomeCor: 'Grafite', curto: 'Japão' },
  australia: { cor: '#9CCB1F', lado: '#507A13', clara: '#BDD776', contorno: '#121705', forma: 'gota', nomeCor: 'Lima', curto: 'Austrália' },
  nova_zelandia: { cor: '#8E1B3A', lado: '#551027', clara: '#CA5A78', contorno: '#150509', forma: 'pentagono', nomeCor: 'Bordô', curto: 'Nova Zelândia' },
  africa_do_sul: { cor: '#9A5B2E', lado: '#5C321C', clara: '#C49574', contorno: '#140C07', forma: 'octogono', nomeCor: 'Marrom', curto: 'África do Sul' },
  nigeria: { cor: '#FF7A66', lado: '#B53A2B', clara: '#FFB0A3', contorno: '#2B0803', forma: 'escudo', nomeCor: 'Coral', curto: 'Nigéria' },
  egito: { cor: '#4DB6FF', lado: '#0B69A8', clara: '#9BCEF1', contorno: '#01111C', forma: 'trapezio', nomeCor: 'Celeste', curto: 'Egito' },
  diplomacia: { cor: '#DCCFFF', lado: '#8F79CC', brilho: '#E4DBFF' }, economia: { cor: '#FFE08A', lado: '#CCA742', brilho: '#FFE8A8' },
  natureza: { cor: '#B3EFC6', lado: '#65BF82', brilho: '#C6F3D4' }, seguranca: { cor: '#FFC4AE', lado: '#CC7C5E', brilho: '#FFD2C1' },
  pessoas: { cor: '#FFCAE6', lado: '#CC75A3', brilho: '#FFD7EC' }, ciencia: { cor: '#99CDF8', lado: '#4F90C6', brilho: '#B2D9FA' },
  an: { cor: '#F6DECB', b: '#ECCFB8' }, as: { cor: '#DCE6C4', b: '#CEDBB2' }, eu: { cor: '#E0E1EC', b: '#D2D4E3' }, af: { cor: '#F4E2BA', b: '#EAD3A2' },
  ai: { cor: '#F3D9D6', b: '#E9C8C4' }, oc: { cor: '#E6DCF0', b: '#D9CCE8' }, po: { cor: '#F6FAFD', b: '#E7F1F8' },
  amarelo: { cor: '#FFD21F', lado: '#B98A00' }, verde: { cor: '#3CD46A', lado: '#1F9A47' }, vermelho: { cor: '#F0303A', lado: '#A3141F' },
  ladrilho: { cor: '#FFF9EC', lado: '#B3AA98' }, anil: { cor: '#3550C8', lado: '#141F66' }, tinta: { cor: '#1A1433', lado: '#1A1433' },
};
// Fonte única das potências na interface: a ordem e o elenco vêm de conteudo/potencias.js; cor, forma e nome da equipe, de CORES_GUIA
const PIDS = typeof POTENCIAS !== 'undefined' ? POTENCIAS.map(p => p.id) : [];
// preposição + artigo de cada potência, vindos de POTENCIAS[].artigo: "do" Brasil, "da" China, "dos" EUA
const prepDe = pid => ({ o: 'do', a: 'da', os: 'dos', as: 'das' })[typeof POTENCIAS !== 'undefined' ? POTENCIAS.find(p => p.id === pid)?.artigo : ''] || 'de';
const corDe = (id, tom = 'cor') => CORES_GUIA[id]?.[tom] ?? CORES_GUIA[id]?.cor;
const nomeEquipe = pid => (CORES_GUIA[pid]?.nomeCor ? 'Equipe ' + CORES_GUIA[pid].nomeCor : '');      // "Equipe Verde"
const nomeCurto = pid => CORES_GUIA[pid]?.curto ?? (typeof POTENCIAS !== 'undefined' ? POTENCIAS.find(p => p.id === pid)?.nome : '') ?? '';
// SVG da forma da equipe: na cor dela (selo) ou branca (sobre a cor), sempre com traço índigo
function formaDe(pid, { branca = false, classe = '' } = {}) {
  const q = CORES_GUIA[pid];
  if (!q?.forma) return '';
  return `<svg class="forma ${classe}" viewBox="-6 -6 112 112" aria-hidden="true" focusable="false"><path d="${FORMAS[q.forma]}" fill="${branca ? '#FFFFFF' : q.cor}" stroke="#1A1433" stroke-width="9" stroke-linejoin="round" paint-order="stroke"/></svg>`;
}
// O conteúdo antigo ainda traz cores velhas: a interface usa as do guia (pendência registrada para Conteúdo/Motor)
if (typeof POTENCIAS !== 'undefined') POTENCIAS.forEach(p => { if (CORES_GUIA[p.id]) p.cor = CORES_GUIA[p.id].cor; });
if (typeof CATEGORIAS !== 'undefined') Object.entries(CATEGORIAS).forEach(([id, c]) => { if (CORES_GUIA[id]) c.cor = CORES_GUIA[id].cor; });

// Glifos de interface em SVG (nenhuma das fontes tem ✓ ✕ →): contorno índigo + miolo na cor do texto
const GLIFOS = (() => {
  const g = d => `<svg class="glifo" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="g-c" d="${d}"/><path class="g-m" d="${d}"/></svg>`;
  return { ok: g('M5 12.8l4.4 4.4L19 7.4'), nao: g('M6.8 6.8l10.4 10.4M17.2 6.8L6.8 17.2'), fechar: g('M7 7l10 10M17 7L7 17'),
    seta: g('M5 12h13M13 6.6l5.4 5.4-5.4 5.4'), voltar: g('M19 12H6M11 6.6L5.6 12l5.4 5.4'), mais: g('M12 5.5v13M5.5 12h13'), menos: g('M5.5 12h13') };
})();

// ---------- Esperas canceláveis ----------
const CANCELADA = Symbol('partida encerrada');
let partidaUI = 0;
const novaPartidaUI = () => ++partidaUI;
const vivo = id => { if (id !== partidaUI) throw CANCELADA; };
const espera = ms => { const id = partidaUI; return new Promise(r => setTimeout(r, RAPIDO ? ms / 10 : ms)).then(() => vivo(id)); };
const fim = anim => { const id = partidaUI; return new Promise(ok => (anim?.then ? anim.then(() => ok()) : ok())).then(() => vivo(id)); };
const aguardar = promessa => { const id = partidaUI; return promessa.then(v => (vivo(id), v)); };

// ---------- Preferências (localStorage com prefixo gi:) ----------
function lerPref(k, padrao) { try { const v = localStorage.getItem('gi:' + k); return v === null ? padrao : JSON.parse(v); } catch { return padrao; } }
function gravarPref(k, v) { try { localStorage.setItem('gi:' + k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } }

// ---------- Leitor de tela, avisos e chuva de tijolinhos ----------
function anunciar(texto) { const a = $('#anuncio'); if (!a) return; a.textContent = ''; setTimeout(() => (a.textContent = texto), 60); }

// Aviso curto (toast) acima da doca: aviso(texto, ms?, { tipo: 'bom'|'ruim'|'neutro', icone: html }) ou aviso(texto, { tipo, icone, ms }).
// Fica 1,2 s + 1 s a cada 15 letras; no máximo 2 empilhados.
function aviso(texto, ms, opcoes = {}) {
  if (ms && typeof ms === 'object') [opcoes, ms] = [ms, ms.ms];
  const caixa = $('#aviso');
  if (!caixa) return null;
  const { tipo = 'neutro', icone = '' } = opcoes;
  ms ??= 1200 + String(texto).length / 15 * 1000;
  const el = document.createElement('div');
  el.className = `aviso peca flutua ${tipo}`;
  el.innerHTML = `${icone}<span>${esc(texto)}</span>`;
  caixa.hidden = false;
  caixa.append(el);
  while (caixa.children.length > 2) caixa.firstElementChild.remove();
  efeitoSom('pop');
  if (RM) gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .18 });
  else gsap.fromTo(el, { y: 3 * uPx(), opacity: 0, scale: .8 }, { y: 0, opacity: 1, scale: 1, duration: .3, ease: 'back.out(2)' });
  gsap.to(el, { opacity: 0, y: RM ? 0 : -uPx(), scale: RM ? 1 : .96, duration: .25, ease: 'power2.in', delay: ms / 1000 + .3,
    onComplete: () => { el.remove(); if (!caixa.children.length) caixa.hidden = true; } });
  return el;
}

// Chuva de tijolinhos (a comemoração do jogo; substitui o confete de papel). Nada com movimento reduzido.
const CORES_CONFETE = ['#27B263', '#0A32B4', '#D0180E', '#9645EE', '#FF9C0A', '#F2248F', '#FFD21F'];
let formaTijolo = null;
function confete(opcoes = {}) {
  if (RM || typeof confetti !== 'function') return;
  formaTijolo ??= confetti.shapeFromPath ? confetti.shapeFromPath({ path: 'M0 5.5h16v9.5H0zM2.2 5.5V3h4.2v2.5zM9.6 5.5V3h4.2v2.5z' }) : 'square';
  efeitoSom('chuva');
  confetti({ particleCount: 60, spread: 75, startVelocity: 40, gravity: 1.15, ticks: 240, scalar: 1.5, flat: false, shapes: [formaTijolo],
    colors: CORES_CONFETE, disableForReducedMotion: true, zIndex: 60, ...opcoes });
}
function confeteDe(el, opcoes) {
  const b = el.getBoundingClientRect();
  confete({ origin: { x: (b.x + b.width / 2) / innerWidth, y: (b.y + b.height / 2) / innerHeight }, ...opcoes });
}

// Número que salta de um valor para outro (indicadores, placar). Devolve o tween. Duração pelo tamanho da mudança (§9.1).
function numeroQueSalta(el, de, para, { casas = 0, duracao, prefixo = '', sufixo = '', som = true } = {}) {
  const texto = v => prefixo + fmt(v, casas) + sufixo;
  if (RM) { el.textContent = texto(para); return gsap.set(el, { scale: 1 }); }
  const o = { v: de };
  let ultimo = 0, moedas = 0;
  el.textContent = texto(de);
  return gsap.to(o, { v: para, duration: duracao ?? Math.min(1.2, .4 + .12 * Math.log2(1 + Math.abs(para - de))), ease: 'power2.out',
    onUpdate: () => {
      el.textContent = texto(o.v);
      const t = performance.now();
      if (som && moedas < 12 && t - ultimo >= 70) { ultimo = t; moedas++; efeitoSom('moeda'); }
    },
    onComplete: () => gsap.fromTo(el, { scale: 1 }, { scale: 1.25, duration: .09, yoyo: true, repeat: 1, ease: 'power2.out' }) });
}

// Reduz a fonte até caber na largura, sem quebrar palavra no meio; nunca abaixo de --fs-min
function caberNaLargura(el, minimo = pxDe('--fs-min')) {
  if (!el) return;
  el.style.fontSize = el.style.overflowWrap = '';
  const vaza = () => el.scrollWidth > el.clientWidth + 1;
  for (let px = parseFloat(getComputedStyle(el).fontSize); vaza() && px > minimo;) el.style.fontSize = (px = Math.max(minimo, px * .92)) + 'px';
  if (vaza()) el.style.overflowWrap = 'anywhere';
}

// ---------- Telas ----------
let telaAtual = null;
function mostrarTela(nome) {
  $$('#telas > .tela').forEach(t => (t.hidden = t.id !== 'tela-' + nome));
  telaAtual = nome;
  const t = $('#tela-' + nome);
  if (t && !RM) gsap.fromTo(t, { opacity: 0 }, { opacity: 1, duration: .3 });
  document.body.dataset.tela = nome;
}

// ---------- Painéis sobre o jogo (#camada): inert no resto, foco, Esc, entrada e saída (§5.5) ----------
// abrirPainel(el, { esc, veu = true, foco, som = 'whoosh' }) → Promise (fim da entrada).
//   esc: true = Esc fecha; função = Esc fecha e chama a função; ausente = Esc não fecha.
// fecharPainel(el) → Promise: anima a saída, devolve o foco e tira o painel (e o véu) do DOM; abrir de novo reaproveita o el.
const pilhaPaineis = [];
const LIVRES = ['camada', 'splash', 'aviso', 'anuncio'];   // o que nunca fica inerte sob um painel
const FOCAVEIS = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function abrirPainel(el, { esc: aoEsc = null, veu = true, foco = null, som = 'whoosh' } = {}) {
  const camada = $('#camada');
  if (!camada.contains(el)) camada.append(el);
  const topo = pilhaPaineis.at(-1);
  const inertes = (topo ? [topo.el, topo.veu] : [...document.body.children].filter(x => !LIVRES.includes(x.id) && !/^(SCRIPT|NOSCRIPT)$/.test(x.tagName)))
    .filter(x => x && !x.inert);
  inertes.forEach(x => (x.inert = true));
  let v = null;
  if (veu) { v = document.createElement('div'); v.className = 'veu'; v.setAttribute('aria-hidden', 'true'); el.before(v); }
  if (!el.hasAttribute('role')) el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  if (!el.hasAttribute('tabindex')) el.tabIndex = -1;
  el.hidden = el.inert = false;
  el.style.pointerEvents = '';
  pilhaPaineis.push({ el, veu: v, inertes, aoEsc, antes: document.activeElement });
  efeitoSom(som);
  abafarTrilha();
  gsap.killTweensOf(el);
  const tl = gsap.timeline();
  if (v) tl.fromTo(v, { opacity: 0 }, { opacity: 1, duration: RM ? .18 : .25 }, 0);
  if (RM) tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .18 }, 0);
  else tl.fromTo(el, { opacity: 0, y: 6 * uPx(), scale: .94 }, { opacity: 1, y: 0, scale: 1, duration: .42, ease: 'back.out(1.4)' }, 0);
  const alvo = (typeof foco === 'string' ? el.querySelector(foco) : foco) || el.querySelector('[autofocus]') ||
    el.querySelector(`:is(.tela, .painel-rodape) :is(${FOCAVEIS})`) || el.querySelector(FOCAVEIS) || el;
  alvo.focus({ preventScroll: true });
  return fim(tl);
}
async function fecharPainel(el) {
  const i = pilhaPaineis.findIndex(p => p.el === el);
  if (i < 0) { el.remove(); return; }
  const [p] = pilhaPaineis.splice(i, 1);
  // já na saída o painel e o véu deixam de receber clique (a tela de baixo volta na hora)
  el.inert = true;
  [el, p.veu].forEach(x => x && (x.style.pointerEvents = 'none'));
  p.inertes.forEach(x => (x.inert = false));
  abafarTrilha();
  if (p.antes?.isConnected && !p.antes.closest('[inert]')) p.antes.focus({ preventScroll: true });
  gsap.killTweensOf(el);
  const tl = gsap.timeline();
  if (RM) tl.to(el, { opacity: 0, duration: .15 });
  else tl.to(el, { opacity: 0, y: 3 * uPx(), scale: .96, duration: .22, ease: 'power2.in' });
  if (p.veu) tl.to(p.veu, { opacity: 0, duration: .18 }, 0);
  try { await fim(tl); } finally { el.remove(); p.veu?.remove(); }
}
// Fecha tudo na hora (sair da partida)
function fecharPaineis() {
  while (pilhaPaineis.length) { const p = pilhaPaineis.pop(); p.inertes.forEach(x => (x.inert = false)); p.el.remove(); p.veu?.remove(); }
  abafarTrilha();
}
document.addEventListener('keydown', ev => {
  const topo = pilhaPaineis.at(-1);
  if (ev.key !== 'Escape' || !topo?.aoEsc) return;
  ev.preventDefault();
  fecharPainel(topo.el).catch(() => {});
  if (typeof topo.aoEsc === 'function') topo.aoEsc();
});

// Abas (role="tablist" com botões role="tab" e aria-controls): clique e setas trocam. Devolve escolher(aba).
function ativarAbas(lista, aoTrocar) {
  const abas = [...lista.querySelectorAll('[role="tab"]')];
  let raiz = lista;
  while (raiz.parentElement) raiz = raiz.parentElement;   // funciona antes de o painel entrar na página
  const escolher = (aba, focar = false) => {
    abas.forEach(a => {
      const sim = a === aba;
      a.setAttribute('aria-selected', sim);
      a.tabIndex = sim ? 0 : -1;
      const painel = raiz.querySelector('#' + CSS.escape(a.getAttribute('aria-controls') || '-'));
      if (painel) painel.hidden = !sim;
    });
    if (focar) aba.focus();
    aoTrocar?.(aba, abas.indexOf(aba));
  };
  lista.addEventListener('click', ev => { const a = ev.target.closest('[role="tab"]'); if (a && abas.includes(a)) { efeitoSom('clique'); escolher(a); } });
  lista.addEventListener('keydown', ev => {
    const i = abas.indexOf(document.activeElement);
    if (i < 0) return;
    const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
    const alvo = passo ? abas[(i + passo + abas.length) % abas.length] : ev.key === 'Home' ? abas[0] : ev.key === 'End' ? abas.at(-1) : null;
    if (alvo) { ev.preventDefault(); escolher(alvo, true); }
  });
  escolher(abas.find(a => a.getAttribute('aria-selected') === 'true') || abas[0]);
  return escolher;
}

// Controle deslizante: mantém --v (parte amarela) igual ao valor
function atualizarDeslizante(el) {
  const min = +el.min || 0, max = el.max === '' ? 100 : +el.max;
  el.style.setProperty('--v', ((+el.value - min) / (max - min || 1)) * 100 + '%');
}
document.addEventListener('input', ev => { if (ev.target.classList?.contains('deslizante')) atualizarDeslizante(ev.target); });

// ---------- Carimbo, tremida e poeira (§9.1, §9.2) ----------
// carimbar(el): 100 ms parado + queda com giro (escala 2,4 → 1, −25° → −8°), martelo, tremida e 6 plaquinhas de poeira
function carimbar(el, { som = 'martelo', tremida = .4 } = {}) {
  el.hidden = false;
  if (RM) { efeitoSom(som); return fim(gsap.fromTo(el, { opacity: 0, scale: 1, rotation: -8 }, { opacity: 1, duration: .15 })); }
  const tl = gsap.timeline();
  tl.fromTo(el, { scale: 2.4, rotation: -25, opacity: 0 }, { scale: 1, rotation: -8, opacity: 1, duration: .28, ease: 'back.out(2.2)', delay: .1 })
    .add(() => { efeitoSom(som); tremer(tremida); poeira(el); }, .2);
  return fim(tl);
}
function poeira(el, n = 6) {
  if (RM) return;
  const b = el.getBoundingClientRect(), u = uPx();
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'), lado = (i + .5) / n - .5;
    p.className = 'poeira';
    p.style.left = b.left + b.width * (i + .5) / n + 'px';
    p.style.top = b.bottom - u + 'px';
    document.body.append(p);
    gsap.timeline({ onComplete: () => p.remove() })
      .to(p, { x: lado * 16 * u, y: -(2 + Math.random() * 2.5) * u, rotation: lado * 220, duration: .32, ease: 'power2.out' })
      .to(p, { y: `+=${4 * u}`, opacity: 0, duration: .3, ease: 'power2.in' });
  }
}
// Tremida por "trauma" (+.35 crise, +.6 colapso, +.4 veto/martelo; decai 1,6/s; ≤ 10 px e 0,6°). RM: vinheta vermelha de 150 ms.
let trauma = 0, tremendo = false;
function tremer(forca = .35) {
  if (RM) {
    const v = document.createElement('div');
    v.id = 'vinheta';
    document.body.append(v);
    gsap.fromTo(v, { opacity: 0 }, { opacity: 1, duration: .075, yoyo: true, repeat: 1, onComplete: () => v.remove() });
    return;
  }
  const alvos = ['#telas', '#camada'].map(s => $(s)).filter(Boolean);
  if (!alvos.length) return;
  trauma = Math.min(1, trauma + forca);
  if (tremendo) return;
  tremendo = true;
  const passo = () => {
    trauma = Math.max(0, trauma - 1.6 / 60 * gsap.ticker.deltaRatio());
    const i = trauma * trauma, t = performance.now() / 1000;
    gsap.set(alvos, { x: 10 * i * Math.sin(t * 47.3), y: 10 * i * Math.cos(t * 39.1), rotation: .6 * i * Math.sin(t * 31.7) });
    if (!trauma) { gsap.ticker.remove(passo); tremendo = false; gsap.set(alvos, { clearProps: 'transform' }); }
  };
  gsap.ticker.add(passo);
}

// ---------- Faixa de anúncio: um tijolo comprido que entra da esquerda; toque, Espaço, Enter ou PageDown pula ----------
// cor: id do guia ('amarelo', 'brasil', 'natureza'…) ou cor CSS. tempo (ms) = quanto fica; padrão 0,8 s + 1 s a cada 15 letras.
let splashTl = null;
async function splash({ pre = '', titulo, sub = '', cor = 'amarelo', icone = '', tempo, escuro = false, raios = false, som = 'vez' }) {
  const el = $('#splash'), faixa = el.querySelector('.splash-faixa');
  $('#splash-pre').textContent = pre;
  $('#splash-titulo').textContent = titulo;
  $('#splash-sub').textContent = sub;
  $('#splash-icone').innerHTML = icone;
  el.style.setProperty('--cor', corDe(cor) ?? cor);
  if (corDe(cor, 'lado')) el.style.setProperty('--cor-lado', corDe(cor, 'lado')); else el.style.removeProperty('--cor-lado');
  el.classList.toggle('escuro', escuro);
  el.classList.toggle('raios', raios);
  el.hidden = false;
  caberNaLargura($('#splash-titulo'));
  const fala = [pre, titulo, sub].filter(Boolean).join('. ');
  anunciar(fala);
  efeitoSom(som);
  const fica = (tempo ?? 800 + fala.length / 15 * 1000) / 1000;
  const textos = ['#splash-pre', '#splash-titulo', '#splash-sub'];
  const tl = (splashTl = gsap.timeline());
  if (RM) {
    tl.set(faixa, { xPercent: 0, skewX: 0, rotation: -3 }).set([...textos, '#splash-icone'], { x: 0, opacity: 1, scale: 1, rotation: 0 })
      .fromTo(el, { opacity: 0 }, { opacity: 1, duration: .18 }).to(el, { opacity: 0, duration: .18 }, `+=${fica}`);
  } else {
    tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .15 })
      .fromTo(faixa, { xPercent: -130, skewX: -14, rotation: -3 }, { xPercent: 0, skewX: 0, rotation: -3, duration: .42, ease: 'back.out(1.5)' }, 0)
      .fromTo('#splash-icone', { scale: 0, rotation: -35 }, { scale: 1, rotation: 0, duration: .55, ease: 'elastic.out(1, .5)' }, .12)
      .fromTo(textos, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: .32, stagger: .06, ease: 'power3.out' }, .16)
      .to(faixa, { xPercent: 130, skewX: 14, duration: .3, ease: 'power2.in' }, `+=${fica}`)
      .to(el, { opacity: 0, duration: .15 }, '-=.12');
  }
  try { await fim(tl); } finally { if (splashTl === tl) splashTl = null; el.hidden = true; }
}
const pularSplash = () => splashTl?.progress(1);

// ---------- Carta (pergunta, evento, desafio) — legado do jogo anterior: o jogo não usa carta que vira ----------
let aoContinuar = null;
function prepararCarta({ cor, icone = '', tema, tipo, escura = false }) {
  const dlg = $('#dlg-carta');
  dlg.style.setProperty('--tema', cor);
  dlg.classList.toggle('carta-escura', escura);
  $('#carta-icone').innerHTML = icone;
  $('#carta-tema').textContent = tema;
  $('#carta-tipo').textContent = tipo;
  $('#tempo-barra').hidden = true;
  return $('#carta-corpo');
}
async function abrirCarta() {
  const dlg = $('#dlg-carta'), carta = $('#carta');
  carta.querySelector('.carta-frente').inert = true;
  gsap.set(carta, { rotationY: 0, x: 0 });
  if (!dlg.open) dlg.showModal();
  Som.efeito('carta');
  await fim(gsap.fromTo(carta, { y: 160, scale: .5, rotation: -12, opacity: 0 }, { y: 0, scale: 1, rotation: 0, opacity: 1, duration: .45, ease: 'back.out(1.4)' }));
  await espera(120);
  Som.efeito('virar');
  await fim(gsap.to(carta, { rotationY: 180, duration: .5, ease: 'power2.inOut' }));
  carta.querySelector('.carta-frente').inert = false;
  gsap.from('#carta-corpo > *', { y: 18, opacity: 0, duration: .3, stagger: .05, ease: 'power2.out' });
  (carta.querySelector('.opcao, .btn') || carta).focus({ preventScroll: true });
}
async function fecharCarta() {
  pararTempo();
  const dlg = $('#dlg-carta');
  if (!dlg.open) return;
  await fim(gsap.to('#carta', { y: -90, scale: .85, opacity: 0, duration: .28, ease: 'power2.in' }));
  dlg.close();
  dlg.classList.remove('carta-escura');
}

// Cronômetro (0 = sem limite): usa #tempo-barra com <i> e #tempo-num, se existirem. Corre em tempo real também com RM.
let tempoTween = null, tempoTique = null;
function iniciarTempo(segundos, aoAcabar) {
  pararTempo();
  if (!segundos) return;
  const barra = $('#tempo-barra'), num = $('#tempo-num');
  if (!barra || !num) return;
  barra.hidden = false;
  barra.classList.remove('acabando');
  let resta = segundos;
  num.textContent = resta;
  tempoTween = gsap.fromTo(barra.querySelector('i'), { scaleX: 1 }, { scaleX: 0, duration: segundos, ease: 'none', transformOrigin: '0 50%', onComplete: aoAcabar });
  tempoTique = setInterval(() => {
    if (tempoTween?.paused()) return;
    resta = Math.max(0, resta - 1);
    num.textContent = resta;
    if (resta <= 5 && resta > 0) { barra.classList.add('acabando'); efeitoSom('tique', { semitons: 5 - resta }); if (!RM) gsap.fromTo(num, { scale: 1.08 }, { scale: 1, duration: .4, ease: 'power2.out' }); }
  }, 1000);
}
function pararTempo() { tempoTween?.kill(); tempoTween = null; clearInterval(tempoTique); }
const pausarTempo = pausar => tempoTween?.paused(pausar);

// Botão "Continuar" (tijolo amarelo) no fim de um bloco; resolve quando clicado
function esperarContinuar(onde, rotulo = 'Continuar') {
  onde.insertAdjacentHTML('beforeend', `<button class="btn btn-principal peca pinos btn-continuar" data-teste="continuar-painel">${esc(rotulo)} ${GLIFOS.seta}</button>`);
  const btn = onde.lastElementChild;
  if (!RM) gsap.from(btn, { scale: .6, opacity: 0, duration: .35, ease: 'back.out(2)' });
  btn.focus({ preventScroll: true });
  return aguardar(new Promise(r => {
    aoContinuar = r;
    btn.addEventListener('click', () => { efeitoSom('clique'); r(); }, { once: true });
  })).finally(() => (aoContinuar = null));
}

// Escolha entre botões: opcoes = [{ valor, rotulo, classe?, teste?, desativado? }] → Promise<valor>
function escolha(onde, opcoes, classe = 'escolhas') {
  onde.insertAdjacentHTML('beforeend', `<div class="${classe}">${opcoes.map((o, i) =>
    `<button class="btn peca ${o.classe || 'btn-neutro'}" data-i="${i}"${o.teste ? ` data-teste="${esc(o.teste)}"` : ''} ${o.desativado ? 'disabled' : ''}>${o.rotulo}</button>`).join('')}</div>`);
  const caixa = onde.lastElementChild;
  if (!RM) gsap.from(caixa.children, { y: 14, opacity: 0, duration: .28, stagger: .05, ease: 'back.out(2)' });
  return aguardar(new Promise(r => caixa.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-i]');
    if (!b || b.disabled) return;
    efeitoSom('clique');
    caixa.querySelectorAll('button').forEach(x => (x.disabled = true));
    r(opcoes[+b.dataset.i].valor);
  })));
}

// ---------- Diálogos simples: [data-abrir="id"] abre, [data-fechar] fecha ----------
document.addEventListener('click', ev => {
  const abrir = ev.target.closest('[data-abrir]');
  if (abrir) { const d = document.getElementById(abrir.dataset.abrir); if (d && !d.open) { d.showModal(); efeitoSom('clique'); } }
  const fechar = ev.target.closest('[data-fechar]');
  if (fechar) fechar.closest('dialog')?.close();
});
// Um toque na faixa de anúncio, Espaço, Enter ou PageDown pulam a faixa (sem acionar o botão em foco)
document.addEventListener('pointerdown', ev => { if (splashTl && ev.target.closest('#splash')) pularSplash(); });
let teclaPulou = false;
document.addEventListener('keydown', ev => {
  if (!splashTl || ![' ', 'Enter', 'PageDown'].includes(ev.key)) return;
  ev.preventDefault(); ev.stopPropagation(); teclaPulou = true; pularSplash();
}, true);
document.addEventListener('keyup', ev => { if (teclaPulou) { ev.preventDefault(); ev.stopPropagation(); teclaPulou = false; } }, true);
