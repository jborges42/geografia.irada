'use strict';
/* Geografia Irada — ONU (frente ONU: js/onu.js + css/onu.css; guia de arte §5.12, §4.5, §9.1).
   Sessões no estilo "reunião de emergência": sirene e faixa, sala 3D com os bonecos (Cenas3D.salaONU), tablet de votação
   com as delegações em linhas, voto secreto de cada equipe (passa o computador), revelação voto a voto com carimbos e
   o que muda no mundo, com o porquê. Também a Cúpula do Clima, o pedido de ajuda, a reunião do modo infiltrado e a negociação.
   Contrato (docs/ARQUITETURA.md):
     proporResolucao(e, pid) → { id, alvo } | null · votacao(e, { id, alvo, proponente }) → resultado de Simulacao.votacao
     cop(e) → resolverCop · doacao(e, evento, local) → resolverDoacao · reuniaoEmergencia(e, pid) → { acusado, acertou, votos }
     negociar(e, pid) → { ok, aceita, para, oferta, pedido, motivo } | null (null = desistiu antes de propor)
   data-teste: voto-<sim|nao|abst|veto>, cop-<0|1|2>, doar-<n>, confirmar, cancelar, continuar-painel, acusar (com data-id). */

const ONU = (() => {
  const PIDS = ['brasil', 'eua', 'china', 'ue', 'india', 'russia'];
  const RECURSOS = [{ id: 'alimentos', ico: '🌾', nome: 'Alimentos' }, { id: 'energia', ico: '⚡', nome: 'Energia' },
    { id: 'minerais', ico: '💎', nome: 'Minerais' }, { id: 'tecnologia', ico: '💻', nome: 'Tecnologia' }];
  const ARTE_RES = { missao_paz: 'escudo', sancoes_onu: 'cadeado', acordo_climatico: 'termometro', fundo_humanitario: 'caixa-ajuda',
    tratado_desarmamento: 'pomba', fundo_vacinas: 'hospital' };
  const CONTINENTES = { an: 'América do Norte', as: 'América do Sul', eu: 'Europa', af: 'África', ai: 'Ásia', oc: 'Oceania', po: 'Polos' };
  const VOTO = {
    sim: { palavra: 'Sim', selo: 'SIM', classe: 'verde', botao: 'btn-confirmar', tecla: 'S', glifo: () => GLIFOS.ok },
    nao: { palavra: 'Não', selo: 'NÃO', classe: 'vermelho', botao: 'btn-perigo', tecla: 'N', glifo: () => GLIFOS.nao },
    abst: { palavra: 'Abster', selo: 'ABSTENÇÃO', classe: 'cinza', botao: 'btn-neutro cinza', tecla: 'A', glifo: () => GLIFOS.menos },
    veto: { palavra: 'Vetar!', selo: 'VETO', classe: 'vetada', botao: 'onu-btn-veto', tecla: 'V', glifo: () => ICO('✋') },
  };

  // ============================== PEÇAS COMUNS ==============================
  // Ícone Fluent 3D; se o pacote não tiver o ícone, nada (nunca o emoji do sistema)
  const ICO = (emoji, px = 64) => { const h = typeof imgIcone === 'function' ? imgIcone(emoji, px) : ''; return h.startsWith('<img') ? h : ''; };
  const ART = (nome, classe = '') => (typeof arte === 'function' ? arte(nome, { classe }) : '');
  const criar = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const temSom = () => typeof Som !== 'undefined';
  const musica = h => { try { if (temSom() && h !== undefined) Som.musica(h); } catch { /* sem som */ } };
  const humorAtual = () => (temSom() ? Som.humor : null);
  const abaixarTrilha = v => { try { if (temSom()) Som.abaixarTrilha?.(v); } catch { /* sem som */ } };
  const mapa = (fn, ...a) => { try { if (typeof Mapa3D !== 'undefined' && typeof Mapa3D[fn] === 'function') return Mapa3D[fn](...a); } catch { /* sem mapa */ } return undefined; };
  const tem3D = () => typeof Cenas3D !== 'undefined' && typeof THREE !== 'undefined' && typeof Bonecos !== 'undefined';
  const uSom = (nome, o) => { try { if (temSom()) Som.efeito(nome, o); } catch { /* sem som */ } };

  // Nomes com artigo e concordância ("a China vetou", "os Estados Unidos vetaram")
  const dado = id => (typeof POTENCIAS !== 'undefined' && POTENCIAS.find(p => p.id === id)) || (typeof TERRITORIOS !== 'undefined' && TERRITORIOS.find(t => t.id === id)) || null;
  const nome = id => (id === 'reino_unido' ? 'Reino Unido' : dado(id)?.nome || id);
  const artigo = id => (id === 'reino_unido' ? 'o' : dado(id)?.artigo || '');
  const plural = id => /s$/.test(artigo(id));
  const verbo = (id, sing, plur) => (plural(id) ? plur : sing);
  const PREP = { '': { o: 'o', a: 'a', os: 'os', as: 'as' }, de: { o: 'do', a: 'da', os: 'dos', as: 'das' }, por: { o: 'pelo', a: 'pela', os: 'pelos', as: 'pelas' },
    em: { o: 'no', a: 'na', os: 'nos', as: 'nas' } };
  const com = (id, prep = '') => { const a = artigo(id); return a ? `${PREP[prep][a]} ${nome(id)}` : `${prep === 'de' ? 'de ' : prep === 'por' ? 'por ' : prep === 'em' ? 'em ' : ''}${nome(id)}`; };
  const Com = (id, prep = '') => { const t = com(id, prep); return t.charAt(0).toUpperCase() + t.slice(1); };
  const permanente = pid => pid === 'reino_unido' || !!(typeof POTENCIAS !== 'undefined' && POTENCIAS.find(p => p.id === pid)?.permanente);
  const pidsDe = e => PIDS.filter(p => e.potencias[p]);
  const humano = (e, pid) => !!e.potencias[pid]?.humano;
  const quemJoga = (e, pid) => (pid === 'reino_unido' ? 'Território · computador' : humano(e, pid) ? nomeEquipe(pid) : 'Computador');

  // Avatares: os da partida (Jogo.avatarDe) ou um sorteio fixo de reserva (vitrine, testes)
  let reserva = null;
  function avatarDe(e, pid) {
    let a = null;
    try { a = typeof Jogo !== 'undefined' && Jogo.avatarDe ? Jogo.avatarDe(pid) : null; } catch { a = null; }
    if (!a && typeof Bonecos !== 'undefined') { reserva ||= Bonecos.avataresIniciais(PIDS, 7); a = reserva.find(x => x.pid === pid); }
    return { ...(a || {}), pid, humano: humano(e, pid) };
  }
  // Retrato do boneco (Cenas3D.retrato): o <img> entra vazio e é preenchido depois (preencherRetratos)
  function retrato(e, pid, { classe = '', expressao = 'feliz', tamanho = 112, enquadramento = '' } = {}) {
    if (pid === 'reino_unido') return `<span class="retrato ${classe} onu-retrato-territorio"><span class="onu-retrato-ico">${ICO('🏛')}</span></span>`;
    const cpu = humano(e, pid) ? '' : `<span class="cpu">${ICO('💻')}</span>`;
    return `<span class="retrato ${classe}" data-equipe="${pid}"><img alt="" hidden data-retrato="${pid}" data-exp="${expressao}" data-tam="${tamanho}"${enquadramento ? ` data-enq="${enquadramento}"` : ''}>${formaDe(pid)}${cpu}</span>`;
  }
  async function preencherRetratos(raiz, e) {
    if (!tem3D()) return;
    for (const img of raiz.querySelectorAll('img[data-retrato]')) {
      try {
        img.src = await Cenas3D.retrato(avatarDe(e, img.dataset.retrato), { expressao: img.dataset.exp, tamanho: +img.dataset.tam, enquadramento: img.dataset.enq || undefined });
        img.hidden = false;
      } catch { /* sem WebGL: fica a forma da equipe */ }
    }
  }
  const seloForma = pid => (CORES_GUIA[pid] ? `<span class="pilula onu-equipe" data-equipe="${pid}">${formaDe(pid, { branca: true })} ${esc(nomeEquipe(pid))}</span>` : '');

  // Telas cheias (sessão, voto secreto): usam abrirPainel/fecharPainel de ui.js, com dissolve no lugar do "pulo" do painel
  function abrirTela(el, foco) {
    abrirPainel(el, { veu: false, som: null, foco }).catch(() => {});
    gsap.killTweensOf(el);
    gsap.set(el, { clearProps: 'transform' });
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: RM ? .18 : .3, ease: 'power2.out' });
  }
  async function fecharTela(el) {
    if (!el?.isConnected) return;
    await fim(gsap.to(el, { opacity: 0, duration: RM ? .15 : .25, ease: 'power2.in' }));
    await fecharPainel(el);
  }
  // Espera um clique num botão com data-acao (ou data-teste) dentro de "raiz"; teclas opcionais: { 'S': valor }
  function esperarBotao(raiz, { teclas = null, filtro = '[data-acao]' } = {}) {
    let parar = () => {};
    const p = aguardar(new Promise(ok => {
      const fimEscuta = v => { raiz.removeEventListener('click', clique); document.removeEventListener('keydown', tecla, true); ok(v); };
      parar = () => fimEscuta(undefined);
      const clique = ev => {
        const b = ev.target.closest(filtro);
        if (!b || !raiz.contains(b) || b.disabled || b.getAttribute('aria-disabled') === 'true') return;
        efeitoSom('clique');
        fimEscuta(b.dataset.acao ?? b.dataset.teste);
      };
      const tecla = ev => {
        if (!teclas || ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey || !raiz.isConnected || raiz.closest('[inert]')) return;
        const v = teclas[ev.key.toUpperCase()];
        if (v === undefined) return;
        ev.preventDefault(); ev.stopPropagation();
        fimEscuta(v);
      };
      raiz.addEventListener('click', clique);
      document.addEventListener('keydown', tecla, true);
    }));
    p.parar = () => parar();   // para de escutar (o cronômetro acabou antes do clique)
    return p;
  }
  // Texto que aparece letra a letra (38 ms; pausa de 0,7 s no ponto); o leitor de tela recebe a frase inteira de uma vez
  async function datilografar(el, texto) {
    el.innerHTML = `<span class="so-leitor">${esc(texto)}</span><span class="onu-dat" aria-hidden="true"></span>`;
    const alvo = el.lastElementChild;
    anunciar(texto);
    if (RM) { alvo.textContent = texto; return; }
    let pulou = false;
    const pular = () => (pulou = true);
    document.addEventListener('pointerdown', pular, { once: true });
    try {
      for (let i = 0; i < texto.length && !pulou; i++) {
        alvo.textContent = texto.slice(0, i + 1);
        if (i % 3 === 0 && texto[i] !== ' ') uSom('tique');
        await espera(/[.!?:]/.test(texto[i]) && i < texto.length - 1 ? 700 : 38);
      }
    } finally { document.removeEventListener('pointerdown', pular); }
    alvo.textContent = texto;
  }
  // Pop de número (contador que muda)
  const popNumero = el => { if (!RM) gsap.fromTo(el, { scale: 1.45 }, { scale: 1, duration: .32, ease: 'back.out(3)' }); };

  // ============================== CONSEQUÊNCIAS (mudancas do motor com o porquê) ==============================
  const ROTULOS = {
    cooperacao: ['Cooperação', '🤝'], tensao: ['Tensão mundial', '⏰'], comercio: ['Comércio', '🚢'], temperatura: ['Temperatura', '🌡'],
    deslocados: ['Deslocados', '🧳'], energia: ['Preço da energia', '🛢'], transferencia: ['Tecnologia limpa', '💡'],
    economia: ['Economia', '💰'], bemEstar: ['Bem-estar', '❤'], ambiente: ['Ambiente', '🌳'], seguranca: ['Segurança', '🛡'], apoio: ['Apoio popular', '🗳'],
    limpa: ['Energia limpa', '☀'], militar: ['Gastos militares', '🛡'], influencia: ['Influência', '🧱'], estabilidade: ['Estabilidade', '⚖'],
    conflito: ['Conflito', '⚠'], desenvolvimento: ['Desenvolvimento', '📈'], pressao: ['Pressão de fora', '⚠'], cp: ['Capital Político', '🧱'],
    'imune.pandemia': ['Proteção contra pandemias', '💉'], 'recursos.alimentos': ['Alimentos', '🌾'], 'recursos.energia': ['Energia', '⚡'],
    'recursos.minerais': ['Minerais', '💎'], 'recursos.tecnologia': ['Tecnologia', '💻'],
  };
  const BOM_SE_DESCE = new Set(['tensao', 'deslocados', 'temperatura', 'conflito', 'energia', 'militar', 'pressao']);
  const MOTIVOS = { veto: 'o veto desgasta a confiança', 'desgaste do veto': 'o veto desgasta a imagem', 'resolução rejeitada': 'resolução rejeitada',
    'contribuição para a missão': 'quem votou sim ajuda a pagar', 'COP fracassa': 'a cúpula fracassou', 'acordo histórico na COP': 'acordo histórico',
    'compromisso alto na COP': 'compromisso alto', 'compromisso médio na COP': 'compromisso médio', 'doação': 'doação' };
  const valorTxt = (v, x) => (v === 'temperatura' ? fmtGraus(x) : v === 'deslocados' ? fmtMilhoes(Math.round(x), true)
    : v === 'transferencia' ? fmt(Math.round(x * 100)) + '%' : fmt(Math.round(x * 10) / 10, Number.isInteger(Math.round(x * 10) / 10) ? 0 : 1));
  const deltaTxt = (v, d) => (v === 'temperatura' ? sinal(d, 2) + FINO + '°C' : v === 'deslocados' ? sinal(Math.round(d)) + FINO + 'mi'
    : v === 'transferencia' ? sinal(Math.round(d * 100)) + '%' : sinal(Math.round(d * 10) / 10, Number.isInteger(Math.round(d * 10) / 10) ? 0 : 1));
  const tipoDe = q => (q === 'global' ? 'global' : PIDS.includes(q) ? 'potencia' : 'territorio');
  function agrupar(mudancas) {
    const grupos = new Map();
    for (const m of mudancas || []) {
      if (m.v === 'parceiro') { grupos.set('parceria|' + m.quem, { parceria: true, texto: m.motivo || `${nome(m.quem)}: parceria mudou`, ordem: 3 }); continue; }
      if (!ROTULOS[m.v] || typeof m.antes !== 'number' || typeof m.depois !== 'number') continue;
      const d = Math.round((m.depois - m.antes) * 100) / 100;
      if (!d) continue;
      const tipo = tipoDe(m.quem), mot = MOTIVOS[m.motivo] ?? m.motivo ?? '';
      const chave = tipo === 'global' ? `g|${m.v}` : tipo === 'potencia' ? `p|${m.v}|${d}|${mot}` : `t|${m.v}|${Math.sign(d)}|${mot}`;
      const g = grupos.get(chave);
      if (!g) grupos.set(chave, { v: m.v, tipo, quem: [m.quem], antes: m.antes, depois: m.depois, d, soma: d, motivos: new Set(mot ? [mot] : []), ordem: { global: 0, potencia: 1, territorio: 2 }[tipo] });
      else { g.quem.push(m.quem); g.depois = m.depois; g.soma = Math.round((g.soma + d) * 100) / 100; if (mot) g.motivos.add(mot); }
    }
    return [...grupos.values()].sort((a, b) => a.ordem - b.ordem || Math.abs(b.soma || 0) - Math.abs(a.soma || 0));
  }
  function itemMudanca(g, ocultar, quemInfluencia = '') {
    if (g.parceria) return `<li class="onu-mudanca"><span class="soquete">${ICO('🤝')}</span><span class="onu-mud-txt"><b>${esc(g.texto)}</b></span></li>`;
    const [rot, ico] = ROTULOS[g.v], unico = g.quem.length === 1;
    const total = g.tipo === 'global' ? g.depois - g.antes : g.d;
    const bom = (total < 0) === BOM_SE_DESCE.has(g.v);
    let onde = g.tipo === 'global' ? 'No mundo' : unico ? nome(g.quem[0]) : g.tipo === 'potencia'
      ? (g.quem.length === pidsN ? 'Todas as potências' : listaNomes(g.quem.map(nomeCurtoPid)))
      : g.v === 'influencia' && quemInfluencia ? `${quemInfluencia}, em ${g.quem.length} territórios` : `${g.quem.length} territórios`;
    const motivo = [...g.motivos].find(m => m !== ocultar);
    const numero = g.tipo === 'global' || unico
      ? `<span class="onu-mud-num num">${esc(valorTxt(g.v, g.antes))}${GLIFOS.seta}${esc(valorTxt(g.v, g.depois))}</span>`
      : `<span class="onu-mud-num num onu-mud-cada">cada um</span>`;
    return `<li class="onu-mudanca"><span class="soquete">${ICO(ico)}</span>
      <span class="onu-mud-txt"><b>${esc(rot)}</b><small>${esc(onde)}${motivo ? ' · ' + esc(motivo) : ''}</small></span>
      ${numero}<span class="pilula ${bom ? 'ganho' : 'perda'} onu-mud-delta">${esc(deltaTxt(g.v, g.tipo === 'global' ? total : g.d))}</span></li>`;
  }
  const itemTexto = (icone, titulo, sub) => `<li class="onu-mudanca"><span class="soquete">${ICO(icone)}</span><span class="onu-mud-txt"><b>${esc(titulo)}</b><small>${esc(sub)}</small></span></li>`;
  let pidsN = 6;
  const nomeCurtoPid = id => (typeof nomeCurto === 'function' ? nomeCurto(id) : nome(id));
  function listaMudancas(mudancas, { max = 4, ocultar = '', quemInfluencia = '' } = {}) {
    const g = agrupar(mudancas);
    if (!g.length) return '<p class="onu-nada">Nenhum número mudou desta vez.</p>';
    const resto = g.length - max;
    return `<ul class="onu-mudancas">${g.slice(0, max).map(x => itemMudanca(x, ocultar, quemInfluencia)).join('')}</ul>` +
      (resto > 0 ? `<p class="onu-mais">+ ${resto} ${resto > 1 ? 'mudanças menores' : 'mudança menor'} (veja no Jornal Mundial)</p>` : '');
  }
  // Bloco final: frase datilografada + o que muda + por quê; devolve quando a turma clica em Continuar
  // "sai": o que continua à vista enquanto a frase é datilografada (a lista de votos) e dá lugar às consequências
  async function mostrarConsequencias(onde, rodape, { frase, mudancas, porque, extra = '', titulo = 'O que muda no mundo', ocultar = '', max = 4, porqueEm = null, sai = [], quemInfluencia = '' }) {
    const caixaPorque = porque ? `<div class="onu-porque">${ART('lampada', 'onu-porque-arte')}<p><b>Por quê?</b> ${porque}</p></div>` : '';
    onde.innerHTML = `<div class="onu-conseq">
      <p class="onu-frase"></p>
      <div class="onu-conseq-resto" hidden>
        ${extra}
        <h3 class="onu-sub">${ICO('🌍')} ${esc(titulo)}</h3>
        ${Array.isArray(mudancas) ? listaMudancas(mudancas, { ocultar, max, quemInfluencia }) : mudancas || ''}
        ${porqueEm ? '' : caixaPorque}</div></div>`;
    if (porqueEm && caixaPorque) porqueEm.insertAdjacentHTML('beforeend', caixaPorque);
    onde.scrollTop = 0;
    const resto = onde.querySelector('.onu-conseq-resto');
    const itens = [...resto.querySelectorAll(':scope > :not(.onu-mudancas), .onu-mudanca'), ...(porqueEm ? porqueEm.querySelectorAll('.onu-porque') : [])];
    gsap.set(itens, { opacity: 0 });
    await datilografar(onde.querySelector('.onu-frase'), frase);
    const saem = sai.filter(x => x?.isConnected);
    if (saem.length) {
      await fim(gsap.to(saem, { opacity: 0, duration: RM ? .15 : .2, ease: 'power2.in' }));
      const ficam = [...onde.parentElement.children].filter(x => !saem.includes(x)), antes = ficam.map(x => x.getBoundingClientRect().top);
      saem.forEach(x => x.remove());
      if (!RM) ficam.forEach((x, i) => { const d = antes[i] - x.getBoundingClientRect().top; if (d) gsap.from(x, { y: d, duration: .4, ease: 'power2.inOut' }); });   // FLIP: sobem juntos
    }
    resto.hidden = false;
    if (RM) gsap.to(itens, { opacity: 1, duration: .18 });
    else gsap.fromTo(itens, { opacity: 0, y: 1.4 * uPx() }, { opacity: 1, y: 0, duration: .28, stagger: .06, ease: 'power2.out' });
    rodape.innerHTML = '';
    await esperarContinuar(rodape, 'Continuar');
  }

  // ============================== CONVOCAÇÃO: sirene, linhas de velocidade e faixa branca (§5.12) ==============================
  async function convocacao({ cs = true, titulo = 'REUNIÃO NA ONU!', pre = '', sub = '', som, quem = null, e = null } = {}) {
    // quem convocou aparece atrás do púlpito, na cor da equipe (retrato de corpo inteiro do boneco)
    let boneco = '';
    if (quem && e && tem3D()) {
      try {
        const url = await Promise.race([Cenas3D.retrato(avatarDe(e, quem), { acao: 'apontar', expressao: 'determinado', tamanho: 360, enquadramento: 'corpo' }), new Promise(r => setTimeout(() => r(''), 700))]);
        if (url) boneco = `<img class="onu-conv-boneco" src="${url}" alt="">`;
      } catch { boneco = ''; }
    }
    const linhas = Array.from({ length: 14 }, (_, i) => {
      const topo = 4 + i * 6.8 + Math.random() * 3, h = (.3 + Math.random() * .9).toFixed(2), w = (15 + Math.random() * 45).toFixed(1), o = (.25 + Math.random() * .35).toFixed(2);
      return `<i style="top:${topo.toFixed(1)}%;--h:${h};--w:${w}vw;--o:${o}"></i>`;
    }).join('');
    // estrela de impacto (plástico amarelo com contorno índigo e miolo claro)
    const estrela = (n, R, r) => 'M' + Array.from({ length: n * 2 }, (_, i) => { const raio = i % 2 ? r : R, a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2; return `${(Math.cos(a) * raio).toFixed(1)} ${(Math.sin(a) * raio).toFixed(1)}`; }).join('L') + 'Z';
    const raios = `<path class="r1" d="${estrela(14, 96, 62)}"/><path class="r2" d="${estrela(14, 70, 48)}"/><circle class="r3" r="34"/>`;
    const el = criar(`<div class="onu-conv ${cs ? 'emergencia' : 'geral'}" role="presentation">
      <div class="onu-conv-linhas" aria-hidden="true">${linhas}</div>
      <div class="onu-conv-faixa"><div class="onu-conv-pre">${ICO('🚨')} ${esc(pre)}</div><div class="onu-conv-titulo">${esc(titulo)}</div>
        ${sub ? `<div class="onu-conv-sub">${esc(sub)}</div>` : ''}</div>
      <div class="onu-conv-objeto" aria-hidden="true">
        <svg class="onu-conv-raios" viewBox="-100 -100 200 200">${raios}</svg>
        ${boneco}${ART('pulpito', 'onu-conv-pulpito')}${ART('martelo', 'onu-conv-martelo')}
        <span class="onu-conv-impacto"><i></i><i></i><i></i></span>
      </div>
      <div class="onu-conv-rodape" aria-hidden="true"></div></div>`);
    document.body.append(el);
    anunciar([titulo, pre, sub].filter(Boolean).join('. '));
    efeitoSom(som || (cs ? 'alarme' : 'reuniao'));
    const $el = s => el.querySelector(s), u = uPx();
    const tl = gsap.timeline();
    const loops = [];
    if (!RM) el.querySelectorAll('.onu-conv-linhas i').forEach(i => loops.push(gsap.fromTo(i, { x: 0 }, { x: -(innerWidth * 1.9), duration: .35 + Math.random() * .35, ease: 'none', repeat: -1, delay: Math.random() * .6 })));
    else el.querySelectorAll('.onu-conv-linhas i').forEach(i => gsap.set(i, { x: -Math.random() * innerWidth * 1.2 }));
    if (RM) {
      gsap.set([$el('.onu-conv-raios')], { scale: 1, opacity: 1 });
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .18 }).call(() => efeitoSom('martelo'), null, .2).to({}, { duration: 2.1 });
    } else {
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .15 })
        .fromTo($el('.onu-conv-faixa'), { xPercent: -120, skewX: -14 }, { xPercent: 0, skewX: 0, duration: .42, ease: 'back.out(1.5)' }, 0)
        .fromTo([$el('.onu-conv-pre'), $el('.onu-conv-titulo')], { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: .32, stagger: .06, ease: 'power3.out' }, .14)
        .fromTo(el.querySelectorAll('.onu-conv-sub'), { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: .32, ease: 'power3.out' }, .26)
        .fromTo($el('.onu-conv-pulpito'), { y: 30 * u }, { y: 0, duration: .34, ease: 'back.out(1.6)' }, .08)
        .fromTo(el.querySelectorAll('.onu-conv-boneco'), { y: 34 * u, scaleY: 1.1 }, { y: 0, scaleY: 1, duration: .4, ease: 'back.out(1.8)' }, .12)
        .fromTo($el('.onu-conv-martelo'), { y: 30 * u, rotation: 0 }, { y: -7 * u, rotation: -24, duration: .3, ease: 'power2.out' }, .16)   // antecipação: ergue
        .to($el('.onu-conv-martelo'), { y: 0, rotation: 6, duration: .09, ease: 'power2.in' }, .46)                                        // bate aos 0,55 s
        .to($el('.onu-conv-martelo'), { rotation: 0, duration: .25, ease: 'back.out(3)' }, .55)
        .fromTo($el('.onu-conv-pulpito'), { scaleY: .9, scaleX: 1.05 }, { scaleY: 1, scaleX: 1, duration: .3, ease: 'back.out(3)' }, .55)
        .fromTo($el('.onu-conv-raios'), { scale: 0, opacity: 1, rotation: 0 }, { scale: 1, rotation: 12, duration: .55, ease: 'elastic.out(1, .5)' }, .55)
        .fromTo(el.querySelectorAll('.onu-conv-impacto i'), { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: .45, stagger: .03, ease: 'power2.out' }, .55)
        .call(() => { efeitoSom('martelo'); tremer(.4); }, null, .55)
        .to($el('.onu-conv-raios'), { rotation: 40, duration: 1.8, ease: 'none' }, 1.1)
        .to(el, { opacity: 0, duration: .25, ease: 'power2.in' }, 2.15);
    }
    const pular = () => tl.progress(1);
    const tecla = ev => { if ([' ', 'Enter', 'PageDown'].includes(ev.key)) { ev.preventDefault(); ev.stopPropagation(); pular(); } };
    el.addEventListener('pointerdown', pular);
    document.addEventListener('keydown', tecla, true);
    try { await fim(tl); } finally {
      document.removeEventListener('keydown', tecla, true);
      loops.forEach(t => t.kill());
      el.remove();
    }
  }

  // ============================== SESSÃO: sala 3D + pauta + tablet ==============================
  function abrirSessao(e, { emergencia = false, titulo, sub, objeto = 'martelo', avatares = [] }) {
    const el = criar(`<section class="onu-sessao${emergencia ? ' emergencia' : ''}" aria-labelledby="onu-tablet-titulo">
      <div class="onu-palco" aria-hidden="true"></div>
      <div class="onu-sobre-palco" aria-hidden="true"></div>
      <p class="onu-narrador peca flutua" hidden></p>
      <section class="onu-tablet painel peca pinos ${emergencia ? 'vermelha' : 'anil'}">
        <header class="painel-cab">${ART(objeto, 'painel-objeto')}
          <h2 class="painel-titulo" id="onu-tablet-titulo"><span class="onu-titulo-txt">${esc(titulo)}</span><small class="painel-sub">${esc(sub)}</small></h2></header>
        <div class="tela onu-tablet-tela"></div>
        <footer class="painel-rodape"></footer>
      </section></section>`);
    abrirTela(el);
    mapa('pausar', true);
    const s = { el, e, palco: el.querySelector('.onu-palco'), sobre: el.querySelector('.onu-sobre-palco'), tablet: el.querySelector('.onu-tablet'),
      tela: el.querySelector('.onu-tablet-tela'), rodape: el.querySelector('.painel-rodape'), narrador: el.querySelector('.onu-narrador'), cena: Promise.resolve(), tem3D: false };
    if (tem3D()) {
      try {
        s.cena = Cenas3D.salaONU(e, avatares, { emergencia, el: s.palco, fundo: 'transparent', faixa: [0, .79] }).catch(() => {});
        s.tem3D = true;
      } catch { s.tem3D = false; }
    }
    return s;
  }
  const bonecoDe = pid => { try { return tem3D() && Cenas3D.palco?.nome === 'salaONU' ? Cenas3D.palco.bonecos?.[pid] || null : null; } catch { return null; } };
  const acaoBoneco = (pid, acao, seg) => { const b = bonecoDe(pid); if (b && !RM) b.acao(acao, seg); else if (b && RM && ['triste', 'surpreso'].includes(acao)) b.expressao?.(acao); };
  const tituloSessao = (s, txt) => { s.el.querySelector('.onu-titulo-txt').textContent = txt; };
  function limparSessao(s) {
    if (!s) return;
    if (s.el.isConnected) { s.el.remove(); document.querySelectorAll('#camada > .veu').forEach(v => !v.nextElementSibling && v.remove()); }
    if (tem3D() && Cenas3D.palco?.el === s.palco) Cenas3D.esconder();
    mapa('pausar', false);
    abaixarTrilha(false);
  }
  async function fecharSessao(s) {
    await fecharTela(s.el);
    if (tem3D() && Cenas3D.palco?.el === s.palco) Cenas3D.esconder();
    mapa('pausar', false);
    abaixarTrilha(false);
  }

  // ---------- Pauta (o "documento" da resolução, embaixo da sala) ----------
  const resolucao = id => (typeof RESOLUCOES !== 'undefined' ? RESOLUCOES.find(r => r.id === id) : null);
  function tituloRes(r, res) {
    if (r.alvo === 'conflito' && res.alvo) return `${r.nome} ${com(res.alvo, 'em')}`;
    if (r.alvo === 'potencia' && res.alvo) return `${r.nome} contra ${com(res.alvo)}`;
    return r.nome;
  }
  // Efeitos de uma resolução em chips curtos ("Conflito −1", "Energia limpa +5 para todas")
  function chipsEfeitos(r, res, longo = false) {
    return (r.efeitos || []).slice(0, 4).map(ef => {
      const [sel, ...resto] = ef.v.split('.'), caminho = ['global', 'alvo', 'todos', 'territorios', 'local'].includes(sel) ? resto.join('.') : ef.v;
      const rot = ROTULOS[caminho];
      if (!rot) return '';
      const d = ef.d ?? 0, bom = (d < 0) === BOM_SE_DESCE.has(caminho);
      const onde = !longo ? '' : sel === 'todos' ? ' (todas as potências)' : sel === 'territorios' ? ' (territórios)' : sel === 'alvo' && res?.alvo ? ` (${nomeCurtoPid(res.alvo)})` : '';
      return `<span class="pilula ${bom ? 'ganho' : 'perda'}">${ICO(rot[1])} ${esc(rot[0])} ${esc(deltaTxt(caminho, d))}${esc(onde)}</span>`;
    }).join('');
  }
  function montarPauta(s, e, r, res) {
    const cs = r.orgao === 'cs';
    const n = (e.manchetes || []).filter(m => /^ONU /.test(m.texto)).length + 1;
    const pauta = criar(`<article class="onu-pauta peca flutua" aria-label="Pauta">
      ${ART(ARTE_RES[r.id] || 'urna', 'onu-pauta-arte')}
      <div class="onu-pauta-corpo">
        <p class="onu-pauta-topo"><span class="pilula ${cs ? 'onu-cs' : 'onu-ag'}">${ICO('🏛')} ${cs ? 'Conselho de Segurança' : 'Assembleia Geral'}</span>
          <span class="onu-pauta-num num">Resolução ${n} · ${fmtAno(e.ano)}${res.proponente ? ' · proposta ' + esc(com(res.proponente, 'de')) : ''}</span></p>
        <h3 class="onu-pauta-titulo">${esc(tituloRes(r, res))}</h3>
        <p class="onu-pauta-texto">${esc(r.texto)}</p>
        <p class="onu-pauta-efeitos"><b>Se aprovar:</b> ${chipsEfeitos(r, res)}</p>
      </div>
      <div class="onu-pauta-carimbo"></div></article>`);
    s.el.insertBefore(pauta, s.tablet);
    s.pauta = pauta;
    if (!RM) gsap.from(pauta, { y: 8 * uPx(), opacity: 0, duration: .45, ease: 'back.out(1.6)', delay: .25 });
  }

  // ---------- Tablet de votação: regra (Conselho × Assembleia), delegações em linhas e placar ----------
  function linhaDelegacao(e, pid, { proponente, cs, marcas = true } = {}) {
    const p5 = cs && permanente(pid);
    const territorio = pid === 'reino_unido';
    return `<li class="onu-linha peca" data-pid="${pid}">
      <span class="onu-linha-aba"${territorio ? '' : ` data-equipe="${pid}"`}>${retrato(e, pid, { tamanho: 96 })}</span>
      <span class="onu-linha-txt"><span class="onu-linha-nome">${esc(territorio ? 'Reino Unido' : nomeCurtoPid(pid))}</span>
        <span class="onu-linha-sub">${esc(quemJoga(e, pid))}</span></span>
      <span class="onu-linha-marcas">${marcas && p5 ? `<span class="onu-p5" title="Membro permanente: tem veto"><svg viewBox="0 0 40 46" aria-hidden="true"><path d="M20 3 36 8v13c0 11-7 19-16 22C11 40 4 32 4 21V8Z"/></svg><b>P5</b><span class="so-leitor">membro permanente, com veto</span></span>` : ''}
        ${marcas && proponente === pid ? `<span class="onu-megafone">${ART('megafone')}<span class="so-leitor">propôs a resolução</span></span>` : ''}</span>
      <span class="onu-linha-estado"><span class="onu-espera">aguardando</span></span></li>`;
  }
  function textoRegra(e, cs) {
    const nT = Object.values(e.territorios).filter(t => !t.protegido).length;
    return cs
      ? { titulo: 'Conselho de Segurança', chip: 'obrigatória', texto: 'EUA, China, Rússia, Reino Unido e França (pela UE) têm veto: o “não” de um deles derruba tudo. Passa com 4 “sim” dos 7.' }
      : { titulo: 'Assembleia Geral', chip: 'recomendação', texto: `Cada país tem 1 voto e ninguém tem veto: vence a maioria. Votam as 6 potências e ${nT} territórios.` };
  }
  function montarVotacao(s, e, r, res) {
    const cs = r.orgao === 'cs', reg = textoRegra(e, cs);
    const quem = [...pidsDe(e), ...(cs ? ['reino_unido'] : [])];
    s.tela.innerHTML = `<div class="onu-regra ${cs ? 'onu-cs' : 'onu-ag'}"><span class="soquete">${ICO(cs ? '🛡' : '🏛')}</span>
        <p><b>${reg.titulo}</b> <span class="pilula onu-chip-regra">${reg.chip}</span><br>${esc(reg.texto)}</p></div>
      <ol class="onu-delegacoes" aria-label="Delegações">${quem.map(pid => linhaDelegacao(e, pid, { proponente: res.proponente, cs })).join('')}</ol>
      <div class="onu-placar" hidden>
        ${['sim', 'nao', 'abst'].map(v => `<span class="onu-placar-item onu-${v}"><span class="soquete">${VOTO[v].glifo()}</span>
          <span class="onu-placar-rot">${v === 'abst' ? 'Abstenção' : VOTO[v].palavra}</span><b class="num" data-conta="${v}">0</b></span>`).join('')}</div>
      <div class="onu-territorios" hidden></div>`;
    preencherRetratos(s.tela, e);
    if (!RM) gsap.from(s.tela.querySelectorAll('.onu-regra, .onu-linha'), { y: 1.4 * uPx(), opacity: 0, duration: .3, stagger: .06, ease: 'power2.out', delay: .2 });
  }
  const linha = (s, pid) => s.tela.querySelector(`.onu-linha[data-pid="${pid}"]`);
  function marcarVez(s, pid) {
    s.tela.querySelectorAll('.onu-linha').forEach(l => l.classList.toggle('vez', l.dataset.pid === pid));
    linha(s, pid)?.scrollIntoView({ block: 'nearest' });
  }
  async function carimbarLinha(s, pid, html, { som = null } = {}) {
    const l = linha(s, pid);
    if (!l) return;
    const cel = l.querySelector('.onu-linha-estado');
    cel.innerHTML = html;
    await carimbar(cel.firstElementChild, { som, tremida: 0 });
  }
  const carimboVoto = v => `<span class="carimbo pequeno ${VOTO[v].classe}">${VOTO[v].glifo()} ${VOTO[v].selo}</span>`;
  const carimboVotou = () => `<span class="carimbo pequeno verde onu-votou">${ICO('🗳')} VOTOU</span>`;
  // Rodapé de progresso: um encaixe por delegação; quem vota ganha um tijolinho na sua cor (nunca mostra em quê)
  function progresso(s, quem) {
    s.rodape.innerHTML = `<div class="onu-progresso"><span class="onu-prog-slots">${quem.map(p => `<span class="onu-encaixe" data-p="${p}"></span>`).join('')}</span>
      <span class="onu-prog-txt"><b class="num">0</b> de ${quem.length} votaram</span></div>`;
  }
  function contar(s, pid) {
    const slot = s.rodape.querySelector(`.onu-prog-slots [data-p="${pid}"]`);
    if (!slot) return;
    slot.innerHTML = pid === 'reino_unido' ? '<i class="onu-tijolinho onu-tijolinho-neutro"></i>' : tijolinho(pid);
    if (!RM) gsap.from(slot.firstElementChild, { y: -3 * uPx(), scaleY: 1.2, duration: .32, ease: 'back.out(2.4)' });
    const b = s.rodape.querySelector('.onu-prog-txt b');
    b.textContent = s.rodape.querySelectorAll('.onu-prog-slots .onu-tijolinho').length;
    popNumero(b);
  }
  // Fala do "mestre de cerimônias" no alto da sala
  function narrar(s, icone, texto) {
    const n = s.narrador;
    n.innerHTML = `${ICO(icone)}<span>${texto}</span>`;
    n.hidden = false;
    if (!RM) gsap.fromTo(n, { y: -1.6 * uPx(), opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .32, ease: 'back.out(2)' });
  }

  // ---------- Voto secreto: tela da noite com a urna; responde só "VOTOU" (mesmo som e tempo para qualquer voto) ----------
  async function telaSecreta(e, pid, { pre = 'Vez de votar', conteudo, opcoes, teclas, nota = '', carimbo = 'VOTOU', classeCarimbo = 'verde', icone = '🗳', objeto = 'urna' }) {
    const el = criar(`<section class="onu-privado" aria-labelledby="onu-priv-tit">
      <div class="onu-privado-cartao painel peca pinos" data-equipe="${pid}" tabindex="-1">
        <header class="painel-cab"><span class="onu-privado-retrato">${retrato(e, pid, { classe: 'grande', tamanho: 220, enquadramento: 'busto', expressao: 'determinado' })}</span>
          <h2 class="painel-titulo" id="onu-priv-tit"><small class="painel-sub">${esc(pre)}</small>Delegação ${esc(com(pid, 'de'))}</h2>
          ${seloForma(pid)}</header>
        <div class="tela">
          <div class="onu-privado-topo">${ART(objeto, 'onu-privado-urna')}<div>${conteudo}
            <p class="onu-privado-instr">${ICO('💬')}Venham até o computador. Turma: olhos no professor!</p></div></div>
          <div class="onu-votos" role="group" aria-label="Escolha secreta">${opcoes}</div>
          ${teclas ? `<p class="onu-teclas">${ICO('🔒')}Em segredo, pelo teclado: ${teclas}</p>` : ''}
          ${nota ? `<p class="onu-nota">${nota}</p>` : ''}
          <span class="carimbo ${classeCarimbo} grande onu-carimbo-secreto" hidden>${ICO(icone)} ${esc(carimbo)}</span>
        </div></div></section>`);
    abrirTela(el, el.querySelector('.onu-privado-cartao'));
    preencherRetratos(el, e);
    if (!RM) gsap.from(el.querySelector('.onu-privado-cartao'), { y: 6 * uPx(), scale: .94, duration: .42, ease: 'back.out(1.4)' });
    efeitoSom('vez');
    anunciar(`${pre}: Delegação ${com(pid, 'de')}.`);
    return el;
  }
  async function confirmarSecreto(el) {
    el.querySelectorAll('.onu-votos button').forEach(b => (b.disabled = true));
    const c = el.querySelector('.onu-carimbo-secreto');
    anunciar('Escolha registrada.');
    await carimbar(c, { som: 'voto', tremida: .15 });
    await espera(1000);
    await fecharTela(el);
  }
  const tecla = t => `<kbd>${t}</kbd>`;
  async function votoSecreto(e, pid, r, res) {
    const cs = r.orgao === 'cs', p5 = cs && permanente(pid);
    const ops = p5 ? ['sim', 'veto', 'abst'] : ['sim', 'nao', 'abst'];
    const opcoes = ops.map(v => `<button class="btn peca pinos onu-voto ${VOTO[v].botao}" type="button" data-acao="${v}" data-teste="voto-${v}">
      <span class="onu-voto-glifo">${VOTO[v].glifo()}</span><span class="onu-voto-palavra">${VOTO[v].palavra}</span></button>`).join('');
    const conteudo = `<p class="onu-privado-pauta">${ICO('🏛')}<b>${esc(tituloRes(r, res))}</b></p>`;
    const teclas = ops.map(v => `${tecla(VOTO[v].tecla)} ${VOTO[v].palavra.replace('!', '').toLowerCase()}`).join(' · ');
    const nota = p5 ? `${ICO('✋')}No Conselho de Segurança, o “não” de um membro permanente é um <b>veto</b>: derruba a resolução sozinho.` : '';
    const el = await telaSecreta(e, pid, { conteudo, opcoes, teclas, nota });
    const v = await esperarBotao(el.querySelector('.onu-votos'), { teclas: Object.fromEntries(ops.map(x => [VOTO[x].tecla, x])) });
    await confirmarSecreto(el);
    return v;
  }

  // ---------- Revelação voto a voto (sala 3D + carimbos no tablet), placar e Assembleia Geral ----------
  async function revelar(s, e, r, res, resultado) {
    const cs = r.orgao === 'cs';
    const quem = [...pidsDe(e), ...(cs ? ['reino_unido'] : [])];
    const mostrado = p => (cs && permanente(p) && resultado.votos[p] === 'nao' ? 'veto' : resultado.votos[p] || 'abst');
    tituloSessao(s, 'Revelação dos votos');
    s.tela.querySelectorAll('.onu-linha').forEach(l => l.classList.remove('vez'));
    narrar(s, '🔎', 'Revelação! Os votos aparecem um a um, na ordem das cadeiras.');
    s.tela.querySelectorAll('.onu-linha .onu-espera').forEach(x => x.remove());
    // a regra já foi lida: sai, e as linhas encolhem para caber o placar (e os territórios)
    const regra = s.tela.querySelector('.onu-regra');
    if (regra) await fim(gsap.to(regra, { opacity: 0, duration: RM ? .15 : .2, ease: 'power2.in' }));
    regra?.remove();
    s.tela.classList.add('onu-revelando');
    const placar = s.tela.querySelector('.onu-placar');
    placar.hidden = false;
    if (RM) gsap.fromTo([placar, ...s.tela.querySelectorAll('.onu-linha')], { opacity: 0 }, { opacity: 1, duration: .18 });
    else gsap.from(placar, { y: 2 * uPx(), opacity: 0, duration: .3, ease: 'back.out(2)' });
    abaixarTrilha(true);
    await espera(600);
    const conta = { sim: 0, nao: 0, abst: 0 };
    const somar = v => { const k = v === 'veto' ? 'nao' : v; conta[k]++; const b = placar.querySelector(`[data-conta="${k}"]`); b.textContent = conta[k]; popNumero(b); };
    const sala = Object.fromEntries(pidsDe(e).map(p => [p, mostrado(p)]));
    const prom3D = s.tem3D ? Cenas3D.votos(sala).catch(() => {}) : Promise.resolve();
    const tl = gsap.timeline();
    let t = .1;
    quem.forEach((p, i) => {
      const v = mostrado(p), naSala = p in sala, quando = t + (RM ? .3 : .67);
      tl.call(() => {
        carimbarLinha(s, p, carimboVoto(v), { som: naSala && s.tem3D ? null : 'tijolo' });   // na sala, o som vem do tijolinho 3D
        somar(v);
        if (v === 'veto') vetoGrande(s, p, !(naSala && s.tem3D));
      }, null, quando);
      t += v === 'veto' ? 1.1 : .6;
    });
    tl.to({}, { duration: .35 }, t);
    await Promise.all([fim(tl), prom3D]);
    // Assembleia Geral: os territórios votam sozinhos (com o parceiro ou pelo próprio interesse)
    if (!cs) {
      const ts = Object.keys(resultado.votos).filter(id => !PIDS.includes(id));
      const caixa = s.tela.querySelector('.onu-territorios');
      const ordem = ['sim', 'nao', 'abst'];
      const tijolos = ts.map(id => resultado.votos[id]).sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
      caixa.innerHTML = `<p class="onu-terr-tit">${ICO('🌍')} <b>Os ${ts.length} territórios votam</b> <span>com a potência parceira ou pelo próprio interesse</span></p>
        <div class="onu-mini" role="img" aria-label="Territórios: ${tijolos.filter(v => v === 'sim').length} sim, ${tijolos.filter(v => v === 'nao').length} não, ${tijolos.filter(v => v === 'abst').length} abstenções">
        ${tijolos.map(v => `<i class="onu-mini-${v}"></i>`).join('')}</div>`;
      caixa.hidden = false;
      caixa.scrollIntoView({ block: 'nearest' });
      const mini = [...caixa.querySelectorAll('.onu-mini i')];
      const tl2 = gsap.timeline();
      if (RM) tl2.fromTo(mini, { opacity: 0 }, { opacity: 1, duration: .18 });
      else tl2.fromTo(mini, { scale: 0, y: -2 * uPx() }, { scale: 1, y: 0, duration: .26, stagger: .045, ease: 'back.out(3)' });
      mini.forEach((m, i) => tl2.call(() => { somar(tijolos[i]); if (i % 3 === 0 && !RM) uSom('tijolo', { i: Math.min(10, i / 3) }); }, null, RM ? .05 : .2 + i * .045));
      await fim(tl2);
    }
    // conferência final com o motor (o placar mostrado é sempre o oficial)
    ['sim', 'nao', 'abst'].forEach(k => { const b = placar.querySelector(`[data-conta="${k}"]`); if (+b.textContent !== resultado[k]) b.textContent = resultado[k]; });
    abaixarTrilha(false);
    await espera(500);
  }
  // "VETO!" em destaque sobre a sala
  function vetoGrande(s, pid, comSom = true) {
    const el = criar(`<div class="onu-veto-grande"><span class="carimbo vetada">${ICO('✋')} VETO!</span><span class="onu-veto-quem letra-bolha relevo">${esc(Com(pid))} ${verbo(pid, 'vetou', 'vetaram')}</span></div>`);
    s.sobre.append(el);
    anunciar(`Veto! ${Com(pid)} ${verbo(pid, 'vetou', 'vetaram')}.`);
    carimbar(el.firstElementChild, { som: comSom ? 'trovao' : null, tremida: .45 }).catch(() => {});
    gsap.to(el, { opacity: 0, y: RM ? 0 : -3 * uPx(), duration: .3, delay: 1.25, ease: 'power2.in', onComplete: () => el.remove() });
  }
  // Carimbo final sobre a pauta + reação dos bonecos
  async function carimboResultado(s, e, r, res, resultado) {
    const cs = r.orgao === 'cs';
    const vetada = cs && resultado.vetos.length > 0, empate = !cs && resultado.sim === resultado.nao;
    const tipo = resultado.aprovada ? 'aprovada' : vetada ? 'vetada' : empate ? 'empate' : 'rejeitada';
    const C = { aprovada: ['verde', GLIFOS.ok, 'APROVADA'], vetada: ['vetada', ICO('✋'), 'VETADA'], empate: ['cinza', GLIFOS.menos, 'SEM MAIORIA'], rejeitada: ['vermelho', GLIFOS.nao, 'REJEITADA'] }[tipo];
    const alvo = s.pauta?.querySelector('.onu-pauta-carimbo') || s.sobre;
    alvo.innerHTML = `<span class="carimbo grande ${C[0]}">${C[1]} ${C[2]}</span>`;
    await carimbar(alvo.firstElementChild, { som: 'martelo', tremida: .4 });
    efeitoSom(resultado.aprovada ? 'subir' : 'descer');
    if (resultado.aprovada && res.proponente) confeteDe(alvo.firstElementChild, { particleCount: 20, colors: [corDe(res.proponente), '#FFD21F'] });
    for (const p of pidsDe(e)) {
      const v = resultado.votos[p];
      if (resultado.aprovada) acaoBoneco(p, p === res.proponente ? 'comemorar' : v === 'sim' ? 'palmas' : 'bracos-cruzados', p === res.proponente ? undefined : 1.6);
      else acaoBoneco(p, p === res.proponente ? 'triste' : resultado.vetos.includes(p) ? 'bracos-cruzados' : 'parado', 1.6);
    }
    return tipo;
  }
  function fraseResultado(e, r, res, resultado, tipo) {
    const vetaram = resultado.vetos;
    const quemVetou = vetaram.length ? listaNomes(vetaram.map((v, i) => (i ? com(v) : Com(v)))) : '';
    if (tipo === 'aprovada') return `Aprovada por ${resultado.sim} votos a ${resultado.nao}! ${tituloRes(r, res)} vai sair do papel.`;
    if (tipo === 'vetada') return `${quemVetou} ${vetaram.length > 1 || plural(vetaram[0]) ? 'vetaram' : 'vetou'}: a resolução não passa, mesmo com ${resultado.sim} ${resultado.sim === 1 ? 'voto' : 'votos'} a favor.`;
    if (tipo === 'empate') return `Empate: ${resultado.sim} a ${resultado.nao}. Sem maioria, a resolução não passa.`;
    if (r.orgao === 'cs') return `Rejeitada: no Conselho são precisos 4 votos “sim”, e vieram ${resultado.sim}.`;
    return `Rejeitada por ${resultado.nao} votos a ${resultado.sim}.`;
  }
  function porqueResultado(r, tipo) {
    if (tipo === 'aprovada') return (r.orgao === 'ag' ? 'Na Assembleia Geral, cada país tem 1 voto e a decisão é uma <b>recomendação</b>: ela pesa porque a maioria concordou.'
      : 'No Conselho de Segurança, a decisão é <b>obrigatória</b> para todos os países, e nenhum membro permanente vetou.') +
      (r.custoSim?.economia ? ' Quem votou “sim” ajuda a pagar a missão (economia −1).' : '');
    if (tipo === 'vetada') return 'No Conselho de Segurança, um só membro permanente pode barrar uma decisão. O <b>veto</b> protege interesses e aliados, mas desgasta a confiança: a cooperação cai e quem vetou perde influência.';
    return 'Quando a ONU não chega a um acordo, o problema continua e o mundo fica mais desconfiado: a cooperação cai um pouco.';
  }
  // Discurso opcional de 30 s de quem propôs (a câmera vai até a delegação)
  async function debate(s, e, res) {
    for (;;) {
      narrar(s, '💬', 'Antes de votar, conversem: o que cada país ganha e perde com esta resolução?');
      s.rodape.innerHTML = `${res.proponente ? `<button class="btn btn-neutro peca" type="button" data-acao="discurso">${ICO('🎤')} Discurso (30 s)</button>` : ''}
        <button class="btn btn-principal peca pinos" type="button" data-acao="votar" data-teste="continuar-painel">Votar ${GLIFOS.seta}</button>`;
      const a = await esperarBotao(s.rodape);
      if (a !== 'discurso') return;
      await discurso(s, e, res.proponente);
    }
  }
  async function discurso(s, e, pid) {
    abaixarTrilha(true);
    if (s.tem3D) await aguardar(Promise.race([Cenas3D.fala(pid) || Promise.resolve(), espera(1400)]));
    const balao = criar(`<div class="onu-fala balao peca flutua" data-ponta="baixo"><span class="balao-tit">${ICO('🎤')} Palavra com ${esc(com(pid))}</span>Defendam a proposta em 30 segundos!</div>`);
    s.sobre.append(balao);
    const a = s.tem3D ? Cenas3D.ancora(pid) : null, caixa = s.el.getBoundingClientRect();
    if (a?.visivel) Object.assign(balao.style, { left: Math.max(16, a.x - caixa.left - 9 * uPx()) + 'px', top: Math.max(16, a.topo - caixa.top - 15 * uPx()) + 'px' });
    else Object.assign(balao.style, { left: 4 * uPx() + 'px', top: 4 * uPx() + 'px' });
    if (!RM) gsap.from(balao, { scale: .6, opacity: 0, duration: .35, ease: 'back.out(2)', transformOrigin: '20% 100%' });
    s.rodape.innerHTML = `<span class="cronometro peca" role="timer" aria-label="Tempo do discurso">0:30</span>
      <button class="btn btn-principal peca pinos" type="button" data-acao="fim">Encerrar discurso</button>`;
    const parar = esperarBotao(s.rodape);
    await contagem(s.rodape.querySelector('.cronometro'), 30, parar);
    parar.parar();
    balao.remove();
    if (s.tem3D) await aguardar(Promise.race([Cenas3D.fala(null) || Promise.resolve(), espera(1400)]));
    abaixarTrilha(false);
  }
  // Cronômetro real (também com RM); termina no zero ou quando "parar" resolver
  async function contagem(el, segundos, parar) {
    let acabou = false;
    parar.then(() => (acabou = true), () => (acabou = true));
    for (let resta = segundos; resta >= 0 && !acabou; resta--) {
      el.textContent = `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`;
      el.classList.toggle('acabando', resta <= 5);
      if (resta <= 5 && resta > 0) { uSom('tique', { semitons: 5 - resta }); if (!RM) gsap.fromTo(el, { scale: 1.08 }, { scale: 1, duration: .4, ease: 'power2.out' }); }
      if (resta === 0) { efeitoSom('tempo'); break; }
      await Promise.race([espera(1000), parar.catch(() => {})]);
    }
  }

  // ============================== CONTRATO: VOTAÇÃO ==============================
  async function votacao(e, res) {
    const r = resolucao(res?.id);
    if (!r) return Simulacao.votacao(e, res, {});
    pidsN = pidsDe(e).length;
    const cs = r.orgao === 'cs', humor = humorAtual();
    let s = null;
    try {
      await convocacao({ cs, pre: `${cs ? 'Conselho de Segurança' : 'Assembleia Geral'}${res.proponente ? ' · convocada ' + com(res.proponente, 'por') : ''}`, sub: tituloRes(r, res), quem: res.proponente, e });
      musica('assembleia');
      s = abrirSessao(e, { emergencia: cs, titulo: 'Votação', sub: cs ? 'Conselho de Segurança' : 'Assembleia Geral', objeto: 'martelo', avatares: pidsDe(e).map(p => avatarDe(e, p)) });
      montarPauta(s, e, r, res);
      montarVotacao(s, e, r, res);
      await aguardar(Promise.race([s.cena, espera(2500)]));
      await debate(s, e, res);
      // voto secreto, na ordem das cadeiras; o computador vota sozinho
      const votos = {}, quem = pidsDe(e);
      narrar(s, '🔒', 'Voto secreto: cada equipe vota na sua vez. A tela só mostra quem já votou.');
      tituloSessao(s, 'Votação secreta');
      progresso(s, [...quem, ...(cs ? ['reino_unido'] : [])]);
      for (const pid of quem) {
        marcarVez(s, pid);
        if (humano(e, pid)) votos[pid] = await votoSecreto(e, pid, r, res);
        else { await espera(420 + Math.random() * 380); votos[pid] = Simulacao.iaVoto(e, pid, res); }
        acaoBoneco(pid, 'votar');
        await carimbarLinha(s, pid, carimboVotou(), { som: 'voto' });
        contar(s, pid);
      }
      if (cs) { marcarVez(s, 'reino_unido'); await espera(500); await carimbarLinha(s, 'reino_unido', carimboVotou(), { som: 'voto' }); contar(s, 'reino_unido'); }
      const resultado = Simulacao.votacao(e, res, votos);
      await revelar(s, e, r, res, resultado);
      const tipo = await carimboResultado(s, e, r, res, resultado);
      tituloSessao(s, { aprovada: 'Resolução aprovada', vetada: 'Resolução vetada', empate: 'Sem maioria', rejeitada: 'Resolução rejeitada' }[tipo]);
      await espera(700);
      s.tela.querySelector('.onu-regra')?.remove();
      const area = criar('<div class="onu-conseq-area"></div>');
      s.tela.querySelector('.onu-placar').after(area);   // a frase entra logo abaixo do placar; os votos continuam à vista até ela terminar
      s.tela.scrollTop = 0;
      narrar(s, tipo === 'aprovada' ? '✅' : '⚖', { aprovada: 'A resolução foi aprovada.', vetada: 'Veto no Conselho: a resolução cai.', empate: 'Empate: sem maioria.', rejeitada: 'A resolução não passou.' }[tipo]);
      await mostrarConsequencias(area, s.rodape, { frase: fraseResultado(e, r, res, resultado, tipo), mudancas: resultado.mudancas, porque: porqueResultado(r, tipo), ocultar: r.nome, max: innerHeight < 900 ? 3 : 4,   // projetor 1366×768: o porquê cabe sem rolar
        sai: [s.tela.querySelector('.onu-delegacoes'), s.tela.querySelector('.onu-territorios')], quemInfluencia: listaNomes(resultado.vetos.map(nomeCurtoPid)) });
      await fecharSessao(s);
      s = null;
      musica(humor || 'jogo');
      if (resultado.aprovada) {
        const lugar = r.alvo === 'conflito' ? res.alvo : null;
        await aguardar(Promise.race([Promise.resolve(mapa('efeito', 'onu', lugar)), espera(2600)]));
      }
      return resultado;
    } finally {
      limparSessao(s);
      if (s) musica(humor || 'jogo');
    }
  }

  // ============================== CONTRATO: PROPOR RESOLUÇÃO ==============================
  function proporResolucao(e, pid) {
    const disp = Simulacao.resolucoesDisponiveis(e, pid);
    const alvosDe = id => disp.filter(d => d.id === id).map(d => d.alvo).filter(Boolean);
    const lista = (typeof RESOLUCOES !== 'undefined' ? RESOLUCOES : []);
    const precisaAlvo = r => r.alvo === 'conflito' || r.alvo === 'potencia';
    const el = criar(`<section class="painel peca pinos painel-g anil onu-proposta" aria-labelledby="onu-prop-tit">
      <header class="painel-cab">${ART('pulpito', 'painel-objeto')}
        <h2 class="painel-titulo" id="onu-prop-tit">Propor resolução na ONU<small class="painel-sub">Escolham a pauta. Depois, todas as delegações votam.</small></h2></header>
      <div class="tela onu-prop-tela">
        <div class="lista-opcoes onu-prop-lista" role="radiogroup" aria-label="Resoluções">
          ${lista.map(r => {
            const sem = precisaAlvo(r) && !alvosDe(r.id).length;
            return `<button class="opcao peca onu-res${sem ? ' bloqueado' : ''}" type="button" role="radio" aria-checked="false" data-id="${r.id}"${sem ? ' aria-disabled="true"' : ''}>
              <span class="onu-res-arte">${ART(ARTE_RES[r.id] || 'urna')}</span>
              <span><span class="opcao-nome">${esc(r.nome)}</span><span class="opcao-detalhe">${sem ? (r.alvo === 'conflito' ? 'Nenhum conflito agora' : 'Sem alvo possível') : r.orgao === 'cs' ? 'Conselho de Segurança · com veto' : 'Assembleia Geral · maioria'}</span></span>
              <span class="opcao-fim"><span class="marcador">${GLIFOS.ok}</span></span></button>`;
          }).join('')}
        </div>
        <div class="onu-prop-detalhe"><div class="onu-prop-vazio">${ART('pulpito', 'onu-prop-vazio-arte')}<p>Escolham uma resolução para ver o que muda e quem decide.</p></div></div>
      </div>
      <footer class="painel-rodape"><span class="dica">${ICO('🏛')} Conselho de Segurança: há veto. Assembleia Geral: vence a maioria.</span>
        <button class="btn btn-neutro peca" type="button" data-acao="cancelar" data-teste="cancelar">Cancelar</button>
        <button class="btn btn-principal peca pinos" type="button" data-acao="confirmar" data-teste="confirmar" disabled>${ICO('🏛')} Levar à ONU</button></footer></section>`);
    let escolha = null, alvo = null;
    const confirmar = el.querySelector('[data-acao="confirmar"]'), detalhe = el.querySelector('.onu-prop-detalhe');
    const atualizar = () => { confirmar.disabled = !escolha || (precisaAlvo(escolha) && !alvo); };
    function mostrarDetalhe(r) {
      const cs = r.orgao === 'cs', reg = textoRegra(e, cs), alvos = alvosDe(r.id);
      detalhe.innerHTML = `<p class="onu-prop-orgao"><span class="pilula ${cs ? 'onu-cs' : 'onu-ag'}">${ICO('🏛')} ${reg.titulo}</span> <span class="pilula">${reg.chip}</span></p>
        <h3 class="onu-prop-nome">${esc(r.nome)}</h3>
        <p class="onu-prop-texto">${esc(r.texto)}</p>
        <p class="onu-pauta-efeitos"><b>Se aprovar:</b> ${chipsEfeitos(r, null, true)}${r.custoSim?.economia ? `<span class="pilula perda">${ICO('💰')} Economia −1 (quem votar sim)</span>` : ''}</p>
        <p class="onu-prop-regra">${esc(reg.texto)}</p>
        ${precisaAlvo(r) ? `<h4 class="onu-sub">${ICO('📍')} ${r.alvo === 'conflito' ? 'Onde?' : 'Contra quem?'}</h4>
          <div class="lista-opcoes onu-prop-alvos" role="radiogroup" aria-label="${r.alvo === 'conflito' ? 'Território em conflito' : 'Potência'}">
          ${alvos.map(a => r.alvo === 'conflito'
            ? `<button class="opcao peca" type="button" role="radio" aria-checked="false" data-teste="alvo" data-alvo="${a}"><span class="soquete">${ICO('⚠')}</span>
                <span><span class="opcao-nome">${esc(nome(a))}</span><span class="opcao-detalhe">${esc(CONTINENTES[e.territorios[a].continente] || '')} · conflito nível ${e.territorios[a].conflito} de 3${e.territorios[a].parceiro ? ' · parceiro ' + esc(com(e.territorios[a].parceiro, 'de')) : ''}</span></span>
                <span class="opcao-fim"><span class="marcador">${GLIFOS.ok}</span></span></button>`
            : `<button class="opcao peca" type="button" role="radio" aria-checked="false" data-teste="alvo" data-alvo="${a}">${retrato(e, a, { tamanho: 96 })}
                <span><span class="opcao-nome">${esc(nome(a))}</span><span class="opcao-detalhe">${esc(quemJoga(e, a))}${permanente(a) ? ' · tem veto' : ''}</span></span>
                <span class="opcao-fim"><span class="marcador">${GLIFOS.ok}</span></span></button>`).join('')}</div>` : ''}`;
      preencherRetratos(detalhe, e);
      if (!RM) gsap.from(detalhe.children, { y: 1.2 * uPx(), opacity: 0, duration: .26, stagger: .04, ease: 'power2.out' });
    }
    return new Promise(ok => {
      let feito = false;
      const terminar = async v => { if (feito) return; feito = true; await fecharPainel(el).catch(() => {}); ok(v); };
      el.addEventListener('click', ev => {
        const res = ev.target.closest('.onu-res');
        if (res) {
          if (res.getAttribute('aria-disabled') === 'true') { aviso(res.querySelector('.opcao-detalhe').textContent, { tipo: 'neutro' }); return; }
          efeitoSom('clique');
          el.querySelectorAll('.onu-res').forEach(b => b.setAttribute('aria-checked', b === res));
          escolha = lista.find(r => r.id === res.dataset.id); alvo = null;
          mostrarDetalhe(escolha); atualizar();
          return;
        }
        const a = ev.target.closest('[data-alvo]');
        if (a) { efeitoSom('clique'); detalhe.querySelectorAll('[data-alvo]').forEach(b => b.setAttribute('aria-checked', b === a)); alvo = a.dataset.alvo; atualizar(); return; }
        const b = ev.target.closest('[data-acao]');
        if (!b || b.disabled) return;
        efeitoSom('clique');
        if (b.dataset.acao === 'cancelar') terminar(null);
        if (b.dataset.acao === 'confirmar' && escolha) terminar({ id: escolha.id, alvo: precisaAlvo(escolha) ? alvo : null });
      });
      abrirPainel(el, { esc: () => { if (!feito) { feito = true; ok(null); } } }).catch(() => {});
      gsap.from(el.querySelectorAll('.onu-res'), { y: 1.4 * uPx(), opacity: 0, duration: .28, stagger: .05, ease: 'power2.out', delay: .2 });
    });
  }

  // ============================== CONTRATO: CÚPULA DO CLIMA (COP) ==============================
  const COP_OPCOES = [
    { n: 0, nome: 'Nada agora', efeito: 'Nenhum corte: a economia não perde nada.', botao: 'btn-neutro cinza' },
    { n: 1, nome: 'Compromisso médio', efeito: 'Energia limpa +6 · economia −1', botao: 'cat-natureza' },
    { n: 2, nome: 'Compromisso alto', efeito: 'Energia limpa +12 · economia −3', botao: 'btn-confirmar' },
  ];
  const unidades = n => `${n} ${n === 1 ? 'unidade' : 'unidades'}`;
  const tijolinho = (pid, extra = '') => `<i class="onu-tijolinho${extra}" data-equipe="${pid}">${formaDe(pid, { branca: true })}</i>`;
  async function cop(e) {
    pidsN = pidsDe(e).length;
    const meta = Simulacao.PARAM?.copSucesso ?? 7, max = pidsDe(e).length * 2, humor = humorAtual(), quem = pidsDe(e);
    musica('assembleia');
    await splash({ pre: 'Cúpula do Clima', titulo: 'COP ' + fmtAno(e.ano), sub: 'Compromissos secretos', cor: 'natureza', icone: ART('termometro'), som: 'reuniao' });
    const el = criar(`<section class="painel peca pinos painel-g cat-natureza onu-cop" aria-labelledby="onu-cop-tit">
      <header class="painel-cab">${ART('termometro', 'painel-objeto')}
        <h2 class="painel-titulo" id="onu-cop-tit">Cúpula do Clima ${fmtAno(e.ano)}<small class="painel-sub">Cada delegação promete, em segredo, quanto vai cortar de emissões</small></h2>
        <span class="pilula onu-meta-chip">${ICO('🎯')} Meta: ${meta}</span></header>
      <div class="tela onu-cop-tela">
        <div class="onu-cop-esq">
          <div class="onu-medidor-caixa"><p class="onu-medidor-tit"><b>Soma das promessas</b> <span class="num onu-soma" aria-live="polite">0</span><span class="num"> de ${max}</span></p>
            <div class="onu-medidor" style="--total:${max}" role="meter" aria-label="Soma das promessas" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="0">
              ${Array.from({ length: max }, (_, i) => `<span class="onu-encaixe${i === meta - 1 ? ' meta' : ''}"></span>`).join('')}
              <span class="onu-bandeira-meta" style="--pos:${meta}"><b>META ${meta}</b></span></div></div>
          <div class="onu-cop-corpo">
            <div class="onu-cop-opcoes">${COP_OPCOES.map(o => `<div class="onu-cop-op" data-n="${o.n}"><b class="onu-cop-n num">${o.n}</b><span><b>${o.nome}</b><small>${o.efeito}</small></span></div>`).join('')}</div>
            <p class="onu-cop-regra">${ICO('🤝')}<span>Se a soma chegar a <b>${meta}</b>, sai o <b>acordo histórico</b>: cooperação +6, deslocados −4 milhões, tensão −2 e tecnologia limpa para todos. Se não chegar, a cúpula fracassa.</span></p>
          </div>
        </div>
        <div class="onu-cop-dir"><ol class="onu-delegacoes onu-cop-delegs" aria-label="Delegações">${quem.map(p => linhaDelegacao(e, p, { marcas: false })).join('')}</ol></div>
      </div>
      <footer class="painel-rodape"><span class="dica">${ICO('🔒')} Ninguém vê a promessa dos outros até o fim.</span>
        <button class="btn btn-principal peca pinos" type="button" data-acao="comecar" data-teste="continuar-painel">Começar as promessas ${GLIFOS.seta}</button></footer></section>`);
    const $ = sel => el.querySelector(sel), rodape = $('.painel-rodape'), tela = $('.onu-cop-tela');
    try {
      await abrirPainel(el);
      preencherRetratos(el, e);
      await esperarBotao(rodape);
      const comp = {};
      rodape.innerHTML = `<span class="dica">${ICO('🔒')} Cada equipe promete na sua vez. O computador decide sozinho.</span>`;
      for (const pid of quem) {
        el.querySelectorAll('.onu-linha').forEach(l => l.classList.toggle('vez', l.dataset.pid === pid));
        if (humano(e, pid)) comp[pid] = await copSecreto(e, pid, meta);
        else { await espera(380 + Math.random() * 300); comp[pid] = Simulacao.iaCop(e, pid); }
        const cel = el.querySelector(`.onu-linha[data-pid="${pid}"] .onu-linha-estado`);
        cel.innerHTML = `<span class="onu-envelope">${ART('envelope-secreto')}<span>guardada</span></span>`;
        if (!RM) gsap.from(cel.firstElementChild, { scale: .4, y: -2 * uPx(), duration: .35, ease: 'back.out(2.4)' });
        efeitoSom('pop');
      }
      el.querySelectorAll('.onu-linha').forEach(l => l.classList.remove('vez'));
      rodape.innerHTML = `<span class="dica">${ICO('🔒')} Todas as promessas estão guardadas.</span>
        <button class="btn btn-principal peca pinos" type="button" data-acao="abrir" data-teste="continuar-painel">Abrir os envelopes! ${GLIFOS.seta}</button>`;
      $('[data-acao="abrir"]').focus({ preventScroll: true });
      await esperarBotao(rodape);
      rodape.innerHTML = '';
      // revelação simultânea: todos os envelopes abrem juntos
      quem.forEach(pid => {
        const cel = el.querySelector(`.onu-linha[data-pid="${pid}"] .onu-linha-estado`), n = comp[pid];
        cel.innerHTML = `<span class="onu-prometeu"><b class="num">${n}</b>${n ? Array.from({ length: n }, () => tijolinho(pid)).join('') : '<span class="onu-zero">nada</span>'}</span>`;
      });
      efeitoSom('virar');
      if (!RM) gsap.from(el.querySelectorAll('.onu-prometeu'), { scale: .3, opacity: 0, duration: .4, ease: 'back.out(2.2)' });
      await espera(900);
      // os tijolinhos voam para o medidor, um a um
      const encaixes = [...el.querySelectorAll('.onu-encaixe')], somaEl = $('.onu-soma'), medidor = $('.onu-medidor');
      let k = 0;
      for (const pid of quem) {
        const origem = [...el.querySelectorAll(`.onu-linha[data-pid="${pid}"] .onu-tijolinho`)];
        for (const t of origem) {
          const destino = encaixes[k];
          destino.innerHTML = tijolinho(pid);
          const novo = destino.firstElementChild, a = t.getBoundingClientRect(), b = destino.getBoundingClientRect();
          t.classList.add('saiu');
          if (!RM) await fim(gsap.timeline()
            .fromTo(novo, { x: a.left - b.left, y: a.top - b.top }, { x: 0, duration: .42, ease: 'power1.inOut' }, 0)
            .fromTo(novo, { y: a.top - b.top }, { keyframes: [{ y: Math.min(a.top - b.top, 0) - 6 * uPx(), duration: .2, ease: 'power2.out' }, { y: 0, duration: .22, ease: 'power2.in' }] }, 0)
            .fromTo(novo, { scaleY: 1 }, { scaleY: .82, duration: .06, yoyo: true, repeat: 1 }, .42));
          else await espera(140);
          uSom('tijolo', { i: k });
          k++;
          somaEl.textContent = k; popNumero(somaEl);
          medidor.setAttribute('aria-valuenow', k);
          if (k === meta) medidor.classList.add('chegou');
        }
      }
      const resultado = Simulacao.resolverCop(e, comp);
      if (resultado.soma !== k) somaEl.textContent = resultado.soma;
      await espera(500);
      // carimbo + tragédia dos comuns
      const esq = $('.onu-cop-esq .onu-cop-corpo');
      const carimbo = criar(`<div class="onu-carimbo-linha"><span class="carimbo grande ${resultado.sucesso ? 'verde' : 'cinza'}">${resultado.sucesso ? GLIFOS.ok + ' ACORDO HISTÓRICO' : GLIFOS.nao + ' SEM ACORDO'}</span></div>`);
      $('.onu-medidor-caixa').append(carimbo);
      // cada delegação vê o próprio custo e ganho na sua linha (quem prometeu zero não paga nada: o "carona")
      quem.forEach(pid => {
        const sub = el.querySelector(`.onu-linha[data-pid="${pid}"] .onu-linha-sub`), n = comp[pid];
        sub.innerHTML = n ? `${ICO('☀')} limpa +${n * 6} · ${ICO('💰')} economia −${n === 2 ? 3 : 1}` : `${ICO('💰')} não pagou nada agora`;
        sub.classList.add('onu-custo');
      });
      await carimbar(carimbo.firstElementChild, { som: 'martelo', tremida: .4 });
      efeitoSom(resultado.sucesso ? 'sucesso' : 'descer');
      if (resultado.sucesso) confeteDe(carimbo.firstElementChild, { particleCount: 40 });
      const zero = quem.filter(p => !comp[p]), altos = quem.filter(p => comp[p] === 2);
      const frase = resultado.sucesso
        ? `Acordo histórico! A soma chegou a ${resultado.soma}, e a meta era ${meta}.`
        : `Sem acordo: a soma ficou em ${resultado.soma}, e a meta era ${meta}.`;
      const lista = (ps, M) => listaNomes(ps.map((p, i) => (i || !M ? com(p) : Com(p))));
      const carona = M => (zero.length ? `${lista(zero, M)} não ${zero.length > 1 || plural(zero[0]) ? 'prometeram' : 'prometeu'} nada` : '');
      const porque = resultado.sucesso
        ? `${altos.length ? `${esc(lista(altos, true))} ${altos.length > 1 || plural(altos[0]) ? 'pagaram' : 'pagou'} mais caro agora para o clima melhorar para todos. ` : ''}${zero.length ? esc(carona(true)) + ` e mesmo assim ${zero.length > 1 || plural(zero[0]) ? 'ganham' : 'ganha'} com o esforço dos outros: é o “carona” da <b>tragédia dos comuns</b>.` : 'Ninguém pegou carona: todos fizeram a sua parte.'}`
        : `Cortar emissões custa caro para quem corta, mas o clima melhor é de todos, até de quem não fez nada. Quando cada um espera o esforço do outro, ninguém faz: é a <b>tragédia dos comuns</b>${zero.length ? ` (${esc(carona(false))})` : ''}.`;
      esq.classList.add('onu-cop-resultado');
      esq.querySelector('.onu-cop-opcoes')?.remove();
      esq.querySelector('.onu-cop-regra')?.remove();
      await mostrarConsequencias(esq, rodape, { frase, mudancas: resultado.mudancas.filter(m => m.quem === 'global'), porque, titulo: 'O que muda no mundo', max: 3, porqueEm: $('.onu-cop-dir') });
      await fecharPainel(el);
      musica(humor || 'jogo');
      if (resultado.sucesso) await aguardar(Promise.race([Promise.resolve(mapa('efeito', 'cop', null)), espera(2400)]));
      return resultado;
    } finally {
      if (el.isConnected) { el.remove(); }
      document.querySelectorAll('.onu-privado').forEach(x => x.remove());
    }
  }
  async function copSecreto(e, pid, meta) {
    const opcoes = COP_OPCOES.map(o => `<button class="btn peca pinos onu-voto onu-cop-botao ${o.botao}" type="button" data-acao="${o.n}" data-teste="cop-${o.n}">
      <span class="onu-voto-glifo num">${o.n}</span><span class="onu-voto-palavra">${o.nome}</span><small>${o.efeito.replace(' · ', '<br>')}</small></button>`).join('');
    const conteudo = `<p class="onu-privado-pauta">${ICO('🌡')}<b>Quanto vocês prometem cortar?</b></p><p class="onu-privado-meta">Meta da cúpula: a soma de todos chegar a ${meta}.</p>`;
    const el = await telaSecreta(e, pid, { pre: 'Vez de prometer', conteudo, opcoes, teclas: `${tecla('0')} · ${tecla('1')} · ${tecla('2')}`, carimbo: 'GUARDADA', classeCarimbo: 'indigo', icone: '🔒', objeto: 'envelope-secreto' });
    const v = await esperarBotao(el.querySelector('.onu-votos'), { teclas: { 0: '0', 1: '1', 2: '2' } });
    await confirmarSecreto(el);
    return +v;
  }

  // ============================== CONTRATO: PEDIDO DE AJUDA (doação) ==============================
  async function doacao(e, evento, local) {
    pidsN = pidsDe(e).length;
    const id = evento?.id ?? evento;
    const ev = typeof EVENTOS !== 'undefined' ? EVENTOS.find(x => x.id === id) : null;
    const esc0 = ev?.escolha;
    if (!ev || esc0?.tipo !== 'doacao') return { sucesso: false, total: 0, mudancas: [] };
    const rec = RECURSOS.find(r => r.id === esc0.recurso) || RECURSOS[0], meta = esc0.meta, quem = pidsDe(e);
    const lugar = local || ev.local;
    const el = criar(`<section class="painel peca pinos painel-g cat-pessoas onu-doacao" aria-labelledby="onu-doa-tit">
      <header class="painel-cab">${ART('caixa-ajuda', 'painel-objeto')}
        <h2 class="painel-titulo" id="onu-doa-tit">Pedido de ajuda<small class="painel-sub">${esc(ev.titulo)}${typeof lugar === 'string' && dado(lugar) ? ' · ' + esc(nome(lugar)) : ''}</small></h2>
        <span class="pilula onu-meta-chip">${ICO('🎯')} Meta: ${meta} ${ICO(rec.ico)}</span></header>
      <div class="tela onu-doa-tela">
        <div class="onu-doa-esq"><ol class="onu-delegacoes" aria-label="Delegações">${quem.map(p => linhaDelegacao(e, p, { marcas: false }).replace('<span class="onu-linha-sub">', `<span class="onu-linha-sub"><span class="onu-tem">tem ${e.potencias[p].recursos[rec.id]} ${ICO(rec.ico)}</span> · `)).join('')}</ol></div>
        <div class="onu-doa-dir">
          <div class="onu-medidor-caixa"><p class="onu-medidor-tit"><b>${esc(rec.nome)} doados</b> <span class="num onu-soma" aria-live="polite">0</span><span class="num"> de ${meta}</span></p>
            <div class="onu-medidor onu-doa-medidor" role="meter" aria-label="${esc(rec.nome)} doados" aria-valuemin="0" aria-valuemax="${meta}" aria-valuenow="0">
              ${Array.from({ length: meta }, (_, i) => `<span class="onu-encaixe${i === meta - 1 ? ' meta' : ''}"></span>`).join('')}
              <span class="onu-bandeira-meta" style="--pos:${meta}"><b>META ${meta}</b></span></div></div>
          <div class="onu-doa-area">
            <div class="onu-doa-info"><p class="onu-doa-texto">${esc(ev.texto || '')}</p>
              <p class="onu-pauta-efeitos"><b>${ICO('✅')} Se a meta for atingida:</b> ${chipsEfeitos({ efeitos: esc0.sucesso }, null)}</p>
              <p class="onu-pauta-efeitos"><b>${ICO('❌')} Se faltar ajuda:</b> ${chipsEfeitos({ efeitos: esc0.fracasso }, null)}</p></div>
            <p class="onu-doa-nota">${ICO('❤')}Doar custa recursos agora, mas quem ajuda ganha influência no lugar atingido e apoio em casa.</p>
          </div>
        </div></div>
      <footer class="painel-rodape"><span class="dica">${ICO('📦')} Cada delegação decide, na sua vez, quanto pode doar.</span></footer></section>`);
    const $ = sel => el.querySelector(sel), rodape = $('.painel-rodape');
    try {
      await abrirPainel(el);
      preencherRetratos(el, e);
      const doacoes = {}, med = $('.onu-medidor'), somaEl = $('.onu-soma');
      let k = 0;
      const encher = async (pid, n, origem) => {
        for (let i = 0; i < n; i++) {
          let slot = med.querySelectorAll('.onu-encaixe')[k];
          if (!slot) { slot = criar('<span class="onu-encaixe extra"></span>'); med.insertBefore(slot, med.querySelector('.onu-bandeira-meta')); }
          slot.innerHTML = `<i class="onu-tijolinho onu-caixinha" data-equipe="${pid}">${ICO(rec.ico)}</i>`;
          const novo = slot.firstElementChild;
          if (!RM && origem) { const a = origem.getBoundingClientRect(), b = slot.getBoundingClientRect(); await fim(gsap.fromTo(novo, { x: a.left - b.left, y: a.top - b.top, scale: .6 }, { x: 0, y: 0, scale: 1, duration: .38, ease: 'power2.inOut' })); }
          else await espera(120);
          uSom('tijolo', { i: k });
          k++; somaEl.textContent = k; popNumero(somaEl); med.setAttribute('aria-valuenow', k);
          if (k === meta) med.classList.add('chegou');
        }
      };
      for (const pid of quem) {
        const l = el.querySelector(`.onu-linha[data-pid="${pid}"]`), cel = l.querySelector('.onu-linha-estado'), tem = e.potencias[pid].recursos[rec.id];
        el.querySelectorAll('.onu-linha').forEach(x => x.classList.toggle('vez', x === l));
        l.scrollIntoView({ block: 'nearest' });
        let n;
        if (humano(e, pid)) {
          cel.innerHTML = '<span class="onu-espera">decidindo</span>';
          rodape.innerHTML = `<p class="onu-doa-pergunta">${retrato(e, pid, { classe: 'medio', tamanho: 96 })}<span><b>${esc(nome(pid))}, quanto vocês doam?</b>
              <small>Vocês têm ${tem} ${ICO(rec.ico)} de ${esc(rec.nome.toLowerCase())}</small></span></p>
            <span class="onu-doar" role="group" aria-label="Quanto ${esc(com(pid))} ${verbo(pid, 'doa', 'doam')}">${[0, 1, 2, 3].map(q => `<button class="btn peca ${q ? 'pinos amarela' : 'btn-neutro'}" type="button" data-acao="${q}" data-teste="doar-${q}"${q > tem ? ' disabled' : ''}>${q ? `<b class="num">${q}</b>${ICO(rec.ico)}` : 'Não doar'}</button>`).join('')}</span>`;
          preencherRetratos(rodape, e);
          if (!RM) gsap.from(rodape.querySelectorAll('.onu-doar .btn'), { y: 2 * uPx(), opacity: 0, duration: .3, stagger: .05, ease: 'back.out(2)' });
          rodape.querySelector('.onu-doar button:not(:disabled)')?.focus({ preventScroll: true });
          n = +(await esperarBotao(rodape.querySelector('.onu-doar'), { teclas: Object.fromEntries([0, 1, 2, 3].filter(q => q <= tem).map(q => [q, String(q)])) }));
          rodape.innerHTML = `<span class="dica">${ICO('📦')} Cada delegação decide, na sua vez, quanto pode doar.</span>`;
        } else { await espera(450 + Math.random() * 300); n = Simulacao.iaDoacao(e, pid, rec.id); }
        doacoes[pid] = n;
        if (n) { const t = l.querySelector('.onu-tem'); if (t) t.innerHTML = `tem ${tem - n} ${ICO(rec.ico)}`; }
        cel.innerHTML = n ? `<span class="onu-doou"><b class="num">${n}</b>${ICO(rec.ico)} <span>doou</span></span>` : '<span class="onu-espera onu-nao-doou">não doou</span>';
        if (!RM) gsap.from(cel.firstElementChild, { scale: .5, duration: .3, ease: 'back.out(2.4)' });
        if (n) { efeitoSom('pop'); await encher(pid, n, cel); } else efeitoSom('clique');
      }
      el.querySelectorAll('.onu-linha').forEach(x => x.classList.remove('vez'));
      const resultado = Simulacao.resolverDoacao(e, ev.id, local, doacoes);
      await espera(400);
      const carimbo = criar(`<div class="onu-carimbo-linha"><span class="carimbo grande ${resultado.sucesso ? 'verde' : 'cinza'}">${resultado.sucesso ? GLIFOS.ok + ' META ATINGIDA' : GLIFOS.nao + ' FALTOU AJUDA'}</span></div>`);
      $('.onu-medidor-caixa').append(carimbo);
      await carimbar(carimbo.firstElementChild, { som: 'martelo', tremida: .3 });
      efeitoSom(resultado.sucesso ? 'sucesso' : 'descer');
      const doaram = quem.filter(p => doacoes[p] > 0);
      const frase = resultado.sucesso
        ? `Ajuda a caminho! Chegaram ${unidades(resultado.total)} de ${rec.nome.toLowerCase()}, e a meta era ${meta}.`
        : `Faltou ajuda: ${resultado.total === 1 ? 'chegou' : 'chegaram'} ${unidades(resultado.total)} de ${rec.nome.toLowerCase()}, e a meta era ${meta}.`;
      const porque = (resultado.sucesso
        ? 'Com ajuda a tempo, menos gente precisa deixar a própria casa e a região se recupera mais rápido.'
        : 'Sem ajuda suficiente, a região demora a se recuperar e mais gente precisa fugir.') +
        (doaram.length ? ` Quem doou (${esc(listaNomes(doaram.map(nomeCurtoPid)))}) ganhou influência ali e apoio em casa.` : '');
      const area = $('.onu-doa-area');
      area.classList.add('onu-doa-resultado');
      await mostrarConsequencias(area, rodape, { frase, mudancas: resultado.mudancas.filter(m => m.v !== 'influencia' && m.v !== 'apoio'), porque, titulo: 'O que muda', max: 4, ocultar: ev.titulo, porqueEm: $('.onu-doa-esq') });
      await fecharPainel(el);
      return resultado;
    } finally { if (el.isConnected) el.remove(); }
  }

  // ============================== CONTRATO: REUNIÃO DE EMERGÊNCIA (modo infiltrado) ==============================
  async function reuniaoEmergencia(e, pid) {
    pidsN = pidsDe(e).length;
    const humanos = pidsDe(e).filter(p => humano(e, p));
    const humor = humorAtual();
    let s = null;
    try {
      await convocacao({ cs: true, titulo: 'REUNIÃO DE EMERGÊNCIA!', pre: `Convocada ${com(pid, 'por')}`, sub: 'Quem é o agente infiltrado?', quem: pid, e });
      musica('assembleia');
      s = abrirSessao(e, { emergencia: true, titulo: 'Reunião de emergência', sub: 'Quem é o agente infiltrado?', objeto: 'megafone', avatares: pidsDe(e).map(p => avatarDe(e, p)) });
      s.tela.innerHTML = `<div class="onu-regra onu-cs"><span class="soquete">${ICO('🕵')}</span>
          <p><b>Uma delegação tem uma agenda secreta</b> contra as Metas 2050. Conversem por 1 minuto e votem em quem vocês acham que é.
          Errar custa caro: o acusado perde 2 CP e a tensão mundial sobe 5.</p></div>
        <ol class="onu-delegacoes" aria-label="Suspeitos">${humanos.map(p => linhaDelegacao(e, p, { marcas: false })).join('')}</ol>`;
      // pistas: ficha embaixo da sala (onde fica a pauta numa votação), com espaço para letra grande
      const pistas = criar(`<article class="onu-pauta onu-pistas peca flutua" aria-label="Pistas para conversar">
        ${ART('lupa', 'onu-pauta-arte')}
        <div class="onu-pauta-corpo"><h3 class="onu-pauta-titulo">Pistas para conversar</h3>
          <p class="onu-pauta-texto">A agenda secreta é uma destas. Quem agiu assim nos últimos mandatos?</p>
          <ul>${[['🌡', 'Esquentar o planeta', 'travou acordos do clima'], ['⏰', 'Aumentar a tensão', 'armou-se e sancionou'], ['🚢', 'Travar o comércio', 'tarifas e sanções'], ['🧳', 'Fechar as portas', 'não ajudou quem fugia']]
            .map(([i, t, d]) => `<li>${ICO(i)}<span><b>${t}</b><small>${d}</small></span></li>`).join('')}</ul></div></article>`);
      s.el.insertBefore(pistas, s.tablet);
      if (!RM) gsap.from(pistas, { y: 8 * uPx(), opacity: 0, duration: .45, ease: 'back.out(1.6)', delay: .25 });
      linha(s, pid)?.querySelector('.onu-linha-marcas')?.insertAdjacentHTML('beforeend', `<span class="onu-megafone">${ART('megafone')}<span class="so-leitor">convocou a reunião</span></span>`);
      preencherRetratos(s.tela, e);
      if (!RM) gsap.from(s.tela.querySelectorAll('.onu-regra, .onu-linha'), { y: 1.4 * uPx(), opacity: 0, duration: .3, stagger: .06, ease: 'power2.out', delay: .2 });
      await aguardar(Promise.race([s.cena, espera(2500)]));
      // discussão: 60 s (pulável)
      tituloSessao(s, 'Discussão');
      narrar(s, '💬', 'Discutam: quem está atrapalhando as Metas 2050? Que pistas vocês têm?');
      s.rodape.innerHTML = `<span class="cronometro peca" role="timer" aria-label="Tempo da discussão">1:00</span>
        <button class="btn btn-principal peca pinos" type="button" data-acao="votar" data-teste="continuar-painel">Votar agora ${GLIFOS.seta}</button>`;
      const parar = esperarBotao(s.rodape);
      await contagem(s.rodape.querySelector('.cronometro'), 60, parar);
      parar.parar();
      // votos secretos: cada equipe acusa alguém (ou pula)
      tituloSessao(s, 'Votação secreta');
      narrar(s, '🔒', 'Cada equipe vota na sua vez, em segredo.');
      const votos = {};
      progresso(s, humanos);
      for (const p of humanos) {
        marcarVez(s, p);
        votos[p] = await acusacaoSecreta(e, p, humanos);
        await carimbarLinha(s, p, carimboVotou(), { som: 'voto' });
        contar(s, p);
      }
      // revelação: cada voto vira um tijolinho na linha do acusado
      tituloSessao(s, 'Revelação');
      const fichaPistas = s.el.querySelector('.onu-pistas');
      if (fichaPistas) { await fim(gsap.to(fichaPistas, { opacity: 0, y: RM ? 0 : 4 * uPx(), duration: RM ? .15 : .25, ease: 'power2.in' })); fichaPistas.remove(); }
      s.tela.querySelector('.onu-regra')?.remove();
      s.tela.classList.add('onu-revelando');
      narrar(s, '🔎', 'Cada voto vira um tijolinho na linha de quem foi acusado.');
      s.tela.querySelectorAll('.onu-linha').forEach(l => { l.classList.remove('vez'); l.querySelector('.onu-linha-estado').innerHTML = '<span class="onu-pilha"></span>'; });
      abaixarTrilha(true);
      await espera(600);
      for (const [i, p] of humanos.entries()) {
        const a = votos[p];
        if (!a) continue;
        const pilha = linha(s, a)?.querySelector('.onu-pilha');
        if (!pilha) continue;
        pilha.insertAdjacentHTML('beforeend', tijolinho(p));
        if (!RM) gsap.from(pilha.lastElementChild, { y: -5 * uPx(), scaleY: 1.2, duration: .42, ease: 'power2.in' });
        uSom('tijolo', { i });
        await espera(RM ? 300 : 520);
      }
      const tensao0 = e.global.tensao, cp0 = e.potencias[pid]?.cp ?? 0;
      const res = Simulacao.reuniaoEmergencia(e, pid, votos);
      await espera(500);
      abaixarTrilha(false);
      if (res.acusado) {
        if (s.tem3D) Promise.race([Cenas3D.fala(res.acusado) || Promise.resolve(), espera(1400)]).catch(() => {});
        acaoBoneco(res.acusado, res.acertou ? 'surpreso' : 'triste');
      }
      const C = !res.acusado ? ['cinza', GLIFOS.menos, 'SEM MAIORIA'] : res.acertou ? ['vermelho', ICO('🕵'), 'INFILTRADO!'] : ['indigo', ICO('🕊'), 'DIPLOMATA'];
      const w = criar(`<div class="onu-veto-grande onu-acusacao">${res.acusado ? `<span class="onu-veto-quem letra-bolha relevo">${esc(Com(res.acusado))} era…</span>` : ''}<span class="carimbo ${C[0]}">${C[1]} ${C[2]}</span></div>`);
      s.sobre.append(w);
      if (res.acusado) linha(s, res.acusado)?.classList.add('acusado');
      await carimbar(w.firstElementChild, { som: res.acertou ? 'trovao' : 'martelo', tremida: .4 });
      efeitoSom(res.acertou ? 'sucesso' : 'descer');
      const frase = !res.acusado ? 'Sem maioria: ninguém foi acusado.'
        : res.acertou ? `${Com(res.acusado)} era o agente infiltrado!` : `${Com(res.acusado)} não era o agente infiltrado.`;
      const mud = [];
      if (e.potencias[pid] && e.potencias[pid].cp !== cp0) mud.push({ quem: pid, v: 'cp', antes: cp0, depois: e.potencias[pid].cp, motivo: 'convocar a reunião' });
      if (e.global.tensao !== tensao0) mud.push({ quem: 'global', v: 'tensao', antes: tensao0, depois: e.global.tensao, motivo: 'acusação errada' });
      const fatos = [
        res.acertou ? itemTexto('🕵', 'Agenda secreta exposta', `a agenda ${com(res.acusado, 'de')} não vale mais`) : '',
        res.acusado && !res.acertou ? itemTexto('🧱', 'Capital Político −2', `${com(res.acusado)} na próxima vez`) : '',
        !res.acusado ? itemTexto('🕵', 'Ninguém foi acusado', 'o infiltrado continua no jogo') : '',
      ].join('');
      const lista = `<ul class="onu-mudancas">${fatos}${agrupar(mud).map(g => itemMudanca(g, '')).join('')}</ul>`;
      const porque = !res.acusado ? 'Sem maioria, a reunião termina sem acusado, e quem convocou gastou 2 CP à toa. O infiltrado continua entre vocês…'
        : res.acertou ? 'A agenda secreta foi exposta e não vale mais. Desconfiar com provas, conversando, protegeu as Metas 2050.'
        : `Acusar sem provas tem preço: ${esc(com(res.acusado))} ${verbo(res.acusado, 'começa', 'começam')} a próxima vez com 2 CP a menos, e a desconfiança fez a tensão mundial subir. O infiltrado continua entre vocês…`;
      const area = criar('<div class="onu-conseq-area"></div>');
      s.tela.append(area);
      await mostrarConsequencias(area, s.rodape, { frase, mudancas: lista, porque, titulo: 'O que muda', sai: humanos.length > 4 ? [s.tela.querySelector('.onu-delegacoes')] : [] });
      await fecharSessao(s);
      s = null;
      musica(humor || 'jogo');
      return { ...res, votos };
    } finally {
      limparSessao(s);
      if (s) musica(humor || 'jogo');
    }
  }
  async function acusacaoSecreta(e, pid, humanos) {
    const suspeitos = humanos.filter(p => p !== pid);
    const opcoes = suspeitos.map((p, i) => `<button class="btn btn-neutro peca pinos onu-voto onu-suspeito" type="button" data-acao="${p}" data-teste="acusar" data-id="${p}">
        ${retrato(e, p, { classe: 'medio', tamanho: 96 })}<span class="onu-voto-palavra">${esc(nomeCurtoPid(p))}</span><kbd>${i + 1}</kbd></button>`).join('') +
      `<button class="btn peca pinos onu-voto btn-neutro cinza" type="button" data-acao="" data-teste="voto-abst"><span class="onu-voto-glifo">${GLIFOS.menos}</span><span class="onu-voto-palavra">Pular</span><kbd>P</kbd></button>`;
    const conteudo = `<p class="onu-privado-pauta">${ICO('🕵')}<b>Quem é o agente infiltrado?</b></p>`;
    const teclas = Object.fromEntries([...suspeitos.map((p, i) => [String(i + 1), p]), ['P', '']]);
    const el = await telaSecreta(e, pid, { conteudo, opcoes, teclas: `números ${suspeitos.map((_, i) => tecla(i + 1)).join(' ')} · ${tecla('P')} pular` });
    const v = await esperarBotao(el.querySelector('.onu-votos'), { teclas });
    await confirmarSecreto(el);
    return v || null;
  }

  // ============================== CONTRATO: NEGOCIAR (troca de recursos) ==============================
  function negociar(e, pid) {
    const outros = pidsDe(e).filter(p => p !== pid);
    const sancao = p => (e.sancoes || []).some(s => (s.de === pid && s.contra === p) || (s.de === p && s.contra === pid));
    const el = criar(`<section class="painel peca pinos painel-m onu-negociar" data-equipe="${pid}" aria-labelledby="onu-neg-tit">
      <header class="painel-cab">${ART('aperto-maos', 'painel-objeto')}
        <h2 class="painel-titulo" id="onu-neg-tit">Negociar<small class="painel-sub">Troca direta de recursos · 0 CP · 1 vez por vez</small></h2></header>
      <div class="tela onu-neg-tela"></div>
      <footer class="painel-rodape"></footer></section>`);
    const tela = el.querySelector('.tela'), rodape = el.querySelector('.painel-rodape');
    const estoque = (p, r) => e.potencias[p].recursos[r];
    const itens = troca => RECURSOS.filter(r => troca[r.id] > 0).map(r => `<span class="onu-item"><b class="num">${troca[r.id]}</b>${ICO(r.ico)}<span>${esc(r.nome.toLowerCase())}</span></span>`).join('') || '<span class="onu-item vazio">nada</span>';
    const titulo = (t, sub) => { el.querySelector('.painel-titulo').innerHTML = `${esc(t)}<small class="painel-sub">${esc(sub)}</small>`; };
    const vazio = t => RECURSOS.every(r => !t[r.id]);
    let para = null, oferta = {}, pedido = {};
    const entra = () => { if (!RM) gsap.from(tela.children, { y: 1.4 * uPx(), opacity: 0, duration: .26, stagger: .05, ease: 'power2.out' }); };

    function passoParceiro() {
      titulo('Negociar', 'Troca direta de recursos · 0 CP · 1 vez por vez');
      tela.innerHTML = `<p class="onu-neg-pergunta">${ICO('🤝')} Com quem vocês querem negociar?</p>
        <div class="lista-opcoes onu-neg-parceiros" role="radiogroup" aria-label="Parceiro da troca">
        ${outros.map(p => {
          const bloq = sancao(p);
          return `<button class="opcao peca${bloq ? ' bloqueado' : ''}" type="button" role="radio" aria-checked="${p === para}" data-parceiro="${p}"${bloq ? ' aria-disabled="true"' : ''}>
            ${retrato(e, p, { tamanho: 96 })}<span><span class="opcao-nome">${esc(nome(p))}</span>
            <span class="opcao-detalhe">${bloq ? 'Há sanções entre vocês: comércio bloqueado' : esc(quemJoga(e, p))}</span></span>
            <span class="opcao-fim onu-mini-estoque">${RECURSOS.map(r => `<span>${ICO(r.ico)}<b class="num">${estoque(p, r.id)}</b></span>`).join('')}</span>
            ${bloq ? `<span class="cadeado">${ICO('🔒')}</span>` : ''}</button>`;
        }).join('')}</div>
        <p class="onu-neg-nota">${ICO('🌍')}Cada país tem sobra de umas coisas e falta de outras. Trocar é a <b>interdependência</b> na prática.</p>`;
      rodape.innerHTML = `<button class="btn btn-neutro peca" type="button" data-acao="cancelar" data-teste="cancelar">Cancelar</button>
        <button class="btn btn-principal peca pinos" type="button" data-acao="seguir" data-teste="confirmar"${para ? '' : ' disabled'}>Montar a troca ${GLIFOS.seta}</button>`;
      preencherRetratos(tela, e); entra();
    }
    function lado(p, troca, rotulo, dono) {
      return `<div class="onu-troca-lado peca" data-lado="${dono}"><p class="onu-troca-tit" data-equipe="${p}">${formaDe(p, { branca: true })}<span>${esc(rotulo)}</span></p>
        ${RECURSOS.map(r => `<div class="onu-recurso"><span class="soquete">${ICO(r.ico)}</span>
          <span class="onu-rec-nome">${esc(r.nome)}<small>${verbo(p, 'tem', 'têm')} ${estoque(p, r.id)}</small></span>
          <button class="btn btn-ic peca redondo" type="button" data-passo="-1" data-rec="${r.id}" data-dono="${dono}" aria-label="Menos ${esc(r.nome.toLowerCase())}"${troca[r.id] ? '' : ' disabled'}>${GLIFOS.menos}</button>
          <b class="num onu-qtd" aria-live="polite">${troca[r.id] || 0}</b>
          <button class="btn btn-ic peca redondo" type="button" data-passo="1" data-rec="${r.id}" data-dono="${dono}" aria-label="Mais ${esc(r.nome.toLowerCase())}"${(troca[r.id] || 0) < estoque(p, r.id) ? '' : ' disabled'}>${GLIFOS.mais}</button></div>`).join('')}</div>`;
    }
    // meio da troca: o aperto de mãos com uma seta para cada lado, na cor de quem entrega
    const meioTroca = (de, ate) => `<span class="onu-troca-meio" aria-hidden="true">
        <span class="onu-seta-troca" data-equipe="${de}">${GLIFOS.seta}</span>${ART('aperto-maos')}<span class="onu-seta-troca volta" data-equipe="${ate}">${GLIFOS.voltar}</span></span>`;
    function passoTroca() {
      titulo(`Troca com ${com(para)}`, `${humano(e, para) ? 'Quem responde é a ' + nomeEquipe(para) : 'Quem responde é o computador'} · escolham o que dão e o que pedem`);
      tela.innerHTML = `<div class="onu-troca">${lado(pid, oferta, 'Vocês dão', 'oferta')}
          ${meioTroca(pid, para)}
          ${lado(para, pedido, `Vocês recebem ${com(para, 'de')}`, 'pedido')}</div>
        <p class="onu-neg-nota">${ICO('💡')}${humano(e, para) ? `A ${esc(nomeEquipe(para))} decide na tela se aceita.` : 'O computador só aceita trocas que valham mais para ele: ofereçam o que falta lá.'}</p>`;
      rodape.innerHTML = `<button class="btn btn-neutro peca" type="button" data-acao="voltar">${GLIFOS.voltar} Outro parceiro</button>
        <button class="btn btn-neutro peca" type="button" data-acao="cancelar" data-teste="cancelar">Cancelar</button>
        <button class="btn btn-principal peca pinos" type="button" data-acao="propor" data-teste="confirmar"${vazio(oferta) && vazio(pedido) ? ' disabled' : ''}>Propor troca ${GLIFOS.seta}</button>`;
      entra();
    }
    function passoAceitar() {
      el.dataset.equipe = para;
      titulo(`Proposta para ${com(para)}`, `${nomeEquipe(para)}, venham até o computador`);
      tela.innerHTML = `<div class="onu-proposta-resumo">
          <div class="onu-troca-lado peca"><p class="onu-troca-tit" data-equipe="${para}">${formaDe(para, { branca: true })}<span>Vocês recebem</span></p><div class="onu-itens">${itens(oferta)}</div></div>
          ${meioTroca(pid, para)}
          <div class="onu-troca-lado peca"><p class="onu-troca-tit" data-equipe="${para}">${formaDe(para, { branca: true })}<span>Vocês dão</span></p><div class="onu-itens">${itens(pedido)}</div></div></div>
        <p class="onu-neg-pergunta">${retrato(e, pid, { tamanho: 96 })} ${esc(Com(pid))} ${verbo(pid, 'propõe', 'propõem')} esta troca. Vocês aceitam?</p>`;
      rodape.innerHTML = `<button class="btn btn-perigo peca pinos" type="button" data-acao="recusar" data-teste="cancelar">${GLIFOS.nao} Recusar</button>
        <button class="btn btn-confirmar peca pinos" type="button" data-acao="aceitar" data-teste="confirmar">${GLIFOS.ok} Aceitar</button>`;
      preencherRetratos(tela, e); entra();
      efeitoSom('vez');
    }
    async function passoResultado(r) {
      el.dataset.equipe = pid;
      titulo(r.aceita && r.ok ? 'Negócio fechado' : 'Troca recusada', `${nome(pid)} e ${nome(para)}`);
      const ok = r.aceita && r.ok;
      tela.innerHTML = `<div class="onu-neg-resultado">
          <div class="onu-neg-carimbo">${ART(ok ? 'aperto-maos' : 'cadeado', 'onu-neg-arte')}<span class="carimbo grande ${ok ? 'verde' : 'cinza'}">${ok ? GLIFOS.ok + ' FECHADO!' : GLIFOS.nao + ' RECUSADA'}</span></div>
          <p class="onu-frase"></p>
          ${ok ? `<div class="onu-estoques">${[pid, para].map(p => `<div class="onu-estoque peca"><p class="onu-troca-tit" data-equipe="${p}">${formaDe(p, { branca: true })}<span>${esc(nome(p))}</span></p>
            ${RECURSOS.map(x => { const d = (p === pid ? 1 : -1) * ((pedido[x.id] || 0) - (oferta[x.id] || 0)); return `<span class="onu-item${d ? ' mudou' : ''}"><span>${ICO(x.ico)}</span><b class="num">${estoque(p, x.id)}</b>${d ? `<i class="pilula ${d > 0 ? 'ganho' : 'perda'}">${sinal(d)}</i>` : ''}</span>`; }).join('')}</div>`).join('')}</div>` : ''}
          <p class="onu-neg-nota">${ICO('💡')}${ok ? 'Os dois lados saem ganhando quando cada um entrega o que tem de sobra: é a <b>vantagem comparativa</b>. E o comércio mundial cresce um pouco.'
            : esc(r.motivo || 'Sem acordo desta vez. Tentem oferecer o que falta para o outro lado.')}</p></div>`;
      rodape.innerHTML = '';
      await carimbar(tela.querySelector('.carimbo'), { som: ok ? 'martelo' : 'descer', tremida: ok ? .25 : 0 });
      if (ok) { efeitoSom('sucesso'); confeteDe(tela.querySelector('.carimbo'), { particleCount: 16, colors: [corDe(pid), corDe(para), '#FFD21F'] }); }
      await datilografar(tela.querySelector('.onu-frase'), ok
        ? `${Com(pid)} ${verbo(pid, 'deu', 'deram')} ${textoTroca(oferta)} e ${verbo(pid, 'recebeu', 'receberam')} ${textoTroca(pedido)}.`
        : `${Com(para)} ${verbo(para, 'recusou', 'recusaram')} a troca.`);
      await esperarContinuar(rodape, 'Continuar');
    }
    const textoTroca = t => listaNomes(RECURSOS.filter(r => t[r.id] > 0).map(r => `${unidades(t[r.id])} de ${r.nome.toLowerCase()}`)) || 'nada';

    return new Promise((ok, falha) => {
      let feito = false, passo = 'parceiro';
      const terminar = async v => { if (feito) return; feito = true; await fecharPainel(el).catch(() => {}); ok(v); };
      el.addEventListener('click', async ev => {
        if (feito) return;
        const parc = ev.target.closest('[data-parceiro]');
        if (parc && passo === 'parceiro') {
          if (parc.getAttribute('aria-disabled') === 'true') { aviso('Há sanções entre vocês: o comércio está bloqueado.', { tipo: 'ruim', icone: ICO('🔒') }); return; }
          efeitoSom('clique'); para = parc.dataset.parceiro;
          el.querySelectorAll('[data-parceiro]').forEach(b => b.setAttribute('aria-checked', b === parc));
          rodape.querySelector('[data-acao="seguir"]').disabled = false;
          return;
        }
        const pas = ev.target.closest('[data-passo]');
        if (pas && !pas.disabled) {
          const t = pas.dataset.dono === 'oferta' ? oferta : pedido, dono = pas.dataset.dono === 'oferta' ? pid : para, r = pas.dataset.rec;
          t[r] = Math.max(0, Math.min(estoque(dono, r), (t[r] || 0) + +pas.dataset.passo));
          const linhaR = pas.closest('.onu-recurso'), q = linhaR.querySelector('.onu-qtd');
          q.textContent = t[r]; popNumero(q);
          linhaR.querySelector('[data-passo="-1"]').disabled = !t[r];
          linhaR.querySelector('[data-passo="1"]').disabled = t[r] >= estoque(dono, r);
          rodape.querySelector('[data-acao="propor"]').disabled = vazio(oferta) && vazio(pedido);
          efeitoSom(+pas.dataset.passo > 0 ? 'pop' : 'clique');
          if (pas.disabled) linhaR.querySelector(`[data-passo="${-pas.dataset.passo}"]`)?.focus({ preventScroll: true });
          return;
        }
        const b = ev.target.closest('[data-acao]');
        if (!b || b.disabled || !el.contains(b)) return;
        efeitoSom('clique');
        const a = b.dataset.acao;
        try {
          if (a === 'cancelar') return terminar(null);
          if (a === 'seguir' && para) { passo = 'troca'; passoTroca(); rodape.querySelector('[data-acao="propor"]')?.focus({ preventScroll: true }); return; }
          if (a === 'voltar') { passo = 'parceiro'; oferta = {}; pedido = {}; passoParceiro(); return; }
          if (a === 'propor') {
            if (humano(e, para)) { passo = 'aceitar'; passoAceitar(); return; }
            passo = 'pensando';
            tela.innerHTML = `<div class="onu-pensando">${ART('ampulheta', 'onu-pensando-arte')}<p>${esc(Com(para))} ${verbo(para, 'está', 'estão')} pensando…</p></div>`;
            rodape.innerHTML = '';
            if (!RM) gsap.fromTo(tela.querySelector('.onu-pensando-arte'), { rotation: -8 }, { rotation: 8, duration: .45, yoyo: true, repeat: 3, ease: 'sine.inOut' });
            await espera(1100);
            return concluir(Simulacao.iaAceitaTroca(e, para, oferta, pedido));
          }
          if (a === 'aceitar' || a === 'recusar') return concluir(a === 'aceitar');
        } catch (erro) { if (erro !== CANCELADA) falha(erro); else { feito = true; ok(null); } }
      });
      async function concluir(aceita) {
        passo = 'fim';
        const r = { ok: false, aceita, para, oferta: { ...oferta }, pedido: { ...pedido }, motivo: aceita ? '' : `${Com(para)} não ${verbo(para, 'aceitou', 'aceitaram')}.` };
        if (aceita) { const n = Simulacao.negociar(e, pid, para, oferta, pedido); r.ok = !!n.ok; if (!n.ok) r.motivo = n.motivo; }
        try { await passoResultado(r); } catch (erro) { if (erro === CANCELADA) { feito = true; return ok(null); } return falha(erro); }
        feito = true; await fecharPainel(el).catch(() => {}); ok(r);
      }
      passoParceiro();
      abrirPainel(el, { esc: () => { if (!feito && passo !== 'fim') { feito = true; ok(null); } } }).catch(() => {});
    });
  }

  return { proporResolucao, votacao, cop, doacao, reuniaoEmergencia, negociar, _convocacao: convocacao };
})();
