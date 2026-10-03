// =====================================================================
//  GEOGRAFIA IRADA — as treze potências jogáveis
// =====================================================================
//  Seis potências globais (Brasil, EUA, China, União Europeia, Índia, Rússia), mais Reino Unido e Japão
//  (potências globais), Austrália e Nova Zelândia (Oceania) e África do Sul, Nigéria e Egito (África).
//  Os números (0 a 100) são uma APROXIMAÇÃO DIDÁTICA de dados reais de 2023–2025
//  (IDH do PNUD, PIB do FMI, emissões do Global Carbon Project, matriz energética).
//  Servem para o jogo começar parecido com o mundo de verdade; as fichas citam as fontes.
//  Mudar valores aqui muda o equilíbrio do jogo: rode  node teste-simulacao.mjs  depois.
//  cor + forma identificam a potência (guia de arte: nunca só a cor); a cor e a forma de verdade moram em js/ui.js.
//  crescimento ⚙ = base do crescimento econômico por mandato, calibrada para que nenhuma
//  potência largue na frente no IGI (que mede avanço): os EUA ficam perto de 0 porque já crescem com tecnologia,
//  venda de excedentes, energia e parceiros; economias em alta (Índia, China, Nigéria) crescem mais que a média.
//  Recalibrado em out/2026 para 13 potências com relações bilaterais (IGI médio de cada uma entre 98 e 104 em 150 partidas);
//  a Austrália fica perto de 0 porque o comércio com a China e a exportação de energia e minérios já a fazem crescer.
//  mods ⚙ = ajustes de regra de cada potência (a força e a fraqueza dela no motor, js/simulacao.js):
//    fBem (quanto o crescimento vira bem-estar, padrão .3) · polarizacao (apoio cai mais rápido quando as coisas pioram) ·
//    energia (quanto o preço da energia pesa: >1 = mais) · sancao (quanto sanções pesam: >1 = mais) · agro (+alimentos por mandato) ·
//    exposicao (quanto choques de comércio e relações pesam na economia, padrão 1) · vizinhos (peso dos conflitos vizinhos na segurança,
//    padrão .5) · mediacao (soma à chance de mediar de paz) · influenciaRegional {continente: n} (+n de influência quando joga cartas ali)
// =====================================================================

