// Confere o conteúdo editável (dilemas, eventos, fichas, manual, BNCC): formato, ids, efeitos, códigos BNCC e quantidades.
// Uso: node ferramentas/validar-conteudo.mjs [dilemas|eventos|fichas|manual|bncc]   (sem argumento, confere tudo)
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const RAIZ = new URL('..', import.meta.url).pathname;
const so = process.argv[2];
const ctx = vm.createContext({ console });
const carregar = f => { if (existsSync(RAIZ + f)) vm.runInContext(readFileSync(RAIZ + f, 'utf8'), ctx, { filename: f }); return existsSync(RAIZ + f); };
['dados/mapa.js', 'conteudo/potencias.js', 'conteudo/territorios.js', 'conteudo/politicas.js', 'conteudo/eventos.js', 'conteudo/resolucoes.js',
  'conteudo/dilemas.js', 'js/simulacao.js'].forEach(carregar);
const temFichas = carregar('conteudo/fichas.js'), temManual = carregar('conteudo/manual.js'), temBncc = carregar('conteudo/bncc.js');
const g = n => { try { return vm.runInContext(n, ctx); } catch { return undefined; } };

const problemas = [], avisos = [];
const S = g('Simulacao');
const POT = new Set(g('POTENCIAS').map(p => p.id)), TER = new Set(g('TERRITORIOS').map(t => t.id)), ids = new Set([...POT, ...TER]);
const CATEGORIAS = Object.keys(g('CATEGORIAS'));
const bnccOk = c => /^EM13(CHS[1-6]0[1-6]|CNT[1-3]\d\d|MAT[1-5]\d\d|LGG[1-7]\d\d|LP\d\d|LGG\d\d\d)$/.test(c) || /^EF\d\d[A-Z]{2}\d\d$/.test(c);
const txt = (v, max) => typeof v === 'string' && v.trim().length > 2 && (!max || v.length <= max);
const HABILIDADES = [1, 2, 3, 4, 5, 6].flatMap(c => [1, 2, 3, 4, 5, 6].map(h => `EM13CHS${c}0${h}`)).filter(c => !/EM13CHS[45]0[56]/.test(c));

