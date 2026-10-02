# Créditos — Geografia Irada

**Geografia Irada – Geopolítica Internacional** foi criado por João Vitor Borges da Silva Matias: criação e direção do jogo.

**Consultor:** Jean Carlos Feltrin - Fraiburgo SC.

**Nome:** inspirado no canal Geografia Irada (https://www.youtube.com/@geografiairada), do professor Marcelo Silva, e usado com a autorização dele.

**Inspiração:** SIIF – Simulação das Organizações Internacionais, projeto executado no IFC Fraiburgo em 2016 pelo professor Marcelo Silva.

O Geografia Irada é feito com bibliotecas, fontes, ícones, modelos 3D, música e efeitos sonoros livres. Cada item abaixo
traz o autor, a licença, o endereço e o crédito pedido. A tela de créditos do jogo lê a versão curta em `dados/creditos.js`.

Tudo o que não está nesta lista é de autoria do projeto: código, mapa de peças, bonecos, mascote, logotipo, ilustrações,
os 15 modelos 3D modelados em código e a edição dos sons (cortes, mono, normalização e conversão para AAC).

Observação sobre nomes: alguns títulos originais de sons citam uma marca de brinquedos. Aqui eles são citados pelo autor e
pelo número do som no Freesound, sem o nome da marca. Nenhum som, modelo ou ícone usa marca registrada.

## 1. Bibliotecas (vão para o site, em `lib/`)

| Item | Autor | Licença | Endereço | Uso no jogo |
|---|---|---|---|---|
| Three.js r186 (npm `three@0.186.1`), com os complementos OrbitControls, BufferGeometryUtils, SkeletonUtils, RoundedBoxGeometry, GLTFLoader, RoomEnvironment, EffectComposer, RenderPass, OutputPass, SMAAPass, FXAAPass, OutlinePass e GTAOPass | Autores do three.js (mrdoob e colaboradores) | MIT | https://threejs.org · https://github.com/mrdoob/three.js | `lib/three.min.js`: mapa-múndi 3D, bonecos e cenas |
| N8AO 1.10.3 | N8python | CC0 1.0 (arquivo `LICENSE` do repositório; o `package.json` declara ISC) | https://github.com/N8python/n8ao | Oclusão de ambiente (sombra de contato entre as peças), embutido em `lib/three.min.js` |
| postprocessing 6.39.5 | Raoul van Rüschen (pmndrs) | Zlib | https://github.com/pmndrs/postprocessing | Dependência do N8AO, embutida em `lib/three.min.js` |
| GSAP 3.15.0 | GreenSock | Licença padrão GSAP, de uso gratuito ("Standard No Charge License") | https://gsap.com · https://gsap.com/standard-license | `lib/gsap.min.js`: animações da interface |
| canvas-confetti 1.9.4 | Kiril Vatev | ISC | https://github.com/catdad/canvas-confetti | `lib/confetti.min.js`: chuva de tijolinhos na interface |

## 2. Mapa: dados e ferramentas de geração (não vão para o site; só o resultado em `dados/`)

| Item | Autor | Licença | Endereço | Uso |
|---|---|---|---|---|
| Natural Earth, países 1:50m e 1:110m | Natural Earth / NACIS | Domínio público | https://www.naturalearthdata.com | Contornos dos países em `dados/mapa.js` (1:50m) e `dados/projecoes.js` (1:110m) |
| world-atlas 2.0.2 | Mike Bostock | ISC | https://github.com/topojson/world-atlas | Natural Earth em TopoJSON |
| topojson-client 3.1.0 | Mike Bostock | ISC | https://github.com/topojson/topojson-client | Leitura do TopoJSON em `ferramentas/gerar-mapa.mjs` e `gerar-projecoes.mjs` |
| d3-geo 3.1.1 (e d3-array 3.2.4) | Mike Bostock | ISC | https://github.com/d3/d3-geo | Geometria esférica e projeções Mercator e Gall-Peters |
| d3-geo-projection 4.0.0 | Mike Bostock | ISC | https://github.com/d3/d3-geo-projection | Projeção de Robinson do mapa |
| esbuild 0.28.2 | Evan Wallace | MIT | https://esbuild.github.io | Empacota o Three.js em `lib/three.min.js` (`ferramentas/gerar-three.mjs`) |

## 3. Fontes (`fontes/`, arquivos sem modificação; licenças em `fontes/licencas/`)

| Fonte | Autor | Licença | Endereço | Uso |
|---|---|---|---|---|
| Fredoka | Milena Brandão e Hafontia — Copyright 2016 The Fredoka Project Authors | SIL Open Font License 1.1 | https://github.com/hafontia/Fredoka-One · https://fonts.google.com/specimen/Fredoka | Títulos, botões, nomes e avisos |
| Nunito | Vernon Adams, Cyreal e Jacques Le Bailly — Copyright 2014 The Nunito Project Authors | SIL Open Font License 1.1 | https://github.com/googlefonts/nunito | Textos e todos os números |
| Titan One | Rodrigo Fuenzalida — Copyright 2011 Rodrigo Fuenzalida | SIL Open Font License 1.1, nome reservado "Titan" | https://fonts.google.com/specimen/Titan+One | Logotipo, letreiros e carimbos |

Se alguém refizer o subconjunto da Titan One, a fonte gerada não pode se chamar "Titan" (nome reservado pela licença).

## 4. Ícones (crédito obrigatório)

| Item | Autor | Licença | Endereço | Uso |
|---|---|---|---|---|
| Microsoft Fluent Emoji, estilos 3D e High Contrast (commit `1ffb34c`) | © Microsoft Corporation | MIT | https://github.com/microsoft/fluentui-emoji | Ícones de recursos, indicadores, eventos e botões de mídia (`js/icones.js`) |

**Crédito pedido:** "Ícones: Microsoft Fluent Emoji, © Microsoft Corporation, licença MIT, github.com/microsoft/fluentui-emoji".
O texto da licença está na seção 9.

## 5. Modelos 3D (`dados/modelos.js`)

32 modelos são da **Kenney** (https://kenney.nl, CC0 1.0; crédito não obrigatório, mas registrado), tratados aqui (cor de
vértice, escala em pinos, pivô no chão):

| Kit da Kenney | Endereço | Modelos usados |
|---|---|---|
| Platformer Kit | https://kenney.nl/assets/platformer-kit | árvore folhosa, moeda, estrela, coração |
| Castle Kit | https://kenney.nl/assets/castle-kit | pinheiro |
| Holiday Kit | https://kenney.nl/assets/holiday-kit | pinheiro com neve |
| Pirate Kit | https://kenney.nl/assets/pirate-kit | palmeiras, bandeira |
| Nature Kit | https://kenney.nl/assets/nature-kit | árvore da savana, cacto |
| Toy Car Kit | https://kenney.nl/assets/toy-car-kit | nuvem |
| Cube Pets | https://kenney.nl/assets/cube-pets | urso-polar, pinguim |
| City Kit (Industrial) | https://kenney.nl/assets/city-kit-industrial | fábrica, termelétrica, torre de resfriamento, turbina eólica, painel solar, tanque de combustível |
| Watercraft Kit | https://kenney.nl/assets/watercraft-kit | navio cargueiro, navio graneleiro, contêineres |
| Car Kit | https://kenney.nl/assets/car-kit | caminhão de ajuda, ambulância, escavadeira |
| Mini Forest | https://kenney.nl/assets/mini-forest | tenda de acolhimento |
| Survival Kit | https://kenney.nl/assets/survival-kit | caixa de ajuda |
| City Kit (Roads) | https://kenney.nl/assets/city-kit-roads | barreira |
| Mini Arena | https://kenney.nl/assets/mini-arena | troféu |

Os outros 15 modelos (bomba e plataforma de petróleo, avião, foguete, satélite, guindaste do porto, usina nuclear, carga de
ajuda, jazida, hospital, escola, prédio do governo, muro, pomba e pódio) foram modelados em código pelo projeto; a usina
nuclear e a carga de ajuda reaproveitam a torre e a caixa da Kenney.

## 6. Música (`som/`, todas CC0 1.0, da mesma autoria)

| Arquivo | Título original | Autor | Endereço |
|---|---|---|---|
| `trilha-menu.m4a` | "Urban Theme" | MintoDog | https://opengameart.org/content/urban-theme |
| `trilha-jogo.m4a` | "Cozy Puzzle In-Game 3" | MintoDog | https://opengameart.org/content/cozy-puzzle-in-game-3 |
| `trilha-tensao.m4a` | "Sci-fi Puzzle In-Game 3" | MintoDog | https://opengameart.org/content/sci-fi-puzzle-in-game-3 |
| `trilha-assembleia.m4a` | "Sci-fi Puzzle Stage Select" | MintoDog | https://opengameart.org/content/sci-fi-puzzle-stage-select |
| `vinheta-vitoria.m4a` | "Cozy Puzzle Clear (Jingle)" | MintoDog | https://opengameart.org/content/cozy-puzzle-jingle-result |
| `vinheta-derrota.m4a` | "Sci-fi Puzzle Failure (Jingle)" | MintoDog | https://opengameart.org/content/sci-fi-puzzle-jingle-result |

Se um arquivo de música não puder tocar (navegador sem AAC), o jogo usa uma música procedural composta no próprio
`js/audio.js` (autoria do projeto).

## 7. Efeitos sonoros (`som/`, todos CC0 1.0)

| Arquivo | Origem | Autor | Endereço |
|---|---|---|---|
| `tijolo-1.m4a`, `tijolo-2.m4a`, `tijolo-3.m4a` | sons nº 233649, 233648 e 233658 | rioforce | https://freesound.org/people/rioforce/sounds/233649/ · …/233648/ · …/233658/ |
| `clique.m4a` | som nº 233654 | rioforce | https://freesound.org/people/rioforce/sounds/233654/ |
| `tijolo-cai.m4a` | som nº 233636 | rioforce | https://freesound.org/people/rioforce/sounds/233636/ |
| `chuva-tijolos.m4a` | som nº 233661 | rioforce | https://freesound.org/people/rioforce/sounds/233661/ |
| `construcao.m4a` | montagem dos sons nº 233649, 233648, 233658, 233647 e 233655 | rioforce (montagem do projeto) | https://freesound.org/people/rioforce/packs/14369/ |
| `pop.m4a` | "Pop sound", nº 202230 | deraj | https://freesound.org/people/deraj/sounds/202230/ |
| `whoosh.m4a` | "whoosh_short_mid.wav", nº 449996 | DJT4NN3R | https://freesound.org/people/DJT4NN3R/sounds/449996/ |
| `alarme.m4a` | "16 bit Klaxon / Alarm Synth Loop", nº 808538 | Andygun11 | https://freesound.org/people/Andygun11/sounds/808538/ |
| `martelo.m4a` | "Gavel on wooden desk", nº 618138 | Aerny | https://freesound.org/people/Aerny/sounds/618138/ |
| `plantao.m4a` | "jingle breaking news radio.wav", nº 156060 | Thejack288 | https://freesound.org/people/Thejack288/sounds/156060/ |
| `moeda.m4a` | RPG Audio, `handleCoins` | Kenney | https://kenney.nl/assets/rpg-audio |
| `pino.m4a` | Casino Audio, `chips-stack-1` | Kenney | https://kenney.nl/assets/casino-audio |
| `virar.wav` | Casino Audio, `card-place-1` | Kenney | https://kenney.nl/assets/casino-audio |
| `sucesso.m4a` | Music Jingles, `jingles_STEEL10` | Kenney | https://kenney.nl/assets/music-jingles |
| `erro.m4a` | Music Jingles, `jingles_PIZZI07` | Kenney | https://kenney.nl/assets/music-jingles |
| `vez.wav` | Interface Sounds, `maximize_006` | Kenney | https://kenney.nl/assets/interface-sounds |
| `voto.wav` | Interface Sounds, `back_003` | Kenney | https://kenney.nl/assets/interface-sounds |
| `tique.wav` | Interface Sounds, `tick_004` | Kenney | https://kenney.nl/assets/interface-sounds |
| `tempo.wav` | Interface Sounds, `error_006` (cortado) | Kenney | https://kenney.nl/assets/interface-sounds |

Os efeitos `reuniao`, `subir`, `descer`, `trovao` e `pincel` são sintetizados em `js/audio.js` (autoria do projeto).
Licença da Kenney: `som/LICENCA-KENNEY-CC0.txt`. Texto da CC0: https://creativecommons.org/publicdomain/zero/1.0/

## 8. Agradecimentos (referência; nada disto está no jogo)

As proporções dos bonecos foram comparadas com os personagens CC0 de Kenney (Blocky Characters e Mini Characters),
Quaternius e Kay Lousberg (KayKit). O boneco do jogo é desenhado em código pelo projeto.

## 9. Textos das licenças que pedem o aviso junto com a cópia

### MIT — Three.js

```
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### MIT — Microsoft Fluent Emoji

```
MIT License

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE
```

### ISC — canvas-confetti

```
ISC License

Copyright (c) 2020, Kiril Vatev

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### Zlib — postprocessing

```
Copyright © 2015 Raoul van Rüschen

This software is provided 'as-is', without any express or implied warranty.
In no event will the authors be held liable for any damages arising from the
use of this software.

Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not claim
   that you wrote the original software. If you use this software in a
   product, an acknowledgment in the product documentation would be
   appreciated but is not required.
2. Altered source versions must be plainly marked as such, and must not be
   misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
```

### SIL Open Font License 1.1 — Fredoka, Nunito e Titan One

Textos completos em `fontes/licencas/` (`fredoka-OFL.txt`, `nunito-OFL.txt`, `titanone-OFL.txt`) e em
https://openfontlicense.org.

### GSAP

Termos em https://gsap.com/standard-license (uso gratuito, inclusive comercial, com as restrições ali descritas).
