'use strict';
// Créditos de terceiros mostrados na tela de créditos (dono: Som e créditos). Versão completa, com os textos das licenças: CREDITOS.md.
// Campos: item, autor, licenca, url, uso (+ grupo, para a tela agrupar). Créditos sem nome de marca de brinquedo ou de jogo.
const CREDITOS = [
  // Criação
  { grupo: 'Criação', item: 'Geografia Irada – Geopolítica Internacional', autor: 'João Vitor Borges da Silva Matias', licenca: 'Autor', url: '', uso: 'Criação e direção do jogo' },
  { grupo: 'Criação', item: 'Consultoria', autor: 'Jean Carlos Feltrin - Fraiburgo SC', licenca: 'Consultor', url: '', uso: 'Consultoria do jogo' },
  { grupo: 'Criação', item: 'Nome "Geografia Irada"', autor: 'Prof. Marcelo Silva, canal Geografia Irada', licenca: 'Inspirado e autorizado', url: 'https://www.youtube.com/@geografiairada', uso: 'Nome do jogo, inspirado no canal e usado com autorização do professor' },
  { grupo: 'Criação', item: 'SIIF – Simulação das Organizações Internacionais', autor: 'Prof. Marcelo Silva, IFC Fraiburgo (2016)', licenca: 'Inspiração', url: '', uso: 'Projeto de simulação que inspirou o jogo' },

  // Bibliotecas (vão para o site)
  { grupo: 'Bibliotecas', item: 'Three.js r186', autor: 'Autores do three.js (mrdoob e colaboradores)', licenca: 'MIT', url: 'https://threejs.org', uso: 'Mapa-múndi 3D, bonecos e cenas' },
  { grupo: 'Bibliotecas', item: 'N8AO 1.10.3', autor: 'N8python', licenca: 'CC0 1.0', url: 'https://github.com/N8python/n8ao', uso: 'Sombra de contato entre as peças do mapa' },
  { grupo: 'Bibliotecas', item: 'postprocessing 6.39.5', autor: 'Raoul van Rüschen (pmndrs)', licenca: 'Zlib', url: 'https://github.com/pmndrs/postprocessing', uso: 'Base do pós-processamento do N8AO' },
  { grupo: 'Bibliotecas', item: 'GSAP 3.15', autor: 'GreenSock', licenca: 'Licença padrão GSAP (uso gratuito)', url: 'https://gsap.com/standard-license', uso: 'Animações da interface' },
  { grupo: 'Bibliotecas', item: 'canvas-confetti 1.9.4', autor: 'Kiril Vatev', licenca: 'ISC', url: 'https://github.com/catdad/canvas-confetti', uso: 'Chuva de tijolinhos na interface' },

  // Mapa (dados e ferramentas que geraram dados/mapa.js e dados/projecoes.js)
  { grupo: 'Mapa', item: 'Natural Earth (países 1:50m e 1:110m)', autor: 'Natural Earth / NACIS', licenca: 'Domínio público', url: 'https://www.naturalearthdata.com', uso: 'Contornos dos países do mapa e do laboratório de projeções' },
  { grupo: 'Mapa', item: 'world-atlas 2.0.2', autor: 'Mike Bostock', licenca: 'ISC', url: 'https://github.com/topojson/world-atlas', uso: 'Natural Earth em TopoJSON' },
  { grupo: 'Mapa', item: 'topojson-client 3.1.0', autor: 'Mike Bostock', licenca: 'ISC', url: 'https://github.com/topojson/topojson-client', uso: 'Leitura do TopoJSON ao gerar o mapa' },
  { grupo: 'Mapa', item: 'd3-geo 3.1.1 e d3-geo-projection 4.0.0', autor: 'Mike Bostock', licenca: 'ISC', url: 'https://d3js.org/d3-geo', uso: 'Projeções de Robinson, Mercator e Gall-Peters' },

  // Fontes
  { grupo: 'Fontes', item: 'Fredoka', autor: 'Milena Brandão e Hafontia (The Fredoka Project Authors)', licenca: 'SIL OFL 1.1', url: 'https://github.com/hafontia/Fredoka-One', uso: 'Títulos, botões e nomes' },
  { grupo: 'Fontes', item: 'Nunito', autor: 'Vernon Adams, Cyreal e Jacques Le Bailly (The Nunito Project Authors)', licenca: 'SIL OFL 1.1', url: 'https://github.com/googlefonts/nunito', uso: 'Textos e números' },
  { grupo: 'Fontes', item: 'Titan One', autor: 'Rodrigo Fuenzalida', licenca: 'SIL OFL 1.1 (nome reservado "Titan")', url: 'https://fonts.google.com/specimen/Titan+One', uso: 'Logotipo, letreiros e carimbos' },

  // Ícones
  { grupo: 'Ícones', item: 'Microsoft Fluent Emoji (3D e alto contraste)', autor: '© Microsoft Corporation', licenca: 'MIT', url: 'https://github.com/microsoft/fluentui-emoji', uso: 'Ícones de recursos, indicadores, eventos e botões de mídia' },

  // Modelos 3D
  { grupo: 'Modelos 3D', item: '32 modelos de 14 kits (natureza, cidade, indústria, barcos, carros e símbolos)', autor: 'Kenney (kenney.nl)', licenca: 'CC0 1.0', url: 'https://kenney.nl/assets', uso: 'Árvores, usinas, navios, caminhões, troféu e outros objetos do mapa' },

  // Música (todas da mesma autoria)
  { grupo: 'Música', item: '"Urban Theme"', autor: 'MintoDog', licenca: 'CC0 1.0', url: 'https://opengameart.org/content/urban-theme', uso: 'Trilha do menu e do lobby' },
  { grupo: 'Música', item: '"Cozy Puzzle In-Game 3"', autor: 'MintoDog', licenca: 'CC0 1.0', url: 'https://opengameart.org/content/cozy-puzzle-in-game-3', uso: 'Trilha da partida' },
  { grupo: 'Música', item: '"Sci-fi Puzzle In-Game 3"', autor: 'MintoDog', licenca: 'CC0 1.0', url: 'https://opengameart.org/content/sci-fi-puzzle-in-game-3', uso: 'Trilha do mundo em crise' },
  { grupo: 'Música', item: '"Sci-fi Puzzle Stage Select"', autor: 'MintoDog', licenca: 'CC0 1.0', url: 'https://opengameart.org/content/sci-fi-puzzle-stage-select', uso: 'Trilha da reunião na ONU' },
  { grupo: 'Música', item: '"Cozy Puzzle Clear (Jingle)"', autor: 'MintoDog', licenca: 'CC0 1.0', url: 'https://opengameart.org/content/cozy-puzzle-jingle-result', uso: 'Vinheta de vitória' },
  { grupo: 'Música', item: '"Sci-fi Puzzle Failure (Jingle)"', autor: 'MintoDog', licenca: 'CC0 1.0', url: 'https://opengameart.org/content/sci-fi-puzzle-jingle-result', uso: 'Vinheta de colapso' },

  // Efeitos sonoros
  { grupo: 'Efeitos sonoros', item: 'Sons de peças plásticas (nº 233636, 233647, 233648, 233649, 233654, 233655, 233658 e 233661)', autor: 'rioforce (Freesound)', licenca: 'CC0 1.0', url: 'https://freesound.org/people/rioforce/packs/14369/', uso: 'Tijolos encaixando, clique, construção e chuva de tijolinhos' },
  { grupo: 'Efeitos sonoros', item: '"Pop sound" (nº 202230)', autor: 'deraj (Freesound)', licenca: 'CC0 1.0', url: 'https://freesound.org/people/deraj/sounds/202230/', uso: 'Peça aparecendo, selo, aviso' },
  { grupo: 'Efeitos sonoros', item: '"whoosh_short_mid" (nº 449996)', autor: 'DJT4NN3R (Freesound)', licenca: 'CC0 1.0', url: 'https://freesound.org/people/DJT4NN3R/sounds/449996/', uso: 'Painéis entrando e câmera voando' },
  { grupo: 'Efeitos sonoros', item: '"16 bit Klaxon / Alarm Synth Loop" (nº 808538)', autor: 'Andygun11 (Freesound)', licenca: 'CC0 1.0', url: 'https://freesound.org/people/Andygun11/sounds/808538/', uso: 'Alarme da reunião de emergência' },
  { grupo: 'Efeitos sonoros', item: '"Gavel on wooden desk" (nº 618138)', autor: 'Aerny (Freesound)', licenca: 'CC0 1.0', url: 'https://freesound.org/people/Aerny/sounds/618138/', uso: 'Martelo da votação' },
  { grupo: 'Efeitos sonoros', item: '"jingle breaking news radio" (nº 156060)', autor: 'Thejack288 (Freesound)', licenca: 'CC0 1.0', url: 'https://freesound.org/people/Thejack288/sounds/156060/', uso: 'Vinheta do Plantão Global' },
  { grupo: 'Efeitos sonoros', item: 'RPG Audio, Casino Audio, Music Jingles e Interface Sounds', autor: 'Kenney (kenney.nl)', licenca: 'CC0 1.0', url: 'https://kenney.nl/assets', uso: 'Moeda, pino de CP, sucesso, erro, vez, virar, voto, tique e tempo esgotado' },
];
