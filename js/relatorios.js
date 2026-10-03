'use strict';
/* Geografia Irada — Relatórios: balanço do mandato, fim da partida e gráficos (guia de arte §4.7, §4.8, §5.14, §5.15).

   Relatorios.balanco(e, rel) → Promise (rel = Simulacao.balanco(e), já aplicado)
     faixa "BALANÇO" → sobrevoo do que mais mudou (Mapa3D.atualizarMundo + focar, legenda embaixo, sem véu) → painel em 5 passos:
     Mundo (antes → depois e o porquê de cada indicador) · Clima (termômetro e emissões contadas de 3 jeitos) · Nações
     (indicadores, parceiros e mercado) · Jornal (manchetes, conflitos, Metas 2050) · Conversa (pergunta para a turma).
     Passa com clique, Espaço, → ou PageDown; ← volta; "Pular balanço" (data-teste pular); avançar = data-teste continuar-painel.
   Relatorios.fim(e, avatares) → Promise<'revanche' | 'novo' | 'inicio'>
     faixa "2050" (ou COLAPSO) → bonecos em fila (Cenas3D.fim) → pódio 3D (competitivo e blocos) → relatório em abas:
     Resultado · O mundo em 2050 · Quem fez o quê · BNCC · Para debater · Foto da cúpula (Cenas3D.foto → PNG).
   Relatorios.linha(series, opcoes) e Relatorios.barras(colunas, opcoes) → HTML de um <figure>: SVG role="img" com título e
     descrição, legenda visível e tabela alternativa para leitor de tela (barras = pilhas de tijolos do kit de arte).
   Causas do balanço: o que as decisões do mandato declararam mexer (ações, dilemas, eventos, COP, ONU), o que chegou atrasado
   (rel.mudancas) e a reação do mundo no balanço; a diferença que sobra aparece como "outras decisões", e a soma bate. */

