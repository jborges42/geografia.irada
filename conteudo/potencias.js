// =====================================================================
//  GEOGRAFIA IRADA — as seis potências jogáveis
// =====================================================================
//  Os números (0 a 100) são uma APROXIMAÇÃO DIDÁTICA de dados reais de 2023–2025
//  (IDH do PNUD, PIB do FMI, emissões do Global Carbon Project, matriz energética).
//  Servem para o jogo começar parecido com o mundo de verdade; as fichas citam as fontes.
//  Mudar valores aqui muda o equilíbrio do jogo: rode  node teste-simulacao.mjs  depois.
//  cor + forma identificam a potência (guia de arte: nunca só a cor): círculo, quadrado, triângulo,
//  estrela, losango e hexágono; emblema = o símbolo da forma, para texto.
//  crescimento ⚙ = base do crescimento econômico por mandato, recalibrada em out/2026 para que nenhuma
//  potência largue na frente no IGI (que mede avanço): os EUA ficam com 0 porque já crescem com tecnologia,
//  venda de excedentes, energia e parceiros; Índia e China seguem crescendo mais que a média.
// =====================================================================

const POTENCIAS = [
  {
    id: 'brasil', nome: 'Brasil', artigo: 'o', cor: '#27B263', forma: 'circulo', emblema: '●',
    lema: 'Potência ambiental e agrícola',
    forca: { titulo: 'Potência ambiental e agrícola', texto: 'Proteger as florestas rende o dobro de clima, e o agro produz +1 🌾 por mandato.' },
    fraqueza: { titulo: 'Desigualdade', texto: 'Sem políticas sociais, o bem-estar cresce mais devagar.' },
    permanente: false,
    inicial: { economia: 55, bemEstar: 79, ambiente: 62, seguranca: 58, apoio: 55, limpa: 50, militar: 30 },
    fossil: 0.5, desmatamento: 0.9, crescimento: 1.8, vulnerabilidade: 55,
    producao: { alimentos: 4, energia: 2, minerais: 2, tecnologia: 1 },
    consumo: { alimentos: 1, energia: 1 },
    ia: { economia: 1, bemEstar: 1.1, ambiente: 1, seguranca: .7, apoio: 1, influencia: 1, cooperacao: 1.1 },
  },
  {
    id: 'eua', nome: 'Estados Unidos', artigo: 'os', cor: '#0A32B4', forma: 'quadrado', emblema: '■',
    lema: 'Dólar e tecnologia',
    forca: { titulo: 'Dólar e tecnologia', texto: 'Sanções e acordos comerciais 50% mais fortes, e +1 💻 por mandato.' },
    fraqueza: { titulo: 'Polarização', texto: 'Quando as coisas pioram, o apoio popular despenca mais rápido.' },
    permanente: true,
    inicial: { economia: 85, bemEstar: 92, ambiente: 50, seguranca: 85, apoio: 50, limpa: 18, militar: 90 },
    fossil: 4.9, desmatamento: 0, crescimento: 0, vulnerabilidade: 40,
    producao: { alimentos: 2, energia: 3, minerais: 1, tecnologia: 4 },
    consumo: { alimentos: 1, energia: 2 },
    ia: { economia: 1.2, bemEstar: 1, ambiente: .6, seguranca: 1.2, apoio: 1, influencia: 1, cooperacao: .7 },
  },
  {
    id: 'china', nome: 'China', artigo: 'a', cor: '#D0180E', forma: 'triangulo', emblema: '▲',
    lema: 'Fábrica do mundo',
    forca: { titulo: 'Fábrica do mundo', texto: 'Infraestrutura no exterior custa 1 CP a menos, e a China produz terras raras (💎).' },
    fraqueza: { titulo: 'Maior emissor', texto: 'As emissões crescem junto com a economia.' },
    permanente: true,
    inicial: { economia: 78, bemEstar: 80, ambiente: 38, seguranca: 80, apoio: 60, limpa: 20, militar: 75 },
    fossil: 12.0, desmatamento: 0, crescimento: 3.4, vulnerabilidade: 50,
    producao: { alimentos: 1, energia: 1, minerais: 3, tecnologia: 3 },
    consumo: { alimentos: 2, energia: 2 },
    ia: { economia: 1.3, bemEstar: 1, ambiente: .8, seguranca: 1, apoio: .9, influencia: 1.2, cooperacao: .9 },
  },
  {
    id: 'ue', nome: 'União Europeia', artigo: 'a', cor: '#9645EE', forma: 'estrela', emblema: '★',
    lema: 'Mercado comum e regulação',
    forca: { titulo: 'Mercado comum e regulação', texto: 'Acordos comerciais e climáticos rendem +1 de cooperação. A França, país da UE, tem assento permanente no Conselho de Segurança.' },
    fraqueza: { titulo: 'Energia importada', texto: 'Produz pouca energia fóssil e depende de comprar ⚡.' },
    permanente: true,
    inicial: { economia: 80, bemEstar: 90, ambiente: 68, seguranca: 70, apoio: 55, limpa: 40, militar: 50 },
    fossil: 2.5, desmatamento: 0, crescimento: 2.4, vulnerabilidade: 35,
    producao: { alimentos: 2, energia: 0, minerais: 1, tecnologia: 3 },
    consumo: { alimentos: 1, energia: 1 },
    ia: { economia: 1, bemEstar: 1.1, ambiente: 1.2, seguranca: .9, apoio: 1, influencia: .9, cooperacao: 1.2 },
  },
  {
    id: 'india', nome: 'Índia', artigo: 'a', cor: '#FF9C0A', forma: 'losango', emblema: '◆',
    lema: 'Maior população do mundo',
    forca: { titulo: 'Gente e serviços digitais', texto: '+1 💻 por mandato e autonomia estratégica: alianças com qualquer um não aumentam a tensão.' },
    fraqueza: { titulo: 'Calor extremo', texto: 'Vulnerabilidade climática alta: o aquecimento pesa mais.' },
    permanente: false,
    inicial: { economia: 58, bemEstar: 69, ambiente: 35, seguranca: 65, apoio: 65, limpa: 12, militar: 55 },
    fossil: 3.1, desmatamento: 0, crescimento: 3.3, vulnerabilidade: 72,
    producao: { alimentos: 2, energia: 1, minerais: 1, tecnologia: 3 },
    consumo: { alimentos: 2, energia: 1 },
    ia: { economia: 1.2, bemEstar: 1.1, ambiente: .8, seguranca: 1, apoio: 1, influencia: 1, cooperacao: 1 },
  },
  {
    id: 'russia', nome: 'Rússia', artigo: 'a', cor: '#F2248F', forma: 'hexagono', emblema: '⬢',
    lema: 'Energia e território',
    forca: { titulo: 'Energia e território', texto: '+2 ⚡ por mandato e ganha mais quando a energia fica cara.' },
    fraqueza: { titulo: 'Dependência do petróleo', texto: 'A economia sofre quando a energia barateia, e sanções pesam mais.' },
    permanente: true,
    inicial: { economia: 52, bemEstar: 83, ambiente: 50, seguranca: 72, apoio: 60, limpa: 14, militar: 80 },
    fossil: 1.8, desmatamento: 0, crescimento: 1.3, vulnerabilidade: 35,
    producao: { alimentos: 2, energia: 5, minerais: 2, tecnologia: 1 },
    consumo: { alimentos: 1, energia: 1 },
    ia: { economia: 1, bemEstar: .9, ambiente: .6, seguranca: 1.3, apoio: 1, influencia: 1.1, cooperacao: .7 },
  },
];
