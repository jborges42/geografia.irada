'use strict';
/* Geografia Irada — Plantão Global: cada evento do Jornal Mundial vira um telejornal de brinquedo (guia de arte §4.5, §5.10).

   Plantao.noticia(e, { id, local }, mudancas) → Promise<{ id, local, escolha, resultado }>
     mudancas = o que Simulacao.aplicarEvento devolveu (a Partida aplica o evento antes de chamar).
   Sequência: vinheta (1,6 s, som 'plantao') → bancada: âncora atrás da bancada + tarja (lower third) enquanto a câmera
   voa até o lugar → efeito no mapa → números com o porquê (chips, HUD e número no mapa) → "Você sabia?" → Continuar →
   escolha: votação → ONU.votacao · doação → ONU.doacao · decisão → cada equipe humana escolhe em segredo (opcao-<n>),
   o computador decide com iaDecisao e a revelação mostra quem escolheu o quê (resolverDecisao).
   Tudo é pulável: clique, Espaço, Enter ou PageDown levam ao estado final; "Pular" (data-teste pular) vai direto à escolha.
   O painel tem data-fase (vinheta, bancada, efeito, numeros, saber, pronto, decisao, revelacao, fim) para testes e vitrine.
   A Partida não precisa repetir Hud.atualizar com estas mudanças: o Plantão já atualiza HUD e mapa. */

