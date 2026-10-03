'use strict';
/* Geografia Irada — Manual do Diplomata (frente Manual; guia de arte §5.18, §4.6).
   Um livro de instruções de montagem: painel G anil com marcadores de página à direita (cada um no pastel do assunto, com
   ícone), páginas em ladrilho com a "planta de montagem", capa com o objeto do kit, passos numerados em círculos amarelos,
   catálogos gerados do conteúdo (ações, lugares, eventos, resoluções, glossário, BNCC) e o Laboratório de projeções.
   Contrato: Manual.abrir(aba?) → Promise (fim da entrada). aba = objetivo, como-jogar, dilemas, indicadores, acoes,
   territorios, eventos, onu, modos, glossario, projecoes, bncc, professor — ou o id de um capítulo de conteudo/manual.js
   ('cop' abre a aba ONU nesse capítulo). Manual.livro() → HTML de tudo aberto, para o manual.html (impressão).
   O texto vem de MANUAL (marcadores {{...}} trocados pelos valores de Simulacao.PARAM): nada é reescrito aqui, e o que
   faltar some sem quebrar. Capítulo novo que nenhuma aba conhece ganha uma aba própria. */

const Manual = (() => {
  // ============================== AUXILIARES ==============================
  const ic = (e, px = 48) => { if (!e || typeof imgIcone !== 'function') return ''; const h = imgIcone(e, px); return h.startsWith('<') ? h : ''; };
  const obj = (nome, classe = '') => (typeof arte === 'function' ? arte(nome, { classe }) : '');
  const EMOJI = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*/gu;
  const semAcento = t => String(t ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const u = () => (typeof uPx === 'function' ? uPx() : 8);
  const lista = v => (Array.isArray(v) ? v : []);
  const potencia = id => lista(typeof POTENCIAS !== 'undefined' ? POTENCIAS : null).find(p => p.id === id);
  const nomePot = id => potencia(id)?.nome || nomeCurto(id) || id;
  // "do Brasil", "dos Estados Unidos", "para a China"
  const contr = (prep, id) => { const a = potencia(id)?.artigo; return (a ? (prep === 'de' ? 'd' + a : prep + ' ' + a) : prep) + ' ' + nomePot(id); };
  const CONTINENTES = { an: 'América do Norte', as: 'América do Sul', eu: 'Europa', af: 'África', ai: 'Ásia', oc: 'Oceania', po: 'Polos' };
  const RECURSOS = { alimentos: ['🌾', 'alimentos'], energia: ['⚡', 'energia'], minerais: ['💎', 'minerais críticos'], tecnologia: ['💻', 'tecnologia'], economia: ['💰', 'economia'] };

  // ---------- texto do manual: marcadores, passos numerados e ícones Fluent no lugar dos emojis ----------
  function valor(chave) {
    const v = chave.split('.').reduce((o, k) => o?.[k], typeof Simulacao !== 'undefined' ? Simulacao.PARAM : null);
    if (typeof v !== 'number') return v == null ? '—' : esc(v);
    return fmt(v, Number.isInteger(v) ? 0 : Math.min(2, String(v).split('.')[1].length));
  }
  function passos(html) {
    const numerados = /<h3>\s*\d+\.\s/.test(html);
    let n = 0;
    return html.replace(/<h3>([\s\S]*?)<\/h3>/g, (_, t) => {
      t = t.trim();
      const em = t.match(/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*/u), num = t.match(/^(\d+)\.\s*/);
      let marca;
      if (em && ic(em[1])) { marca = `<span class="mn-passo-ic soquete">${ic(em[1], 64)}</span>`; t = t.slice(em[0].length); }
      else if (num) { marca = `<span class="mn-passo-n">${num[1]}</span>`; t = t.slice(num[0].length); }
      else marca = numerados ? '<span class="mn-passo-n pino" aria-hidden="true"></span>' : `<span class="mn-passo-n">${++n}</span>`;
      return `<h4 class="mn-passo">${marca}<span>${t}</span></h4>`;
    });
  }
  const preparar = html => passos(String(html ?? '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => valor(k))).replace(EMOJI, e => ic(e, 48));

  // ============================== AS ABAS (marcadores de página) ==============================
  // tom = pastel do marcador · caps = capítulos de MANUAL · antes/depois = catálogos gerados
  const ABAS = [
    { id: 'objetivo', nome: 'Missão 2050', icone: '🌍', arte: 'selo-missao-2050', tom: 'amarelo', caps: ['objetivo'],
      lead: 'Treze potências, um planeta só: o que a turma precisa fazer até 2050.' },
    { id: 'como-jogar', nome: 'Como jogar', icone: '🎮', arte: 'pilha-tijolos', tom: 'ciencia', caps: ['como-jogar', 'dicas'],
      lead: 'Cada mandato tem notícias, a vez de cada potência e um balanço. Veja o passo a passo.' },
    { id: 'dilemas', nome: 'Dilemas', icone: '⚖️', arte: 'globo-irado-pensando', tom: 'diplomacia', caps: ['dilemas'],
      lead: 'Escolhas de governo sem resposta certa: cada saída ganha numa coisa e perde em outra.' },
    { id: 'indicadores', nome: 'Indicadores', icone: '📊', arte: 'termometro', tom: 'seguranca', caps: ['indicadores', 'mundo', 'recursos', 'colapso'],
      antes: painelMundo, lead: 'Os números da sua nação e do planeta, e os limites que ninguém pode cruzar.' },
    { id: 'acoes', nome: 'Ações', icone: '🛠️', arte: 'pinos-cp', tom: 'economia', caps: ['acoes'], depois: catalogoAcoes,
      lead: 'O que cada ação custa, o que ela muda no mundo e por quê.' },
    { id: 'territorios', nome: 'Territórios', icone: '🗺️', arte: 'mapa-enrolado', tom: 'natureza', caps: ['territorios'], depois: catalogoLugares,
      lead: 'Influência, parcerias e a ficha de cada lugar do mapa.' },
    { id: 'eventos', nome: 'Jornal Mundial', icone: '📰', arte: 'jornal', tom: 'pessoas', caps: ['eventos'], depois: catalogoEventos,
      lead: 'As notícias que podem entrar no ar e as decisões que elas pedem.' },
    { id: 'onu', nome: 'ONU e clima', icone: '🏛️', arte: 'martelo', tom: 'ciencia', caps: ['onu', 'cop'], depois: catalogoResolucoes,
      lead: 'Votações, vetos e a Cúpula do Clima: quando o mundo decide junto.' },
    { id: 'modos', nome: 'Modos e placar', icone: '🏆', arte: 'trofeu', tom: 'diplomacia', caps: ['missoes', 'infiltrado', 'placar'],
      lead: 'Missões secretas, o agente infiltrado e como o IGI decide quem vence.' },
    { id: 'glossario', nome: 'Glossário', icone: '🔍', arte: 'lupa', tom: 'areia', depois: glossario, consulta: true,
      lead: 'As palavras da geopolítica, explicadas sem complicar. Use a busca!' },
    { id: 'projecoes', nome: 'Projeções', icone: '🧭', arte: 'globo', tom: 'natureza', depois: laboratorio, consulta: true,
      lead: 'Todo mapa distorce alguma coisa. Compare a Groenlândia, a África e o Brasil.' },
    { id: 'bncc', nome: 'BNCC', icone: '🎓', arte: 'escola', tom: 'seguranca', depois: bncc, consulta: true,
      lead: 'As habilidades que a turma vive em cada decisão, e onde elas aparecem no jogo.' },
    { id: 'professor', nome: 'Para o professor', icone: '📚', arte: 'prancheta', tom: 'nevoa', caps: ['professor'], depois: cartaoImprimir, consulta: true,
      lead: 'Roteiro de aula, ideias de debate e como editar o conteúdo.' },
  ];
  const capitulos = () => lista(typeof MANUAL !== 'undefined' ? MANUAL : null).filter(c => c && c.id);
  // abas que têm o que mostrar (+ uma aba para cada capítulo novo que nenhuma aba conhece)
  function abasValidas() {
    const caps = capitulos(), ids = new Set(caps.map(c => c.id)), conhecidos = new Set(ABAS.flatMap(a => a.caps || []));
    const abas = ABAS.map(a => ({ ...a, lista: (a.caps || []).filter(id => ids.has(id)).map(id => caps.find(c => c.id === id)) }))
      .filter(a => a.lista.length || a.depois || a.antes);
    const novos = caps.filter(c => !conhecidos.has(c.id)).map(c => ({ id: 'cap-' + c.id, nome: c.titulo, icone: c.icone, arte: 'manual', tom: 'nevoa', caps: [c.id], lista: [c] }));
    const i = abas.findIndex(a => a.consulta);
    abas.splice(i < 0 ? abas.length : i, 0, ...novos);
    return abas;
  }

  // ============================== PÁGINA ==============================
  function capa(aba, i, total, { impressao } = {}) {
    const um = aba.lista?.length === 1;
    const titulo = um ? aba.lista[0].titulo : aba.nome;
    const sumario = aba.lista?.length > 1 && !impressao ? `<nav class="mn-sumario" aria-label="Nesta página">${aba.lista.map(c =>
      `<button class="pilula mn-ir" data-ir="mn-c-${esc(c.id)}">${ic(c.icone, 40)}${esc(c.titulo)}</button>`).join('')}</nav>` : '';
    return `<header class="mn-capa">
      <div class="mn-capa-arte" aria-hidden="true">${obj(aba.arte, 'mn-capa-obj')}</div>
      <div class="mn-capa-textos">
        <p class="mn-capa-pre">${ic(aba.icone, 40)}Capítulo ${i + 1} de ${total}</p>
        <h3 class="mn-capa-titulo">${esc(titulo)}</h3>
        ${aba.lead ? `<p class="mn-capa-lead">${esc(aba.lead)}</p>` : ''}${sumario}
      </div></header>`;
  }
  function capitulo(c, { titulo = true } = {}) {
    return `<section class="mn-cap" id="mn-c-${esc(c.id)}">${titulo ? `<h3 class="mn-cap-titulo"><span class="soquete">${ic(c.icone, 56)}</span><span>${esc(c.titulo)}</span></h3>` : ''}
      <div class="mn-texto">${preparar(c.html)}</div></section>`;
  }
  function pagina(aba, i, abas, op = {}) {
    const um = aba.lista?.length === 1;
    const extra = f => { try { return f ? f(op) : ''; } catch (erro) { console.warn('Manual: parte da aba não montou', aba.id, erro); return ''; } };
    const ant = abas[i - 1], prox = abas[i + 1];
    const rodape = op.impressao ? '' : `<footer class="mn-rodape">
      ${ant ? `<button class="btn btn-neutro peca mn-virar" data-virar="${ant.id}">${GLIFOS.voltar}<span>${esc(ant.nome)}</span></button>` : '<span></span>'}
      ${prox ? `<button class="btn btn-principal peca pinos mn-virar" data-virar="${prox.id}"><span>Próximo: ${esc(prox.nome)}</span>${GLIFOS.seta}</button>` : ''}</footer>`;
    return capa(aba, i, abas.length, op) + extra(aba.antes) +
      (aba.lista || []).map(c => `<hr class="divisoria">` + capitulo(c, { titulo: !um })).join('') + extra(aba.depois) + rodape;
  }

  // ============================== CATÁLOGO DAS AÇÕES (POLITICAS + CATEGORIAS) ==============================
  const chips = efs => (typeof Hud !== 'undefined' && Hud.chipsEfeitos ? Hud.chipsEfeitos(efs || []) : '');
  const ALVO = { nenhum: 'Sem alvo: vale na hora', territorio: 'Alvo: um território', potencia: 'Alvo: outra potência', territorios3: 'Alvo: até 3 territórios' };
  const REQ = {
    desenvolvimentoMax: v => `com desenvolvimento até ${v}`, estabilidadeMax: v => `com estabilidade até ${v}`,
    produz: v => `que produza ${RECURSOS[v]?.[1] || v}`, conflitoMin: v => (v > 1 ? `com conflito de nível ${v} ou mais` : 'com conflito'),
    conflitoMax: v => (v ? `com conflito de nível ${v} no máximo` : 'em paz'), ouCasa: () => 'ou a sua própria casa',
  };
  function custo(c) {
    const cp = c.custo?.cp || 0;
    const pinos = cp ? `<span class="pilula amarela mn-cp">${'<i class="pino-cp"></i>'.repeat(Math.min(cp, 4))}<b>${cp} CP</b></span>` : '<span class="pilula">Sem CP</span>';
    return pinos + Object.entries(c.custo || {}).filter(([k, v]) => k !== 'cp' && v).map(([k, v]) =>
      `<span class="pilula">${ic(RECURSOS[k]?.[0], 40)}<span><b>${v}</b> de ${esc(RECURSOS[k]?.[1] || k)}</span></span>`).join('');
  }
  function cartaoAcao(c) {
    const cat = typeof CATEGORIAS !== 'undefined' ? CATEGORIAS[c.categoria] : null;
    const reqs = Object.entries(c.requisito || {}).map(([k, v]) => REQ[k]?.(v)).filter(Boolean);
    const extra = Object.entries(c.extra || {}).map(([p, efs]) => `<p class="mn-linha"><b>Bônus ${esc(contr('de', p))}:</b></p><div class="mn-chips">${chips(efs)}</div>`).join('');
    const desconto = Object.entries(c.desconto || {}).map(([p, n]) => `<p class="mn-linha">${ic('⭐', 40)}Custa ${n} CP a menos ${esc(contr('para', p))}.</p>`).join('');
    const efeitos = c.especial === 'mediacao'
      ? `<p class="mn-linha"><b>Se der certo:</b></p><div class="mn-chips">${chips(c.seSucesso)}</div><p class="mn-linha"><b>Se não der:</b></p><div class="mn-chips">${chips(c.seFracasso)}</div>`
      : `<div class="mn-chips">${chips(c.efeitos)}${c.especial === 'votacao' ? `<span class="pilula">${ic('🏛️', 40)}Abre uma votação na ONU</span>` : ''}</div>`;
    return `<article class="mn-cartao mn-acao peca cat-${esc(c.categoria)}" data-busca="${esc(semAcento(c.nome))}">
      <header class="mn-cartao-cab"><span class="soquete">${ic(c.icone, 64)}</span>
        <h5 class="mn-cartao-nome">${esc(c.nome)}${c.fixa ? '<small>Sempre na barra</small>' : ''}</h5></header>
      <div class="mn-cartao-corpo">
        <div class="mn-chips">${custo(c)}</div>
        <p class="mn-linha mn-alvo">${ic('📍', 40)}${esc(ALVO[c.alvo] || 'Alvo especial')}${reqs.length ? ' ' + esc(reqs.join(', ')) : ''}</p>
        ${efeitos}${extra}${desconto}
        ${c.porque ? `<p class="mn-porque"><b>Por quê?</b> ${esc(c.porque)}</p>` : ''}
        <footer class="mn-cartao-pe">${c.conceito ? `<span class="pilula mn-conceito">${ic('💡', 40)}${esc(c.conceito)}</span>` : ''}${codigos(c.bncc)}</footer>
      </div>${cat ? `<span class="so-leitor">Categoria ${esc(cat.nome)}</span>` : ''}</article>`;
  }
  const codigos = cods => lista(cods).map(k => `<span class="mn-codigo">${esc(k)}</span>`).join('');
  function catalogoAcoes() {
    if (typeof POLITICAS === 'undefined' || typeof CATEGORIAS === 'undefined') return '';
    const grupos = Object.entries(CATEGORIAS).map(([id, c]) => [id, c, POLITICAS.filter(p => p.categoria === id)]).filter(g => g[2].length);
    return `<hr class="divisoria"><section class="mn-cap mn-catalogo" id="mn-c-catalogo-acoes">
      <h3 class="mn-cap-titulo"><span class="soquete">${ic('🧱', 56)}</span><span>Catálogo das ${POLITICAS.length} ações</span></h3>
      <nav class="mn-filtros" aria-label="Ir para a categoria">${grupos.map(([id, c, l]) =>
        `<button class="pilula cat-${id} mn-ir" data-ir="mn-cat-${id}">${ic(c.icone, 40)}${esc(c.nome)} <b>${l.length}</b></button>`).join('')}</nav>
      ${grupos.map(([id, c, l]) => `<h4 class="mn-grupo peca cat-${id}" id="mn-cat-${id}"><span class="soquete">${ic(c.icone, 56)}</span>${esc(c.nome)}</h4>
        <div class="mn-grade">${l.map(cartaoAcao).join('')}</div>`).join('')}</section>`;
  }

  // ============================== LUGARES (TERRITORIOS + POTENCIAS + FICHAS) ==============================
  const nivel = (v, inverso) => (inverso ? (v >= 60 ? 'risco' : v >= 40 ? 'medio' : 'bom') : (v < 50 ? 'risco' : v < 70 ? 'medio' : 'bom'));
  const medidor = (icone, rotulo, v, inverso) => `<div class="mn-med">${ic(icone, 40)}<span class="mn-med-rot">${rotulo}</span>
    <span class="seg" role="meter" aria-label="${rotulo}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v)}" data-nivel="${nivel(v, inverso)}" style="--n:${Math.round(v / 10)};--total:10"></span><b class="num">${Math.round(v)}</b></div>`;
  const vocesabia = f => (f?.fatos?.length ? `<div class="mn-sabia">${obj('lupa', 'mn-sabia-obj')}<div><p class="mn-sabia-tit">Você sabia?</p>
    ${f.fatos.slice(0, 2).map(x => `<p>${esc(x.texto)}${x.fonte ? ` <small>(${esc(x.fonte)})</small>` : ''}</p>`).join('')}</div></div>` : '');
  function fichaLugar(id) {
    const t = lista(typeof TERRITORIOS !== 'undefined' ? TERRITORIOS : null).find(x => x.id === id), p = potencia(id);
    const f = typeof FICHAS !== 'undefined' ? FICHAS[id] : null;
    if (p) {
      const em = (e, rot) => (e ? `<div class="mn-dado"><span>${rot}</span><b class="num">${fmt(e.valor, Number.isInteger(e.valor) ? 0 : 1)}</b><small>${esc(e.unidade || '')}${e.ano ? ` · ${e.ano}` : ''}</small></div>` : '');
      return `<article class="mn-ficha peca">
        <header class="mn-ficha-cab"><span class="soquete mn-forma">${formaDe(id)}</span><div><h5 class="mn-ficha-nome">${esc(p.nome)}</h5>
          <p class="mn-ficha-sub">${esc(nomeEquipe(id))} · ${esc(p.lema || '')}</p></div></header>
        ${f?.resumo ? `<p class="mn-ficha-texto">${esc(f.resumo)}</p>` : ''}
        <div class="mn-forca">${p.forca ? `<p><span class="pilula mn-bom">${ic('⭐', 40)}Força</span> <b>${esc(p.forca.titulo)}:</b> ${preparar(esc(p.forca.texto))}</p>` : ''}
          ${p.fraqueza ? `<p><span class="pilula mn-mau">${ic('⚠️', 40)}Fraqueza</span> <b>${esc(p.fraqueza.titulo)}:</b> ${esc(p.fraqueza.texto)}</p>` : ''}</div>
        ${f?.dado ? `<p class="mn-linha">${ic('📊', 40)}${esc(f.dado)}</p>` : ''}
        <p class="mn-rot">Emissões de CO₂: olhe os três números juntos</p>
        <div class="mn-dados">${em({ valor: Math.round(((p.fossil || 0) + (p.desmatamento || 0)) * 10) / 10, unidade: 'bilhões de t por ano (2026, no jogo)' }, 'Total')}${em(f?.emissoesPerCapita, 'Por pessoa')}${em(f?.emissoesHistoricas, 'Desde 1850')}</div>
        ${vocesabia(f)}</article>`;
    }
    if (!t) return '';
    const conf = t.conflito > 0 ? `<span class="pilula alerta">${'<i class="mn-bloco">!</i>'.repeat(t.conflito)} Conflito ${['', 'leve', 'intenso', 'guerra aberta'][t.conflito] || ''}</span>`
      : `<span class="pilula">${ic('🕊️', 40)}Em paz</span>`;
    const rec = Object.entries(t.recursos || {}).filter(([, n]) => n > 0).map(([r, n]) => `<span class="pilula">${ic(RECURSOS[r]?.[0], 40)}${esc(RECURSOS[r]?.[1] || r)} <b>${n}</b></span>`).join('');
    const inf = Object.entries(t.influencia || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([q, n]) =>
      `<span class="pilula">${formaDe(q)}${esc(nomeCurto(q))} <b>${n}</b></span>`).join('');
    return `<article class="mn-ficha peca">
      <header class="mn-ficha-cab"><span class="soquete mn-cont" style="--soquete:${corDe(t.continente) || '#E9E0CC'}">${ic(t.protegido || t.continente === 'po' ? '🧊' : '📍', 56)}</span>
        <div><h5 class="mn-ficha-nome">${esc(t.nome)}</h5><p class="mn-ficha-sub">${esc(CONTINENTES[t.continente] || '')}${t.populacao ? ` · ${esc(fmtMilhoes(t.populacao))} de habitantes` : ''}</p></div></header>
      ${t.paises && t.paises !== t.nome ? `<p class="mn-linha mn-paises">${esc(t.paises)}</p>` : ''}
      <div class="mn-chips">${conf}${rec}</div>
      ${t.continente === 'po' ? '' : `<div class="mn-meds">${medidor('📈', 'Desenvolvimento', t.desenvolvimento ?? 0)}${medidor('⚖️', 'Estabilidade', t.estabilidade ?? 0)}${medidor('🌊', 'Vulnerabilidade ao clima', t.vulnerabilidade ?? 0, true)}</div>`}
      ${inf ? `<div class="mn-chips"><span class="mn-rot">Influência em 2026</span>${inf}</div>` : ''}
      ${(f?.resumo && t.descricao && semAcento(f.resumo).slice(0, 30) === semAcento(t.descricao).slice(0, 30) ? [f.resumo] : [t.descricao, f?.resumo])   // quase iguais: só a ficha
        .filter((x, i, l) => x && l.indexOf(x) === i).map(x => `<p class="mn-ficha-texto">${esc(x)}</p>`).join('')}
      ${vocesabia(f)}</article>`;
  }
  function catalogoLugares({ impressao } = {}) {
    if (typeof TERRITORIOS === 'undefined') return '';
    const pots = PIDS.filter(potencia);
    const grupos = Object.entries(CONTINENTES).map(([k, n]) => [k, n, TERRITORIOS.filter(t => t.continente === k)]).filter(g => g[2].length);
    const titulo = `<hr class="divisoria"><section class="mn-cap" id="mn-c-fichas"><h3 class="mn-cap-titulo"><span class="soquete">${ic('📍', 56)}</span><span>Fichas dos lugares</span></h3>
      <p class="mn-nota">Números de 2026, uma aproximação didática de dados reais. Durante a partida, toque num lugar do mapa para ver como ele está agora.</p>`;
    if (impressao) return titulo + `<h4 class="mn-grupo peca">${ic('🏛️', 48)}As ${PIDS.length} potências</h4><div class="mn-grade">${pots.map(fichaLugar).join('')}</div>` +
      grupos.map(([, n, l]) => `<h4 class="mn-grupo peca">${ic('📍', 48)}${esc(n)}</h4><div class="mn-grade">${l.map(t => fichaLugar(t.id)).join('')}</div>`).join('') + '</section>';
    const botao = (id, nome, marca) => `<button class="mn-lugar peca" aria-pressed="false" data-lugar="${esc(id)}">${marca}<span>${esc(nome)}</span></button>`;
    return titulo + `<div class="mn-lugares">
      <div class="mn-lugares-lista" role="group" aria-label="Escolha um lugar">
        <p class="mn-rot">As ${PIDS.length} potências</p><div class="mn-lugares-grupo">${pots.map(id => botao(id, nomePot(id), formaDe(id))).join('')}</div>
        ${grupos.map(([k, n, l]) => `<p class="mn-rot">${esc(n)}</p><div class="mn-lugares-grupo">${l.map(t =>
          botao(t.id, t.nome, `<i class="mn-pastilha" style="--c:${corDe(k) || '#E9E0CC'}"></i>`)).join('')}</div>`).join('')}
      </div>
      <div class="mn-lugares-ficha" aria-live="polite">${fichaLugar(pots[0] || TERRITORIOS[0]?.id)}</div></div></section>`;
  }
  function ligarLugares(raiz) {
    const caixa = raiz.querySelector('.mn-lugares-ficha');
    if (!caixa) return;
    const botoes = [...raiz.querySelectorAll('[data-lugar]')];
    const escolher = b => {
      botoes.forEach(x => x.setAttribute('aria-pressed', x === b));
      caixa.innerHTML = fichaLugar(b.dataset.lugar);
      const f = caixa.firstElementChild;
      if (f) gsap.fromTo(f, RM ? { opacity: 0 } : { opacity: 0, y: 1.4 * u() }, { opacity: 1, y: 0, duration: RM ? .18 : .3, ease: 'power2.out' });
    };
    botoes.forEach(b => (b.onclick = () => { efeitoSom('clique'); escolher(b); }));
    if (botoes[0]) botoes[0].setAttribute('aria-pressed', 'true');
  }

  // ============================== EVENTOS E RESOLUÇÕES ==============================
  const TIPOS = { clima: ['🌡️', 'Clima'], crise: ['🚨', 'Crises'], conflito: ['🔥', 'Conflitos'], migracao: ['🧳', 'Migrações'],
    recursos: ['💎', 'Recursos'], politica: ['🗳️', 'Política'], positivo: ['🎁', 'Boas notícias'] };
  const ESCOLHA = { votacao: ['🏛️', 'Votação na ONU'], doacao: ['📦', 'Pedido de ajuda'], decisao: ['⚖️', 'Decisão de todas as potências'] };
  function catalogoEventos() {
    if (typeof EVENTOS === 'undefined') return '';
    const tipos = [...new Set([...Object.keys(TIPOS), ...EVENTOS.map(e => e.tipo)])].map(k => [k, EVENTOS.filter(e => e.tipo === k)]).filter(g => g[1].length);
    return `<hr class="divisoria"><section class="mn-cap" id="mn-c-catalogo-eventos">
      <h3 class="mn-cap-titulo"><span class="soquete">${ic('📺', 56)}</span><span>As ${EVENTOS.length} notícias do Plantão Global</span></h3>
      ${tipos.map(([k, l]) => `<h4 class="mn-grupo peca">${ic(TIPOS[k]?.[0] || '📰', 48)}${esc(TIPOS[k]?.[1] || k)} <b>${l.length}</b></h4>
        <ul class="mn-eventos">${l.map(e => `<li class="mn-evento peca">${ic(e.icone, 48)}<span class="mn-evento-tit">${esc(e.titulo)}</span>
          ${e.escolha?.tipo && ESCOLHA[e.escolha.tipo] ? `<span class="pilula mn-evento-esc">${ic(ESCOLHA[e.escolha.tipo][0], 40)}${ESCOLHA[e.escolha.tipo][1]}</span>` : ''}</li>`).join('')}</ul>`).join('')}
    </section>`;
  }
  function catalogoResolucoes() {
    if (typeof RESOLUCOES === 'undefined') return '';
    const ORGAO = { cs: ['🛡️', 'Conselho de Segurança'], ag: ['🏛️', 'Assembleia Geral'] };
    return `<hr class="divisoria"><section class="mn-cap" id="mn-c-resolucoes">
      <h3 class="mn-cap-titulo"><span class="soquete">${ic('🗳️', 56)}</span><span>As resoluções que dá para propor</span></h3>
      <div class="mn-grade">${RESOLUCOES.map(r => `<article class="mn-cartao peca cat-diplomacia">
        <header class="mn-cartao-cab"><span class="soquete">${ic(r.icone, 64)}</span><h5 class="mn-cartao-nome">${esc(r.nome)}
          <small>${ic(ORGAO[r.orgao]?.[0], 40)}${esc(ORGAO[r.orgao]?.[1] || '')}</small></h5></header>
        <div class="mn-cartao-corpo"><p class="mn-porque">${esc(r.texto)}</p><div class="mn-chips">${chips(r.efeitos)}</div>
          <footer class="mn-cartao-pe">${codigos(r.bncc)}</footer></div></article>`).join('')}</div></section>`;
  }

  // ============================== O PAINEL DO MUNDO EM 2026 (medidores do kit) ==============================
  function painelMundo() {
    const g = typeof Simulacao !== 'undefined' ? Simulacao.PARAM?.globalInicial : null;
    if (!g || typeof termometroTijolos !== 'function') return '';
    // faixas iguais às do HUD (bom ✓ · medio ! · risco !! · critico ✕), sempre com símbolo e palavra
    const faixa = (v, f) => f.find(([lim]) => v < lim)?.slice(1) || f.at(-1).slice(1);
    const seg = (v, total, marcas, nv) => `<span class="seg grossa" data-nivel="${nv}" style="--n:${Math.round(v)};--total:${total}">${marcas.map(m => `<i class="limiar" style="left:${m}%"></i>`).join('')}</span>`;
    const est = {
      comercio: faixa(g.comercio, [[25, 'critico', 'Fragmentado'], [40, 'risco', 'Fragmentado'], [75.01, 'bom', 'Normal'], [Infinity, 'medio', 'Acelerado']]),
      cooperacao: faixa(g.cooperacao, [[20, 'critico', 'Cada um por si'], [30, 'risco', 'Cada um por si'], [45, 'medio', 'Normal'], [Infinity, 'bom', 'Normal']]),
      temperatura: faixa(g.temperatura, [[1.5001, 'bom', 'Meta de Paris'], [1.8, 'medio', 'Risco'], [2, 'risco', 'Perigo'], [Infinity, 'critico', 'Colapso à vista']]),
      tensao: faixa(g.tensao, [[60, 'bom', 'Calmo'], [80, 'medio', 'Alerta'], [90, 'risco', 'Crise'], [Infinity, 'critico', 'Meia-noite']]),
      deslocados: faixa(g.deslocados, [[100, 'bom', 'Estável'], [150, 'medio', 'Estável'], [180, 'risco', 'Emergência'], [Infinity, 'critico', 'Catástrofe']]),
      energia: faixa(g.energia, [[55, 'bom', 'Normal'], [70, 'medio', 'Normal'], [Infinity, 'risco', 'Crise do petróleo']]),
    };
    const SIMB = { bom: GLIFOS.ok, medio: '!', risco: '!!', critico: GLIFOS.nao };
    const seg0 = Math.max(0, Math.round((100 - g.tensao) * 3));
    const pecas = [
      ['comercio', '🚢', 'Comércio', fmt(g.comercio), seg(g.comercio / 10, 10, [40, 75], est.comercio[0])],
      ['cooperacao', '🕊️', 'Cooperação', fmt(g.cooperacao), seg(g.cooperacao / 10, 10, [30, 70], est.cooperacao[0])],
      ['temperatura', '🌡️', 'Temperatura', fmtGraus(g.temperatura), termometroTijolos(g.temperatura, { valor: false })],
      ['tensao', '⏰', 'Relógio do Juízo Final', `${seg0}${FINO}s`, relogioJuizo(seg0)],
      ['deslocados', '🧳', 'Deslocados', fmtMilhoes(Math.round(g.deslocados), true), seg(g.deslocados / 10, 20, [75], est.deslocados[0])],
      ['energia', '🛢️', 'Preço da energia', fmt(g.energia), ponteiroEnergia(g.energia)],
    ];
    return `<hr class="divisoria"><section class="mn-cap" id="mn-c-painel">
      <h3 class="mn-cap-titulo"><span class="soquete">${ic('🌐', 56)}</span><span>O painel do mundo em 2026</span></h3>
      <p class="mn-nota">É assim que o topo da tela mostra o planeta no começo da partida. Cada peça tem um número, um medidor, as marcas dos limites e um selo de estado.</p>
      <div class="mn-painel">${pecas.map(([k, e, n, v, m]) => `<div class="mn-ind peca" data-nivel="${est[k][0]}"><p class="mn-ind-cab">${ic(e, 48)}<span>${n}</span></p>
        <p class="mn-ind-linha"><b class="mn-ind-valor num">${v}</b><span class="mn-ind-estado"><span class="selo" data-nivel="${est[k][0]}" aria-hidden="true">${SIMB[est[k][0]]}</span>${est[k][1]}</span></p>
        <div class="mn-ind-med">${m}</div></div>`).join('')}</div>
      <p class="mn-legenda" aria-label="Legenda dos selos">${Object.entries({ bom: 'tudo bem', medio: 'atenção', risco: 'crise', critico: 'perto do colapso' }).map(([k, t]) =>
        `<span><span class="selo" data-nivel="${k}" aria-hidden="true">${SIMB[k]}</span>${t}</span>`).join('')}</p></section>`;
  }

  // ============================== GLOSSÁRIO COM BUSCA ==============================
  function glossario({ impressao } = {}) {
    const termos = lista(typeof GLOSSARIO !== 'undefined' ? GLOSSARIO : null).filter(t => t?.termo);
    if (!termos.length) return '';
    const cartao = t => `<article class="mn-termo peca" data-busca="${esc(semAcento(t.termo + ' ' + t.definicao))}">
      <span class="mn-termo-letra" aria-hidden="true">${esc(semAcento(t.termo)[0].toUpperCase())}</span>
      <div><h5 class="mn-termo-nome">${esc(t.termo)}</h5><p>${esc(t.definicao)}</p></div></article>`;
    return `<hr class="divisoria"><section class="mn-cap" id="mn-c-glossario">
      ${impressao ? '' : `<div class="mn-busca"><label class="campo"><span class="campo-rotulo"><span>${ic('🔍', 40)} Procurar um termo</span><span class="campo-conta" aria-hidden="true">${termos.length} termos</span></span>
        <input class="entrada" type="search" placeholder="Ex.: veto, refugiado, soberania" autocomplete="off" spellcheck="false"></label></div>
        <div class="mn-vazio" hidden>${obj('globo-irado-pensando', 'mn-vazio-obj')}<p>Nenhum termo com “<b class="mn-vazio-q"></b>”. Tente outra palavra ou só o começo dela.</p></div>`}
      <div class="mn-grade mn-termos">${termos.map(cartao).join('')}</div></section>`;
  }
  function ligarGlossario(raiz) {
    const campo = raiz.querySelector('.mn-busca input');
    if (!campo) return;
    const cartoes = [...raiz.querySelectorAll('.mn-termo')], conta = raiz.querySelector('.mn-busca .campo-conta'), vazio = raiz.querySelector('.mn-vazio');
    let timer = null;
    campo.addEventListener('input', () => {
      const q = semAcento(campo.value.trim());
      let n = 0;
      cartoes.forEach(c => { const sim = !q || c.dataset.busca.includes(q); c.hidden = !sim; n += sim; });
      conta.textContent = q ? `${n} de ${cartoes.length}` : `${cartoes.length} termos`;
      vazio.hidden = n > 0;
      vazio.querySelector('.mn-vazio-q').textContent = campo.value.trim();
      clearTimeout(timer);
      timer = setTimeout(() => anunciar(n ? `${n} ${n === 1 ? 'termo encontrado' : 'termos encontrados'}.` : 'Nenhum termo encontrado.'), 700);
    });
  }

  // ============================== LABORATÓRIO DE PROJEÇÕES (EM13MAT509) ==============================
  const REGIOES = [
    { id: 'groenlandia', nome: 'Groenlândia', area: 2.166, cor: '#FFCAE6', lado: '#CC75A3' },
    { id: 'africa', nome: 'África', area: 30.37, cor: '#FFE08A', lado: '#CCA742' },
    { id: 'brasil', nome: 'Brasil', area: 8.516, cor: '#B3EFC6', lado: '#65BF82' },
  ];   // área real em milhões de km² (IBGE; ONU; governo da Groenlândia)
  // caminhos de dados/projecoes.js só têm M, L e Z: área (fórmula do laço), caixa e centro do maior pedaço
  function medir(d) {
    let area = 0, maior = 0, caixa = [Infinity, Infinity, -Infinity, -Infinity], centro = [0, 0];
    for (const s of String(d || '').split('M').filter(Boolean)) {
      const p = s.replace(/Z/g, '').split('L').map(q => q.split(',').map(Number)).filter(q => q.length === 2 && !q.some(isNaN));
      let a = 0; const c = [Infinity, Infinity, -Infinity, -Infinity];
      p.forEach(([x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; a += x * y2 - x2 * y; c[0] = Math.min(c[0], x); c[1] = Math.min(c[1], y); c[2] = Math.max(c[2], x); c[3] = Math.max(c[3], y); });
      a = Math.abs(a) / 2; area += a;
      caixa = [Math.min(caixa[0], c[0]), Math.min(caixa[1], c[1]), Math.max(caixa[2], c[2]), Math.max(caixa[3], c[3])];
      if (a > maior) { maior = a; centro = [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2]; }
    }
    return { area, caixa, centro };
  }
  const projecoes = () => (typeof PROJECOES !== 'undefined' ? Object.entries(PROJECOES).filter(([, p]) => p?.terra) : []);
  const medidas = {};
  const medidasDe = id => (medidas[id] ||= Object.fromEntries(REGIOES.map(r => [r.id, medir(PROJECOES[id][r.id])])));
  const pct = (a, b) => Math.round(a / b * 100);
  function mapaSVG(id, p) {
    const m = medidasDe(id), w = p.largura || 900, h = p.altura || 520;
    const rotulo = r => { const [x, y] = m[r.id].centro, dy = r.id !== 'groenlandia' ? 8 : y < 110 ? m[r.id].caixa[3] - y + 30 : -26;   // Groenlândia colada no alto: rótulo embaixo
      return `<text class="mn-lab-rot" x="${Math.min(w - 110, Math.max(110, x)).toFixed(0)}" y="${Math.max(44, y + dy).toFixed(0)}" text-anchor="middle">${esc(r.nome)}</text>`; };
    return `<g class="mn-lab-proj" data-proj="${esc(id)}">
      <path d="${p.contorno}" transform="translate(0 7)" fill="#197DBF" stroke="#1A1433" stroke-width="5" stroke-linejoin="round"/>
      <path d="${p.contorno}" fill="#58C6E4" stroke="#1A1433" stroke-width="5" stroke-linejoin="round"/>
      <path d="${p.contorno}" fill="url(#mn-pinos-mar)"/>
      <path d="${p.terra}" transform="translate(0 2.5)" fill="#B3AA98"/>
      <path d="${p.terra}" fill="#F3EAD6" stroke="#1A1433" stroke-opacity=".55" stroke-width="1.1" stroke-linejoin="round"/>
      ${REGIOES.map(r => `<g class="mn-lab-reg" data-reg="${r.id}"><path d="${p[r.id]}" transform="translate(0 4)" fill="${r.lado}" stroke="#1A1433" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="${p[r.id]}" fill="${r.cor}" stroke="#1A1433" stroke-width="2.4" stroke-linejoin="round"/></g>`).join('')}
      ${REGIOES.map(rotulo).join('')}</g>`;
  }
  // tábua da prateleira: placa cinza vista de frente, com fileira de pinos
  function tabua(w, y, n = 14) {
    let p = '';
    for (let i = 0; i < n; i++) { const x = 8 + w * (i + .5) / n;
      p += `<rect x="${(x - 9).toFixed(1)}" y="${y - 7}" width="18" height="9" rx="2" fill="#98A6C2" stroke="#1A1433" stroke-width="2.4"/><ellipse cx="${x.toFixed(1)}" cy="${y - 7}" rx="9" ry="3.4" fill="#F4F7FB" stroke="#1A1433" stroke-width="2.4"/>`; }
    return p + `<rect x="8" y="${y}" width="${w}" height="24" rx="5" fill="#98A6C2" stroke="#1A1433" stroke-width="3.2"/><rect x="9.6" y="${y + 1.6}" width="${w - 3.2}" height="15" rx="4" fill="#E3E9F4"/>
      <rect x="${8 + w * .03}" y="${y + 3.6}" width="${w * .94}" height="3" rx="1.5" fill="#fff" fill-opacity=".7"/>`;
  }
  // prateleiras: como o mapa mostra × do tamanho de verdade (mesmo desenho, área corrigida)
  function prateleiras(id) {
    const m = medidasDe(id), af = m.africa.area, VAO = 200, ALT = 150;
    const larg = r => m[r.id].caixa[2] - m[r.id].caixa[0], alt = r => m[r.id].caixa[3] - m[r.id].caixa[1];
    const s = Math.min(...REGIOES.map(r => Math.min((VAO - 24) / larg(r), ALT / alt(r))));
    const fator = r => s * Math.sqrt((r.area / REGIOES[1].area) / (m[r.id].area / af));
    const prat = (k, rotulo, texto) => `<div class="mn-prat"><p class="mn-prat-tit">${rotulo}</p>
      <svg class="mn-prat-svg" viewBox="0 0 ${VAO * 3} ${ALT + 40}" aria-hidden="true">${tabua(VAO * 3 - 16, ALT + 12)}
        ${REGIOES.map((r, i) => { const e = k(r), [x0, , x1, y1] = m[r.id].caixa, cx = VAO * i + VAO / 2;
          return `<g class="mn-prat-forma" transform="translate(${(cx - (x0 + x1) / 2 * e).toFixed(1)} ${(ALT + 6 - y1 * e).toFixed(1)}) scale(${e.toFixed(4)})">
            <path d="${PROJECOES[id][r.id]}" transform="translate(0 ${(5 / e).toFixed(1)})" fill="${r.lado}" stroke="#1A1433" stroke-width="${(2.6 / e).toFixed(2)}" stroke-linejoin="round"/>
            <path d="${PROJECOES[id][r.id]}" fill="${r.cor}" stroke="#1A1433" stroke-width="${(2.6 / e).toFixed(2)}" stroke-linejoin="round"/></g>`; }).join('')}</svg>
      <div class="mn-prat-rots">${REGIOES.map(r => `<p><b>${r.nome}</b><span class="num">${texto(r)}%</span></p>`).join('')}</div></div>`;
    return `<p class="mn-prat-nota">Tamanho comparado com a África (100%)</p>` +
      prat(() => s, `${ic('🗺️', 40)}Como aparece neste mapa`, r => pct(m[r.id].area, af)) +
      prat(fator, `${ic('🌍', 40)}Do tamanho de verdade`, r => pct(r.area, REGIOES[1].area));
  }
  const resumoProj = (id, p) => { const m = medidasDe(id);
    return `${p.nome}: neste mapa, a Groenlândia parece ter ${pct(m.groenlandia.area, m.africa.area)}% do tamanho da África; de verdade, tem ${pct(REGIOES[0].area, REGIOES[1].area)}%.`; };
  function laboratorio({ impressao } = {}) {
    const lst = projecoes();
    if (!lst.length) return '';
    const padrao = `<defs><pattern id="mn-pinos-mar" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="4.6" fill="#fff" fill-opacity=".16"/><circle cx="9" cy="10.4" r="4.6" fill="none" stroke="#1A1433" stroke-opacity=".12" stroke-width="1.4"/></pattern></defs>`;
    const mapa = (id, p) => `<svg class="mn-lab-svg" viewBox="-8 -8 ${(p.largura || 900) + 16} ${(p.altura || 520) + 22}" role="img" aria-label="${esc(resumoProj(id, p))}">${padrao}${mapaSVG(id, p)}</svg>`;
    const bncc = `<div class="mn-chips"><span class="pilula">${ic('🎓', 40)}Matemática</span><span class="mn-codigo">EM13MAT509</span><span class="mn-codigo">EM13CHS106</span></div>`;
    if (impressao) return `<hr class="divisoria"><section class="mn-cap mn-lab" id="mn-c-lab">${bncc}${lst.map(([id, p]) => `<div class="mn-lab-impressa">
      <h4 class="mn-grupo peca">${ic('🧭', 48)}${esc(p.nome)}</h4><p class="mn-lab-texto">${esc(p.texto || '')}</p>
      <div class="mn-lab-cols"><div class="mn-lab-mapa peca">${mapa(id, p)}</div><div class="mn-lab-comp">${prateleiras(id)}</div></div></div>`).join('')}
      ${porqueMercator()}</section>`;
    const [id0, p0] = lst.find(([id]) => id === 'mercator') || lst[0];
    return `<hr class="divisoria"><section class="mn-cap mn-lab" id="mn-c-lab">
      <div class="mn-lab-topo"><div class="alternador mn-lab-alt" role="radiogroup" aria-label="Projeção do mapa">${lst.map(([id, p]) =>
        `<button role="radio" aria-checked="${id === id0}" tabindex="${id === id0 ? 0 : -1}" data-proj="${esc(id)}">${esc(p.nome)}</button>`).join('')}</div>${bncc}</div>
      <p class="mn-lab-texto balao peca" data-ponta="nenhuma">${esc(p0.texto || '')}</p>
      <div class="mn-lab-cols"><div class="mn-lab-mapa peca"><svg class="mn-lab-svg" viewBox="-8 -8 916 542" role="img" aria-label="${esc(resumoProj(id0, p0))}">${padrao}
        ${lst.map(([id, p]) => mapaSVG(id, p)).join('')}</svg></div>
        <div class="mn-lab-comp" aria-live="polite">${prateleiras(id0)}</div></div>
      <h4 class="mn-passo"><span class="mn-passo-n">1</span><span>Experimente</span></h4>
      <ul class="mn-texto-lista"><li>Escolha <b>Mercator</b> e compare a Groenlândia com a África. Qual parece maior?</li>
        <li>Agora escolha <b>Gall-Peters</b>. Qual das duas mudou mais de tamanho? E o Brasil?</li>
        <li>Por que um mapa feito para navegar aumenta tanto as terras perto dos polos? Converse com a turma.</li></ul>
      ${porqueMercator()}</section>`;
  }
  const porqueMercator = () => `<h4 class="mn-passo"><span class="mn-passo-n">2</span><span>Por que isso acontece?</span></h4>
    <p class="mn-texto-p">Para conservar os ângulos, a Mercator estica o mapa na horizontal e na vertical na mesma medida — e o esticão cresce
    quanto mais longe do Equador. A 70° de latitude, onde fica a Groenlândia, as áreas aparecem mais de 8 vezes maiores do que no Equador.
    Já a Gall-Peters conserva as áreas, mas achata e estica as formas. Nenhum mapa plano consegue conservar tudo ao mesmo tempo: escolher
    uma projeção é escolher o que mostrar.</p>`;
  function ligarLab(raiz) {
    const svg = raiz.querySelector('.mn-lab-svg'), comp = raiz.querySelector('.mn-lab-comp'), texto = raiz.querySelector('.mn-lab-texto');
    const radios = [...raiz.querySelectorAll('.mn-lab-alt [role="radio"]')];
    if (!svg || !radios.length) return;
    const camadas = Object.fromEntries([...svg.querySelectorAll('.mn-lab-proj')].map(g => [g.dataset.proj, g]));
    let atual = radios.find(r => r.getAttribute('aria-checked') === 'true')?.dataset.proj;
    Object.entries(camadas).forEach(([id, g]) => gsap.set(g, { autoAlpha: id === atual ? 1 : 0 }));
    const trocar = (id, focar) => {
      const r = radios.find(x => x.dataset.proj === id);
      if (!r) return;
      radios.forEach(x => { const sim = x === r; x.setAttribute('aria-checked', sim); x.tabIndex = sim ? 0 : -1; });
      if (focar) r.focus();
      if (id === atual) return;
      const p = PROJECOES[id], velho = camadas[atual], novo = camadas[id];
      atual = id;
      efeitoSom('whoosh');
      texto.textContent = p.texto || '';
      svg.setAttribute('aria-label', resumoProj(id, p));
      comp.innerHTML = prateleiras(id);
      gsap.killTweensOf([velho, novo]);
      gsap.to(velho, { autoAlpha: 0, duration: RM ? .15 : .25, ease: 'power2.in' });
      gsap.fromTo(novo, { autoAlpha: 0 }, { autoAlpha: 1, duration: RM ? .18 : .3, delay: RM ? 0 : .1, ease: 'power2.out' });
      if (!RM) {
        gsap.fromTo(novo.querySelectorAll('.mn-lab-reg'), { scale: .82, transformOrigin: '50% 50%' },
          { scale: 1, duration: .5, stagger: .07, delay: .15, ease: 'back.out(2)' });
        gsap.fromTo(comp.querySelectorAll('.mn-prat-forma path'), { opacity: 0 }, { opacity: 1, duration: .25, stagger: .03, delay: .1 });
      }
      anunciar(resumoProj(id, p));
    };
    radios.forEach(r => (r.onclick = () => { efeitoSom('clique'); trocar(r.dataset.proj); }));
    raiz.querySelector('.mn-lab-alt').addEventListener('keydown', ev => {
      const i = radios.indexOf(document.activeElement), passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
      if (i < 0 || !passo) return;
      ev.preventDefault(); ev.stopPropagation();
      trocar(radios[(i + passo + radios.length) % radios.length].dataset.proj, true);
    });
  }

  // ============================== BNCC ==============================
  const RELACAO = { central: [4, 'Central'], forte: [3, 'Forte'], complementar: [2, 'Complementar'], fraca: [1, 'Fraca'] };
  function cartaoHab(h) {
    const r = RELACAO[h.relacao];
    return `<article class="mn-hab peca">
      <header class="mn-hab-cab">${h.codigo || h.numero ? `<span class="mn-codigo grande">${esc(h.codigo || 'Geral ' + h.numero)}</span>` : ''}${h.titulo ? `<h5 class="mn-hab-tit">${esc(h.titulo)}</h5>` : ''}
        ${r ? `<span class="mn-relacao" title="Ligação com a geopolítica">Ligação: ${r[1]}<span class="seg" role="meter" aria-label="Ligação com a geopolítica: ${r[1]}" aria-valuemin="0" aria-valuemax="4" aria-valuenow="${r[0]}" data-nivel="bom" style="--n:${r[0]};--total:4"></span></span>` : ''}</header>
      ${h.texto ? `<blockquote class="mn-hab-texto">${esc(h.texto)}</blockquote>` : ''}
      ${h.noJogo ? `<p class="mn-hab-jogo">${ic('🎮', 40)}<span><b>No jogo:</b> ${esc(h.noJogo)}</span></p>` : ''}</article>`;
  }
  function bncc({ impressao } = {}) {
    if (typeof BNCC === 'undefined') return '';
    const comp = lista(BNCC.competencias), habs = lista(BNCC.habilidades);
    const agrupar = (l, chave) => [...new Set(l.map(x => x[chave]))].map(k => [k, l.filter(x => x[chave] === k)]);
    const partes = [
      ['chs', '🌐', 'Ciências Humanas', comp.map(c => `<h4 class="mn-grupo peca">${ic('🎯', 48)}Competência ${c.numero}</h4><blockquote class="mn-hab-texto mn-comp">${esc(c.texto)}</blockquote>
        <div class="mn-grade">${habs.filter(h => h.competencia === c.numero).map(cartaoHab).join('')}</div>`).join('') +
        (habs.some(h => !comp.find(c => c.numero === h.competencia)) ? `<div class="mn-grade">${habs.filter(h => !comp.find(c => c.numero === h.competencia)).map(cartaoHab).join('')}</div>` : '')],
      ['gerais', '⭐', 'Competências gerais', `<div class="mn-grade">${lista(BNCC.gerais).map(cartaoHab).join('')}</div>`],
      ['outras', '🔬', 'Outras áreas', agrupar(lista(BNCC.outras), 'area').map(([a, l]) => `<h4 class="mn-grupo peca">${ic('🔬', 48)}${esc(a)}</h4><div class="mn-grade">${l.map(cartaoHab).join('')}</div>`).join('')],
      ['tcts', '🧭', 'Temas transversais', agrupar(lista(BNCC.tcts), 'macroarea').map(([a, l]) => `<h4 class="mn-grupo peca">${ic('🧭', 48)}${esc(a)}</h4>
        <div class="mn-grade">${l.map(t => cartaoHab({ titulo: t.tema, noJogo: t.noJogo })).join('')}</div>`).join('')],
    ].filter(p => p[3]);
    const legenda = `<p class="mn-nota">${ic('🎮', 40)}Não há perguntas no jogo: a BNCC define os conteúdos, e a turma vive cada um nas decisões. A “ligação” mostra o quanto a habilidade conversa com a geopolítica (pesquisa pedagógica do projeto, não é classificação oficial). Os textos das habilidades são os da BNCC (MEC, 2018).</p>`;
    if (impressao) return `<hr class="divisoria"><section class="mn-cap" id="mn-c-bncc">${legenda}${partes.map(([, e, n, h]) =>
      `<h3 class="mn-cap-titulo"><span class="soquete">${ic(e, 56)}</span><span>${n}</span></h3>${h}`).join('')}</section>`;
    return `<hr class="divisoria"><section class="mn-cap" id="mn-c-bncc">${legenda}
      <div class="abas mn-bncc-abas" role="tablist" aria-label="Partes da BNCC">${partes.map(([k, e, n], i) =>
        `<button class="peca" role="tab" id="mn-b-${k}" aria-controls="mn-bp-${k}" aria-selected="${i === 0}">${ic(e, 40)}${n}</button>`).join('')}</div>
      ${partes.map(([k, , , h], i) => `<div class="mn-bncc-parte" id="mn-bp-${k}" role="tabpanel" aria-labelledby="mn-b-${k}"${i ? ' hidden' : ''}>${h}</div>`).join('')}</section>`;
  }

  // ============================== PARA O PROFESSOR: versão para imprimir ==============================
  function cartaoImprimir({ impressao } = {}) { return impressao ? '' : `<hr class="divisoria"><section class="mn-cap"><div class="mn-imprimir peca">
    ${obj('manual', 'mn-imprimir-obj')}<div><h4 class="mn-cartao-nome">Manual para imprimir</h4>
    <p>Todas as seções abertas, em papel A4: regras, catálogo das ações, fichas dos lugares, glossário, projeções e o mapa da BNCC.</p></div>
    <a class="btn btn-principal peca pinos" href="manual.html" target="_blank" rel="noopener">${ic('📋', 48)}Imprimir o manual</a></div></section>`; }

  // ============================== PAINEL ==============================
  let painel = null, ultima = null, escolherAba = null, laco = null;
  const ligar = { territorios: ligarLugares, glossario: ligarGlossario, projecoes: ligarLab };
  function abaDe(alvo, abas) {
    const k = semAcento(alvo).replace(/\s+/g, '-');
    return abas.find(a => a.id === k) || abas.find(a => a.caps?.includes(k) || a.id === 'cap-' + k) || abas.find(a => semAcento(a.nome).replace(/\s+/g, '-') === k);
  }
  function mostrar(aba, abas, art, { animar = true } = {}) {
    if (!art.dataset.pronto) {
      art.innerHTML = pagina(aba, abas.indexOf(aba), abas);
      art.dataset.pronto = '1';
      ligar[aba.id]?.(art);
      const sub = art.querySelector('.mn-bncc-abas');
      if (sub) ativarAbas(sub);
    }
    ultima = aba.id;
    art.scrollTop = 0;
    laco?.kill(); laco = null;
    const o = art.querySelector('.mn-capa-obj'), blocos = [...art.children].slice(0, 4);
    if (!animar) return;
    gsap.killTweensOf([o, ...blocos]);
    if (RM) { gsap.fromTo(art, { opacity: 0 }, { opacity: 1, duration: .18 }); return; }
    gsap.fromTo(blocos, { opacity: 0, y: 1.4 * u() }, { opacity: 1, y: 0, duration: .3, stagger: .05, ease: 'power2.out', clearProps: 'transform,opacity' });
    if (o) gsap.fromTo(o, { scale: .3, rotation: -14 }, { scale: 1, rotation: 0, duration: .6, ease: 'elastic.out(1, .5)',
      onComplete: () => { laco = loop(o, { y: -.7 * u(), rotation: 3, duration: 1.8 }); } });
  }
  function fechar() { laco?.kill(); laco = null; if (painel) fecharPainel(painel); }
  function abrir(alvo) {
    const abas = abasValidas();
    if (!abas.length) return Promise.resolve();
    const aba = (alvo && abaDe(alvo, abas)) || (ultima && abas.find(a => a.id === ultima)) || abas[0];
    const capitulo = alvo && alvo !== aba.id && aba.caps?.includes(alvo) && aba.lista?.length > 1 ? alvo : null;
    if (painel?.isConnected && !painel.inert) { escolherAba(painel.querySelector('#mn-a-' + aba.id), true); return Promise.resolve(); }
    painel = document.createElement('section');
    painel.className = 'painel peca anil painel-g manual';
    painel.setAttribute('aria-labelledby', 'mn-titulo');
    painel.innerHTML = `<header class="painel-cab">${obj('manual', 'painel-objeto')}
        <h2 class="painel-titulo" id="mn-titulo">Manual do Diplomata<small class="painel-sub">Tudo o que a sua delegação precisa saber</small></h2>
        <a class="btn btn-neutro btn-mini peca mn-btn-imprimir" href="manual.html" target="_blank" rel="noopener">${ic('📋', 40)}<span>Imprimir</span></a>
        <button class="btn btn-ic peca" data-teste="fechar-manual" aria-label="Fechar o manual (Esc)">${GLIFOS.fechar}</button></header>
      <div class="mn-corpo">
        <div class="mn-folhas">${abas.map(a => `<article class="mn-pagina mn-tom-${a.tom}" id="mn-p-${a.id}" role="tabpanel" aria-labelledby="mn-a-${a.id}" tabindex="0" hidden></article>`).join('')}</div>
        <div class="abas verticais mn-marcadores" role="tablist" aria-orientation="vertical" aria-label="Capítulos do manual">${abas.map((a, i) =>
          `${a.consulta && !abas[i - 1]?.consulta ? '<hr class="divisoria mn-marcadores-div" aria-hidden="true">' : ''}<button class="peca mn-tom-${a.tom}" role="tab" id="mn-a-${a.id}" aria-controls="mn-p-${a.id}"
            aria-selected="${a === aba}" data-teste="manual-${a.id}">${ic(a.icone, 48)}<span>${esc(a.nome)}</span></button>`).join('')}</div>
      </div>`;
    painel.querySelector('[data-teste="fechar-manual"]').onclick = () => { efeitoSom('clique'); fechar(); };
    let primeira = true;
    escolherAba = ativarAbas(painel.querySelector('.mn-marcadores'), b => {
      const a = abas.find(x => 'mn-a-' + x.id === b.id);
      mostrar(a, abas, painel.querySelector('#mn-p-' + a.id), { animar: !primeira });
      primeira = false;
    });
    painel.addEventListener('click', ev => {
      const v = ev.target.closest('[data-virar]'), ir = ev.target.closest('[data-ir]');
      if (v) { efeitoSom('clique'); escolherAba(painel.querySelector('#mn-a-' + v.dataset.virar), true); }
      if (ir) { efeitoSom('clique'); painel.querySelector('#' + CSS.escape(ir.dataset.ir))?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }
    });
    const entrada = abrirPainel(painel, { esc: () => { laco?.kill(); laco = null; }, foco: '[role="tab"][aria-selected="true"]' });
    if (capitulo) { const art = painel.querySelector('#mn-p-' + aba.id), c = art.querySelector('#mn-c-' + CSS.escape(capitulo)); if (c) art.scrollTop = c.offsetTop - 2 * u(); }
    return entrada.then(() => {
      const o = painel.querySelector('[role="tabpanel"]:not([hidden]) .mn-capa-obj');
      if (o && !RM) laco = loop(o, { y: -.7 * u(), rotation: 3, duration: 1.8 });
    });
  }

  // ============================== LIVRO (manual.html: tudo aberto para imprimir) ==============================
  function livro() {
    const abas = abasValidas();
    const sumario = `<section class="mn-folha mn-folha-capa">
      <div class="mn-livro-logo">${typeof logo === 'function' ? logo('completa', 'mn-logo') : ''}</div>
      ${obj('manual', 'mn-livro-obj')}
      <h1 class="mn-livro-titulo">Manual do Diplomata</h1>
      <p class="mn-livro-sub">Missão 2050 · regras, catálogos, glossário, projeções e o mapa da BNCC</p>
      <ol class="mn-livro-sumario">${abas.map((a, i) => `<li class="mn-tom-${a.tom}"><span class="mn-livro-n">${i + 1}</span>${ic(a.icone, 48)}<span>${esc(a.nome)}</span></li>`).join('')}</ol></section>`;
    return sumario + abas.map((a, i) => `<section class="mn-folha mn-tom-${a.tom}" id="mn-p-${a.id}"><div class="mn-faixa mn-tom-${a.tom}">${ic(a.icone, 48)}<span>Capítulo ${i + 1} · ${esc(a.nome)}</span></div>
      ${pagina(a, i, abas, { impressao: true })}</section>`).join('');
  }

  return { abrir, fechar, livro, get abas() { return abasValidas().map(a => a.id); } };
})();
