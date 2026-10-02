// =====================================================================
//  GEOGRAFIA IRADA — fichas "Você sabia?" das potências e dos territórios
// =====================================================================
//  Aparecem quando alguém passa o mouse (ou toca) num lugar do mapa, no Manual
//  e no balanço do mandato. Professor(a): pode editar à vontade, mantendo o formato.
//
//  FICHAS.<id> = {
//    resumo: 'O papel do lugar no mundo, em 2 ou 3 frases (até 420 caracteres)',
//    fatos:  [ { texto: 'Um “Você sabia?” com número e ano (até 300 caracteres)', fonte: 'Órgão, ano' }, … ],
//    bncc:   ['EM13CHS201', …],   // habilidades que a ficha ajuda a trabalhar
//    // só nas 6 potências:
//    dado: 'IDH e população, cada um com ano e fonte (uma linha)',
//    emissoesPerCapita:  { valor, unidade: 't CO₂ por pessoa', ano, fonte, nota },
//    emissoesHistoricas: { valor, unidade: '% das emissões acumuladas desde 1850', ano, fonte, nota },
//  }
//  Os ids são os de potencias.js e territorios.js (6 potências + 33 territórios).
//
//  Por que três números de emissão? Quem mais emite hoje nem sempre é quem mais
//  emite por pessoa, nem quem mais emitiu desde 1850. Olhar os três evita culpar
//  um país de forma simplista. Per capita = CO₂ de combustíveis fósseis e cimento
//  (média mundial em 2024: 4,7 t por pessoa). Histórico = fósseis, cimento e uso
//  da terra (desmatamento), de 1850 a 2024. Fonte: Our World in Data, com dados do
//  Global Carbon Project (Global Carbon Budget 2025).
//
//  Números mudam: cada fato traz o ano. Antes de usar um fato em aula, confira a
//  data e, se quiser, atualize. Para checar o formato depois de editar:
//      node ferramentas/validar-conteudo.mjs fichas
//  Cuidados: textos entre aspas simples '…'; para aspas dentro do texto use “ ”.
// =====================================================================

