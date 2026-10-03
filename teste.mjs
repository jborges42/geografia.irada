// Teste da partida inteira pela interface (index.html?rapido), clicando nos data-teste, sem erros no console.
// Uso: node teste.mjs [competitivo|cooperativo|todos] [--largura 1366 --altura 768] [--rm] [--arquivo] [--capturas pasta] [--extras] [--normal]
//   --normal: sem ?rapido (velocidade real das animações; leva bem mais tempo).
//   --extras: captura também créditos, manual, professor, provador, negociação e cada passo do fim (para a revisão visual).
//   As 13 potências vêm de conteudo/potencias.js. competitivo: 3 equipes (Brasil, China e Reino Unido, permanente no Conselho) + 10 do computador, 4 mandatos, com "Continuar" no meio (recarrega a página).
//   cooperativo: 4 equipes (Brasil, EUA, Índia e Nigéria), agente infiltrado e reunião de emergência, 4 mandatos.
// Capturas dos momentos-chave vão para --capturas (padrão: pasta temporária). Sai com código 1 se algo falhar.
// Desempenho (docs/trabalho/DESEMPENHO.md): --rodadas 8 (mandatos), --cpu 4 (CPU 4× mais lenta), --pasta <cópia do jogo>,
//   --medir saida.json: mesma partida sempre (sementes fixas, sem o Continuar) e, a cada mandato, heap, DOM, tweens,
//   renderer.info, FPS, tarefas longas e travada de entrada de cada fase (sonda em ferramentas/sonda-desempenho.js);
//   --rastro saida.json: rastro do Chrome (DevTools > Performance) do 2º mandato, para ver cada recálculo de estilo;
//   --semente N: semente do motor (padrão 1, que chega aos 8 mandatos);
//   --perfil saida.txt: perfil de CPU da partida inteira e as funções que mais pesam nos trechos > 100 ms sem respirar.
//   Ex.: node teste.mjs competitivo --rodadas 8 --cpu 4 --medir /tmp/m.json   (GI_SOFTWARE=1: máquina sem GPU)
import { abrirJogo } from './ferramentas/navegador.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const opc = (nome, padrao) => { const i = args.indexOf('--' + nome); return i >= 0 ? args[i + 1] : padrao; };
const cenarios = args[0] && !args[0].startsWith('--') ? (args[0] === 'todos' ? ['competitivo', 'cooperativo'] : [args[0]]) : ['competitivo', 'cooperativo'];
const largura = +opc('largura', 1366), altura = +opc('altura', 768), EXTRAS = args.includes('--extras'), PAGINA = args.includes('--normal') ? 'index.html' : 'index.html?rapido';
const pasta = opc('capturas', join(tmpdir(), 'geografia-irada-teste'));
const RODADAS = opc('rodadas', '4'), CPU = +opc('cpu', 1), MEDIR = opc('medir'), PERFIL = opc('perfil'), PASTA_JOGO = opc('pasta'), RASTRO = opc('rastro');
await mkdir(pasta, { recursive: true });

// as 13 potências, na ordem de conteudo/potencias.js (fonte única; o arquivo só declara a constante)
const PIDS = new Function(readFileSync(new URL('./conteudo/potencias.js', import.meta.url), 'utf8') + '; return POTENCIAS.map(p => p.id);')();
const CENARIOS = {
  competitivo: { modo: 'competitivo', humanos: ['brasil', 'china', 'reino_unido'], continuar: true },
  cooperativo: { modo: 'cooperativo', humanos: ['brasil', 'eua', 'india', 'nigeria'], infiltrado: true, reuniao: true },
};
// Funções que rodam na página: visibilidade real (não inerte, não escondida, não desativada)
const NA_PAGINA = `
  window.__vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[inert]') && !el.disabled
    && !el.closest('[hidden]') && el.getAttribute('aria-disabled') !== 'true';
  window.__ache = sel => [...document.querySelectorAll(sel)].find(__vis) || null;
  window.__centro = el => { const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };`;

