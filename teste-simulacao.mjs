// Teste do motor da simulação: joga milhares de partidas só com o computador e confere regras e equilíbrio.
// Uso: node teste-simulacao.mjs [partidas por cenário]   (Node 18+; não precisa de navegador)
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const PASTA = new URL('.', import.meta.url).pathname;
const ARQUIVOS = ['dados/mapa.js', 'conteudo/potencias.js', 'conteudo/territorios.js', 'conteudo/politicas.js',
  'conteudo/eventos.js', 'conteudo/resolucoes.js', 'conteudo/dilemas.js', 'js/simulacao.js'];
const ctx = vm.createContext({ console, Math, JSON });
for (const f of ARQUIVOS) vm.runInContext(readFileSync(PASTA + f, 'utf8'), ctx, { filename: f });
const S = vm.runInContext('Simulacao', ctx);
const DILEMAS = vm.runInContext('DILEMAS', ctx);
const N = +process.argv[2] || 300;

// Escolhas dos dilemas em todas as partidas: id → [contagem por opção] (para ver se há "resposta certa")
const escolhasDilema = {};

// Joga uma partida inteira só com a IA, resolvendo eventos, decisões, votações e cúpulas como a interface faria
function jogar(config) {
  const e = S.criarEstado(config);
  const pids = Object.keys(e.potencias);
  const conta = { cartas: 0, dilemas: 0, eventos: 0, semDilema: 0 };
  while (!e.fim) {
    for (const { id, local } of S.sortearEventos(e)) {
      const { escolha } = S.aplicarEvento(e, id, local);
      if (escolha?.tipo === 'votacao') {
        const res = { id: escolha.resolucao, alvo: escolha.resolucao === 'missao_paz' ? local : null, proponente: null };
        S.votacao(e, res, Object.fromEntries(pids.map(p => [p, S.iaVoto(e, p, res)])));
      }
      if (escolha?.tipo === 'doacao') S.resolverDoacao(e, id, local, Object.fromEntries(pids.map(p => [p, S.iaDoacao(e, p, escolha.recurso)])));
      if (escolha?.tipo === 'decisao') {
        const r = S.resolverDecisao(e, id, local, Object.fromEntries(pids.map(p => [p, S.iaDecisao(e, p, id)])));
        if (r.manchetes.length < pids.length) throw new Error(`decisão ${id} sem manchete para todas as potências`);
        conta.eventos += pids.length;
      }
      if (escolha && !['votacao', 'doacao', 'decisao'].includes(escolha.tipo)) throw new Error(`escolha desconhecida ${escolha.tipo}`);
    }
    if (S.copNestaRodada(e)) S.resolverCop(e, Object.fromEntries(pids.map(p => [p, S.iaCop(e, p)])));
    for (const pid of S.ordemDaRodada(e)) {
      const jogadas = S.iaJogarVez(e, pid);
      if (jogadas.some(j => j.tipo === 'briefing')) throw new Error('a IA ainda faz briefing');
      const d = jogadas.find(j => j.tipo === 'dilema');
      if (d) {
        conta.dilemas++;
        (escolhasDilema[d.id] ||= DILEMAS.find(x => x.id === d.id).opcoes.map(() => 0))[d.opcao]++;
        if (!d.resultado?.manchete || !d.resultado.porque) throw new Error(`dilema ${d.id} sem manchete ou porquê`);
      } else conta.semDilema++;
      conta.cartas += jogadas.filter(j => j.tipo === 'carta').length;
    }
    S.balanco(e);
    if (e.rodada > 20) throw new Error('partida não terminou');
  }
  if (new Set(e.dilemasUsados).size !== e.dilemasUsados.length) throw new Error('dilema repetido na partida');
  return { e, r: S.resultado(e), conta, decisoes: conta.cartas + conta.dilemas + conta.eventos };
}

