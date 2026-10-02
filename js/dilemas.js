'use strict';
/* Geografia Irada — Dilemas de governo: o "Gabinete" (guia de arte §5.11, docs/DESIGN.md §9).
   Não é prova: a situação fica à esquerda e três conselheiros (bonecos com o chapéu do tema) defendem cada um um caminho.
   A equipe escolhe, confirma, e a consequência aparece no mapa, no HUD e no Jornal Mundial, com o porquê e o conceito.
   Contrato: Dilemas.vez(e, pid) → Promise<{ id, opcao, resultado } | null> · Dilemas.mostrarIA(e, pid, { id, opcao, resultado? })
   → Promise curta. data-teste: opcao-<n> (cartão do caminho), confirmar, continuar-painel. Aparência: css/dilemas.css. */

const Dilemas = (() => {
  // Categorias (guia §2.8): ícone e nome na tela
  const CAT = { diplomacia: ['🤝', 'Diplomacia'], economia: ['💰', 'Economia e Comércio'], natureza: ['🌱', 'Natureza e Energia'],
    seguranca: ['🛡️', 'Paz e Segurança'], pessoas: ['👥', 'Pessoas e Direitos'], ciencia: ['💡', 'Ciência e Informação'] };
  const catDe = c => CAT[c] || CAT.diplomacia;
  // Ícones de arma no conteúdo viram ícones neutros (guia §11.3, item 12; pendência registrada com o Conteúdo)
  const ICONE_NEUTRO = { '💣': '⚖️', '🪖': '🛡️' };
  // Efeito no mapa por tema do caminho escolhido (conflito que sobe ou desce manda mais)
  const EFEITO_MAPA = { diplomacia: 'acordo', economia: 'comercio', pessoas: 'ajuda' };
  // Rótulos das mudanças: [ícone, nome, sentido (1 = subir é bom, −1 = subir é ruim, 0 = neutro), fator, unidade]
  const ROT = {
    economia: ['💰', 'Economia', 1], bemEstar: ['❤️', 'Bem-estar', 1], ambiente: ['🌳', 'Ambiente', 1], seguranca: ['🛡️', 'Segurança', 1],
    apoio: ['🗳️', 'Apoio popular', 1], militar: ['🛡️', 'Força militar', 0], cp: ['', 'Capital Político', 1],
    'recursos.alimentos': ['🌾', 'Alimentos', 1], 'recursos.energia': ['⚡', 'Energia', 1], 'recursos.minerais': ['💎', 'Minerais', 1],
    'recursos.tecnologia': ['💻', 'Tecnologia', 1], 'producao.tecnologia': ['💻', 'Produção de tecnologia', 1],
    'producao.minerais': ['💎', 'Produção de minerais', 1], desmatamento: ['🌳', 'Desmatamento', -1], limpa: ['☀️', 'Energia limpa', 1],
    fossil: ['🏭', 'Energia fóssil', -1], vulnerabilidade: ['⚠️', 'Vulnerabilidade', -1],
    cooperacao: ['🕊️', 'Cooperação', 1], comercio: ['🚢', 'Comércio', 1], tensao: ['⏰', 'Relógio', 1, -3, ' s'],
    temperatura: ['🌡️', 'Temperatura', -1, 1, ' °C'], deslocados: ['🧳', 'Deslocados', -1, 1, ' mi'], energia: ['🛢️', 'Preço da energia', 0],
    influencia: ['', 'Influência', 1], estabilidade: ['🏛️', 'Estabilidade', 1], desenvolvimento: ['📈', 'Desenvolvimento', 1],
    conflito: ['⚠️', 'Conflito', -1], pressao: ['📣', 'Pressão', -1], floresta: ['🌳', 'Floresta', 1],
  };
  // Conselheiros: pessoas diferentes em cada caminho (tom de pele, cabelo e penteado variados; nenhum é "o padrão")
  const PELES = ['tom1', 'tom2', 'tom3', 'tom4', 'tom5', 'tom6'], CABELOS = ['castanho', 'preto', 'loiro', 'ruivo', 'castanho-claro', 'grisalho'];
  const PENTEADOS = ['curto', 'coque', 'black', 'franja', 'longo', 'trancas', 'careca'];

  const S = () => (typeof Simulacao !== 'undefined' ? Simulacao : {});
  const temMapa = () => typeof Mapa3D !== 'undefined' && !!Mapa3D.renderer;
  const ico = (e, px = 64) => (typeof imgIcone === 'function' ? imgIcone(ICONE_NEUTRO[e] || e, px) : '');
  const nomeDe = id => S().nome?.(id) ?? id;
  const com = (id, prep) => S().com?.(id, prep) ?? nomeDe(id);
  const preencher = (t, pid, local) => S().preencher?.(t, pid, local) ?? t;
  const hash = t => [...String(t)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;
  const u = () => uPx();

  // ---------- Retratos (Cenas3D.retrato, em cache) ----------
  function conselheiro(cat, id, i) {
    const h = hash(id);
    return Bonecos.conselheiro(cat, { pele: PELES[(h + i * 2) % 6], cabelo: CABELOS[(h + i * 5) % 6], penteado: PENTEADOS[(h + i * 3) % 7] });
  }
  function retratoConselheiro(cat, id, i, expressao) {
    if (typeof Cenas3D === 'undefined' || typeof Bonecos === 'undefined') return Promise.resolve('');
    return Cenas3D.retrato(conselheiro(cat, id, i), { expressao, tamanho: 256, enquadramento: 'busto' }).catch(() => '');
  }
  function retratoEquipe(pid) {
    if (typeof Cenas3D === 'undefined' || typeof Bonecos === 'undefined') return Promise.resolve('');
    const av = (typeof Jogo !== 'undefined' && Jogo.avatarDe?.(pid)) || Bonecos.avataresIniciais([pid], 3)[0];
    return Cenas3D.retrato(av, { expressao: 'pensativo', tamanho: 128, enquadramento: 'rosto' }).catch(() => '');
  }
  // Põe a imagem quando ficar pronta (até lá, o lugar fica vazio, sem ícone de imagem quebrada)
  const porFoto = (img, promessa) => promessa.then(url => {
    if (!url || !img) return;
    img.src = url;
    img.closest('[data-foto]')?.setAttribute('data-foto', 'pronta');
  });

  // ---------- Esperas puláveis (clique, Espaço, Enter ou PageDown levam ao fim) ----------
  function pausa(ms) {
    return aguardar(new Promise(ok => {
      const tecla = ev => { if ([' ', 'Enter', 'PageDown'].includes(ev.key)) { ev.preventDefault(); sair(); } };
      const sair = () => { clearTimeout(t); removeEventListener('pointerdown', sair, true); removeEventListener('keydown', tecla, true); ok(); };
      const t = setTimeout(sair, RAPIDO ? ms / 10 : ms);
      addEventListener('pointerdown', sair, true);
      addEventListener('keydown', tecla, true);
    }));
  }

  // ---------- Mudanças → chips "o que mudou" e números no mapa ----------
  const casasDe = d => (Number.isInteger(d) ? 0 : Math.abs(d) < 1 ? 2 : 1);
  function resumirMudancas(mudancas, pid, local) {
    const grupos = new Map(), parcerias = [];
    for (const m of mudancas || []) {
      if (m.v === 'parceiro') { if (m.depois) parcerias.push(m); continue; }
      const r = ROT[m.v];
      if (!r || typeof m.antes !== 'number' || typeof m.depois !== 'number' || m.de) continue;
      const onde = m.quem === pid ? 'eu' : m.quem === 'global' ? 'global' : m.quem === local ? 'local' : 'outros';
      const chave = onde + '|' + m.v;
      const g = grupos.get(chave) || { r, v: m.v, onde, quem: m.quem, delta: 0, n: 0 };
      g.delta += m.depois - m.antes; g.n++;
      grupos.set(chave, g);
    }
    const ordem = { eu: 0, local: 1, global: 2, outros: 3 };
    const lista = [...grupos.values()].filter(g => Math.abs(g.delta) > 1e-6).sort((a, b) => ordem[a.onde] - ordem[b.onde]);
    return { lista: lista.slice(0, 6), parcerias };
  }
  function chipMudanca(g, pid) {
    const [emoji, nome, sentido, fator = 1, unidade = ''] = g.r;
    const media = g.delta / (g.onde === 'outros' ? g.n : 1), valor = media * fator;
    const bom = Math.sign(valor) * sentido;
    const icone = g.v === 'influencia' ? formaDe(pid) : g.v === 'cp' ? '<i class="pino-cp"></i>' : ico(emoji, 48);
    const onde = g.onde === 'outros' ? (g.n > 1 ? ` em ${g.n} lugares` : ' ' + com(g.quem, 'em')) : '';
    const num = sinal(valor, casasDe(Math.round(valor * 100) / 100)) + unidade.replace(' ', FINO);
    return `<li class="pilula dl-chip"><span class="dl-chip-ico">${icone}</span>${esc(nome + onde)} <b class="${bom > 0 ? 'sobe' : bom < 0 ? 'desce' : ''}">${num}</b></li>`;
  }
  // Números que sobem no lugar e na casa de quem decidiu: os 2 maiores de cada lugar, um de cada vez (não se sobrepõem)
  function numerosNoMapa(mudancas, pid, local) {
    if (!temMapa()) return;
    const porLugar = {};
    for (const m of mudancas || []) {
      if (typeof m.antes !== 'number' || typeof m.depois !== 'number' || m.de || (m.quem !== pid && m.quem !== local) || !ROT[m.v]) continue;
      if (m.depois !== m.antes) (porLugar[m.quem] ||= []).push(m);
    }
    for (const lista of Object.values(porLugar)) {
      lista.sort((a, b) => Math.abs(b.depois - b.antes) - Math.abs(a.depois - a.antes)).slice(0, 2).forEach((m, k) => {
        const d = m.depois - m.antes, r = ROT[m.v], texto = sinal(d, casasDe(Math.round(d * 100) / 100));
        espera(k * 800).then(() => (m.v === 'influencia' ? Mapa3D.numeroFlutuante(m.quem, texto, pid)
          : Mapa3D.numeroFlutuante(m.quem, `${texto} ${r[1]}`, (r[2] || 1) * d > 0 ? 'ganho' : 'perda'))).catch(() => {});
      });
    }
  }

  // Medalhão do conselheiro: disco na cor do tema; o corpo fica dentro do disco e a cabeça salta para fora
  const medalhao = (cat, classe = '') =>
    `<span class="dl-medalhao cat-${esc(cat)} ${classe}" data-foto="esperando" aria-hidden="true"><img class="dl-busto" alt="" draggable="false"></span>`;

  // ---------- O Gabinete (painel G) ----------
  function montarGabinete(e, pid, d) {
    const el = document.createElement('section');
    el.className = 'painel peca pinos painel-g dl-gabinete';
    el.dataset.equipe = pid;
    el.setAttribute('aria-labelledby', 'dl-titulo');
    el.setAttribute('aria-describedby', 'dl-texto');
    const lugar = d.local ? `<span class="pilula dl-lugar">${ico('📍', 48)}${esc(nomeDe(d.local))}</span>` : '';
    const cartoes = d.opcoes.map((o, i) => {
      const [emoji, nomeCat] = catDe(o.categoria);
      return `<button type="button" class="dl-cartao cat-${esc(o.categoria)}" aria-pressed="false" data-teste="opcao-${i}" data-i="${i}">
        ${medalhao(o.categoria)}
        <span class="dl-placa peca pinos cat-${esc(o.categoria)}">
          <span class="dl-cat"><span class="soquete">${ico(emoji, 48)}</span>${esc(nomeCat)}</span>
          <span class="dl-resumo">${esc(o.resumo)}</span>
          <span class="dl-fala balao peca">${esc(o.texto)}</span>
          <span class="dl-escolher"><span class="dl-tecla" aria-hidden="true">${i + 1}</span><span class="dl-rot-escolher">Escolher</span><span class="dl-rot-escolhido">${GLIFOS.ok} Escolhido</span></span>
        </span>
        <span class="carimbo indigo dl-carimbo" hidden>Decidido</span>
      </button>`;
    }).join('');
    el.innerHTML = `
      <header class="painel-cab">
        <span class="retrato dl-equipe" data-equipe="${pid}" data-foto="esperando"><img alt="">${formaDe(pid)}</span>
        <h2 class="painel-titulo" id="dl-titulo">Gabinete ${esc(com(pid, 'de'))}<small class="painel-sub">${esc(nomeEquipe(pid))} · decisão de ${fmtAno(e.ano)}</small></h2>
      </header>
      <div class="tela dl-mesa">
        <article class="dl-situacao">
          <span class="soquete dl-icone">${ico(d.icone, 96)}</span>
          <p class="dl-rotulo">Situação de ${fmtAno(e.ano)}${lugar}</p>
          <h3 class="dl-titulo">${esc(d.titulo)}</h3>
          <p class="dl-texto" id="dl-texto">${esc(d.texto)}</p>
          ${arte('prancheta', { classe: 'dl-dossie' })}
        </article>
        <div class="dl-conselho" role="group" aria-label="Caminhos possíveis: escolha um">${cartoes}</div>
      </div>
      <footer class="painel-rodape">
        <span class="dica">${ico('💬', 48)} Não há resposta certa: cada caminho tem ganhos e custos. Conversem antes de decidir!</span>
        <button type="button" class="btn btn-principal peca pinos dl-confirmar" data-teste="confirmar" disabled>${GLIFOS.ok} Confirmar</button>
      </footer>`;
    return el;
  }

  // Espera a equipe escolher um caminho e confirmar → índice
  function escolher(el, d) {
    const cartoes = [...el.querySelectorAll('.dl-cartao')], conf = el.querySelector('.dl-confirmar');
    let sel = -1;
    const marcar = i => {
      if (i === sel) return;
      sel = i;
      cartoes.forEach((c, k) => c.setAttribute('aria-pressed', String(k === i)));
      conf.disabled = false;
      const med = cartoes[i].querySelector('.dl-medalhao');
      if (!RM) gsap.fromTo(med, { y: 0 }, { y: -1.4 * u(), duration: .16, ease: 'power2.out', yoyo: true, repeat: 1 });
      anunciar(`Caminho escolhido: ${d.opcoes[i].resumo}. Para decidir, aperte Confirmar.`);
    };
    return aguardar(new Promise(ok => {
      cartoes.forEach((c, i) => c.addEventListener('click', () => { efeitoSom('clique'); marcar(i); }));
      el.addEventListener('keydown', ev => {
        const k = Number(ev.key);
        if (k >= 1 && k <= cartoes.length && !ev.repeat) { ev.preventDefault(); efeitoSom('clique'); marcar(k - 1); cartoes[k - 1].focus(); }
      });
      conf.addEventListener('click', () => {
        if (sel < 0 || conf.dataset.feito) return;
        conf.dataset.feito = '1';
        efeitoSom('clique');
        ok(sel);
      });
    }));
  }

  // O caminho escolhido vai para o centro e recebe o carimbo; os outros saem de cena
  async function decidir(el, i, pid) {
    const cartoes = [...el.querySelectorAll('.dl-cartao')], c = cartoes[i], outros = cartoes.filter(x => x !== c);
    el.classList.add('decidido');
    cartoes.forEach(x => (x.disabled = true));
    el.querySelector('.dl-confirmar').disabled = true;
    const grupo = el.querySelector('.dl-conselho').getBoundingClientRect(), b = c.getBoundingClientRect();
    const tl = gsap.timeline();
    if (RM) tl.to(outros, { opacity: .4, duration: .18 });
    else tl.to(outros, { opacity: .4, y: 3 * u(), scale: .96, duration: .3, ease: 'power2.in', stagger: .05 })
      .to(c, { x: grupo.left + grupo.width / 2 - (b.left + b.width / 2), scale: 1.05, duration: .45, ease: 'power2.inOut' }, .1);
    await fim(tl);
    await carimbar(c.querySelector('.dl-carimbo'));
    if (temMapa()) Mapa3D.acaoBoneco(pid, 'votar');
    await pausa(650);
    await fecharPainel(el);
  }

  // ---------- A consequência: mapa → HUD → Jornal Mundial, porquê e conceito ----------
  function montarConsequencia(e, pid, d, i, r, local) {
    const o = d.opcoes[i], [emoji] = catDe(o.categoria), { lista, parcerias } = resumirMudancas(r.mudancas, pid, local);
    // agrupadas por lugar: em casa, no lugar do dilema, no mundo e em outros lugares
    const grupo = (rotulo, itens) => (itens ? `<li class="dl-onde">${rotulo}</li>${itens}` : '');
    const de = onde => lista.filter(g => g.onde === onde).map(g => chipMudanca(g, pid)).join('');
    const parceria = parcerias.map(m => `<li class="pilula dl-chip dl-parceria"><span class="dl-chip-ico">${formaDe(m.depois)}</span>Nova parceria${m.depois === pid ? '' : ' ' + esc(com(m.depois, 'de'))}${m.quem === local ? '' : ': ' + esc(nomeDe(m.quem))}</li>`).join('');
    const chips = grupo(`${formaDe(pid)}${esc(nomeCurto(pid))}`, de('eu')) + (local ? grupo(`${ico('📍', 48)}${esc(nomeDe(local))}`, de('local') + parceria) : '') +
      grupo(`${ico('🌍', 48)}Mundo`, de('global')) + de('outros') + (local ? '' : parceria);
    const sabia = d.vocesabia ? `<div class="dl-sabia">${arte('lampada', { classe: 'dl-sabia-arte' })}
        <p><b class="dl-sabia-tit">Você sabia?</b> ${esc(d.vocesabia)}</p></div>` : '';
    const el = document.createElement('section');
    el.className = 'painel peca painel-g dl-efeito';
    el.dataset.equipe = pid;
    el.setAttribute('aria-labelledby', 'dl-manchete');
    el.innerHTML = `
      <div class="tela dl-efeito-tela">
        <div class="dl-jornal">${cabecalhoJornal({ compacto: true })}<span class="dl-edicao">Edição ${fmtAno(e.ano)}</span></div>
        <h2 class="dl-manchete" id="dl-manchete">${esc(r.manchete || o.resumo)}</h2>
        ${chips ? `<ul class="dl-mudancas" aria-label="O que mudou">${chips}</ul>` : ''}
        <div class="dl-explica cat-${esc(o.categoria)}">
          ${medalhao(o.categoria, 'dl-quem-fala')}
          <p class="dl-porque balao peca"><b>Por quê?</b> ${esc(r.porque)}</p>
        </div>
        <div class="dl-conceito peca cat-${esc(o.categoria)}">
          ${conquista(ICONE_NEUTRO[d.icone] || d.icone || emoji, { cor: o.categoria, classe: 'dl-selo' })}
          <p><span class="dl-conceito-rot">Conceito de geopolítica</span><span class="dl-conceito-nome">${esc(r.conceito || d.conceito || '')}</span></p>
        </div>
        ${sabia}
      </div>`;
    return el;
  }
  function animarConsequencia(el) {
    if (RM) return;
    gsap.from(el.querySelectorAll('.dl-mudancas > li'), { y: 1.4 * u(), opacity: 0, scale: .8, duration: .32, ease: 'back.out(2)', stagger: .07, delay: .3 });
    gsap.from(el.querySelector('.dl-selo'), { scale: 0, rotation: -30, duration: .55, ease: 'elastic.out(1, .5)', delay: .55, onStart: () => efeitoSom('pop') });
    gsap.from(el.querySelector('.dl-porque'), { x: -2 * u(), opacity: 0, duration: .35, ease: 'power2.out', delay: .45 });
  }
  async function consequencia(e, pid, d, i, r, local, fotoFala) {
    const onde = local || pid, cat = d.opcoes[i].categoria;
    if (temMapa()) {
      const conflito = (r.mudancas || []).find(m => m.quem === onde && m.v === 'conflito');
      const tipo = conflito ? (conflito.depois < conflito.antes ? 'paz' : 'conflito') : EFEITO_MAPA[cat] || 'influencia';
      const mundo = Promise.all([Mapa3D.efeito(tipo, onde, { pid }), Mapa3D.atualizarMundo(e, { animar: true })]);
      numerosNoMapa(r.mudancas, pid, local);
      await Promise.race([mundo, pausa(2400)]);
    }
    if (typeof Jogo !== 'undefined') Jogo.atualizarHUD?.({ mudancas: r.mudancas });
    if (typeof Hud !== 'undefined' && r.manchete) Hud.manchete?.(r.manchete);
    await pausa(500);
    const el = montarConsequencia(e, pid, d, i, r, local);
    porFoto(el.querySelector('.dl-quem-fala img'), fotoFala);
    const abre = abrirPainel(el, { veu: false, som: 'virar' });
    animarConsequencia(el);
    anunciar(`${r.manchete}. Por quê? ${r.porque} Conceito: ${r.conceito || d.conceito}.${d.vocesabia ? ' Você sabia? ' + d.vocesabia : ''}`);
    await abre;
    await esperarContinuar(el.querySelector('.dl-efeito-tela'), 'Continuar');
    await fecharPainel(el);
  }

  // ---------- Contrato ----------
  async function vez(e, pid) {
    const d = typeof S().dilemaDaVez === 'function' && typeof S().resolverDilema === 'function' ? S().dilemaDaVez(e, pid) : null;
    if (!d || !d.opcoes?.length) return null;
    const local = d.local || null;
    const fotos = d.opcoes.map((o, i) => retratoConselheiro(o.categoria, d.id, i, i % 2 ? 'determinado' : 'pensativo'));
    const fotoEquipe = retratoEquipe(pid);
    const voo = local && temMapa() ? Mapa3D.focar(local) : null;
    await Promise.race([Promise.all([...fotos, fotoEquipe, voo]), espera(1800)]);
    const el = montarGabinete(e, pid, d);
    el.querySelectorAll('.dl-cartao .dl-busto').forEach((img, i) => porFoto(img, fotos[i]));
    porFoto(el.querySelector('.dl-equipe img'), fotoEquipe);
    // o foco vai para o próprio painel: o leitor de tela lê o título e a situação, e nenhum cartão parece pré-escolhido
    const abre = abrirPainel(el, { foco: el });
    anunciar(`Escolha um dos ${d.opcoes.length} caminhos (teclas 1 a ${d.opcoes.length}) e confirme. Não há resposta certa.`);
    if (!RM) {
      gsap.from(el.querySelectorAll('.dl-situacao > *'), { y: 1.4 * u(), opacity: 0, duration: .3, ease: 'power2.out', stagger: .05, delay: .15 });
      el.querySelectorAll('.dl-cartao').forEach((c, i) => {
        gsap.from(c.querySelector('.dl-placa'), { y: 2 * u(), opacity: 0, duration: .34, ease: 'power2.out', delay: .25 + i * .08 });
        gsap.from(c.querySelector('.dl-medalhao'), { y: 3 * u(), scale: .5, opacity: 0, duration: .5, ease: 'back.out(2)', delay: .4 + i * .09, onStart: () => efeitoSom('pop') });
        gsap.from(c.querySelector('.dl-busto'), { y: 2.4 * u(), duration: .5, ease: 'back.out(2.4)', delay: .5 + i * .09 });
      });
    }
    await abre;
    const respira = [...el.querySelectorAll('.dl-cartao .dl-busto')].map((b, k) => loop(b, { scaleY: 1.025, y: -.15 * u(), duration: 1.3 + k * .17, delay: 1.2 + k * .3 }));
    const i = await escolher(el, d);
    respira.forEach(t => t?.kill());
    const r = S().resolverDilema(e, pid, d.id, i);
    const fotoFala = retratoConselheiro(d.opcoes[i].categoria, d.id, i, 'falando');
    await decidir(el, i, pid);
    await consequencia(e, pid, d, i, r, local, fotoFala);
    if (local && temMapa()) Mapa3D.visaoGeral();
    return { id: d.id, opcao: i, resultado: r };
  }

  // Vez do computador: cartão curto "A China decidiu: …" com o retrato do conselheiro (2,5 s, pulável)
  async function mostrarIA(e, pid, { id, opcao, resultado } = {}) {
    const d = (typeof DILEMAS !== 'undefined' ? DILEMAS : []).find(x => x.id === id), o = d?.opcoes?.[opcao];
    if (!o) return;
    const local = e.potencias?.[pid]?.dilema?.id === id ? e.potencias[pid].dilema.local : null;
    const [emoji, nomeCat] = catDe(o.categoria), quem = preencher('{O quem} {decidiu|decidiram}', pid, local);
    const foto = retratoConselheiro(o.categoria, id, opcao, 'determinado');
    await Promise.race([foto, espera(900)]);
    const el = document.createElement('div');
    el.className = 'dl-ia peca flutua';
    el.setAttribute('role', 'status');
    el.innerHTML = `<span class="dl-ia-aba" data-equipe="${pid}" aria-hidden="true"></span>${medalhao(o.categoria, 'dl-ia-foto')}
      <span class="dl-ia-txt"><span class="dl-ia-quem">${formaDe(pid)} ${esc(quem)}</span><span class="dl-ia-resumo">${esc(o.resumo)}</span>
      <span class="dl-ia-sobre"><span class="pilula cat-${esc(o.categoria)}">${ico(emoji, 48)}${esc(nomeCat)}</span> ${esc(preencher(d.titulo, pid, local))}</span></span>
      <span class="carimbo indigo dl-ia-carimbo" hidden>Decidido</span>`;
    porFoto(el.querySelector('img'), foto);
    $('#camada').append(el);
    anunciar(`${quem}: ${o.resumo}. ${resultado?.manchete || ''}`);
    efeitoSom('pop');
    if (RM) gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .18 });
    else gsap.fromTo(el, { y: 4 * u(), opacity: 0, scale: .85 }, { y: 0, opacity: 1, scale: 1, duration: .38, ease: 'back.out(1.8)' });
    espera(RM ? 200 : 450).then(() => el.isConnected && carimbar(el.querySelector('.dl-ia-carimbo'), { som: 'pop', tremida: 0 })).catch(() => {});
    if (resultado?.mudancas) {
      numerosNoMapa(resultado.mudancas, pid, local);
      if (typeof Jogo !== 'undefined') Jogo.atualizarHUD?.({ mudancas: resultado.mudancas });
    }
    try { await pausa(2500); } finally {
      await fim(gsap.to(el, RM ? { opacity: 0, duration: .15 } : { opacity: 0, y: -1.5 * u(), scale: .96, duration: .22, ease: 'power2.in' })).catch(() => {});
      el.remove();
    }
  }

  return { vez, mostrarIA };
})();