async function rodar(nome) {
  const C = CENARIOS[nome], t0 = Date.now(), log = (...m) => console.log(`[${nome} ${((Date.now() - t0) / 1000).toFixed(0)}s]`, ...m);
  const MED = MEDIR || PERFIL || RASTRO;
  const nav = await abrirJogo({ pagina: MED ? 'nada.html' : PAGINA, largura, altura, movimentoReduzido: args.includes('--rm'), arquivo: args.includes('--arquivo'), pasta: PASTA_JOGO });
  if (CPU > 1) await nav.cmd('Emulation.setCPUThrottlingRate', { rate: CPU });
  if (MED) {   // partida reproduzível: Math.random com semente (antes e depois da mudança jogam a mesma partida)
    await nav.cmd('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { let t = 2026; Math.random = () => { t = (t + 0x6D2B79F5) | 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; })();` });
    await nav.cmd('Page.addScriptToEvaluateOnNewDocument', { source: readFileSync(new URL('./ferramentas/sonda-desempenho.js', import.meta.url), 'utf8') });
    await nav.ir(PAGINA);
    nav.erros.length = 0;   // o 404 da página vazia de partida
  }
  const tabela = [];
  const eventos = [];
  const medirMandato = async (rodada, ano) => {
    if (RASTRO && rodada === 2) {
      nav.ao('Tracing.dataCollected', p => eventos.push(...p.value));
      await nav.cmd('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'blink.user_timing'] } });
    }
    if (RASTRO && rodada === 3) {
      const fim = new Promise(ok => nav.ao('Tracing.tracingComplete', ok));
      await nav.cmd('Tracing.end'); await fim;
      writeFileSync(RASTRO, JSON.stringify({ traceEvents: eventos })); log('rastro gravado em', RASTRO);
    }
    if (!MEDIR) return;
    await foto('mandato-' + rodada);   // o mapa com as construções do mandato (comparar antes × depois)
    await nav.cmd('HeapProfiler.collectGarbage');
    const heap = +((await nav.cmd('Runtime.getHeapUsage')).result.usedSize / 1048576).toFixed(1);
    const r = await nav.js(`(async () => {
      const resumo = __resumo(), tw = gsap.globalTimeline.getChildren(true, true, false), m = Mapa3D.renderer, c = Cenas3D.renderizador?.();
      const soltos = tw.filter(x => x.targets().some(a => a instanceof Element && !a.isConnected)).length;
      const info = await __info(m), parado = await __fps(3000), cpuQuadro = await __cpuMapa();
      const recalc = sel => { const el = document.querySelector(sel); if (!el) return null; document.body.offsetHeight; const t = performance.now(); el.inert = true; document.body.offsetHeight; el.inert = false; document.body.offsetHeight; return +((performance.now() - t) / 2).toFixed(1); };
      const muda = f => { document.body.offsetHeight; const t = performance.now(); f(1); document.body.offsetHeight; f(0); document.body.offsetHeight; return +((performance.now() - t) / 2).toFixed(1); };
      const hud = document.querySelector('.hud'), fase0 = hud.dataset.fase, tela0 = document.body.dataset.tela;
      const inerte = { telas: recalc('#telas'), mundo: recalc('#mundo'), fase: muda(v => (hud.dataset.fase = v ? 'cena' : fase0)), tela: muda(v => (document.body.dataset.tela = v ? 'x' : tela0)),
        hudInerte: recalc('.hud'), coluna: recalc('.hud-coluna'), topo: recalc('.hud-topo'), doca: recalc('.hud-doca'), rotulos: muda(v => document.getElementById('rotulos-mapa').classList.toggle('x', !!v)) };
      __resumo();   // as janelas de medida não contam no próximo mandato
      return { ...resumo, ...info, ...parado, cpuQuadro, inerte, tweens: tw.length, tweensSoltos: soltos, dom: document.getElementsByTagName('*').length,
        globais: __ativos.globais, intervalos: __ativos.intervalos.size, geoMapa: m.info.memory.geometries, texMapa: m.info.memory.textures,
        progMapa: m.info.programs.length, geoCena: c?.info.memory.geometries, texCena: c?.info.memory.textures, progCena: c?.info.programs.length,
        qualidade: Mapa3D.qualidade, construcoes: Jogo.estado?.construcoes.length ?? null, objetos: (() => { let n = 0; Mapa3D.cena.traverse(() => n++); return n; })() };
    })()`);
    const linha = { rodada, ano, heap, ...r };
    tabela.push(linha); log('MEDIDA', JSON.stringify(linha));
    writeFileSync(MEDIR, JSON.stringify({ cenario: nome, cpu: CPU, software: !!process.env.GI_SOFTWARE, tabela }, null, 1));
  };
  if (PERFIL) { await nav.cmd('Profiler.enable'); await nav.cmd('Profiler.setSamplingInterval', { interval: 1000 }); }
  const foto = async rotulo => { await comPrazo(nav.foto(join(pasta, `${nome}-${largura}-${rotulo}.png`)), 90000, 'captura'); };
  const fotos = new Set();
  const fotoUma = async rotulo => { if (!fotos.has(rotulo)) { fotos.add(rotulo); await foto(rotulo); } };
  // Se o Chrome cair (ou travar), o protocolo nunca responde: falha com mensagem em vez de esperar para sempre
  const comPrazo = (p, ms, oque) => Promise.race([p, new Promise((_, nao) => setTimeout(() => nao(new Error(`o navegador parou de responder (${oque})`)), ms))]);
  const pagina = expr => comPrazo(nav.js(`(() => { ${NA_PAGINA} ${expr} })()`), 90000, 'script');
  const clicarSel = async (sel, opcional = false) => {
    const p = await pagina(`const el = __ache(${JSON.stringify(sel)}); if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); return el && __centro(el);`);   // listas que rolam (carrossel, ONU, relações): traz o alvo para a vista antes do clique
    if (!p) { if (opcional) return false; throw new Error('não achei ' + sel); }
    await nav.clicarEm(p.x, p.y);
    return true;
  };
  const clicar = (teste, opcional) => clicarSel(`[data-teste="${teste}"]`, opcional);
  const existe = sel => pagina(`return !!__ache(${JSON.stringify(sel)});`);
  const esperar = (sel, tempo = 30000) => nav.esperarPor(`(() => { ${NA_PAGINA} return !!__ache(${JSON.stringify(sel)}); })()`, { tempo });
  try {
    // ---------- início e lobby ----------
    await esperar('[data-teste="jogar"]', 60000);
    await nav.espera(600);
    await fotoUma('01-inicio');
    // painéis da tela inicial: abre, fotografa e fecha com Esc
    if (EXTRAS) for (const [sel, rot] of [['[data-acao="creditos"]', '30-creditos'], ['[data-teste="manual"]', '31-manual'], ['[data-teste="professor"]', '32-professor']]) {
      await clicarSel(sel);
      await nav.esperarPor(`!!document.querySelector('#camada > [aria-modal="true"]')`, { tempo: 15000 });
      await nav.espera(1200);
      await foto(rot);
      await nav.teclar('Escape');
      await nav.esperarPor(`!document.querySelector('#camada > [aria-modal="true"]')`, { tempo: 15000 });
      await nav.espera(400);
    }
    if (MED) await nav.js(`(() => { const o = Simulacao.criarEstado; Simulacao.criarEstado = c => o({ ...c, semente: ${+opc('semente', 1)} }); })()`);
    await clicar('jogar');
    await esperar(`[data-teste="modo-${C.modo}"]`);
    await nav.espera(400);
    if (EXTRAS) await foto('02a-modos');
    await clicar(`modo-${C.modo}`);
    await esperar('[data-teste="comecar"]');
    await nav.espera(700);
    if (EXTRAS) {   // provador do boneco da 1ª vaga
      await clicarSel('[data-acao="editar"]');
      await nav.espera(2500);
      await foto('02b-provador');
      await nav.teclar('Escape');
      await nav.espera(800);
    }
    for (const pid of PIDS) {   // carrossel: só a nação em destaque aceita clique; a ficha da fileira de cima leva até ela
      await clicar('nacao-' + pid);
      await nav.espera(250);
      const sel = `[data-teste="potencia-${pid}"]`;
      const equipe = await pagina(`const b = document.querySelector('${sel}'); return b ? (b.getAttribute('aria-pressed') ?? b.getAttribute('aria-checked')) === 'true' : null;`);
      if (equipe !== null && equipe !== C.humanos.includes(pid)) { await clicarSel(sel); await nav.espera(150); }
    }
    if (await existe(`[data-teste="rodadas-${RODADAS}"]`)) await clicar('rodadas-' + RODADAS);
    if (C.infiltrado && await existe('[data-acao="ajustes"]')) {
      await clicarSel('[data-acao="ajustes"]');
      await esperar('[data-aj="infiltrado"]');
      if (await pagina(`return document.querySelector('[data-aj="infiltrado"]').getAttribute('aria-checked') !== 'true';`)) await clicarSel('[data-aj="infiltrado"]');
      await clicarSel('.lob-ajustes .painel-rodape [data-acao="fechar"]');
      await nav.espera(500);
    }
    await nav.espera(300);
    await fotoUma('02-lobby');
    await clicar('comecar');
    if (PERFIL) await nav.cmd('Profiler.start');

    // ---------- a partida ----------
    let cenas = 0, negociou = false, ultimoEstado = '', parado = Date.now(), recarregou = false, acoes = 0, vezes = 0, trocou = false, pausou = false, reuniu = false, rodadaVista = 0;
    const humanoNaVez = () => pagina(`return document.querySelector('.hud')?.dataset.fase === 'decisoes' && !!__ache('.hud-encerrar');`);
    for (;;) {
      if (Date.now() - t0 > (PAGINA === 'index.html' ? 60 : 25) * 60000) throw new Error('a partida passou do tempo-limite');
      const s = await pagina(`
        const hud = document.querySelector('.hud'), fase = hud?.dataset.fase;
        if (document.body.dataset.tela === 'inicio' && !Jogo.estado && window.__comecou) return 'fim';
        if (Jogo.estado) window.__comecou = true;
        if (__ache('[data-teste="revanche"], [data-teste="novo-jogo"]')) return 'fim-tela';
        for (const t of ['revelacao-ok', 'aceitar', 'voto-sim', 'cop-1', 'doar-1', 'doar-0', 'continuar-painel']) if (__ache('[data-teste="' + t + '"]')) return t;
        if (fase !== 'decisoes' && __ache('[data-teste="confirmar"]')) return 'confirmar';
        if (__ache('#camada [data-teste="alvo"]:not(.hud-alvos *)') && !document.querySelector('#camada [data-teste="alvo"][aria-checked="true"]:not(.hud-alvos *)')) return 'alvo-onu';
        if (__ache('.onu-res:not(.bloqueado)') && !document.querySelector('.onu-res[aria-checked="true"]')) return 'resolucao';
        if (__ache('[data-teste="acusar"]')) return 'acusar';
        if (fase !== 'decisoes' && __ache('[data-teste^="opcao-"]')) return 'opcao';
        if (__ache('.hud-decidindo [data-teste="pular"]')) return 'computador';
        if (__ache('[data-teste="pular"]')) return 'pular';
        if (fase === 'decisoes' && __ache('.hud-encerrar') && !document.querySelector('#camada > [aria-modal="true"]')) return 'vez';
        return 'esperando:' + (fase || document.body.dataset.tela);`);
      if (s !== ultimoEstado) { ultimoEstado = s; parado = Date.now(); if (!s.startsWith('esperando')) log(s); }
      else if (Date.now() - parado > 90000) throw new Error('travou em ' + s);
      if (s === 'fim-tela' && MEDIR && !tabela.some(l => l.rodada === 'fim')) await medirMandato('fim', null);
      if (s === 'fim' || s === 'fim-tela') {
        if (PERFIL) gravarPerfil((await nav.cmd('Profiler.stop')).result.profile, PERFIL);
        await nav.espera(800); await fotoUma('99-fim'); if (s === 'fim-tela') await clicar('inicio', true); break; }
      if (s === 'revelacao-ok') {
        await fotoUma('03-revelacao');
        // "Segure para ver": aperta, segura 2,5 s e solta (no ?rapido o tempo encolhe, mas segurar também vale)
        const p = await pagina(`const el = __ache('[data-teste="revelacao-ok"]'); return el && { ...__centro(el), segurar: el.classList.contains('rev-segurar') };`);
        if (p?.segurar) {
          await nav.mover(p.x, p.y);
          await nav.cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
          await nav.espera(2500);
          await nav.cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
        } else if (p) await nav.clicarEm(p.x, p.y);
      }
      else if (['aceitar', 'voto-sim', 'cop-1', 'doar-1', 'doar-0'].includes(s)) { await fotoUma('20-' + s); await clicar(s, true); }
      else if (s === 'continuar-painel') {
        const onde = await pagina(`return document.querySelector('.hud')?.dataset.fase || '';`);
        const rot = onde === 'plantao' ? '04-plantao' : onde === 'balanco' ? '14-balanco' : onde === 'dilema' ? '05b-dilema-porque' : '21-' + onde;
        if (EXTRAS && onde === 'cena') { cenas++; await nav.espera(1500); await foto(`${rot}-${cenas}`); } else await fotoUma(rot);
        await clicar(s, true);
      } else if (s === 'opcao') { await fotoUma('05-dilema'); await clicarSel('[data-teste^="opcao-"]', true); }
      else if (s === 'confirmar') await clicar('confirmar', true);
      else if (s === 'resolucao') { await fotoUma('23-resolucao'); await clicarSel('.onu-res:not(.bloqueado)', true); }
      else if (s === 'alvo-onu') await clicarSel('#camada [data-teste="alvo"]', true);
      else if (s === 'acusar') { await fotoUma('24-acusar'); await clicar('acusar', true); }
      else if (s === 'computador') { await nav.espera(500); await fotoUma('12-computador'); await clicarSel('.hud-decidindo [data-teste="pular"]', true); }
      else if (s === 'pular') await clicar('pular', true);
      else if (s === 'vez') {
        vezes++;
        const rodada = await pagina('return Jogo.estado.rodada;');
        // Continuar: no 2º mandato, recarrega a página e retoma a partida salva
        if (C.continuar && rodada === 2 && !recarregou && !MED) {
          recarregou = true;
          log('recarregando a página para testar Continuar');
          const ano = await pagina('return Jogo.estado.ano;');
          await nav.ir(PAGINA);
          await esperar('[data-teste="continuar"]', 60000);
          await nav.espera(PAGINA === "index.html" ? 3000 : 500);   // sem ?rapido, o menu ainda está entrando
          await clicar('continuar');
          await nav.esperarPor(`Jogo.estado && Jogo.estado.ano === ${ano}`, { tempo: 30000 });
          await nav.espera(1500);
          await fotoUma('15-continuar');
          continue;
        }
        await nav.mover(5, Math.round(altura * .45));
        await nav.espera(900);
        await fotoUma('06-hud');
        if (rodada !== rodadaVista) { rodadaVista = rodada; const ano = await pagina('return Jogo.estado.ano;'); log(`mandato ${rodada}, ano ${ano}`); await medirMandato(rodada, ano); }
        if (!pausou) {   // menu de pausa (Esc) e de volta
          pausou = true;
          await clicar('menu');
          await esperar('[data-teste="continuar-jogo"]');
          await nav.espera(500);
          await fotoUma('13-pausa');
          await clicar('continuar-jogo');
          await nav.espera(500);
        }
        if (EXTRAS && !negociou && await existe('[data-teste="negociar"]')) {   // negociação: abre, fotografa e desiste
          negociou = true;
          await clicar('negociar');
          await nav.espera(1500);
          await foto('25-negociar');
          await nav.teclar('Escape');
          await nav.espera(800);
          continue;
        }
        if (C.reuniao && !reuniu && await existe('[data-teste="reuniao"]')) { reuniu = true; await fotoUma('22-reuniao'); await clicar('reuniao'); await nav.espera(800); continue; }
        if (!trocou && await existe('[data-teste="trocar-acoes"]')) { trocou = true; await clicar('trocar-acoes'); await nav.espera(700); }
        // até 2 ações por vez
        for (let k = 0; k < 2; k++) {
          await nav.esperarPor(`!document.querySelector('[aria-busy="true"]')`, { tempo: 30000 });   // a ação anterior terminou de animar
          const id = await pagina(`const b = __ache('.doca-acoes [data-teste="acao"]:not(.bloqueado):not(.usado)'); return b && b.dataset.id;`);
          if (!id) break;
          const sel = `.doca-acoes [data-teste="acao"][data-id="${id}"]`;
          const p = await pagina(`return __centro(document.querySelector('${sel}'));`);
          await nav.mover(p.x, p.y);
          await nav.espera(400);
          await fotoUma('06b-previa');
          // a ação anterior pode ainda estar animando (clique ignorado): tenta de novo a cada 2 s
          for (let t = 0; ; t++) {
            await clicarSel(sel);
            try { await esperar('.hud-ficha [data-teste="confirmar"]', 2000); break; } catch (erro) { if (t >= 5) throw erro; }
          }
          await nav.espera(400);
          await fotoUma('07-ficha');
          await clicarSel('.hud-ficha [data-teste="confirmar"]');
          await nav.espera(400);
          if (await existe('.hud-instrucao')) {
            await nav.mover(Math.round(largura * .55), Math.round(altura * .42));
            await nav.espera(500);
            await fotoUma('08-alvo');
            await clicar('ver-lista');
            await esperar('[data-teste="alvo"]', 10000);
            await nav.espera(500);
            await fotoUma('09-lista');
            await clicar('alvo');
            await nav.espera(300);
            if (await existe('.hud-alvos [data-teste="confirmar"]')) await clicarSel('.hud-alvos [data-teste="confirmar"]');
            await esperar('.hud-ficha [data-teste="confirmar"]', 10000);
            await nav.espera(400);
            await fotoUma('10-confirmar');
            await clicarSel('.hud-ficha [data-teste="confirmar"]');
          }
          // a ação pode abrir painéis de outros módulos (ONU, aceite de aliança): o laço de cima cuida deles
          for (let i = 0; i < 20; i++) {
            await nav.espera(200);
            if (await existe('#camada > [aria-modal="true"]')) break;
            if (await pagina(`return !__ache('.hud-ficha') && !__ache('.hud-instrucao');`)) break;
          }
          acoes++;
          await nav.espera(500);
          await fotoUma('11-resultado');
          if (await existe('#camada > [aria-modal="true"]')) break;
        }
        if (await existe('#camada > [aria-modal="true"]')) continue;
        if (vezes === 1) {   // balão do território: passa o mouse no mapa
          await nav.mover(Math.round(largura * .52), Math.round(altura * .45));
          await nav.espera(700);
          if (await existe('.hud-balao')) await fotoUma('16-balao');
        }
        await clicar('encerrar-vez');
      }
      await nav.espera(200);
    }
    const salvo = await pagina(`try { return localStorage.getItem('gi:partida'); } catch { return 'x'; }`);
    if (salvo) throw new Error('a partida terminou, mas ficou salva em gi:partida');
    if (nav.erros.length) throw new Error('erros no console:\n  ' + nav.erros.join('\n  '));
    log(`ok: ${vezes} vezes humanas, ${acoes} ações, ${recarregou ? 'com' : 'sem'} Continuar`);
    return true;
  } catch (erro) {
    log('FALHOU:', erro.message);
    try { await foto('falha'); } catch { /* sem captura */ }
    if (nav.erros.length) log('erros no console:\n  ' + nav.erros.join('\n  '));
    return false;
  } finally {
    await nav.fechar();
  }
}

// Perfil de CPU: trechos de > 100 ms sem voltar ao ocioso (as travadas) e as funções com mais tempo dentro deles
function gravarPerfil(profile, saida) {
  writeFileSync(saida.replace(/\.\w+$/, '') + '.cpuprofile', JSON.stringify(profile));   // abre no DevTools (aba Performance)
  const nos = new Map(profile.nodes.map(n => [n.id, n])), pai = new Map();
  for (const n of profile.nodes) for (const f of n.children || []) pai.set(f, n.id);
  const nome = n => `${n.callFrame.functionName || '(anônima)'} ${n.callFrame.url.split('/').pop()}:${n.callFrame.lineNumber + 1}`;
  const ocioso = id => nos.get(id).callFrame.functionName === '(idle)';
  const total = {}, proprio = {}, trechos = [];
  let ini = -1, dur = 0;
  const fechar = fim => {
    if (dur > 100) {
      trechos.push(Math.round(dur));
      for (let i = ini; i < fim; i++) {
        const dt = (profile.timeDeltas[i + 1] || 0) / 1000; let id = profile.samples[i];
        proprio[nome(nos.get(id))] = (proprio[nome(nos.get(id))] || 0) + dt;
        const naPilha = new Set();
        for (; id != null; id = pai.get(id)) { const k = nome(nos.get(id)); if (!naPilha.has(k)) { naPilha.add(k); total[k] = (total[k] || 0) + dt; } }
      }
    }
    ini = -1; dur = 0;
  };
  for (let i = 0; i < profile.samples.length; i++) {
    if (ocioso(profile.samples[i])) { if (ini >= 0) fechar(i); continue; }
    if (ini < 0) ini = i;
    dur += (profile.timeDeltas[i + 1] || 0) / 1000;
  }
  if (ini >= 0) fechar(profile.samples.length);
  const soma = trechos.reduce((a, b) => a + b, 0) || 1, top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${(v / soma * 100).toFixed(1).padStart(5)}% ${Math.round(v).toString().padStart(6)} ms  ${k}`).join('\n');
  writeFileSync(saida, `${trechos.length} trechos > 100 ms (soma ${Math.round(soma)} ms, maiores: ${[...trechos].sort((a, b) => b - a).slice(0, 15).join(', ')})\n\n` +
    `== tempo total (inclusivo) nos trechos ==\n${top(total, 70)}\n\n== tempo próprio nos trechos ==\n${top(proprio, 50)}\n`);
  console.log('perfil gravado em', saida);
}

let ok = true;
for (const c of cenarios) ok = (await rodar(c)) && ok;
console.log(ok ? `Tudo certo. Capturas em ${pasta}` : 'Falhou.');
process.exit(ok ? 0 : 1);
