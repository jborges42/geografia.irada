// Teste da partida inteira pela interface (index.html?rapido), clicando nos data-teste, sem erros no console.
// Uso: node teste.mjs [competitivo|cooperativo|todos] [--largura 1366 --altura 768] [--rm] [--arquivo] [--capturas pasta] [--extras] [--normal]
//   --normal: sem ?rapido (velocidade real das animações; leva bem mais tempo).
//   --extras: captura também créditos, manual, professor, provador, negociação e cada passo do fim (para a revisão visual).
//   competitivo: 2 equipes (Brasil e China) + 4 do computador, 4 mandatos, com "Continuar" no meio (recarrega a página).
//   cooperativo: 3 equipes (Brasil, EUA e Índia), agente infiltrado e reunião de emergência, 4 mandatos.
// Capturas dos momentos-chave vão para --capturas (padrão: pasta temporária). Sai com código 1 se algo falhar.
import { abrirJogo } from './ferramentas/navegador.mjs';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const opc = (nome, padrao) => { const i = args.indexOf('--' + nome); return i >= 0 ? args[i + 1] : padrao; };
const cenarios = args[0] && !args[0].startsWith('--') ? (args[0] === 'todos' ? ['competitivo', 'cooperativo'] : [args[0]]) : ['competitivo', 'cooperativo'];
const largura = +opc('largura', 1366), altura = +opc('altura', 768), EXTRAS = args.includes('--extras'), PAGINA = args.includes('--normal') ? 'index.html' : 'index.html?rapido';
const pasta = opc('capturas', join(tmpdir(), 'geografia-irada-teste'));
await mkdir(pasta, { recursive: true });

const PIDS = ['brasil', 'eua', 'china', 'ue', 'india', 'russia'];
const CENARIOS = {
  competitivo: { modo: 'competitivo', humanos: ['brasil', 'china'], continuar: true },
  cooperativo: { modo: 'cooperativo', humanos: ['brasil', 'eua', 'india'], infiltrado: true, reuniao: true },
};
// Funções que rodam na página: visibilidade real (não inerte, não escondida, não desativada)
const NA_PAGINA = `
  window.__vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[inert]') && !el.disabled
    && !el.closest('[hidden]') && el.getAttribute('aria-disabled') !== 'true';
  window.__ache = sel => [...document.querySelectorAll(sel)].find(__vis) || null;
  window.__centro = el => { const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };`;

async function rodar(nome) {
  const C = CENARIOS[nome], t0 = Date.now(), log = (...m) => console.log(`[${nome} ${((Date.now() - t0) / 1000).toFixed(0)}s]`, ...m);
  const nav = await abrirJogo({ pagina: PAGINA, largura, altura, movimentoReduzido: args.includes('--rm'), arquivo: args.includes('--arquivo') });
  const foto = async rotulo => { await comPrazo(nav.foto(join(pasta, `${nome}-${largura}-${rotulo}.png`)), 90000, 'captura'); };
  const fotos = new Set();
  const fotoUma = async rotulo => { if (!fotos.has(rotulo)) { fotos.add(rotulo); await foto(rotulo); } };
  // Se o Chrome cair (ou travar), o protocolo nunca responde: falha com mensagem em vez de esperar para sempre
  const comPrazo = (p, ms, oque) => Promise.race([p, new Promise((_, nao) => setTimeout(() => nao(new Error(`o navegador parou de responder (${oque})`)), ms))]);
  const pagina = expr => comPrazo(nav.js(`(() => { ${NA_PAGINA} ${expr} })()`), 90000, 'script');
  const clicarSel = async (sel, opcional = false) => {
    const p = await pagina(`const el = __ache(${JSON.stringify(sel)}); return el && __centro(el);`);
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
    for (const pid of PIDS) {
      const sel = `[data-teste="potencia-${pid}"]`;
      const equipe = await pagina(`const b = document.querySelector('${sel}'); return b ? (b.getAttribute('aria-pressed') ?? b.getAttribute('aria-checked')) === 'true' : null;`);
      if (equipe !== null && equipe !== C.humanos.includes(pid)) { await clicarSel(sel); await nav.espera(150); }
    }
    if (await existe('[data-teste="rodadas-4"]')) await clicar('rodadas-4');
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
      if (s === 'fim' || s === 'fim-tela') { await nav.espera(800); await fotoUma('99-fim'); if (s === 'fim-tela') await clicar('inicio', true); break; }
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
        if (C.continuar && rodada === 2 && !recarregou) {
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
        if (rodada !== rodadaVista) { rodadaVista = rodada; log(`mandato ${rodada}, ano ${await pagina('return Jogo.estado.ano;')}`); }
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

let ok = true;
for (const c of cenarios) ok = (await rodar(c)) && ok;
console.log(ok ? `Tudo certo. Capturas em ${pasta}` : 'Falhou.');
process.exit(ok ? 0 : 1);