const Plantao = (() => {
  // ============================== TABELAS ==============================
  // Efeito no mapa de cada evento (Mapa3D.efeito); sem entrada, vale o do tipo
  const EFEITO_DO_EVENTO = {
    onda_calor: 'calor', seca_amazonia: 'seca', furacao: 'tempestade', mar_sobe: 'mar', enchentes: 'enchente', incendios: 'fogo',
    degelo_artico: 'mar', crise_petroleo: 'petroleo', pandemia: 'pandemia', ciberataque: 'ciberataque', desinformacao: 'desinformacao',
    crise_alimentar: 'seca', crise_divida: 'comercio', cabos_submarinos: 'ciberataque', mar_vermelho: 'comercio', canal_panama: 'seca',
    golpe_sahel: 'golpe', escalada: 'conflito', taiwan_estreito: 'conflito', coreia_misseis: 'conflito', mar_sul_china: 'conflito',
    essequibo: 'conflito', guerra_sudao: 'refugiados', crise_haiti: 'conflito', operacao_acolhida: 'ajuda', travessias_perigosas: 'refugiados',
    corrida_litio: 'comercio', terras_raras: 'sancao', disputa_agua: 'seca', margem_equatorial: 'petroleo', eleicoes: 'influencia',
    protestos_democracia: 'desinformacao', onda_populista: 'desinformacao', povos_tradicionais: 'paz', assembleia_onu: 'onu',
    acordo_paz: 'paz', recorde_solar: 'acordo', vacina_compartilhada: 'ajuda', olimpiada: 'onu', acordo_comercial: 'comercio',
  };
  const EFEITO_DO_TIPO = { clima: 'tempestade', crise: 'petroleo', conflito: 'conflito', migracao: 'refugiados', recursos: 'comercio', politica: 'influencia', positivo: 'paz' };
  // Eventos do mundo todo (sem lugar): a câmera mostra o mapa inteiro e o efeito aparece em alguns lugares
  const LUGARES_DO_MUNDO = {
    pandemia: ['sul_asia', 'africa_ocidental', 'ue'], desinformacao: ['eua', 'brasil', 'india'], onda_populista: ['eua', 'ue', 'brasil'],
    recorde_solar: ['china', 'india', 'ue'], vacina_compartilhada: ['africa_central', 'sul_asia', 'andes'], acordo_comercial: ['china', 'ue', 'brasil'],
  };
  const SERIOS = new Set(['clima', 'crise', 'conflito', 'migracao']);   // o âncora não sorri dando notícia triste

  // Indicadores: nome na tela, ícone, se subir é bom (1), ruim (−1) ou neutro (0), e como mostrar o valor
  const IND = {
    'global.comercio': { nome: 'Comércio', icone: '🚢', bom: 1 },
    'global.cooperacao': { nome: 'Cooperação', icone: '🕊️', bom: 1 },
    'global.temperatura': { nome: 'Temperatura', icone: '🌡️', bom: -1, casas: 2, sufixo: FINO + '°C' },
    'global.tensao': { nome: 'Relógio do Juízo Final', curto: 'Relógio', arte: 'relogio-juizo', bom: 1, conv: v => (100 - v) * 3, sufixo: FINO + 's' },
    'global.deslocados': { nome: 'Deslocados', icone: '🧳', bom: -1, sufixo: FINO + 'mi' },
    'global.energia': { nome: 'Preço da energia', icone: '🛢️', bom: -1 },
    economia: { nome: 'Economia', icone: '💰', bom: 1 }, bemEstar: { nome: 'Bem-estar', icone: '❤️', bom: 1 },
    ambiente: { nome: 'Ambiente', icone: '🌳', bom: 1 }, seguranca: { nome: 'Segurança', icone: '🛡️', bom: 1 },
    apoio: { nome: 'Apoio popular', icone: '🗳️', bom: 1 },
    estabilidade: { nome: 'Estabilidade', icone: '🏛️', bom: 1 }, desenvolvimento: { nome: 'Desenvolvimento', icone: '📈', bom: 1 },
    conflito: { nome: 'Conflito', icone: '⚠️', bom: -1, nivel: true }, pressao: { nome: 'Pressão popular', icone: '📣', bom: -1 },
    floresta: { nome: 'Floresta', icone: '🌳', bom: 1 }, influencia: { nome: 'Influência', icone: '🧱', bom: 0 },
    'recursos.alimentos': { nome: 'Alimentos', icone: '🌾', bom: 1 }, 'recursos.energia': { nome: 'Energia', icone: '🔋', bom: 1 },
    'recursos.minerais': { nome: 'Minerais', icone: '💎', bom: 1 }, 'recursos.tecnologia': { nome: 'Tecnologia', icone: '💻', bom: 1 },
    limpa: { nome: 'Energia limpa', icone: '⚡', bom: 1, sufixo: '%' }, militar: { nome: 'Força militar', icone: '🛡️', bom: 0 },
    desmatamento: { nome: 'Desmatamento', icone: '🌳', bom: -1, casas: 1 },
    'imune.desinfo': { nome: 'Defesa contra boatos', icone: '🔐', bom: 1 }, 'imune.ciber': { nome: 'Ciberdefesa', icone: '🔐', bom: 1 },
    'imune.pandemia': { nome: 'Preparo para pandemias', icone: '💉', bom: 1 },
  };
  const ORDEM_GLOBAL = ['global.tensao', 'global.temperatura', 'global.deslocados', 'global.comercio', 'global.cooperacao', 'global.energia'];
  const PELES_ANCORA = ['tom3', 'tom5', 'tom2', 'tom6', 'tom1', 'tom4'];
  const PELES_CONSELHO = ['tom2', 'tom5', 'tom3', 'tom6', 'tom1', 'tom4'];

  // ============================== AUXILIARES ==============================
  const evento = id => (typeof EVENTOS !== 'undefined' ? EVENTOS : []).find(x => x.id === id) || null;
  const Sim = () => (typeof Simulacao !== 'undefined' ? Simulacao : null);
  const nomeDe = id => Sim()?.nome?.(id) ?? id;
  const comDe = (id, prep = '') => Sim()?.com?.(id, prep) ?? nomeDe(id);
  const preencher = (t, pid, local) => (Sim()?.preencher ? Sim().preencher(t, pid, local) : t);
  const mapa = () => (typeof Mapa3D !== 'undefined' && Mapa3D.renderer ? Mapa3D : null);
  const noMapa = id => !!id && !!mapa()?.territorios?.includes(id);
  const som = (nome, o) => { if (typeof Som !== 'undefined' && Som.efeito) Som.efeito(nome, o); };
  const ico = (e, px = 48) => (typeof imgIcone === 'function' ? imgIcone(e, px) : '');
  const kit = (nome, o) => (typeof arte === 'function' ? arte(nome, o) : '');
  const tpl = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const ehPotencia = id => typeof POTENCIAS !== 'undefined' && POTENCIAS.some(p => p.id === id);
  const retratoDe = (av, o) => (typeof Cenas3D !== 'undefined' && Cenas3D.retrato ? Cenas3D.retrato(av, o).catch(() => '') : Promise.resolve(''));
  // Avatar de uma potência: o da Partida; sem ele (vitrine), um boneco sorteado com a semente da partida
  function avatarDe(e, pid) {
    const av = typeof Jogo !== 'undefined' && Jogo.avatarDe ? Jogo.avatarDe(pid) : null;
    if (av) return av;
    const pids = Object.keys(e.potencias || {});
    const base = typeof Bonecos !== 'undefined' && Bonecos.avataresIniciais ? Bonecos.avataresIniciais(pids, (e.semente >>> 0) || 7) : [];
    return { ...(base[pids.indexOf(pid)] || { pid, cor: corDe(pid), forma: CORES_GUIA[pid]?.forma }), humano: !!e.potencias?.[pid]?.humano };
  }

  // Roteiro pulável: anim(tl) e dormir(ms) terminam na hora depois de adiantar() (clique, Espaço, Enter, PageDown)
  function novoRoteiro() {
    const r = { adiantado: false, tls: new Set(), acordar: new Set() };
    r.anim = tl => {
      if (!tl) return Promise.resolve();
      r.tls.add(tl);
      if (r.adiantado) tl.progress(1);
      return fim(tl).finally(() => r.tls.delete(tl));
    };
    r.dormir = ms => {
      if (r.adiantado) return Promise.resolve();
      const p = espera(ms);
      p.catch(() => {});
      return Promise.race([p, new Promise(ok => r.acordar.add(ok))]);
    };
    r.adiantar = () => {
      if (r.adiantado) return;
      r.adiantado = true;
      r.tls.forEach(t => t.progress(1));
      r.acordar.forEach(f => f());
      r.acordar.clear();
    };
    return r;
  }

  // ============================== NÚMEROS COM O PORQUÊ ==============================
  // Junta as mudanças em chips: globais primeiro, depois o lugar do evento, depois os outros (agrupados por indicador)
  function chipsDe(mudancas = [], local) {
    const soma = new Map();
    for (const m of mudancas) {
      const chave = m.quem === 'global' ? 'global.' + m.v : m.v;
      if (!IND[chave] || m.v === 'influencia') continue;
      const k = m.quem + '|' + chave;
      const atual = soma.get(k);
      if (atual) atual.depois = m.depois; else soma.set(k, { quem: m.quem, chave, antes: m.antes, depois: m.depois, motivo: m.motivo });
    }
    const lista = [...soma.values()].filter(c => Math.abs(c.depois - c.antes) > 1e-6);
    const globais = lista.filter(c => c.quem === 'global').sort((a, b) => ORDEM_GLOBAL.indexOf(a.chave) - ORDEM_GLOBAL.indexOf(b.chave));
    const doLugar = lista.filter(c => c.quem !== 'global' && c.quem === local);
    const outros = lista.filter(c => c.quem !== 'global' && c.quem !== local);
    // outros lugares: um chip por indicador ("Estabilidade em 4 vizinhos")
    const grupos = new Map();
    outros.forEach(c => { const g = grupos.get(c.chave) || []; g.push(c); grupos.set(c.chave, g); });
    const agrupados = [...grupos.entries()].map(([chave, g]) => g.length === 1 ? g[0]
      : { quem: null, chave, lugares: g.map(x => x.quem), antes: null, depois: null, dif: g.reduce((s, x) => s + x.depois - x.antes, 0) / g.length });
    return [...globais, ...doLugar, ...agrupados].slice(0, 6);
  }
  // "nas 6 potências", "em 4 territórios"…
  function ondeGrupo(ids) {
    const n = ids.length, pot = ids.filter(ehPotencia).length;
    return pot === n ? (n === 6 ? 'nas 6 potências' : `em ${n} potências`) : pot ? `em ${n} lugares` : `em ${n} territórios`;
  }
  const arred = (v, casas = 0) => Math.round(v * 10 ** casas) / 10 ** casas;
  function textoValor(c) {
    const i = IND[c.chave], conv = i.conv || (v => v), casas = i.casas ?? 0;
    return v => fmt(arred(conv(v), casas), casas) + (i.sufixo || '');
  }
  // Diferença já no sentido da tela (Relógio: tensão que sobe = segundos a menos)
  function difDe(c) {
    const i = IND[c.chave], conv = i.conv || (v => v);
    return c.dif !== undefined ? c.dif : conv(c.depois) - conv(c.antes);
  }
  const SETA = sobe => `<svg class="pl-seta" viewBox="0 0 20 20" aria-hidden="true"><path d="${sobe ? 'M10 3.5 17 15H3Z' : 'M10 16.5 3 5h14Z'}" fill="currentColor" stroke="#1A1433" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/></svg>`;
  function htmlChip(c) {
    const i = IND[c.chave], d = difDe(c), casas = i.casas ?? (Math.abs(d) < 1 ? 1 : 0);
    const efeito = !i.bom ? 'neutro' : Math.sign(d) === i.bom ? 'ganho' : 'perda';
    const onde = c.quem === 'global' ? '' : c.lugares ? ondeGrupo(c.lugares) : comDe(c.quem, ehPotencia(c.quem) ? 'de' : 'em');
    const nome = c.quem === 'global' ? (i.curto || i.nome) : i.nome;
    const icone = i.arte ? kit(i.arte, { classe: 'pl-chip-arte' }) : ico(i.icone, 48);
    const valor = c.depois === null ? '' : `<b class="pl-chip-valor num">${textoValor(c)(c.depois)}</b>`;
    const lido = `${i.nome}${onde ? ' ' + onde : ''}: ${d > 0 ? 'sobe' : 'desce'} ${fmt(Math.abs(arred(d, casas)), casas)}${c.depois === null ? '' : ', agora ' + textoValor(c)(c.depois)}.`;
    return `<li class="pl-chip" data-efeito="${efeito}"><span class="soquete pl-chip-ico">${icone}</span>` +
      `<span class="pl-chip-txt" aria-hidden="true"><span class="pl-chip-nome">${esc(nome)}</span>${onde ? `<span class="pl-chip-onde">${esc(onde)}</span>` : ''}</span>${valor ? valor.replace('<b ', '<b aria-hidden="true" ') : ''}` +
      `<span class="pl-chip-dif" aria-hidden="true">${SETA(d > 0)}${sinal(arred(d, casas), casas)}</span><span class="so-leitor">${esc(lido)}</span></li>`;
  }
  // Mostra os chips (cascata), faz os números saltarem e atualiza HUD e mapa
  async function mostrarNumeros(caixa, e, mudancas, local, r) {
    const chips = chipsDe(mudancas, local);
    if (!chips.length) { caixa.hidden = true; return; }
    caixa.querySelector('.pl-chips').innerHTML = chips.map(htmlChip).join('');
    caixa.hidden = false;
    if (typeof Hud !== 'undefined' && Hud.atualizar) { try { Hud.atualizar(e, { mudancas }); } catch { /* HUD ainda não montado */ } }
    mapa()?.atualizarMundo?.(e, { animar: !r.adiantado });
    // número flutuante no lugar do evento (até 2)
    chips.filter(c => c.quem && c.quem === local && noMapa(local)).slice(0, 2).forEach(c => {
      const d = difDe(c), i = IND[c.chave];
      mapa().numeroFlutuante(local, sinal(arred(d, i.casas ?? 0), i.casas ?? 0), i.bom && Math.sign(d) !== i.bom ? 'perda' : 'ganho');
    });
    const itens = [...caixa.querySelectorAll('.pl-chip')];
    const tl = gsap.timeline();
    tl.fromTo(caixa.querySelector('.pl-efeitos-rot'), { opacity: 0, x: RM ? 0 : -2 * uPx() }, { opacity: 1, x: 0, duration: RM ? .18 : .25, ease: 'power2.out' });
    itens.forEach((li, k) => {
      const c = chips[k], b = li.querySelector('.pl-chip-valor');
      tl.fromTo(li, RM ? { opacity: 0 } : { opacity: 0, y: 2.4 * uPx(), scale: .7 }, { opacity: 1, y: 0, scale: 1, duration: RM ? .18 : .32, ease: 'back.out(2)' }, RM ? .05 : .1 + k * .09);
      if (b && !RM && !r.adiantado) {
        const i = IND[c.chave], conv = i.conv || (v => v), casas = i.casas ?? 0;
        tl.add(() => numeroQueSalta(b, arred(conv(c.antes), casas), arred(conv(c.depois), casas), { casas, sufixo: i.sufixo || '', som: k === 0 }), .2 + k * .09);
      }
      if (!RM) tl.fromTo(li.querySelector('.pl-chip-dif'), { scale: 0, rotation: -20 }, { scale: 1, rotation: 0, duration: .5, ease: 'elastic.out(1, .5)' }, .32 + k * .09);
    });
    if (!RM) tl.add(() => som(chips.some(c => IND[c.chave].bom && Math.sign(difDe(c)) !== IND[c.chave].bom) ? 'descer' : 'subir'), .15);
    anunciar('Efeito no mundo. ' + chips.map(c => {
      const i = IND[c.chave], d = difDe(c);
      return `${i.nome}${c.quem && c.quem !== 'global' ? ' ' + comDe(c.quem, ehPotencia(c.quem) ? 'de' : 'em') : c.lugares ? ' ' + ondeGrupo(c.lugares) : ''} ${d > 0 ? 'sobe' : 'desce'}`;
    }).join('; ') + '.');
    await r.anim(tl);
  }

  // ============================== ESTÚDIO: âncora, bancada e tarja ==============================
  // Linhas de globo (meridianos e paralelos) no fundo da janela do estúdio
  const GLOBO_LINHAS = (() => {
    let s = '<svg class="pl-globo-linhas" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="2.2" stroke-opacity=".16">';
    s += '<circle cx="100" cy="100" r="88"/>';
    [-60, -30, 0, 30, 60].forEach(la => { const y = 100 - Math.sin(la * Math.PI / 180) * 88, rx = Math.cos(la * Math.PI / 180) * 88; s += `<ellipse cx="100" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${(rx * .16).toFixed(1)}"/>`; });
    [20, 45, 68].forEach(rx => (s += `<ellipse cx="100" cy="100" rx="${rx}" ry="88"/>`));
    s += '<path d="M100 12v176"/></g></svg>';
    return s;
  })();
  function htmlBancada(e, ev, local) {
    const lugar = local ? nomeDe(local) : 'Mundo todo';
    const manchete = esc(ev.manchete || ev.titulo).split(/\s+/).map(p => `<span class="pl-palavra">${p}</span>`).join(' ');
    return `<section class="plantao" data-tipo="${esc(ev.tipo || '')}" data-fase="bancada" data-pagina="noticia" aria-labelledby="pl-manchete" aria-describedby="pl-texto">
      <div class="pl-palco">
        <div class="pl-estudio" aria-hidden="true">
          <div class="pl-janela"><div class="pl-tela">${GLOBO_LINHAS}<span class="pl-luz"></span></div></div>
          <div class="pl-ancora"><img class="pl-quadro a" alt="" draggable="false"><img class="pl-quadro c" alt="" draggable="false"><img class="pl-quadro b" alt="" draggable="false"></div>
          <div class="pl-ots"><div class="pl-ots-tela"><span class="soquete pl-ots-ico">${ico(ev.icone, 96)}</span></div></div>
          <div class="pl-bancada"><span class="pl-tampo peca pinos"></span><span class="pl-frente peca"><span class="pl-faixa"></span><span class="pl-adesivo"><span>PG</span></span></span></div>
        </div>
        <div class="pl-tarja">
          <div class="tarja-topo">
            <span class="tarja-marca peca pinos vermelha">Plantão</span>
            <span class="tarja-vivo ao-vivo">Ao vivo</span>
            <span class="tarja-lugar">${ico(local ? '📍' : '🌍', 40)}${esc(lugar)}</span>
            <span class="tarja-ano">${esc(fmtAno(e.ano ?? 2026))}</span>
            <button class="btn btn-neutro btn-mini peca pl-pular" data-teste="pular" aria-label="Pular a reportagem">Pular ${GLIFOS.seta}</button>
            <button class="btn btn-neutro btn-mini peca pl-voltar" hidden aria-label="Voltar para a notícia">${GLIFOS.voltar} Notícia</button>
            <button class="btn btn-principal peca pinos pl-continuar" data-teste="continuar-painel" hidden></button>
          </div>
          <div class="tarja-corpo peca">
            <div class="pl-linha"><span class="soquete pl-icone" aria-hidden="true">${ico(ev.icone, 64)}</span>
              <div><p class="pl-chapeu">${esc(ev.titulo)}</p><h2 class="tarja-manchete" id="pl-manchete">${manchete}</h2></div></div>
            <div class="pl-paginas">
              <div class="pl-pagina pl-noticia">
                <p class="tarja-texto" id="pl-texto">${esc(ev.texto || '')}</p>
                <div class="pl-efeitos" hidden><span class="pl-efeitos-rot">Efeito no mundo</span><ul class="pl-chips" role="list"></ul></div>
              </div>
              ${ev.vocesabia ? `<aside class="pl-pagina pl-saber inativa${ev.vocesabia.length > 230 ? ' longo' : ''}" inert aria-label="Você sabia?">${kit('lampada', { classe: 'pl-lampada' })}
                <div class="pl-saber-txt"><h3 class="pl-saber-tit">Você sabia?</h3><p>${esc(ev.vocesabia)}</p></div></aside>` : ''}
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }
  function rotuloContinuar(ev) {
    const t = ev.escolha?.tipo;
    return t === 'votacao' ? 'Ir à ONU' : t === 'doacao' ? 'Pedir ajuda' : t === 'decisao' ? 'Decidir' : 'Continuar';
  }

  // Repórter de campo: balão com retrato e microfone do kit, preso ao lugar do evento no mapa ("Direto do Caribe")
  function retratoReporter(e) {
    if (typeof Bonecos === 'undefined' || !Bonecos.ancora) return Promise.resolve('');
    const k = ((e.semente >>> 0) || 0) + 3;
    return retratoDe(Bonecos.ancora({ nome: 'Repórter', roupa: null, cor: '#FFD21F', calca: '#33363F', pele: PELES_ANCORA[k % PELES_ANCORA.length],
      cabelo: k % 2 ? 'castanho' : 'preto', penteado: k % 2 ? 'trancas' : 'black' }), { expressao: 'falando', acao: 'parado', tamanho: 240, enquadramento: 'busto' });
  }
  function htmlReporter(local) {
    const [prep, ...resto] = comDe(local, 'de').split(' ');
    const lugar = resto.length && /^d[aeo]s?$/.test(prep) ? [prep, resto.join(' ')] : ['de', nomeDe(local)];
    return `<div class="pl-reporter" aria-hidden="true"><div class="pl-rep-placa peca flutua">
        <span class="pl-rep-pre">Direto ${esc(lugar[0])}</span><b class="pl-rep-lugar">${esc(lugar[1])}</b></div>
      <span class="pl-rep-foto"><img class="pl-rep-boneco" alt="" draggable="false" hidden>${kit('microfone', { classe: 'pl-rep-mic' })}</span></div>`;
  }
  // Põe o balão ao lado do lugar (a ponta encosta nele) sem cobrir o efeito, a tarja nem o topo; vira para a esquerda se faltar espaço
  function posicionarReporter(raiz, local, torres = 1) {
    const el = raiz.querySelector('.pl-reporter'), p = mapa()?.posicaoNaTela?.(local);
    if (!el) return;
    if (!p?.visivel) { el.hidden = true; return; }
    el.hidden = false;
    const u = uPx(), w = el.offsetWidth, h = el.offsetHeight, ph = el.querySelector('.pl-rep-placa').offsetHeight;
    const teto = 13 * u, chao = (raiz.querySelector('.pl-tarja')?.getBoundingClientRect().top ?? innerHeight) - 7 * u - h;
    const dx = (6.5 + Math.max(0, torres - 1) * 4) * u, alvoY = p.y - 2.5 * u;   // ao lado da fileira de torres do lugar (≈ 8u por torre), sem cobri-la
    const esq = p.x + dx + w > innerWidth - 2 * u;
    el.classList.toggle('esq', esq);
    const top = Math.max(teto, Math.min(chao, alvoY - h + ph / 2));   // o meio da placa na altura do lugar
    el.style.left = (esq ? p.x - dx - w : p.x + dx) + 'px';
    el.style.top = top + 'px';
    el.style.setProperty('--ponta-y', Math.max(1.8 * u, Math.min(ph - 1.8 * u, alvoY - top - (h - ph))) + 'px');
  }
  async function mostrarReporter(raiz, local, torres, foto, r) {
    raiz.querySelector('.pl-palco').insertAdjacentHTML('beforebegin', htmlReporter(local));
    const el = raiz.querySelector('.pl-reporter'), img = el.querySelector('.pl-rep-boneco');
    const url = await Promise.race([foto, r.dormir(400).then(() => '')]);
    if (url) { img.src = url; img.hidden = false; } else el.classList.add('sem-foto');
    posicionarReporter(raiz, local, torres);
    if (el.hidden) return;
    const u = uPx(), tl = gsap.timeline();
    if (RM) tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .18 });
    else {
      tl.set(el.querySelector('.pl-rep-placa'), { transformOrigin: el.classList.contains('esq') ? '100% 50%' : '0% 50%' })
        .fromTo(el.querySelector('.pl-rep-placa'), { scale: .2, opacity: 0 }, { scale: 1, opacity: 1, duration: .38, ease: 'back.out(1.8)' })
        .fromTo(el.querySelector('.pl-rep-foto'), { y: 3 * u, scale: .6, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .42, ease: 'back.out(2.2)' }, .1)
        .fromTo(el.querySelector('.pl-rep-mic'), { rotation: -40 }, { rotation: 0, duration: .55, ease: 'elastic.out(1, .5)' }, .2)
        .add(() => som('pop'), .05);
    }
    await r.anim(tl);
    loop(el.querySelector('.pl-rep-foto'), { scaleY: 1.02, duration: .9, transformOrigin: '50% 100%' });
  }

  // Âncora: dois quadros (boca fechada e falando) que se alternam enquanto ele "lê" a notícia
  async function prepararAncora(e, ev) {
    if (typeof Bonecos === 'undefined' || !Bonecos.ancora) return null;
    const av = Bonecos.ancora({ pele: PELES_ANCORA[((e.semente >>> 0) || 0) % PELES_ANCORA.length] });
    const base = { acao: 'parado', tamanho: 360, enquadramento: 'busto' };
    // a = rosto em repouso (sério nas notícias tristes); b/c = falando e boca fechada, com as mesmas sobrancelhas (nada pisca)
    const [a, b, c] = await Promise.all([retratoDe(av, { ...base, expressao: SERIOS.has(ev.tipo) ? 'determinado' : 'feliz' }),
      retratoDe(av, { ...base, expressao: 'falando' }), retratoDe(av, { ...base, expressao: 'feliz' })]);
    return a ? { a, b, c } : null;
  }
  function falar(raiz, segundos) {
    const [a, b, c] = ['a', 'b', 'c'].map(k => raiz.querySelector('.pl-quadro.' + k));
    if (RM || !b?.src || !c?.src) return () => {};
    let aberta = false;
    a.style.opacity = 0; c.style.opacity = 1;
    const id = setInterval(() => { aberta = !aberta; b.style.opacity = aberta ? 1 : 0; }, 1000 / 7);
    const parar = () => { clearInterval(id); clearTimeout(t); b.style.opacity = c.style.opacity = 0; a.style.opacity = 1; };
    const t = setTimeout(parar, segundos * 1000);
    return parar;
  }

  // ============================== VINHETA ==============================
  let rodadaVista = null, noticiasNaRodada = 0;
  function motivoCrise(e) {
    const g = e.global || {};
    return g.tensao >= 80 ? 'a tensão passou de 80' : g.temperatura >= 2 ? 'o planeta passou de 2 °C' : g.deslocados >= 150 ? 'já são mais de 150 milhões de deslocados' : '';
  }
  async function vinheta(r, e) {
    if (typeof vinhetaPlantao !== 'function') { som('plantao'); return; }
    if (rodadaVista !== e.rodada) { rodadaVista = e.rodada; noticiasNaRodada = 0; }
    noticiasNaRodada++;
    const motivo = motivoCrise(e);
    const sub = motivo && noticiasNaRodada === 1 ? `Mundo em crise: 2 notícias neste mandato, porque ${motivo}.` : noticiasNaRodada > 1 ? 'Mais uma notícia neste mandato' : '';
    const el = tpl(vinhetaPlantao({ crise: !!sub, sub }));
    el.dataset.teste = 'vinheta';
    $('#camada').append(el);
    el.addEventListener('pointerdown', r.adiantar);
    som('plantao');
    anunciar('Plantão Global!' + (sub ? ' ' + sub : ''));
    try {
      await r.anim(typeof animarVinheta === 'function' ? animarVinheta(el) : null);
      await r.dormir(sub ? 1300 : 250);
      const sai = gsap.timeline();
      if (RM) sai.to(el, { opacity: 0, duration: .18 });
      else sai.to(el.querySelector('.vp-palco'), { scale: .8, opacity: 0, duration: .22, ease: 'power2.in' })
        .to(el, { xPercent: 105, skewX: -8, duration: .32, ease: 'power3.in' }, .06);
      await r.anim(sai);
    } finally { el.remove(); }
  }

  // ============================== MAPA ==============================
  function cameraNoLugar(ev, local) {
    const m = mapa();
    if (!m) return Promise.resolve();
    return noMapa(local) ? m.focar(local, { perto: .62 }) : m.visaoGeral();
  }
  function efeitoNoMapa(ev, local) {
    const m = mapa();
    if (!m) return Promise.resolve();
    const tipo = EFEITO_DO_EVENTO[ev.id] || EFEITO_DO_TIPO[ev.tipo];
    if (!tipo) return Promise.resolve();
    if (noMapa(local)) return m.efeito(tipo, local);
    if (tipo === 'onu') return m.efeito('onu', null);
    const lugares = (LUGARES_DO_MUNDO[ev.id] || []).filter(noMapa);
    return Promise.all(lugares.map((id, k) => espera(k * 280).then(() => m.efeito(tipo, id)).catch(() => {})));
  }

  // ============================== A REPORTAGEM ==============================
  async function reportagem(e, ev, local, mudancas) {
    const raiz = tpl(htmlBancada(e, ev, local));
    const $r = s => raiz.querySelector(s);
    const r = novoRoteiro();
    const ancoraPronta = prepararAncora(e, ev);
    const reporter = noMapa(local) ? retratoReporter(e) : null;
    const torres = Object.values(e.territorios?.[local]?.influencia || {}).filter(v => v > 0).length;
    const reposicionar = () => posicionarReporter(raiz, local, torres);
    let calar = () => {}, sair, virarPara = null;
    const saida = new Promise(ok => (sair = ok));
    const pular = () => { r.adiantar(); sair('pular'); };
    // Espaço, Enter e PageDown adiantam (mostram tudo); com tudo pronto, PageDown continua; Esc pula
    const teclas = ev2 => {
      if (!raiz.isConnected || raiz.inert) return;
      const pronto = raiz.dataset.fase === 'pronto';
      if (ev2.key === 'Escape') { ev2.preventDefault(); pular(); return; }
      const parado = pronto || raiz.dataset.fase === 'noticia';
      if (parado && ['PageDown', 'ArrowRight'].includes(ev2.key)) { ev2.preventDefault(); $r('.pl-continuar').click(); return; }
      if (parado && ['PageUp', 'ArrowLeft'].includes(ev2.key) && virarPara) { ev2.preventDefault(); virarPara('noticia'); return; }
      if (!parado && [' ', 'Enter', 'PageDown'].includes(ev2.key) && !ev2.target.closest?.('button')) { ev2.preventDefault(); r.adiantar(); }
    };
    try {
      // 1. vinheta (pulável sozinha; os retratos do âncora são feitos enquanto ela roda)
      await vinheta(novoRoteiro(), e);
      const quadros = await Promise.race([ancoraPronta, espera(2500).then(() => null)]);
      if (quadros) ['a', 'b', 'c'].forEach(k => ($r('.pl-quadro.' + k).src = quadros[k]));
      else if (typeof urlArte === 'function') {   // sem retrato a tempo: o mascote apresenta (sem trocar no meio da notícia)
        $r('.pl-ancora').classList.add('sem-retrato');
        $r('.pl-quadro.a').src = urlArte(SERIOS.has(ev.tipo) ? 'globo-irado-susto' : 'globo-irado-feliz');
      }

      // 2. bancada: a câmera voa até o lugar e a tarja sobe
      $('#camada').append(raiz);
      abrirPainel(raiz, { veu: false, foco: raiz, som: null }).catch(() => {});
      gsap.killTweensOf(raiz);
      gsap.set(raiz, { opacity: 1, y: 0, scale: 1 });
      raiz.addEventListener('pointerdown', ev2 => { if (!ev2.target.closest('button')) r.adiantar(); });
      $r('.pl-pular').addEventListener('click', () => { efeitoSom('clique'); pular(); });
      $r('.pl-continuar').addEventListener('click', () => {
        efeitoSom('clique');
        // cada clique é um "próximo": vira para o Você sabia? e depois segue (na fila das viradas)
        if (virarPara) virarPara(null); else sair('continuar');
      });
      document.addEventListener('keydown', teclas, true);
      const camera = cameraNoLugar(ev, local);
      const u = uPx(), palavras = [...raiz.querySelectorAll('.pl-palavra')];
      const tl = gsap.timeline();
      if (RM) tl.fromTo([$r('.pl-estudio'), $r('.tarja-topo'), $r('.tarja-corpo')], { opacity: 0 }, { opacity: 1, duration: .2 });
      else {
        tl.fromTo($r('.pl-bancada'), { y: 14 * u }, { y: 0, duration: .38, ease: 'back.out(1.5)' }, 0)
          .fromTo($r('.pl-janela'), { y: 18 * u, scale: .86, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .42, ease: 'back.out(1.4)' }, .05)
          .fromTo($r('.pl-ancora'), { y: 16 * u, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'back.out(1.7)' }, .2)
          .fromTo($r('.pl-ots'), { scale: .2, rotation: -24, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: .45, ease: 'back.out(2.2)' }, .5)
          .fromTo($r('.tarja-corpo'), { clipPath: `inset(${-3 * u}px 100% ${-5 * u}px ${-3 * u}px round ${1.4 * u}px)` },
            { clipPath: `inset(${-3 * u}px ${-3 * u}px ${-5 * u}px ${-3 * u}px round ${1.4 * u}px)`, duration: .5, ease: 'power3.out', clearProps: 'clipPath' }, .12)
          .fromTo($r('.tarja-marca'), { scale: 1.9, rotation: -12, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: .3, ease: 'back.out(2.2)' }, .3)
          .add(() => som('pop'), .4)
          .fromTo([...raiz.querySelectorAll('.tarja-topo > :not(.tarja-marca)')], { y: 2 * u, opacity: 0 }, { y: 0, opacity: 1, duration: .26, stagger: .06, ease: 'back.out(2)' }, .42)
          .fromTo($r('.pl-icone'), { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: .55, ease: 'elastic.out(1, .5)' }, .45)
          .fromTo($r('.pl-chapeu'), { opacity: 0, x: -1.6 * u }, { opacity: 1, x: 0, duration: .25, ease: 'power2.out' }, .5)
          .fromTo(palavras, { opacity: 0, y: .9 * u }, { opacity: 1, y: 0, duration: .22, stagger: .028, ease: 'back.out(2)' }, .55);
      }
      tl.fromTo($r('.tarja-texto'), { opacity: 0, y: RM ? 0 : u }, { opacity: 1, y: 0, duration: RM ? .2 : .32, ease: 'power2.out' }, RM ? .1 : .7 + palavras.length * .028);
      anunciar(`Plantão Global${local ? ', ' + nomeDe(local) : ''}: ${ev.manchete || ev.titulo}. ${ev.texto || ''}`);
      calar = falar(raiz, Math.min(4.2, 1.2 + ((ev.manchete || '').length + (ev.texto || '').length) * .012));
      if (!RM) loop($r('.pl-ancora'), { scaleY: 1.012, duration: 1, transformOrigin: '50% 100%' });
      await r.anim(tl);

      // 3. efeito no mapa (a câmera já chegou ou está chegando)
      raiz.dataset.fase = 'efeito';
      await Promise.race([camera, r.dormir(1200)]);
      if (reporter) {   // o repórter de campo aparece no lugar, ao lado do efeito
        await mostrarReporter(raiz, local, torres, reporter, r);
        camera.then(reposicionar);
        addEventListener('resize', reposicionar);
      }
      await Promise.race([efeitoNoMapa(ev, local), r.dormir(1100)]);

      // 4. números com o porquê
      raiz.dataset.fase = 'numeros';
      await mostrarNumeros($r('.pl-efeitos'), e, mudancas, local, r);
      await r.dormir(500);

      // 5. Continuar: com "Você sabia?", a tarja vira a página (a notícia continua a um clique de distância)
      const btn = $r('.pl-continuar'), voltar = $r('.pl-voltar'), temSaber = !!$r('.pl-saber');
      const rotulo = pag => `${pag === 'noticia' && temSaber ? 'Você sabia?' : esc(rotuloContinuar(ev))} ${GLIFOS.seta}`;
      btn.innerHTML = rotulo('noticia');
      btn.hidden = false;
      raiz.dataset.fase = temSaber ? 'noticia' : 'pronto';
      if (!RM) {
        gsap.fromTo(btn, { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: 'back.out(2)' });
        gsap.to(btn, { scale: 1.04, duration: 1, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: .4, transformOrigin: '50% 100%' });
      }
      if (!raiz.contains(document.activeElement) || document.activeElement === raiz) btn.focus({ preventScroll: true });
      if (temSaber) {
        let fila = Promise.resolve();   // uma virada de cada vez (cliques rápidos esperam a anterior)
        virarPara = pag => (fila = fila.then(() => (pag === null && raiz.dataset.pagina === 'saber' ? sair('continuar') : virar(pag ?? 'saber'))).catch(() => {}));
        const virar = async pag => {
          if (raiz.dataset.pagina === pag || !raiz.isConnected) return;
          raiz.dataset.virando = '1';
          const paginas = $r('.pl-paginas'), [sai, entra] = pag === 'saber' ? [$r('.pl-noticia'), $r('.pl-saber')] : [$r('.pl-saber'), $r('.pl-noticia')];
          efeitoSom('virar');
          const tv = gsap.timeline();
          if (RM) tv.to(paginas, { opacity: 0, duration: .1 });
          else tv.to(paginas, { rotationX: 88, transformPerspective: 900, transformOrigin: '50% 0%', duration: .16, ease: 'power2.in' });
          await fim(tv);
          sai.classList.add('inativa'); sai.inert = true; entra.classList.remove('inativa'); entra.inert = false;
          raiz.dataset.pagina = pag;
          raiz.dataset.fase = pag === 'saber' ? 'pronto' : 'noticia';
          btn.innerHTML = rotulo(pag);
          voltar.hidden = pag !== 'saber';
          $r('.pl-pular').hidden = pag === 'saber';
          const te = gsap.timeline();
          if (RM) te.to(paginas, { opacity: 1, duration: .15 });
          else te.fromTo(paginas, { rotationX: -70 }, { rotationX: 0, transformPerspective: 900, transformOrigin: '50% 0%', duration: .34, ease: 'back.out(1.6)' })
            .fromTo(entra.querySelector('.pl-lampada'), { scale: 0, rotation: -25 }, { scale: 1, rotation: 0, duration: .55, ease: 'elastic.out(1, .5)' }, .05);
          if (pag === 'saber') { anunciar('Você sabia? ' + ev.vocesabia); if (!RM) te.add(() => som('pop'), .1); }
          await fim(te);
          delete raiz.dataset.virando;
        };
        voltar.addEventListener('click', () => { efeitoSom('clique'); virarPara('noticia').then(() => btn.focus({ preventScroll: true })); });
      }
      return await aguardar(saida);
    } finally {
      // a reportagem sai: o palco desce; a câmera fica onde está (quem vem depois decide)
      calar();
      document.removeEventListener('keydown', teclas, true);
      removeEventListener('resize', reposicionar);
      if (raiz.isConnected) {
        raiz.dataset.fase = 'fim';
        gsap.killTweensOf([raiz, ...raiz.querySelectorAll('*')]);
        if (!RM) gsap.to(raiz.querySelector('.pl-palco'), { y: 30 * uPx(), duration: .26, ease: 'power2.in' });
        if (!RM && raiz.querySelector('.pl-reporter')) gsap.to(raiz.querySelector('.pl-reporter'), { scale: .6, opacity: 0, duration: .2, ease: 'power2.in' });
        await fecharPainel(raiz).catch(() => raiz.remove());
      }
    }
  }

  // ============================== DECISÃO DE TODAS AS POTÊNCIAS ==============================
  const CARGO = { diplomacia: 'Conselho de Diplomacia', economia: 'Conselho de Economia', natureza: 'Conselho de Natureza',
    seguranca: 'Conselho de Paz e Segurança', pessoas: 'Conselho de Pessoas e Direitos', ciencia: 'Conselho de Ciência' };
  const ICONE_CAT = { diplomacia: '🤝', economia: '💰', natureza: '🌱', seguranca: '🛡️', pessoas: '👥', ciencia: '💡' };
  function conselheiros(opcoes) {
    if (typeof Bonecos === 'undefined' || !Bonecos.conselheiro) return opcoes.map(() => Promise.resolve(''));
    return opcoes.map((o, i) => retratoDe(Bonecos.conselheiro(o.categoria, { pele: PELES_CONSELHO[i % PELES_CONSELHO.length] }),
      { expressao: i % 2 ? 'determinado' : 'pensativo', acao: 'parado', tamanho: 240, enquadramento: 'busto' }));
  }
  function htmlOpcoes(opcoes, pid, local) {
    return opcoes.map((o, i) => `<div class="pl-opcao peca cat-${esc(o.categoria)}">
        <span class="pl-conselho"><img alt="" draggable="false" hidden><span class="soquete pl-conselho-vazio">${ico(ICONE_CAT[o.categoria] || '💬', 64)}</span></span>
        <span class="pl-cargo">${ico(ICONE_CAT[o.categoria] || '💬', 40)}${esc(CARGO[o.categoria] || 'Conselho')}</span>
        <h3 class="pl-opcao-tit">${esc(o.resumo)}</h3>
        <p class="pl-opcao-texto balao peca" data-ponta="nenhuma">${esc(preencher(o.texto, pid, local))}</p>
        <button class="btn btn-principal peca pinos pl-escolher" data-teste="opcao-${i}" data-i="${i}" aria-label="Escolher: ${esc(o.resumo)} (tecla ${i + 1})"><kbd class="pl-tecla" aria-hidden="true">${i + 1}</kbd> Escolher</button>
      </div>`).join('');
  }
  function cabecalhoEquipe(painel, e, pid, passo, total) {
    painel.dataset.equipe = pid;
    painel.classList.remove('anil');
    const av = avatarDe(e, pid);
    painel.querySelector('.painel-cab').innerHTML = `<span class="retrato grande painel-objeto pl-quem" data-equipe="${pid}"><img alt="" hidden>${formaDe(pid)}</span>
      <h2 class="painel-titulo" id="pl-dec-tit">Decisão ${esc(comDe(pid, 'de'))}<small class="painel-sub">${esc(nomeEquipe(pid))} · escolham em segredo</small></h2>
      <span class="pilula pl-passo">${passo} de ${total}</span>`;
    retratoDe(av, { expressao: 'pensativo', tamanho: 200, enquadramento: 'rosto' }).then(url => {
      const img = painel.querySelector('.pl-quem img');
      if (url && img) { img.src = url; img.hidden = false; }
    });
  }
  // Uma equipe escolhe em segredo: a tela só responde com o carimbo DECIDIDO (igual para qualquer opção)
  async function vezDeDecidir(painel, e, ev, local, pid, passo, total, opcoes, retratos) {
    painel.dataset.fase = 'decisao';
    cabecalhoEquipe(painel, e, pid, passo, total);
    const tela = painel.querySelector('.tela');
    tela.innerHTML = `<div class="pl-situacao"><span class="soquete">${ico(ev.icone, 64)}</span><div><p class="pl-situacao-tit">${esc(ev.titulo)}</p>
      <p class="pl-situacao-perg">${esc(preencher('O que {o quem} {faz|fazem} diante disso?', pid, local))}</p></div></div>
      <div class="pl-opcoes" role="group" aria-label="Opções">${htmlOpcoes(opcoes, pid, local)}</div>`;
    painel.querySelector('.painel-rodape').innerHTML = `<span class="dica">${ico('💬', 40)} Não há resposta certa: cada caminho tem ganhos e custos. Conversem antes de escolher!</span>
      <span class="pl-teclas">Teclas ${opcoes.map((_, i) => `<kbd class="pl-tecla">${i + 1}</kbd>`).join(' ')}</span>`;
    retratos.forEach((p, i) => p.then(url => {
      const card = tela.querySelectorAll('.pl-opcao')[i], img = card?.querySelector('.pl-conselho img');
      if (url && img) { img.src = url; img.hidden = false; card.querySelector('.pl-conselho-vazio').hidden = true; }
    }));
    const cards = [...tela.querySelectorAll('.pl-opcao')];
    if (!RM) gsap.fromTo(cards, { y: 4 * uPx(), opacity: 0 }, { y: 0, opacity: 1, duration: .36, stagger: .07, ease: 'back.out(1.6)' });
    else gsap.fromTo(cards, { opacity: 0 }, { opacity: 1, duration: .18 });
    const botoes = [...tela.querySelectorAll('.pl-escolher')];
    botoes[0]?.focus({ preventScroll: true });
    anunciar(`Vez ${comDe(pid, 'de')} decidir, em segredo. ${ev.titulo}. ` + opcoes.map((o, i) => `Opção ${i + 1}: ${o.resumo}.`).join(' '));
    let tecla;
    const indice = await aguardar(new Promise(ok => {
      tela.querySelector('.pl-opcoes').addEventListener('click', ev2 => { const b = ev2.target.closest('.pl-escolher'); if (b) ok(+b.dataset.i); });
      tecla = ev2 => { const n = +ev2.key; if (n >= 1 && n <= opcoes.length && !ev2.repeat) { ev2.preventDefault(); ok(n - 1); } };
      document.addEventListener('keydown', tecla);
    })).finally(() => document.removeEventListener('keydown', tecla));
    botoes.forEach(b => (b.disabled = true));
    efeitoSom('clique');
    painel.dataset.fase = 'decidido';
    const carimbo = tpl(`<span class="carimbo indigo grande pl-carimbo">${GLIFOS.ok} Decidido</span>`);
    painel.append(carimbo);
    anunciar(`Decisão ${comDe(pid, 'de')} registrada.`);
    await carimbar(carimbo, { som: 'voto', tremida: 0 });
    await espera(650);
    await fim(gsap.to([...cards, carimbo], { opacity: 0, y: RM ? 0 : -2 * uPx(), duration: RM ? .15 : .22, ease: 'power2.in' }));
    carimbo.remove();
    return indice;
  }

  // Revelação: cada potência vira um tijolinho com a forma da equipe que encaixa na coluna da opção escolhida
  async function revelar(painel, e, ev, local, escolhas, resultado, opcoes, ordem, r) {
    delete painel.dataset.equipe;
    painel.classList.add('anil');
    painel.dataset.fase = 'revelacao';
    const col = ev.escolha.coletivo, conta = opcoes.map((_, i) => Object.values(escolhas).filter(x => x === i).length);
    const juntos = col ? conta[col.opcao] >= col.min : null;
    painel.querySelector('.painel-cab').innerHTML = `${kit('jornal', { classe: 'painel-objeto pl-objeto' })}
      <h2 class="painel-titulo" id="pl-dec-tit">Todas as potências decidiram<small class="painel-sub">${esc(ev.titulo)}</small></h2>`;
    const tela = painel.querySelector('.tela');
    tela.innerHTML = `<div class="pl-colunas">${opcoes.map((o, i) => `<div class="pl-coluna cat-${esc(o.categoria)}">
        <div class="pl-coluna-cab peca cat-${esc(o.categoria)}"><span class="soquete">${ico(ICONE_CAT[o.categoria] || '💬', 48)}</span><span>${esc(o.resumo)}</span></div>
        <div class="pl-pilha" role="list" aria-label="Quem escolheu ${esc(o.resumo)}"></div>
        <div class="pl-base peca pinos"><b class="num pl-conta">0</b><span class="so-leitor"> potências</span></div>
        <p class="pl-porque"><b>Por quê?</b> ${esc(ev.escolha.opcoes[i]?.porque || '')}</p></div>`).join('')}</div>
      ${col ? `<div class="pl-coletivo" hidden></div>` : ''}
      <div class="pl-efeitos" hidden><span class="pl-efeitos-rot">Efeito no mundo</span><ul class="pl-chips" role="list"></ul></div>`;
    painel.querySelector('.painel-rodape').innerHTML = `<span class="dica">${ico('📰', 40)} Cada escolha vira manchete no Jornal Mundial.</span>
      <button class="btn btn-principal peca pinos" data-teste="continuar-painel" hidden>Continuar ${GLIFOS.seta}</button>`;
    const u = uPx(), colunas = [...tela.querySelectorAll('.pl-coluna')];
    const tl = gsap.timeline();
    tl.fromTo(colunas, RM ? { opacity: 0 } : { opacity: 0, y: 3 * u }, { opacity: 1, y: 0, duration: RM ? .2 : .32, stagger: .08, ease: 'back.out(1.6)' });
    ordem.forEach((pid, k) => {
      const i = escolhas[pid];
      const tij = tpl(`<span class="pl-tijolinho peca pinos" data-equipe="${pid}" role="listitem">${formaDe(pid, { branca: true })}<span class="pl-tij-nome">${esc(nomeCurto(pid))}</span></span>`);
      tij.style.opacity = 0;
      colunas[i].querySelector('.pl-pilha').append(tij);
      const quando = .45 + k * (RM ? .05 : .2), contador = colunas[i].querySelector('.pl-conta');
      if (RM) tl.to(tij, { opacity: 1, duration: .15 }, quando);
      else tl.fromTo(tij, { opacity: 0, y: -14 * u, rotation: k % 2 ? 18 : -18, scale: 1.2 }, { opacity: 1, y: 0, rotation: 0, scale: 1, duration: .42, ease: 'power2.in' }, quando)
        .fromTo(tij, { scaleY: .82 }, { scaleY: 1, duration: .14, ease: 'back.out(3)' }, quando + .42);
      tl.add(() => { som('tijolo', { i: k }); contador.textContent = Number(contador.textContent) + 1; if (!RM) gsap.fromTo(contador, { scale: 1.5 }, { scale: 1, duration: .3, ease: 'back.out(3)' }); }, quando + (RM ? 0 : .42));
    });
    anunciar('Revelação. ' + opcoes.map((o, i) => `${o.resumo}: ${listaNomes(ordem.filter(p => escolhas[p] === i).map(nomeCurto)) || 'ninguém'}.`).join(' '));
    await r.anim(tl);
    await r.dormir(400);
    // ação coletiva: juntos o mundo sente; cada um por si, o efeito não vem
    if (col) {
      const caixa = tela.querySelector('.pl-coletivo');
      const precisa = `Ação coletiva: precisava de ${col.min} potências em “${opcoes[col.opcao].resumo}”; ${conta[col.opcao] === 1 ? 'foi 1' : `foram ${conta[col.opcao]}`}.`;
      caixa.innerHTML = `<span class="carimbo ${juntos ? 'verde' : 'cinza'} pl-carimbo-coletivo" hidden>${juntos ? GLIFOS.ok + ' Juntos!' : GLIFOS.nao + ' Cada um por si'}</span>
        <div><p class="pl-coletivo-manchete">${esc((juntos ? col.manchete : col.mancheteSenao) || (juntos ? 'O mundo age junto e sente o efeito' : 'Sem acordo, o efeito coletivo não vem'))}</p><p class="pl-coletivo-regra">${esc(precisa)}</p></div>`;
      caixa.hidden = false;
      if (!RM) gsap.fromTo(caixa, { opacity: 0, y: 1.6 * u }, { opacity: 1, y: 0, duration: .3, ease: 'power2.out' });
      await carimbar(caixa.querySelector('.carimbo'), { som: 'martelo', tremida: juntos ? .25 : 0 });
      if (juntos) { som('sucesso'); confeteDe(caixa.querySelector('.carimbo'), { particleCount: 40 }); }
      anunciar(`${juntos ? 'Juntos!' : 'Cada um por si.'} ${precisa}`);
    }
    await mostrarNumeros(tela.querySelector('.pl-efeitos'), e, (resultado?.mudancas || []).filter(m => m.quem === 'global' || m.quem === local), local, r);
    const btn = painel.querySelector('[data-teste="continuar-painel"]');
    btn.hidden = false;
    painel.dataset.fase = 'pronto';
    if (!RM) gsap.fromTo(btn, { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: 'back.out(2)' });
    btn.focus({ preventScroll: true });
    await aguardar(new Promise(ok => btn.addEventListener('click', () => { efeitoSom('clique'); ok(); }, { once: true })));
  }

  async function decidir(e, ev, local) {
    const S = Sim();
    if (!S?.resolverDecisao || !S?.iaDecisao) return null;   // contrato ainda não chegou ao motor
    const opcoes = ev.escolha.opcoes.map(({ texto, resumo, categoria }) => ({ texto, resumo, categoria }));
    const pids = Object.keys(e.potencias);
    const ordem = (S.ordemDaRodada ? S.ordemDaRodada(e) : pids).filter(p => e.potencias[p]);
    const humanos = ordem.filter(p => e.potencias[p].humano);
    const r = novoRoteiro();
    const painel = tpl(`<section class="painel peca pinos painel-g pl-decisao" aria-labelledby="pl-dec-tit" data-fase="decisao">
      <header class="painel-cab"></header><div class="tela"></div><footer class="painel-rodape"></footer></section>`);
    painel.addEventListener('pointerdown', ev2 => { if (painel.dataset.fase === 'revelacao' && !ev2.target.closest('button')) r.adiantar(); });
    const teclas = ev2 => { if (painel.dataset.fase === 'revelacao' && [' ', 'Enter', 'PageDown'].includes(ev2.key)) { ev2.preventDefault(); r.adiantar(); } };
    document.addEventListener('keydown', teclas, true);
    const escolhas = {};
    try {
      const retratos = conselheiros(opcoes);
      if (humanos.length) cabecalhoEquipe(painel, e, humanos[0], 1, humanos.length); else painel.classList.add('anil');
      await abrirPainel(painel, { som: 'whoosh' });
      for (const [k, pid] of humanos.entries()) escolhas[pid] = await vezDeDecidir(painel, e, ev, local, pid, k + 1, humanos.length, opcoes, retratos);
      for (const pid of pids) if (escolhas[pid] === undefined) escolhas[pid] = S.iaDecisao(e, pid, ev.id, local);
      const resultado = S.resolverDecisao(e, ev.id, local, escolhas);
      await revelar(painel, e, ev, local, escolhas, resultado, opcoes, ordem, r);
      return { escolhas, ...resultado };
    } finally {
      document.removeEventListener('keydown', teclas, true);
      if (painel.isConnected) await fecharPainel(painel).catch(() => painel.remove());
    }
  }

  // ============================== CONTRATO ==============================
  async function noticia(e, { id, local = null } = {}, mudancas = []) {
    const ev = evento(id);
    if (!ev || !e) return { id, local, escolha: null, resultado: null };
    const saida = await reportagem(e, ev, local, Array.isArray(mudancas) ? mudancas : mudancas?.mudancas || []);
    const tipo = ev.escolha?.tipo || null;
    let resultado = null;
    if (tipo === 'votacao' && typeof ONU !== 'undefined' && ONU.votacao) {
      const res = typeof RESOLUCOES !== 'undefined' ? RESOLUCOES.find(x => x.id === ev.escolha.resolucao) : null;
      resultado = await aguardar(ONU.votacao(e, { id: ev.escolha.resolucao, alvo: res?.alvo === 'conflito' ? local : null, proponente: null }));
    } else if (tipo === 'doacao' && typeof ONU !== 'undefined' && ONU.doacao) {
      resultado = await aguardar(ONU.doacao(e, ev, local));
    } else if (tipo === 'decisao') {
      resultado = await decidir(e, ev, local);
    }
    if (tipo) mapa()?.atualizarMundo?.(e, { animar: true });
    mapa()?.visaoGeral?.();   // a câmera volta ao mapa inteiro para o que vem depois
    return { id, local, escolha: tipo, resultado, pulou: saida === 'pular' };
  }

  return { noticia, chipsDe, EFEITO_DO_EVENTO };
})();