// Contrato com a interface (docs/ARQUITETURA.md, "Dilemas e decisões"), como uma equipe humana usaria
function conferirContrato() {
  const falha = m => { throw new Error('contrato: ' + m); };
  const chaves = (o, k) => JSON.stringify(Object.keys(o).sort()) === JSON.stringify([...k].sort());
  const e = S.criarEstado({ semente: 42, jogadores: [{ potencia: 'brasil', nome: 'Equipe Verde' }] });
  S.iniciarVez(e, 'brasil');
  const d = S.dilemaDaVez(e, 'brasil');
  if (!d || !d.id || !d.titulo || !d.texto || !d.icone || !d.conceito || !(d.opcoes.length >= 2 && d.opcoes.length <= 3)) falha('dilemaDaVez sem os campos');
  if (!d.opcoes.every(o => chaves(o, ['texto', 'resumo', 'categoria']))) falha('opção do dilema deve ter só texto, resumo e categoria');
  if (/\{(quem|local)\}/.test(JSON.stringify(d))) falha('marcador {quem}/{local} não foi trocado');
  if (S.dilemaDaVez(e, 'brasil').id !== d.id) falha('pedir de novo na mesma vez deve devolver o mesmo dilema');
  const r = S.resolverDilema(e, 'brasil', d.id, 0);
  if (!chaves(r, ['mudancas', 'manchete', 'porque', 'conceito']) || !r.manchete || !r.porque) falha('resolverDilema fora do formato');
  if (S.resolverDilema(e, 'brasil', d.id, 1).mudancas.length) falha('o mesmo dilema não pode ser resolvido duas vezes');
  if (S.dilemaDaVez(e, 'brasil') !== null) falha('depois de decidir, a vez não tem outro dilema');
  const t = Object.values(e.territorios).find(x => x.conflito >= 2), m = S.chanceMediacao(e, 'brasil', t.id);
  if (!(m.chance >= .05 && m.chance <= .9) || !m.fatores.every(f => f.texto && Number.isFinite(f.valor))) falha('chanceMediacao fora do formato');
  if (S.chanceMediacao(e, 'russia', 'leste_europeu').chance >= S.chanceMediacao(e, 'ue', 'leste_europeu').chance) falha('ser parte do conflito deve atrapalhar a mediação');
  const { escolha } = S.aplicarEvento(e, 'desinformacao', null);
  if (escolha?.tipo !== 'decisao' || !escolha.opcoes.every(o => chaves(o, ['texto', 'resumo', 'categoria']))) falha('escolha de decisão fora do formato');
  const rd = S.resolverDecisao(e, 'desinformacao', null, { brasil: 1, eua: S.iaDecisao(e, 'eua', 'desinformacao') });
  if (!Array.isArray(rd.mudancas) || rd.manchetes.length !== 2) falha('resolverDecisao fora do formato');
  const ia = S.iaJogarVez(e, 'china');
  if (ia[0]?.tipo !== 'dilema' || !Number.isInteger(ia[0].opcao)) falha('iaJogarVez deve começar pelo dilema');
}
conferirContrato();