// Campos que cada tipo de alvo aceita nos efeitos
const CAMPOS = {
  potencia: /^(economia|bemEstar|ambiente|seguranca|apoio|limpa|militar|fossil|desmatamento|vulnerabilidade|cp|(recursos|producao)\.(alimentos|energia|minerais|tecnologia)|imune\.(ciber|desinfo|pandemia)|contadores\.(mediacoes|solidariedade|propostasAprovadas|resolucoesApoiadas|alimentosCedidos))$/,
  territorio: /^(desenvolvimento|estabilidade|vulnerabilidade|pressao|conflito|floresta|influencia|recursos\.(alimentos|energia|minerais|tecnologia))$/,
  global: /^(temperatura|tensao|comercio|cooperacao|deslocados|energia|transferencia)$/,
};
const SEL_POTENCIA = ['todos', 'vulneraveisPotencias'], SEL_TERRITORIO = ['vizinhos', 'vizinhosCasa', 'territorios', 'emConflito', 'comFloresta', 'vulneraveis', 'escolhidos'];
// Tipo do lugar de um dilema/evento: 'territorio', 'potencia', 'misto' ou null
function tipoLocal(local) {
  if (!local) return null;
  if (local === 'casa' || POT.has(local)) return 'potencia';
  if (typeof local === 'string') return TER.has(local) ? 'territorio' : null;
  if (!local.entre) return 'territorio';
  const t = new Set(local.entre.map(x => (POT.has(x) ? 'potencia' : 'territorio')));
  return t.size > 1 ? 'misto' : [...t][0];
}
// Confere uma lista de efeitos. quem: 'potencia' (há quem decide) ou 'evento'; local: o lugar
function conferirEfeitos(onde, efeitos, quem, local) {
  if (!Array.isArray(efeitos) || !efeitos.length) return problemas.push(`${onde}: sem efeitos`);
  const tl = tipoLocal(local);
  for (const ef of efeitos) {
    const ond = `${onde} (${ef.v})`;
    if (typeof ef.v !== 'string') { problemas.push(`${onde}: efeito sem v`); continue; }
    if ((ef.d === undefined) === (ef.m === undefined) || ![ef.d, ef.m].some(Number.isFinite)) problemas.push(`${ond}: precisa de d ou m numérico`);
    if (ef.atraso !== undefined && !(Number.isInteger(ef.atraso) && ef.atraso >= 1 && ef.atraso <= 3)) problemas.push(`${ond}: atraso deve ser 1, 2 ou 3`);
    if (ef.chance !== undefined && !(ef.chance > 0 && ef.chance < 1)) problemas.push(`${ond}: chance entre 0 e 1`);
    if (ef.imune !== undefined && !['ciber', 'desinfo', 'pandemia'].includes(ef.imune)) problemas.push(`${ond}: imune desconhecido`);
    const p = ef.v.split('.');
    if (p[0] === 'rel') { // relações: 'rel.china' (quem decide × China), 'rel.alvo|local|rivais|aliados|todos' ou 'rel.a.b' (par explícito, em eventos)
      const ESPECIAIS = ['alvo', 'local', 'rivais', 'aliados', 'todos'];
      if (p.length === 3) { if (!POT.has(p[1]) || !POT.has(p[2]) || p[1] === p[2]) problemas.push(`${ond}: par de potências inválido`); }
      else if (p.length === 2) {
        if (quem !== 'potencia') problemas.push(`${ond}: 'rel.x' precisa de quem decide; num evento sem escolha use o par 'rel.a.b'`);
        else if (!POT.has(p[1]) && !ESPECIAIS.includes(p[1])) problemas.push(`${ond}: potência ou seletor de relação desconhecido`);
        else if (p[1] === 'local' || p[1] === 'alvo') { if (tipoLocal(local) !== 'potencia') problemas.push(`${ond}: ${p[1]} não é uma potência`); }
      } else problemas.push(`${ond}: caminho de relação inválido`);
      continue;
    }
    const sel = S.SELETORES.includes(p[0]) && p.length > 1 ? p[0] : '', campo = sel ? p.slice(1).join('.') : ef.v;
    let alvo;
    if (sel === 'global') alvo = 'global';
    else if (SEL_POTENCIA.includes(sel)) alvo = 'potencia';
    else if (SEL_TERRITORIO.includes(sel)) {
      alvo = 'territorio';
      if (sel === 'vizinhos' && !tl) problemas.push(`${ond}: vizinhos de quê? não há local`);
    }
    else if (sel === 'local' || sel === 'alvo' || (!sel && campo === 'influencia')) {
      if (!tl) { problemas.push(`${ond}: usa o lugar, mas não há local`); continue; }
      alvo = tl === 'misto' ? null : tl;
      if (campo === 'influencia' && tl !== 'territorio') problemas.push(`${ond}: influência só existe em território`);
    } else if (!sel) {
      if (quem !== 'potencia') { problemas.push(`${ond}: efeito sem prefixo num evento (não há quem decide)`); continue; }
      alvo = 'potencia';
    } else { problemas.push(`${ond}: seletor desconhecido`); continue; }
    if (alvo && !CAMPOS[alvo].test(campo)) problemas.push(`${ond}: campo "${campo}" não existe em ${alvo}`);
    if (campo === 'influencia' && quem !== 'potencia' && sel !== 'local') problemas.push(`${ond}: influência sem potência`);
  }
}
function conferirLocal(onde, local, permiteCasa) {
  if (!local) return;
  if (typeof local === 'string') { if (!(ids.has(local) || (permiteCasa && local === 'casa'))) problemas.push(`${onde}: local desconhecido ${local}`); return; }
  (local.entre || []).filter(x => !ids.has(x)).forEach(x => problemas.push(`${onde}: local desconhecido ${x}`));
  for (const k of Object.keys(local)) if (!['entre', 'conflitoMin', 'estabilidadeMax', 'vulnerabilidadeMin', 'influenciaMin', 'vizinho'].includes(k)) problemas.push(`${onde}: filtro de local desconhecido ${k}`);
}
function conferirCondicoes(onde, condicoes, dePotencia) {
  for (const c of condicoes || []) {
    const ok = /^global\.(temperatura|tensao|comercio|cooperacao|deslocados|energia|transferencia)$/.test(c.v) || /^(conflitos|rodada)$/.test(c.v)
      || (/^territorio\.([a-z_]+)\.(desenvolvimento|estabilidade|vulnerabilidade|pressao|conflito)$/.test(c.v) && TER.has(c.v.split('.')[1]))
      || (dePotencia && /^potencia\.(parceiros|economia|bemEstar|ambiente|seguranca|apoio|limpa|militar|vulnerabilidade|recursos\.(alimentos|energia|minerais|tecnologia))$/.test(c.v));
    if (!ok) problemas.push(`${onde}: condição desconhecida ${c.v}`);
    if (c.min === undefined && c.max === undefined) problemas.push(`${onde}: condição ${c.v} sem min nem max`);
    if (!c.exige && !c.x) problemas.push(`${onde}: condição ${c.v} sem x nem exige`);
  }
}
const textosDe = o => Object.values(o).flatMap(v => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? textosDe(v) : []));
const MARCADOR = /\{(?:(?:o|O|em|Em|de|De|a|A) )?(?:quem|local)\}|\{[^{}|]+\|[^{}|]+\}/g;
// Marcadores válidos e português certo depois de preenchidos, para cada potência que pode decidir
function conferirMarcadores(onde, obj, pids, local) {
  const lugar = pid => (local === 'casa' ? pid : typeof local === 'string' ? local : local ? (local.entre || [...TER])[0] : null);
  for (const t of textosDe(obj)) {
    if (/\b(em|de|no|na|do|da|a|ao|para) \{(quem|local)\}/i.test(t) && !/para \{o (quem|local)\}/.test(t)) problemas.push(`${onde}: use {em local}, {de quem}… em vez de preposição solta em "${t.slice(0, 50)}…"`);
    if (/[{}]/.test(t.replace(MARCADOR, ''))) problemas.push(`${onde}: marcador desconhecido em "${t.slice(0, 50)}…"`);
    if (/\{[^}]*local\}/.test(t) && !local) problemas.push(`${onde}: usa {local}, mas não há local`);
    for (const pid of pids) { const r = S.preencher(t, pid, lugar(pid)); if (/[{}]/.test(r)) problemas.push(`${onde}: sobrou marcador em "${r.slice(0, 50)}…"`); }
  }
}
function conferirTextos(onde, obj) {
  for (const t of textosDe(obj)) {
    if (/(?<!\p{L})(lego|roblox|among us|gartic)(?!\p{L})/iu.test(t)) problemas.push(`${onde}: marca proibida em "${t.slice(0, 40)}…"`);
    if (t.includes('"')) problemas.push(`${onde}: use “ ” em vez de aspas retas em "${t.slice(0, 40)}…"`);
  }
}