const Relatorios = (() => {
  const ORDEM_IND = ['comercio', 'cooperacao', 'temperatura', 'tensao', 'deslocados', 'energia'];
  const IND = {
    comercio: { nome: 'Comércio', icone: '🚢', sobeBom: true, escala: 3 },
    cooperacao: { nome: 'Cooperação', icone: '🕊️', sobeBom: true, escala: 3 },
    temperatura: { nome: 'Temperatura', icone: '🌡️', sobeBom: false, escala: .05 },
    tensao: { nome: 'Relógio do Juízo Final', icone: '⏰', sobeBom: false, escala: 3 },
    deslocados: { nome: 'Deslocados', icone: '🧳', sobeBom: false, escala: 5 },
    energia: { nome: 'Preço da energia', icone: '🛢️', sobeBom: false, escala: 4 },
  };
  const IND_P = [['economia', '💰', 'Economia'], ['bemEstar', '❤️', 'Bem-estar'], ['ambiente', '🌳', 'Ambiente'], ['seguranca', '🛡️', 'Segurança'], ['apoio', '🗳️', 'Apoio']];
  const RECURSO = { alimentos: ['🌾', 'alimentos'], energia: ['⚡', 'energia'], minerais: ['💎', 'minerais'], tecnologia: ['💻', 'tecnologia'] };

  // ---------- pequenos ajudantes ----------
  const ico = (e, px = 40) => (typeof urlIcone === 'function' && urlIcone(e) ? imgIcone(e, px) : '');   // nunca cai no emoji do sistema
  const kit = (nome, o) => (typeof arte === 'function' ? arte(nome, o) : '');
  const som = (nome, o) => { try { if (typeof Som !== 'undefined') Som.efeito(nome, o); } catch { /* sem som */ } };
  const nomeLugar = id => (typeof Simulacao !== 'undefined' ? Simulacao.nome(id) : id);
  const com = (id, prep) => (typeof Simulacao !== 'undefined' && Simulacao.com ? Simulacao.com(id, prep) : `${prep} ${nomeLugar(id)}`);
  const quem = (e, pid) => (e.potencias[pid]?.humano ? nomeEquipe(pid) : 'Computador');
  const segundos = t => Math.max(0, Math.round((100 - t) * 3));
  const u = () => uPx();
  let seq = 0;
  const novoId = p => `${p}-${++seq}`;
  const achar = (lista, id) => (typeof lista !== 'undefined' && Array.isArray(lista) ? lista.find(x => x.id === id) : null);
  const politica = id => (typeof POLITICAS !== 'undefined' ? POLITICAS.find(x => x.id === id) : null);
  const eventoDe = id => (typeof EVENTOS !== 'undefined' ? EVENTOS.find(x => x.id === id) : null);
  const dilemaDe = id => (typeof DILEMAS !== 'undefined' ? DILEMAS.find(x => x.id === id) : null);
  const preencher = (t, pid, local) => (typeof Simulacao !== 'undefined' && Simulacao.preencher ? Simulacao.preencher(t, pid, local) : t);
  const maiusc = t => t.charAt(0).toUpperCase() + t.slice(1);
  const comIcones = t => esc(t).replace(/\p{Extended_Pictographic}\uFE0F?/gu, m => ico(m, 32));   // emoji do conteúdo vira ícone (ou some)

  // Valor e variação de um indicador global como a turma lê no HUD (tensão = segundos do Relógio)
  function valor(k, v) {
    if (k === 'temperatura') return fmtGraus(v);
    if (k === 'tensao') return segundos(v) + FINO + 's';
    if (k === 'deslocados') return fmtMilhoes(Math.round(v), true);
    return fmt(Math.round(v));
  }
  function variacao(k, d, curto = false) {
    if (k === 'temperatura') return sinal(d, 2) + (curto ? '' : FINO + '°C');
    if (k === 'tensao') return sinal(Math.round(-3 * d)) + FINO + 's';
    if (k === 'deslocados') return sinal(Math.round(d)) + FINO + 'mi';
    return sinal(Math.round(d));
  }
  const pequeno = (k, d) => Math.abs(d) < (k === 'temperatura' ? .005 : k === 'tensao' ? .17 : .5);
  const bomSe = (k, d) => (pequeno(k, d) ? 0 : (d > 0) === IND[k].sobeBom ? 1 : -1);
  // Faixa (bom ✓, médio !, risco !!, crítico ✕) e a palavra do estado; iminente = a 10% do limiar de colapso
  function estado(k, v) {
    const c = Simulacao.PARAM.colapso;
    switch (k) {
      case 'temperatura': return { nivel: v < 1.5 ? 'bom' : v < 2 ? 'risco' : 'critico', palavra: v < 1.5 ? 'Meta de Paris' : v < 2 ? 'Risco' : v < c.temperatura ? 'Perigo' : 'Colapso', iminente: v >= c.temperatura * .9 };
      case 'tensao': return { nivel: v < 50 ? 'bom' : v < 80 ? 'medio' : v < 90 ? 'risco' : 'critico', palavra: v < 50 ? 'Calmo' : v < 80 ? 'Alerta' : v < 100 ? 'Crise' : 'Meia-noite', iminente: v >= c.tensao * .9 };
      case 'deslocados': return { nivel: v < 100 ? 'bom' : v < 150 ? 'medio' : v < c.deslocados * .9 ? 'risco' : 'critico', palavra: v < 100 ? 'Estável' : v < 150 ? 'Em alta' : v < c.deslocados ? 'Emergência' : 'Catástrofe', iminente: v >= c.deslocados * .9 };
      case 'comercio': return { nivel: v < 40 ? 'risco' : v <= 75 ? 'bom' : 'medio', palavra: v < 40 ? 'Fragmentado' : v <= 75 ? 'Normal' : 'Globalização acelerada' };
      case 'cooperacao': return { nivel: v < 30 ? 'risco' : v <= 70 ? 'medio' : 'bom', palavra: v < 30 ? 'Cada um por si' : v <= 70 ? 'Normal' : 'Multilateralismo forte' };
      default: return { nivel: v > 70 ? 'risco' : 'bom', palavra: v < 35 ? 'Energia barata' : v <= 70 ? 'Normal' : 'Crise do petróleo' };
    }
  }
  const SIMBOLO = { bom: () => GLIFOS.ok, medio: () => '!', risco: () => '!!', critico: () => GLIFOS.nao };
  const seloNivel = (nivel, classe = '') => `<span class="selo ${classe}" data-nivel="${nivel}" aria-hidden="true">${SIMBOLO[nivel]()}</span>`;
  const iminentes = g => ['temperatura', 'tensao', 'deslocados'].filter(k => estado(k, g[k]).iminente);
  function textoAlerta(g) {
    const c = Simulacao.PARAM.colapso, t = iminentes(g).map(k => k === 'temperatura'
      ? `a temperatura está a ${fmtGraus(Math.max(0, c.temperatura - g.temperatura))} do ponto de não retorno`
      : k === 'tensao' ? `o Relógio está a ${segundos(g.tensao)}${FINO}s da meia-noite`
        : `faltam ${fmtMilhoes(Math.max(0, Math.round(c.deslocados - g.deslocados)))} de deslocados para a catástrofe`);
    return t.length ? `Colapso perto: ${listaNomes(t)}.` : '';
  }

  // ============================== CAUSAS (o porquê de cada indicador global) ==============================
  // O que uma manchete do mandato declarou mexer nos indicadores globais: { rotulo, efeitos }
  function fonteDe(e, m) {
    if (m.carta) {
      const c = politica(m.carta);
      return c && { rotulo: `${c.nome} (${nomeCurto(m.potencia)})`, efeitos: [...(c.efeitos || []), ...(c.extra?.[m.potencia] || [])] };
    }
    if (m.dilema) {
      const op = dilemaDe(m.dilema)?.opcoes[m.opcao];
      return op && { rotulo: `${op.resumo} (${nomeCurto(m.potencia)})`, efeitos: op.efeitos };
    }
    if (m.evento) {
      const ev = eventoDe(m.evento);
      if (!ev) return null;
      if (m.texto === (ev.manchete || ev.titulo)) return { rotulo: ev.titulo, efeitos: ev.efeitos };
      const col = ev.escolha?.coletivo;
      if (col && m.texto === col.manchete) return { rotulo: col.motivo || ev.titulo, efeitos: col.efeitos };
      if (col && m.texto === col.mancheteSenao) return { rotulo: col.motivoSenao || ev.titulo, efeitos: col.senao };
      for (const op of ev.escolha?.opcoes || []) for (const pid of PIDS)
        if (preencher(op.manchete || '', pid, e.locaisEventos?.[m.evento]) === m.texto) return { rotulo: `${op.resumo} (${nomeCurto(pid)})`, efeitos: op.efeitos };
      return null;
    }
    // ponytail: COP e ONU repetem os números do motor; se o motor mudar, a diferença cai em "outras decisões" e a soma continua certa
    if (m.texto === 'Cúpula do Clima termina com acordo histórico') return { rotulo: 'Acordo na Cúpula do Clima', efeitos: [{ v: 'global.cooperacao', d: 6 }, { v: 'global.deslocados', d: -4 }, { v: 'global.tensao', d: -2 }] };
    if (m.texto === 'Cúpula do Clima termina sem acordo') return { rotulo: 'Cúpula do Clima sem acordo', efeitos: [{ v: 'global.cooperacao', d: -3 }, { v: 'global.tensao', d: 1 }] };
    const onu = /^ONU (aprova|rejeita): (.+?)( \(veto\))?$/.exec(m.texto || '');
    if (onu) {
      const r = typeof RESOLUCOES !== 'undefined' ? RESOLUCOES.find(x => x.nome === onu[2]) : null;
      return onu[1] === 'aprova' ? r && { rotulo: `ONU aprova: ${r.nome}`, efeitos: r.efeitos } : { rotulo: `ONU rejeita: ${onu[2]}`, efeitos: [{ v: 'global.cooperacao', d: -1 }] };
    }
    return null;
  }
  // Frase da reação do mundo no balanço, por indicador
  function reacao(e, rel, k, d) {
    const nomes = l => listaNomes(l.slice(0, 2).map(x => nomeLugar(x.quem)));
    if (k === 'temperatura') return `Emissões: ${fmt(rel.emissoes)} Gt de CO₂ por ano`;
    if (k === 'tensao') return d > 0 && rel.causas?.tensao?.length ? `Conflitos: ${nomes(rel.causas.tensao)}` : d > 0 ? 'Armas e desconfiança' : 'A tensão esfria aos poucos';
    if (k === 'deslocados') return d > 0 && rel.causas?.deslocados?.length ? `Fogem de: ${nomes(rel.causas.deslocados)}` : 'Parte das pessoas volta para casa';
    if (k === 'comercio') return d < 0 ? 'Conflitos nas rotas de navios' : 'O comércio volta ao normal';
    if (k === 'cooperacao') return d < 0 ? 'Sem acordos, a cooperação esfria' : 'A cooperação volta ao normal';
    return d > 0 ? 'Conflitos encarecem a energia' : 'Energia limpa baixa o preço';
  }
  /* Causas da mudança de cada indicador no mandato: { k: { antes, depois, causas: [{ texto, valor }] } }, valor na unidade
     do motor (tensão em pontos). A soma das causas = depois − antes. */
  function causas(e, rel) {
    const inicio = e.historico?.length >= 2 ? e.historico[e.historico.length - 2].global : rel.antes.global;
    const doMandato = (e.manchetes || []).filter(m => m.ano === rel.ano);
    const out = {};
    for (const k of ORDEM_IND) {
      const linhas = new Map(), somar = (t, v) => linhas.set(t, (linhas.get(t) || 0) + v);
      let declarado = 0;
      for (const m of doMandato) {
        const f = fonteDe(e, m);
        if (!f) continue;
        for (const ef of f.efeitos || []) {
          if (ef.v !== 'global.' + k || ef.atraso || ef.chance !== undefined || ef.d === undefined) continue;
          const d = ef.d * (ef.escala === 'clima' ? .6 + Math.max(0, inicio.temperatura - 1.4) : 1);
          somar(f.rotulo, d); declarado += d;
        }
      }
      const decisoes = rel.antes.global[k] - inicio[k];
      if (!pequeno(k, decisoes - declarado)) somar('Outras decisões e eventos', decisoes - declarado);
      let balanco = rel.depois.global[k] - rel.antes.global[k];
      for (const x of (rel.mudancas || []).filter(x => x.quem === 'global' && x.v === k)) {
        const d = x.depois - x.antes;
        somar(maiusc(x.motivo || 'Efeito que demorou'), d); balanco -= d;
      }
      if (!pequeno(k, balanco)) somar(reacao(e, rel, k, balanco), balanco);
      const liquido = rel.depois.global[k] - inicio[k];
      out[k] = { antes: inicio[k], depois: rel.depois.global[k],
        // primeiro o que empurrou para o lado em que o indicador andou; depois o que puxou contra
        causas: [...linhas].map(([texto, valor]) => ({ texto, valor })).filter(c => !pequeno(k, c.valor))
          .sort((a, b) => (b.valor * liquido > 0) - (a.valor * liquido > 0) || Math.abs(b.valor) - Math.abs(a.valor)) };
    }
    return out;
  }

  // ============================== GRÁFICOS ==============================
  const FMT_A = (v, casas) => fmt(v, casas);
  // Tabela alternativa (leitor de tela, ou visível com tabela: true)
  function tabela(titulo, cab, linhas, visivel) {
    return `<table class="rel-tabela${visivel ? '' : ' so-leitor'}"><caption>${esc(titulo)}</caption><thead><tr>${cab.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>` +
      `<tbody>${linhas.map(l => `<tr>${l.map((c, i) => (i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join('')}</tr>`).join('')}</tbody></table>`;
  }
  /* Linhas com pinos. series: [{ id, nome, pontos: [n…], cor?, icone? }] (id de potência = cor e forma da equipe);
     opcoes: { anos, min, max, casas, unidade, formatar(v), titulo, descricao, limiares: [{ valor, rotulo, nivel }], tabela } */
  // Legenda em HTML para gráficos com muitas potências (13): forma + cor + nome (+ valor), nunca só a cor
  const legendaPotencias = (itens, f = v => v) => `<ul class="rel-leg" aria-hidden="true">${itens.map(i => `<li data-equipe="${esc(i.pid)}">${formaDe(i.pid)}<b>${esc(i.nome ?? nomeCurto(i.pid))}</b>${i.valor !== undefined ? `<span class="num">${esc(f(i.valor))}</span>` : ''}</li>`).join('')}</ul>`;
  function linha(series, { anos = [], min, max, casas = 0, unidade = '', formatar, titulo = 'Gráfico', descricao = '', limiares = [], tabela: visivel = false, largura = 1000, altura = 420 } = {}) {
    const f = formatar || (v => FMT_A(v, casas) + unidade);
    const todos = series.flatMap(s => s.pontos).concat(limiares.map(l => l.valor));
    // eixo com valores redondos (passo 1, 2, 2,5 ou 5 × 10ⁿ) cobrindo os dados
    const lo0 = min ?? Math.min(...todos), hi0 = max ?? Math.max(...todos), n = Math.max(1, ...series.map(s => s.pontos.length));
    const bruto = (hi0 - lo0) / 4 || 1, pot = 10 ** Math.floor(Math.log10(bruto)), m = bruto / pot;
    const passo = pot * (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10);
    const lo = Math.floor(lo0 / passo + 1e-9) * passo, hi = Math.ceil(hi0 / passo - 1e-9) * passo, marcas = Math.round((hi - lo) / passo);
    const E = 112, D = 150, C = 30, B = 58, w = largura - E - D, h = altura - C - B, T = '#1A1433';
    const X = i => E + (n < 2 ? w / 2 : (i / (n - 1)) * w), Y = v => C + h - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo || 1)) * h;
    const r1 = v => Math.round(v * 10) / 10, idT = novoId('gt'), idD = novoId('gd');
    let s = `<svg class="rel-svg linhas" viewBox="0 0 ${largura} ${altura}" role="img" aria-labelledby="${idT} ${idD}"><title id="${idT}">${esc(titulo)}</title>` +
      `<desc id="${idD}">${esc(descricao || series.map(sr => `${sr.nome}: de ${f(sr.pontos[0])} em ${anos[0] ?? ''} para ${f(sr.pontos.at(-1))} em ${anos[sr.pontos.length - 1] ?? ''}`).join('; '))}</desc>`;
    s += `<rect x="${E}" y="${C}" width="${w}" height="${h}" rx="14" fill="#F3EAD6"/>`;
    for (let k = 0; k <= marcas; k++) {
      const v = Math.round((lo + passo * k) * 1e6) / 1e6, y = r1(Y(v));
      s += `<path d="M${E} ${y}H${E + w}" stroke="${T}" stroke-opacity=".14" stroke-width="2.5" stroke-dasharray="8 8"/>` +
        `<text class="eixo" x="${E - 14}" y="${r1(y + 9)}" text-anchor="end">${esc(f(v))}</text>`;
    }
    anos.forEach((a, i) => { if (i < n) s += `<text class="eixo" x="${r1(X(i))}" y="${altura - 14}" text-anchor="middle">${esc(a)}</text>`; });
    // limiares: régua tracejada na cor da faixa + bandeirinha com o rótulo (cor + palavra)
    const COR = { bom: '#2FCB62', medio: '#FFC21A', risco: '#FF8A1F', critico: '#F0303A' };
    for (const l of limiares) {
      if (l.valor < lo || l.valor > hi) continue;
      const y = r1(Y(l.valor)), c = COR[l.nivel] || '#4A4570', tw = l.rotulo.length * 12.4 + 30;
      s += `<path d="M${E} ${y}H${E + w + 10}" stroke="${T}" stroke-width="7" stroke-linecap="round" stroke-opacity=".75"/><path d="M${E} ${y}H${E + w + 10}" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="14 9"/>` +
        `<g transform="translate(${E + w + 12} ${y})"><path d="M0 -16h${r1(tw)}l-9 16 9 16H0Z" fill="${c}" stroke="${T}" stroke-width="3.4" stroke-linejoin="round"/>` +
        `<text class="limiar" x="10" y="8" fill="${T}">${esc(l.rotulo)}</text></g>`;
    }
    // etiquetas do valor final: empilhadas sem se cobrir (42 de distância), dentro da área do gráfico
    // com muitas séries (13 potências) só as 3 mais altas e as 2 mais baixas ganham etiqueta de valor; a legenda em HTML lista todas
    const muitas = series.length > 6 && series.every(sr => CORES_GUIA[sr.id]?.forma), final = sr => sr.pontos.at(-1);
    const ordemFinal = [...series.keys()].sort((a, b) => final(series[b]) - final(series[a])), mostra = new Set(muitas ? [...ordemFinal.slice(0, 3), ...ordemFinal.slice(-2)] : ordemFinal);
    const etq = series.map((sr, i) => ({ i, y: Y(sr.pontos.at(-1)) - 19 })).filter(q => mostra.has(q.i)).sort((a, b) => a.y - b.y);
    etq.forEach((q, j) => { q.y = Math.max(C + 4, j ? Math.max(q.y, etq[j - 1].y + 42) : q.y); });
    const passou = (etq.at(-1)?.y ?? 0) - (C + h - 40);
    if (passou > 0) etq.forEach(q => (q.y -= passou));
    const yEtq = Object.fromEntries(etq.map(q => [q.i, r1(q.y)]));
    let pontas = '', rotulos = '';   // pontas e etiquetas por cima de todas as linhas
    for (const [si, sr] of series.entries()) {
      const [face, lado] = Arte.corPeca(sr.cor ?? sr.id), pts = sr.pontos.map((v, i) => `${r1(X(i))},${r1(Y(v))}`).join(' ');
      s += `<g class="serie" data-id="${esc(sr.id)}"><polyline class="traco" points="${pts}" fill="none" stroke="${T}" stroke-width="15" stroke-linejoin="round" stroke-linecap="round"/>` +
        `<polyline class="traco" points="${pts}" fill="none" stroke="${face}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>`;
      sr.pontos.forEach((v, i) => {
        if (i === sr.pontos.length - 1) return;
        const x = r1(X(i)), y = r1(Y(v));
        s += `<g class="pino"><circle cx="${x}" cy="${y + 2}" r="9" fill="${lado}" stroke="${T}" stroke-width="3.2"/><circle cx="${x}" cy="${y}" r="9" fill="${face}" stroke="${T}" stroke-width="3.2"/><circle cx="${x - 2.6}" cy="${y - 2.8}" r="2.6" fill="#fff" fill-opacity=".85"/></g>`;
      });
      const u0 = sr.pontos.length - 1, xu = X(u0), yu = Y(sr.pontos[u0]);
      s += '</g>';
      if (CORES_GUIA[sr.id]?.forma) pontas += `<g class="ponta">${Arte.formaSVG(sr.id, xu, yu, 34)}</g>`;
      else {
        const url = sr.icone && typeof urlIcone === 'function' ? urlIcone(sr.icone) : '';
        pontas += `<g class="ponta"><circle cx="${r1(xu)}" cy="${r1(yu + 3)}" r="22" fill="${lado}" stroke="${T}" stroke-width="3.6"/><circle cx="${r1(xu)}" cy="${r1(yu)}" r="22" fill="#FFF9EC" stroke="${T}" stroke-width="3.6"/>` +
          (url ? `<image href="${url}" x="${r1(xu - 15)}" y="${r1(yu - 16)}" width="30" height="30"/>` : '') + '</g>';
      }
      const tx = f(sr.pontos[u0]), tw = tx.length * 15 + 30, ty = yEtq[si];
      if (ty !== undefined) rotulos += `<g class="etiqueta" transform="translate(${r1(xu - tw - 30)} ${ty})"><rect width="${tw}" height="38" rx="10" fill="#fff" stroke="${T}" stroke-width="3.4"/>` +
        `<rect x="5" y="7" width="7" height="24" rx="3.5" fill="${face}" stroke="${T}" stroke-width="2"/><text x="${r1(tw / 2 + 4)}" y="28" text-anchor="middle">${esc(tx)}</text></g>`;
    }
    s += pontas + rotulos + '</svg>';
    const tab = tabela(titulo, ['Ano', ...series.map(sr => sr.nome)], (anos.length ? anos : series[0].pontos.map((_, i) => i + 1)).slice(0, n).map((a, i) => [String(a), ...series.map(sr => (sr.pontos[i] === undefined ? '—' : f(sr.pontos[i])))]), visivel);
    const leg = muitas ? legendaPotencias(ordemFinal.map(i => ({ pid: series[i].id, nome: series[i].nome, valor: final(series[i]) })), f) : '';
    return `<figure class="rel-fig">${s}${leg}${descricao ? `<figcaption>${esc(descricao)}</figcaption>` : ''}${tab}</figure>`;
  }
  /* Barras = pilhas de tijolos (Arte.graficoTijolos). colunas: [{ pid, valor, rotulo? }];
     opcoes: { max, tijolos, unidade, casas, titulo, descricao, tabela } */
  function barras(colunas, { max, tijolos = 10, unidade = '', casas = 0, titulo = 'Gráfico de barras', descricao = '', tabela: visivel = false } = {}) {
    const svg = Arte.graficoTijolos(colunas, { max, tijolos, unidade, casas, titulo: `${titulo}: ${colunas.map(c => `${c.rotulo ?? nomeCurto(c.pid)} ${fmt(c.valor, casas)}${unidade}`).join('; ')}` })
      .replace('class="grafico tijolos"', 'class="grafico tijolos rel-svg"');
    const tab = tabela(titulo, ['Potência', titulo], colunas.map(c => [c.rotulo ?? nomeCurto(c.pid), fmt(c.valor, casas) + unidade]), visivel);
    const leg = colunas.length > 8 && colunas.every(c => c.pid && CORES_GUIA[c.pid]?.forma) ? legendaPotencias(colunas.map(c => ({ pid: c.pid, nome: c.rotulo }))) : '';
    return `<figure class="rel-fig">${svg}${leg}${descricao ? `<figcaption>${esc(descricao)}</figcaption>` : ''}${tab}</figure>`;
  }
  // Fileira de tijolinhos (1–n) na horizontal, para causas e tabelas: face/lado do guia
  function tijolinhos(q, cor, { w = 26, h = 24, gap = 3 } = {}) {
    const [face, lado] = Arte.corPeca(cor), n = Math.max(1, q), larg = n * (w + gap) + 4;
    let s = `<svg class="tijolinhos" viewBox="0 ${-h * .3} ${larg} ${h * 1.32}" aria-hidden="true" style="--n:${n}">`;
    for (let i = 0; i < n; i++) s += Arte.tijoloFrente(2 + i * (w + gap), 0, w, h, face, lado, { pinos: i === n - 1 ? 1 : 0 });
    return s + '</svg>';
  }

  // ============================== BALANÇO DO MANDATO ==============================
  let placarAntes = null;   // posições no balanço anterior desta partida (setas ▲▼); guarda só uma partida

  // Lugares do sobrevoo: conflitos que mudaram, parcerias novas ou perdidas e protestos pela soberania (até 3)
  function paradas(e, rel) {
    const out = [];
    [...(rel.conflitos || [])].sort((a, b) => Math.abs(b.depois - b.antes) - Math.abs(a.depois - a.antes) || b.depois - a.depois).forEach(c => out.push(c.depois > c.antes
      ? { id: c.territorio, icone: '⚠️', texto: `${nomeLugar(c.territorio)}: o conflito piorou`, detalhe: `Nível ${c.antes} → ${c.depois}. Mais gente foge, e a tensão sobe.` }
      : { id: c.territorio, icone: '🕊️', texto: `${nomeLugar(c.territorio)}: o conflito acalmou`, detalhe: `Nível ${c.antes} → ${c.depois}. Pessoas podem voltar para casa.` }));
    (rel.mudancas || []).filter(x => x.v === 'parceiro').forEach(x => out.push(x.depois
      ? { id: x.quem, icone: '🤝', texto: `${nomeLugar(x.quem)} agora é parceiro ${com(x.depois, 'de')}`, detalhe: 'Influência acumulada vira parceria: comércio, votos e apoio.' }
      : { id: x.quem, icone: '🚪', texto: `${nomeLugar(x.quem)} deixou de ser parceiro ${com(x.antes, 'de')}`, detalhe: 'Outra potência ganhou espaço, ou a instabilidade afastou o parceiro.' }));
    (rel.mudancas || []).filter(x => x.v === 'soberania').forEach(x => out.push({ id: x.quem, icone: '📣', texto: `${nomeLugar(x.quem)}: protestos pela soberania`, detalhe: `A pressão estrangeira passou do limite, e a influência ${com(x.antes, 'de')} caiu pela metade.` }));
    const vistos = new Set();
    return out.filter(p => !vistos.has(p.id) && vistos.add(p.id)).slice(0, 3);
  }
  async function sobrevoo(e, rel) {
    const mapa = typeof Mapa3D !== 'undefined' && Mapa3D.focar && document.querySelector('#mundo canvas') ? Mapa3D : null;
    if (mapa?.atualizarMundo) Promise.resolve(mapa.atualizarMundo(e, { animar: true })).catch(() => {});
    const lista = paradas(e, rel);
    if (!mapa || !lista.length) return;
    const leg = document.createElement('div');
    leg.className = 'rb-legenda balao peca flutua';
    leg.dataset.ponta = 'nenhuma';
    leg.setAttribute('role', 'status');
    $('#camada').append(leg);
    let pulou = false;
    const pular = ev => { if (ev.type === 'keydown' && ![' ', 'Enter', 'ArrowRight', 'PageDown', 'Escape'].includes(ev.key)) return; ev.preventDefault?.(); pulou = true; };
    addEventListener('keydown', pular, true); leg.addEventListener('pointerdown', pular);
    try {
      for (const [i, p] of lista.entries()) {
        if (pulou) break;
        await fim(mapa.focar(p.id, { duracao: RM ? 0 : 1.1, perto: .55 }));   // aberto: o lugar e os vizinhos
        if (pulou) break;
        leg.innerHTML = `<span class="rb-leg-num num" aria-hidden="true">${i + 1}/${lista.length}</span><span class="soquete">${ico(p.icone, 64)}</span>` +
          `<span class="rb-leg-txt"><b>${esc(p.texto)}</b><small>${esc(p.detalhe)}</small></span><span class="rb-leg-dica">Espaço pula</span>`;
        anunciar(p.texto + '. ' + p.detalhe);
        if (RM) gsap.fromTo(leg, { opacity: 0 }, { opacity: 1, duration: .18 });
        else gsap.fromTo(leg, { opacity: 0, y: 3 * u(), scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .32, ease: 'back.out(2)' });
        som('pop');
        for (let t = 0; t < 2400 && !pulou; t += 100) await espera(100);
      }
    } finally {
      removeEventListener('keydown', pular, true);
      leg.remove();
      mapa.visaoGeral?.(RM ? 0 : 1.1);
    }
  }

  // ---------- Passo 1: o mundo ----------
  function cartaoIndicador(k, c, destaque) {
    // variação dos valores como aparecem na tela (61,4 → 61,6 mostra 61 → 62, então a pílula diz +1, não "igual")
    const d = k === 'temperatura' ? Math.round(c.depois * 100) / 100 - Math.round(c.antes * 100) / 100
      : k === 'tensao' ? (segundos(c.antes) - segundos(c.depois)) / 3 : Math.round(c.depois) - Math.round(c.antes);
    const st = estado(k, c.depois), b = bomSe(k, d);
    const de = k === 'tensao' ? segundos(c.antes) : k === 'temperatura' ? c.antes : Math.round(c.antes);
    const para = k === 'tensao' ? segundos(c.depois) : k === 'temperatura' ? c.depois : Math.round(c.depois);
    // a causa principal e, na segunda linha, a outra causa ou a soma de todas as outras: as duas linhas somam a variação
    const resto = c.causas.slice(1), mostrar = resto.length > 1
      ? [c.causas[0], { texto: `Outras ${resto.length} decisões e efeitos`, valor: resto.reduce((s, x) => s + x.valor, 0) }].filter(x => !pequeno(k, x.valor))
      : c.causas;
    const maior = Math.max(...mostrar.map(x => Math.abs(x.valor)), 1e-9);
    const linhasCausa = mostrar.map(x => {
      const bom = bomSe(k, x.valor), q = Math.max(1, Math.round((Math.abs(x.valor) / maior) * 3));
      return `<li class="${bom > 0 ? 'boa' : bom < 0 ? 'ruim' : ''}">${tijolinhos(q, bom > 0 ? '#5BE37D' : bom < 0 ? '#FF6B6B' : 'ladrilho')}` +
        `<b class="num">${esc(variacao(k, x.valor))}</b><span>${esc(x.texto)}</span></li>`;
    }).join('') || '<li class="parado"><span>Ficou estável neste mandato.</span></li>';
    const ind = IND[k], mostra = k === 'tensao' ? -d : d, seta = pequeno(k, d) ? '=' : mostra > 0 ? '▲' : '▼';
    return `<article class="rb-ind peca${destaque ? ' destaque' : ''}" data-k="${k}" data-nivel="${st.nivel}">
      ${destaque ? `<span class="rb-destaque pilula amarela">${ico('⭐', 32)} Destaque</span>` : ''}
      <header><span class="soquete">${ico(ind.icone, 64)}</span><h3>${esc(ind.nome)}</h3>
        <span class="rb-estado" data-nivel="${st.nivel}">${seloNivel(st.nivel)}${esc(st.palavra)}</span></header>
      <p class="rb-valores"><span class="rb-antes num">${esc(valor(k, c.antes))} ${GLIFOS.seta}</span>
        <span class="pilula ${b > 0 ? 'ganho' : b < 0 ? 'perda' : 'fantasma'} rb-delta num">${seta} ${esc(pequeno(k, d) ? 'igual' : variacao(k, d, true))}</span>
        <b class="rb-depois num" data-de="${de}" data-para="${para}">${esc(valor(k, c.depois))}</b></p>
      <ul class="rb-causas" aria-label="Por que mudou">${linhasCausa}</ul>
      ${st.nivel === 'critico' || st.nivel === 'risco' ? '<span class="zebra" aria-hidden="true"></span>' : ''}</article>`;
  }
  function passoMundo(e, rel, cz) {
    const destaque = ORDEM_IND.map(k => [k, Math.abs(cz[k].depois - cz[k].antes) / IND[k].escala]).sort((a, b) => b[1] - a[1])[0];
    return `<div class="rb-grade">${ORDEM_IND.map(k => cartaoIndicador(k, cz[k], destaque[1] > 0 && k === destaque[0])).join('')}</div>`;
  }

  // ---------- Passo 2: clima e emissões contadas de 3 jeitos ----------
  function passoClima(e, rel, cz) {
    const t = cz.temperatura, dT = t.depois - t.antes, restam = Math.max(0, e.config.rodadas - e.rodada + 1);
    const projecao = t.depois + Math.max(0, dT) * restam;
    const linhas = PIDS.map(pid => {
      const p = e.potencias[pid], ficha = typeof FICHAS !== 'undefined' ? FICHAS[pid] : null;
      return { pid, hoje: Simulacao.emissoesDe(p), pessoa: ficha?.emissoesPerCapita?.valor ?? 0, historia: ficha?.emissoesHistoricas?.valor ?? 0 };
    });
    const cols = [['hoje', 'Hoje, no jogo', 'Gt de CO₂ por ano', 1], ['pessoa', 'Por pessoa', 't por habitante (2024)', 1], ['historia', 'Na história', '% do CO₂ desde 1850', 1]];
    const maxDe = c => Math.max(...linhas.map(l => l[c]));
    const lider = c => linhas.reduce((a, b) => (b[c] > a[c] ? b : a)).pid;
    const celula = (l, [c, , , casas]) => {
      const q = Math.max(1, Math.round((l[c] / (maxDe(c) || 1)) * 6)), top = lider(c) === l.pid;
      return `<td class="${top ? 'lider' : ''}"><span class="rb-barra">${tijolinhos(q, c === 'hoje' ? ['#4A4F5C', '#2B2747'] : l.pid, { w: 20, h: 22 })}</span>` +
        `<b class="num">${fmt(l[c], casas)}${c === 'historia' ? '%' : ''}</b>${top ? `<span class="selo ouro" aria-label="maior">1º</span>` : ''}</td>`;
    };
    return `<div class="rb-clima">
      <section class="rb-termo peca">
        <h3>${ico('🌡️', 48)} Temperatura do planeta</h3>
        <p class="rb-valores"><span class="rb-antes num">${fmtGraus(t.antes)}</span>${GLIFOS.seta}<b class="rb-depois num">${fmtGraus(t.depois)}</b>
          <span class="pilula ${dT > .005 ? 'perda' : dT < -.005 ? 'ganho' : 'fantasma'} num">${dT > .005 ? '▲' : dT < -.005 ? '▼' : '='} ${esc(variacao('temperatura', dT))}</span></p>
        <div class="rb-termo-svg">${Arte.termometroTijolos(t.depois, { valor: false })}</div>
        <ul class="rb-fatos">
          <li>${ico('🏭', 40)}<span>O mundo emitiu <b class="num">${fmt(rel.emissoes)} Gt</b> de CO₂ por ano neste mandato.</span></li>
          ${restam ? `<li>${ico('🧭', 40)}<span>Se tudo seguir assim, 2050 chega a <b class="num">${fmtGraus(projecao)}</b>.${projecao >= Simulacao.PARAM.colapso.temperatura ? ' Isso é colapso!' : projecao >= 2 ? ' Perigo!' : ''}</span></li>` : ''}
        </ul>
      </section>
      <section class="rb-emissoes">
        <h3>Quem emite mais? <span>Depende de como se conta.</span></h3>
        <table class="rb-tab-emissoes">
          <caption class="so-leitor">Emissões de CO₂ por potência: hoje no jogo, por pessoa e acumuladas desde 1850</caption>
          <thead><tr><th scope="col"><span class="so-leitor">Potência</span></th>${cols.map(([, t1, t2]) => `<th scope="col">${t1}<small>${t2}</small></th>`).join('')}</tr></thead>
          <tbody>${linhas.map(l => `<tr data-equipe="${l.pid}"><th scope="row">${formaDe(l.pid)}<span>${esc(nomeCurto(l.pid))}</span></th>${cols.map(c => celula(l, c)).join('')}</tr>`).join('')}</tbody>
        </table>
        <p class="rb-nota">${ico('💡', 36)}<span>Por pessoa e na história: dados reais de 2024 (Our World in Data / Global Carbon Project). Média mundial: 4,7 t por pessoa.</span></p>
      </section></div>`;
  }

  // ---------- Passo 3: as nações ----------
  function passoNacoes(e, rel) {
    const inicio = e.historico?.length >= 2 ? e.historico[e.historico.length - 2] : null, fimH = e.historico?.at(-1);
    const competitivo = e.config.modo !== 'cooperativo';
    const placar = Simulacao.placar(e), pos = Object.fromEntries(placar.map((x, i) => [x.id, i])), antes = placarAntes?.semente === e.semente ? placarAntes.pos : null;
    placarAntes = { semente: e.semente, pos };
    const ordem = competitivo ? placar.map(x => x.id) : PIDS;
    const linhas = ordem.map(pid => {
      const p0 = inicio?.potencias?.[pid] || rel.antes.potencias[pid], p1 = rel.depois.potencias[pid];
      const chips = IND_P.map(([k, ic, nome]) => {
        const d = Math.round(p1[k]) - Math.round(p0[k]);
        return `<span class="rb-chip ${d > 0 ? 'sobe' : d < 0 ? 'desce' : ''}" title="${nome}">${ico(ic, 36)}<b class="num">${Math.round(p1[k])}</b>` +
          `<i class="num">${d > 0 ? '▲' + d : d < 0 ? '▼' + -d : '='}</i><span class="so-leitor">${nome}: ${Math.round(p1[k])}, ${d > 0 ? 'subiu ' + d : d < 0 ? 'caiu ' + -d : 'igual'}</span></span>`;
      }).join('');
      const n0 = inicio?.parceiros?.[pid] ?? 0, n1 = fimH?.parceiros?.[pid] ?? Simulacao.parceirosDe(e, pid).length, dn = n1 - n0;
      const merc = (rel.mercado || []).filter(m => m.potencia === pid);
      const grupo = (l, palavra) => (l.length ? `<span class="${palavra === 'vendeu' ? 'venda' : 'compra'}">${palavra} ${l.map(m => `<span class="rb-rec">${ico(RECURSO[m.recurso][0], 32)}<b class="num">${Math.abs(m.quantidade)}</b><span class="so-leitor"> de ${RECURSO[m.recurso][1]}</span></span>`).join('')}</span>` : '');
      const mercTxt = merc.length ? grupo(merc.filter(m => m.quantidade > 0), 'vendeu') + grupo(merc.filter(m => m.quantidade < 0), 'comprou') : '<span class="nada">não negociou</span>';
      const caixa = Math.round(merc.reduce((s, m) => s + m.valor, 0) * 10) / 10;
      const i = pos[pid], dp = antes && antes[pid] !== undefined ? antes[pid] - i : 0;
      const igi = placar.find(x => x.id === pid).total;
      return `<li class="rb-nacao" data-equipe="${pid}" data-humano="${!!e.potencias[pid]?.humano}">
        ${competitivo ? `<span class="selo ${['ouro', 'prata', 'bronze'][i] || ''} rb-pos" aria-label="${i + 1}º lugar">${i + 1}º</span>` : ''}
        <span class="retrato medio" data-equipe="${pid}" data-retrato="${pid}">${formaDe(pid, { classe: 'vazio' })}</span>
        <span class="rb-nome"><b>${esc(nomeCurto(pid))}</b><small>${esc(quem(e, pid))}</small></span>
        <span class="rb-chips">${chips}</span>
        <span class="rb-parc"><b class="num">${n1}</b>${dn ? `<i class="num ${dn > 0 ? 'sobe' : 'desce'}">${dn > 0 ? '+' : '−'}${Math.abs(dn)}</i>` : ''}</span>
        <span class="rb-merc"><span class="rb-merc-l">${merc.length ? `<b class="num rb-caixa ${caixa > 0 ? 'sobe' : caixa < 0 ? 'desce' : ''}">${ico('💰', 32)}${caixa ? sinal(caixa, 1) : '0'}</b>` : ''}${mercTxt}</span></span>
        ${competitivo ? `<span class="rb-igi"><b class="num">${igi}</b>${dp ? `<i class="num ${dp > 0 ? 'sobe' : 'desce'}" aria-label="${dp > 0 ? 'subiu' : 'caiu'} ${Math.abs(dp)} posição">${dp > 0 ? '▲' : '▼'}${Math.abs(dp)}</i>` : ''}</span>` : ''}
      </li>`;
    }).join('');
    const cab = `<div class="rb-nacoes-cab${competitivo ? '' : ' sem-placar'}" aria-hidden="true">${competitivo ? '<span></span>' : ''}<span></span><span>Nação</span>
      <span class="rb-cab-chips">${IND_P.map(([, , nome]) => `<span>${nome}</span>`).join('')}</span><span>Parceiros</span><span>Mercado</span>${competitivo ? '<span class="dir">IGI</span>' : ''}</div>`;
    return `${cab}<ul class="rb-nacoes${competitivo ? '' : ' sem-placar'}${ordem.length > 8 ? ' denso' : ''}" aria-label="Nações" tabindex="0">${linhas}</ul>
      <p class="rb-nota">${ico('💰', 36)}<span>Mercado mundial: quem produz mais do que consome vende a sobra; quem falta compra, e o preço muda com o mundo.${ordem.length > 8 ? ` Role a lista para ver as ${ordem.length} nações.` : ''}</span></p>`;
  }

  // ---------- Passo 4: o Jornal Mundial do mandato ----------
  function manchetesDoMandato(e, rel, n = 3) {
    const lista = (e.manchetes || []).filter(m => m.ano === rel.ano);
    const ev = lista.filter(m => m.evento), di = lista.filter(m => m.dilema), ou = lista.filter(m => !m.evento && !m.dilema);
    const humanos = x => (e.potencias[x.potencia]?.humano ? -1 : 1);
    const ordem = [ev[0], [...di].sort((a, b) => humanos(a) - humanos(b))[0], ou.find(m => /^ONU|^Cúpula/.test(m.texto)) || ou[0], ...ev.slice(1), ...di.slice(1), ...ou];
    const vistos = new Set();
    return ordem.filter(m => m && !vistos.has(m.texto) && vistos.add(m.texto)).slice(0, n);
  }
  const NOME_V = { economia: 'economia', bemEstar: 'bem-estar', ambiente: 'ambiente', seguranca: 'segurança', apoio: 'apoio', limpa: 'energia limpa',
    cooperacao: 'cooperação', comercio: 'comércio', tensao: 'tensão', deslocados: 'deslocados', energia: 'preço da energia', temperatura: 'temperatura',
    desenvolvimento: 'desenvolvimento', estabilidade: 'estabilidade', conflito: 'conflito', influencia: 'influência' };
  function passoJornal(e, rel) {
    const ms = manchetesDoMandato(e, rel, 5), [m0, ...todas] = ms, resto = todas.slice(0, 2), breves = todas.slice(2);
    const sobe = (rel.conflitos || []).filter(c => c.depois > c.antes), cai = (rel.conflitos || []).filter(c => c.depois < c.antes);
    // no máximo 4 linhas de conflito (os que mais pioraram primeiro); "situação crítica" só para quem não está na lista
    const porPeso = l => [...l].sort((a, b) => Math.abs(b.depois - b.antes) - Math.abs(a.depois - a.antes) || b.depois - a.depois);
    const sobeV = porPeso(sobe).slice(0, cai.length ? 3 : 4), caiV = porPeso(cai).slice(0, 4 - sobeV.length), sobra = sobe.length + cai.length - sobeV.length - caiV.length;
    const listados = new Set([...sobeV, ...caiV].map(c => c.territorio));
    const criticos = Object.values(e.territorios).filter(t => t.conflito >= 3 && !listados.has(t.id)).map(t => t.id);
    const blocos = n => `<span class="rb-blocos" aria-label="nível ${n}">${n > 0 ? '<i>!</i>'.repeat(n) : `<i class="paz">${GLIFOS.ok}</i>`}</span>`;   // nível 0 = paz
    const linhaC = c => `<li>${blocos(c.depois)}<span>${esc(nomeLugar(c.territorio))}</span><b class="num">${c.antes} → ${c.depois}</b></li>`;
    const metas = e.config.modo === 'cooperativo' ? Simulacao.metas(e) : null;
    const total = e.config.rodadas, mandato = e.rodada - 1;
    const icone0 = m0 ? (m0.evento ? eventoDe(m0.evento)?.icone : m0.dilema ? dilemaDe(m0.dilema)?.icone : m0.carta ? politica(m0.carta)?.icone : '') || '🌍' : '🕊️';
    // decisões antigas que chegaram agora (efeitos atrasados) e parcerias que mudaram no balanço
    const atrasados = [], vistos = new Set();
    for (const x of (rel.mudancas || []).filter(x => /demorou/.test(x.motivo || ''))) {
      const nomeM = x.motivo.replace(/\s*\(efeito que demorou\)/, ''), chave = nomeM + x.quem + x.v;
      if (vistos.has(chave) || !NOME_V[x.v]) continue;
      vistos.add(chave);
      const dv = Math.round((x.depois - x.antes) * 10) / 10;
      atrasados.push(`<li><b>${esc(maiusc(nomeM))}</b><b class="num ${dv > 0 ? 'sobe' : 'desce'}">${esc(sinal(dv, Number.isInteger(dv) ? 0 : 1))}</b><span>${esc(maiusc(NOME_V[x.v]))} ${x.quem === 'global' ? 'do mundo' : esc(com(x.quem, 'de'))}</span></li>`);
    }
    const parcerias = (rel.mudancas || []).filter(x => x.v === 'parceiro').map(x => x.depois
      ? `<li data-equipe="${x.depois}">${formaDe(x.depois)}<span>${esc(nomeLugar(x.quem))} virou parceiro ${esc(com(x.depois, 'de'))}</span></li>`
      : `<li data-equipe="${x.antes}">${formaDe(x.antes)}<span>${esc(nomeLugar(x.quem))} deixou ${esc(com(x.antes, ''))}</span></li>`);
    return `<div class="rb-jornal">
      <article class="jornal peca rb-pagina">
        ${cabecalhoJornal({ ano: rel.ano, mandato, total, extra: !!(m0 && m0.evento) })}
        <div class="rb-materia"><figure class="rb-foto" aria-hidden="true">${ico(icone0, 128)}</figure>
          <div><p class="rb-chapeu">${m0?.evento ? 'Plantão Global' : 'Manchete do mandato'}</p><h3 class="jornal-manchete">${esc(m0 ? m0.texto : 'Um mandato calmo: nenhuma grande notícia.')}</h3></div></div>
        <div class="rb-colunas">${resto.map(m => `<p>${ico(m.dilema ? '🏛️' : m.carta ? '🗺️' : '📰', 36)}<span>${esc(m.texto)}</span></p>`).join('')}</div>
        ${breves.length ? `<ul class="rb-breves" aria-label="Breves">${breves.map(m => `<li>${esc(m.texto)}</li>`).join('')}</ul>` : ''}
      </article>
      <aside class="rb-lado">
        <section class="rb-conflitos peca">
          <h3>${ico('⚠️', 40)} Conflitos</h3>
          ${sobeV.length ? `<p class="rot ruim">Pioraram</p><ul>${sobeV.map(linhaC).join('')}</ul>` : ''}
          ${caiV.length ? `<p class="rot boa">Acalmaram</p><ul>${caiV.map(linhaC).join('')}</ul>` : ''}
          ${sobra ? `<p class="rb-calmo">e mais ${sobra} ${sobra === 1 ? 'lugar' : 'lugares'}</p>` : ''}
          ${!sobe.length && !cai.length ? '<p class="rb-calmo">Nenhum conflito mudou de nível no balanço.</p>' : ''}
          ${criticos.length ? `<div class="rb-critico">${ico('🆘', 36)}<span>${listados.size ? 'Também em situação crítica:' : 'Situação crítica:'}</span>${criticos.map(id => `<span class="pilula">${esc(nomeLugar(id))}</span>`).join('')}</div>` : ''}
        </section>
        ${metas ? `<section class="rb-metas peca"><h3>${ico('🎯', 40)} Metas 2050 <b class="num">${metas.filter(m => m.ok).length} de 5</b></h3>
          <ul>${metas.map(m => `<li class="${m.ok ? 'ok' : 'nao'}">${ico(m.icone, 32)}<span>${esc(m.nome)}</span><span class="selo ${m.ok ? 'ok' : ''}" data-nivel="${m.ok ? 'bom' : 'critico'}" aria-label="${m.ok ? 'cumprida' : 'ainda não'}">${m.ok ? GLIFOS.ok : GLIFOS.nao}</span></li>`).join('')}</ul></section>` : ''}
        ${parcerias.length ? `<section class="rb-parcerias peca"><h3>${ico('🤝', 40)} Parcerias</h3><ul>${parcerias.slice(0, 2).join('')}</ul></section>` : ''}
        ${atrasados.length ? `<section class="rb-atrasos peca"><h3>${ico('⏳', 40)} Chegou agora</h3><p class="rb-calmo">Decisões de antes que só fizeram efeito neste balanço:</p><ul>${atrasados.slice(0, 2).join('')}</ul></section>` : ''}
      </aside></div>`;
  }

  // ---------- Passo: diplomacia do mandato (relatorio.diplomacia do motor): quem se aproximou, quem se afastou, o que se espalhou ----------
  const TIPO_INCIDENTE = { incidente: ['⚠️', 'Incidente'], cooperacao: ['🤝', 'Cooperação'], alianca_rompida: ['🚪', 'Aliança rompida'], guerra_comercial: ['🚢', 'Guerra comercial'] };
  function passoDiplomacia(e, rel) {
    const d = rel.diplomacia || {}, rot = v => (typeof Simulacao.rotuloRelacao === 'function' ? Simulacao.rotuloRelacao(v) : { texto: '', nivel: 0 });
    const mudancas = (d.relacoes || []).slice(0, 5), contagio = (d.contagio || []).slice(0, 4), incidentes = (d.incidentes || []).slice(0, 5);
    const par = r => {
      const a = rot(r.antes), b = rot(r.depois), dif = Math.round(r.depois - r.antes), melhor = dif > 0;
      return `<li class="rb-rel ${melhor ? 'boa' : 'ruim'}"><span class="rb-rel-par"><span data-equipe="${esc(r.a)}">${formaDe(r.a)}</span><span data-equipe="${esc(r.b)}">${formaDe(r.b)}</span></span>
        <span class="rb-rel-txt"><b>${esc(nomeCurto(r.a))} e ${esc(nomeCurto(r.b))}</b><small>${esc(a.texto)} → ${esc(b.texto)}${r.motivo ? ' · ' + esc(r.motivo) : ''}</small></span>
        <b class="num ${melhor ? 'sobe' : 'desce'}" aria-label="${melhor ? 'melhorou' : 'piorou'} ${Math.abs(dif)}">${melhor ? '▲' : '▼'}${Math.abs(dif)}</b></li>`;
    };
    const vazio = t => `<p class="rb-calmo">${t}</p>`;
    return `<div class="rb-diplo">
      <section class="rb-conflitos peca rb-diplo-rel"><h3>${ico('🤝', 40)} Relações que mudaram</h3>
        ${mudancas.length ? `<ul>${mudancas.map(par).join('')}</ul>` : vazio('Nenhuma relação mudou muito neste mandato.')}</section>
      <section class="rb-conflitos peca rb-diplo-contagio"><h3>${ico('🌊', 40)} A crise se espalhou</h3>
        ${contagio.length ? `<ul>${contagio.map(c => `<li class="rb-cont"><span data-equipe="${esc(c.para)}">${formaDe(c.para)}</span><span>A crise ${esc(com(c.de, 'em'))} arrastou ${esc(com(c.para, ''))}</span><b class="num desce">${esc(sinal(Math.round(c.valor * 10) / 10, 1))}</b></li>`).join('')}</ul>
          <p class="rb-calmo">Pontos de economia perdidos: os países vendem uns para os outros, então o tombo de um chega aos outros.</p>` : vazio('Nenhum choque econômico atravessou fronteiras.')}</section>
      <section class="rb-conflitos peca rb-diplo-inc"><h3>${ico('📣', 40)} Incidentes e acordos</h3>
        ${incidentes.length ? `<ul>${incidentes.map(i => { const [ic, nome] = TIPO_INCIDENTE[i.tipo] || ['🌍', 'Notícia']; return `<li class="rb-inc" data-tipo="${esc(i.tipo || '')}">${ico(ic, 40)}<span><b>${nome}</b> ${esc(i.texto)}</span></li>`; }).join('')}</ul>` : vazio('Foi um mandato sem incidentes entre as potências.')}</section>
    </div>`;
  }

  // ---------- Passo 5: para conversar ----------
  function perguntaDoMandato(e, rel, cz) {
    const g = rel.depois.global;
    const mov = ORDEM_IND.map(k => ({ k, d: cz[k].depois - cz[k].antes, peso: Math.abs(cz[k].depois - cz[k].antes) / IND[k].escala })).sort((a, b) => b.peso - a.peso);
    const novo = (rel.mudancas || []).find(x => x.v === 'parceiro' && x.depois), piorou = (rel.conflitos || []).find(c => c.depois > c.antes);
    if (iminentes(g).length) return 'O planeta está perto do colapso. Que decisão cada equipe pode tomar já no próximo mandato para frear isso, mesmo perdendo pontos?';
    if (piorou && (mov[0].peso < 1.5 || mov[0].k === 'tensao')) return `O conflito ${com(piorou.territorio, 'em')} piorou. O que as potências podem fazer por quem vive lá, sem usar armas?`;
    if (novo && mov[0].peso < 1) return `${nomeLugar(novo.quem)} virou parceiro ${com(novo.depois, 'de')}. O que esse lugar ganha com a parceria, e o que pode perder?`;
    const { k, d } = mov[0];
    if (k === 'temperatura') return `A temperatura subiu ${variacao(k, d).replace('+', '')}. Quem deve cortar emissões primeiro: quem emite mais hoje ou quem mais emitiu na história?`;
    if (k === 'tensao') return d > 0 ? `O Relógio andou ${Math.round(3 * d)} segundos para a meia-noite. Que decisão deste mandato mais aumentou a tensão, e o que poderia ter sido feito no lugar?` : 'O Relógio se afastou da meia-noite. O que ajudou os países a desconfiarem menos uns dos outros?';
    if (k === 'deslocados') return d > 0 ? `Mais ${fmtMilhoes(Math.round(d))} de pessoas tiveram de deixar suas casas. Para onde elas vão, e quem deve ajudar?` : 'Menos pessoas estão deslocadas. O que permitiu que elas voltassem para casa?';
    if (k === 'comercio') return d < 0 ? 'O comércio mundial caiu. Quem perde mais quando as rotas e os acordos se fecham: os países ricos ou os pobres?' : 'O comércio cresceu. Todo mundo ganhou igual, ou alguns ganharam mais?';
    if (k === 'cooperacao') return d > 0 ? 'A cooperação subiu. O que fez os países confiarem mais uns nos outros?' : 'A cooperação caiu. Por que é tão difícil os países agirem juntos?';
    return d > 0 ? 'A energia ficou mais cara. Quem sofre mais com isso, e quem lucra?' : 'A energia ficou mais barata. Isso ajuda ou atrapalha a troca por energia limpa?';
  }
  function passoConversa(e, rel, cz) {
    const prox = rel.proximoAno, ate = Math.min(Simulacao.PARAM.anoFinal, Math.round(prox + e.delta)) - 1, alerta = textoAlerta(rel.depois.global);
    const cop = !rel.fim && Simulacao.copNestaRodada(e);
    return `<div class="rb-conversa">
      <div class="rb-mascote">${kit('globo-irado-pensando', { classe: 'destaque', alt: '' })}</div>
      <div class="rb-fala">
        <p class="rb-fala-rot">${ico('💬', 40)} Para conversar com a turma</p>
        <blockquote class="balao peca fala" data-ponta="nenhuma"><p>${esc(perguntaDoMandato(e, rel, cz))}</p></blockquote>
        <div class="rb-proximo">
          ${rel.fim ? tiquete(`<span>Fim da partida</span><b>${rel.fim.tipo === 'colapso' ? 'Colapso' : '2050'}</b>`, { cor: rel.fim.tipo === 'colapso' ? 'vermelho' : 'amarelo', icone: rel.fim.tipo === 'colapso' ? '🚨' : '🏆' })
            : tiquete(`<span>Próximo mandato</span><b>${fmtAno(prox)} a ${fmtAno(ate)}</b>`, { cor: 'amarelo', icone: '⏳' })}
          ${cop ? tiquete('<span>No próximo mandato</span><b>Cúpula do Clima</b>', { cor: 'natureza', icone: '🌍' }) : ''}
          ${alerta ? tiquete(`<span>Cuidado</span><b>Colapso perto</b>`, { cor: 'vermelho', icone: '🚨' }) : ''}
        </div>
      </div></div>`;
  }

  // ---------- Animação de cada passo (cascata + o que é próprio do passo) ----------
  function animarPasso(el, i, nome = '') {
    const itens = el.querySelectorAll(':scope > * > .peca, .rb-ind, .rb-nacao, .rb-pagina, .rb-lado > *, .rb-termo, .rb-emissoes, .rb-mascote, .rb-fala > *');
    if (RM) { gsap.fromTo(itens, { opacity: 0 }, { opacity: 1, duration: .18 }); return; }
    gsap.fromTo(itens, { opacity: 0, y: 1.4 * u() }, { opacity: 1, y: 0, duration: .32, stagger: .05, ease: 'power2.out' });
    if (nome === 'Mundo') {
      el.querySelectorAll('.rb-ind').forEach((c, n) => {
        const b = c.querySelector('.rb-depois'), k = c.dataset.k;
        if (!b) return;
        const de = +b.dataset.de, para = +b.dataset.para;
        if (de === para) return;
        numeroQueSalta(b, de, para, { casas: k === 'temperatura' ? 2 : 0, sufixo: k === 'temperatura' ? FINO + '°C' : k === 'tensao' ? FINO + 's' : k === 'deslocados' ? FINO + 'mi' : '', som: c.classList.contains('destaque') });
        gsap.fromTo(c.querySelectorAll('.tijolinhos g'), { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: .26, stagger: .03, ease: 'back.out(3)', delay: .25 + n * .05 });
      });
      const d = el.querySelector('.rb-destaque');
      if (d) gsap.fromTo(d, { scale: 0, rotation: -16 }, { scale: 1, rotation: 0, duration: .55, ease: 'elastic.out(1, .5)', delay: .5, onStart: () => som('pop') });
    }
    if (nome === 'Clima') {
      const svg = el.querySelector('.rb-termo-svg svg'), cheios = svg ? [...svg.querySelectorAll(':scope > g')] : [];
      const a = +el.dataset.antes || 0, n0 = Math.max(0, Math.round((a - 1.0) * 10));
      cheios.slice(n0).forEach((g, k) => {
        const w = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.before(w); w.append(g);
        gsap.timeline({ delay: .3 + k * .09 }).fromTo(w, { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: .32, ease: 'power2.in' })
          .call(() => som('tijolo', { i: k })).fromTo(w, { scaleY: .88, transformOrigin: '50% 100%' }, { scaleY: 1, duration: .14, ease: 'back.out(3)' });
      });
      gsap.fromTo(el.querySelectorAll('.rb-barra svg'), { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: .45, stagger: .025, ease: 'power2.out', delay: .2 });
    }
    if (nome === 'Jornal') { som('virar'); gsap.fromTo(el.querySelector('.rb-pagina'), { rotation: -4, scale: .94 }, { rotation: -1, scale: 1, duration: .5, ease: 'back.out(1.6)' }); }
    if (nome === 'Conversa') gsap.fromTo(el.querySelector('.rb-mascote img'), { scale: 0, rotation: -15 }, { scale: 1, rotation: 0, duration: .6, ease: 'elastic.out(1, .5)' });
  }

  async function balanco(e, rel) {
    if (!rel) return;
    const total = e.config.rodadas, mandato = Math.max(1, e.rodada - 1);
    await splash({ pre: `Mandato ${mandato} de ${total}`, titulo: 'Balanço', sub: `De ${fmtAno(rel.ano)} a ${fmtAno(rel.proximoAno - 1)}`, cor: 'anil', icone: kit('prancheta'), tempo: 1200, som: 'whoosh' });
    await sobrevoo(e, rel);
    const cz = causas(e, rel), alerta = textoAlerta(rel.depois.global);
    const PASSOS = [['Mundo', '🌍', passoMundo], ['Clima', '🌡️', passoClima], ['Nações', '🏛️', passoNacoes], ...(rel.diplomacia ? [['Diplomacia', '🤝', passoDiplomacia]] : []), ['Jornal', '📰', passoJornal], ['Conversa', '💬', passoConversa]];
    const p = document.createElement('section');
    const idT = novoId('rb');
    p.className = `painel peca pinos painel-g anil rel-balanco${PASSOS.length > 5 ? ' rb-6' : ''}`;   // 6 abas: sem os ícones, para o título caber
    p.setAttribute('aria-labelledby', idT);
    p.innerHTML = `<header class="painel-cab">${kit('prancheta', { classe: 'painel-objeto' })}
        <h2 class="painel-titulo" id="${idT}">Balanço do mandato<small class="painel-sub">${fmtAno(rel.ano)} a ${fmtAno(rel.proximoAno - 1)} · mandato ${mandato} de ${total}</small></h2>
        <div class="abas rb-passos" role="tablist" aria-label="Partes do balanço">${PASSOS.map(([n, ic], i) =>
          `<button class="peca" role="tab" id="${idT}-a${i}" aria-controls="${idT}-p${i}" aria-selected="${i === 0}"><span class="rb-passo-n num" aria-hidden="true">${i + 1}</span>${ico(ic, 40)}<span>${n}</span></button>`).join('')}</div></header>
      <div class="tela">${PASSOS.map(([n, , f], i) => `<div class="rb-passo" role="tabpanel" id="${idT}-p${i}" aria-labelledby="${idT}-a${i}" tabindex="-1"${i ? ' hidden' : ''}${i === 1 ? ` data-antes="${cz.temperatura.antes}"` : ''}>${f(e, rel, cz)}</div>`).join('')}</div>
      <footer class="painel-rodape">
        <button class="btn btn-neutro btn-mini peca rb-pular" data-teste="pular">Pular balanço</button>
        ${alerta ? `<p class="rb-alerta pilula alerta" role="alert">${ico('🚨', 48)}<span>${esc(alerta)}</span></p>` : `<span class="dica">Espaço ou ${GLIFOS.seta} avança</span>`}
        <button class="btn btn-neutro peca rb-voltar">${GLIFOS.voltar} Voltar</button>
        <button class="btn btn-principal peca pinos rb-seguir" data-teste="continuar-painel">Próximo ${GLIFOS.seta}</button></footer>`;
    // retratos dos bonecos nas linhas das nações (cache do Cenas3D)
    const avatarDe = pid => (typeof Jogo !== 'undefined' && Jogo.avatarDe?.(pid)) || null;
    if (typeof Cenas3D !== 'undefined') p.querySelectorAll('[data-retrato]').forEach(el => {
      const av = avatarDe(el.dataset.retrato);
      if (av) Cenas3D.retrato(av, { tamanho: 96 }).then(url => { el.insertAdjacentHTML('afterbegin', `<img src="${url}" alt="">`); el.querySelector('svg.forma')?.classList.remove('vazio'); }).catch(() => {});
    });
    let atual = 0, resolver;
    const abas = [...p.querySelectorAll('[role="tab"]')], seguir = p.querySelector('.rb-seguir'), voltar = p.querySelector('.rb-voltar');
    const mostrar = i => {
      atual = i;
      voltar.style.visibility = i ? '' : 'hidden';
      seguir.innerHTML = i === PASSOS.length - 1 ? `Continuar ${GLIFOS.ok}` : `Próximo ${GLIFOS.seta}`;
      abas.forEach((a, k) => { a.classList.toggle('feito', k < i); a.querySelector('.rb-passo-n').innerHTML = k < i ? GLIFOS.ok : k + 1; });
      const painel = p.querySelector(`#${idT}-p${i}`);
      const lado = painel.querySelector('.rb-lado');   // o que não cabe na coluna sai, de baixo para cima
      while (lado?.children.length > 1 && lado.scrollHeight > lado.clientHeight + 2) lado.lastElementChild.remove();
      animarPasso(painel, i, PASSOS[i][0]);
      anunciar(`${PASSOS[i][0]}. Passo ${i + 1} de ${PASSOS.length}.`);
    };
    const escolher = ativarAbas(p.querySelector('.rb-passos'), (_, i) => mostrar(i));
    const ir = i => { if (i >= PASSOS.length) return resolver(); if (i < 0) return; som('whoosh'); escolher(abas[i]); };
    seguir.onclick = () => { som('clique'); ir(atual + 1); };
    voltar.onclick = () => { som('clique'); ir(atual - 1); };
    p.querySelector('.rb-pular').onclick = () => { som('clique'); resolver(); };
    p.addEventListener('keydown', ev => {
      if (ev.target.closest('[role="tablist"]')) return;
      const naoBotao = !ev.target.closest('button, a');
      if (['ArrowRight', 'PageDown'].includes(ev.key) || ([' ', 'Enter'].includes(ev.key) && naoBotao)) { ev.preventDefault(); ir(atual + 1); }
      if (['ArrowLeft', 'PageUp'].includes(ev.key)) { ev.preventDefault(); ir(atual - 1); }
    });
    p.addEventListener('click', ev => { if (ev.target.closest('.tela') && !ev.target.closest('button, a, table')) ir(atual + 1); });
    try {
      await abrirPainel(p, { foco: '.rb-seguir' });
      await aguardar(new Promise(r => (resolver = r)));
    } finally { await fecharPainel(p).catch(() => {}); }
  }

  // ============================== FIM DA PARTIDA ==============================
  function textoResultado(e, r) {
    const g = e.global;
    if (r.fim.tipo === 'colapso') return { titulo: 'Colapso global', sub: `${r.fim.texto} Num planeta em colapso, ninguém vence.`, vitoria: false, tom: 'colapso' };
    if (e.config.modo === 'cooperativo') {
      const inf = r.infiltrado;
      if (inf && inf.agendaCumprida && !inf.exposto) return { titulo: 'O infiltrado venceu', sub: `A ${nomeEquipe(inf.potencia)} cumpriu a agenda secreta sem ser descoberta.`, vitoria: false, tom: 'derrota' };
      return r.vitoria ? { titulo: 'O mundo venceu a crise!', sub: `${r.metasCumpridas} de 5 Metas 2050 cumpridas. A turma inteira ganhou!`, vitoria: true, tom: 'vitoria' }
        : { titulo: 'Missão não cumprida', sub: `O planeta chegou a 2050, mas só ${r.metasCumpridas} de 5 metas foram cumpridas (eram precisas 4).`, vitoria: false, tom: 'derrota' };
    }
    if (e.config.modo === 'blocos' && r.blocos?.length) {
      const b = r.blocos[0];
      return { titulo: 'Chegamos a 2050!', sub: `O planeta resistiu (${fmtGraus(g.temperatura)}). Vence o bloco de ${listaNomes(b.membros.map(nomeEquipeOu(e)))}.`, vitoria: true, tom: 'vitoria' };
    }
    return { titulo: 'Chegamos a 2050!', sub: `O planeta resistiu (${fmtGraus(g.temperatura)}). Vitória ${daEquipe(e, r.vencedor)}!`, vitoria: true, tom: 'vitoria' };
  }
  const nomeEquipeOu = e => pid => (e.potencias[pid]?.humano ? nomeEquipe(pid) : `${nomeCurto(pid)} (Computador)`);
  // "da Equipe Roxa (União Europeia)" ou "dos Estados Unidos (Computador)"
  const daEquipe = (e, pid) => (e.potencias[pid]?.humano ? `da ${nomeEquipe(pid)} (${nomeLugar(pid)})` : `${com(pid, 'de')} (Computador)`);

  // Rótulos sobre os bonecos de uma cena (Cenas3D.ancora): forma + nome da equipe
  function rotularBonecos(onde, e, pids, { acima = false } = {}) {
    onde.innerHTML = pids.map(pid => {
      const a = Cenas3D.ancora?.(pid);
      if (!a?.visivel) return '';
      return `<span class="rf-rotulo letra-bolha" style="left:${a.x}px;top:${acima ? a.topo : a.y}px" data-equipe="${pid}"><span>${formaDe(pid)}${esc(nomeCurto(pid))}</span>${e.potencias[pid]?.humano ? '' : '<small>Computador</small>'}</span>`;
    }).join('');
  }
  // Espera o clique em "Continuar" (ou Espaço/Enter/→); clique antes do fim da cena pula a cena
  function esperarSeguir(btn, cena) {
    const fora = new AbortController(), { signal } = fora;
    return aguardar(new Promise(ok => {
      let pronto = false;
      cena?.then(() => (pronto = true), () => (pronto = true));
      const passo = () => {
        if (!pronto && typeof Cenas3D !== 'undefined') { Cenas3D.pular?.(); pronto = true; return; }
        som('clique'); ok();
      };
      btn.addEventListener('click', ev => { ev.stopPropagation(); passo(); }, { signal });
      btn.closest('.tela')?.addEventListener('pointerdown', ev => { if (!ev.target.closest('button, a')) passo(); }, { signal });
      addEventListener('keydown', ev => { if ([' ', 'Enter', 'ArrowRight', 'PageDown'].includes(ev.key) && !ev.target.closest?.('button, a')) { ev.preventDefault(); passo(); } }, { capture: true, signal });
    })).finally(() => fora.abort());
  }

  async function cenaResultado(t, e, r, avs, res) {
    t.innerHTML = `<div class="rf-palco rf-${res.tom}">
      <h1 class="rf-titulo marca letra-bolha relevo">${esc(res.titulo)}</h1>
      <p class="rf-sub peca">${esc(res.sub)}</p>
      <div class="rf-rotulos" aria-hidden="true"></div>
      <button class="btn btn-principal peca pinos rf-seguir" data-teste="continuar-painel">Continuar ${GLIFOS.seta}</button></div>`;
    anunciar(`${res.titulo}. ${res.sub}`);
    if (!RM) gsap.timeline().fromTo(t.querySelector('.rf-titulo'), { scale: res.vitoria ? 2.2 : 1.2, opacity: 0, y: -2 * u() }, { scale: 1, opacity: 1, y: 0, duration: .5, ease: res.vitoria ? 'back.out(2.2)' : 'power2.out', delay: .3 })
      .fromTo(t.querySelector('.rf-sub'), { y: 2 * u(), opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: 'power2.out' }, '-=.1');
    else gsap.fromTo(t.querySelectorAll('.rf-titulo, .rf-sub'), { opacity: 0 }, { opacity: 1, duration: .2 });
    try { if (typeof Som !== 'undefined') { Som.musica?.(null); Som.vinheta?.(res.vitoria ? 'vitoria' : 'derrota'); } } catch { /* sem som */ }
    if (res.tom === 'colapso') tremer(.6);   // só no colapso (guia §9.2); no RM, tremer() vira a vinheta vermelha
    let cena = null;
    try { if (typeof Cenas3D !== 'undefined') cena = Cenas3D.fim(res.vitoria, avs, { faixa: [.22, .86] }); } catch { cena = null; }
    cena?.then(() => rotularBonecos(t.querySelector('.rf-rotulos'), e, avs.map(a => a.pid))).catch(() => {});
    const btn = t.querySelector('.rf-seguir');
    btn.focus({ preventScroll: true });
    await esperarSeguir(btn, cena || Promise.resolve());
  }

  async function cenaPodio(t, e, r, avs) {
    const ranking = r.placar.map(x => x.id), igi = Object.fromEntries(r.placar.map(x => [x.id, x.total])), b0 = r.blocos?.[0];
    t.innerHTML = `<div class="rf-palco rf-podio">
      <h1 class="rf-titulo marca letra-bolha relevo">Pódio de 2050</h1>
      ${b0 ? `<p class="rf-sub peca">Bloco vencedor: ${esc(listaNomes(b0.membros.map(nomeEquipeOu(e))))} · IGI médio <b class="num">${b0.total}</b></p>` : ''}
      <div class="rf-fitas" aria-hidden="true"></div>
      <div class="rf-brilharam peca"><span class="rf-igi-nota">IGI = quanto cada nação avançou de 2026 a 2050</span>${ranking.length > 3 ? `<span class="rf-brilharam-tit">Também brilharam</span>${ranking.slice(3).map(pid => `<span class="rf-brilhou" data-equipe="${pid}">${formaDe(pid)}<span>${esc(nomeEquipeOu(e)(pid))}</span><b class="num">${igi[pid]}</b></span>`).join('')}` : ''}</div>
      <button class="btn btn-principal peca pinos rf-seguir" data-teste="continuar-painel">Ver o relatório ${GLIFOS.seta}</button></div>`;
    anunciar(`Pódio: 1º ${nomeEquipeOu(e)(ranking[0])}, ${igi[ranking[0]]} pontos; 2º ${nomeEquipeOu(e)(ranking[1])}, ${igi[ranking[1]]}; 3º ${nomeEquipeOu(e)(ranking[2])}, ${igi[ranking[2]]}.`);
    let cena = null;
    try { if (typeof Cenas3D !== 'undefined') cena = Cenas3D.podio(ranking, avs, { faixa: [b0 ? .3 : .22, .84] }); } catch { cena = null; }
    // a fita com nome e IGI aparece quando o boneco pousa na coluna (âncora parada por alguns quadros) e acompanha a tela
    const fitas = t.querySelector('.rf-fitas'), parado = {}, ultimo = {};
    const mostrarFita = (pid, i, a) => {
      fitas.insertAdjacentHTML('beforeend', `<div class="rf-fita l${i + 1}" data-pid="${pid}">${fita(nomeEquipeOu(e)(pid), { cor: pid })}<span class="rf-igi peca"><span>IGI</span><b class="num">0</b></span></div>`);
      const el = fitas.lastElementChild, b = el.querySelector('.rf-igi b');
      if (RM) { b.textContent = igi[pid]; gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .2 }); return; }
      gsap.fromTo(el, { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(2)' });
      const o = { v: 0 };
      gsap.to(o, { v: igi[pid], duration: i === 0 ? 1.6 : 1, ease: 'expo.out', onUpdate: () => (b.textContent = Math.round(o.v)) });
    };
    const acompanhar = () => ranking.slice(0, 3).forEach((pid, i) => {
      const a = typeof Cenas3D !== 'undefined' && Cenas3D.palco?.bonecos?.[pid]?.visible ? Cenas3D.ancora(pid) : null;
      if (!a?.visivel) return;
      parado[pid] = Math.abs(a.y - (ultimo[pid] ?? -1e9)) < .5 ? (parado[pid] || 0) + 1 : 0;
      ultimo[pid] = a.y;
      let el = fitas.querySelector(`[data-pid="${pid}"]`);
      if (!el && parado[pid] >= 8) { mostrarFita(pid, i, a); el = fitas.lastElementChild; }
      if (el) { el.style.left = a.x + (i === 1 ? -3.4 : i === 2 ? 3.4 : 0) * u() + 'px'; el.style.top = a.topo + (i ? 1.4 * u() : -1.2 * u()) + 'px'; }
    });
    gsap.ticker.add(acompanhar);
    if (!RM) gsap.fromTo(t.querySelectorAll('.rf-titulo, .rf-sub'), { opacity: 0, y: -2 * u() }, { opacity: 1, y: 0, duration: .4, stagger: .1, ease: 'back.out(1.6)' });
    gsap.fromTo(t.querySelector('.rf-brilharam'), { opacity: 0 }, { opacity: 1, duration: .3, delay: RM ? 0 : 1.2 });
    const btn = t.querySelector('.rf-seguir');
    btn.focus({ preventScroll: true });
    try { await esperarSeguir(btn, cena || Promise.resolve()); } finally { gsap.ticker.remove(acompanhar); }
  }

  // ---------- Relatório: abas ----------
  function abaResultado(e, r, avs) {
    const coop = e.config.modo === 'cooperativo', colapso = r.fim.tipo === 'colapso';
    const selos = pid => (r.selos?.[pid] || []).map(s => `<span class="pilula rf-selo">${ico(s.icone, 32)} ${esc(s.nome)}</span>`).join('') || '<span class="pilula rf-semselo">nenhum selo</span>';
    const linhaPlacar = (x, i) => `<li class="rf-linha" data-equipe="${x.id}">
      ${colapso ? '' : `<span class="selo ${['ouro', 'prata', 'bronze'][i] || ''} grande rf-pos">${i + 1}º</span>`}
      <span class="retrato medio" data-equipe="${x.id}" data-retrato="${x.id}">${formaDe(x.id, { classe: 'vazio' })}</span>
      <span class="rf-quem"><b>${esc(nomeLugar(x.id))}</b><small>${esc(quem(e, x.id))}</small></span>
      <span class="rf-selos">${selos(x.id)}</span>
      <span class="rf-igi-num"><small>IGI</small><b class="num">${x.total}</b></span></li>`;
    const blocos = r.blocos && !colapso ? `<ul class="rf-blocos">${r.blocos.map((b, i) => `<li class="peca ${i ? '' : 'amarela'}" aria-label="${i + 1}º bloco: ${esc(listaNomes(b.membros.map(nomeEquipeOu(e))))}, IGI médio ${b.total}"><b aria-hidden="true">${i + 1}º</b><span aria-hidden="true">${b.membros.map(pid => formaDe(pid)).join('')}</span><span class="num" aria-hidden="true">${b.total}</span></li>`).join('')}</ul>` : '';
    const placar = `<section class="rf-bloco rf-placar"><h3>${ico(colapso ? '🌍' : '🏆', 44)} ${colapso ? 'Como cada nação terminou' : 'Classificação final'}${blocos}</h3>
      <ol class="rf-lista${colapso ? ' sem-pos' : ''}">${r.placar.map(linhaPlacar).join('')}</ol>${saude(e, r)}</section>`;
    const metas = `<section class="rf-bloco rf-metas"><h3>${ico('🎯', 44)} Metas 2050 <span class="pilula ${r.metasCumpridas >= 4 ? 'ganho' : 'perda'} num">${r.metasCumpridas ?? r.metas.filter(m => m.ok).length} de 5</span></h3>
      <ul>${r.metas.map(m => `<li class="peca ${m.ok ? 'ok' : 'nao'}">${ico(m.icone, 48)}<span><b>${esc(m.nome)}</b><small>${esc(m.texto)}</small></span>
        <span class="carimbo pequeno ${m.ok ? 'verde' : 'vermelho'}">${m.ok ? GLIFOS.ok + ' Cumprida' : GLIFOS.nao + ' Falhou'}</span></li>`).join('')}</ul></section>`;
    const missoes = (r.missoes || []).map(m => {
      const ms = typeof MISSOES !== 'undefined' ? MISSOES.find(x => x.id === m.missao) : null;
      return `<li class="rf-missao" data-equipe="${m.potencia}">${formaDe(m.potencia)}<span><b>${esc(ms?.nome || m.missao)}</b><small><span class="rf-dono">${esc(nomeEquipeOu(e)(m.potencia))}:</span> ${comIcones(ms?.texto || '')}</small></span>
        <span class="carimbo pequeno ${m.cumprida ? 'verde' : 'cinza'}">${m.cumprida ? GLIFOS.ok + ' Cumprida' : 'Não cumprida'}</span></li>`;
    }).join('');
    const inf = r.infiltrado, agenda = inf && typeof AGENDAS !== 'undefined' ? AGENDAS.find(a => a.id === inf.agenda) : null;
    const selosCoop = `<section class="rf-bloco rf-selos-coop"><h3>${ico('🏅', 44)} Selos das equipes</h3><ul>${PIDS.map(pid => `<li data-equipe="${pid}">${formaDe(pid)}<b>${esc(nomeCurto(pid))}</b><span>${selos(pid)}</span></li>`).join('')}</ul></section>`;
    const lado = coop
      ? `<div class="rf-coluna">${inf ? `<section class="rf-bloco rf-infiltrado">
          <div class="rf-inf-topo">${kit('dossie', { classe: 'rf-dossie' })}<div><h3>O infiltrado era…</h3>
            <p class="rf-revela" data-equipe="${inf.potencia}">${formaDe(inf.potencia)}<b>${esc(nomeEquipeOu(e)(inf.potencia))}</b></p></div></div>
          <p class="rf-agenda"><b>Agenda secreta: ${esc(agenda?.nome || '')}.</b> ${esc(agenda?.texto || '')}</p>
          <p class="rf-carimbos"><span class="carimbo pequeno ${inf.exposto ? 'verde' : 'vermelho'}">${inf.exposto ? GLIFOS.ok + ' Descoberto' : 'Não descoberto'}</span>
          <span class="carimbo pequeno ${inf.agendaCumprida ? 'vermelho' : 'verde'}">${inf.agendaCumprida ? 'Agenda cumprida' : GLIFOS.ok + ' Agenda falhou'}</span></p></section>` : ''}${selosCoop}</div>`
      : `<section class="rf-bloco rf-missoes">${kit('envelope-secreto', { classe: 'rf-obj' })}<h3>Missões secretas reveladas</h3><ul>${missoes}</ul></section>`;
    return `<div class="rf-res${coop ? ' coop' : ''}">${coop ? metas : placar}${lado}</div>`;
  }

  // Saúde do planeta no IGI: +10 ou −10 para todos (o bem comum pesa no placar de cada um)
  function saude(e, r) {
    const v = r.placar?.[0]?.partes?.planeta ?? 0, g = e.global;
    const texto = v > 0 ? `+${v} para todos: o mundo terminou calmo e abaixo de ${fmtGraus(1.8)}.` : v < 0 ? `${sinal(v)} para todos: ${g.temperatura >= 2 ? `a temperatura passou de ${fmtGraus(2)} (${fmtGraus(g.temperatura)})` : g.tensao >= 85 ? 'a tensão passou de 85' : 'mais de 150 milhões de deslocados'}.` : '0: o planeta terminou nem tão bem, nem tão mal.';
    return `<p class="rf-saude ${v > 0 ? 'boa' : v < 0 ? 'ruim' : ''}">${ico('🌍', 44)}<span><b>Saúde do planeta no IGI:</b> ${esc(texto)}</span></p>`;
  }

  const SERIES_MUNDO = [
    { k: 'temperatura', nome: 'Temperatura', icone: '🌡️', limiares: [{ valor: 1.5, rotulo: '1,5 Paris', nivel: 'bom' }, { valor: 2, rotulo: '2,0 perigo', nivel: 'risco' }, { valor: 2.2, rotulo: '2,2 colapso', nivel: 'critico' }],
      faixa: [1.3, 2.3], fmt: v => fmtGraus(v), texto: 'graus acima da era pré-industrial' },
    { k: 'tensao', nome: 'Relógio do Juízo Final', icone: '⏰', limiares: [{ valor: 120, rotulo: 'meta 2050', nivel: 'bom' }, { valor: 60, rotulo: 'crise', nivel: 'risco' }, { valor: 0, rotulo: 'meia-noite', nivel: 'critico' }],
      faixa: [0, 180], conv: segundos, fmt: v => Math.round(v) + FINO + 's', texto: 'segundos para a meia-noite (menos = mais perigo)' },
    { k: 'deslocados', nome: 'Pessoas deslocadas', icone: '🧳', limiares: [{ valor: 100, rotulo: 'meta 2050', nivel: 'bom' }, { valor: 150, rotulo: 'emergência', nivel: 'risco' }, { valor: 200, rotulo: 'colapso', nivel: 'critico' }],
      faixa: [80, 210], fmt: v => fmtMilhoes(Math.round(v), true), texto: 'milhões de pessoas fora de casa' },
    { k: 'comercio', nome: 'Comércio mundial', icone: '🚢', limiares: [{ valor: 40, rotulo: 'fragmentado', nivel: 'risco' }, { valor: 75, rotulo: 'acelerado', nivel: 'medio' }],
      faixa: [25, 90], fmt: v => fmt(Math.round(v)), texto: 'índice de 0 a 100' },
    { k: 'cooperacao', nome: 'Cooperação internacional', icone: '🕊️', limiares: [{ valor: 30, rotulo: 'cada um por si', nivel: 'risco' }, { valor: 70, rotulo: 'multilateral', nivel: 'bom' }],
      faixa: [20, 85], fmt: v => fmt(Math.round(v)), texto: 'índice de 0 a 100' },
  ];
  function graficoMundo(e, s) {
    const h = e.historico || [], anos = h.map(x => fmtAno(x.ano)), pts = h.map(x => (s.conv ? s.conv(x.global[s.k]) : x.global[s.k]));
    const lo = Math.min(s.faixa[0], ...pts), hi = Math.max(s.faixa[1], ...pts);
    return linha([{ id: s.k, nome: s.nome, pontos: pts, cor: 'amarelo', icone: s.icone }], { anos, min: lo, max: hi, formatar: s.fmt, titulo: `${s.nome}, de ${anos[0]} a ${anos.at(-1)}`,
      descricao: `${s.nome} (${s.texto}): de ${s.fmt(pts[0])} em ${anos[0]} para ${s.fmt(pts.at(-1))} em ${anos.at(-1)}.`, limiares: s.limiares });
  }
  function manchetesMarcantes(e, n = 4) {
    const cand = (e.manchetes || []).filter(m => m.evento || m.dilema || /^ONU|^Cúpula/.test(m.texto));
    const porAno = new Map();
    for (const m of cand) if (!porAno.has(m.ano)) porAno.set(m.ano, m);
    const l = [...porAno.values()];
    return l.length <= n ? l : Array.from({ length: n }, (_, i) => l[Math.round((i * (l.length - 1)) / (n - 1))]);
  }
  function abaMundo(e) {
    const h = e.historico || [], ini = h[0]?.global || e.global, fimG = e.global;
    const opcoes = SERIES_MUNDO.map((s, i) => {
      const a = s.conv ? s.conv(ini[s.k]) : ini[s.k], b = s.conv ? s.conv(fimG[s.k]) : fimG[s.k];
      return `<button class="opcao peca" role="tab" aria-selected="${i === 0}" aria-controls="rf-g-${s.k}" id="rf-gb-${s.k}" data-k="${s.k}"><span class="soquete">${ico(s.icone, 48)}</span>
        <span><span class="opcao-nome">${esc(s.nome)}</span><span class="opcao-detalhe num">${esc(s.fmt(a))} ${GLIFOS.seta} ${esc(s.fmt(b))}</span></span></button>`;
    }).join('');
    const ms = manchetesMarcantes(e);
    return `<div class="rf-mundo">
      <div class="rf-ind-lista" role="tablist" aria-label="Indicador do gráfico" aria-orientation="vertical">${opcoes}</div>
      <div class="rf-graf peca">${SERIES_MUNDO.map((s, i) => `<div role="tabpanel" id="rf-g-${s.k}" aria-labelledby="rf-gb-${s.k}"${i ? ' hidden' : ''}>${graficoMundo(e, s)}</div>`).join('')}</div>
      <section class="rf-marcantes jornal peca"><header>${cabecalhoJornal({ compacto: true })}<h3>Manchetes marcantes</h3></header>
        <ol>${ms.map(m => `<li><span class="rf-ano num">${fmtAno(m.ano)}</span><span>${comIcones(m.texto)}</span></li>`).join('')}</ol></section></div>`;
  }

  const METRICAS = [
    { k: 'emissoes', nome: 'CO₂ emitido', icone: '🏭', unidade: ' Gt', texto: 'Soma de 2026 a 2050.' },
    { k: 'tensao', nome: 'Tensão causada', icone: '⚠️', unidade: '', texto: 'Pontos de tensão mundial que as decisões de cada um criaram.' },
    { k: 'solidariedade', nome: 'Ajuda e acolhimento', icone: '🤲', unidade: '', texto: 'Vezes que acolheu refugiados, mandou ajuda ou doou.' },
    { k: 'mediacoes', nome: 'Paz mediada', icone: '🕊️', unidade: '', texto: 'Mediações de paz que deram certo.' },
  ];
  const porPessoa = () => {
    if (typeof FICHAS === 'undefined') return '';
    const pid = PIDS.reduce((a, b) => ((FICHAS[b]?.emissoesPerCapita?.valor || 0) > (FICHAS[a]?.emissoesPerCapita?.valor || 0) ? b : a));
    return ` Por pessoa, quem mais emite: ${nomeCurto(pid)} (${fmt(FICHAS[pid].emissoesPerCapita.valor, 1)} t por habitante em 2024).`;
  };
  function graficoContribuicao(r, m) {
    const cols = PIDS.map(pid => ({ pid, valor: Math.round(r.contribuicoes.find(c => c.id === pid)?.[m.k] || 0) }));
    const topo = Math.max(...cols.map(c => c.valor), 1), inteiro = topo <= 10;
    const lider = cols.reduce((a, b) => (b.valor > a.valor ? b : a));
    return barras(cols, { max: inteiro ? Math.max(3, topo) : topo, tijolos: inteiro ? Math.max(3, topo) : 10, unidade: m.unidade, titulo: m.nome,
      descricao: (lider.valor ? `${nomeCurto(lider.pid)} lidera, com ${fmt(lider.valor)}${m.unidade}. ` : 'Ninguém pontuou aqui. ') + m.texto + (m.k === 'emissoes' ? porPessoa() : '') });
  }
  function abaQuem(e, r) {
    const decisoes = PIDS.map(pid => {
      const ds = (e.manchetes || []).filter(m => m.dilema && m.potencia === pid).map(m => {
        const d = dilemaDe(m.dilema), op = d?.opcoes[m.opcao];
        return d && op ? `<li class="cat-${op.categoria}"><span class="rf-ano num">${fmtAno(m.ano)}</span><span><b>${esc(preencher(d.titulo, pid, null))}</b><small>${ico(d.icone, 28)} ${esc(op.resumo)}</small></span></li>` : '';
      }).join('');
      return `<li class="rf-equipe" data-equipe="${pid}"><h4>${formaDe(pid)}${esc(nomeEquipeOu(e)(pid))}</h4><ol>${ds || '<li class="rf-vazio">Nenhum dilema decidido.</li>'}</ol></li>`;
    }).join('');
    return `<div class="rf-quem-fez">
      <section class="rf-contrib peca"><div class="rf-metricas abas" role="tablist" aria-label="O que comparar">${METRICAS.map((m, i) =>
        `<button class="peca" role="tab" aria-selected="${i === 0}" aria-controls="rf-m-${m.k}" id="rf-mb-${m.k}">${ico(m.icone, 40)} ${esc(m.nome)}</button>`).join('')}</div>
        ${METRICAS.map((m, i) => `<div role="tabpanel" id="rf-m-${m.k}" aria-labelledby="rf-mb-${m.k}"${i ? ' hidden' : ''}>${graficoContribuicao(r, m)}</div>`).join('')}</section>
      <section class="rf-decisoes"><h3>${ico('🏛️', 44)} As escolhas de cada equipe nos dilemas</h3><ul>${decisoes}</ul></section></div>`;
  }

  function bnccVivida(e) {
    const fontes = {};
    const add = (codigos, rot) => (codigos || []).forEach(c => { const l = (fontes[c] ||= []); if (!l.includes(rot)) l.push(rot); });
    for (const m of e.manchetes || []) {
      if (m.carta) { const c = politica(m.carta); if (c) add(c.bncc, `Ação “${c.nome}” (${nomeCurto(m.potencia)}, ${fmtAno(m.ano)})`); }
      else if (m.dilema) { const d = dilemaDe(m.dilema); if (d) add([...(d.bncc || []), ...(d.opcoes[m.opcao]?.bncc || [])], `Dilema “${preencher(d.titulo, m.potencia, null)}” (${nomeCurto(m.potencia)}, ${fmtAno(m.ano)})`); }
      else if (m.evento) { const ev = eventoDe(m.evento); if (ev) add([...(ev.bncc || []), ...(ev.escolha?.opcoes || []).flatMap(o => o.bncc || [])], `Evento “${ev.titulo}” (${fmtAno(m.ano)})`); }
      else if (/^Cúpula do Clima/.test(m.texto)) add(['EM13CHS305', 'EM13CHS306'], `Cúpula do Clima (${fmtAno(m.ano)})`);
      else {
        const onu = /^ONU (?:aprova|rejeita): (.+?)(?: \(veto\))?$/.exec(m.texto || ''), res = onu && typeof RESOLUCOES !== 'undefined' ? RESOLUCOES.find(x => x.nome === onu[1]) : null;
        if (res) add(res.bncc, `Votação na ONU: ${res.nome} (${fmtAno(m.ano)})`);
      }
    }
    const base = typeof BNCC !== 'undefined' ? [...(BNCC.habilidades || []), ...(BNCC.outras || [])] : [];
    return Object.entries(e.bncc || {}).sort((a, b) => b[1] - a[1]).map(([codigo, n]) => {
      const h = base.find(x => x.codigo === codigo);
      return { codigo, n, texto: h?.texto || '', grupo: h?.competencia ? `Competência ${h.competencia} de Ciências Humanas` : h?.area || '', fontes: fontes[codigo] || [] };
    }).filter(h => h.texto);
  }
  function abaBncc(e) {
    const hs = bnccVivida(e), vezes = hs.reduce((s, h) => s + h.n, 0);
    return `<div class="rf-bncc">
      <header class="rf-bncc-cab">${kit('prancheta', { classe: 'rf-obj' })}<div><h3>Habilidades da BNCC que a turma viveu</h3>
        <p>${hs.length} habilidades, trabalhadas ${vezes} vezes nas ações, nos eventos e nos dilemas. Não há acertos: a turma aprendeu decidindo e vendo o efeito no mundo.</p></div></header>
      <ul class="rf-hab">${hs.map(h => `<li class="peca"><p class="rf-hab-cab"><b class="rf-codigo num">${esc(h.codigo)}</b><span class="pilula">${esc(h.grupo)}</span>
          <span class="pilula amarela num">vivida ${h.n} ${h.n === 1 ? 'vez' : 'vezes'}</span></p>
        <p class="rf-hab-texto">${esc(h.texto)}</p>
        ${h.fontes.length ? `<p class="rf-hab-onde"><b>No jogo:</b> ${esc(h.fontes.slice(0, 3).join(' · '))}${h.fontes.length > 3 ? ` · e mais ${h.fontes.length - 3}` : ''}</p>` : ''}</li>`).join('') || '<li class="peca">Nenhuma decisão foi registrada nesta partida.</li>'}</ul></div>`;
  }

  function perguntasDebate(e, r) {
    const g = e.global, h0 = e.historico?.[0]?.global || g, q = [], coop = e.config.modo === 'cooperativo';
    const contrib = r.contribuicoes || [], maior = [...contrib].sort((a, b) => b.emissoes - a.emissoes)[0];
    const perCap = typeof FICHAS !== 'undefined' ? PIDS.reduce((a, b) => ((FICHAS[b]?.emissoesPerCapita?.valor || 0) > (FICHAS[a]?.emissoesPerCapita?.valor || 0) ? b : a)) : null;
    if (r.fim.tipo === 'colapso') q.push(`O planeta entrou em colapso em ${fmtAno(e.ano)}. Que decisão, de qualquer equipe, poderia ter mudado essa história?`);
    if (maior) q.push(`A temperatura foi de ${fmtGraus(h0.temperatura)} para ${fmtGraus(g.temperatura)}. Nas emissões da partida, o primeiro lugar ficou com ${com(maior.id, '')}${perCap && perCap !== maior.id ? `; por pessoa, fica com ${com(perCap, '')}` : ''}. Quem deve pagar mais pela troca por energia limpa, e por quê?`);
    const humanas = (e.manchetes || []).filter(m => m.dilema && e.potencias[m.potencia]?.humano);
    const dm = humanas[Math.floor(humanas.length / 2)] || (e.manchetes || []).find(m => m.dilema);
    if (dm) {
      const d = dilemaDe(dm.dilema), op = d?.opcoes[dm.opcao];
      if (d && op) q.push(`${e.potencias[dm.potencia]?.humano ? 'A ' + nomeEquipe(dm.potencia) : 'O governo ' + com(dm.potencia, 'de')} escolheu “${op.resumo}” no dilema “${preencher(d.titulo, dm.potencia, null)}”. Vocês fariam o mesmo? O que se ganha e o que se perde?`);
    }
    q.push(`${fmtMilhoes(Math.round(g.deslocados))} de pessoas viviam fora de casa em 2050. Que responsabilidade os países têm com quem foge de guerras e desastres?`);
    if (coop) q.push(r.infiltrado ? 'Como a turma percebeu (ou não) o infiltrado? Que interesses escondidos existem na política entre países?' : r.vitoria ? 'O que fez a turma conseguir cooperar? Isso funcionaria entre países de verdade?' : 'O que atrapalhou a cooperação? Por que é tão difícil os países agirem juntos?');
    else if (r.vencedor) q.push(`O placar ficou com ${com(r.vencedor, '')}. Vencer valeu a pena com o mundo do jeito que ficou em 2050?`);
    q.push(`O Relógio do Juízo Final terminou a ${segundos(g.tensao)} segundos da meia-noite. Como países rivais podem baixar a tensão sem abrir mão da própria segurança?`);
    return q.slice(0, 5);
  }
  function abaDebate(e, r) {
    return `<div class="rf-debate"><div class="rf-debate-masc">${kit('globo-irado-pensando', { classe: 'destaque', alt: '' })}<p class="balao peca fala" data-ponta="nenhuma">Hora de conversar! Não existe resposta certa: o que vale é o argumento.</p></div>
      <ol class="rf-perguntas">${perguntasDebate(e, r).map((p, i) => `<li class="peca"><span class="rf-num marca" aria-hidden="true">${i + 1}</span><p>${esc(p)}</p></li>`).join('')}</ol></div>`;
  }
  function abaFoto() {
    return `<div class="rf-foto"><figure class="rf-moldura peca"><div class="rf-foto-img" aria-live="polite">${kit('ampulheta', { classe: 'botao' })}<span>Revelando a foto…</span></div>
      <figcaption class="fita-legenda">Foto oficial da Cúpula 2050</figcaption></figure>
      <div class="rf-foto-lado"><h3>${ico('🏛️', 44)} Foto oficial da cúpula</h3><p>As delegações que governaram o mundo de 2026 a 2050, juntas no pedestal.</p>
        <a class="btn btn-principal peca pinos rf-baixar" aria-disabled="true" download="cupula-2050.png">Baixar foto (PNG)</a></div></div>`;
  }

  async function relatorio(t, e, r, avs) {
    const ABAS = [['Resultado', '🏆', abaResultado], ['O mundo em 2050', '📈', abaMundo], ['Quem fez o quê', '⚖️', abaQuem], ['BNCC', '🎓', abaBncc], ['Para debater', '💬', abaDebate], ['Foto', '🏛️', abaFoto]];
    t.innerHTML = `<div class="rf-rel fundo-pinos">
      <header class="rf-cab">${kit('trofeu', { classe: 'rf-trofeu' })}<h1 class="marca letra-bolha relevo">Relatório 2050</h1>
        <div class="abas rf-abas" role="tablist" aria-label="Relatório da partida">${ABAS.map(([n, ic], i) => `<button class="peca" role="tab" id="rf-a${i}" aria-label="${n}" title="${n}" aria-controls="rf-p${i}" aria-selected="${i === 0}">${ico(ic, 40)}<span>${n}</span></button>`).join('')}</div></header>
      <section class="painel peca rf-painel" aria-label="Conteúdo do relatório"><div class="tela">${ABAS.map(([, , f], i) => `<div class="rf-aba" role="tabpanel" id="rf-p${i}" aria-labelledby="rf-a${i}" tabindex="0"${i ? ' hidden' : ''}>${f(e, r, avs)}</div>`).join('')}</div></section>
      <footer class="rf-botoes"><button class="btn btn-neutro peca" data-teste="inicio">${GLIFOS.voltar} Início</button>
        <button class="btn btn-neutro peca" data-teste="novo-jogo">Novo jogo</button>
        <button class="btn btn-principal peca pinos" data-teste="revanche">Revanche! ${GLIFOS.seta}</button></footer></div>`;
    // retratos (Cenas3D.retrato, com cache)
    t.querySelectorAll('[data-retrato]').forEach(el => {
      const av = avs.find(a => a.pid === el.dataset.retrato);
      if (av && typeof Cenas3D !== 'undefined') Cenas3D.retrato(av, { tamanho: 96 }).then(url => { el.insertAdjacentHTML('afterbegin', `<img src="${url}" alt="">`); el.querySelector('svg.forma')?.classList.remove('vazio'); }).catch(() => {});
    });
    // foto oficial: revela em segundo plano (renderizador das cenas)
    let fotoFeita = false;
    const revelarFoto = async () => {
      if (fotoFeita || typeof Cenas3D === 'undefined') return;
      fotoFeita = true;
      try {
        const url = await Cenas3D.foto(avs, 'CÚPULA 2050', { data: new Date().toLocaleDateString('pt-BR') });
        const box = t.querySelector('.rf-foto-img'), a = t.querySelector('.rf-baixar');
        if (!box) return;
        box.innerHTML = `<img src="${url}" alt="Foto oficial da Cúpula 2050: os bonecos das delegações em duas fileiras, sob a faixa CÚPULA 2050">`;
        a.href = url; a.removeAttribute('aria-disabled');
        if (!RM) gsap.fromTo(box.firstElementChild, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: .6, ease: 'power2.out' });
      } catch { t.querySelector('.rf-foto-img').innerHTML = '<span>A foto não pôde ser revelada neste computador.</span>'; }
    };
    const animar = el => {
      if (RM) return gsap.fromTo(el.children, { opacity: 0 }, { opacity: 1, duration: .18 });
      gsap.fromTo(el.querySelectorAll('.rf-bloco, .rf-linha, .rf-hab > li, .rf-perguntas > li, .rf-graf, .rf-ind-lista > *, .rf-marcantes, .rf-contrib, .rf-equipe, .rf-moldura, .rf-foto-lado, .rf-debate-masc'),
        { opacity: 0, y: 1.4 * u() }, { opacity: 1, y: 0, duration: .3, stagger: .04, ease: 'power2.out' });
    };
    ativarAbas(t.querySelector('.rf-abas'), (aba, i) => { animar(t.querySelector(`#rf-p${i}`)); if (i === 5) revelarFoto(); anunciar(ABAS[i][0]); });
    t.querySelectorAll('.rf-ind-lista, .rf-metricas').forEach(l => ativarAbas(l));
    if (!RM) gsap.fromTo(t.querySelectorAll('.rf-cab, .rf-painel, .rf-botoes'), { opacity: 0, y: 2 * u() }, { opacity: 1, y: 0, duration: .4, stagger: .08, ease: 'back.out(1.4)' });
    t.querySelector('.rf-abas [aria-selected="true"]').focus({ preventScroll: true });
    setTimeout(revelarFoto, RAPIDO ? 100 : 1500);
    return aguardar(new Promise(ok => t.querySelector('.rf-botoes').addEventListener('click', ev => {
      const b = ev.target.closest('[data-teste]');
      if (!b) return;
      som('clique');
      ok({ revanche: 'revanche', 'novo-jogo': 'novo', inicio: 'inicio' }[b.dataset.teste]);
    })));
  }

  async function fimPartida(e, avatares = []) {
    const r = Simulacao.resultado(e), t = $('#tela-fim'), res = textoResultado(e, r);
    const avs = PIDS.map(pid => ({ pid, nome: nomeEquipe(pid), cor: corDe(pid), forma: corDe(pid, 'forma'), humano: !!e.potencias[pid]?.humano, ...(avatares.find(a => a.pid === pid) || {}) }));
    t.classList.add('rel-fim');
    t.innerHTML = '';
    mostrarTela('fim');
    const colapso = r.fim.tipo === 'colapso';
    try {
      await splash(colapso
        ? { pre: `Fim da partida em ${fmtAno(e.ano)}`, titulo: 'Colapso', sub: 'O planeta passou do limite', cor: '#8A94A6', escuro: true, icone: kit('globo-irado-susto'), som: 'alarme' }
        : { pre: 'Missão 2050', titulo: '2050', sub: 'O último mandato terminou', cor: 'amarelo', raios: true, icone: kit('selo-missao-2050') });
      await cenaResultado(t, e, r, avs, res);
      if (!colapso && e.config.modo !== 'cooperativo') await cenaPodio(t, e, r, avs);
      if (typeof Cenas3D !== 'undefined') Cenas3D.esconder();
      if (typeof Mapa3D !== 'undefined') Mapa3D.pausar?.(true);
      const escolha = await relatorio(t, e, r, avs);
      return escolha;
    } finally {
      try { if (typeof Cenas3D !== 'undefined' && Cenas3D.ativa) Cenas3D.esconder(); } catch { /* nada */ }
      try { if (typeof Mapa3D !== 'undefined') Mapa3D.pausar?.(false); } catch { /* sem mapa */ }
      t.innerHTML = '';
      t.classList.remove('rel-fim');
    }
  }

  return { balanco, fim: fimPartida, linha, barras, causas };
})();