const POTENCIAS = [
  {
    id: 'brasil', nome: 'Brasil', artigo: 'o', cor: '#27B263', forma: 'circulo', emblema: '●',
    lema: 'Potência ambiental e agrícola',
    forca: { titulo: 'Potência ambiental e agrícola', texto: 'Proteger as florestas rende o dobro de clima, e o agro produz +1 🌾 por mandato.' },
    fraqueza: { titulo: 'Desigualdade', texto: 'Sem políticas sociais, o bem-estar cresce mais devagar.' },
    permanente: false,
    inicial: { economia: 55, bemEstar: 79, ambiente: 62, seguranca: 58, apoio: 55, limpa: 50, militar: 30 },
    fossil: 0.5, desmatamento: 0.9, crescimento: 1.4, vulnerabilidade: 55,
    producao: { alimentos: 4, energia: 2, minerais: 2, tecnologia: 1 },
    consumo: { alimentos: 1, energia: 1 },
    mods: { fBem: .2, agro: 1 },
    ia: { economia: 1, bemEstar: 1.1, ambiente: 1, seguranca: .7, apoio: 1, influencia: 1, cooperacao: 1.1 },
  },
  {
    id: 'eua', nome: 'Estados Unidos', artigo: 'os', cor: '#0A32B4', forma: 'quadrado', emblema: '■',
    lema: 'Dólar e tecnologia',
    forca: { titulo: 'Dólar e tecnologia', texto: 'Sanções e acordos comerciais 50% mais fortes, e +1 💻 por mandato.' },
    fraqueza: { titulo: 'Polarização', texto: 'Quando as coisas pioram, o apoio popular despenca mais rápido.' },
    permanente: true,
    inicial: { economia: 85, bemEstar: 92, ambiente: 50, seguranca: 85, apoio: 50, limpa: 18, militar: 90 },
    fossil: 4.9, desmatamento: 0, crescimento: -0.2, vulnerabilidade: 40,
    producao: { alimentos: 2, energia: 3, minerais: 1, tecnologia: 4 },
    consumo: { alimentos: 1, energia: 2 },
    mods: { polarizacao: 1.5 },
    ia: { economia: 1.2, bemEstar: 1, ambiente: .6, seguranca: 1.2, apoio: 1, influencia: 1, cooperacao: .7 },
  },
  {
    id: 'china', nome: 'China', artigo: 'a', cor: '#D0180E', forma: 'triangulo', emblema: '▲',
    lema: 'Fábrica do mundo',
    forca: { titulo: 'Fábrica do mundo', texto: 'Infraestrutura no exterior custa 1 CP a menos, e a China produz terras raras (💎).' },
    fraqueza: { titulo: 'Maior emissor', texto: 'As emissões crescem junto com a economia.' },
    permanente: true,
    inicial: { economia: 78, bemEstar: 80, ambiente: 38, seguranca: 80, apoio: 60, limpa: 20, militar: 75 },
    fossil: 12.0, desmatamento: 0, crescimento: 3.35, vulnerabilidade: 50,
    producao: { alimentos: 1, energia: 1, minerais: 3, tecnologia: 3 },
    consumo: { alimentos: 2, energia: 2 },
    mods: {},
    ia: { economia: 1.3, bemEstar: 1, ambiente: .8, seguranca: 1, apoio: .9, influencia: 1.2, cooperacao: .9 },
  },
  {
    id: 'ue', nome: 'União Europeia', artigo: 'a', cor: '#9645EE', forma: 'estrela', emblema: '★',
    lema: 'Mercado comum e regulação',
    forca: { titulo: 'Mercado comum e regulação', texto: 'Acordos comerciais e climáticos rendem +1 de cooperação. A França, país da UE, tem assento permanente no Conselho de Segurança.' },
    fraqueza: { titulo: 'Energia importada', texto: 'Produz pouca energia fóssil e depende de comprar ⚡.' },
    permanente: true,
    inicial: { economia: 80, bemEstar: 90, ambiente: 68, seguranca: 70, apoio: 55, limpa: 40, militar: 50 },
    fossil: 2.5, desmatamento: 0, crescimento: 2.75, vulnerabilidade: 35,
    producao: { alimentos: 2, energia: 0, minerais: 1, tecnologia: 3 },
    consumo: { alimentos: 1, energia: 1 },
    mods: {},
    ia: { economia: 1, bemEstar: 1.1, ambiente: 1.2, seguranca: .9, apoio: 1, influencia: .9, cooperacao: 1.2 },
  },
  {
    id: 'india', nome: 'Índia', artigo: 'a', cor: '#FF9C0A', forma: 'losango', emblema: '◆',
    lema: 'Maior população do mundo',
    forca: { titulo: 'Gente e serviços digitais', texto: '+1 💻 por mandato e autonomia estratégica: alianças com qualquer um não aumentam a tensão.' },
    fraqueza: { titulo: 'Calor extremo', texto: 'Vulnerabilidade climática alta: o aquecimento pesa mais.' },
    permanente: false,
    inicial: { economia: 58, bemEstar: 69, ambiente: 35, seguranca: 65, apoio: 65, limpa: 12, militar: 55 },
    fossil: 3.1, desmatamento: 0, crescimento: 3.1, vulnerabilidade: 72,
    producao: { alimentos: 2, energia: 1, minerais: 1, tecnologia: 3 },
    consumo: { alimentos: 2, energia: 1 },
    mods: {},
    ia: { economia: 1.2, bemEstar: 1.1, ambiente: .8, seguranca: 1, apoio: 1, influencia: 1, cooperacao: 1 },
  },
  {
    id: 'russia', nome: 'Rússia', artigo: 'a', cor: '#F2248F', forma: 'hexagono', emblema: '⬢',
    lema: 'Energia e território',
    forca: { titulo: 'Energia e território', texto: '+2 ⚡ por mandato e ganha mais quando a energia fica cara.' },
    fraqueza: { titulo: 'Dependência do petróleo', texto: 'A economia sofre quando a energia barateia, e sanções pesam mais.' },
    permanente: true,
    inicial: { economia: 52, bemEstar: 83, ambiente: 50, seguranca: 72, apoio: 60, limpa: 14, militar: 80 },
    fossil: 1.8, desmatamento: 0, crescimento: 2.45, vulnerabilidade: 35,
    producao: { alimentos: 2, energia: 5, minerais: 2, tecnologia: 1 },
    consumo: { alimentos: 1, energia: 1 },
    mods: { energia: 1.2, sancao: 1.3 },
    ia: { economia: 1, bemEstar: .9, ambiente: .6, seguranca: 1.3, apoio: 1, influencia: 1.1, cooperacao: .7 },
  },
  // ---------------- novas potências globais ----------------
  {
    id: 'reino_unido', nome: 'Reino Unido', artigo: 'o', cor: '#00B3A4', forma: 'cruz', emblema: '✚',
    lema: 'Finanças, diplomacia e Commonwealth',
    forca: { titulo: 'Diplomacia e Commonwealth', texto: 'Missões diplomáticas rendem +1 de influência, e o Reino Unido tem assento permanente e veto no Conselho de Segurança.' },
    fraqueza: { titulo: 'Fora da União Europeia', texto: 'Depois do Brexit, o comércio com a UE atrita mais quando as relações azedam.' },
    permanente: true,
    inicial: { economia: 74, bemEstar: 92, ambiente: 66, seguranca: 80, apoio: 45, limpa: 45, militar: 62 },
    fossil: 0.33, desmatamento: 0, crescimento: 2.3, vulnerabilidade: 35,
    producao: { alimentos: 1, energia: 1, minerais: 0, tecnologia: 3 },
    consumo: { alimentos: 1, energia: 1 },
    mods: { exposicao: 1.2 },
    ia: { economia: 1, bemEstar: 1, ambiente: 1, seguranca: 1.1, apoio: 1, influencia: 1.1, cooperacao: 1 },
  },
  {
    id: 'japao', nome: 'Japão', artigo: 'o', cor: '#6C7A96', forma: 'anel', emblema: '◎',
    lema: 'Tecnologia e indústria de ponta',
    forca: { titulo: 'Tecnologia e indústria', texto: '+1 💻 por mandato, e a cooperação para o desenvolvimento rende +1 de influência.' },
    fraqueza: { titulo: 'Envelhecimento e energia importada', texto: 'A economia cresce devagar e depende de comprar ⚡ do exterior.' },
    permanente: false,
    inicial: { economia: 70, bemEstar: 92, ambiente: 58, seguranca: 70, apoio: 42, limpa: 28, militar: 52 },
    fossil: 1.0, desmatamento: 0, crescimento: 2.85, vulnerabilidade: 45,
    producao: { alimentos: 1, energia: 0, minerais: 0, tecnologia: 4 },
    consumo: { alimentos: 2, energia: 2 },
    mods: { energia: 1.1 },
    ia: { economia: 1.2, bemEstar: 1, ambiente: .9, seguranca: 1, apoio: 1, influencia: .9, cooperacao: 1.1 },
  },
  // ---------------- Oceania ----------------
  {
    id: 'australia', nome: 'Austrália', artigo: 'a', cor: '#9CCB1F', forma: 'gota', emblema: '💧',
    lema: 'Minerais e energia do Pacífico',
    forca: { titulo: 'Minerais e energia', texto: 'Exportadora de minério, carvão e gás (produz muito 💎 e ⚡): ganha quando a energia fica cara, e cartas de influência na Oceania rendem +1.' },
    fraqueza: { titulo: 'Dependência da China', texto: 'Mais de um terço do que vende vai para a China: se a relação azedar, a economia australiana sofre.' },
    permanente: false,
    inicial: { economia: 58, bemEstar: 94, ambiente: 55, seguranca: 70, apoio: 52, limpa: 40, militar: 40 },
    fossil: 0.39, desmatamento: 0, crescimento: 0.25, vulnerabilidade: 60,
    producao: { alimentos: 3, energia: 3, minerais: 4, tecnologia: 1 },
    consumo: { alimentos: 1, energia: 1 },
    mods: { exposicao: 1.4, influenciaRegional: { oc: 1 } },
    ia: { economia: 1.1, bemEstar: 1.1, ambiente: .8, seguranca: 1, apoio: 1, influencia: 1, cooperacao: 1 },
  },
  {
    id: 'nova_zelandia', nome: 'Nova Zelândia', artigo: 'a', cor: '#8E1B3A', forma: 'pentagono', emblema: '⬟',
    lema: 'Natureza e voz do Pacífico',
    forca: { titulo: 'Energia limpa e boa reputação', texto: 'Quase toda a eletricidade é renovável e o país é visto como neutro: mediações de paz ganham +10% de chance, e cartas de influência na Oceania rendem +1.' },
    fraqueza: { titulo: 'Pequena e distante', texto: 'Economia pequena: choques de comércio e sanções pesam mais, e o exército é modesto.' },
    permanente: false,
    inicial: { economia: 42, bemEstar: 93, ambiente: 78, seguranca: 75, apoio: 55, limpa: 62, militar: 15 },
    fossil: 0.033, desmatamento: 0, crescimento: 2.45, vulnerabilidade: 50,
    producao: { alimentos: 3, energia: 1, minerais: 0, tecnologia: 1 },
    consumo: { alimentos: 0, energia: 1 },
    mods: { exposicao: 1.6, mediacao: .1, influenciaRegional: { oc: 1 } },
    ia: { economia: 1, bemEstar: 1.2, ambiente: 1.4, seguranca: .8, apoio: 1, influencia: .8, cooperacao: 1.4 },
  },
  // ---------------- África ----------------
  {
    id: 'africa_do_sul', nome: 'África do Sul', artigo: 'a', cor: '#9A5B2E', forma: 'octogono', emblema: '⯃',
    lema: 'Voz da África e do BRICS',
    forca: { titulo: 'Voz da África e do BRICS', texto: 'Cartas que dão influência na África rendem +1, e a África do Sul produz platina e manganês (💎).' },
    fraqueza: { titulo: 'Apagões e desigualdade', texto: 'Falta energia e a desigualdade é uma das maiores do mundo: o bem-estar e o apoio sobem mais devagar.' },
    permanente: false,
    inicial: { economia: 40, bemEstar: 72, ambiente: 50, seguranca: 50, apoio: 50, limpa: 12, militar: 28 },
    fossil: 0.43, desmatamento: 0, crescimento: 2.7, vulnerabilidade: 62,
    producao: { alimentos: 2, energia: 1, minerais: 4, tecnologia: 1 },
    consumo: { alimentos: 1, energia: 1 },
    mods: { fBem: .22, influenciaRegional: { af: 1 } },
    ia: { economia: 1.1, bemEstar: 1.2, ambiente: .9, seguranca: .9, apoio: 1, influencia: 1, cooperacao: 1.2 },
  },
  {
    id: 'nigeria', nome: 'Nigéria', artigo: 'a', cor: '#FF7A66', forma: 'escudo', emblema: '⛊',
    lema: 'Gigante demográfico da África',
    forca: { titulo: 'Petróleo e população jovem', texto: 'Exportadora de petróleo (ganha quando a energia fica cara) e com a maior população da África: cresce rápido. Cartas de influência na África rendem +1.' },
    fraqueza: { titulo: 'Instabilidade e dependência do petróleo', texto: 'Conflitos no Sahel e no Golfo da Guiné pesam mais na segurança, e a economia sofre quando a energia barateia.' },
    permanente: false,
    inicial: { economia: 33, bemEstar: 55, ambiente: 42, seguranca: 40, apoio: 50, limpa: 15, militar: 30 },
    fossil: 0.13, desmatamento: 0, crescimento: 2.65, vulnerabilidade: 70,
    producao: { alimentos: 3, energia: 4, minerais: 1, tecnologia: 0 },
    consumo: { alimentos: 2, energia: 1 },
    mods: { energia: 1.2, vizinhos: 1.2, influenciaRegional: { af: 1 } },
    ia: { economia: 1.2, bemEstar: 1.1, ambiente: .7, seguranca: 1.1, apoio: 1, influencia: 1, cooperacao: 1 },
  },
  {
    id: 'egito', nome: 'Egito', artigo: 'o', cor: '#4DB6FF', forma: 'trapezio', emblema: '⏢',
    lema: 'Canal de Suez e ponte entre continentes',
    forca: { titulo: 'Canal de Suez e mediação', texto: 'Vive de ser ponte entre África, Ásia e Europa: mediações de paz ganham +15% de chance, e cartas de influência na África e na Ásia rendem +1.' },
    fraqueza: { titulo: 'Água e pão importado', texto: 'Depende do Nilo e importa trigo: a fome pesa e o clima extremo castiga a economia.' },
    permanente: false,
    inicial: { economia: 36, bemEstar: 70, ambiente: 40, seguranca: 55, apoio: 62, limpa: 10, militar: 45 },
    fossil: 0.26, desmatamento: 0, crescimento: 3.45, vulnerabilidade: 75,
    producao: { alimentos: 1, energia: 2, minerais: 1, tecnologia: 1 },
    consumo: { alimentos: 2, energia: 1 },
    mods: { mediacao: .15, influenciaRegional: { af: 1, ai: 1 } },
    ia: { economia: 1.1, bemEstar: 1, ambiente: .8, seguranca: 1.2, apoio: 1.1, influencia: 1, cooperacao: 1 },
  },
];

