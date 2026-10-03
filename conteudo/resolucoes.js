// =====================================================================
//  GEOGRAFIA IRADA — resoluções da ONU e missões secretas
// =====================================================================
//  orgao: 'cs' = Conselho de Segurança (votam as 13 potências; EUA, China, Rússia,
//         França (pela UE) e Reino Unido têm veto) · 'ag' = Assembleia Geral (1 voto por potência e
//         1 por território; maioria simples).
//  alvo: 'conflito' (território em conflito) · 'potencia' · 'nenhum'
// =====================================================================

const RESOLUCOES = [
  { id: 'missao_paz', nome: 'Missão de paz', orgao: 'cs', alvo: 'conflito', icone: '🪖',
    texto: 'Enviar capacetes azuis da ONU para proteger civis e apoiar um cessar-fogo.',
    efeitos: [{ v: 'alvo.conflito', d: -1 }, { v: 'alvo.estabilidade', d: 10 }, { v: 'global.deslocados', d: -5 },
      { v: 'global.cooperacao', d: 3 }, { v: 'global.tensao', d: -3 }],
    custoSim: { economia: 1 },
    bncc: ['EM13CHS604', 'EM13CHS503'] },
  { id: 'sancoes_onu', nome: 'Sanções da ONU', orgao: 'cs', alvo: 'potencia', icone: '⛔',
    texto: 'Sanções aprovadas pelo Conselho valem para o mundo todo e pesam muito mais do que as de um país sozinho.',
    efeitos: [{ v: 'alvo.economia', d: -7 }, { v: 'global.comercio', d: -2 }, { v: 'global.tensao', d: 2 }],
    bncc: ['EM13CHS604'] },
  { id: 'acordo_climatico', nome: 'Acordo climático global', orgao: 'ag', alvo: 'nenhum', icone: '🌡️',
    texto: 'Todos aceleram a energia limpa e os países ricos financiam a transição dos mais pobres.',
    efeitos: [{ v: 'todos.limpa', d: 5 }, { v: 'todos.economia', d: -1 }, { v: 'global.transferencia', d: .15 },
      { v: 'global.cooperacao', d: 5 }],
    bncc: ['EM13CHS305', 'EM13CHS306'] },
  { id: 'fundo_humanitario', nome: 'Fundo humanitário', orgao: 'ag', alvo: 'nenhum', icone: '📦',
    texto: 'Um fundo comum leva comida, água, abrigo e saúde a quem fugiu de guerras e desastres.',
    efeitos: [{ v: 'global.deslocados', d: -10 }, { v: 'todos.economia', d: -1 }, { v: 'global.cooperacao', d: 3 }],
    bncc: ['EM13CHS605', 'EM13CHS604'] },
  { id: 'tratado_desarmamento', nome: 'Tratado de desarmamento', orgao: 'ag', alvo: 'nenhum', icone: '🕊️',
    texto: 'Limites verificáveis para armas e para testes nucleares, com inspeções internacionais.',
    efeitos: [{ v: 'global.tensao', d: -10 }, { v: 'todos.militar', d: -10 }, { v: 'global.cooperacao', d: 5 }],
    bncc: ['EM13CHS604', 'EM13CHS504'] },
  { id: 'fundo_vacinas', nome: 'Vacinas para todos', orgao: 'ag', alvo: 'nenhum', icone: '💉',
    texto: 'Produção e distribuição compartilhadas de vacinas e remédios, inclusive para os países mais pobres.',
    efeitos: [{ v: 'todos.imune.pandemia', d: 2 }, { v: 'todos.economia', d: -1 }, { v: 'global.cooperacao', d: 3 },
      { v: 'territorios.desenvolvimento', d: 1 }],
    bncc: ['EM13CHS605', 'EM13CNT310'] },
];

