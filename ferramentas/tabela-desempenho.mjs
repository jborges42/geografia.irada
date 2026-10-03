// Tabela por mandato de `node teste.mjs --medir x.json` (Markdown para docs/trabalho/DESEMPENHO.md).
// Uso: node ferramentas/tabela-desempenho.mjs x.json [y.json …]
import { readFileSync } from 'node:fs';
const f = (v, d = 1) => v == null ? '–' : String(+(+v).toFixed(d)).replace('.', ',');
for (const arq of process.argv.slice(2)) {
  const { tabela, cpu, software } = JSON.parse(readFileSync(arq, 'utf8'));
  console.log(`\n${arq} (CPU ${cpu}×${software ? ', sem GPU' : ''})\n`);
  console.log('| mandato | constr. | heap MB | DOM | tweens (soltos) | draw calls/s | CPU ms/quadro mapa | FPS mandato (p95 ms) | quadros > 50 ms | maior tarefa ms (> 200 ms) | FPS parado | travadas de entrada ms (plantão / ONU / balanço / vez) |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const l of tabela) {
    const e = l.entradas || {};
    console.log(`| ${l.rodada} | ${l.construcoes ?? '–'} | ${f(l.heap)} | ${l.dom} | ${l.tweens} (${l.tweensSoltos}) | ${f(l.callsSeg / 1000)} mil | ${f(l.cpuQuadro)} | ${f(l.fpsMandato)} (${f(l.p95Mandato, 0)}) | ${f(l.pctLentos)}% | ${l.maiorTarefa} (${l.tarefas200}) | ${f(l.fps)} | ${e.plantao ?? '–'} / ${e.cena ?? '–'} / ${e.balanco ?? '–'} / ${Math.max(e.decisoes || 0, e.computador || 0) || '–'} |`);
  }
}