// ---------------------------------------------------------------------
//  RELAÇÕES BILATERAIS EM 2026 (de −100 hostil a +100 aliada). Cada par aparece uma vez.
//  É o "ponto de partida" que as decisões mexem: sem ações, a relação volta devagar para ele.
//  Aproximação didática: guerra e sanções (EUA×Rússia, UE×Rússia), rivalidade estratégica (EUA×China, Índia×China),
//  alianças (EUA×Japão, Reino Unido×Austrália) e laços do Sul Global (Brasil×África do Sul, Índia×Brasil).
// ---------------------------------------------------------------------
const RELACOES = {
  eua: { china: -35, russia: -55, ue: 55, reino_unido: 70, japao: 70, australia: 70, nova_zelandia: 55, india: 15, brasil: 5, africa_do_sul: -10, nigeria: 10, egito: 25 },
  china: { russia: 50, ue: -10, reino_unido: -15, japao: -35, australia: -20, nova_zelandia: 0, india: -25, brasil: 40, africa_do_sul: 40, nigeria: 30, egito: 30 },
  russia: { ue: -60, reino_unido: -65, japao: -35, australia: -45, nova_zelandia: -40, india: 30, brasil: 15, africa_do_sul: 20, nigeria: 5, egito: 25 },
  ue: { reino_unido: 40, japao: 40, australia: 40, nova_zelandia: 40, india: 20, brasil: 25, africa_do_sul: 25, nigeria: 20, egito: 25 },
  india: { reino_unido: 20, japao: 45, australia: 35, nova_zelandia: 20, brasil: 40, africa_do_sul: 40, nigeria: 20, egito: 25 },
  brasil: { reino_unido: 20, japao: 30, australia: 20, nova_zelandia: 20, africa_do_sul: 45, nigeria: 30, egito: 25 },
  reino_unido: { japao: 45, australia: 65, nova_zelandia: 60, africa_do_sul: 20, nigeria: 30, egito: 20 },
  japao: { australia: 55, nova_zelandia: 40, africa_do_sul: 15, nigeria: 10, egito: 15 },
  australia: { nova_zelandia: 75, africa_do_sul: 15, nigeria: 5, egito: 10 },
  nova_zelandia: { africa_do_sul: 15, nigeria: 5, egito: 10 },
  africa_do_sul: { nigeria: 35, egito: 25 },
  nigeria: { egito: 25 },
};
// Alianças que já existem em 2026 (ANZUS, tratados de defesa dos EUA com Japão e Reino Unido, parceria China–Rússia)
const ALIANCAS_INICIAIS = [['eua', 'reino_unido'], ['eua', 'japao'], ['eua', 'australia'], ['china', 'russia']];
// Comércio: fatia aproximada da economia de cada potência exposta a cada parceiro (0 a 1; 2024, UN Comtrade/Banco Mundial).
// Quando o parceiro vai bem ou mal, ou quando a relação azeda, essa fatia carrega a economia junto.
const COMERCIO = {
  brasil: { china: .3, ue: .15, eua: .12 },
  eua: { ue: .15, china: .12, japao: .05, reino_unido: .05 },
  china: { eua: .15, ue: .15, japao: .06, australia: .06, brasil: .05, russia: .04 },
  ue: { eua: .2, reino_unido: .12, china: .1, russia: .02 },
  india: { eua: .15, ue: .12, china: .1, russia: .05 },
  russia: { china: .35, india: .12, ue: .05 },
  reino_unido: { ue: .35, eua: .15, china: .05 },
  japao: { china: .2, eua: .18, australia: .05 },
  australia: { china: .35, japao: .12, india: .05, eua: .05 },
  nova_zelandia: { china: .25, australia: .2, eua: .1 },
  africa_do_sul: { china: .2, ue: .2, eua: .08, india: .06 },
  nigeria: { ue: .25, china: .12, india: .1, eua: .05 },
  egito: { ue: .25, china: .1, russia: .08, eua: .06 },
};
