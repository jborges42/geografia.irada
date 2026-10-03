'use strict';
/* Geografia Irada — o motor da simulação geopolítica.
   Sem DOM: roda no navegador e no Node (teste-simulacao.mjs). Lê os dados globais de conteudo/*.js e dados/mapa.js.
   Tudo o que muda devolve um "relatório" com o antes, o depois e o porquê, para a interface animar e explicar.
   Números marcados com ⚙ em PARAM são de calibragem (ver docs/DESIGN.md §13). */

const Simulacao = (() => {
  // ============================== PARÂMETROS ⚙ ==============================
  const PARAM = {
    anoInicial: 2026, anoFinal: 2050,
    cpBase: 3, cpGuardaMax: 1,  // sem bônus de acerto: o dilema da vez já é uma decisão a mais e não dá CP de graça (algumas opções dão ou tiram); com 4, a partida passava de 120 decisões
    globalInicial: {
      temperatura: 1.45,   // OMM: 2025 ficou 1,44 °C acima do pré-industrial; média 2023–2025, 1,48 °C (14/01/2026)
      tensao: 72,          // Relógio do Juízo Final a 85 s da meia-noite em 27/01/2026 (Bulletin of the Atomic Scientists): (100 − 72) × 3 ≈ 85 s
      comercio: 62, cooperacao: 45,
      deslocados: 118,     // ACNUR, Tendências Globais: 117,8 milhões de deslocados à força no fim de 2025 (jun/2026)
      energia: 60,         // petróleo caro em 2026: Brent perto de US$ 109 no início de setembro, com a guerra do Irã (Wikipedia, “2026 Iran war fuel crisis”); 50 = normal
      transferencia: 0 },
    tcre: .00069, emissoesResto: 3,                      // °C por Gt (era .00065: o mundo do computador ficava seguro demais); aviação/navegação e o resto
    retroalimentacao: [[1.95, .04], [2.1, .15]],      // temperatura → °C extra por rodada (acima de 2,1: degelo e florestas morrendo aceleram; era .1)
    colapso: { temperatura: 2.2, tensao: 100, deslocados: 200 },
    danoClima: 6,                                      // pontos por rodada a +1 °C acima de 1,4 com vulnerabilidade 100
    estoqueMax: 12, vendeAcima: 8,
    resistenciaBase: 3, margemParceria: 2,
    pressaoReacao: 60, pressaoQueda: 10,
    // Mediação: chance = soma dos fatores (influência, cooperação, estabilidade, intensidade, ser parte), entre min e max
    mediacao: { base: .3, porInfluencia: .06, influenciaMax: .3, cooperacao: .006, estabilidade: .004, porNivel: .1, parte: .3, vizinho: .1, min: .05, max: .9 },
    variedadeIA: 1.2,                                  // dilemas e decisões: quanto maior, mais variada a escolha do computador (sem resposta certa)
    pesosIGI: { bemEstar: 2, economia: 1.5, ambiente: 1, seguranca: 1, apoio: .5 },
    igiParceiro: 3, igiLideranca: 6, igiMissao: 12, igiSelo: 4, igiPlaneta: 10,
    metas: { temperatura: 2.0, tensao: 60, deslocados: 100, desenvolvimento: 60 },
    eventosPorRodada: 1, eventosEmCrise: 2,
    conflitosNormais: 19, calmaBase: .05, crescimentoNeutras: .012, // conflitos acima de 17 níveis esquentam o mundo (eram 20; 2026 começa com 25)
    tensaoEstrutural: 64,  // a tensão volta devagar para perto do Relógio de 2026 (85 s ≈ 72); era 70
    retornoDeslocados: .10, // fração dos deslocados que volta para casa (ou se integra) por mandato de 4 anos (era .13)
    energiaConflito: .5,   // preço da energia por nível de conflito em região produtora (era 1,2: travava o preço no teto e decidia a partida)
    energiaEconomia: 25,   // (preço − 50) / isto = ganho do exportador e perda do importador por mandato (era 15)
    // ---- diplomacia viva: relações bilaterais, reações, contágio e incidentes (−100 hostil … +100 aliada)
    potenciasRef: 8,       // com mais potências que isto, cada decisão pesa um pouco menos nos números do mundo: escala = √(isto / nº de potências)
    retornoRelacao: .12,   // fração da distância até a relação "de fábrica" que se desfaz por mandato (o mundo esquece devagar)
    atrito: 1.2,           // pontos de economia por mandato: fatia de comércio × (relação − relação de 2026)/100
    contagio: .8,          // fatia de comércio × quanto o parceiro cresceu (ou caiu) acima da média do mundo
    acordoBonus: 25, sancaoPeso: 40, // acordo bilateral soma isto à relação "para o comércio"; sanções entre dois países tiram isto
    retaliacao: { base: .15, porHostilidade: .6 }, // chance do computador responder a tarifa/sanção: base + hostilidade × isto
    incidente: { limite: -50, chance: .35 },       // pares com relação abaixo disso podem ter incidente, guerra comercial...
    cooperacaoEspontanea: { limite: 55, chance: .15 },
    equilibrioPoder: { razao: 1.25, relacao: -1.5 }, // a potência que passa 25% da média de poder atrai o "equilíbrio" dos outros
    tensaoRelacoes: 10, coopRelacoes: 25, // quanto a hostilidade/amizade média das relações empurra a tensão e a cooperação do mundo
    procuracao: { influencia: 3, relacao: -1.5, escalada: 1.6 }, // duas potências rivais com influência em território em conflito
    copPorPotencia: 7 / 6, // soma de compromissos da COP: 7 com 6 potências
    iaRivalidade: .35,     // quanto o computador quer "responder" a uma potência hostil com sanção, tarifa ou embargo
    maioriaConselho: .57,  // fração de "sim" no Conselho de Segurança (4 de 7 antes)
  };
  const INDICADORES = ['economia', 'bemEstar', 'ambiente', 'seguranca', 'apoio'];
  const RECURSOS = ['alimentos', 'energia', 'minerais', 'tecnologia'];
  const TEMAS = ['territorio', 'ordem', 'globalizacao', 'natureza', 'conflitos', 'pessoas']; // temas da aula (foco de eventos e dilemas)
  const EXPORTADORES_ENERGIA = ['russia', 'eua', 'brasil', 'australia', 'nigeria'];
  const REGIOES_PETROLEO = ['golfo', 'levante', 'ira', 'leste_europeu', 'venezuela_guianas', 'norte_africa'];
  const ROTAS = { sudeste_insular: 'Estreito de Malaca', taiwan: 'Estreito de Taiwan', golfo: 'Estreito de Ormuz e Mar Vermelho', norte_africa: 'Canal de Suez', america_central: 'Canal do Panamá', turquia: 'Estreitos turcos' };

  // ============================== UTILIDADES ==============================
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
  const copia = o => JSON.parse(JSON.stringify(o));
  const potenciasDados = () => POTENCIAS;
  const dadoPotencia = id => POTENCIAS.find(p => p.id === id);
  const carta = id => POLITICAS.find(c => c.id === id);
  const vizinhosDe = id => (typeof MAPA !== 'undefined' && MAPA.vizinhos[id]) || [];
  const mod = (id, k, padrao) => dadoPotencia(id)?.mods?.[k] ?? padrao;

  // ============================== RELAÇÕES BILATERAIS ==============================
  // Cada par de potências tem uma relação de −100 a +100 (e.relacoes['a|b'], ids em ordem alfabética).
  // A "relação de fábrica" (RELACOES em conteudo/potencias.js) é o retrato de 2026; o mundo volta devagar para ela.
  const chaveRel = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  const relBase = (a, b) => (a === b ? 100 : RELACOES[a]?.[b] ?? RELACOES[b]?.[a] ?? 0);
  const relacao = (e, a, b) => (a === b ? 100 : e.relacoes[chaveRel(a, b)] ?? relBase(a, b));
  const rotuloRelacao = v => (v >= 70 ? { texto: 'Aliada', nivel: 3 } : v >= 40 ? { texto: 'Amiga', nivel: 2 } : v >= 10 ? { texto: 'Cordial', nivel: 1 }
    : v > -25 ? { texto: 'Fria', nivel: -1 } : v > -60 ? { texto: 'Tensa', nivel: -2 } : { texto: 'Hostil', nivel: -3 });
  const aliadas = (e, a, b) => e.aliancas.some(x => x.includes(a) && x.includes(b));
  const aliadosDe = (e, pid) => e.aliancas.filter(x => x.includes(pid)).map(x => x.find(y => y !== pid));
  const sancionados = (e, a, b) => e.sancoes.some(s => s.ate >= e.rodada && ((s.de === a && s.contra === b) || (s.de === b && s.contra === a)));
  const outras = (e, pid) => Object.keys(e.potencias).filter(q => q !== pid);
  const rivaisDe = (e, pid) => outras(e, pid).filter(q => relacao(e, pid, q) < -20).sort((x, y) => relacao(e, pid, x) - relacao(e, pid, y));
  const hostilidade = e => { const ids = Object.keys(e.potencias); let s = 0, n = 0; ids.forEach((a, i) => ids.slice(i + 1).forEach(b => { s += Math.max(0, -relacao(e, a, b)) / 100; n++; })); return s / Math.max(1, n); };
  const amizade = e => { const ids = Object.keys(e.potencias); let s = 0, n = 0; ids.forEach((a, i) => ids.slice(i + 1).forEach(b => { s += Math.max(0, relacao(e, a, b)) / 100; n++; })); return s / Math.max(1, n); };
  // Muda a relação entre a e b. `rel` recebe o registro para a interface; e.relLog guarda o mandato para o relatório.
  function mudarRel(e, a, b, d, motivo = '', rel = null) {
    if (a === b || !e.potencias[a] || !e.potencias[b] || !d) return 0;
    const antes = relacao(e, a, b), depois = limitar(Math.round((antes + d) * 10) / 10, -100, 100);
    if (depois === antes) return 0;
    e.relacoes[chaveRel(a, b)] = depois;
    rel?.push({ quem: a, v: 'relacao', de: b, antes: r1(antes), depois: r1(depois), motivo });
    e.relLog.push({ a, b, d: depois - antes, motivo });
    return depois - antes;
  }
  // Quem sente, entre os outros, o que aconteceu entre a e b: lista de relações de interesse (para as frases de reação)
  function relacoesDe(e, pid) {
    return outras(e, pid).map(id => { const valor = relacao(e, pid, id);
      return { id, valor: r1(valor), rotulo: rotuloRelacao(valor), aliada: aliadas(e, pid, id), sancionada: sancionados(e, pid, id), comercio: COMERCIO[pid]?.[id] || 0 }; })
      .sort((x, y) => y.valor - x.valor);
  }

  // Gerador de números aleatórios com semente guardada no estado (partidas reproduzíveis e salváveis)
  function sorte(e) {
    let t = (e.semente = (e.semente + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const sortearDe = (e, lista) => lista[Math.floor(sorte(e) * lista.length)];
  function embaralhar(e, lista) { const a = [...lista]; for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(sorte(e) * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; }
  function sortearPeso(e, itens) { // [{ item, peso }]
    const total = itens.reduce((s, i) => s + i.peso, 0);
    let x = sorte(e) * total;
    for (const i of itens) if ((x -= i.peso) <= 0) return i.item;
    return itens[itens.length - 1]?.item;
  }

  const FAIXAS = {
    economia: [0, 100], bemEstar: [0, 100], ambiente: [0, 100], seguranca: [0, 100], apoio: [0, 100], limpa: [0, 100], militar: [0, 100],
    vulnerabilidade: [0, 100], desenvolvimento: [0, 100], estabilidade: [0, 100], pressao: [0, 100], conflito: [0, 3],
    tensao: [0, 100], comercio: [0, 100], cooperacao: [0, 100], energia: [5, 100], deslocados: [0, 400], temperatura: [0, 6],
    transferencia: [0, 1], desmatamento: [0, 5], fossil: [0, 40], floresta: [0, 2], emissoes: [0, 20], influencia: [0, 10], cp: [0, 20],
  };
  const faixa = (v, x) => (FAIXAS[v] ? limitar(x, FAIXAS[v][0], FAIXAS[v][1]) : x);
  const contarBncc = (e, codigos) => (codigos || []).forEach(b => (e.bncc[b] = (e.bncc[b] || 0) + 1));

  // ============================== CRIAR A PARTIDA ==============================
  /* config: { modo: 'competitivo'|'blocos'|'cooperativo', rodadas: 4|6|8, dificuldade: 0..3,
       jogadores: [{ potencia, nome, bloco? }], missoes: bool, infiltrado: bool, foco: [temas], semente } */
  function criarEstado(config = {}) {
    const cfg = { modo: 'competitivo', rodadas: 6, dificuldade: 1, jogadores: [], missoes: true, infiltrado: false, foco: [], ...config };
    const e = {
      versao: 3, semente: (cfg.semente ?? Math.floor(Math.random() * 2 ** 31)) | 0, config: cfg,
      rodada: 1, ano: PARAM.anoInicial, delta: (PARAM.anoFinal - PARAM.anoInicial) / cfg.rodadas,
      global: { ...PARAM.globalInicial }, potencias: {}, territorios: {}, pendentes: [], historico: [], manchetes: [],
      eventosUsados: [], dilemasUsados: [], desarmaramNaRodada: [], fim: null, bncc: {}, vez: null, aliancas: ALIANCAS_INICIAIS.map(x => [...x].sort()), sancoes: [],
      relacoes: {}, relLog: [], acordos: [], choques: {}, // diplomacia: relações, o que mudou no mandato, acordos comerciais e choques de economia
      construcoes: [], // o que cada ação construiu no mapa: { carta, potencia, alvo, ano } (o mundo 3D monta e guarda)
    };
    for (const d of potenciasDados()) {
      const j = cfg.jogadores.find(x => x.potencia === d.id);
      e.potencias[d.id] = {
        id: d.id, humano: !!j, nomeJogador: j?.nome || 'Computador', bloco: j?.bloco || null,
        ...d.inicial, inicial: { ...d.inicial }, fossil: d.fossil, desmatamento: d.desmatamento,
        vulnerabilidade: d.vulnerabilidade, crescimento: d.crescimento,
        recursos: { alimentos: 2, energia: 2, minerais: 2, tecnologia: 2 }, producao: { ...d.producao }, consumo: { alimentos: 0, energia: 0, ...d.consumo },
        cp: 0, cpGuardado: 0, mao: [], imune: { ciber: 0, desinfo: 0, pandemia: 0 }, meta: null,
        dilema: null, // dilema da vez: { id, local, rodada, opcao }
        contadores: { mediacoes: 0, solidariedade: 0, propostasAprovadas: 0, resolucoesApoiadas: 0, alimentosCedidos: 0 },
        emissoesAcumuladas: 0, tensaoGerada: 0, missao: null, papel: 'diplomata', agenda: null, crisePolitica: false,
        emissoesIniciais: 0,
      };
    }
    for (const t of TERRITORIOS) {
      e.territorios[t.id] = { id: t.id, continente: t.continente, protegido: !!t.protegido,
        desenvolvimento: t.desenvolvimento, estabilidade: t.estabilidade, vulnerabilidade: t.vulnerabilidade,
        conflito: t.conflito, pressao: 0, emissoes: t.emissoes, floresta: t.floresta, recursos: { ...t.recursos },
        influencia: Object.fromEntries(potenciasDados().map(p => [p.id, t.influencia?.[p.id] || 0])),
        parceiro: null, dev0: t.desenvolvimento, mediacoes: 0 };
    }
    const ids = Object.keys(e.potencias);
    ids.forEach((a, i) => ids.slice(i + 1).forEach(b => (e.relacoes[chaveRel(a, b)] = relBase(a, b))));
    e.escala = Math.min(1, Math.sqrt(PARAM.potenciasRef / ids.length));
    e.hostilidade0 = hostilidade(e); e.amizade0 = amizade(e);
    Object.values(e.territorios).forEach(t => (t.parceiro = calcularParceiro(t)));
    Object.values(e.potencias).forEach(p => (p.emissoesIniciais = emissoesDe(p)));
    if (cfg.missoes && cfg.modo !== 'cooperativo') sortearMissoes(e);
    if (cfg.modo === 'cooperativo' && cfg.infiltrado) sortearInfiltrado(e);
    registrarHistorico(e);
    return e;
  }

  function sortearMissoes(e) {
    const usadas = new Set();
    for (const p of Object.values(e.potencias)) {
      const possiveis = MISSOES.filter(m => !usadas.has(m.id) && (m.para === 'todas' || m.para.includes(p.id)));
      const m = sortearDe(e, possiveis.length ? possiveis : MISSOES);
      usadas.add(m.id);
      p.missao = m.id;
    }
  }
  function sortearInfiltrado(e) {
    const humanos = Object.values(e.potencias).filter(p => p.humano);
    if (humanos.length < 3) return;
    const p = sortearDe(e, humanos);
    p.papel = 'infiltrado';
    p.agenda = sortearDe(e, AGENDAS).id;
  }

  // ============================== CAMINHOS DE EFEITO ==============================
  // Lê/escreve um caminho ('economia', 'recursos.energia', 'imune.ciber', 'influencia') num objeto de potência ou território
  function ler(obj, v, quem) {
    if (v === 'influencia') return obj.influencia[quem];
    const [a, b] = v.split('.');
    return b ? obj[a]?.[b] ?? 0 : obj[a] ?? 0;
  }
  function escrever(obj, v, valor, quem) {
    if (v === 'influencia') { obj.influencia[quem] = limitar(Math.round(valor), 0, 10); return obj.influencia[quem]; }
    const [a, b] = v.split('.');
    if (b) {
      if (!obj[a]) obj[a] = {};
      const lim = a === 'recursos' ? [0, PARAM.estoqueMax] : a === 'producao' ? [0, 12] : a === 'imune' ? [0, 9] : [-Infinity, Infinity];
      obj[a][b] = limitar(a === 'imune' || a === 'recursos' || a === 'producao' ? Math.round(valor) : valor, lim[0], lim[1]);
      return obj[a][b];
    }
    obj[a] = faixa(a, a === 'conflito' ? Math.round(valor) : valor);
    return obj[a];
  }

  // Seletores: a quem um efeito se aplica
  function alvosDoEfeito(e, seletor, ctx) {
    const pot = ctx.potencia && e.potencias[ctx.potencia], alvoT = ctx.alvo && e.territorios[ctx.alvo], alvoP = ctx.alvo && e.potencias[ctx.alvo];
    const neutros = () => Object.values(e.territorios).filter(t => !t.protegido);
    switch (seletor) {
      case '': return pot ? [{ obj: pot, nome: pot.id }] : [];
      case 'global': return [{ obj: e.global, nome: 'global' }];
      case 'alvo': return alvoT ? [{ obj: alvoT, nome: alvoT.id }] : alvoP ? [{ obj: alvoP, nome: alvoP.id }] : [];
      case 'local': return ctx.local ? (e.territorios[ctx.local] ? [{ obj: e.territorios[ctx.local], nome: ctx.local }] : e.potencias[ctx.local] ? [{ obj: e.potencias[ctx.local], nome: ctx.local }] : []) : [];
      case 'todos': return Object.values(e.potencias).map(p => ({ obj: p, nome: p.id }));
      case 'vizinhos': return vizinhosDe(ctx.alvo || ctx.local).map(id => e.territorios[id]).filter(t => t && !t.protegido).map(t => ({ obj: t, nome: t.id }));
      case 'vizinhosCasa': {
        const ids = new Set(vizinhosDe(ctx.potencia));
        Object.values(e.territorios).filter(t => t.parceiro === ctx.potencia).forEach(t => vizinhosDe(t.id).forEach(v => ids.add(v)));
        return [...ids].map(id => e.territorios[id]).filter(t => t && !t.protegido).sort((a, b) => b.influencia[ctx.potencia] - a.influencia[ctx.potencia]).slice(0, 4).map(t => ({ obj: t, nome: t.id }));
      }
      case 'territorios': return neutros().map(t => ({ obj: t, nome: t.id }));
      case 'emConflito': return neutros().filter(t => t.conflito > 0).map(t => ({ obj: t, nome: t.id }));
      case 'comFloresta': return neutros().filter(t => t.floresta > 0).map(t => ({ obj: t, nome: t.id }));
      case 'vulneraveis': return neutros().sort((a, b) => b.vulnerabilidade - a.vulnerabilidade).slice(0, 3).map(t => ({ obj: t, nome: t.id }));
      case 'escolhidos': return (ctx.escolhidos || []).map(id => e.territorios[id]).filter(Boolean).map(t => ({ obj: t, nome: t.id }));
      case 'vulneraveisPotencias': return Object.values(e.potencias).filter(p => p.vulnerabilidade >= 50).map(p => ({ obj: p, nome: p.id }));
      default: return [];
    }
  }
  const SELETORES = ['global', 'alvo', 'local', 'todos', 'vizinhos', 'vizinhosCasa', 'territorios', 'emConflito', 'comFloresta', 'vulneraveis', 'escolhidos', 'vulneraveisPotencias'];

  // Aplica uma lista de efeitos. ctx: { potencia, alvo, local, escolhidos, motivo, fator }. Devolve as mudanças.
  function aplicarEfeitos(e, efeitos, ctx, rel = []) {
    for (const ef of efeitos || []) {
      if (ef.atraso) { e.pendentes.push({ rodada: e.rodada + ef.atraso, efeitos: [{ ...ef, atraso: 0 }], ctx: { ...ctx } }); continue; }
      if (ef.chance !== undefined && sorte(e) > ef.chance) continue;
      if (ef.v.startsWith('rel.')) { efeitoRelacao(e, ef, ctx, rel); continue; }
      const partes = ef.v.split('.');
      let seletor = '', caminho = ef.v;
      if (SELETORES.includes(partes[0]) && partes.length > 1) { seletor = partes[0]; caminho = partes.slice(1).join('.'); }
      // "influencia" sozinho = no alvo da carta
      if (caminho === 'influencia' && !seletor) seletor = 'alvo';
      let lista = alvosDoEfeito(e, seletor, ctx);
      if (ef.max) lista = lista.sort((a, b) => b.obj.vulnerabilidade - a.obj.vulnerabilidade).slice(0, ef.max);
      for (const { obj, nome } of lista) {
        if (obj.protegido && caminho !== 'vulnerabilidade') continue;
        if (caminho === 'influencia' && !obj.influencia) continue; // influência só existe em território
        if (caminho === 'influencia' && !ctx.potencia) { // evento sem potência: mexe na influência de todas
          for (const quem of Object.keys(obj.influencia)) {
            const antes = obj.influencia[quem], depois = escrever(obj, 'influencia', antes + (ef.d ?? 0), quem);
            if (depois !== antes) rel.push({ quem: nome, v: 'influencia', de: quem, antes, depois, motivo: ctx.motivo || '' });
          }
          continue;
        }
        let d = ef.d ?? 0;
        if (ef.escala === 'clima') d *= .6 + Math.max(0, e.global.temperatura - 1.4);
        if (ef.vuln && obj.vulnerabilidade !== undefined) d *= obj.vulnerabilidade / 70;
        if (ctx.fator) d *= ctx.fator;
        if (seletor === 'global' && ctx.potencia) d *= e.escala ?? 1; // muitas potências: cada decisão pesa um pouco menos no mundo
        if (ef.imune && obj.imune?.[ef.imune] > 0) d *= ef.imune === 'pandemia' ? .5 : 0;
        const antes = ler(obj, caminho, ctx.potencia);
        let novo = ef.m !== undefined ? antes * ef.m : antes + d;
        if (caminho === 'conflito' && novo < antes && antes > 0) { e.territorios[nome] && (e.territorios[nome].mediacoes += 1); }
        const depois = escrever(obj, caminho, novo, ctx.potencia);
        if (Math.abs(depois - antes) > 1e-9) {
          rel.push({ quem: nome, v: caminho, antes: r2(antes), depois: r2(depois), motivo: ctx.motivo || '' });
          if (caminho === 'economia' && e.potencias[nome]) e.choques[nome] = (e.choques[nome] || 0) + (depois - antes); // vira contágio no balanço
          if (caminho === 'influencia' && ctx.potencia && depois > antes && e.territorios[nome]) disputa(e, ctx.potencia, e.territorios[nome], depois - antes, ctx, rel);
          if (caminho === 'tensao' && ctx.potencia && depois > antes && e.potencias[ctx.potencia]) e.potencias[ctx.potencia].tensaoGerada += depois - antes;
        }
      }
    }
    if (efeitos?.some(ef => /influencia|estabilidade/.test(ef.v))) atualizarParcerias(e, rel);
    return rel;
  }

  // 'rel.china' (quem decide × China) · 'rel.alvo' · 'rel.local' · 'rel.rivais' · 'rel.aliados' · 'rel.todos' · 'rel.china.eua' (par explícito, em eventos)
  function efeitoRelacao(e, ef, ctx, rel) {
    const partes = ef.v.split('.'), d = (ef.d ?? 0) * (ctx.fator ?? 1);
    let pares = [];
    if (partes.length === 3) pares = [[partes[1], partes[2]]];
    else if (ctx.potencia) {
      const a = ctx.potencia, x = partes[1];
      const alvoP = e.potencias[ctx.alvo] ? ctx.alvo : e.potencias[ctx.local] ? ctx.local : null;
      const lista = x === 'alvo' || x === 'local' ? [alvoP] : x === 'rivais' ? rivaisDe(e, a) : x === 'aliados' ? aliadosDe(e, a) : x === 'todos' ? outras(e, a) : [x];
      pares = lista.filter(Boolean).map(b => [a, b]);
    }
    pares.forEach(([a, b]) => mudarRel(e, a, b, d, ctx.motivo || '', rel));
  }
  // Ganhar influência num território incomoda quem já tem laços ali (esfera de influência): relação cai em proporção ao que o outro tem em jogo
  function disputa(e, pid, t, n, ctx, rel) {
    const extra = ctx.disputaExtra || 0;
    for (const q of outras(e, pid)) {
      const stake = t.influencia[q] || 0, dono = t.parceiro === q;
      if (stake < 2 && !dono) continue;
      const peso = dono ? 1.5 : Math.min(1, stake / Math.max(2, resistencia(t)));
      const feito = mudarRel(e, pid, q, -Math.min(6, (n * 1.2 + extra) * peso) * (aliadas(e, pid, q) ? .5 : 1), `disputa ${com(t.id, 'em')}`, rel);
      if (feito <= -1.5) ctx.reacoes?.push({ quem: q, para: pid, tipo: 'relacao', texto: `${maiuscula(com(q))} não gostou de ver a influência ${com(pid, 'de')} crescer ${com(t.id, 'em')}` });
    }
  }

  // ============================== INFLUÊNCIA E PARCERIAS ==============================
  const resistencia = t => PARAM.resistenciaBase + Math.floor(t.estabilidade / 25);
  function calcularParceiro(t) {
    if (t.protegido) return null;
    const ord = Object.entries(t.influencia).sort((a, b) => b[1] - a[1]);
    const [p1, n1] = ord[0] || [null, 0], n2 = ord[1]?.[1] || 0;
    return p1 && n1 >= resistencia(t) && n1 - n2 >= PARAM.margemParceria ? p1 : null;
  }
  function atualizarParcerias(e, rel = []) {
    for (const t of Object.values(e.territorios)) {
      const novo = calcularParceiro(t);
      if (novo !== t.parceiro) {
        rel.push({ quem: t.id, v: 'parceiro', antes: t.parceiro, depois: novo, motivo: novo ? `${nome(t.id)}: nova parceria ${com(novo, 'de')}` : `${nome(t.id)}: fim da parceria` });
        if (novo && t.parceiro) mudarRel(e, novo, t.parceiro, -4, `tomou a parceria ${com(t.id, 'de')}`, rel); // roubar o parceiro de outro custa caro
        t.parceiro = novo;
      }
    }
    return rel;
  }
  const parceirosDe = (e, pid) => Object.values(e.territorios).filter(t => t.parceiro === pid);
  function liderancas(e, pid) {
    const out = [];
    const porCont = {};
    Object.values(e.territorios).filter(t => !t.protegido).forEach(t => (porCont[t.continente] ||= []).push(t));
    for (const [c, lista] of Object.entries(porCont)) if (lista.filter(t => t.parceiro === pid).length > lista.length / 2) out.push(c);
    return out;
  }

  // ============================== EMISSÕES ==============================
  function emissoesDe(p) {
    const d = dadoPotencia(p.id);
    return Math.max(0, d.fossil * (p.economia / d.inicial.economia) * (100 - p.limpa) / Math.max(1, 100 - d.inicial.limpa) * (p.fossil / d.fossil)) + p.desmatamento;
  }
  function emissoesNeutras(e) {
    const anos = e.ano - PARAM.anoInicial;
    return Object.values(e.territorios).reduce((s, t) => s + t.emissoes * (1 + PARAM.crescimentoNeutras * anos + .01 * (t.desenvolvimento - t.dev0))
      * (1 - .5 * e.global.transferencia) + t.floresta, 0);
  }
  // Preço de uma unidade no mercado mundial, em pontos de economia
  function precoUnidade(e, r) {
    if (r === 'energia') return Math.max(.1, (e.global.energia - 30) / 50);
    if (r === 'alimentos') return Math.max(.1, .3 + (e.global.deslocados - 120) / 400 + (e.global.temperatura - 1.5) / 2);
    return .4;
  }
  const emissoesTotais = e => Object.values(e.potencias).reduce((s, p) => s + emissoesDe(p), 0) + emissoesNeutras(e) + PARAM.emissoesResto;

  // ============================== VEZ DO JOGADOR ==============================
  const ordemBase = () => potenciasDados().map(p => p.id);
  function ordemDaRodada(e) { const o = ordemBase(), k = (e.rodada - 1) % o.length; return [...o.slice(k), ...o.slice(0, k)]; }

  function iniciarVez(e, pid) {
    const p = e.potencias[pid];
    let cp = PARAM.cpBase + p.cpGuardado + (p.apoio >= 70 ? 1 : 0) - (p.apoio < 30 ? 1 : 0) + liderancas(e, pid).length;
    if (p.papel === 'exposto') cp -= 1;
    p.cp = Math.max(1, cp);
    p.cpGuardado = 0;
    p.jogadasNaVez = [];
    p.mao = sortearMao(e, pid);
    e.vez = pid;
    return { cp: p.cp, mao: p.mao };
  }
  function sortearMao(e, pid) {
    const porCat = {};
    POLITICAS.filter(c => !c.fixa).forEach(c => (porCat[c.categoria] ||= []).push(c.id));
    return Object.keys(CATEGORIAS).map(cat => sortearDe(e, porCat[cat] || [])).filter(Boolean);
  }
  function trocarMao(e, pid) {
    const p = e.potencias[pid];
    if (p.cp < 1) return { ok: false, motivo: 'Sem Capital Político para trocar a mão.' };
    p.cp -= 1;
    p.mao = sortearMao(e, pid);
    return { ok: true, mao: p.mao };
  }

  function custoDe(e, pid, cid) {
    const c = carta(cid);
    const custo = { ...c.custo };
    custo.cp = Math.max(c.custo.cp > 0 ? 1 : 0, (c.custo.cp || 0) - (c.desconto?.[pid] || 0));
    return custo;
  }
  function podePagar(e, pid, custo) {
    const p = e.potencias[pid];
    if (p.cp < (custo.cp || 0)) return 'Capital Político insuficiente.';
    for (const r of RECURSOS) if ((custo[r] || 0) > p.recursos[r]) return `Falta ${r === 'alimentos' ? 'alimento' : r === 'energia' ? 'energia' : r === 'minerais' ? 'minerais' : 'tecnologia'} (${custo[r]} necessário).`;
    if ((custo.economia || 0) > p.economia - 5) return 'Economia fraca demais para esse gasto.';
    return null;
  }
  function alvosValidos(e, pid, cid) {
    const c = carta(cid);
    if (c.alvo === 'potencia') return Object.keys(e.potencias).filter(id => id !== pid);
    if (c.alvo === 'territorio' || c.alvo === 'territorios3') return Object.values(e.territorios).filter(t => alvoOk(e, pid, c, t)).map(t => t.id);
    if (c.especial === 'minerais') return [];
    return [];
  }
  function alvoOk(e, pid, c, t) {
    if (t.protegido) return false;
    const r = c.requisito || {};
    if (r.conflitoMin !== undefined && t.conflito < r.conflitoMin) return false;
    if (r.conflitoMax !== undefined && t.conflito > r.conflitoMax) return false;
    if (r.estabilidadeMax !== undefined && t.estabilidade > r.estabilidadeMax) return false;
    if (r.desenvolvimentoMax !== undefined && t.desenvolvimento > r.desenvolvimentoMax) return false;
    if (r.produz && !(t.recursos[r.produz] > 0)) return false;
    return true;
  }
  function podeJogar(e, pid, cid, alvo) {
    const c = carta(cid), p = e.potencias[pid];
    if (!c) return { ok: false, motivo: 'Carta desconhecida.' };
    if (!c.fixa && !p.mao.includes(cid)) return { ok: false, motivo: 'Essa carta não está na sua mão.' };
    if (p.jogadasNaVez?.includes(cid)) return { ok: false, motivo: 'Você já usou essa carta nesta vez.' };
    const falta = podePagar(e, pid, custoDe(e, pid, cid));
    if (falta) return { ok: false, motivo: falta };
    if (c.alvo === 'potencia' && (!alvo || !e.potencias[alvo] || alvo === pid)) return { ok: false, motivo: 'Escolha outra potência.' };
    if (c.alvo === 'territorio' && !(c.especial === 'minerais' && alvo === pid)) {
      const t = e.territorios[alvo];
      if (!t) return { ok: false, motivo: 'Escolha um território no mapa.' };
      if (!alvoOk(e, pid, c, t)) return { ok: false, motivo: motivoRequisito(c, t) };
    }
    if (c.alvo === 'territorios3' && (!Array.isArray(alvo) || !alvo.length || alvo.some(id => !e.territorios[id] || e.territorios[id].protegido))) return { ok: false, motivo: 'Escolha até 3 territórios.' };
    return { ok: true };
  }
  function motivoRequisito(c, t) {
    if (t.protegido) return 'A Antártida é protegida pelo Tratado da Antártida: só ciência e paz.';
    const r = c.requisito || {};
    if (r.conflitoMin !== undefined && t.conflito < r.conflitoMin) return 'Esse território não está em conflito.';
    if (r.conflitoMax !== undefined && t.conflito > r.conflitoMax) return 'Ainda há conflito forte demais para reconstruir.';
    if (r.estabilidadeMax !== undefined && t.estabilidade > r.estabilidadeMax) return 'Esse território está estável e não precisa disso.';
    if (r.desenvolvimentoMax !== undefined && t.desenvolvimento > r.desenvolvimentoMax) return 'A cooperação Sul-Sul é para países em desenvolvimento.';
    if (r.produz) return 'Esse território não produz minerais.';
    return 'Alvo inválido.';
  }

  /* Chance de uma mediação dar certo em `alvo` (território em conflito), com os fatores para a prévia na tela.
     chance e valor são frações (0,25 = 25%). Credibilidade conta; força e resposta certa, não. */
  function chanceMediacao(e, pid, alvo) {
    const t = e.territorios[alvo], m = PARAM.mediacao, fatores = [];
    if (!t) return { chance: 0, fatores };
    const somar = (texto, valor) => { if (Math.abs(valor) >= .005) fatores.push({ texto, valor: r2(valor) }); };
    const inf = t.influencia[pid] || 0;
    somar('Ponto de partida: as partes aceitam conversar', m.base);
    somar(`Sua influência ${com(alvo, 'em')} (${inf}): confiança construída`, Math.min(m.influenciaMax, inf * m.porInfluencia));
    somar(`Cooperação internacional (${Math.round(e.global.cooperacao)})`, (e.global.cooperacao - 45) * m.cooperacao);
    somar(`Estabilidade ${com(alvo, 'de')} (${Math.round(t.estabilidade)})`, (t.estabilidade - 35) * m.estabilidade);
    if (t.conflito >= 2) somar(t.conflito >= 3 ? 'Guerra aberta: cessar-fogo é mais difícil' : 'Combates intensos', -(t.conflito - 1) * m.porNivel);
    const parte = (TERRITORIOS.find(x => x.id === alvo)?.partes || []).includes(pid)
      || e.construcoes.some(c => c.carta === 'base_militar' && c.potencia === pid && c.alvo === alvo);
    if (parte) somar('Você é parte do conflito: um dos lados desconfia', -m.parte);
    else if (vizinhosDe(pid).includes(alvo)) somar('Vizinho com interesses diretos na região', -m.vizinho);
    somar('Reputação de mediador', mod(pid, 'mediacao', 0));
    return { chance: r2(limitar(fatores.reduce((s, f) => s + f.valor, 0), m.min, m.max)), fatores };
  }

  /* Joga uma carta. opcoes: { aceita (aliança), recurso (commodities) }.
     Devolve { ok, mudancas, manchete, abrirVotacao?, sucesso?, chance?, aceita? } */
  function jogarCarta(e, pid, cid, alvo, opcoes = {}) {
    const pode = podeJogar(e, pid, cid, alvo);
    if (!pode.ok) return pode;
    const c = carta(cid), p = e.potencias[pid], custo = custoDe(e, pid, cid), rel = [];
    p.cp -= custo.cp || 0;
    for (const r of RECURSOS) if (custo[r]) p.recursos[r] -= custo[r];
    if (custo.economia) { rel.push({ quem: pid, v: 'economia', antes: p.economia, depois: p.economia - custo.economia, motivo: 'custo' }); p.economia -= custo.economia; }
    p.jogadasNaVez.push(cid);
    if (!c.fixa) p.mao = p.mao.filter(x => x !== cid);
    contarBncc(e, c.bncc);
    const ctx = { potencia: pid, alvo: Array.isArray(alvo) ? null : alvo, escolhidos: Array.isArray(alvo) ? alvo.slice(0, 3) : null, motivo: c.nome,
      reacoes: [], disputaExtra: c.diplomacia?.disputaExtra || 0 };
    let efeitos = c.efeitos || [];
    if (c.alvo === 'territorios3') efeitos = efeitos.map(ef => (ef.v === 'influencia' ? { ...ef, v: 'escolhidos.influencia' } : ef));
    let extra = c.extra?.[pid] || [];
    const regiao = mod(pid, 'influenciaRegional', {})[e.territorios[alvo]?.continente]; // ponto forte regional (ex.: África do Sul na África)
    if (regiao && efeitos.some(x => x.v === 'influencia')) extra = [...extra, { v: 'influencia', d: regiao }];
    const resultado = { ok: true, carta: cid, alvo, mudancas: rel, reacoes: ctx.reacoes };

    switch (c.especial) {
      case 'votacao': resultado.abrirVotacao = true; break;
      case 'mediacao': {
        // Mediar depende de credibilidade, não de resposta certa: a chance vem de chanceMediacao (sorteio da partida)
        resultado.chance = chanceMediacao(e, pid, alvo).chance;
        resultado.sucesso = sorte(e) < resultado.chance;
        efeitos = resultado.sucesso ? c.seSucesso : c.seFracasso;
        if (resultado.sucesso) p.contadores.mediacoes++;
        break;
      }
      case 'alianca': {
        const aceita = opcoes.aceita ?? iaAceitaAlianca(e, alvo, pid);
        resultado.aceita = aceita;
        if (!aceita) { efeitos = []; break; }
        e.aliancas.push([pid, alvo].sort());
        break;
      }
      case 'bilateral': { // cúpula, acordo, exercício: o outro lado precisa aceitar (quanto pior a relação, menos chance)
        const aceita = opcoes.aceita ?? iaAceitaBilateral(e, alvo, pid, c);
        resultado.aceita = aceita;
        if (!aceita) { efeitos = []; break; }
        if (cid === 'acordo_bilateral') e.acordos.push({ a: pid, b: alvo, ate: e.rodada + 2 });
        break;
      }
      case 'espionagem': { // sorte pesa, mas quem tem mais tecnologia espiona melhor; ser descoberto custa a relação
        const t = e.potencias[alvo];
        resultado.chance = r2(limitar(.5 + (p.producao.tecnologia - t.producao.tecnologia) * .04 - (t.imune.ciber > 0 ? .2 : 0), .15, .85));
        resultado.sucesso = sorte(e) < resultado.chance;
        resultado.descoberta = sorte(e) < (resultado.sucesso ? .25 : .75);
        efeitos = resultado.sucesso ? c.seSucesso : c.seFracasso;
        break;
      }
      case 'sancao': e.sancoes.push({ de: pid, contra: alvo, ate: e.rodada + 2 }); break;
      case 'commodities': {
        const r = opcoes.recurso || (p.recursos.alimentos >= p.recursos.minerais ? 'alimentos' : 'minerais');
        if (p.recursos[r] < 2) { resultado.ok = false; resultado.motivo = 'É preciso ter 2 alimentos ou 2 minerais para exportar.'; p.cp += custo.cp; p.jogadasNaVez.pop(); p.mao.push(cid); return resultado; }
        p.recursos[r] -= 2;
        if (r === 'alimentos') p.contadores.alimentosCedidos += 2;
        break;
      }
      case 'transnacionais': efeitos = [...efeitos, { v: 'bemEstar', d: p.bemEstar > 80 ? 1 : -1 }]; break;
      case 'minerais':
        if (alvo !== pid) efeitos = [...efeitos, { v: 'alvo.estabilidade', d: -3 }, { v: 'alvo.pressao', d: 8 }, { v: 'influencia', d: 1 }];
        else efeitos = [...efeitos, { v: 'ambiente', d: -2 }];
        if (alvo === pid) ctx.alvo = null;
        break;
      case 'meta_ndc': p.meta = { limpa: p.limpa + 15, rodada: e.rodada }; break;
      case 'desarmamento':
        if (e.desarmaramNaRodada.length) efeitos = [...efeitos, { v: 'global.tensao', d: -4 }];
        e.desarmaramNaRodada.push(pid);
        break;
      case 'acolher': p.contadores.solidariedade++; break;
      case 'defesa': p.armouNaRodada = e.rodada; break;
    }
    if (cid === 'ajuda_humanitaria') { p.contadores.solidariedade++; p.contadores.alimentosCedidos += 2; }
    aplicarEfeitos(e, [...efeitos, ...extra], ctx, rel);
    reagirCarta(e, pid, c, alvo, resultado, ctx, rel);
    resultado.relacoes = rel.filter(x => x.v === 'relacao').map(x => ({ a: x.quem, b: x.de, antes: x.antes, depois: x.depois }));
    if (c.especial !== 'votacao' && !((c.especial === 'alianca' || c.especial === 'bilateral') && !resultado.aceita) && !(c.especial === 'mediacao' && !resultado.sucesso))
      e.construcoes.push({ carta: cid, potencia: pid, alvo: Array.isArray(alvo) ? alvo : alvo || pid, ano: e.ano });
    resultado.manchete = manchete(e, pid, c, alvo, resultado);
    e.manchetes.push({ ano: e.ano, texto: resultado.manchete, potencia: pid, carta: cid });
    return resultado;
  }

  /* O mundo reage a uma carta jogada contra (ou com) outra potência: a relação muda, os amigos e inimigos do alvo tomam partido,
     o computador pode responder na mesma moeda, os amigos do alvo furam sanções e quem se sente ameaçado se arma.
     As frases vão em ctx.reacoes (resultado.reacoes) para a interface contar o que aconteceu. Os números são de js/PARAM e de c.diplomacia. */
  function reagirCarta(e, pid, c, alvo, res, ctx, rel) {
    const dp = c.diplomacia, R = ctx.reacoes;
    if (!dp) return;
    const alvoP = e.potencias[alvo] ? alvo : null, hostil = (dp.alvo || 0) < 0, rot = (a, b) => rotuloRelacao(relacao(e, a, b)).texto;
    const dizer = (quem, tipo, texto) => R.push({ quem, para: pid, tipo, texto });
    if (alvoP) {
      if (res.aceita === false) { mudarRel(e, pid, alvoP, -3, `${c.nome} recusado`, rel); return; }
      if (c.especial === 'espionagem' && !res.descoberta) return; // sabotagem sem testemunhas
      const antes = rot(pid, alvoP);
      mudarRel(e, pid, alvoP, dp.alvo, c.nome, rel);
      dizer(alvoP, 'relacao', `${maiuscula(com(alvoP))} ${hostil ? 'reagiu mal' : 'gostou'}: a relação com ${com(pid)} ${antes === rot(pid, alvoP) ? (hostil ? 'piorou' : 'melhorou') : `foi de ${antes} para ${rot(pid, alvoP)}`}`);
      const mexidas = [];
      for (const q of outras(e, pid).filter(x => x !== alvoP)) {
        const rq = relacao(e, q, alvoP);
        const d = aliadas(e, q, alvoP) ? dp.aliadosAlvo : rq > 30 ? dp.amigosAlvo : rq < -30 ? dp.inimigosAlvo : 0;
        const feito = d ? mudarRel(e, pid, q, d, c.nome, rel) : 0;
        if (Math.abs(feito) >= 1.5) mexidas.push({ q, feito, aliado: aliadas(e, q, alvoP) });
      }
      mexidas.sort((x, y) => Math.abs(y.feito) - Math.abs(x.feito)).slice(0, 3).forEach(({ q, feito, aliado }) =>
        dizer(q, aliado ? 'aliados' : 'relacao', `${maiuscula(com(q))} ${aliado ? `fecha com ${com(alvoP)}` : feito < 0 ? 'olha com desconfiança' : 'aprova'}: a relação com ${com(pid)} ${feito < 0 ? 'esfriou' : 'esquentou'}`));
      if (dp.alvoApoio) {
        aplicarEfeitos(e, [{ v: 'apoio', d: dp.alvoApoio }], { potencia: alvoP, motivo: 'união nacional diante da pressão' }, rel);
        dizer(alvoP, 'apoio', `Sob pressão, ${com(alvoP)} fecha fileiras: o apoio ao governo sobe`);
      }
      if (dp.furam) { // quem é amigo do alvo (e não do autor) continua negociando: a sanção perde força
        const furam = outras(e, pid).filter(q => q !== alvoP && relacao(e, q, alvoP) >= 30 && relacao(e, q, pid) < 60 && !aliadas(e, q, pid)).slice(0, 3);
        if (furam.length) {
          aplicarEfeitos(e, [{ v: 'alvo.economia', d: furam.length }], { potencia: pid, alvo: alvoP, motivo: 'comércio com países amigos' }, rel);
          dizer(furam[0], 'furaram', `${furam.map(nome).join(' e ')} continuaram comerciando com ${com(alvoP)}: ${c.nome.toLowerCase()} ${/s$/.test(c.nome) ? 'perderam' : 'perdeu'} força`);
        }
      }
      if (dp.retalia && !e.potencias[alvoP].humano && sorte(e) < PARAM.retaliacao.base + PARAM.retaliacao.porHostilidade * Math.max(0, -relacao(e, pid, alvoP)) / 100) {
        aplicarEfeitos(e, c.efeitos, { potencia: alvoP, alvo: pid, fator: .6, motivo: `resposta ${com(alvoP, 'de')}: ${c.nome.toLowerCase()}` }, rel);
        mudarRel(e, pid, alvoP, -4, 'retaliação', rel);
        dizer(alvoP, 'retaliacao', `${maiuscula(com(alvoP))} respondeu na mesma moeda: ${c.nome.toLowerCase()} contra ${com(pid)}`);
      }
    }
    if (dp.confianca) outras(e, pid).filter(q => relacao(e, pid, q) > -50).forEach(q => mudarRel(e, pid, q, dp.confianca, c.nome, rel));
    if (dp.corrida) { // dilema de segurança: quem não é aliado e não gosta de você se arma de volta
      outras(e, pid).filter(q => q !== alvoP && !aliadas(e, q, pid) && relacao(e, q, pid) < 15).sort((x, y) => relacao(e, pid, x) - relacao(e, pid, y)).slice(0, 3).forEach(q => {
        mudarRel(e, pid, q, -2, 'corrida armamentista', rel);
        if (e.potencias[q].economia > 30) aplicarEfeitos(e, [{ v: 'militar', d: 2 }, { v: 'economia', d: -.3 }], { potencia: q, motivo: `reação ao armamento ${com(pid, 'de')}` }, rel);
        dizer(q, 'corrida', `${maiuscula(com(q))} reforçou a defesa em resposta ${com(pid, 'a')}`);
      });
    }
  }

  function encerrarVez(e, pid) {
    const p = e.potencias[pid];
    p.cpGuardado = Math.min(PARAM.cpGuardaMax, p.cp);
    p.cp = 0;
    e.vez = null;
  }

  // Negociação direta de recursos (estilo Catan): oferta e pedido são { recurso: n }
  function negociar(e, de, para, oferta, pedido) {
    const a = e.potencias[de], b = e.potencias[para];
    for (const r of RECURSOS) {
      if ((oferta[r] || 0) > a.recursos[r]) return { ok: false, motivo: 'Você não tem o que ofereceu.' };
      if ((pedido[r] || 0) > b.recursos[r]) return { ok: false, motivo: `${para} não tem o que você pediu.` };
    }
    if (e.sancoes.some(s => (s.de === de && s.contra === para) || (s.de === para && s.contra === de))) return { ok: false, motivo: 'Há sanções entre vocês: o comércio está bloqueado.' };
    for (const r of RECURSOS) {
      a.recursos[r] += (pedido[r] || 0) - (oferta[r] || 0);
      b.recursos[r] += (oferta[r] || 0) - (pedido[r] || 0);
      a.recursos[r] = limitar(a.recursos[r], 0, PARAM.estoqueMax); b.recursos[r] = limitar(b.recursos[r], 0, PARAM.estoqueMax);
    }
    a.contadores.alimentosCedidos += oferta.alimentos || 0;
    b.contadores.alimentosCedidos += pedido.alimentos || 0;
    e.global.comercio = faixa('comercio', e.global.comercio + 1);
    return { ok: true };
  }
  function valorRecurso(e, pid, r) {
    const p = e.potencias[pid], falta = (p.consumo[r] || 0) - (p.producao[r] || 0);
    return 1 + (falta > 0 ? .6 : 0) + (p.recursos[r] <= 1 ? .4 : 0) - (p.recursos[r] >= 8 ? .5 : 0);
  }
  function iaAceitaTroca(e, pid, oferta, pedido) {
    // pid recebe "oferta" e entrega "pedido"
    const ganha = RECURSOS.reduce((s, r) => s + (oferta[r] || 0) * valorRecurso(e, pid, r), 0);
    const perde = RECURSOS.reduce((s, r) => s + (pedido[r] || 0) * valorRecurso(e, pid, r), 0);
    return ganha >= perde * 1.05;
  }
  // O computador aceita pela relação (com um pouco de acaso); tensão alta e insegurança deixam mais aberto a aliados
  function iaAceitaAlianca(e, pid, de) {
    if (sancionados(e, pid, de)) return false;
    const aberto = (e.global.tensao > 65 ? 10 : 0) + (e.potencias[pid].seguranca < 60 ? 8 : 0);
    return relacao(e, pid, de) + aberto + (sorte(e) - .5) * 20 >= (carta('alianca').diplomacia.aceitaSe || 10);
  }
  function iaAceitaBilateral(e, pid, de, c) {
    if (sancionados(e, pid, de) && c.id !== 'cupula_bilateral') return false;
    return relacao(e, pid, de) + (sorte(e) - .5) * 20 >= (c.diplomacia?.aceitaSe ?? 0);
  }

  // ============================== EVENTOS ==============================
  // Peso de sorteio de um evento ou dilema: condições do mundo (e da potência, nos dilemas) e foco da aula
  function pesoSorteio(e, item, pid) {
    if (item.rodadaMin && e.rodada < item.rodadaMin) return 0;
    let peso = item.peso ?? 1;
    for (const c of item.condicoes || []) {
      const valor = valorCondicao(e, c, pid);
      const ok = (c.min === undefined || valor >= c.min) && (c.max === undefined || valor <= c.max);
      if (c.exige && !ok) return 0;
      if (ok && c.x) peso *= c.x;
    }
    if (e.config.foco?.length && item.temas?.some(t => e.config.foco.includes(t))) peso *= 2.5;
    return peso;
  }
  function pesoEvento(e, ev) {
    if (ev.unico && e.eventosUsados.includes(ev.id)) return 0;
    if (e.eventosUsados.slice(-4).includes(ev.id)) return 0;
    return pesoSorteio(e, ev);
  }
  // v: 'global.x' · 'territorio.<id>.<campo>' · 'conflitos' · 'rodada' · 'potencia.<campo>' (quem decide; 'potencia.parceiros' = nº de parceiros)
  function valorCondicao(e, c, pid) {
    const [a, b] = c.v.split('.');
    if (a === 'global') return e.global[b];
    if (a === 'territorio') { const [, id, campo] = c.v.split('.'); return e.territorios[id]?.[campo] ?? 0; }
    if (a === 'conflitos') return Object.values(e.territorios).filter(t => t.conflito > 0).length;
    if (a === 'rodada') return e.rodada;
    if (a === 'potencia' && e.potencias[pid]) return b === 'parceiros' ? parceirosDe(e, pid).length : ler(e.potencias[pid], c.v.slice(9));
    return 0;
  }
  /* local: id · 'casa' (a própria potência) · { entre: [ids], conflitoMin, estabilidadeMax, vulnerabilidadeMin,
     influenciaMin (da potência que decide), vizinho: true (vizinho da casa ou de um parceiro dela) } */
  function escolherLocal(e, item, pid) {
    const L = item.local;
    if (!L) return null;
    if (L === 'casa') return pid || null;
    if (typeof L === 'string') return L;
    const perto = L.vizinho && new Set([...vizinhosDe(pid), ...parceirosDe(e, pid).flatMap(t => vizinhosDe(t.id))]);
    const lista = L.entre ? L.entre.filter(id => e.territorios[id] || e.potencias[id]) : Object.values(e.territorios).filter(t => !t.protegido).map(t => t.id);
    const cand = lista.filter(id => {
      const t = e.territorios[id];
      if (!t) return true;
      if (L.conflitoMin !== undefined && t.conflito < L.conflitoMin) return false;
      if (L.estabilidadeMax !== undefined && t.estabilidade > L.estabilidadeMax) return false;
      if (L.vulnerabilidadeMin !== undefined && t.vulnerabilidade < L.vulnerabilidadeMin) return false;
      if (L.influenciaMin !== undefined && !(t.influencia[pid] >= L.influenciaMin)) return false;
      if (perto && !perto.has(id)) return false;
      return true;
    });
    return cand.length ? sortearDe(e, cand) : null;
  }
  // Sorteia os eventos do mandato. Devolve [{ id, local }]
  function sortearEventos(e) {
    const emCrise = e.global.tensao >= 80 || e.global.temperatura >= 2.0 || e.global.deslocados >= 150;
    const n = emCrise ? PARAM.eventosEmCrise : PARAM.eventosPorRodada, out = [];
    for (let i = 0; i < n; i++) {
      const itens = EVENTOS.map(ev => ({ item: ev, peso: out.some(o => o.id === ev.id) ? 0 : pesoEvento(e, ev) })).filter(x => x.peso > 0);
      if (!itens.length) break;
      const ev = sortearPeso(e, itens), local = escolherLocal(e, ev);
      if (ev.local && !local) continue;
      out.push({ id: ev.id, local });
      e.eventosUsados.push(ev.id);
    }
    return out;
  }
  const evento = id => EVENTOS.find(x => x.id === id);
  // Só o que a tela precisa de cada opção (os efeitos ficam no motor)
  const opcoesPublicas = opcoes => opcoes.map(({ texto, resumo, categoria }) => ({ texto, resumo, categoria }));
  // Aplica os efeitos diretos de um evento (a escolha, se houver, é resolvida pela interface com as funções abaixo)
  function aplicarEvento(e, id, local) {
    const ev = evento(id), rel = [];
    contarBncc(e, ev.bncc);
    aplicarEfeitos(e, ev.efeitos, { local, alvo: local, motivo: ev.titulo }, rel);
    e.manchetes.push({ ano: e.ano, texto: ev.manchete || ev.titulo, evento: id });
    (e.locaisEventos ||= {})[id] = local; // a IA decide sabendo onde foi
    const esc = ev.escolha?.tipo === 'decisao' ? { tipo: 'decisao', opcoes: opcoesPublicas(ev.escolha.opcoes) } : ev.escolha || null;
    return { mudancas: rel, escolha: esc };
  }
  // Pedido de ajuda: doacoes = { pid: quantidade do recurso pedido }
  function resolverDoacao(e, id, local, doacoes) {
    const ev = evento(id), esc = ev.escolha, rel = [];
    let total = 0;
    for (const [pid, n] of Object.entries(doacoes)) {
      const p = e.potencias[pid], q = Math.min(n, p.recursos[esc.recurso]);
      if (!q) continue;
      p.recursos[esc.recurso] -= q;
      total += q;
      if (esc.recurso === 'alimentos') p.contadores.alimentosCedidos += q;
      p.contadores.solidariedade += q >= 2 ? 1 : 0;
      if (local && e.territorios[local]) aplicarEfeitos(e, [{ v: 'influencia', d: q }], { potencia: pid, alvo: local, motivo: 'doação' }, rel);
      p.apoio = faixa('apoio', p.apoio + 1);
    }
    const sucesso = total >= esc.meta;
    aplicarEfeitos(e, sucesso ? esc.sucesso : esc.fracasso, { local, alvo: local, motivo: ev.titulo }, rel);
    return { sucesso, total, mudancas: rel };
  }
  /* Decisão diante de um evento: cada potência escolhe uma opção, escolhas = { pid: indice }.
     Se o evento tem "coletivo" e pelo menos coletivo.min potências escolhem coletivo.opcao, o mundo todo sente (senão, sente o "senao").
     Devolve { mudancas, manchetes: [texto], porques: { pid: texto } } */
  function resolverDecisao(e, id, local, escolhas) {
    const ev = evento(id), esc = ev.escolha, rel = [], manchetes = [], porques = {}, conta = esc.opcoes.map(() => 0);
    for (const [pid, i] of Object.entries(escolhas)) {
      const op = esc.opcoes[i];
      if (!op || !e.potencias[pid]) continue;
      conta[i]++;
      contarBncc(e, op.bncc);
      aplicarEfeitos(e, op.efeitos, { potencia: pid, local, alvo: local, motivo: `${ev.titulo}: ${op.resumo}` }, rel);
      manchetes.push(preencher(op.manchete, pid, local) || `${nome(pid)}: ${op.resumo}`);
      porques[pid] = op.porque;
    }
    const col = esc.coletivo;
    if (col) {
      const juntos = conta[col.opcao] >= col.min, efeitos = juntos ? col.efeitos : col.senao;
      if (efeitos) aplicarEfeitos(e, efeitos, { local, alvo: local, motivo: juntos ? col.motivo : col.motivoSenao }, rel);
      const m = juntos ? col.manchete : col.mancheteSenao;
      if (m) manchetes.push(m);
    }
    manchetes.forEach(texto => e.manchetes.push({ ano: e.ano, texto, evento: id }));
    return { mudancas: rel, manchetes, porques };
  }
  // Escolha do computador numa decisão de evento: sorteada, puxando para o que o perfil dele mais valoriza
  function iaDecisao(e, pid, id, local = e.locaisEventos?.[id] ?? null) {
    const esc = evento(id).escolha, col = esc.coletivo;
    return escolherOpcao(e, pid, esc.opcoes, local, i => (col && i === col.opcao ? .3 * utilidadeEfeitos(e, pid, col.efeitos, local) : 0));
  }
  function iaDoacao(e, pid, recurso) {
    const p = e.potencias[pid];
    const generosidade = (p.id === 'ue' || p.id === 'brasil' ? 1 : .6) * (e.config.modo === 'cooperativo' ? 1.5 : 1);
    return Math.min(p.recursos[recurso], Math.round(Math.max(0, p.recursos[recurso] - 2) * .5 * generosidade));
  }

  // ============================== DILEMAS DE GOVERNO ==============================
  // Situações sem resposta certa (conteudo/dilemas.js): cada opção é uma troca, e a consequência aparece no mundo.
  const dilema = id => (typeof DILEMAS !== 'undefined' ? DILEMAS : []).find(d => d.id === id);
  // Equipes humanas dividem uma lista (cada dilema aparece uma vez na mesa); o computador usa a própria, para não gastar o estoque dos alunos
  const usadosDe = (e, pid) => (e.potencias[pid].humano ? e.dilemasUsados : (e.potencias[pid].dilemasUsados ||= []));
  function pesoDilema(e, pid, d) {
    if (usadosDe(e, pid).includes(d.id)) return 0;             // não repete na partida (para quem decide)
    if (d.potencias && !d.potencias.includes(pid)) return 0;   // dilema específico de algumas potências
    return pesoSorteio(e, d, pid) * (d.potencias ? 1.5 : 1);   // os da própria potência saem um pouco mais
  }
  function dilemaPublico(d, local, pid) { // {quem} e {local} viram nomes
    const t = x => preencher(x, pid, local);
    return { id: d.id, titulo: t(d.titulo), texto: t(d.texto), icone: d.icone, conceito: d.conceito, ...(local ? { local } : {}),
      ...(d.vocesabia ? { vocesabia: d.vocesabia } : {}), opcoes: opcoesPublicas(d.opcoes).map(o => ({ ...o, texto: t(o.texto) })) };
  }
  /* Dilema da vez de uma potência: { id, titulo, texto, icone, conceito, local?, vocesabia?, opcoes: [{ texto, resumo, categoria }] }
     ou null (acabaram os que servem, ou ela já decidiu nesta vez). Chamar de novo na mesma vez devolve o mesmo dilema. */
  function dilemaDaVez(e, pid) {
    const p = e.potencias[pid], atual = p.dilema;
    if (atual?.rodada === e.rodada) return atual.opcao === null && dilema(atual.id) ? dilemaPublico(dilema(atual.id), atual.local, pid) : null;
    if (typeof DILEMAS === 'undefined') return null;
    const itens = DILEMAS.map(d => ({ item: d, peso: pesoDilema(e, pid, d) })).filter(x => x.peso > 0);
    while (itens.length) {
      const d = sortearPeso(e, itens), local = escolherLocal(e, d, pid);
      if (d.local && !local) { itens.splice(itens.findIndex(x => x.item === d), 1); continue; } // nenhum lugar serve agora
      p.dilema = { id: d.id, local, rodada: e.rodada, opcao: null };
      usadosDe(e, pid).push(d.id);
      return dilemaPublico(d, local, pid);
    }
    return null;
  }
  // Aplica a opção escolhida. Devolve { mudancas, manchete, porque, conceito }
  function resolverDilema(e, pid, id, indice) {
    const d = dilema(id), p = e.potencias[pid], op = d?.opcoes[indice];
    if (!op) return { mudancas: [], manchete: '', porque: '', conceito: d?.conceito || '' };
    if (p.dilema?.id !== id) { // resolvido sem passar por dilemaDaVez (ex.: partida carregada)
      p.dilema = { id, local: escolherLocal(e, d, pid), rodada: e.rodada, opcao: null };
      if (!usadosDe(e, pid).includes(id)) usadosDe(e, pid).push(id);
    }
    if (p.dilema.opcao !== null) return { mudancas: [], manchete: '', porque: op.porque, conceito: d.conceito }; // já decidido
    p.dilema.opcao = indice;
    const local = p.dilema.local, rel = [];
    contarBncc(e, [...(d.bncc || []), ...(op.bncc || [])]);
    aplicarEfeitos(e, op.efeitos, { potencia: pid, alvo: local, local, motivo: op.resumo }, rel);
    const manchete = preencher(op.manchete, pid, local) || `${nome(pid)}: ${op.resumo}`;
    e.manchetes.push({ ano: e.ano, texto: manchete, potencia: pid, dilema: id, opcao: indice });
    return { mudancas: rel, manchete, porque: op.porque, conceito: d.conceito };
  }
  // Escolha do computador: sorteada, puxando para o que o perfil dele mais valoriza (governos pesam diferente)
  function iaDilema(e, pid, d0) {
    const d = dilema(d0.id), p = e.potencias[pid];
    const local = d0.local ?? (p.dilema?.id === d0.id ? p.dilema.local : null);
    return escolherOpcao(e, pid, d.opcoes, local);
  }

  // ============================== ONU ==============================
  const resolucao = id => RESOLUCOES.find(r => r.id === id);
  function resolucoesDisponiveis(e, pid) {
    const out = [];
    for (const r of RESOLUCOES) {
      if (r.alvo === 'conflito') Object.values(e.territorios).filter(t => t.conflito > 0).forEach(t => out.push({ id: r.id, alvo: t.id }));
      else if (r.alvo === 'potencia') Object.keys(e.potencias).filter(x => x !== pid).forEach(x => out.push({ id: r.id, alvo: x }));
      else out.push({ id: r.id, alvo: null });
    }
    return out;
  }
  const PERMANENTES = () => potenciasDados().filter(p => p.permanente).map(p => p.id);
  function votantes(e, res) {
    const r = resolucao(res.id);
    if (r.orgao === 'cs') return Object.keys(e.potencias);
    return [...Object.keys(e.potencias), ...Object.values(e.territorios).filter(t => !t.protegido).map(t => t.id)];
  }
  // Voto de um território neutro (ou do Reino Unido no Conselho)
  function votoTerritorio(e, tid, res, votosPotencias) {
    const t = e.territorios[tid], r = resolucao(res.id);
    if (t.parceiro && t.pressao < 50 && votosPotencias[t.parceiro]) return votosPotencias[t.parceiro] === 'veto' ? 'nao' : votosPotencias[t.parceiro];
    let chance = .5;
    if (r.id === 'acordo_climatico') chance = t.vulnerabilidade >= 50 ? .9 : t.desenvolvimento >= 85 ? .7 : .45;
    if (r.id === 'fundo_humanitario' || r.id === 'fundo_vacinas') chance = t.desenvolvimento < 75 || t.conflito > 0 ? .9 : .6;
    if (r.id === 'tratado_desarmamento') chance = .75;
    if (r.id === 'missao_paz') chance = res.alvo === tid ? .3 : .7;
    if (r.id === 'sancoes_onu') chance = .4;
    const x = sorte(e);
    return x < chance ? 'sim' : x < chance + .12 ? 'abst' : 'nao';
  }
  function iaVoto(e, pid, res) {
    const r = resolucao(res.id), p = e.potencias[pid], d = dadoPotencia(pid);
    let u = 0;
    if (r.id === 'missao_paz') { const t = e.territorios[res.alvo]; u = 1 - (t?.parceiro === pid ? 1.5 : 0) + (e.global.tensao > 75 ? .5 : 0); }
    if (r.id === 'sancoes_onu') u = res.alvo === pid ? -9 : -relacao(e, pid, res.alvo) / 50 - (aliadas(e, pid, res.alvo) ? 1.5 : 0) - .3; // vota contra quem não gosta, protege amigos
    if (r.id === 'acordo_climatico') u = d.ia.ambiente * (1 + Math.max(0, e.global.temperatura - 1.7) * 2) - d.ia.economia * .9 + (e.config.modo === 'cooperativo' ? .6 : 0);
    if (r.id === 'fundo_humanitario') u = .5 + (e.global.deslocados > 140 ? .6 : 0) - (p.economia < 40 ? .8 : 0);
    if (r.id === 'tratado_desarmamento') u = (e.global.tensao > 70 ? 1 : .2) - (p.militar > 80 ? .7 : 0) + (d.ia.cooperacao - 1);
    if (r.id === 'fundo_vacinas') u = .8;
    if (res.proponente === pid) u += 2;
    else if (res.proponente && e.potencias[res.proponente]) u += relacao(e, pid, res.proponente) / 120; // amigos apoiam a proposta de amigos
    u += (sorte(e) - .5) * .6;
    if (u > .15) return 'sim';
    if (u < -.6 && r.orgao === 'cs' && d.permanente) return 'veto';
    return u < -.15 ? 'nao' : 'abst';
  }
  /* votos = { pid: 'sim'|'nao'|'abst'|'veto' } das 6 potências. res = { id, alvo, proponente }.
     Os territórios votam sozinhos. Devolve { aprovada, vetos, sim, nao, abst, votos, mudancas } */
  function votacao(e, res, votos) {
    const r = resolucao(res.id), rel = [], todos = { ...votos };
    for (const v of votantes(e, res)) if (!(v in todos)) todos[v] = e.territorios[v] ? votoTerritorio(e, v, res, votos) : iaVoto(e, v, res);
    const perms = PERMANENTES();
    const vetos = r.orgao === 'cs' ? Object.entries(todos).filter(([q, v]) => (v === 'veto' || (v === 'nao' && perms.includes(q)))).map(([q]) => q) : [];
    const conta = s => Object.values(todos).filter(v => v === s || (s === 'nao' && v === 'veto')).length;
    const sim = conta('sim'), nao = conta('nao'), abst = conta('abst');
    const aprovada = r.orgao === 'cs' ? !vetos.length && sim >= Math.ceil(Object.keys(todos).length * PARAM.maioriaConselho) : sim > nao;
    for (const pid of vetos.filter(q => e.potencias[q])) {
      aplicarEfeitos(e, [{ v: 'global.cooperacao', d: -3 }], { potencia: pid, motivo: 'veto' }, rel);
      const algunsT = Object.values(e.territorios).filter(t => t.influencia[pid] > 0).slice(0, 2);
      algunsT.forEach(t => aplicarEfeitos(e, [{ v: 'influencia', d: -1 }], { potencia: pid, alvo: t.id, motivo: 'desgaste do veto' }, rel));
    }
    if (aprovada) {
      aplicarEfeitos(e, r.efeitos, { potencia: res.proponente, alvo: res.alvo, motivo: r.nome }, rel);
      Object.entries(todos).filter(([q, v]) => v === 'sim' && e.potencias[q]).forEach(([q]) => {
        e.potencias[q].contadores.resolucoesApoiadas++;
        if (r.custoSim?.economia) aplicarEfeitos(e, [{ v: 'economia', d: -r.custoSim.economia }], { potencia: q, motivo: 'contribuição para a missão' }, rel);
      });
      if (res.proponente && e.potencias[res.proponente]) e.potencias[res.proponente].contadores.propostasAprovadas++;
      if (r.alvo === 'potencia') e.sancoes.push({ de: 'onu', contra: res.alvo, ate: e.rodada + 2 });
    } else aplicarEfeitos(e, [{ v: 'global.cooperacao', d: -1 }], { motivo: 'resolução rejeitada' }, rel);
    (r.bncc || []).forEach(b => (e.bncc[b] = (e.bncc[b] || 0) + 1));
    e.manchetes.push({ ano: e.ano, texto: `ONU ${aprovada ? 'aprova' : 'rejeita'}: ${r.nome}${vetos.length ? ' (veto)' : ''}` });
    return { aprovada, vetos, sim, nao, abst, votos: todos, mudancas: rel };
  }

  // ============================== CÚPULA DO CLIMA (COP) ==============================
  const copNestaRodada = e => e.config.rodadas >= 6 ? e.rodada % 2 === 0 : e.rodada === 2 || e.rodada === e.config.rodadas;
  function iaCop(e, pid) {
    const d = { ia: pesosIA(e, pid) }, p = e.potencias[pid];
    let u = d.ia.ambiente * 1.2 + (e.global.temperatura - 1.6) * 3 + (e.global.cooperacao - 45) / 25 - (p.economia < 45 ? 1 : 0) - d.ia.economia * .6;
    if (e.config.modo === 'cooperativo') u += 1;
    u += (sorte(e) - .5) * .8;
    return u > 1.2 ? 2 : u > .3 ? 1 : 0;
  }
  // compromissos = { pid: 0|1|2 }
  const metaCop = e => Math.round(Object.keys(e.potencias).length * PARAM.copPorPotencia);
  function resolverCop(e, compromissos) {
    const rel = [];
    for (const [pid, c] of Object.entries(compromissos)) {
      if (c === 2) aplicarEfeitos(e, [{ v: 'limpa', d: 12 }, { v: 'economia', d: -3 }], { potencia: pid, motivo: 'compromisso alto na COP' }, rel);
      if (c === 1) aplicarEfeitos(e, [{ v: 'limpa', d: 6 }, { v: 'economia', d: -1 }], { potencia: pid, motivo: 'compromisso médio na COP' }, rel);
    }
    const soma = Object.values(compromissos).reduce((s, c) => s + c, 0), sucesso = soma >= metaCop(e);
    aplicarEfeitos(e, sucesso
      ? [{ v: 'global.cooperacao', d: 6 }, { v: 'global.transferencia', d: .15 }, { v: 'global.deslocados', d: -4 }, { v: 'global.tensao', d: -2 }]
      : [{ v: 'global.cooperacao', d: -3 }, { v: 'global.tensao', d: 1 }], { motivo: sucesso ? 'acordo histórico na COP' : 'COP fracassa' }, rel); // acordo também desarma a desconfiança
    ['EM13CHS305', 'EM13CHS306'].forEach(b => (e.bncc[b] = (e.bncc[b] || 0) + 1));
    e.manchetes.push({ ano: e.ano, texto: sucesso ? 'Cúpula do Clima termina com acordo histórico' : 'Cúpula do Clima termina sem acordo' });
    return { sucesso, soma, mudancas: rel };
  }

  // ============================== AGENTE INFILTRADO ==============================
  // votos = { pid: acusado }
  function reuniaoEmergencia(e, chamou, votos) {
    const p = e.potencias[chamou];
    if (p) p.cp = Math.max(0, p.cp - 2);
    e.reuniaoUsada = true;
    const contagem = {};
    Object.values(votos).forEach(a => a && (contagem[a] = (contagem[a] || 0) + 1));
    const [acusado, n] = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0] || [null, 0];
    const maioria = n > Object.keys(votos).length / 2;
    if (!maioria || !acusado) return { acusado: null, acertou: false };
    const acertou = e.potencias[acusado].papel === 'infiltrado';
    if (acertou) { e.potencias[acusado].papel = 'exposto'; e.infiltradoExposto = true; }
    else { e.potencias[acusado].cpGuardado = -2; e.global.tensao = faixa('tensao', e.global.tensao + 5); }
    return { acusado, acertou };
  }

  // ============================== BALANÇO DO MANDATO ==============================
  function snapshot(e) {
    return { global: { ...e.global }, potencias: Object.fromEntries(Object.values(e.potencias).map(p => [p.id, Object.fromEntries([...INDICADORES, 'limpa'].map(k => [k, p[k]]))])) };
  }
  function balanco(e) {
    const antes = snapshot(e), rel = [], causas = { temperatura: [], tensao: [], deslocados: [], energia: [] };
    const D = e.delta, f = D / 4; // f = fração de um mandato de 4 anos
    const pids = Object.keys(e.potencias), N = pids.length;
    const diplomacia = { relacoes: [], contagio: [], incidentes: [] };

    // 1. efeitos atrasados
    const agora = e.pendentes.filter(x => x.rodada <= e.rodada + 1);
    e.pendentes = e.pendentes.filter(x => x.rodada > e.rodada + 1);
    agora.forEach(x => aplicarEfeitos(e, x.efeitos, { ...x.ctx, motivo: (x.ctx.motivo || '') + ' (efeito que demorou)' }, rel));

    // 2. produção, consumo e mercado
    const mercado = [];
    for (const p of Object.values(e.potencias)) {
      const prod = { ...p.producao };
      parceirosDe(e, p.id).forEach(t => RECURSOS.forEach(r => (prod[r] = (prod[r] || 0) + (t.recursos[r] || 0))));
      prod.alimentos += mod(p.id, 'agro', 0);
      if (e.sancoes.some(s => s.contra === p.id && s.ate >= e.rodada)) prod.energia = Math.ceil(prod.energia * .6);
      RECURSOS.forEach(r => (p.recursos[r] += prod[r] || 0));
      for (const r of ['alimentos', 'energia']) {
        p.recursos[r] -= p.consumo[r] || 0;
        if (p.recursos[r] < 0) {
          const preco = precoUnidade(e, r), custo = -p.recursos[r] * preco;
          p.economia = faixa('economia', p.economia - custo);
          mercado.push({ potencia: p.id, recurso: r, quantidade: p.recursos[r], valor: -r1(custo) });
          if (r === 'alimentos' && custo > 2) p.bemEstar = faixa('bemEstar', p.bemEstar - 1);
          p.recursos[r] = 0;
        }
      }
      for (const r of RECURSOS) {
        if (p.recursos[r] > PARAM.vendeAcima) {
          const sobra = Math.min(3, p.recursos[r] - PARAM.vendeAcima), preco = precoUnidade(e, r) * .6;
          const vendido = e.sancoes.some(s => s.contra === p.id && s.ate >= e.rodada) ? preco * .5 : preco;
          p.economia = faixa('economia', p.economia + sobra * vendido);
          if (r === 'alimentos') p.contadores.alimentosCedidos += sobra;
          mercado.push({ potencia: p.id, recurso: r, quantidade: sobra, valor: r1(sobra * vendido) });
          p.recursos[r] = PARAM.vendeAcima;
        }
      }
    }

    // 3. emissões e temperatura
    const porPotencia = Object.fromEntries(Object.values(e.potencias).map(p => [p.id, emissoesDe(p)]));
    const neutras = emissoesNeutras(e), total = Object.values(porPotencia).reduce((s, x) => s + x, 0) + neutras + PARAM.emissoesResto;
    Object.entries(porPotencia).forEach(([id, x]) => (e.potencias[id].emissoesAcumuladas += x * D));
    let dT = PARAM.tcre * total * D;
    for (const [lim, extra] of PARAM.retroalimentacao) if (e.global.temperatura > lim) dT += extra * f;
    e.global.temperatura = faixa('temperatura', e.global.temperatura + dT);
    causas.temperatura = Object.entries(porPotencia).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, x]) => ({ quem: id, valor: r1(x) }));
    causas.temperatura.push({ quem: 'territorios', valor: r1(neutras) });

    // 4. dano climático, economia e indicadores das potências
    const excesso = Math.max(0, e.global.temperatura - 1.4);
    const militarMedio = Object.values(e.potencias).reduce((s, p) => s + p.militar, 0) / N;
    // crescimento de cada potência sozinha; depois soma o que vem dos parceiros (contágio) e do atrito das relações
    const crescBase = {}, expo = id => mod(id, 'exposicao', 1);
    for (const p of Object.values(e.potencias)) {
      const dano = excesso * p.vulnerabilidade / 100 * PARAM.danoClima * f;
      const exportador = EXPORTADORES_ENERGIA.includes(p.id) && p.producao.energia > (p.consumo.energia || 0);
      const efEnergia = (exportador ? 1 : -1) * (e.global.energia - 50) / PARAM.energiaEconomia * mod(p.id, 'energia', 1);
      const sancionada = e.sancoes.filter(s => s.contra === p.id && s.ate >= e.rodada).length;
      crescBase[p.id] = (p.crescimento + (e.global.comercio - 60) / 20 + efEnergia + .3 * parceirosDe(e, p.id).length
        + Math.min(1.5, p.producao.tecnologia / 4) - dano / 2 - 1.5 * sancionada * mod(p.id, 'sancao', 1)
        - (p.militar - p.inicial.militar) / 80 - .05 * Math.max(0, 50 - p.seguranca)) * f; // gasto militar conta pelo que mudou desde 2026
    }
    const variacao = id => crescBase[id] + (e.choques[id] || 0); // crescimento + choques das decisões do mandato
    const mediaVar = pids.reduce((s, id) => s + variacao(id), 0) / N;
    // relação "para o comércio": a de agora, mais acordos, menos sanções entre os dois; só o que MUDOU desde 2026 pesa (o resto já está no crescimento base)
    const relComercio = (a, b) => limitar(relacao(e, a, b) + (e.acordos.some(x => x.ate >= e.rodada && ((x.a === a && x.b === b) || (x.a === b && x.b === a))) ? PARAM.acordoBonus : 0)
      - (sancionados(e, a, b) ? PARAM.sancaoPeso : 0), -100, 100) - relBase(a, b);
    const efeitoComercio = {};
    for (const a of pids) {
      let atrito = 0, contagio = 0;
      for (const [b, w] of Object.entries(COMERCIO[a] || {})) {
        if (!e.potencias[b]) continue;
        atrito += w * relComercio(a, b) / 100 * PARAM.atrito;
        const c = w * (variacao(b) - mediaVar) * PARAM.contagio;
        contagio += c;
        if (Math.abs(c * expo(a)) >= .15) diplomacia.contagio.push({ de: b, para: a, valor: r1(c * expo(a)) });
      }
      efeitoComercio[a] = (atrito + contagio) * expo(a) * f;
    }
    diplomacia.contagio.sort((x, y) => Math.abs(y.valor) - Math.abs(x.valor)).splice(4);
    for (const p of Object.values(e.potencias)) {
      const d = dadoPotencia(p.id), a = antes.potencias[p.id];
      const dano = excesso * p.vulnerabilidade / 100 * PARAM.danoClima * f;
      const cresc = crescBase[p.id] + efeitoComercio[p.id];
      p.economia = faixa('economia', p.economia + cresc);
      p.bemEstar = faixa('bemEstar', p.bemEstar + mod(p.id, 'fBem', .3) * Math.max(-3, cresc) - dano / 2);
      p.ambiente = faixa('ambiente', p.ambiente + .5 * (p.limpa - a.limpa) / 10 - p.desmatamento * 3 * f - .5 * Math.max(0, e.global.temperatura - 1.5) * 10 * f + .5);
      const conflitosVizinhos = vizinhosDe(p.id).map(id => e.territorios[id]).filter(t => t && t.conflito >= 2).length; // pesa .5 (era 1: decidia o placar pela geografia)
      // armar-se dá segurança (o arsenal de 2026 já está no valor inicial; antes, quem começava armado subia sozinho todo mandato)
      p.seguranca = faixa('seguranca', p.seguranca + (p.militar - p.inicial.militar) / 20 * f - (e.global.tensao - 60) / 15 * f - mod(p.id, 'vizinhos', .5) * conflitosVizinhos * f
        + (e.aliancas.some(x => x.includes(p.id)) ? .5 : 0));
      const humor = .5 * (p.economia - a.economia) + .5 * (p.bemEstar - a.bemEstar) + .3 * (p.seguranca - a.seguranca);
      const polarizacao = humor < 0 ? mod(p.id, 'polarizacao', 1) : 1; // fraqueza dos EUA: o apoio despenca mais rápido quando as coisas pioram
      p.apoio = faixa('apoio', p.apoio + polarizacao * humor
        + (p.inicial.apoio - p.apoio) * .1); // o apoio volta devagar ao nível de cada país (era 55 para todos)
      p.crisePolitica = p.apoio < 30;
      p.vulnerabilidade = limitar(p.vulnerabilidade + 1, 0, 100); // o risco cresce se nada for feito
      if (p.meta && p.meta.rodada === e.rodada) {
        const cumpriu = p.limpa >= p.meta.limpa;
        aplicarEfeitos(e, cumpriu ? [{ v: 'global.cooperacao', d: 3 }, { v: 'apoio', d: 2 }]
          : [{ v: 'global.cooperacao', d: -3 }, { v: 'apoio', d: -1 }], { potencia: p.id, motivo: cumpriu ? 'cumpriu a meta climática' : 'descumpriu a meta climática' }, rel);
        p.meta = null;
      }
      for (const k of Object.keys(p.imune)) p.imune[k] = Math.max(0, p.imune[k] - 1);
    }

    // 5. territórios: desenvolvimento, estabilidade, conflitos, pressão
    const relConflitos = [];
    for (const t of Object.values(e.territorios)) {
      if (t.protegido) continue;
      const dano = excesso * t.vulnerabilidade / 100 * PARAM.danoClima * f;
      t.desenvolvimento = faixa('desenvolvimento', t.desenvolvimento + (1 - t.conflito - dano * .6) * f + (t.parceiro ? .3 : 0));
      const alvoEst = t.desenvolvimento - 10 * t.conflito - (t.pressao > 40 ? 5 : 0);
      t.estabilidade = faixa('estabilidade', t.estabilidade + (alvoEst - t.estabilidade) * .15 * f - dano * .5);
      // guerra por procuração: duas potências rivais com influência forte num lugar em conflito esquentam o conflito e a rivalidade
      const fortes = pids.filter(q => t.influencia[q] >= PARAM.procuracao.influencia), rivaisAqui = [];
      fortes.forEach((x, i) => fortes.slice(i + 1).forEach(y => { if (relacao(e, x, y) < -20) rivaisAqui.push([x, y]); }));
      const proxy = t.conflito > 0 ? rivaisAqui.length : 0;
      rivaisAqui.filter(() => proxy).forEach(([x, y]) => mudarRel(e, x, y, PARAM.procuracao.relacao * f, `guerra por procuração ${com(t.id, 'em')}`));
      const chanceEscalar = (Math.max(0, (e.global.tensao - 65) / 70) * .6 + Math.max(0, (30 - t.estabilidade) / 100)) * f * (t.conflito > 0 ? 1 + (PARAM.procuracao.escalada - 1) * Math.min(1, proxy / 2) : .3);
      const chanceAcalmar = t.conflito > 0 ? Math.max(0, PARAM.calmaBase + (e.global.cooperacao - 40) / 120 + .15 * t.mediacoes + (t.estabilidade - 40) / 200) * f : 0;
      const nivelAntes = t.conflito;
      if (t.conflito < 3 && sorte(e) < chanceEscalar) t.conflito++;
      else if (t.conflito > 0 && sorte(e) < chanceAcalmar) t.conflito--;
      t.mediacoes = 0;
      if (t.conflito !== nivelAntes) {
        relConflitos.push({ territorio: t.id, antes: nivelAntes, depois: t.conflito });
        if (t.conflito > nivelAntes) Object.keys(t.influencia).forEach(k => (t.influencia[k] = Math.max(0, t.influencia[k] - 1)));
        if (t.conflito > nivelAntes && proxy) e.manchetes.push({ ano: e.ano, texto: `Rivais disputam ${com(t.id)}: ${com(rivaisAqui[0][0])} e ${com(rivaisAqui[0][1])} alimentam o conflito` });
      }
      if (t.conflito >= 3) vizinhosDe(t.id).forEach(id => { const v = e.territorios[id]; if (v && !v.protegido) v.estabilidade = faixa('estabilidade', v.estabilidade - 3 * f); });
      t.pressao = Math.max(0, t.pressao - PARAM.pressaoQueda);
      if (t.pressao >= PARAM.pressaoReacao) {
        const [quem] = Object.entries(t.influencia).sort((a, b) => b[1] - a[1])[0];
        t.influencia[quem] = Math.floor(t.influencia[quem] / 2);
        t.pressao = 20;
        rel.push({ quem: t.id, v: 'soberania', antes: quem, depois: null, motivo: 'reação soberanista' });
        e.manchetes.push({ ano: e.ano, texto: `Protestos pela soberania ${com(t.id, 'em')} reduzem a influência ${com(quem, 'de')}` });
      }
    }
    atualizarParcerias(e, rel);

    // 5b. relações entre as potências: o mundo esquece devagar, alianças e sanções puxam, e quem cresce demais atrai o "equilíbrio" dos outros
    dinamicaBilateral(e, f, diplomacia, rel);

    // 6. dinâmica global
    const g = e.global, conflitos = Object.values(e.territorios).reduce((s, t) => s + t.conflito, 0);
    const dTensao = ((conflitos - PARAM.conflitosNormais) * .3 + (militarMedio - 65) * .08 - (g.cooperacao - 45) * .05 + (PARAM.tensaoEstrutural - g.tensao) * .08
      + (hostilidade(e) - e.hostilidade0) * PARAM.tensaoRelacoes) * f; // potências que se afastam esquentam o mundo
    g.tensao = faixa('tensao', g.tensao + dTensao);
    causas.tensao = Object.values(e.territorios).filter(t => t.conflito >= 2).map(t => ({ quem: t.id, valor: t.conflito }));
    const rotasEmConflito = Object.keys(ROTAS).filter(id => e.territorios[id]?.conflito > 0).reduce((s, id) => s + e.territorios[id].conflito, 0);
    g.comercio = faixa('comercio', g.comercio - rotasEmConflito * 1.5 * f + (60 - g.comercio) * .1);
    g.cooperacao = faixa('cooperacao', g.cooperacao + (45 + (amizade(e) - e.amizade0) * PARAM.coopRelacoes * 4 - g.cooperacao) * .1);
    const petroleo = REGIOES_PETROLEO.reduce((s, id) => s + (e.territorios[id]?.conflito || 0), 0);
    const limpaMedia = Object.values(e.potencias).reduce((s, p) => s + p.limpa, 0) / N, limpaMedia0 = Object.values(antes.potencias).reduce((s, p) => s + p.limpa, 0) / N;
    g.energia = faixa('energia', g.energia + petroleo * PARAM.energiaConflito * f - (limpaMedia - limpaMedia0) * .5 + (50 - g.energia) * .2
      + (e.sancoes.some(s => s.contra === 'russia' && s.ate >= e.rodada) ? 4 : 0));
    const dDesl = (conflitos * .9 + excesso * 3) * f - g.deslocados * PARAM.retornoDeslocados * f;
    g.deslocados = faixa('deslocados', g.deslocados + dDesl);
    causas.deslocados = Object.values(e.territorios).filter(t => t.conflito > 0).sort((a, b) => b.conflito - a.conflito).slice(0, 3).map(t => ({ quem: t.id, valor: t.conflito }));

    // 7. limpezas do mandato
    e.sancoes = e.sancoes.filter(s => s.ate > e.rodada);
    e.acordos = e.acordos.filter(x => x.ate > e.rodada);
    e.desarmaramNaRodada = [];
    e.choques = {};
    // maiores mudanças de relação do mandato (somadas por par)
    const porPar = {};
    for (const x of e.relLog) { const k = chaveRel(x.a, x.b), o = (porPar[k] ||= { a: x.a < x.b ? x.a : x.b, b: x.a < x.b ? x.b : x.a, d: 0, motivos: {} }); o.d += x.d; if (x.motivo) o.motivos[x.motivo] = (o.motivos[x.motivo] || 0) + Math.abs(x.d); }
    diplomacia.relacoes = Object.values(porPar).filter(o => Math.abs(o.d) >= 3).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 6)
      .map(o => ({ a: o.a, b: o.b, antes: r1(relacao(e, o.a, o.b) - o.d), depois: r1(relacao(e, o.a, o.b)), motivo: Object.entries(o.motivos).sort((x, y) => y[1] - x[1])[0]?.[0] || '' }));
    e.relLog = [];

    const depois = snapshot(e);
    const relatorio = { ano: e.ano, proximoAno: Math.round(e.ano + D), antes, depois, causas, mercado, conflitos: relConflitos, mudancas: rel, emissoes: r1(total), diplomacia };
    e.rodada++;
    e.ano = Math.round(PARAM.anoInicial + (e.rodada - 1) * D);
    registrarHistorico(e);
    e.fim = verificarFim(e);
    relatorio.fim = e.fim;
    return relatorio;
  }

  // Incidentes, cooperação espontânea, rompimento de alianças e o "equilíbrio de poder"; as relações voltam devagar ao retrato de 2026
  function dinamicaBilateral(e, f, diplomacia, rel) {
    const ids = Object.keys(e.potencias), P = PARAM, vezes = (v, n) => v[Math.floor(sorte(e) * n)];
    const poder = id => { const p = e.potencias[id]; return p.economia * .5 + p.militar * .35 + p.producao.tecnologia * 3; };
    const media = ids.reduce((s, id) => s + poder(id), 0) / ids.length, lider = ids.slice().sort((x, y) => poder(y) - poder(x))[0];
    const noticia = (tipo, a, b, texto) => { diplomacia.incidentes.push({ tipo, a, b, texto }); e.manchetes.push({ ano: e.ano, texto, potencia: a }); };
    if (poder(lider) > media * P.equilibrioPoder.razao) { // ascensão: os que não são amigos do líder se afastam dele
      const afastam = ids.filter(q => q !== lider && relacao(e, q, lider) < 30 && !aliadas(e, q, lider));
      afastam.forEach(q => mudarRel(e, q, lider, P.equilibrioPoder.relacao * f, `equilíbrio de poder contra ${com(lider)}`, null));
      if (afastam.length >= 3) e.manchetes.push({ ano: e.ano, texto: `Com a ascensão ${com(lider, 'de')}, outras potências buscam se equilibrar e se afastam` });
    }
    ids.forEach((a, i) => ids.slice(i + 1).forEach(b => {
      let r = relacao(e, a, b);
      const base = relBase(a, b), aliada = aliadas(e, a, b);
      r += (base - r) * P.retornoRelacao * f;                    // volta ao retrato de 2026
      if (aliada) r += Math.max(0, 60 - r) * .15 * f;            // aliados se aproximam
      if (sancionados(e, a, b)) r -= 2 * f;                      // sanções azedam
      e.relacoes[chaveRel(a, b)] = limitar(r, -100, 100);
      r = relacao(e, a, b);
      if (aliada && r < 5) { e.aliancas = e.aliancas.filter(x => !(x.includes(a) && x.includes(b))); mudarRel(e, a, b, -5, 'aliança rompida');
        noticia('alianca_rompida', a, b, `A aliança entre ${com(a)} e ${com(b)} se rompe: a confiança acabou`); return; }
      if (!aliada && r <= P.incidente.limite && sorte(e) < (-r - 40) / 60 * P.incidente.chance * f) {
        const comerciais = (COMERCIO[a]?.[b] || 0) + (COMERCIO[b]?.[a] || 0) >= .12;
        if (comerciais) { [a, b].forEach(x => aplicarEfeitos(e, [{ v: 'economia', d: -1.5 * mod(x, 'exposicao', 1) }], { potencia: x, motivo: 'guerra comercial', fator: 1 }, rel));
          aplicarEfeitos(e, [{ v: 'global.comercio', d: -2 }], { motivo: 'guerra comercial' }, rel);
          mudarRel(e, a, b, -4, 'guerra comercial');
          noticia('guerra_comercial', a, b, `${maiuscula(com(a))} e ${com(b)} entram em guerra comercial: tarifas cruzadas encarecem tudo`); }
        else { [a, b].forEach(x => aplicarEfeitos(e, [{ v: 'seguranca', d: -1.5 }], { potencia: x, motivo: 'incidente' }, rel));
          aplicarEfeitos(e, [{ v: 'global.tensao', d: 2 }], { motivo: 'incidente' }, rel);
          mudarRel(e, a, b, -5, 'incidente');
          noticia('incidente', a, b, vezes([`Navios de ${nome(a)} e de ${nome(b)} se encaram em águas disputadas`, `${maiuscula(com(a))} e ${com(b)} trocam acusações de espionagem e expulsam diplomatas`, `Caças ${com(a, 'de')} e ${com(b, 'de')} se aproximam perigosamente num exercício`], 3)); }
      } else if (r >= P.cooperacaoEspontanea.limite && sorte(e) < P.cooperacaoEspontanea.chance * f) {
        [a, b].forEach(x => aplicarEfeitos(e, [{ v: 'economia', d: .8 }], { potencia: x, motivo: 'cooperação' }, rel));
        aplicarEfeitos(e, [{ v: 'global.cooperacao', d: 1 }], { motivo: 'cooperação' }, rel);
        mudarRel(e, a, b, 2, 'cooperação');
        noticia('cooperacao', a, b, `${maiuscula(com(a))} e ${com(b)} fecham parceria em ciência, comércio e defesa`);
      }
    }));
  }

  function registrarHistorico(e) {
    e.historico.push({ ano: e.ano, ...snapshot(e), emissoes: r1(emissoesTotais(e)),
      parceiros: Object.fromEntries(Object.keys(e.potencias).map(id => [id, parceirosDe(e, id).length])) });
  }

  // ============================== FIM, METAS E PLACAR ==============================
  function verificarColapso(e) {
    const g = e.global, c = PARAM.colapso;
    if (g.temperatura >= c.temperatura) return { tipo: 'colapso', causa: 'clima', texto: `A temperatura chegou a +${g.temperatura.toFixed(2).replace('.', ',')} °C: o planeta passou do ponto de não retorno.` };
    if (g.tensao >= c.tensao) return { tipo: 'colapso', causa: 'tensao', texto: 'O Relógio do Juízo Final chegou à meia-noite: as crises saíram do controle e o mundo entrou em colapso.' };
    if (g.deslocados >= c.deslocados) return { tipo: 'colapso', causa: 'humanitaria', texto: `${Math.round(g.deslocados)} milhões de pessoas deslocadas: uma catástrofe humanitária global.` };
    return null;
  }
  function verificarFim(e) {
    const col = verificarColapso(e);
    if (col) return col;
    if (e.rodada > e.config.rodadas) return { tipo: '2050' };
    return null;
  }
  function metas(e) {
    const g = e.global, m = PARAM.metas, neutros = Object.values(e.territorios).filter(t => !t.protegido);
    const devMedio = neutros.reduce((s, t) => s + t.desenvolvimento, 0) / neutros.length;
    return [
      { id: 'clima', nome: 'Clima', icone: '🌡️', texto: `Temperatura abaixo de +${m.temperatura.toFixed(1).replace('.', ',')} °C`, ok: g.temperatura < m.temperatura, valor: r2(g.temperatura) },
      { id: 'paz', nome: 'Paz', icone: '⏰', texto: `Tensão abaixo de ${m.tensao}`, ok: g.tensao < m.tensao, valor: Math.round(g.tensao) },
      { id: 'humanidade', nome: 'Humanidade', icone: '🧳', texto: `Menos de ${m.deslocados} milhões de deslocados`, ok: g.deslocados < m.deslocados, valor: Math.round(g.deslocados) },
      { id: 'desenvolvimento', nome: 'Desenvolvimento', icone: '📈', texto: `Desenvolvimento médio dos territórios ≥ ${m.desenvolvimento}`, ok: devMedio >= m.desenvolvimento, valor: r1(devMedio) },
      { id: 'prosperidade', nome: 'Prosperidade', icone: '💰', texto: 'Nenhuma potência com economia menor que a de 2026', ok: Object.values(e.potencias).every(p => p.economia >= p.inicial.economia), valor: Object.values(e.potencias).filter(p => p.economia >= p.inicial.economia).length },
    ];
  }
  function condicaoOk(e, pid, c) {
    const p = e.potencias[pid];
    switch (c.tipo) {
      case 'parceirosContinente': return parceirosDe(e, pid).filter(t => t.continente === c.continente).length >= c.n;
      case 'parceirosContinentes': return new Set(parceirosDe(e, pid).map(t => t.continente)).size >= c.n;
      case 'indicador': return (c.min === undefined || p[c.v] >= c.min) && (c.max === undefined || p[c.v] <= c.max);
      case 'global': return (c.min === undefined || e.global[c.v] >= c.min) && (c.max === undefined || e.global[c.v] <= c.max);
      case 'contador': return (p.contadores[c.c] || 0) >= c.min;
      case 'estoque': return p.recursos[c.r] >= c.min;
      case 'progresso': return p[c.v] - p.inicial[c.v] >= c.min;
      case 'parceiro': return e.territorios[c.territorio]?.parceiro === pid;
      case 'parceiroUm': return c.territorios.some(id => e.territorios[id]?.parceiro === pid);
      case 'aliancas': return aliadosDe(e, pid).length >= c.n;
      case 'relacoes': return outras(e, pid).filter(q => relacao(e, pid, q) >= c.min).length >= c.n;
      case 'relacoesCom': return c.com.filter(q => q !== pid && relacao(e, pid, q) >= c.min).length >= c.n;
      case 'semHostis': return outras(e, pid).every(q => relacao(e, pid, q) > c.limite);
      default: return false;
    }
  }
  const missaoCumprida = (e, pid) => { const m = MISSOES.find(x => x.id === e.potencias[pid].missao); return !!m && m.condicoes.every(c => condicaoOk(e, pid, c)); };
  function selos(e, pid) {
    const p = e.potencias[pid], out = [];
    if (emissoesDe(p) <= p.emissoesIniciais * .7 || p.limpa >= 70) out.push({ id: 'clima', nome: 'Clima', icone: '🌍' });
    if (p.contadores.mediacoes >= 2) out.push({ id: 'paz', nome: 'Paz', icone: '🕊️' });
    if (p.contadores.solidariedade >= 2) out.push({ id: 'solidariedade', nome: 'Solidariedade', icone: '🤲' });
    if (p.bemEstar - p.inicial.bemEstar >= 8) out.push({ id: 'desenvolvimento', nome: 'Desenvolvimento', icone: '❤️' });
    if (p.contadores.resolucoesApoiadas >= 3) out.push({ id: 'diplomacia', nome: 'Diplomacia', icone: '🏛️' });
    return out;
  }
  const progresso = (v0, v1) => v1 - v0;
  function saudePlaneta(e) {
    const g = e.global;
    if (g.temperatura < 1.8 && g.tensao < 50) return PARAM.igiPlaneta;
    if (g.temperatura >= 2.0 || g.tensao >= 85 || g.deslocados >= 150) return -PARAM.igiPlaneta;
    return 0;
  }
  function igi(e, pid) {
    const p = e.potencias[pid], w = PARAM.pesosIGI, partes = {};
    let total = 100;
    for (const k of INDICADORES) { partes[k] = r1(w[k] * progresso(p.inicial[k], p[k])); total += partes[k]; }
    partes.parceiros = parceirosDe(e, pid).length * PARAM.igiParceiro;
    partes.liderancas = liderancas(e, pid).length * PARAM.igiLideranca;
    partes.missao = missaoCumprida(e, pid) ? PARAM.igiMissao : 0;
    partes.selos = selos(e, pid).length * PARAM.igiSelo;
    partes.planeta = saudePlaneta(e);
    total += partes.parceiros + partes.liderancas + partes.missao + partes.selos + partes.planeta;
    return { total: Math.round(total), partes };
  }
  function placar(e) {
    return Object.keys(e.potencias).map(id => ({ id, ...igi(e, id), humano: e.potencias[id].humano, bloco: e.potencias[id].bloco }))
      .sort((a, b) => b.total - a.total);
  }
  function placarBlocos(e) {
    const blocos = {};
    placar(e).filter(x => x.bloco).forEach(x => (blocos[x.bloco] ||= []).push(x));
    return Object.entries(blocos).map(([b, l]) => ({ bloco: b, total: Math.round(l.reduce((s, x) => s + x.total, 0) / l.length), membros: l.map(x => x.id) }))
      .sort((a, b) => b.total - a.total);
  }
  function resultado(e) {
    const fim = e.fim || verificarFim(e) || { tipo: '2050' };
    const out = { fim, placar: placar(e), metas: metas(e) };
    if (e.config.modo === 'blocos') out.blocos = placarBlocos(e);
    if (e.config.modo === 'cooperativo') {
      const ok = out.metas.filter(m => m.ok).length;
      const infiltrado = Object.values(e.potencias).find(p => p.papel === 'infiltrado' || p.papel === 'exposto');
      const agenda = infiltrado && AGENDAS.find(a => a.id === infiltrado.agenda);
      const agendaCumprida = !!agenda && condicaoOk(e, infiltrado.id, agenda.condicao);
      out.infiltrado = infiltrado ? { potencia: infiltrado.id, agenda: agenda?.id, exposto: infiltrado.papel === 'exposto', agendaCumprida } : null;
      out.vitoria = fim.tipo !== 'colapso' && ok >= 4 && !(agendaCumprida && infiltrado?.papel !== 'exposto');
      out.metasCumpridas = ok;
    } else out.vencedor = fim.tipo === 'colapso' ? null : out.placar[0].id;
    out.contribuicoes = Object.values(e.potencias).map(p => ({ id: p.id, emissoes: r1(p.emissoesAcumuladas), tensao: r1(p.tensaoGerada),
      solidariedade: p.contadores.solidariedade, mediacoes: p.contadores.mediacoes }));
    out.missoes = Object.values(e.potencias).filter(p => p.missao).map(p => ({ potencia: p.id, missao: p.missao, cumprida: missaoCumprida(e, p.id) }));
    out.selos = Object.fromEntries(Object.keys(e.potencias).map(id => [id, selos(e, id)]));
    return out;
  }

  // ============================== INTELIGÊNCIA DAS POTÊNCIAS DO COMPUTADOR ==============================
  // Pesos de prioridade da IA; o perfil muda o "temperamento" de todas (usado nos testes de balanceamento)
  function pesosIA(e, pid) {
    const w = { ...dadoPotencia(pid).ia }, perfil = e.config.perfilIA;
    if (perfil === 'ganancioso') { w.ambiente *= .25; w.cooperacao *= .25; w.economia *= 1.7; w.influencia *= 1.3; }
    if (perfil === 'cooperativo') { w.ambiente *= 1.6; w.cooperacao *= 1.6; w.bemEstar *= 1.2; }
    return w;
  }
  function pesoCaminho(e, pid, v, d, alvo) {
    const w = pesosIA(e, pid), g = e.global, p = e.potencias[pid];
    const crise = { tensao: g.tensao >= 80 ? 1.6 : g.tensao >= 70 ? 1.2 : 1, clima: g.temperatura >= 1.9 ? 1.6 : g.temperatura >= 1.7 ? 1.25 : 1,
      humanit: g.deslocados >= 150 ? 1.5 : 1, coop: e.config.modo === 'cooperativo' ? 1.4 : 1 };
    const [a, b] = v.split('.');
    if (a === 'rel') { // mudar relações: vale mais com quem já é amigo (e machucar amigo custa); com inimigo, ferir quase não pesa
      if (v.split('.').length > 2) return 0;
      if (b === 'todos') return d * .06 * w.cooperacao * 3;
      if (b === 'aliados') return d * .1;
      if (b === 'rivais') return d > 0 ? d * .05 * w.cooperacao : -d * .03 * w.seguranca;
      const x = b === 'alvo' || b === 'local' ? alvo : b, s = e.potencias[x] ? limitar(relacao(e, pid, x) / 50, -1, 1) : 0;
      return d > 0 ? d * .07 * (.5 + .5 * s) * w.cooperacao : d * .07 * (.4 + .6 * s);
    }
    if (INDICADORES.includes(v)) return (w[v] ?? 1) * d * (v === 'apoio' && p.apoio < 40 ? 1.4 : 1) * (v === 'ambiente' ? crise.clima : 1);
    if (v === 'limpa') return w.ambiente * .35 * d * crise.clima * crise.coop;
    if (v === 'cp') return 1.4 * d;                                  // vale o mesmo que o custo de uma ação
    if (a === 'contadores') return .3 * d;                           // ajuda a cumprir missões e selos
    if (v === 'militar') return ((g.tensao > 75 && w.seguranca > 1 ? .15 : -.05) + (e.config.perfilIA === 'ganancioso' ? .12 : 0)) * d;
    if (v === 'desmatamento' || v === 'fossil') return -w.ambiente * 4 * d * crise.clima;
    if (v === 'vulnerabilidade') return -.25 * d * (p.vulnerabilidade / 50) * crise.clima;
    if (a === 'recursos') return .6 * d * valorRecurso(e, pid, b);
    if (a === 'producao') return 1.6 * d * Math.max(.4, (e.config.rodadas - e.rodada + 1) / 4);
    if (a === 'imune') return .4 * d;
    if (v === 'influencia' || b === 'influencia') {
      const t = alvo && e.territorios[alvo];
      let bonus = 1;
      if (t) { const falta = resistencia(t) - t.influencia[pid]; if (falta > 0 && falta <= d + 1) bonus = 2; if (t.parceiro && t.parceiro !== pid) bonus *= 1.2; }
      return w.influencia * d * bonus;
    }
    if (a === 'global') {
      switch (b) {
        case 'tensao': return -d * (.25 * w.seguranca + .3 * (crise.tensao - 1) + .1) * crise.coop;
        case 'temperatura': return -d * 40 * w.ambiente * crise.clima;
        case 'cooperacao': return d * .3 * w.cooperacao * crise.coop;
        case 'comercio': return d * .25 * w.economia;
        case 'deslocados': return -d * .12 * crise.humanit * crise.coop;
        case 'energia': return d * (EXPORTADORES_ENERGIA.includes(pid) ? .2 : -.2);
        case 'transferencia': return d * 8 * crise.clima;
        default: return 0;
      }
    }
    if (a === 'alvo' && e.potencias[alvo]) { // efeito sobre outra potência
      if (b === 'economia') {
        const h = limitar(-relacao(e, pid, alvo) / 60, -1, 1); // hostilidade: 1 = inimiga, −1 = amiga
        const coop = e.config.modo === 'cooperativo' ? -1 : 1;
        return d < 0 ? (h > .15 ? -d * .3 * h : d * .5 * (1 - h)) * coop : d * (.1 + .15 * Math.max(0, -h));
      }
      return d * .05;
    }
    if (a === 'alvo' || ['vizinhos', 'vizinhosCasa', 'territorios', 'emConflito', 'comFloresta', 'vulneraveis', 'escolhidos'].includes(a)) {
      if (b === 'estabilidade' || b === 'desenvolvimento') return d * .12 * crise.coop;
      if (b === 'conflito') return -d * 3 * crise.tensao;
      if (b === 'pressao') return -d * .06;
      if (b === 'vulnerabilidade') return -d * .1;
      if (b === 'floresta') return 0;
    }
    if (a === 'todos') return d * .3;
    return 0;
  }
  // Utilidade de uma lista de efeitos para o perfil da potência (alvo = território/potência de 'alvo.' e 'local.')
  function utilidadeEfeitos(e, pid, efeitos, alvo) {
    const p = e.potencias[pid];
    let u = 0;
    for (const x of efeitos || []) {
      let d = x.d ?? 0, v = x.v;
      if (x.m !== undefined) {
        const base = v === 'desmatamento' ? p.desmatamento : v === 'fossil' ? .3 : v.endsWith('floresta') ? -.1 : 0;
        d = base * (x.m - 1);
      }
      if (v.startsWith('local.')) v = alvo === pid ? v.slice(6) : 'alvo.' + v.slice(6); // nos dilemas, o local é o alvo
      if (v === 'alvo.influencia') v = 'influencia';
      const n = v.startsWith('territorios.') ? 6 : v.startsWith('vulneraveis.') || v.startsWith('escolhidos.') ? 3 : v.startsWith('vizinhosCasa.') ? 3 : 1;
      u += pesoCaminho(e, pid, v, d, alvo) * n * (x.atraso ? .7 : 1) * (x.chance ?? 1) * (x.imune && p.imune?.[x.imune] > 0 ? 0 : 1);
    }
    return u;
  }
  // Sorteia o índice de uma opção: a mais valorizada pelo perfil sai mais, mas as outras também saem
  // (peso = e^(utilidade / variedadeIA)); extra(i) soma um bônus por opção
  function escolherOpcao(e, pid, opcoes, alvo, extra = () => 0) {
    const u = opcoes.map((op, i) => utilidadeEfeitos(e, pid, op.efeitos, alvo) + extra(i)), max = Math.max(...u);
    return sortearPeso(e, u.map((x, i) => ({ item: i, peso: Math.exp((x - max) / PARAM.variedadeIA) })));
  }
  function utilidadeCarta(e, pid, cid, alvo) {
    const c = carta(cid), custo = custoDe(e, pid, cid), p = e.potencias[pid];
    if (c.especial === 'votacao' || c.especial === 'meta_ndc' || c.especial === 'alianca') return -Infinity; // a IA usa a ONU por outros caminhos
    let u;
    if (c.especial === 'mediacao') { // vale pela chance de dar certo
      const ch = alvo ? chanceMediacao(e, pid, alvo).chance : .3;
      u = ch * utilidadeEfeitos(e, pid, c.seSucesso, alvo) + (1 - ch) * utilidadeEfeitos(e, pid, c.seFracasso, alvo);
    } else if (c.especial === 'espionagem') u = .5 * utilidadeEfeitos(e, pid, c.seSucesso, alvo) + .5 * utilidadeEfeitos(e, pid, c.seFracasso, alvo);
    else u = utilidadeEfeitos(e, pid, c.efeitos, alvo);
    u += utilidadeEfeitos(e, pid, c.extra?.[pid], alvo);
    if (c.diplomacia?.alvo && e.potencias[alvo]) { // relação: ataque vale contra quem já é hostil e pesa contra amigo; gesto amistoso vale mais com quem já gosta de você
      const r = relacao(e, pid, alvo), h = limitar(-r / 60, -1, 1), dl = c.diplomacia.alvo, w = pesosIA(e, pid);
      u += dl < 0 ? -dl * (.07 * h * (.6 + .4 * w.seguranca) + PARAM.iaRivalidade * Math.max(0, h - .2) * w.seguranca) : dl * .07 * (.5 + .5 * limitar(r / 60, -1, 1)) * (.6 + .4 * w.cooperacao);
      if (c.especial === 'bilateral') u *= limitar((r - (c.diplomacia.aceitaSe ?? 0)) / 40 + .5, .05, .95); // só vale se o outro lado aceitar
    }
    if (c.especial === 'defesa') { const ameaca = Object.values(e.potencias).some(o => o.id !== pid && o.armouNaRodada >= e.rodada - 1 && rivaisDe(e, pid).includes(o.id)); if (ameaca) u += 3; }
    if (c.especial === 'acolher' && e.global.deslocados > 130) u += 1;
    u -= (custo.cp || 0) * 1.4 + (custo.economia || 0) * pesosIA(e, pid).economia * 1.3;
    for (const r of RECURSOS) if (custo[r]) u -= custo[r] * valorRecurso(e, pid, r) * .6;
    return u;
  }
  function melhorAlvo(e, pid, cid) {
    const c = carta(cid);
    if (c.alvo === 'nenhum') return { alvo: null, u: utilidadeCarta(e, pid, cid, null) };
    if (c.alvo === 'potencia') {
      const hostilC = (c.diplomacia?.alvo || 0) < 0;
      if (e.config.modo === 'cooperativo' && hostilC) return { alvo: null, u: -Infinity };
      if (hostilC && e.global.tensao > 82) return { alvo: null, u: -Infinity };
      let melhor = { alvo: null, u: -Infinity };
      for (const id of outras(e, pid)) { // o alvo vem da relação: ataques para quem já é hostil, gestos para quem é próximo
        const u = utilidadeCarta(e, pid, cid, id) - (hostilC ? 1.5 : 0) + (sorte(e) - .5) * .4;
        if (u > melhor.u) melhor = { alvo: id, u };
      }
      return melhor;
    }
    if (c.alvo === 'territorios3') {
      const cand = alvosValidos(e, pid, cid).map(id => e.territorios[id]).sort((a, b) => (resistencia(a) - a.influencia[pid]) - (resistencia(b) - b.influencia[pid])).slice(0, 3).map(t => t.id);
      return { alvo: cand, u: utilidadeCarta(e, pid, cid, cand[0]) };
    }
    if (c.especial === 'minerais') {
      const lista = alvosValidos(e, pid, cid);
      const alvo = lista.find(id => e.territorios[id].influencia[pid] > 0) || pid;
      return { alvo, u: utilidadeCarta(e, pid, cid, alvo) };
    }
    let melhor = { alvo: null, u: -Infinity };
    for (const id of alvosValidos(e, pid, cid)) {
      const t = e.territorios[id];
      let u = utilidadeCarta(e, pid, cid, id);
      u += (t.influencia[pid] > 0 ? .6 : 0) + (vizinhosDe(pid).includes(id) ? .5 : 0) + RECURSOS.reduce((s, r) => s + (t.recursos[r] || 0) * .15, 0);
      if (t.parceiro === pid && t.influencia[pid] - (Object.values(t.influencia).sort((a, b) => b - a)[1] || 0) > 3) u -= 2; // já está garantido
      u += (sorte(e) - .5) * .4;
      if (u > melhor.u) melhor = { alvo: id, u };
    }
    return melhor;
  }
  /* A potência do computador joga a vez inteira. Devolve as jogadas para a interface animar:
     [{ tipo: 'dilema', id, opcao, resultado } | { tipo: 'carta', carta, alvo, resultado }] */
  function iaJogarVez(e, pid) {
    const jogadas = [], p = e.potencias[pid];
    iniciarVez(e, pid);
    const d = dilemaDaVez(e, pid);
    if (d) {
      const opcao = iaDilema(e, pid, d);
      jogadas.push({ tipo: 'dilema', id: d.id, opcao, resultado: resolverDilema(e, pid, d.id, opcao) });
    }
    for (let i = 0; i < 5 && p.cp > 0; i++) {
      const opcoes = [...new Set([...p.mao, ...ACOES_FIXAS])]
        .filter(cid => !p.jogadasNaVez.includes(cid))
        .map(cid => ({ cid, ...melhorAlvo(e, pid, cid) }))
        .filter(o => o.u > -Infinity && podeJogar(e, pid, o.cid, o.alvo).ok)
        .map(o => ({ ...o, u: o.u * (1 + (sorte(e) - .5) * .25) }))
        .sort((a, b) => b.u - a.u);
      const escolha = opcoes[0];
      if (!escolha || escolha.u < .2) break;
      const resultado = jogarCarta(e, pid, escolha.cid, escolha.alvo);
      if (!resultado.ok) break;
      jogadas.push({ tipo: 'carta', carta: escolha.cid, alvo: escolha.alvo, resultado });
    }
    encerrarVez(e, pid);
    return jogadas;
  }
  // Uma resolução que a IA proporia (para eventos que convocam a ONU)
  function iaProposta(e, pid) {
    const quentes = Object.values(e.territorios).filter(t => t.conflito >= 2 && t.parceiro !== pid);
    if (quentes.length && e.global.tensao > 70) return { id: 'missao_paz', alvo: quentes[0].id, proponente: pid };
    if (e.global.temperatura > 1.75) return { id: 'acordo_climatico', alvo: null, proponente: pid };
    if (e.global.deslocados > 135) return { id: 'fundo_humanitario', alvo: null, proponente: pid };
    return { id: 'tratado_desarmamento', alvo: null, proponente: pid };
  }

  // ============================== MANCHETES ==============================
  const dadoLugar = id => [...POTENCIAS, ...TERRITORIOS].find(x => x.id === id);
  function nome(id) { return dadoLugar(id)?.nome || id; }
  // Nome com artigo e preposição: com('sahel', 'em') → "no Sahel"; com('eua', 'de') → "dos Estados Unidos"; com('taiwan', 'em') → "em Taiwan"
  const CONTRACOES = { '': { o: 'o', a: 'a', os: 'os', as: 'as' }, em: { o: 'no', a: 'na', os: 'nos', as: 'nas' },
    de: { o: 'do', a: 'da', os: 'dos', as: 'das' }, a: { o: 'ao', a: 'à', os: 'aos', as: 'às' } };
  function com(id, prep = '') {
    const d = dadoLugar(id);
    if (!d) return id;
    const art = d.artigo ? CONTRACOES[prep][d.artigo] : prep;
    return art ? `${art} ${d.nome}` : d.nome;
  }
  const plural = id => /s$/.test(dadoLugar(id)?.artigo || '');
  const maiuscula = t => t.charAt(0).toUpperCase() + t.slice(1);
  /* Preenche textos de dilemas e decisões: {quem}/{local} = nome; {o quem}, {em local}, {de quem}, {a local} = com artigo
     ({O quem}, {Em local}… começam com maiúscula); {instala|instalam} = verbo que concorda com quem decide */
  function preencher(t, pid, local) {
    if (!t) return t;
    return t.replace(/\{(?:(o|O|em|Em|de|De|a|A) )?(quem|local)\}/g, (_, prep, q) => {
      const id = q === 'quem' ? pid : local;
      if (!id) return '';
      const s = prep ? com(id, prep.toLowerCase() === 'o' ? '' : prep.toLowerCase()) : nome(id);
      return prep && prep[0] !== prep[0].toLowerCase() ? maiuscula(s) : s;
    }).replace(/\{([^{}|]+)\|([^{}|]+)\}/g, (_, sing, plur) => (plural(pid) ? plur : sing));
  }
  function manchete(e, pid, c, alvo, res) {
    const onde = Array.isArray(alvo) ? alvo.map(nome).join(', ') : alvo ? nome(alvo) : '';
    if (c.especial === 'mediacao') return preencher(res.sucesso ? '{quem} {media|mediam} negociações, e o conflito perde força {em local}' : 'Mediação {de quem} {em local} não avança', pid, alvo);
    if (c.especial === 'alianca') return res.aceita ? `${nome(pid)} e ${onde} anunciam aliança estratégica`
      : `${maiuscula(com(alvo))} ${plural(alvo) ? 'recusam' : 'recusa'} a aliança proposta ${com(pid, 'de')}`;
    if (c.especial === 'votacao') return preencher('{quem} {leva|levam} uma proposta à ONU', pid);
    return `${nome(pid)}: ${c.nome.toLowerCase()}${onde ? ' — ' + onde : ''}`;
  }

  return {
    PARAM, INDICADORES, RECURSOS, TEMAS, ROTAS, SELETORES,
    criarEstado, ordemDaRodada, iniciarVez, trocarMao,
    dilemaDaVez, resolverDilema, iaDilema,
    custoDe, podeJogar, alvosValidos, jogarCarta, chanceMediacao, encerrarVez, negociar, iaAceitaTroca, iaAceitaAlianca,
    sortearEventos, aplicarEvento, resolverDoacao, resolverDecisao, iaDecisao, iaDoacao,
    resolucoesDisponiveis, votacao, iaVoto, iaProposta, votoTerritorio, preencher, com,
    copNestaRodada, resolverCop, iaCop, reuniaoEmergencia,
    aplicarEfeitos, relacao, rotuloRelacao, relacoesDe, metaCop,
    balanco, verificarFim, metas, placar, placarBlocos, resultado, igi, selos, missaoCumprida,
    iaJogarVez, utilidadeCarta, melhorAlvo, emissoesDe, emissoesTotais, parceirosDe, liderancas, resistencia, nome, copia,
  };
})();
if (typeof module === 'object') module.exports = Simulacao;