const valoresOk = e => {
  const ruins = [];
  const conferir = (nome, v, a, b) => { if (!Number.isFinite(v) || v < a - 1e-6 || v > b + 1e-6) ruins.push(`${nome}=${v}`); };
  for (const [k, v] of Object.entries(e.global)) conferir('global.' + k, v, 0, 400);
  for (const p of Object.values(e.potencias)) {
    for (const k of ['economia', 'bemEstar', 'ambiente', 'seguranca', 'apoio', 'limpa', 'militar']) conferir(p.id + '.' + k, p[k], 0, 100);
    for (const [r, v] of Object.entries(p.recursos)) conferir(p.id + '.recursos.' + r, v, 0, 12);
    conferir(p.id + '.cp', p.cp, 0, 20);
    for (const [k, v] of Object.entries(p.contadores)) conferir(p.id + '.contadores.' + k, v, 0, 1000);
  }
  for (const t of Object.values(e.territorios)) {
    for (const k of ['desenvolvimento', 'estabilidade', 'pressao']) conferir(t.id + '.' + k, t[k], 0, 100);
    conferir(t.id + '.conflito', t.conflito, 0, 3);
    for (const [p, v] of Object.entries(t.influencia)) conferir(`${t.id}.influencia.${p}`, v, 0, 10);
  }
  return ruins;
};
const mediana = l => { const a = [...l].sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
const pct = (n, d) => Math.round(100 * n / d) + '%';

// Metas: docs/DESIGN.md §13
const CENARIOS = [
  { nome: 'IA padrão, competitivo, 6 rodadas', config: { perfilIA: 'padrao', rodadas: 6 },
    metas: { colapsoMax: .25, colapsoMin: .02, tMin: 1.85, tMax: 2.25, vitoriaMax: .30, vitoriaMin: .05, tensao: [60, 80], deslocados: [100, 160], decisoes: [60, 120] } },
  { nome: 'IA gananciosa (só economia)', config: { perfilIA: 'ganancioso', rodadas: 6 }, metas: { colapsoMin: .5 } },
  { nome: 'IA cooperativa, modo cooperativo', config: { perfilIA: 'cooperativo', modo: 'cooperativo', rodadas: 6 }, metas: { colapsoMenor: .05, coopVitoria: [.4, .8] } },
  { nome: 'IA padrão, partida rápida (4 rodadas)', config: { perfilIA: 'padrao', rodadas: 4 }, metas: {} },
  { nome: 'IA padrão, partida longa (8 rodadas)', config: { perfilIA: 'padrao', rodadas: 8 }, metas: {} },
];

let falhas = 0;
for (const c of CENARIOS) {
  const res = [], erros = [];
  for (let i = 0; i < N; i++) {
    try {
      const x = jogar({ ...c.config, semente: 1000 + i, dificuldade: i % 4 });
      const ruins = valoresOk(x.e);
      if (ruins.length) erros.push(`semente ${1000 + i}: ${ruins.slice(0, 4).join(', ')}`);
      res.push(x);
    } catch (err) { erros.push(`semente ${1000 + i}: ${err.stack.split('\n').slice(0, 3).join(' | ')}`); }
  }
  const col = res.filter(x => x.r.fim.tipo === 'colapso');
  const causas = {};
  col.forEach(x => (causas[x.r.fim.causa] = (causas[x.r.fim.causa] || 0) + 1));
  const temps = res.map(x => x.e.global.temperatura), tens = res.map(x => x.e.global.tensao), desl = res.map(x => x.e.global.deslocados);
  const vit = Object.fromEntries(Object.keys(res[0]?.e.potencias || {}).map(k => [k, 0]));
  res.filter(x => x.r.vencedor).forEach(x => vit[x.r.vencedor]++);
  const venc = res.filter(x => x.r.vencedor).length || 1;
  const coopV = res.filter(x => x.r.vitoria).length;
  const dec = res.map(x => x.decisoes), igis = res.flatMap(x => x.r.placar.map(p => p.total));
  const media = k => (res.reduce((s, x) => s + x.conta[k], 0) / Math.max(1, res.length)).toFixed(1);
  const parceiros = res.map(x => Object.values(x.e.territorios).filter(t => t.parceiro).length);
  console.log(`\n▶ ${c.nome} — ${res.length} partidas`);
  console.log(`  colapso ${pct(col.length, res.length)} ${JSON.stringify(causas)} · temperatura final mediana ${mediana(temps).toFixed(2)} (min ${Math.min(...temps).toFixed(2)}, máx ${Math.max(...temps).toFixed(2)})`);
  console.log(`  tensão mediana ${mediana(tens).toFixed(0)} · deslocados mediana ${mediana(desl).toFixed(0)} M · parceiros no fim ${mediana(parceiros)}`);
  console.log(`  decisões/partida ${mediana(dec)} (média: ações ${media('cartas')} + dilemas ${media('dilemas')} + decisões em eventos ${media('eventos')}; vezes sem dilema ${media('semDilema')})`);
  console.log(`  IGI ${Math.min(...igis)}–${Math.max(...igis)} (mediana ${mediana(igis)}) · vitórias ${Object.entries(vit).map(([k, v]) => `${k} ${pct(v, venc)}`).join(', ')}${c.config.modo === 'cooperativo' ? ` · vitória cooperativa ${pct(coopV, res.length)}` : ''}`);
  const porPot = {};
  res.forEach(x => x.r.placar.forEach(p => { const o = (porPot[p.id] ||= { igi: 0, parc: 0, eco: 0, bem: 0, n: 0 }); o.igi += p.total; o.parc += p.partes.parceiros / 3; o.eco += x.e.potencias[p.id].economia - x.e.potencias[p.id].inicial.economia; o.bem += x.e.potencias[p.id].bemEstar - x.e.potencias[p.id].inicial.bemEstar; o.n++; }));
  console.log('  por potência (IGI · parceiros · Δ💰 · Δ❤️): ' + Object.entries(porPot).map(([k, o]) => `${k} ${Math.round(o.igi / o.n)}·${(o.parc / o.n).toFixed(1)}·${(o.eco / o.n).toFixed(1)}·${(o.bem / o.n).toFixed(1)}`).join('  '));
  const m = c.metas, problemas = [...erros.slice(0, 5)];
  const tc = col.length / Math.max(1, res.length), fora = (v, [a, b]) => v < a || v > b;
  if (m.colapsoMax !== undefined && tc > m.colapsoMax) problemas.push(`colapso alto demais (${pct(col.length, res.length)} > ${m.colapsoMax * 100}%)`);
  if (m.colapsoMenor !== undefined && tc >= m.colapsoMenor) problemas.push(`colapso alto demais (${pct(col.length, res.length)} ≥ ${m.colapsoMenor * 100}%)`);
  if (m.colapsoMin !== undefined && tc < m.colapsoMin) problemas.push(`colapso raro demais (${pct(col.length, res.length)} < ${m.colapsoMin * 100}%)`);
  if (m.tMin !== undefined && mediana(temps) < m.tMin) problemas.push(`temperatura mediana baixa (${mediana(temps).toFixed(2)})`);
  if (m.tMax !== undefined && mediana(temps) > m.tMax) problemas.push(`temperatura mediana alta (${mediana(temps).toFixed(2)})`);
  if (m.tensao && fora(mediana(tens), m.tensao)) problemas.push(`tensão mediana fora de ${m.tensao.join('–')} (${mediana(tens).toFixed(0)})`);
  if (m.deslocados && fora(mediana(desl), m.deslocados)) problemas.push(`deslocados medianos fora de ${m.deslocados.join('–')} (${mediana(desl).toFixed(0)})`);
  if (m.decisoes && fora(mediana(dec), m.decisoes)) problemas.push(`decisões por partida fora de ${m.decisoes.join('–')} (${mediana(dec)})`);
  if (m.vitoriaMax !== undefined && Object.values(vit).some(v => v / venc > m.vitoriaMax)) problemas.push(`uma potência vence mais de ${m.vitoriaMax * 100}%`);
  if (m.vitoriaMin !== undefined && Object.values(vit).some(v => v / venc < m.vitoriaMin)) problemas.push(`uma potência vence menos de ${m.vitoriaMin * 100}%`);
  if (m.coopVitoria && fora(coopV / res.length, m.coopVitoria)) problemas.push(`vitória cooperativa fora de ${m.coopVitoria.map(x => x * 100 + '%').join('–')} (${pct(coopV, res.length)})`);
  if (erros.length) problemas.push(`${erros.length} partida(s) com erro ou valor inválido`);
  problemas.forEach(p => console.log('   ✗ ' + p));
  if (problemas.length) falhas++;
}

// Dilemas: nenhum deveria ter "resposta certa" (uma opção que o computador sempre escolhe ou nunca escolhe)
const nuncaSaiu = DILEMAS.filter(d => !escolhasDilema[d.id]).map(d => d.id);
const tortos = Object.entries(escolhasDilema).map(([id, v]) => {
  const total = v.reduce((s, x) => s + x, 0), maior = Math.max(...v) / total;
  return { id, total, maior, nunca: v.map((x, i) => (x ? null : i)).filter(i => i !== null) };
}).filter(x => x.total >= 30 && (x.maior > .9 || x.nunca.length));
console.log(`\nDilemas: ${Object.keys(escolhasDilema).length} de ${DILEMAS.length} apareceram${nuncaSaiu.length ? ` (nunca: ${nuncaSaiu.join(', ')})` : ''}`);
tortos.forEach(x => console.log(`  ⚠ ${x.id}: ${x.nunca.length ? `opção ${x.nunca.join(', ')} nunca escolhida` : `uma opção leva ${Math.round(x.maior * 100)}%`} (${x.total} vezes)`));
console.log(falhas ? `\n${falhas} cenário(s) fora das metas` : '\nTudo dentro das metas!');
process.exit(falhas ? 1 : 0);