// Missões secretas (estilo War). Cada condição precisa ser verdadeira em 2050.
//  tipos: parceirosContinente {continente, n} · parceirosContinentes {n} · indicador {v, min|max}
//         global {v, min|max} · contador {c, min} · estoque {r, min} · progresso {v, min} · parceiro {territorio}
//         aliancas {n} · relacoes {min, n} (n potências com relação ≥ min) · relacoesCom {com: [ids], min, n} · semHostis {limite} (nenhuma relação ≤ limite)
const MISSOES = [
  { id: 'lider_sul', nome: 'Liderança sul-americana', texto: 'Seja parceiro de 3 territórios da América do Sul.',
    para: ['brasil', 'eua', 'china', 'ue', 'reino_unido', 'japao'], condicoes: [{ tipo: 'parceirosContinente', continente: 'as', n: 3 }] },
  { id: 'amiga_africa', nome: 'Amiga da África', texto: 'Seja parceiro de 3 territórios africanos.',
    para: 'todas', condicoes: [{ tipo: 'parceirosContinente', continente: 'af', n: 3 }] },
  { id: 'rota_seda', nome: 'Rota da Seda', texto: 'Tenha parceiros em 3 continentes diferentes.',
    para: 'todas', condicoes: [{ tipo: 'parceirosContinentes', n: 3 }] },
  { id: 'potencia_verde', nome: 'Potência verde', texto: 'Chegue a 70% de energia limpa e 70 de ambiente.',
    para: 'todas', condicoes: [{ tipo: 'indicador', v: 'limpa', min: 70 }, { tipo: 'indicador', v: 'ambiente', min: 70 }] },
  { id: 'pacificadora', nome: 'Pacificadora', texto: 'Termine 2050 com a tensão mundial abaixo de 55.',
    para: 'todas', condicoes: [{ tipo: 'global', v: 'tensao', max: 55 }] },
  { id: 'celeiro', nome: 'Celeiro do mundo', texto: 'Exporte ou doe 10 alimentos (🌾) ao longo da partida.',
    para: ['brasil', 'eua', 'russia', 'india', 'ue', 'australia', 'nova_zelandia', 'nigeria'], condicoes: [{ tipo: 'contador', c: 'alimentosCedidos', min: 10 }] },
  { id: 'vale_silicio', nome: 'Vale do Silício', texto: 'Termine com 10 de tecnologia (💻) em estoque.',
    para: 'todas', condicoes: [{ tipo: 'estoque', r: 'tecnologia', min: 10 }] },
  { id: 'anfitria', nome: 'Anfitriã solidária', texto: 'Acolha refugiados ou envie ajuda humanitária 3 vezes.',
    para: 'todas', condicoes: [{ tipo: 'contador', c: 'solidariedade', min: 3 }] },
  { id: 'artico', nome: 'Guardiã do Ártico', texto: 'Seja parceira da Groenlândia e Ártico e do Canadá ou da Noruega, Islândia e Suíça.',
    para: ['eua', 'ue', 'russia', 'china', 'reino_unido'], condicoes: [{ tipo: 'parceiro', territorio: 'groenlandia' }, { tipo: 'parceiroUm', territorios: ['canada', 'noruega_suica'] }] },
  { id: 'diplomata_chefe', nome: 'Diplomata-chefe', texto: 'Proponha 2 resoluções na ONU que sejam aprovadas.',
    para: 'todas', condicoes: [{ tipo: 'contador', c: 'propostasAprovadas', min: 2 }] },
  { id: 'ilha_estabilidade', nome: 'Ilha de estabilidade', texto: 'Termine com 85 de segurança e a tensão mundial abaixo de 70.',
    para: 'todas', condicoes: [{ tipo: 'indicador', v: 'seguranca', min: 85 }, { tipo: 'global', v: 'tensao', max: 70 }] },
  { id: 'revolucao_educacional', nome: 'Revolução educacional', texto: 'Aumente o bem-estar em 10 pontos.',
    para: 'todas', condicoes: [{ tipo: 'progresso', v: 'bemEstar', min: 10 }] },
  { id: 'asia_conectada', nome: 'Ásia conectada', texto: 'Seja parceiro de 4 territórios da Ásia.',
    para: ['china', 'india', 'eua', 'russia', 'ue', 'japao', 'australia'], condicoes: [{ tipo: 'parceirosContinente', continente: 'ai', n: 4 }] },
  { id: 'mediadora', nome: 'Mediadora da paz', texto: 'Faça 2 mediações de paz bem-sucedidas.',
    para: 'todas', condicoes: [{ tipo: 'contador', c: 'mediacoes', min: 2 }] },
  { id: 'rede_aliados', nome: 'Rede de aliados', texto: 'Termine 2050 com 3 alianças estratégicas.',
    para: ['brasil', 'china', 'ue', 'india', 'russia', 'africa_do_sul', 'nigeria', 'egito', 'nova_zelandia'], condicoes: [{ tipo: 'aliancas', n: 3 }] },
  { id: 'amiga_de_muitos', nome: 'Amiga de muitos', texto: 'Termine com relação Amiga (40 ou mais) com 6 potências.',
    para: 'todas', condicoes: [{ tipo: 'relacoes', min: 40, n: 6 }] },
  { id: 'sem_inimigos', nome: 'Sem inimigos', texto: 'Termine sem nenhuma relação pior que Tensa (−30) com outra potência.',
    para: ['brasil', 'india', 'africa_do_sul', 'nigeria', 'egito'], condicoes: [{ tipo: 'semHostis', limite: -30 }] },
  { id: 'voz_do_sul', nome: 'Voz do Sul Global', texto: 'Termine com relação Amiga (40 ou mais) com 3 potências do Sul Global (Brasil, Índia, África do Sul, Nigéria e Egito).',
    para: 'todas', condicoes: [{ tipo: 'relacoesCom', com: ['brasil', 'india', 'africa_do_sul', 'nigeria', 'egito'], min: 40, n: 3 }] },
  { id: 'ponte_dos_blocos', nome: 'Ponte entre os blocos', texto: 'Termine com relação Cordial (10 ou mais) com os EUA e com a China ao mesmo tempo.',
    para: ['brasil', 'ue', 'india', 'russia', 'reino_unido', 'japao', 'australia', 'nova_zelandia', 'africa_do_sul', 'nigeria', 'egito'], condicoes: [{ tipo: 'relacoesCom', com: ['eua', 'china'], min: 10, n: 2 }] },
];

// Agenda secreta do agente infiltrado (modo cooperativo)
const AGENDAS = [
  { id: 'lobby_fossil', nome: 'Lobby fóssil', texto: 'Faça a temperatura chegar a 2,0 °C ou mais em 2050.', condicao: { tipo: 'global', v: 'temperatura', min: 2.0 } },
  { id: 'mercador_armas', nome: 'Mercador de armas', texto: 'Faça a tensão mundial terminar em 80 ou mais.', condicao: { tipo: 'global', v: 'tensao', min: 80 } },
  { id: 'especulador', nome: 'Especulador', texto: 'Faça o comércio global terminar em 40 ou menos.', condicao: { tipo: 'global', v: 'comercio', max: 40 } },
  { id: 'muralha', nome: 'Muralha', texto: 'Faça o número de deslocados terminar em 150 milhões ou mais.', condicao: { tipo: 'global', v: 'deslocados', min: 150 } },
];
