// Gera docs/COMO-JOGAR.md a partir do Manual do Diplomata (conteudo/manual.js), trocando os marcadores {{...}}
// pelos valores atuais de Simulacao.PARAM e acrescentando tabelas tiradas dos dados (potências, ações, dilemas, eventos
// com decisão, ONU, missões).
// Uso: node ferramentas/gerar-como-jogar.mjs   (rode de novo sempre que mudar o manual ou o balanceamento)
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const RAIZ = new URL('..', import.meta.url).pathname;
const ctx = vm.createContext({});
['conteudo/potencias.js', 'conteudo/territorios.js', 'conteudo/politicas.js', 'conteudo/resolucoes.js', 'conteudo/eventos.js', 'conteudo/dilemas.js',
  'conteudo/manual.js', 'js/simulacao.js']
  .forEach(f => vm.runInContext(readFileSync(RAIZ + f, 'utf8'), ctx, { filename: f }));
const [MANUAL, GLOSSARIO, POTENCIAS, POLITICAS, CATEGORIAS, ACOES_FIXAS, RESOLUCOES, MISSOES, AGENDAS, EVENTOS, DILEMAS, S] =
  ['MANUAL', 'GLOSSARIO', 'POTENCIAS', 'POLITICAS', 'CATEGORIAS', 'ACOES_FIXAS', 'RESOLUCOES', 'MISSOES', 'AGENDAS', 'EVENTOS', 'DILEMAS', 'Simulacao'].map(n => vm.runInContext(n, ctx));
const P = S.PARAM;

// Números que o texto do manual escreve por extenso (sem marcador): se o balanceamento mudar, avisa para revisar o manual
const CITADOS = { cpBase: 3, cpGuardaMax: 1, copSucesso: 7, pressaoReacao: 60, pressaoQueda: 10, estoqueMax: 12, vendeAcima: 8,
  eventosPorRodada: 1, eventosEmCrise: 2, resistenciaBase: 3, margemParceria: 2, igiParceiro: 3, igiLideranca: 6, igiMissao: 12, igiSelo: 4, igiPlaneta: 10,
  pesosIGI: { bemEstar: 2, economia: 1.5, ambiente: 1, seguranca: 1, apoio: .5 },
  mediacao: { base: .3, porInfluencia: .06, influenciaMax: .3, cooperacao: .006, estabilidade: .004, porNivel: .1, parte: .3, vizinho: .1, min: .05, max: .9 } };
const mudou = Object.entries(CITADOS).filter(([k, v]) => JSON.stringify(P[k]) !== JSON.stringify(v));
if (mudou.length) console.warn('⚠ conteudo/manual.js cita valores que mudaram em Simulacao.PARAM; revise o texto: ' +
  mudou.map(([k, v]) => `${k} (manual: ${JSON.stringify(v)}, agora: ${JSON.stringify(P[k])})`).join(', '));

const num = (v, casas) => v.toLocaleString('pt-BR', casas ? { minimumFractionDigits: casas, maximumFractionDigits: 2 } : { maximumFractionDigits: 2 });
const M = P.mediacao, pct = v => `${num(Math.round(v * 1000) / 10)}%`;
// {{colapso.temperatura}} → "2,2"; marcador desconhecido derruba o gerador (o documento nunca sai com chaves cruas)
function marcador(_, caminho) {
  const v = caminho.split('.').reduce((o, k) => o?.[k], P);
  if (typeof v !== 'number') throw new Error(`Marcador sem valor em Simulacao.PARAM: {{${caminho}}}`);
  return num(v, caminho.includes('temperatura') ? 1 : 0);
}
const md = html => html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, marcador)
  .replace(/<h3>(.*?)<\/h3>/g, '\n### $1\n').replace(/<p>(.*?)<\/p>/gs, '\n$1\n')
  .replace(/<\/?ul>/g, '\n').replace(/<li>(.*?)<\/li>/gs, '- $1').replace(/<b>(.*?)<\/b>/g, '**$1**').replace(/<i>(.*?)<\/i>/g, '*$1*')
  .replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();

const RECURSOS = { alimentos: '🌾', energia: '⚡', minerais: '💎', tecnologia: '💻' };
const custo = c => [c.cp ? `${c.cp} CP` : 'sem CP', c.economia ? `${c.economia} 💰` : '', ...Object.keys(RECURSOS).filter(r => c[r]).map(r => `${c[r]} ${RECURSOS[r]}`)].filter(Boolean).join(' + ');
const ALVO = { nenhum: '—', territorio: 'território', potencia: 'potência', territorios3: 'até 3 territórios' };
const linha = cels => `| ${cels.join(' | ')} |`;