function conferirDilemas() {
  const D = g('DILEMAS');
  if (!Array.isArray(D)) return problemas.push('dilemas.js sem DILEMAS');
  if (D.length < 40 || D.length > 80) problemas.push(`dilemas: ${D.length} (esperado de 40 a 80)`);
  const vistos = new Set(), cobertura = {}, categorias = {}, porPotencia = Object.fromEntries([...POT].map(p => [p, 0]));
  D.forEach((d, i) => {
    const onde = `dilemas[${i}] ${d.id}`;
    if (!/^[a-z_]+$/.test(d.id || '') || vistos.has(d.id)) problemas.push(`${onde}: id inválido ou repetido`);
    vistos.add(d.id);
    if (!txt(d.titulo, 60) || !txt(d.texto, 360) || !txt(d.conceito, 80) || typeof d.icone !== 'string' || !d.icone) problemas.push(`${onde}: titulo/texto/conceito/icone faltando ou longos`);
    if (d.vocesabia !== undefined && !txt(d.vocesabia, 400)) problemas.push(`${onde}: vocesabia longo demais`);
    if (!Array.isArray(d.bncc) || !d.bncc.length) problemas.push(`${onde}: sem bncc`);
    (d.bncc || []).forEach(b => { if (!/^EM13CHS[1-6]0[1-6]$/.test(b) || !HABILIDADES.includes(b)) problemas.push(`${onde}: código BNCC inválido ${b}`); cobertura[b] = (cobertura[b] || 0) + 1; });
    (d.temas || []).filter(t => !S.TEMAS.includes(t)).forEach(t => problemas.push(`${onde}: tema desconhecido ${t}`));
    (d.potencias || []).filter(p => !POT.has(p)).forEach(p => problemas.push(`${onde}: potência desconhecida ${p}`));
    (d.potencias || [...POT]).forEach(p => porPotencia[p] !== undefined && porPotencia[p]++);
    conferirLocal(onde, d.local, true);
    conferirCondicoes(onde, d.condicoes, true);
    conferirTextos(onde, d);
    conferirMarcadores(onde, { titulo: d.titulo, texto: d.texto, opcoes: d.opcoes }, d.potencias || [...POT], d.local);
    if (!Array.isArray(d.opcoes) || d.opcoes.length < 2 || d.opcoes.length > 3) { problemas.push(`${onde}: precisa de 2 ou 3 opções`); return; }
    const resumos = new Set();
    d.opcoes.forEach((o, k) => {
      const ond = `${onde}.opcoes[${k}]`;
      if (!txt(o.texto, 140) || !txt(o.resumo, 40) || !txt(o.porque, 280) || !txt(o.manchete, 140)) problemas.push(`${ond}: texto/resumo/porque/manchete faltando ou longos`);
      if (!CATEGORIAS.includes(o.categoria)) problemas.push(`${ond}: categoria desconhecida ${o.categoria}`);
      categorias[o.categoria] = (categorias[o.categoria] || 0) + 1;
      if (resumos.has(o.resumo)) problemas.push(`${ond}: resumo repetido`);
      resumos.add(o.resumo);
      conferirEfeitos(ond, o.efeitos, 'potencia', d.local);
    });
  });
  const faltam = HABILIDADES.filter(h => !cobertura[h]);
  if (faltam.length) problemas.push(`dilemas: habilidades EM13CHS sem nenhum dilema: ${faltam.join(', ')}`);
  Object.entries(porPotencia).filter(([, n]) => n < 25).forEach(([p, n]) => avisos.push(`dilemas: só ${n} dilemas servem para ${p} (uma partida longa usa até 8)`));
  console.log(`  dilemas: ${D.length} · ${HABILIDADES.length - faltam.length}/${HABILIDADES.length} habilidades EM13CHS · centrais: ${['201', '203', '204', '305', '603', '604'].map(c => `${c} ×${cobertura['EM13CHS' + c] || 0}`).join(', ')}`);
  console.log(`  opções por categoria: ${Object.entries(categorias).map(([k, v]) => `${k} ${v}`).join(', ')} · dilemas que servem a cada potência: ${Object.entries(porPotencia).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}

function conferirTerritorios() {
  g('TERRITORIOS').forEach(t => { if (!['', 'o', 'a', 'os', 'as'].includes(t.artigo)) problemas.push(`territorios.${t.id}: artigo deve ser '', o, a, os ou as`); });
  g('POTENCIAS').forEach(p => { if (!['o', 'a', 'os', 'as'].includes(p.artigo) || !p.forma || !/^#[0-9A-F]{6}$/i.test(p.cor)) problemas.push(`potencias.${p.id}: artigo, cor ou forma inválidos`); });
}

function conferirEventos() {
  const E = g('EVENTOS'), R = g('RESOLUCOES').map(r => r.id);
  const vistos = new Set();
  let decisoes = 0;
  E.forEach((ev, i) => {
    const onde = `eventos[${i}] ${ev.id}`;
    if (vistos.has(ev.id)) problemas.push(`${onde}: id repetido`);
    vistos.add(ev.id);
    if (!txt(ev.titulo, 60) || !txt(ev.texto, 320) || !txt(ev.manchete, 140) || !txt(ev.vocesabia, 400)) problemas.push(`${onde}: título/texto/manchete/vocesabia faltando ou longos`);
    conferirLocal(onde, ev.local, false);
    conferirCondicoes(onde, ev.condicoes, false);
    conferirTextos(onde, ev);
    (ev.temas || []).filter(t => !S.TEMAS.includes(t)).forEach(t => problemas.push(`${onde}: tema desconhecido ${t}`));
    if (ev.efeitos?.length) conferirEfeitos(onde, ev.efeitos, 'evento', ev.local);
    const esc = ev.escolha;
    if (esc && !['votacao', 'doacao', 'decisao'].includes(esc.tipo)) problemas.push(`${onde}: escolha desconhecida ${esc.tipo}`);
    if (esc?.tipo === 'votacao' && !R.includes(esc.resolucao)) problemas.push(`${onde}: resolução desconhecida ${esc.resolucao}`);
    if (esc?.tipo === 'doacao') { conferirEfeitos(onde + ' sucesso', esc.sucesso, 'evento', ev.local); conferirEfeitos(onde + ' fracasso', esc.fracasso, 'evento', ev.local); }
    if (esc?.tipo === 'decisao') {
      decisoes++;
      conferirMarcadores(onde, esc, [...POT], ev.local);
      if (!Array.isArray(esc.opcoes) || esc.opcoes.length < 2 || esc.opcoes.length > 3) problemas.push(`${onde}: decisão precisa de 2 ou 3 opções`);
      (esc.opcoes || []).forEach((o, k) => {
        const ond = `${onde}.opcoes[${k}]`;
        if (!txt(o.texto, 140) || !txt(o.resumo, 40) || !txt(o.porque, 280) || !txt(o.manchete, 140)) problemas.push(`${ond}: texto/resumo/porque/manchete faltando ou longos`);
        if (!CATEGORIAS.includes(o.categoria)) problemas.push(`${ond}: categoria desconhecida ${o.categoria}`);
        conferirEfeitos(ond, o.efeitos, 'potencia', ev.local);
      });
      const col = esc.coletivo;
      if (col) {
        if (!esc.opcoes?.[col.opcao] || !(col.min >= 2 && col.min <= 6) || !txt(col.manchete, 140)) problemas.push(`${onde}: coletivo inválido`);
        conferirEfeitos(onde + ' coletivo', col.efeitos, 'evento', ev.local);
        if (col.senao) conferirEfeitos(onde + ' coletivo.senao', col.senao, 'evento', ev.local);
      }
    }
    (ev.bncc || []).filter(b => !bnccOk(b)).forEach(b => problemas.push(`${onde}: BNCC estranho ${b}`));
  });
  console.log(`  eventos: ${E.length} (${decisoes} com decisão de todas as potências)`);
}

function conferirFichas() {
  const F = g('FICHAS');
  if (!F) return problemas.push('fichas.js sem FICHAS');
  for (const id of ids) {
    const f = F[id];
    if (!f) { problemas.push(`fichas: falta ${id}`); continue; }
    if (!txt(f.resumo, 420) || !Array.isArray(f.fatos) || f.fatos.length < 2) problemas.push(`fichas.${id}: resumo/fatos inválidos`);
    (f.fatos || []).forEach((x, i) => { if (!txt(x.texto, 300) || !txt(x.fonte)) problemas.push(`fichas.${id}.fatos[${i}]: texto/fonte`); });
  }
  console.log(`  fichas: ${Object.keys(F).length}`);
}

function conferirManual() {
  const M = g('MANUAL'), G = g('GLOSSARIO');
  if (!Array.isArray(M) || M.length < 8) problemas.push('manual: MANUAL com menos de 8 seções');
  (M || []).forEach((s, i) => { if (!s.id || !txt(s.titulo) || !txt(s.html)) problemas.push(`manual[${i}]: seção inválida`); });
  if (!Array.isArray(G) || G.length < 40) problemas.push('manual: GLOSSARIO com menos de 40 termos');
  console.log(`  manual: ${(M || []).length} seções, ${(G || []).length} termos no glossário`);
}

function conferirBncc() {
  const B = g('BNCC');
  if (!B) return problemas.push('bncc.js sem BNCC');
  const hab = B.habilidades || [];
  if (hab.length !== 32) problemas.push(`bncc: ${hab.length} habilidades EM13CHS (esperado 32)`);
  hab.forEach(h => { if (!/^EM13CHS[1-6]0[1-6]$/.test(h.codigo) || !txt(h.texto) || !txt(h.noJogo)) problemas.push(`bncc: habilidade inválida ${h.codigo}`); });
  // cada dilema citado em noJogo existe e trabalha mesmo a habilidade (senão o relatório final não conta)
  const D = g('DILEMAS') || [];
  hab.forEach(h => (h.dilemas || []).forEach(id => {
    const d = D.find(x => x.id === id);
    if (!d) problemas.push(`bncc.${h.codigo}: dilema inexistente "${id}"`);
    else if (!(d.bncc || []).includes(h.codigo)) problemas.push(`bncc.${h.codigo}: o dilema "${id}" não tem ${h.codigo} no bncc`);
  }));
  console.log(`  bncc: ${hab.length} habilidades, ${(B.competencias || []).length} competências, ${(B.outras || []).length} de outras áreas`);
}

console.log('Conferindo o conteúdo…');
conferirTerritorios();
if (!so || so === 'dilemas') conferirDilemas();
if (!so || so === 'eventos') conferirEventos();
if ((!so || so === 'fichas') && temFichas) conferirFichas();
if ((!so || so === 'manual') && temManual) conferirManual();
if ((!so || so === 'bncc') && temBncc) conferirBncc();
avisos.slice(0, 30).forEach(a => console.log('  ⚠ ' + a));
problemas.forEach(p => console.log('  ✗ ' + p));
console.log(problemas.length ? `${problemas.length} problema(s)` : 'Conteúdo OK!');
process.exit(problemas.length ? 1 : 0);