const FICHAS = {
  // ======================= POTÊNCIAS =======================
  brasil: {
    resumo: 'Maior país da América do Sul, o Brasil abriga cerca de 60% da Floresta Amazônica e é uma potência agrícola e ambiental. Faz a ponte entre países ricos e o Sul Global no Mercosul, no BRICS e no G20, que presidiu em 2024, e sediou a COP30, em Belém, em 2025.',
    dado: 'IDH 0,786, 84º de 193 países (dado de 2023; PNUD, RDH 2025) · 214,2 milhões de habitantes (IBGE, estimativa de 2026)',
    emissoesPerCapita: { valor: 2.3, unidade: 't CO₂ por pessoa', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'Só combustíveis fósseis e cimento. Somando o desmatamento e outras mudanças no uso da terra, foram 9,8 t por pessoa. Média mundial: 4,7 t.' },
    emissoesHistoricas: { valor: 5.1, unidade: '% das emissões acumuladas desde 1850', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'CO₂ de combustíveis fósseis, cimento e uso da terra (desmatamento), de 1850 a 2024. No Brasil, a maior parte vem do desmatamento.' },
    fatos: [
      { texto: 'Entre agosto de 2024 e julho de 2025, o desmatamento na Amazônia Legal foi de 5.731 km², 12% menos que no período anterior e o menor desde 2014.', fonte: 'INPE, Prodes (taxa consolidada de 2025)' },
      { texto: 'Em 2025, 86,8% da eletricidade do Brasil veio de fontes renováveis, como água, vento, sol e biomassa. Somando toda a energia usada no país, foram 49,4%, contra 14,5% na média mundial (2023).', fonte: 'EPE, Balanço Energético Nacional 2026' },
      { texto: 'O Brasil é o maior produtor e exportador de soja do mundo: na safra 2025/26, vendeu cerca de 61% de toda a soja exportada no planeta. Em 2025, 79% da soja brasileira exportada foi para a China.', fonte: 'USDA, set. 2026; MDIC, Comex Stat 2026' },
    ],
    bncc: ['EM13CHS302', 'EM13CHS304', 'EM13CHS306', 'EM13CHS606', 'EM13CNT309'],
  },

  eua: {
    resumo: 'Maior economia do mundo, com cerca de 26% do PIB mundial em 2025, os Estados Unidos lideram em tecnologia, finanças e poder militar, e o dólar é a principal moeda das trocas internacionais. Como membro permanente do Conselho de Segurança da ONU, com direito a veto, o país tem grande peso em alianças, no comércio e na cultura.',
    dado: 'IDH 0,938, 17º de 193 países (dado de 2023; PNUD, RDH 2025) · 341,8 milhões de habitantes (Banco Mundial, dado de 2025)',
    emissoesPerCapita: { valor: 14.2, unidade: 't CO₂ por pessoa', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'Só combustíveis fósseis e cimento. Média mundial: 4,7 t.' },
    emissoesHistoricas: { valor: 20.4, unidade: '% das emissões acumuladas desde 1850', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'CO₂ de combustíveis fósseis, cimento e uso da terra (desmatamento), de 1850 a 2024. É a maior fatia do mundo.' },
    fatos: [
      { texto: 'Em abril de 2025, o dólar estava em 89,2% de todas as operações de câmbio do mundo, ou seja, em quase 9 de cada 10 trocas entre moedas.', fonte: 'Banco de Compensações Internacionais (BIS), 2025' },
      { texto: 'Em 2025, os EUA gastaram US$ 954 bilhões com as Forças Armadas, cerca de um terço de todo o gasto militar do planeta (US$ 2,9 trilhões).', fonte: 'SIPRI, 2026' },
      { texto: 'Em janeiro de 2026, os EUA concluíram a saída do Acordo de Paris, sobre o clima, e da Organização Mundial da Saúde (OMS), anunciadas em 2025.', fonte: 'ONU, 2026' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS202', 'EM13CHS305', 'EM13CHS604'],
  },

  china: {
    resumo: 'Segunda maior economia do mundo, a China é a principal fábrica do planeta e lidera a produção de painéis solares, baterias e terras raras. É a maior parceira comercial do Brasil e amplia sua influência com investimentos em portos, ferrovias e energia pela Nova Rota da Seda.',
    dado: 'IDH 0,797, 78º de 193 países (dado de 2023; PNUD, RDH 2025) · 1,41 bilhão de habitantes (Banco Mundial, dado de 2025)',
    emissoesPerCapita: { valor: 8.7, unidade: 't CO₂ por pessoa', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'Só combustíveis fósseis e cimento. Média mundial: 4,7 t. É o país que mais emite no total hoje (cerca de 32% do CO₂ fóssil do mundo em 2024).' },
    emissoesHistoricas: { valor: 13.1, unidade: '% das emissões acumuladas desde 1850', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'CO₂ de combustíveis fósseis, cimento e uso da terra (desmatamento), de 1850 a 2024.' },
    fatos: [
      { texto: 'Em cerca de 40 anos, quase 800 milhões de chineses saíram da pobreza extrema: perto de três quartos de toda a redução da pobreza extrema no mundo no período.', fonte: 'Banco Mundial, 2022' },
      { texto: 'Em 2025, a China comprou 28,7% de tudo o que o Brasil exportou (US$ 99,9 bilhões), sobretudo soja, petróleo e minério de ferro. É a maior parceira comercial do Brasil desde 2009.', fonte: 'MDIC, Comex Stat 2026' },
      { texto: 'Em 2025, a China extraiu cerca de 69% das terras raras do mundo, usadas em ímãs de carros elétricos, turbinas eólicas e celulares. O Brasil tem a 2ª maior reserva, atrás da chinesa.', fonte: 'USGS, Mineral Commodity Summaries 2026' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS202', 'EM13CHS302', 'EM13CHS402'],
  },

  ue: {
    resumo: 'Bloco de 27 países europeus com mercado comum, livre circulação de pessoas e, em 21 deles, a mesma moeda: o euro. Uma das maiores economias do mundo, a União Europeia influencia regras globais sobre clima, dados e comércio, e a França, um de seus membros, tem assento permanente no Conselho de Segurança da ONU.',
    dado: 'IDH dos 27 países: de 0,845 (Bulgária e Romênia) a 0,962 (Dinamarca), dados de 2023 (PNUD, RDH 2025) · 452,0 milhões de habitantes em 1º/1/2026 (Eurostat)',
    emissoesPerCapita: { valor: 5.4, unidade: 't CO₂ por pessoa', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'Só combustíveis fósseis e cimento. Média mundial: 4,7 t.' },
    emissoesHistoricas: { valor: 11.5, unidade: '% das emissões acumuladas desde 1850', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'CO₂ de combustíveis fósseis, cimento e uso da terra (desmatamento), de 1850 a 2024, somando os 27 países atuais.' },
    fatos: [
      { texto: 'Em 2024, as emissões de gases de efeito estufa da União Europeia ficaram cerca de 37% abaixo das de 1990, enquanto a economia do bloco cresceu.', fonte: 'Agência Europeia do Ambiente, 2025' },
      { texto: 'O gás russo era 45% do gás importado pela União Europeia antes da guerra na Ucrânia. Em 2025, caiu para 12%, com compras de outros países, economia de energia e mais fontes renováveis.', fonte: 'Comissão Europeia, 2026' },
      { texto: 'Assinado em janeiro de 2026, o acordo comercial Mercosul–União Europeia vale de forma provisória desde 1º de maio de 2026. Como bloco, a UE é a 2ª maior parceira comercial do Brasil: cerca de US$ 100 bilhões em trocas em 2025.', fonte: 'Senado Federal e Comissão Europeia, 2026' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS305', 'EM13CHS604', 'EM13CNT309'],
  },

  india: {
    resumo: 'Desde 2023, a Índia é o país mais populoso do mundo, com cerca de 1,46 bilhão de habitantes e uma população jovem. É uma das grandes economias que mais crescem, forte em serviços digitais, remédios e programa espacial, e pratica a “autonomia estratégica”: dialoga com o Ocidente, com a Rússia e com o Sul Global.',
    dado: 'IDH 0,685, 130º de 193 países (dado de 2023; PNUD, RDH 2025) · 1,46 bilhão de habitantes (Banco Mundial, dado de 2025)',
    emissoesPerCapita: { valor: 2.2, unidade: 't CO₂ por pessoa', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'Só combustíveis fósseis e cimento. Média mundial: 4,7 t. No total, é o 3º maior emissor atual, por causa da enorme população.' },
    emissoesHistoricas: { valor: 3.8, unidade: '% das emissões acumuladas desde 1850', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'CO₂ de combustíveis fósseis, cimento e uso da terra (desmatamento), de 1850 a 2024.' },
    fatos: [
      { texto: 'Em 2023, a Índia passou a China e virou o país mais populoso do mundo. Em 2025, eram cerca de 1,46 bilhão de indianos e 1,41 bilhão de chineses.', fonte: 'ONU, 2023; Banco Mundial, 2026' },
      { texto: 'A população indiana é jovem: metade tem menos de 29 anos. Na China, a idade mediana passa de 40 anos (2025).', fonte: 'ONU, World Population Prospects 2024' },
      { texto: 'Em agosto de 2023, a sonda indiana Chandrayaan-3 pousou perto do polo sul da Lua, algo que nenhum país tinha conseguido antes.', fonte: 'ISRO (agência espacial da Índia), 2023' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS202', 'EM13CHS206', 'EM13CHS603'],
  },

  russia: {
    resumo: 'Maior país do mundo em área, a Rússia vai da Europa ao Oceano Pacífico e tem 11 fusos horários. É uma potência energética e nuclear, com assento permanente no Conselho de Segurança da ONU; desde a invasão da Ucrânia, em 2022, sofre sanções de países ocidentais e ampliou laços com a Ásia e o Sul Global.',
    dado: 'IDH 0,832, 64º de 193 países (dado de 2023; PNUD, RDH 2025) · 143,5 milhões de habitantes (Banco Mundial, dado de 2025)',
    emissoesPerCapita: { valor: 12.3, unidade: 't CO₂ por pessoa', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'Só combustíveis fósseis e cimento. Média mundial: 4,7 t.' },
    emissoesHistoricas: { valor: 8.3, unidade: '% das emissões acumuladas desde 1850', ano: 2024, fonte: 'Our World in Data / Global Carbon Project (Global Carbon Budget 2025)',
      nota: 'CO₂ de combustíveis fósseis, cimento e uso da terra (desmatamento), de 1850 a 2024.' },
    fatos: [
      { texto: 'A Rússia tem as maiores reservas de gás natural do mundo: cerca de 22% do total conhecido em 2024.', fonte: 'OPEP, Boletim Estatístico Anual 2025' },
      { texto: 'Em 2025, a Rússia foi a maior fornecedora de fertilizantes do Brasil em valor: cerca de 26% do total importado, usado nas lavouras de soja, milho e outras.', fonte: 'MDIC, Comex Stat 2026' },
      { texto: 'Rússia e EUA têm juntos cerca de 83% das ogivas nucleares dos estoques militares do mundo (janeiro de 2026). O tratado New START, que limitava esses arsenais, expirou em fevereiro de 2026.', fonte: 'SIPRI, Anuário 2026' },
    ],
    bncc: ['EM13CHS204', 'EM13CHS302', 'EM13CHS503', 'EM13CHS604', 'EM13CNT309'],
  },

  // ======================= AMÉRICA DO NORTE =======================
  canada: {
    resumo: 'Segundo maior país do mundo em área, o Canadá tem petróleo, minérios, água doce e enormes florestas boreais. Membro do G7 e da OTAN, tem nos EUA, seu vizinho, o maior parceiro comercial.',
    fatos: [
      { texto: 'Em 2023, incêndios florestais queimaram mais de 15 milhões de hectares no Canadá, o pior ano já registrado no país: uma área maior que a de Santa Catarina.', fonte: 'Centro Interagências de Incêndios Florestais do Canadá (CIFFC), 2023' },
      { texto: 'Em 1995, a província do Quebec, de língua francesa, votou se queria se separar do Canadá. O “não” venceu por 50,6% a 49,4%.', fonte: 'Eleições Quebec, 1995' },
      { texto: 'A fronteira entre Canadá e EUA tem 8.891 km: é a mais longa do mundo entre dois países.', fonte: 'Comissão Internacional de Fronteiras Canadá–EUA' },
    ],
    bncc: ['EM13CHS204', 'EM13CHS304', 'EM13CHS603'],
  },

  mexico: {
    resumo: 'O México liga a América do Norte à América Latina e forma, com EUA e Canadá, um dos maiores blocos comerciais do planeta. Exporta carros, eletrônicos e alimentos, tem forte herança indígena e está no centro das rotas de migração para o norte.',
    fatos: [
      { texto: 'Em 2023 e 2024, o México foi o país que mais vendeu mercadorias para os EUA: US$ 505,9 bilhões em 2024, 15,5% de tudo o que os americanos importaram.', fonte: 'Departamento do Censo dos EUA, 2025' },
      { texto: 'Cerca de 38 milhões de pessoas de origem mexicana viviam nos EUA em 2023, a maior comunidade de origem latino-americana do país.', fonte: 'Departamento do Censo dos EUA, 2024' },
      { texto: 'Além do espanhol, o México reconhece 68 línguas indígenas como nacionais. Em 2020, cerca de 7,4 milhões de pessoas falavam alguma delas.', fonte: 'INALI; INEGI, Censo 2020' },
    ],
    bncc: ['EM13CHS104', 'EM13CHS201', 'EM13CHS204'],
  },

  america_central: {
    resumo: 'Sete países ocupam o istmo que liga as Américas, cortado pelo Canal do Panamá, atalho entre os oceanos Atlântico e Pacífico. A região sofre com furacões e secas, e a pobreza e a violência levam muitas famílias a migrar para o norte.',
    fatos: [
      { texto: 'Inaugurado em 1914, o Canal do Panamá tem 82 km e liga o Atlântico ao Pacífico. Por ele passa cerca de 5% do comércio marítimo mundial.', fonte: 'Autoridade do Canal do Panamá' },
      { texto: 'Em 2023, uma seca baixou o lago que abastece o Canal do Panamá: em dezembro, só 22 navios por dia podiam passar, em vez dos 36 habituais.', fonte: 'Autoridade do Canal do Panamá, 2023' },
      { texto: 'Em 2023, mais de 520 mil migrantes atravessaram a selva de Darién, entre a Colômbia e o Panamá, um recorde. A maioria era de venezuelanos.', fonte: 'Serviço Nacional de Migração do Panamá, 2024' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS206', 'EM13CHS306'],
  },

  caribe: {
    resumo: 'Milhares de ilhas, com países de línguas espanhola, inglesa, francesa, holandesa e crioulas, que vivem muito do turismo. Furacões mais fortes e a subida do mar ameaçam a região, e o Haiti enfrenta uma grave crise humanitária: no fim de 2025, cerca de 1,4 milhão de haitianos estavam deslocados dentro do país.',
    fatos: [
      { texto: 'Em 1804, o Haiti se tornou o primeiro país independente da América Latina, criado por pessoas escravizadas que se rebelaram em 1791. A UNESCO lembra essa revolta todo dia 23 de agosto.', fonte: 'UNESCO (Dia Internacional de Lembrança do Tráfico de Escravos)' },
      { texto: 'Em outubro de 2025, o furacão Melissa atingiu a Jamaica com ventos de cerca de 300 km/h, um dos mais fortes já registrados no Atlântico.', fonte: 'NOAA (Centro Nacional de Furacões dos EUA), 2025' },
      { texto: 'De 2004 a 2017, o Brasil comandou as tropas da Missão das Nações Unidas para a Estabilização no Haiti (Minustah).', fonte: 'ONU, 2017' },
    ],
    bncc: ['EM13CHS304', 'EM13CHS601', 'EM13CHS604'],
  },

  groenlandia: {
    resumo: 'A Groenlândia, maior ilha do mundo, é um território autônomo do Reino da Dinamarca, de maioria inuíte. Seu manto de gelo derrete com o aquecimento global, o que eleva o nível do mar e abre rotas e minas no Ártico, alvo do interesse de grandes potências.',
    fatos: [
      { texto: 'O manto de gelo cobre cerca de 80% da Groenlândia. Se derretesse por inteiro, o nível do mar subiria cerca de 7,4 metros no mundo todo.', fonte: 'NSIDC (Centro Nacional de Dados de Neve e Gelo dos EUA)' },
      { texto: 'Desde 2002, satélites mostram que a Groenlândia perde, em média, cerca de 266 bilhões de toneladas de gelo por ano.', fonte: 'NASA (satélites GRACE), 2025' },
      { texto: 'Cerca de 57 mil pessoas vivem na Groenlândia, quase 90% delas inuítes. Desde 2009, a ilha tem autogoverno, inclusive o direito de decidir sobre sua independência.', fonte: 'Governo da Groenlândia; Estatísticas da Groenlândia, 2025' },
    ],
    bncc: ['EM13CHS204', 'EM13CHS306', 'EM13CHS603'],
  },

  // ======================= AMÉRICA DO SUL =======================
  andes: {
    resumo: 'Colômbia, Equador, Peru e Bolívia são cortados pela Cordilheira dos Andes, têm forte herança indígena e parte da Floresta Amazônica. A região é rica em cobre, prata, gás e lítio, e a Colômbia assinou em 2016 um acordo de paz que encerrou mais de 50 anos de conflito com a guerrilha das FARC.',
    fatos: [
      { texto: 'Em 2025, o Peru foi o 3º maior produtor de cobre do mundo, com cerca de 2,7 milhões de toneladas, atrás do Chile e da RD Congo.', fonte: 'USGS, Mineral Commodity Summaries 2026' },
      { texto: 'A Bolívia tem cerca de 23 milhões de toneladas em recursos de lítio, metal das baterias: os segundos maiores do mundo, depois dos da Argentina.', fonte: 'USGS, Mineral Commodity Summaries 2026' },
      { texto: 'O Peru abriga cerca de 71% das geleiras tropicais do mundo. Elas encolhem com o aquecimento global e abastecem rios, cidades e hidrelétricas.', fonte: 'INAIGEM (Instituto de Geleiras do Peru), 2023' },
    ],
    bncc: ['EM13CHS302', 'EM13CHS306', 'EM13CHS503', 'EM13CNT309'],
  },

  venezuela_guianas: {
    resumo: 'A Venezuela tem as maiores reservas provadas de petróleo do mundo, e a Guiana virou um novo polo petrolífero no mar. Anos de crise econômica e política levaram milhões de venezuelanos a emigrar; em janeiro de 2026, uma operação militar dos EUA capturou o presidente Nicolás Maduro, e a vice-presidente Delcy Rodríguez assumiu o governo de forma interina.',
    fatos: [
      { texto: 'Com cerca de 303 bilhões de barris, a Venezuela tem as maiores reservas provadas de petróleo do mundo: 19% do total (2024).', fonte: 'OPEP, Boletim Estatístico Anual 2025' },
      { texto: 'No fim de 2025, cerca de 7,6 milhões de venezuelanos viviam fora do país por causa da crise. O Brasil acolhia cerca de 730 mil, muitos levados pela Operação Acolhida a cidades do Sul.', fonte: 'ACNUR, 2026; Governo Federal (Operação Acolhida)' },
      { texto: 'A Venezuela reivindica o Essequibo, 159.500 km² definidos por uma arbitragem de 1899, quase três quartos da Guiana. Desde 2018, o caso está na Corte Internacional de Justiça.', fonte: 'Corte Internacional de Justiça (caso Guiana x Venezuela)' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS204', 'EM13CHS302', 'EM13CHS604'],
  },

  cone_sul: {
    resumo: 'Argentina, Chile, Uruguai e Paraguai são grandes produtores de alimentos e, nos Andes, de cobre e lítio. Com o Brasil, Argentina, Uruguai e Paraguai fundaram o Mercosul em 1991; o Chile é associado ao bloco.',
    fatos: [
      { texto: 'Em 2025, o Chile extraiu cerca de 23% do cobre do mundo (5,3 milhões de toneladas), metal essencial para fios elétricos e carros elétricos.', fonte: 'USGS, Mineral Commodity Summaries 2026' },
      { texto: 'A Argentina tem os maiores recursos de lítio identificados do mundo, cerca de 28 milhões de toneladas. Com a Bolívia e o Chile, forma o “Triângulo do Lítio”.', fonte: 'USGS, Mineral Commodity Summaries 2026' },
      { texto: 'Em 2025, a Argentina foi o 3º maior destino das exportações brasileiras (US$ 18,1 bilhões), atrás de China e EUA. Santa Catarina faz fronteira com a província argentina de Misiones.', fonte: 'MDIC, Comex Stat 2026; IBGE' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS204', 'EM13CHS302', 'EM13CNT309'],
  },

  // ======================= EUROPA =======================
  reino_unido: {
    resumo: 'Reino Unido, Noruega, Islândia e Suíça são países europeus ricos que ficaram fora da União Europeia, mas mantêm laços fortes com ela. O Reino Unido tem assento permanente com veto no Conselho de Segurança da ONU; a Noruega exporta petróleo e gás; e a Suíça abriga, em Genebra, sedes de órgãos internacionais.',
    fatos: [
      { texto: 'Em 2016, 51,9% dos eleitores britânicos votaram por sair da União Europeia. O Brexit aconteceu em 31 de janeiro de 2020.', fonte: 'Comissão Eleitoral do Reino Unido, 2016' },
      { texto: 'O fundo soberano da Noruega, criado em 1990 com a renda do petróleo, valia cerca de 22,7 trilhões de coroas norueguesas (perto de US$ 2,4 trilhões) em junho de 2026: é o maior fundo do tipo no mundo.', fonte: 'Norges Bank (banco central da Noruega); Reuters, 2026' },
      { texto: 'Islândia (0,972), Noruega e Suíça (0,970) têm os três maiores IDHs do mundo.', fonte: 'PNUD, RDH 2025 (dados de 2023)' },
    ],
    bncc: ['EM13CHS402', 'EM13CHS603', 'EM13CHS604', 'EM13MAT104'],
  },

  balcas: {
    resumo: 'Região montanhosa do sudeste da Europa marcada pela divisão da Iugoslávia nos anos 1990, com guerras que deixaram muitos refugiados. Hoje, quase todos esses países tentam entrar na União Europeia, enquanto Rússia e China também buscam influência.',
    fatos: [
      { texto: 'O Acordo de Dayton, de 1995, encerrou a guerra na Bósnia e Herzegovina e criou um Estado com duas entidades e uma presidência dividida entre três povos.', fonte: 'ONU; OSCE' },
      { texto: 'O Kosovo declarou independência da Sérvia em 2008. Mais da metade dos países da ONU o reconhece, mas Sérvia, Brasil, China e Rússia, não.', fonte: 'Itamaraty; Corte Internacional de Justiça (parecer de 2010)' },
      { texto: 'Desde 2002, Montenegro e Kosovo usam o euro como moeda, mesmo sem fazer parte da União Europeia.', fonte: 'Banco Central Europeu, 2026' },
    ],
    bncc: ['EM13CHS203', 'EM13CHS204', 'EM13CHS603', 'EM13CHS604'],
  },

  leste_europeu: {
    resumo: 'Ucrânia, Belarus e Moldávia ficam entre a União Europeia e a Rússia e fizeram parte da União Soviética até 1991. A Ucrânia, grande celeiro de grãos, foi invadida pela Rússia em 2022; a guerra causou uma enorme crise humanitária e mexeu com os preços mundiais de alimentos e energia.',
    fatos: [
      { texto: 'No fim de 2025, cerca de 5,2 milhões de ucranianos viviam como refugiados em outros países e 3,7 milhões estavam deslocados dentro da Ucrânia.', fonte: 'ACNUR, 2026' },
      { texto: 'Entre julho de 2022 e julho de 2023, um acordo mediado pela ONU e pela Turquia permitiu à Ucrânia exportar quase 33 milhões de toneladas de alimentos pelo Mar Negro.', fonte: 'ONU, 2023' },
      { texto: 'Em 1986, a explosão de um reator na usina de Chernobyl, na Ucrânia (então parte da URSS), causou o pior acidente nuclear da história.', fonte: 'AIEA (Agência Internacional de Energia Atômica)' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS503', 'EM13CHS604', 'EM13CNT103'],
  },

  // ======================= ÁFRICA =======================
  norte_africa: {
    resumo: 'Do Marrocos ao Egito, a região une o Deserto do Saara, o Mar Mediterrâneo e o Rio Nilo, com população majoritariamente árabe e berbere. Vende gás e petróleo para a Europa, controla o Canal de Suez e é ponto de partida de travessias de migrantes rumo à Europa.',
    fatos: [
      { texto: 'O Marrocos tem cerca de 68% das reservas mundiais de rocha fosfática, matéria-prima de adubos. Não existe substituto para o fósforo na agricultura.', fonte: 'USGS, Mineral Commodity Summaries 2026' },
      { texto: 'Inaugurado em 1869, o Canal de Suez é o atalho marítimo entre a Europa e a Ásia. Desde o fim de 2023, ataques a navios no Mar Vermelho fizeram muitas empresas desviarem pelo sul da África.', fonte: 'Conselho de Segurança da ONU, Resolução 2722 (2024)' },
      { texto: 'A Primavera Árabe, onda de protestos por democracia e emprego, começou na Tunísia em dezembro de 2010 e se espalhou por vários países árabes em 2011.', fonte: 'Encyclopaedia Britannica' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS302', 'EM13CHS603'],
  },

  sahel: {
    resumo: 'Faixa semiárida ao sul do Saara, uma das regiões mais vulneráveis ao aquecimento global e com população muito jovem. Golpes militares desde 2020, grupos armados e secas deslocaram milhões de pessoas; Mali, Burkina Faso e Níger romperam com a França e buscaram novos parceiros, como a Rússia.',
    fatos: [
      { texto: 'Lançada pela União Africana em 2007, a Grande Muralha Verde quer recuperar 100 milhões de hectares de terras degradadas no Sahel até 2030.', fonte: 'UNCCD (Convenção da ONU de Combate à Desertificação)' },
      { texto: 'No Níger, metade da população tem menos de 16 anos: é uma das populações mais jovens do planeta (2025).', fonte: 'ONU, World Population Prospects 2024' },
      { texto: 'No fim de 2025, o Chade abrigava cerca de 1,5 milhão de refugiados. Cerca de 1,3 milhão vieram do vizinho Sudão, a maioria fugindo da guerra iniciada em 2023.', fonte: 'ACNUR, 2026' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS306', 'EM13CHS503', 'EM13CHS604'],
  },

  africa_ocidental: {
    resumo: 'Região do país mais populoso da África, a Nigéria, e de grandes metrópoles como Lagos. Produz petróleo, ouro e cacau e reúne seus países na CEDEAO; Guiné-Bissau e Cabo Verde falam português e têm laços históricos com o Brasil.',
    fatos: [
      { texto: 'Em 2024, os países da África Ocidental colheram 56% do cacau do mundo; só a Costa do Marfim produziu 36%.', fonte: 'FAO (FAOSTAT), 2026' },
      { texto: 'Com cerca de 237 milhões de habitantes em 2025, a Nigéria é o país mais populoso da África e o 6º do mundo.', fonte: 'Banco Mundial, 2026' },
      { texto: 'A CEDEAO, bloco criado em 1975, garante a livre circulação de pessoas entre seus membros. Em janeiro de 2025, Mali, Burkina Faso e Níger deixaram o bloco.', fonte: 'CEDEAO, 2025' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS302', 'EM13CHS604'],
  },

  africa_central: {
    resumo: 'A região guarda a floresta da Bacia do Congo, a segunda maior floresta tropical do mundo, e minérios essenciais para baterias, como cobalto e cobre. A riqueza mineral convive com pobreza e conflitos armados, sobretudo no leste da RD Congo, que deslocaram milhões de pessoas.',
    fatos: [
      { texto: 'Em 2025, a RD Congo extraiu cerca de 73% do cobalto do mundo, metal usado em baterias de celulares e de carros elétricos.', fonte: 'USGS, Mineral Commodity Summaries 2026' },
      { texto: 'No fim de 2025, cerca de 5,7 milhões de pessoas estavam deslocadas dentro da RD Congo por causa de conflitos, um dos maiores números do mundo.', fonte: 'ACNUR, 2026' },
      { texto: 'São Tomé e Príncipe, que fundou a CPLP com o Brasil em 1996, e a Guiné Equatorial, que entrou em 2014, fazem parte da comunidade dos países de língua portuguesa.', fonte: 'CPLP' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS302', 'EM13CHS503', 'EM13CHS604'],
  },

  africa_oriental: {
    resumo: 'Do Chifre da África aos Grandes Lagos, a região tem o Rio Nilo, o Vale do Rift e algumas das economias que mais crescem no continente. Secas severas e a guerra civil no Sudão, iniciada em 2023, criaram uma das maiores crises humanitárias do mundo.',
    fatos: [
      { texto: 'No fim de 2025, quase 13 milhões de sudaneses estavam deslocados à força, dentro e fora do país: a maior crise de deslocamento do mundo.', fonte: 'ACNUR, Tendências Globais (jun. 2026)' },
      { texto: 'Em 2025, Uganda era o país africano que mais acolhia refugiados: cerca de 1,9 milhão, vindos sobretudo do Sudão do Sul e da RD Congo.', fonte: 'ACNUR, 2026' },
      { texto: 'Inaugurada em setembro de 2025 no Nilo Azul, a Grande Barragem do Renascimento, da Etiópia, é a maior hidrelétrica da África (5,15 GW). O Egito, que depende do Nilo, teme perder água.', fonte: 'Governo da Etiópia, 2025; Conselho de Segurança da ONU, 2021' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS306', 'EM13CHS503', 'EM13CHS604'],
  },

  africa_austral: {
    resumo: 'Região rica em minérios, como cobre, diamantes, platina e grafite, e com laços históricos com o Brasil: Angola e Moçambique falam português. Enfrenta secas ligadas ao El Niño, ciclones no Oceano Índico e o desafio de transformar recursos naturais em desenvolvimento.',
    fatos: [
      { texto: 'Angola e Moçambique fundaram, com Brasil, Portugal e outros países, a CPLP (Comunidade dos Países de Língua Portuguesa), em 1996.', fonte: 'CPLP' },
      { texto: 'O Brasil foi o maior destino do tráfico de africanos escravizados: recebeu cerca de 40% das pessoas levadas à força às Américas, muitas embarcadas em portos de Angola, como Luanda e Benguela.', fonte: 'Slave Voyages (banco de dados do tráfico transatlântico)' },
      { texto: 'Em 2019, o ciclone Idai atingiu Moçambique, Zimbábue e Malawi e afetou mais de 3 milhões de pessoas: um dos piores desastres climáticos do Hemisfério Sul, segundo a OMM.', fonte: 'OMM (Organização Meteorológica Mundial), 2019' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS304', 'EM13CHS601'],
  },

  africa_do_sul: {
    resumo: 'A África do Sul é a economia mais industrializada da África, membro do BRICS e do G20, e superou o apartheid, regime de segregação racial que durou até o início dos anos 1990. Lesoto e Essuatíni, pequenos reinos sem saída para o mar, são muito ligados à economia sul-africana.',
    fatos: [
      { texto: 'Em 1994, a África do Sul fez sua primeira eleição com voto de todos os cidadãos, pondo fim ao apartheid. Nelson Mandela, que passou 27 anos preso, foi eleito presidente.', fonte: 'ONU; Fundação Nelson Mandela' },
      { texto: 'Em 2025, a África do Sul extraiu cerca de 71% da platina do mundo, metal usado em catalisadores de carros e na indústria.', fonte: 'USGS, Mineral Commodity Summaries 2026' },
      { texto: 'Em 2025, a África do Sul foi o primeiro país africano a presidir o G20 e sediou a cúpula do grupo em Joanesburgo, depois da presidência do Brasil, em 2024.', fonte: 'G20, 2025' },
    ],
    bncc: ['EM13CHS302', 'EM13CHS502', 'EM13CHS603', 'EM13CHS604'],
  },

  // ======================= ÁSIA =======================
  turquia: {
    resumo: 'A Turquia fica entre a Europa e a Ásia, controla os estreitos do Bósforo e de Dardanelos e é membro da OTAN e candidata à União Europeia. No Cáucaso, Geórgia, Armênia e Azerbaijão ficam entre Rússia, Turquia e Irã e são rota de petróleo e gás do Mar Cáspio para a Europa.',
    fatos: [
      { texto: 'Em 2025, a Turquia abrigava cerca de 2,4 milhões de refugiados, quase todos sírios: um dos maiores números do mundo.', fonte: 'ACNUR, 2026' },
      { texto: 'A Convenção de Montreux, de 1936, dá à Turquia o controle da passagem de navios de guerra pelos estreitos que ligam o Mar Negro ao Mediterrâneo.', fonte: 'Convenção de Montreux (1936)' },
      { texto: 'A Turquia sedia a COP31, a conferência do clima da ONU, em Antália, de 9 a 20 de novembro de 2026, com a Austrália conduzindo as negociações.', fonte: 'ONU Mudança do Clima (UNFCCC), 2025' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS204', 'EM13CHS305', 'EM13CHS604'],
  },

  golfo: {
    resumo: 'A Península Arábica concentra enormes reservas de petróleo e gás e fica entre o Mar Vermelho e o Golfo Pérsico, por onde passam rotas vitais de energia. As monarquias do Golfo investem para diversificar a economia, enquanto o Iêmen vive uma das piores crises humanitárias do mundo.',
    fatos: [
      { texto: 'Em 2024, cerca de 20% do petróleo consumido no mundo passou pelo Estreito de Ormuz. Em 2026, a guerra envolvendo o Irã fez o tráfego de navios ali despencar.', fonte: 'EIA (EUA), 2025; Organização Marítima Internacional, 2026' },
      { texto: 'A Arábia Saudita tem cerca de 267 bilhões de barris de petróleo em reservas provadas, a 2ª maior do mundo, atrás da Venezuela (2024).', fonte: 'OPEP, Boletim Estatístico Anual 2025' },
      { texto: 'No Iêmen, 18,3 milhões de pessoas enfrentam fome aguda e mais de 2,2 milhões de crianças pequenas estão desnutridas (2026).', fonte: 'ONU, OCHA 2026' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS302', 'EM13CHS503', 'EM13CNT309'],
  },

  levante: {
    resumo: 'Terra de cidades muito antigas, sagrada para judeus, cristãos e muçulmanos; a Mesopotâmia, no atual Iraque, foi um dos berços da agricultura e da escrita. O conflito israelense-palestino e a guerra na Síria causaram grandes crises humanitárias, e o Iraque é um dos maiores exportadores de petróleo.',
    fatos: [
      { texto: 'A Cidade Velha de Jerusalém, sagrada para judeus, cristãos e muçulmanos, é Patrimônio Mundial da UNESCO desde 1981. Israelenses e palestinos a reivindicam como capital.', fonte: 'UNESCO' },
      { texto: 'Em 1947, a Assembleia Geral da ONU, presidida pelo brasileiro Oswaldo Aranha, aprovou um plano para dividir a Palestina em um Estado judeu e um árabe. Israel foi criado em 1948; a Palestina é Estado observador da ONU desde 2012.', fonte: 'ONU, Resoluções 181 (1947) e 67/19 (2012)' },
      { texto: 'No fim de 2025, cerca de 4,9 milhões de sírios ainda viviam como refugiados fora do país. Só em 2025, cerca de 1,3 milhão de refugiados voltaram para a Síria.', fonte: 'ACNUR, 2026' },
    ],
    bncc: ['EM13CHS104', 'EM13CHS201', 'EM13CHS204', 'EM13CHS604'],
  },

  ira: {
    resumo: 'Herdeiro da antiga Pérsia, o Irã é uma república islâmica desde a revolução de 1979 e tem enormes reservas de petróleo e gás às margens do Estreito de Ormuz. A disputa sobre seu programa nuclear levou a sanções e, em 2025 e 2026, a guerras com Israel e os EUA, que abalaram o mercado mundial de energia.',
    fatos: [
      { texto: 'O Irã tem a 2ª maior reserva de gás natural do mundo (16% do total) e a 3ª maior de petróleo (2024).', fonte: 'OPEP, Boletim Estatístico Anual 2025' },
      { texto: 'Em 2024, o Irã era o país que mais abrigava refugiados no mundo: cerca de 3,5 milhões, a maioria afegãos.', fonte: 'ACNUR, 2025' },
      { texto: 'Em 2015, o Irã fez um acordo com EUA, China, Rússia, França, Reino Unido e Alemanha para limitar seu programa nuclear em troca do fim de sanções. Os EUA saíram do acordo em 2018.', fonte: 'ONU, Resolução 2231 (2015)' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS503', 'EM13CHS604', 'EM13CNT309'],
  },

  asia_central: {
    resumo: 'Região no coração da Eurásia, sem saída para o mar, que fazia parte da antiga Rota da Seda e, com exceção da Mongólia, da União Soviética. É rica em petróleo, gás, urânio e cobre e atrai investimentos e influência da Rússia, da China e de outros parceiros.',
    fatos: [
      { texto: 'Em 2024, o Cazaquistão produziu cerca de 39% do urânio extraído no mundo, combustível das usinas nucleares.', fonte: 'Associação Nuclear Mundial, 2025' },
      { texto: 'O Mar de Aral, entre Cazaquistão e Uzbequistão, já teve 68 mil km². Com o desvio de rios para irrigar algodão a partir dos anos 1960, encolheu para cerca de 10% do tamanho original em 2007.', fonte: 'NASA Earth Observatory' },
      { texto: 'Em 2013, a China anunciou no Cazaquistão o projeto que deu origem à Nova Rota da Seda, que financia estradas, ferrovias e portos em dezenas de países.', fonte: 'Governo da China, 2013' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS302', 'EM13CHS304', 'EM13CNT309'],
  },

  afeg_paquistao: {
    resumo: 'O Paquistão, potência nuclear e 5º país mais populoso do mundo, e o Afeganistão, montanhoso e sem saída para o mar, ficam entre a Ásia Central, o Irã e a Índia. A região sofre com enchentes, secas e terremotos, e no Afeganistão, governado pelo Talibã desde 2021, meninas são proibidas de estudar depois dos 12 anos.',
    fatos: [
      { texto: 'Em 2022, enchentes causadas por chuvas extremas de monção afetaram 33 milhões de pessoas no Paquistão.', fonte: 'Governo do Paquistão e ONU, 2022' },
      { texto: 'O Afeganistão é o único país do mundo que proíbe meninas e mulheres de cursar o ensino médio e a universidade: 1,4 milhão de meninas foram afetadas (2024).', fonte: 'UNESCO, 2024' },
      { texto: 'O Tratado das Águas do Indo, mediado pelo Banco Mundial em 1960, divide os rios da bacia entre Índia e Paquistão. Em 2025, a Índia o suspendeu, alegando segurança, e o Paquistão protestou.', fonte: 'Banco Mundial; Governo da Índia, 2025' },
    ],
    bncc: ['EM13CHS304', 'EM13CHS502', 'EM13CHS604', 'EM13CHS605'],
  },

  sul_asia: {
    resumo: 'Países vizinhos da Índia, das montanhas do Himalaia às ilhas do Oceano Índico. Bangladesh, muito populoso e cheio de rios e deltas baixos, e as Maldivas, quase ao nível do mar, estão entre os lugares mais ameaçados pelas mudanças climáticas; a região é forte na indústria de roupas.',
    fatos: [
      { texto: 'Mais de 80% das cerca de 1.190 ilhas de coral das Maldivas ficam a menos de 1 metro acima do nível do mar: é o país mais baixo do mundo.', fonte: 'Governo das Maldivas; Banco Mundial' },
      { texto: 'No fim de 2025, Bangladesh abrigava cerca de 1,2 milhão de refugiados rohingyas, uma minoria muçulmana que fugiu de Mianmar.', fonte: 'ACNUR, 2026' },
      { texto: 'Em 2020, Nepal e China mediram juntos o Monte Everest, na fronteira entre os dois países: 8.848,86 metros, o ponto mais alto da Terra.', fonte: 'Governos do Nepal e da China, 2020' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS306', 'EM13CHS605'],
  },

  taiwan: {
    resumo: 'Ilha separada da China continental pelo Estreito de Taiwan, com governo e eleições próprios, mas status político disputado: a China a considera parte de seu território, e poucos países a reconhecem oficialmente. Lidera a fabricação dos chips mais avançados do mundo, por isso o estreito é um ponto sensível para a economia global.',
    fatos: [
      { texto: 'Em 2025, a empresa taiwanesa TSMC ficou com cerca de 70% do faturamento mundial da fabricação de chips sob encomenda, incluindo os mais avançados, usados em celulares e em inteligência artificial.', fonte: 'TrendForce, 2026' },
      { texto: 'Em 1971, a Resolução 2758 da ONU passou o assento da China para a República Popular da China, e os representantes de Taiwan deixaram a organização.', fonte: 'ONU, Resolução 2758 (1971)' },
      { texto: 'Como a maioria dos países, o Brasil segue o princípio de “uma só China”: reconhece a República Popular da China desde 1974 e mantém com Taiwan só laços comerciais e culturais.', fonte: 'Itamaraty (Ministério das Relações Exteriores)' },
    ],
    bncc: ['EM13CHS202', 'EM13CHS204', 'EM13CHS603', 'EM13CHS604'],
  },

  japao_coreia: {
    resumo: 'Japão e Coreia do Sul são democracias ricas e potências tecnológicas, aliadas dos EUA, com poucos recursos naturais e populações que envelhecem rápido. Exportam carros, eletrônicos, chips e cultura pop para o mundo todo.',
    fatos: [
      { texto: 'O Japão tem uma das populações mais idosas do mundo: metade dos japoneses tem quase 50 anos ou mais (idade mediana de 49,8 anos em 2025).', fonte: 'ONU, World Population Prospects 2024' },
      { texto: 'Em 2023, a Coreia do Sul teve uma das menores taxas de fecundidade do mundo: 0,72 filho por mulher, bem abaixo dos 2,1 que mantêm o tamanho da população.', fonte: 'ONU, World Population Prospects 2024' },
      { texto: 'O Brasil tem a maior população de origem japonesa fora do Japão: cerca de 2,7 milhões de pessoas (2023). A imigração começou em 1908, com o navio Kasato Maru.', fonte: 'Ministério das Relações Exteriores do Japão, 2024' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS202', 'EM13CHS206'],
  },

  coreia_norte: {
    resumo: 'Estado fechado e autoritário, governado pela mesma família desde 1948, com uma das economias mais isoladas do mundo. Seu programa de mísseis e armas nucleares gera sanções da ONU e tensão com Coreia do Sul, Japão e EUA; a China é sua principal parceira.',
    fatos: [
      { texto: 'A Guerra da Coreia (1950–1953) terminou com um armistício, e não com um tratado de paz: por isso, as duas Coreias continuam tecnicamente em guerra.', fonte: 'ONU, Acordo de Armistício (1953)' },
      { texto: 'A Zona Desmilitarizada que separa as duas Coreias tem cerca de 250 km de extensão e 4 km de largura.', fonte: 'Comando das Nações Unidas na Coreia' },
      { texto: 'A Coreia do Norte fez seis testes nucleares entre 2006 e 2017 e pode ter cerca de 60 ogivas nucleares (estimativa de janeiro de 2026).', fonte: 'SIPRI, Anuário 2026' },
    ],
    bncc: ['EM13CHS203', 'EM13CHS503', 'EM13CHS604'],
  },

  sudeste_continental: {
    resumo: 'Região banhada pelo Rio Mekong, grande produtora de arroz e polo de fábricas de eletrônicos e roupas. Vietnã e Tailândia crescem com o comércio, enquanto Mianmar vive uma guerra civil desde o golpe militar de 2021.',
    fatos: [
      { texto: 'Em 2025, Vietnã, Tailândia, Camboja e Mianmar exportaram juntos cerca de 37% do arroz vendido no mundo; Vietnã e Tailândia só ficaram atrás da Índia.', fonte: 'USDA, set. 2026' },
      { texto: 'O Rio Mekong percorre cerca de 4.900 km e passa por seis países, da China ao Vietnã. Barragens rio acima preocupam quem vive da pesca e do arroz no delta.', fonte: 'Comissão do Rio Mekong' },
      { texto: 'No fim de 2025, cerca de 3,6 milhões de pessoas estavam deslocadas dentro de Mianmar por causa da guerra civil.', fonte: 'ACNUR, 2026' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS302', 'EM13CHS306', 'EM13CHS503'],
  },

  sudeste_insular: {
    resumo: 'Milhares de ilhas entre os oceanos Índico e Pacífico, no caminho do Estreito de Malaca, uma das rotas comerciais mais movimentadas do mundo. A Indonésia, 4º país mais populoso e maior país de maioria muçulmana, lidera a produção de níquel; Timor-Leste fala português.',
    fatos: [
      { texto: 'Em 2025, a Indonésia extraiu cerca de dois terços do níquel do mundo (67%), metal usado em aço inoxidável e em baterias de carros elétricos.', fonte: 'USGS, Mineral Commodity Summaries 2026' },
      { texto: 'Em 2025, as Filipinas foram o maior comprador da carne suína exportada pelo Brasil (25% do valor). Santa Catarina responde por cerca de 52% dessas exportações.', fonte: 'MDIC, Comex Stat 2026' },
      { texto: 'Timor-Leste, independente desde 2002 e com o português como língua oficial, tornou-se em outubro de 2025 o 11º membro da ASEAN, o bloco do Sudeste Asiático.', fonte: 'ASEAN, 2025' },
    ],
    bncc: ['EM13CHS201', 'EM13CHS302', 'EM13CHS604'],
  },

  // ======================= OCEANIA =======================
  australia: {
    resumo: 'Austrália e Nova Zelândia são países ricos e democráticos da Oceania, aliados dos EUA e cada vez mais ligados à Ásia, seu principal mercado. Exportam minérios, carne e laticínios e sofrem com secas, incêndios e o branqueamento de corais causado pelo aquecimento do mar.',
    fatos: [
      { texto: 'Em 2025, a Austrália foi a maior produtora de lítio do mundo: cerca de 32% do total extraído, metal essencial para baterias.', fonte: 'USGS, Mineral Commodity Summaries 2026' },
      { texto: 'Desde 2016, a Grande Barreira de Corais, maior sistema de recifes do mundo, sofreu pelo menos cinco branqueamentos em massa causados por ondas de calor no mar.', fonte: 'Autoridade do Parque Marinho da Grande Barreira de Corais, 2024' },
      { texto: 'Os maoris, povo indígena da Nova Zelândia, eram 17,8% da população no censo de 2023. O Tratado de Waitangi, de 1840, é a base da relação entre eles e o Estado.', fonte: 'Stats NZ (Estatísticas da Nova Zelândia), 2024' },
    ],
    bncc: ['EM13CHS204', 'EM13CHS302', 'EM13CHS306', 'EM13CNT206'],
  },

  pacifico: {
    resumo: 'Países formados por ilhas e atóis espalhados pelo maior oceano do planeta, com culturas melanésias, micronésias e polinésias. Emitem muito pouco, mas estão entre os mais ameaçados pela subida do mar e lideram a cobrança por ação climática na ONU; EUA, China e Austrália disputam influência na região.',
    fatos: [
      { texto: 'Em 2019, 27 estudantes de Direito de ilhas do Pacífico começaram a campanha que levou a Corte Internacional de Justiça a decidir, por unanimidade, em julho de 2025, que os países têm o dever jurídico de proteger o clima.', fonte: 'Corte Internacional de Justiça, 2025' },
      { texto: 'Pelo Tratado da União Falepili, de 2023, até 280 moradores de Tuvalu por ano podem obter residência permanente na Austrália, por causa das mudanças climáticas.', fonte: 'Governo da Austrália, 2023' },
      { texto: 'Papua-Nova Guiné é o país com mais línguas do mundo: cerca de 840 línguas vivas.', fonte: 'Ethnologue; Britannica, 2025' },
    ],
    bncc: ['EM13CHS104', 'EM13CHS201', 'EM13CHS305', 'EM13CHS604'],
  },

  // ======================= POLOS =======================
  antartida: {
    resumo: 'Continente mais frio, seco e ventoso do planeta, sem população permanente e sem dono. O Tratado da Antártida, de 1959, reserva a região para a paz e a ciência, e o Protocolo de Madri, de 1991, proíbe a mineração; o Brasil pesquisa no continente desde 1982.',
    fatos: [
      { texto: 'O manto de gelo da Antártida tem cerca de 30 milhões de km³ de gelo. Se derretesse por inteiro, o nível do mar subiria cerca de 58 metros.', fonte: 'NSIDC (Centro Nacional de Dados de Neve e Gelo dos EUA)' },
      { texto: 'A temperatura mais baixa já medida na Terra foi −89,2 °C, na estação russa Vostok, na Antártida, em 21 de julho de 1983.', fonte: 'OMM (Organização Meteorológica Mundial)' },
      { texto: 'A Estação Antártica Comandante Ferraz, do Brasil, foi inaugurada em 1984. Destruída em parte por um incêndio em 2012, foi reconstruída e reaberta em 2020.', fonte: 'Marinha do Brasil (Proantar), 2020' },
    ],
    bncc: ['EM13CHS204', 'EM13CHS305', 'EM13CHS604'],
  },
};