const partes = [
  '# Geografia Irada — Como jogar (Manual do Diplomata)',
  '> Versão em documento do manual que aparece no jogo. **Gerado por `ferramentas/gerar-como-jogar.mjs`**: não edite à mão.\n' +
  '> Edite `conteudo/manual.js` (ou o balanceamento em `js/simulacao.js`) e rode `node ferramentas/gerar-como-jogar.mjs`.\n' +
  `> Os números abaixo são os valores atuais do motor (\`Simulacao.PARAM\`), conferidos em ${new Date().toLocaleDateString('pt-BR')}.`,
  '## Sumário\n\n' + MANUAL.map(s => `- ${s.icone} ${s.titulo}`).join('\n') + '\n- 📖 Glossário de geopolítica\n- 🔢 Anexo: os números do jogo',
  ...MANUAL.map(s => `## ${s.icone} ${s.titulo}\n\n${md(s.html)}`),
  '## 📖 Glossário de geopolítica\n\n' + GLOSSARIO.map(g => `- **${g.termo}:** ${g.definicao}`).join('\n'),
  '## 🔢 Anexo: os números do jogo\n\nTabelas geradas dos arquivos de dados. Os valores 0–100 são uma aproximação didática de dados reais.',
  '### As seis potências\n\n' + [linha(['Potência', 'Força', 'Fraqueza', 'Veto na ONU']), linha(['---', '---', '---', '---']),
    ...POTENCIAS.map(p => linha([`${p.emblema} ${p.nome}`, `**${p.forca.titulo}:** ${p.forca.texto}`, `**${p.fraqueza.titulo}:** ${p.fraqueza.texto}`, p.permanente ? 'sim' : 'não']))].join('\n'),
  '### Indicadores, produção e consumo em 2026\n\n' + [
    linha(['Potência', '💰', '❤️', '🌳', '🛡️', '🗳️', '⚡ limpa %', 'Produz por mandato', 'Consome por mandato']), linha(Array(9).fill('---')),
    ...POTENCIAS.map(p => linha([p.nome, p.inicial.economia, p.inicial.bemEstar, p.inicial.ambiente, p.inicial.seguranca, p.inicial.apoio, p.inicial.limpa,
      Object.entries(p.producao).map(([r, n]) => `${n} ${RECURSOS[r]}`).join(' · ') + (p.id === 'brasil' ? ' (+1 🌾 pela força)' : ''),
      Object.entries(p.consumo).map(([r, n]) => `${n} ${RECURSOS[r]}`).join(' · ')]))].join('\n'),
  '### O mundo em 2026 e os limites\n\n' + [linha(['Indicador', 'Início', 'Meta 2050 (cooperativo)', 'Colapso']), linha(['---', '---', '---', '---']),
    linha(['🌡️ Temperatura (°C acima do pré-industrial)', num(P.globalInicial.temperatura, 1), `abaixo de ${num(P.metas.temperatura, 1)}`, `${num(P.colapso.temperatura, 1)} ou mais`]),
    linha(['⏰ Tensão mundial (0–100)', P.globalInicial.tensao, `abaixo de ${P.metas.tensao}`, `${P.colapso.tensao}`]),
    linha(['🧳 Pessoas deslocadas (milhões)', P.globalInicial.deslocados, `menos de ${P.metas.deslocados}`, `${P.colapso.deslocados} ou mais`]),
    linha(['🚢 Comércio global (0–100)', P.globalInicial.comercio, '—', '—']),
    linha(['🕊️ Cooperação internacional (0–100)', P.globalInicial.cooperacao, '—', '—']),
    linha(['🛢️ Preço da energia (50 = normal)', P.globalInicial.energia, '—', '—']),
    linha(['📈 Desenvolvimento médio dos territórios', '—', `${P.metas.desenvolvimento} ou mais`, '—'])].join('\n'),
  '### Regras em números\n\n' + [
    `- Capital Político por vez: ${P.cpBase} de base; +1 com apoio de 70 ou mais e −1 abaixo de 30; +1 por liderança continental; até ${P.cpGuardaMax} guardado para a vez seguinte.`,
    `- Mediação de paz: chance de ${pct(M.base)} + ${pct(M.porInfluencia)} por ponto de influência no lugar (até +${pct(M.influenciaMax)}) + (cooperação − 45) × ${pct(M.cooperacao)}` +
      ` + (estabilidade − 35) × ${pct(M.estabilidade)} − ${pct(M.porNivel)} por nível de conflito acima de 1 − ${pct(M.parte)} se for parte do conflito (ou −${pct(M.vizinho)} se for vizinha),` +
      ` sempre entre ${pct(M.min)} e ${pct(M.max)}.`,
    `- Eventos por mandato: ${P.eventosPorRodada} (${P.eventosEmCrise} com o mundo em crise).`,
    `- Cúpula do Clima: acordo com ${P.copSucesso} pontos ou mais (compromisso alto = 2, médio = 1).`,
    `- Parceria: influência de pelo menos ${P.resistenciaBase} + (estabilidade ÷ 25, arredondado para baixo) e ${P.margemParceria} à frente da segunda potência.`,
    `- Reação soberanista com pressão ${P.pressaoReacao}; a pressão cai ${P.pressaoQueda} por Balanço.`,
    `- Estoque máximo de ${P.estoqueMax} de cada recurso; acima de ${P.vendeAcima}, o excedente é vendido.`,
    `- IGI: 100 + ${Object.entries(P.pesosIGI).map(([k, w]) => `${num(w)} × Δ${{ bemEstar: 'bem-estar', economia: 'economia', ambiente: 'ambiente', seguranca: 'segurança', apoio: 'apoio' }[k]}`).join(' + ')}` +
      ` + ${P.igiParceiro} por parceiro + ${P.igiLideranca} por liderança continental + ${P.igiMissao} pela missão + ${P.igiSelo} por selo ± ${P.igiPlaneta} pela saúde do planeta.`,
  ].join('\n'),
  '### Ações de governo\n\nSempre disponíveis: ' + ACOES_FIXAS.map(id => POLITICAS.find(c => c.id === id).nome).join(', ') +
    ' e Negociar (troca de recursos, sem CP). As demais são sorteadas, uma por categoria, a cada vez.\n\n' +
    Object.entries(CATEGORIAS).map(([cat, c]) => `#### ${c.icone} ${c.nome}\n\n` + [linha(['Ação', 'Custo', 'Alvo', 'Por quê', 'Conceito']), linha(Array(5).fill('---')),
      ...POLITICAS.filter(p => p.categoria === cat).map(p => linha([`${p.icone} ${p.nome}`, custo(p.custo), ALVO[p.alvo] || p.alvo, p.porque, p.conceito]))].join('\n')).join('\n\n'),
  `### Dilemas de governo (${DILEMAS.length})\n\nUm por vez, sem repetir na partida e sem resposta certa. O ícone mostra a categoria do conselheiro de cada saída.\n\n` +
    [linha(['Dilema', 'Para quem', 'Saídas', 'Conceito', 'BNCC']), linha(Array(5).fill('---')),
      ...DILEMAS.map(d => linha([`${d.icone} ${d.titulo} (\`${d.id}\`)`, d.potencias ? d.potencias.map(id => POTENCIAS.find(p => p.id === id).nome).join(', ') : 'todas',
        d.opcoes.map(o => `${CATEGORIAS[o.categoria].icone} ${o.resumo}`).join(' · '), d.conceito, d.bncc.join(', ')]))].join('\n'),
  '### Eventos que pedem a decisão de todas as potências\n\n' + EVENTOS.filter(ev => ev.escolha?.tipo === 'decisao').map(ev => {
    const op = ev.escolha.opcoes, col = ev.escolha.coletivo;
    return `- **${ev.icone} ${ev.titulo}** (\`${ev.id}\`): ${op.map(o => `${CATEGORIAS[o.categoria].icone} ${o.resumo}`).join(' · ')}` +
      (col ? `. Ação coletiva: ${col.min} ou mais potências escolhendo “${op[col.opcao].resumo}”.` : '.');
  }).join('\n'),
  '### Resoluções da ONU\n\n' + [linha(['Resolução', 'Órgão', 'O que propõe']), linha(['---', '---', '---']),
    ...RESOLUCOES.map(r => linha([`${r.icone} ${r.nome}`, r.orgao === 'cs' ? 'Conselho de Segurança' : 'Assembleia Geral', r.texto]))].join('\n'),
  '### Missões secretas\n\n' + MISSOES.map(m => `- **${m.nome}:** ${m.texto}`).join('\n') +
    '\n\n### Agendas do agente infiltrado\n\n' + AGENDAS.map(a => `- **${a.nome}:** ${a.texto}`).join('\n'),
];
writeFileSync(RAIZ + 'docs/COMO-JOGAR.md', partes.join('\n\n') + '\n');
console.log(`docs/COMO-JOGAR.md: ${MANUAL.length} seções, ${GLOSSARIO.length} termos, ${POLITICAS.length} ações`);
