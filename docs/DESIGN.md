# Geografia Irada — documento de design (v2: dilemas de governo, sem quiz)

> Jogo educativo de geopolítica para o Ensino Médio, no navegador, num telão. Mapa-múndi 3D de peças de montar,
> bonecos de blocos, música e uma simulação em que cada decisão mexe no mundo inteiro.
> Este documento é o contrato entre design, conteúdo e código. Números marcados com ⚙ são de calibragem:
> o teste de balanceamento (ver §13) pode ajustá-los, desde que cumpra as metas de §13.

## 1. O objetivo do jogo: Missão 2050

Cada jogador (ou equipe) governa uma das **treze potências** do mundo de **2026 a 2050**. Cada rodada é um
mandato de alguns anos. Todos querem que a própria nação prospere, mas todos dividem o mesmo planeta: clima, paz,
comércio e crises humanitárias são **bens comuns**. Quem só pensa em si empurra o mundo para o colapso, e num
planeta em colapso **ninguém vence**.

- **Competitivo (Cada nação por si):** vence quem terminar 2050 com o maior **Índice Geografia Irada (IGI)**,
  que mede quanto a nação avançou (bem-estar, economia, ambiente, segurança, apoio popular), quanta influência
  conquistou no mundo e se cumpriu sua missão secreta — **desde que o planeta sobreviva**.
- **Em blocos (equipes):** as potências formam 2 ou 3 blocos; vence o bloco de maior IGI médio, se o planeta sobreviver.
- **Cooperativo (Todos pelo planeta):** a turma inteira tenta cumprir as **Metas 2050** (inspiradas no Acordo de
  Paris e na Agenda 2030). Opcional: um **agente infiltrado** com agenda secreta, descoberto em reunião de emergência.
- **Solo:** um jogador contra (ou junto com) cinco potências do computador.

A tensão central — interesse nacional × bem comum global — é o coração da geopolítica e o que a turma vai
discutir no fim. O jogo nunca tem guerra entre jogadores: a disputa é por **influência** (diplomacia, comércio,
investimento, ajuda, cultura, ciência). Conflitos existem no mundo como focos de crise que reagem às decisões
de todos e pedem mediação, ajuda e missões de paz.

**Colapso global (fim imediato, todos perdem):** temperatura ≥ **2,2 °C** ⚙ acima do pré-industrial
("ponto de não retorno"), tensão = **100** ("o Relógio do Juízo Final chegou à meia-noite") ou deslocados
≥ **200 milhões** ⚙ ("catástrofe humanitária").

## 2. Estrutura da partida

**Não é um jogo de perguntas e respostas.** A BNCC diz quais conteúdos de geopolítica a turma precisa viver; a
simulação é como ela vive: **decisão → consequência visível no mundo → porquê**. Não há quiz, gabarito, pontos por
acerto nem porcentagem de acertos. O vocabulário da BNCC aparece na manchete e no porquê de cada consequência
("isso foi o dilema de segurança"), e o relatório final conta as habilidades **vividas** nas decisões.

- **Duração:** a partida sempre vai de 2026 a 2050. O professor escolhe o número de rodadas:
  Rápida (4 rodadas, 6 anos cada, ~30 min), **Aula (6 rodadas, 4 anos cada, ~45 min, padrão)**,
  Completa (8 rodadas, 3 anos cada, ~60 min). Também dá para limitar o tempo total (como no Carreira em Jogo):
  quando acaba, a rodada atual termina e o jogo vai para 2050 com um resumo.
  Δ = 24 / rodadas = anos por rodada. Toda dinâmica natural (emissões, crescimento, decaimentos) é por ano × Δ.
- **Rodada (um mandato):**
  1. **Abertura do mandato:** faixa "2030"; o **Plantão Global** traz 1 evento (2 se o mundo estiver em crise:
     tensão ≥ 80, temperatura ≥ 2,0 ou deslocados ≥ 150). O evento pode pedir votação na ONU, doação ou uma
     **decisão de todas as potências** (§8.1). Nas rodadas 2, 4 e 6 (e equivalentes) acontece a **Cúpula do Clima** (§8.3).
  2. **Vez de cada potência**, na ordem do mapa, começando cada rodada por uma potência diferente:
     a. **Dilema de governo** (§9): uma situação datada, com 2 ou 3 saídas e nenhuma resposta certa. A equipe
        escolhe; a consequência aparece no mapa e nos indicadores, com a manchete e o porquê.
     b. **Ações:** gasta Capital Político (CP) em ações de política (§6), escolhendo alvos no mapa 3D.
     c. Encerra a vez. Potências do computador decidem sozinhas em 2 a 4 segundos (dá para pular a animação).
  3. **Balanço do mandato:** a simulação roda (§5), o mercado mundial fecha (§4.4), crises e conflitos mudam (§7),
     parcerias são recalculadas (§7.3) e a tela de **Balanço** mostra o que mudou e **por quê** (inclusive os efeitos
     que demoraram: decisões de mandatos anteriores chegando agora).
  4. Checagem de colapso e de metas.
- **Tempo-alvo por vez de jogador:** ~75 s (dilema 25 s + ações 50 s). Opção de cronômetro de decisões.
- **Ritmo:** uma partida de 6 rodadas tem de 60 a 120 decisões (ações, dilemas e decisões nos eventos; §13).

## 3. As treze potências

Sempre existem as treze (as seis de sempre mais Reino Unido, Japão, Austrália, Nova Zelândia, África do Sul, Nigéria e Egito). As não escolhidas por jogadores ficam com o computador (§11). Cada uma tem **cor e forma**
fixas (guia de arte; a forma garante que nada dependa só da cor), uma **força** e uma **fraqueza** reais, descritas com
respeito e sem caricatura. Valores 0–100 são uma **aproximação didática** de dados reais (fontes em conteudo/).

| Potência | Cor e forma | Força (habilidade especial) | Fraqueza | Membro permanente do CS? |
|---|---|---|---|---|
| Brasil | verde `#27B263` · ● círculo | **Potência ambiental e agrícola:** proteger florestas rende o dobro de clima; +1 🌾/mandato | Desigualdade: bem-estar cresce mais devagar sem políticas sociais | não |
| Estados Unidos | azul `#0A32B4` · ■ quadrado | **Dólar e tecnologia:** sanções e acordos comerciais 50% mais fortes; +1 💻 | Polarização: quando as coisas pioram, o apoio despenca mais rápido | sim (veto) |
| China | vermelho `#D0180E` · ▲ triângulo | **Fábrica do mundo:** investimento em infraestrutura no exterior custa 1 CP a menos; produz 💎 (terras raras) | Maior emissor: emissões crescem com a economia | sim (veto) |
| União Europeia | roxo `#9645EE` · ★ estrela | **Mercado comum e regulação:** acordos comerciais e climáticos rendem +1 de cooperação; a França (país da UE) tem assento permanente | Dependência de energia importada (⚡ 0 de produção) | sim (veto, via França) |
| Índia | laranja `#FF9C0A` · ◆ losango | **Maior população e serviços digitais:** +1 💻; autonomia estratégica (alianças com qualquer um sem aumentar a tensão) | Calor extremo: vulnerabilidade climática alta | não |
| Rússia | rosa `#F2248F` · ⬢ hexágono | **Energia e território:** +2 ⚡/mandato; ganha com o preço alto da energia | Economia dependente de petróleo e gás; sanções a atingem mais | sim (veto) |
| Reino Unido | turquesa `#00B3A4` · ✚ cruz | **Diplomacia e Commonwealth:** Missões diplomáticas rendem +1 de influência, e o Reino Unido tem assento permanente e veto no Conselho de Segurança. | Fora da União Europeia: Depois do Brexit, o comércio com a UE atrita mais quando as relações azedam. | sim (veto) |
| Japão | cinza-azulado `#6C7A96` · ◎ anel | **Tecnologia e indústria:** +1 💻 por mandato, e a cooperação para o desenvolvimento rende +1 de influência. | Envelhecimento e energia importada: A economia cresce devagar e depende de comprar ⚡ do exterior. | não |
| Austrália | verde-limão `#9CCB1F` · 💧 gota | **Minerais e energia:** Exportadora de minério, carvão e gás: ganha quando a energia fica cara e produz +1 💎 por mandato. | Dependência da China: Mais de um terço do que vende vai para a China: se a relação azedar, a economia australiana sofre. | não |
| Nova Zelândia | vinho `#8E1B3A` · ⬟ pentágono | **Energia limpa e boa reputação:** Quase toda a eletricidade é renovável e o país é visto como neutro: mediações de paz ganham +10% de chance. | Pequena e distante: Economia pequena: choques de comércio e sanções pesam mais, e o exército é modesto. | não |
| África do Sul | marrom `#9A5B2E` · ⯃ octógono | **Voz da África e do BRICS:** Cartas de cooperação ganham +1 de influência na África, e a África do Sul produz platina e manganês (💎). | Apagões e desigualdade: Falta energia e a desigualdade é uma das maiores do mundo: o bem-estar e o apoio sobem mais devagar. | não |
| Nigéria | coral `#FF7A66` · ⛊ escudo | **Petróleo e população jovem:** Exportadora de petróleo (ganha quando a energia fica cara) e com a maior população da África: cresce rápido. | Instabilidade e dependência do petróleo: Conflitos no Sahel e no Golfo da Guiné pesam mais na segurança, e a economia sofre quando a energia barateia. | não |
| Egito | azul-claro `#4DB6FF` · ⏢ trapézio | **Canal de Suez e mediação:** Vive de ser ponte entre África, Ásia e Europa: mediações de paz ganham +15% de chance e o exército é o maior da região. | Água e pão importado: Depende do Nilo e importa trigo: a fome pesa e o clima extremo castiga a economia. | não |

**Indicadores de cada potência (0–100):** 💰 Economia · ❤️ Bem-estar (≈ IDH × 100) · 🌳 Ambiente ·
🛡️ Segurança · 🗳️ Apoio popular. Mais: ⚡ **Energia limpa** (% da matriz), **emissões** (Gt CO₂/ano,
derivadas), **militar** (0–100, interno), **recursos** e **CP**.

Valores iniciais ⚙ (escala do jogo; os textos da ficha citam os dados reais com fonte):

| | 💰 | ❤️ | 🌳 | 🛡️ | 🗳️ | ⚡ limpa % | emissões fósseis Gt | desmatamento Gt | militar |
|---|---|---|---|---|---|---|---|---|---|
| Brasil | 55 | 79 | 62 | 58 | 55 | 50 | 0,5 | 0,9 | 30 |
| EUA | 85 | 92 | 50 | 85 | 50 | 18 | 4,9 | 0 | 90 |
| China | 78 | 80 | 38 | 80 | 60 | 20 | 12 | 0 | 75 |
| UE | 80 | 90 | 68 | 70 | 55 | 40 | 2,5 | 0 | 50 |
| Índia | 58 | 69 | 35 | 65 | 65 | 12 | 3,1 | 0 | 55 |
| Rússia | 52 | 83 | 50 | 72 | 60 | 14 | 1,8 | 0 | 80 |
| Reino Unido | 74 | 92 | 66 | 80 | 45 | 45 | 0,33 | 0 | 62 |
| Japão | 70 | 92 | 58 | 70 | 42 | 28 | 1 | 0 | 52 |
| Austrália | 58 | 94 | 55 | 70 | 52 | 40 | 0,39 | 0 | 40 |
| Nova Zelândia | 42 | 93 | 78 | 75 | 55 | 62 | 0,033 | 0 | 15 |
| África do Sul | 40 | 72 | 50 | 50 | 50 | 12 | 0,43 | 0 | 28 |
| Nigéria | 33 | 55 | 42 | 40 | 50 | 15 | 0,13 | 0 | 30 |
| Egito | 36 | 70 | 40 | 55 | 62 | 10 | 0,26 | 0 | 45 |

## 4. Recursos e mercado (interdependência)

### 4.1 Recursos
🌾 **Alimentos** · ⚡ **Energia** (petróleo, gás, eletricidade) · 💎 **Minerais críticos** (lítio, cobre,
terras raras, níquel) · 💻 **Tecnologia** (chips, software, pesquisa). Estoque de 0 a 12 de cada.

| Produção por mandato ⚙ | 🌾 | ⚡ | 💎 | 💻 | Consumo 🌾 | Consumo ⚡ |
|---|---|---|---|---|---|---|
| Brasil | 4 | 2 | 2 | 1 | 1 | 1 |
| EUA | 2 | 3 | 1 | 4 | 1 | 2 |
| China | 1 | 1 | 3 | 3 | 2 | 2 |
| UE | 2 | 0 | 1 | 3 | 1 | 1 |
| Índia | 2 | 1 | 1 | 3 | 2 | 1 |
| Rússia | 2 | 5 | 2 | 1 | 1 | 1 |
| Reino Unido | 1 | 1 | 0 | 3 | 1 | 1 |
| Japão | 1 | 0 | 0 | 4 | 2 | 2 |
| Austrália | 3 | 3 | 4 | 1 | 1 | 1 |
| Nova Zelândia | 3 | 1 | 0 | 1 | 0 | 1 |
| África do Sul | 2 | 1 | 4 | 1 | 1 | 1 |
| Nigéria | 3 | 4 | 1 | 0 | 2 | 1 |
| Egito | 1 | 2 | 1 | 1 | 2 | 1 |

Territórios parceiros (§7.3) somam a produção deles à da potência parceira.

### 4.2 Consumo
No balanço, cada potência consome o que a tabela manda. Se faltar, compra automaticamente no mercado mundial (§4.4).

### 4.3 Uso
Políticas gastam recursos (ex.: energia renovável gasta 💎 — a transição precisa de minerais críticos).

### 4.4 Mercado mundial (automático, no balanço)
- Faltou? Compra cada unidade pagando 💰 = preço da unidade. Sobrou acima de 8? Vende o excedente e ganha 💰.
- Preço ⚡ = 0,5 + energia/50 (energia = índice global, §5). Preço 🌾 = 0,5 + (deslocados/120) × 0,5 ⚙.
  💎 e 💻 = 1.
- **Sanções** cortam o comércio entre as duas potências: a sancionada vende com 50% de desconto, e o preço ⚡ sobe se
  ela for exportadora.
- **Negociar** (ação de 0 CP, 1 vez por vez): proposta de troca direta com outra potência (jogador aceita na tela;
  computador aceita se ganhar valor). Estilo Catan, ensina vantagem comparativa e interdependência.

## 5. O mundo: indicadores globais e simulação

### 5.1 Indicadores globais

| Indicador | Início (2026) | Leitura | Faixas |
|---|---|---|---|
| 🌡️ Temperatura (°C acima do pré-industrial) | 1,45 | termômetro | < 1,5 meta de Paris · 1,5–2,0 risco · 2,0–2,2 perigo · ≥ 2,2 colapso |
| ⏰ Tensão mundial (0–100) | 72 (Relógio a 85 s em 27/01/2026) | **Relógio do Juízo Final**: segundos para a meia-noite = (100 − tensão) × 3 | < 50 calmo · 50–80 alerta · 80–99 crise · 100 colapso |
| 🚢 Comércio global (0–100) | 62 | volume de comércio | < 40 fragmentação · > 75 globalização acelerada |
| 🕊️ Cooperação internacional (0–100) | 45 | força da ONU e dos acordos | < 30 cada um por si · > 70 multilateralismo forte |
| 🧳 Pessoas deslocadas (milhões) | 118 ⚙ (ACNUR: 117,8 no fim de 2025) | refugiados + deslocados internos | ≥ 150 emergência · ≥ 200 colapso |
| 🛢️ Preço da energia (índice, 50 = normal) | 60 (petróleo caro com a guerra do Irã, 2026) | preço do petróleo/gás | > 70 crise do petróleo · < 35 energia barata |

### 5.2 Emissões e clima
- Emissões de uma potência: `E = fóssil₀ × (💰/💰₀) × (100 − limpa)/(100 − limpa₀) + desmatamento`.
- Emissões de territórios neutros: soma de `emissões₀` (dados reais agregados) × (1 + 0,01 × Δdesenvolvimento)
  × (1 − 0,3 × transferênciaTecnológica), onde a transferência vem de acordos climáticos e fundos (0–1).
- Total mundial inicial ≈ 41 Gt/ano.
- `ΔT = 0,00068 × E_total × Δ` ⚙ (resposta transitória às emissões cumulativas, dentro da faixa do IPCC) + retroalimentação:
  +0,04 por mandato de 4 anos se T > 1,95; +0,15 se T > 2,1 ⚙ (degelo do permafrost, florestas morrendo). Pontos de
  virada também chegam por eventos: seca na Amazônia, incêndios e degelo do Ártico somam temperatura, mais quando já está quente.
- Metas de calibragem: emissões constantes → ~2,05 °C em 2050; todos acelerando o fóssil → colapso; cooperação
  forte → ~1,8 °C.
- **Dano climático** por rodada, em cada potência e território: `max(0, T − 1,4) × vulnerabilidade/100 × 6 ⚙`
  pontos tirados de economia e bem-estar (metade em cada), mais chance de eventos de desastre.

### 5.3 Tensão
Por mandato de 4 anos: `tensão += Σ decisões + (soma dos níveis de conflito − 17) × 0,3 + (militar médio − 65) × 0,08
− (cooperação − 45) × 0,05 + (74 − tensão) × 0,08` ⚙ (2026 começa com 25 níveis de conflito). Acima de 65, conflitos
escalam mais; acordo na COP baixa 2, fracasso sobe 1.

### 5.4 Comércio, cooperação, energia, deslocados
- Comércio: ações (§6), conflitos em rotas (Mar Vermelho, Taiwan, Mar do Sul da China: −3 por nível),
  pandemias, e volta 10% para 60 por rodada.
- Cooperação: ações multilaterais, resoluções aprovadas (+5), vetos (−3), sanções unilaterais (−2), volta 10% para 45.
- Energia (preço): conflitos em regiões produtoras (golfo, levante, irã, leste europeu, Venezuela, norte da África)
  +0,5 por nível ⚙; sanções a exportador +4; "explorar petróleo" −3; aumento médio da energia limpa das potências
  −0,5 por ponto; volta 20% para 50.
- Deslocados: + conflitos (4 milhões × nível × Δ/4), + desastres (3 a 8 milhões), − ajuda (−8), − acolhimento
  (−6), − paz (−10 por conflito encerrado), − 12% de retorno ou integração por mandato de 4 anos ⚙.

### 5.5 Indicadores das potências (balanço)
- **Economia:** `crescimento = base + (comércio − 60)/20 + efeitoEnergia + 0,3 × parceiros + bônusTecnologia
  − danoClimático/2 − sanções − (militar − militar de 2026)/80 − 0,05 × max(0, 50 − segurança)`.
  Base ⚙ (calibrada para que nenhuma potência largue na frente no IGI, que mede avanço): Índia 3,3, China 3,4, UE 2,4,
  Brasil 1,8, Rússia 1,3, EUA 0 (economia madura, que já cresce com tecnologia, venda de excedentes, energia e
  parceiros). Efeito energia: exportador líquido `+(energia − 50)/25`; importador `−(energia − 50)/25` ⚙.
- **Bem-estar:** `+ 0,3 × crescimento − danoClimático/2 − 2 × falta de alimentos + efeitos atrasados`.
- **Ambiente:** `+ 0,5 × (limpa − limpa₀)/10 − desmatamento × 3 − 0,5 × max(0, T − 1,5) × 10`.
- **Segurança:** `+ (militar − militar de 2026)/20 − (tensão − 60)/15 − 0,5 × conflitos vizinhos (nível ≥ 2)`.
- **Apoio popular:** `+ 0,5 × Δeconomia + 0,5 × Δbem-estar + 0,3 × Δsegurança + efeitos de política
  + (apoio de 2026 − apoio) × 0,1` (nos EUA, a queda vale 1,5 ×: polarização). Apoio < 30: **crise política** (−1 CP na próxima vez e evento de protesto).
  Apoio ≥ 70: +1 CP.

### 5.6 Relações bilaterais (diplomacia viva)
Cada par de potências tem uma **relação** de −100 (hostil) a +100 (aliada), partindo do retrato de 2026 em
`RELACOES` (`conteudo/potencias.js`: EUA×China −35, EUA×Rússia −55, UE×Rússia −60, EUA×Japão 70, Reino Unido×Austrália 65…).
Rótulos: Aliada ≥ 70 · Amiga 40–69 · Cordial 10–39 · Fria −24 a 9 · Tensa −59 a −25 · Hostil ≤ −60.
- **O que mexe nela:** ações com alvo (sanção, tarifa, embargo, acordo, aliança, missão diplomática), dilemas e
  decisões de eventos (efeitos `rel.china`, `rel.alvo`, `rel.local`, `rel.rivais`, `rel.aliados`, `rel.todos`; em eventos,
  o par explícito `rel.china.eua`), disputa por influência num território onde outra potência tem laços, alianças e
  sanções, guerras por procuração e incidentes.
- **Volta ao ponto de 2026:** 12% da distância por mandato (`retornoRelacao` ⚙).
- **Contágio e atrito (balanço):** `COMERCIO` dá a fatia da economia de cada potência exposta a cada parceiro. A economia
  muda com (fatia × quanto o parceiro cresceu acima da média do mundo × 0,8) e com (fatia × mudança da relação
  desde 2026 × 1,2), multiplicadas pela `exposicao` da potência (Austrália 1,4 · Nova Zelândia 1,6 · Reino Unido 1,2).
- **Reações do computador:** o alvo reage; amigos e aliados do alvo tomam partido e furam sanções; o computador
  pode retaliar tarifas e sanções (chance 15% + 60% × hostilidade); quem não é aliado se arma em resposta à corrida
  armamentista; pares abaixo de −50 podem ter incidente ou guerra comercial; pares acima de 55 às vezes cooperam.
- **Escala:** com mais de 8 potências, cada decisão pesa um pouco menos nos números do mundo (√(8 / nº de potências)).

## 6. Decisões: ações de governo

Cada vez, a potência tem **CP = 3** + 1 se apoio ≥ 70 − 1 se apoio < 30 + 1 por liderança continental (§7.4)
+ o que sobrou da vez anterior (até 1). Não há bônus por acerto: o dilema da vez (§9) é uma decisão a mais e não dá
CP de graça, mas algumas saídas dão ou tiram 1 CP nesta vez (ex.: mediar custa capital político).

**Barra de ações:** 6 ações, uma de cada categoria, sorteadas a cada vez, mais duas sempre disponíveis:
**Missão diplomática** e **Negociar**. **Trocar as ações** custa 1 CP.

**Categorias** (cor/ícone): 🤝 Diplomacia (roxo) · 💰 Economia e Comércio (laranja) · 🌱 Natureza e Energia (verde)
· 🛡️ Paz e Segurança (vermelho) · 👥 Pessoas e Direitos (rosa) · 💡 Ciência e Informação (azul).

Cada carta é **dado declarativo** em `conteudo/politicas.js`:

```js
{ id: 'energia_renovavel', nome: 'Energia renovável', categoria: 'natureza', icone: '☀️',
  custo: { cp: 2, minerais: 1 }, alvo: 'nenhum',            // nenhum | territorio | potencia | conflito
  requisito: null,                                         // ex.: { alvoComConflito: true } | { vizinhoOuParceiro: true }
  efeitos: [ { v: 'limpa', d: 10 }, { v: 'economia', d: -1 }, { v: 'producao.energia', d: 1, atraso: 1 } ],
  global: [ { v: 'energia', d: -1 } ],
  porque: 'Sol e vento substituem carvão e petróleo: a matriz fica mais limpa e as emissões caem.',
  conceito: 'Transição energética', bncc: ['EM13CHS304', 'EM13CHS306', 'EM13CNT309'] }
```

Caminhos de efeito: sem prefixo = a própria potência; `alvo.` = território ou potência alvo; `global.` = mundo;
`todos.` = todas as potências; `vizinhos.` = territórios vizinhos do alvo; `influencia` = influência da própria
potência no território alvo; `local.` = o lugar do evento ou do dilema; `cp` = Capital Político nesta vez;
`contadores.x` = contadores de missões e selos; `atraso: n` = aplica daqui a n balanços; `chance` = probabilidade;
`imune` = a prevenção anula (ciber, desinformação) ou reduz (pandemia) o dano. A mediação tem `seSucesso` e
`seFracasso`, escolhidos por sorteio com a chance de `chanceMediacao` (§6.1, item 25).

### 6.1 Catálogo (v1 — 40 cartas) ⚙

**🤝 Diplomacia**
1. **Missão diplomática** (fixa) — 1 CP, alvo território: +2 influência; +1 cooperação.
2. **Cooperação Sul-Sul** — 2 CP + 1 💻, território em desenvolvimento (< 65): +3 influência; +6 desenvolvimento (atraso 1); +1 cooperação.
3. **Propor resolução na ONU** — 2 CP: abre a Assembleia (§8.2) com uma resolução à escolha.
4. **Sanções econômicas** — 2 CP, potência: alvo −5 💰; própria −1 💰; comércio −3; tensão +4; cooperação −2 (unilateral).
5. **Aliança estratégica** — 2 CP, potência (precisa aceitar): ambas +4 🛡️; tensão +2 (Índia: 0). Dura até o fim.
6. **Cúpula regional** — 1 CP: +1 influência em todos os territórios vizinhos da sua casa e dos seus parceiros (máx. 4); +1 🗳️.

**💰 Economia e Comércio**
7. **Acordo de livre-comércio** — 2 CP, território ou potência: comércio +3; +2 💰 para ambos; +2 influência (território); EUA e UE +1 extra.
8. **Tarifas de importação** — 1 CP, potência: própria +1 💰 agora e −1 💰 no próximo balanço; alvo −3 💰; comércio −4; tensão +3; 🗳️ +2.
9. **Infraestrutura no exterior** — 3 CP + 1 💎, território: +4 influência; +6 desenvolvimento (atraso 1); pressão +10 (dívida) (China: 2 CP).
10. **Exportar commodities** — 1 CP + gasta 2 🌾 ou 2 💎: +3 💰; preço de 🌾/💎 do mundo cai.
11. **Política industrial** — 2 CP + 1 ⚡: +4 💰 (atraso 1); +1 💻 de produção; emissões fósseis +5%.
12. **Atrair empresas transnacionais** — 1 CP: +2 💰; −1 ❤️ (empregos precários) ou +1 ❤️ se bem-estar > 80; +1 comércio.
13. **Empréstimo a país em crise** — 2 CP − 2 💰, território com estabilidade < 40: estabilidade +8; +3 influência; desenvolvimento −2 (condições de austeridade) (escolha: com ou sem condições; sem condições: +2 influência a menos, sem a perda de desenvolvimento).

**🌱 Natureza e Energia**
14. **Energia renovável** — 2 CP + 1 💎: limpa +10; −1 💰; +1 ⚡ de produção (atraso 1); preço da energia −1.
15. **Explorar petróleo e gás** — 1 CP: +2 ⚡; +2 💰; limpa −3; −2 🌳; preço da energia −3.
16. **Desmatamento zero** — 2 CP: desmatamento −50% (Brasil: efeito em dobro no clima); +5 🌳; −1 💰; cooperação +2.
17. **Expandir a fronteira agrícola** — 1 CP: +2 🌾; +2 💰; −4 🌳; desmatamento +0,2 Gt.
18. **Fundo climático internacional** — 2 CP − 3 💰: cooperação +3; vulnerabilidade −5 em todos os territórios; +1 influência em 3 territórios mais vulneráveis; transferência tecnológica +0,1.
19. **Meta climática ambiciosa (NDC)** — 1 CP: promete limpa +15 até o próximo balanço; cumpriu: cooperação +3 e 🗳️ +2; não cumpriu: cooperação −3 e −2 influência em 3 territórios.
20. **Minerais críticos** — 1 CP, território com 💎 (ou a própria casa): +2 💎; +2 💰; −2 🌳 (ou −3 estabilidade local e pressão +8 no território).
21. **Energia nuclear** — 2 CP + 1 💻: limpa +8; +1 ⚡ de produção; tensão +1.
22. **Adaptação climática (água, cidades)** — 2 CP: vulnerabilidade própria −15; +2 ❤️.

**🛡️ Paz e Segurança**
23. **Ampliar a defesa** — 2 CP − 2 💰: militar +12; +5 🛡️; tensão +4. Computador tende a responder (dilema de segurança).
24. **Ciberdefesa** — 1 CP + 1 💻: +2 🛡️; imune a ciberataque por 2 balanços.
25. **Mediação de paz** — 2 CP, território em conflito. Antes de confirmar, a tela mostra a **chance de dar certo** e
    os fatores (`chanceMediacao`): ponto de partida 30%; +6% por ponto de influência no lugar (até +30%);
    + (cooperação − 45) × 0,6%; + (estabilidade − 35) × 0,4%; −10% por nível de conflito acima de 1; −30% se a
    potência é parte do conflito (em 2026: Rússia no Leste Europeu, EUA no Irã; ou tem base militar ali); −10% se é
    vizinha; entre 5% e 90% ⚙. Deu certo: conflito −1, tensão −5, +2 influência, 🗳️ +3. Não deu: tensão −1, +1 influência.
    Ensina que mediar depende de credibilidade, não de força nem de resposta certa.
26. **Ajuda à reconstrução** — 2 CP − 2 💰, território com conflito ≤ 1: estabilidade +10; desenvolvimento +5; deslocados −5; +3 influência.
27. **Base militar no exterior** — 2 CP, território: +3 influência; +2 🛡️; tensão +3; pressão +15.
28. **Combate ao crime transnacional** — 1 CP: +2 🛡️; estabilidade +3 nos vizinhos da sua casa; cooperação +1.
29. **Desarmamento** — 2 CP: militar −15; tensão −6; cooperação +3; 🛡️ −2. Se outra potência fizer o mesmo no mesmo mandato: tensão −4 extra.

**👥 Pessoas e Direitos**
30. **Acolher refugiados** — 1 CP + 1 🌾: deslocados −6; +1 influência em 2 territórios em conflito; −1 ❤️ e −2 🗳️ agora; +2 💰 (atraso 2, força de trabalho).
31. **Ajuda humanitária** — 2 CP + 2 🌾, território: deslocados −8; estabilidade +5; +2 influência.
32. **Investir em educação** — 2 CP − 2 💰: +6 ❤️ (atraso 1); +1 💻 de produção (atraso 2).
33. **Saúde pública e vacinas** — 2 CP − 2 💰: +5 ❤️; reduz pela metade o dano de pandemia.
34. **Combate à fome e à desigualdade** — 2 CP − 1 💰 + 1 🌾: +4 ❤️; +3 🗳️ (Brasil: +2 ❤️ extra).
35. **Direitos dos povos indígenas e quilombolas** — 1 CP: +3 🌳; +2 ❤️; desmatamento −0,1 Gt.
36. **Fechar fronteiras** — 1 CP: +3 🗳️ agora; deslocados +4; −2 influência em todos os territórios em conflito; −1 💰 (atraso 1); cooperação −2.

**💡 Ciência e Informação**
37. **Pesquisa e inovação** — 2 CP − 2 💰: +2 💻 de produção (atraso 1); +3 💰 (atraso 2).
38. **Combate à desinformação** — 1 CP + 1 💻: +2 🗳️; imune a desinformação por 2 balanços.
39. **Programa espacial e satélites** — 3 CP + 2 💻: +2 🛡️; +2 influência em 2 territórios; +2 🗳️.
40. **Diplomacia cultural (soft power)** — 1 CP: +1 influência em 3 territórios à escolha (música, cinema, esporte, novelas).

## 7. Territórios neutros e influência (o "War sem guerra")

### 7.1 Atributos
Cada um dos 32 territórios neutros (31 mais a Antártida, que não aceita influência) tem: população (milhões), **desenvolvimento** (0–100, ≈ IDH × 100),
**estabilidade** (0–100), **vulnerabilidade climática** (0–100), **recursos** que produz (ex.: Península Arábica
⚡⚡⚡), **floresta** (Gt de desmatamento possível, se houver), **conflito** (0–3), **emissões** (Gt), **influência**
de cada potência (0–10) e **pressão** (0–100, ressentimento contra interferência externa). Ficha com texto
"Você sabia?" e fontes em `conteudo/territorios.js`.

### 7.2 Influência
Torres de tijolos na cor de cada potência, até 10. Ganha-se com as cartas. Perde-se com eventos (golpe,
eleição), com **reação soberanista** e quando um conflito sobe de nível (−1 de todos).

### 7.3 Parceria
Um território é **parceiro** de uma potência quando a influência dela ≥ **resistência** (3 + estabilidade/25,
arredondado para baixo ⚙) **e** supera a segunda maior em pelo menos 2. Parceiro: pinta o território com a cor da
potência (onda de cor), produz os recursos dele para ela, vota com ela na ONU (a não ser que a pressão esteja ≥ 50)
e vale pontos no IGI.

### 7.4 Liderança continental
Ter a maioria dos territórios neutros de um continente como parceiros dá **+1 CP por vez** e +6 IGI.

### 7.5 Pressão e soberania
Base militar (+15), infraestrutura com dívida (+10), minerais (+8), sanções sofridas pelo parceiro (+5) somam
pressão; cai 10 por balanço. Pressão ≥ 60: **reação soberanista** — a potência que mais pressionou perde metade
da influência ali, com manchete. Ensina soberania, neocolonialismo e por que cooperação dura mais que imposição.

### 7.6 Conflitos e estabilidade
Nível 0–3. Início ⚙ (confirmar com fatos.json): leste_europeu 3 (guerra na Ucrânia), levante 2 (Gaza, Síria),
africa_oriental 3 (Sudão), sahel 2, africa_central 2 (leste da RD Congo), sudeste_continental 2 (Mianmar),
caribe 2 (Haiti), afeg_paquistao 1, golfo 1 (Iêmen), venezuela_guianas 1, taiwan 0 (foco de tensão),
coreia_norte 0 (foco de tensão). Por balanço: conflito escala com chance `(tensão − 60)/100 + (40 − estabilidade)/100`
e esfria com chance `(cooperação − 30)/100 + 0,15 × mediações`; estabilidade < 20 pode iniciar conflito novo.
Estabilidade tende a `desenvolvimento − 10 × conflito`. Desenvolvimento +1/balanço, −conflito, −dano climático.

### 7.7 Antártida
Protegida pelo Tratado da Antártida (1959): não aceita influência nem bases; só cooperação científica (carta
"Programa espacial e satélites" e eventos). Ensina governança internacional.

## 8. Eventos, Assembleia da ONU e Cúpula do Clima

### 8.1 Plantão Global (eventos)
`conteudo/eventos.js`, 48 eventos declarativos:
```js
{ id: 'crise_petroleo', titulo: 'Crise no Estreito de Ormuz', texto: '…', local: 'golfo', icone: '🛢️',
  peso: .9, condicoes: [ { v: 'global.tensao', min: 75, x: 2 } ], efeitos: [ … ],
  escolha: null,  // ou { tipo: 'votacao', resolucao } | { tipo: 'doacao', recurso, meta, sucesso, fracasso }
                  // ou { tipo: 'decisao', opcoes: [{ texto, resumo, categoria, efeitos, porque, manchete }], coletivo? }
  bncc: ['EM13CHS201'], vocesabia: '…' }
```
**Decisão de todas as potências** (`escolha.tipo = 'decisao'`): cada equipe escolhe em segredo uma das 2 ou 3 saídas
(cada saída tem categoria, efeitos e porquê); a revelação é simultânea e cada escolha vira manchete
(`resolverDecisao`). Com `coletivo`, se pelo menos *min* potências escolherem a mesma saída, o mundo todo sente
(ação coletiva: liberar estoques de petróleo juntos derruba o preço; checar a notícia falsa juntos baixa a tensão;
escolta conjunta reabre o Mar Vermelho). Eventos com decisão: onda de desinformação (regular plataformas, campanha
de checagem ou ignorar — quem se preparou antes com Combate à desinformação não sofre), crise em Ormuz, terras
raras, ataques no Mar Vermelho, travessias perigosas e tensão no Estreito de Taiwan. O computador escolhe com
`iaDecisao` (o perfil dele pesa as saídas, com variedade).

Tipos: desastres climáticos (onda de calor, seca na Amazônia, furacão, enchentes, aumento do mar no Pacífico,
incêndios, degelo do Ártico — os três últimos também são pontos de virada do clima), crises (pandemia, crise do
petróleo no Estreito de Ormuz, crise alimentar, crise da dívida, ciberataque, cabos submarinos, onda de
desinformação, Mar Vermelho, Canal do Panamá), conflitos (escalada, golpe, Estreito de Taiwan, Península Coreana,
Mar do Sul da China, Essequibo, Sudão, Haiti), migrações (Operação Acolhida, travessias perigosas), recursos
(lítio, terras raras, água, Margem Equatorial), política (eleições, protestos por democracia, onda populista, povos
indígenas e quilombolas, Assembleia Geral) e boas notícias (acordo de paz, energia solar, vacina compartilhada,
Olimpíada, acordo comercial). Cada evento traz "Você sabia?" com fato datado e fonte, e BNCC.

### 8.2 Assembleia da ONU (estilo reunião de emergência)
Aberta pela carta "Propor resolução" ou por evento. Resoluções: Missão de paz em [território]; Sanções contra
[potência]; Acordo climático global; Fundo humanitário; Tratado de desarmamento; Fundo de vacinas.
- **Conselho de Segurança** (missão de paz, sanções): votam as potências da partida. EUA, China, Rússia, UE (França) e
  Reino Unido têm **veto**. Aprovação: pelo menos 57% de votos sim (`maioriaConselho`) e nenhum veto.
- **Assembleia Geral** (clima, fundos, desarmamento): 1 voto por potência e 1 por território neutro (os parceiros
  votam com a potência; os demais votam por interesse: vulneráveis votam a favor do clima, etc.). Maioria simples.
- Tela: faixa "REUNIÃO NA ONU" com som de reunião; grade com os bonecos; o proponente pode fazer um discurso de 30 s;
  cada equipe vota escondida na sua vez ("Equipe Verde, toque para votar"); revelação com carimbos; "VETO!" em destaque.

### 8.3 Cúpula do Clima (COP)
Rodadas pares. Cada potência escolhe em segredo: **compromisso alto** (limpa +12, −3 💰), **médio** (+6, −1 💰)
ou **nenhum**. Revelação simultânea. Soma dos compromissos ≥ meta da mesa ⚙ (`copPorPotencia` = 7/6 ponto por potência: 7 com seis, 15 com treze): **acordo histórico** (cooperação +6,
transferência tecnológica +0,15, deslocados −4); senão "cúpula fracassa" (cooperação −3). Quem não se comprometeu
paga menos agora e se beneficia do esforço alheio: a turma vive a **tragédia dos comuns**.

## 9. Dilemas de governo (a BNCC vivida)

No começo de cada vez, a potência enfrenta **um dilema de governo** (`conteudo/dilemas.js`, 66 situações, 18 delas próprias das sete potências da segunda onda): um caso
datado e verificado, com 2 ou 3 saídas e **nenhuma resposta certa**. Cada saída é uma troca real — ganha aqui e perde
ali, agora ou depois, em casa ou no mundo — e a consequência aparece no mapa, nos indicadores e na manchete, com o
porquê e o conceito de geopolítica que a turma acabou de viver.

```js
{ id: 'soja_floresta', titulo: 'Mais soja ou mais floresta?', icone: '🌱', potencias: ['brasil'], local: 'casa',
  texto: 'Os compradores pedem mais soja e carne… o desmatamento na Amazônia caiu 12% entre ago/2024 e jul/2025 (INPE).',
  conceito: 'Commodities, agronegócio e floresta', bncc: ['EM13CHS302', 'EM13CHS306', 'EM13CHS201'],
  vocesabia: 'Em 2025, a China comprou 28,7% de tudo o que o Brasil exportou (Comex Stat/MDIC).',
  opcoes: [
    { texto: 'Abrir novas áreas e exportar mais.', resumo: 'Abrir novas áreas', categoria: 'economia',
      efeitos: [{ v: 'economia', d: 3 }, { v: 'desmatamento', d: .15 }, { v: 'ambiente', d: -3 }, …],
      porque: 'Mais área plantada dá dólares rápidos, mas derruba vegetação nativa e ameaça a chuva que o agro precisa.',
      manchete: '{quem} {libera|liberam} novas áreas para a soja, e o desmatamento volta a subir' }, … ] }
```

- **Português certo para qualquer potência e lugar:** os textos usam marcadores que o motor troca (`Simulacao.preencher`):
  `{quem}` e `{local}` dão o nome; `{o quem}`, `{em local}`, `{de quem}`, `{a local}` põem artigo e preposição ("os
  Estados Unidos", "no Sahel", "dos Estados Unidos", "ao Sahel"; `{O quem}` e `{Em local}` com maiúscula); e
  `{libera|liberam}` faz o verbo concordar com quem decide ("Brasil libera", "Estados Unidos liberam"). Cada
  território e potência tem o seu `artigo`.

- **Sorteio** (`dilemaDaVez`): sem repetir na partida; pesa as condições do mundo (`global.*`, conflitos, rodada) e de
  quem decide (`potencia.apoio`, `potencia.recursos.alimentos`, nº de parceiros); dilemas de uma potência (Brasil,
  Índia, Rússia…) saem um pouco mais para ela; o foco da aula (temas) pesa 2,5 ×; o `local` pode ser fixo, a própria
  casa, um vizinho, um território em conflito ou onde a potência já tem influência. Sem dilema que sirva, a vez
  segue sem dilema.
- **Escolha** (`resolverDilema`): aplica os efeitos (inclusive os que demoram), soma as habilidades BNCC do dilema em
  `e.bncc`, grava a manchete e devolve `{ mudancas, manchete, porque, conceito }`. O computador escolhe com
  `iaDilema`: sorteio que puxa para o que o perfil dele mais valoriza (padrão, ganancioso ou cooperativo), para que
  nenhuma saída seja "a certa" (o teste avisa se alguma sai em mais de 90% das vezes).
- **Categorias** (cor e conselheiro com o chapéu do tema): diplomacia, economia, natureza, segurança, pessoas,
  ciência. Hoje: diplomacia 40 saídas, economia 43, segurança 21, pessoas 15, ciência 13, natureza 12.
- **Cobertura BNCC:** as 32 habilidades EM13CHS aparecem no baralho, com ênfase nas centrais — EM13CHS201 (11
  dilemas), 203 (5), 204 (10), 305 (10), 603 (9) e 604 (14). `node ferramentas/validar-conteudo.mjs dilemas` confere
  formato, categorias, efeitos, seletores, ids, códigos e cobertura.
- **Conteúdo:** fatos de 2023 a 2026 verificados na pesquisa (`fatos.json`), sempre datados e atribuídos; contexto do
  Brasil e de Santa Catarina quando cabe (Questão de Palmas, Xokleng, carne suína, região carbonífera, Operação
  Acolhida, Aquífero Guarani); neutralidade política (nada de disputas partidárias brasileiras); linguagem para 15–18 anos.

| Tema da aula | Exemplos de dilemas |
|---|---|
| 🗺️ Território e soberania | base militar no vizinho, Essequibo, Ártico, Rota do Norte, pastores nômades, Antártida, alto-mar |
| 🌐 Ordem mundial | veto a um parceiro, sair de um organismo, entre dois polos, sediar cúpula, missão de paz, golpe na região |
| 💰 Globalização | tarifa sofrida, proteger a indústria, terras raras, chips, robôs, primeiro emprego, plataforma estrangeira, Mercosul–UE |
| 🌱 Natureza e clima | soja × floresta, minas de carvão, rio Indo, meta climática, fundo das florestas, enchente, geoengenharia, lixo eletrônico |
| ⚔️ Conflitos | venda de armas, corrida armamentista, atentado, cessar-fogo × paz completa |
| 👥 Pessoas e direitos | refugiados, Roraima, xenofobia, terras indígenas, patrimônio colonial, vídeo falso, censo, promessa eleitoral, surto, grãos |

## 10. Modos, IGI e missões secretas

### 10.1 IGI (competitivo e blocos)
`IGI = 100 + 2·Δ❤️ + 1,5·Δ💰 + 1·Δ🌳 + 1·Δ🛡️ + 0,5·Δ🗳️ + 3·parceiros + 6·lideranças continentais
+ 12·missão secreta cumprida + 4·selos` ⚙.
Selos (até 5): 🌍 Clima (emissões −30% ou limpa ≥ 70), 🕊️ Paz (2 mediações bem-sucedidas),
🤲 Solidariedade (2 acolhimentos, ajudas ou doações), ❤️ Desenvolvimento (❤️ +8),
🏛️ Diplomacia (3 resoluções aprovadas com seu voto a favor). Nada no placar depende de acertar perguntas.
**Saúde do planeta:** +10 para todos se T < 1,8 e tensão < 50; −10 para todos se T ≥ 2,0, tensão ≥ 85 ou
deslocados ≥ 150. Colapso: ninguém vence (mas o relatório mostra a contribuição de cada um).

### 10.2 Missões secretas
Cada potência recebe 1 missão possível para ela (sorteada), vista em segredo no começo. Exemplos:
Liderança sul-americana (3 parceiros na América do Sul); Amiga da África (3 parceiros africanos);
Rota da Seda (parceiros em 3 continentes); Potência verde (limpa ≥ 70 e 🌳 ≥ 70); Pacificadora (tensão < 55
em 2050); Celeiro do mundo (exportar 10 🌾); Vale do Silício (12 💻 em estoque); Anfitriã solidária
(3 acolhimentos); Guardiã do Ártico (parceira da Groenlândia e Ártico + 1 parceiro no Atlântico Norte);
Diplomata-chefe (2 resoluções propostas e aprovadas); Ilha de estabilidade (🛡️ ≥ 85 e tensão < 70);
Revolução educacional (❤️ +10).

### 10.3 Cooperativo — Metas 2050
🌡️ temperatura < 2,0 · ⏰ tensão < 60 · 🧳 deslocados < 100 milhões · 📈 desenvolvimento médio dos territórios
≥ 60 · 💰 nenhuma potência com economia abaixo da inicial. **Vitória: 4 das 5 metas e nenhum colapso.**

### 10.4 Agente infiltrado (opcional, cooperativo, ≥ 3 jogadores)
No começo, cada equipe vê em segredo seu papel: **Diplomata** ou **Infiltrado** (um só), que recebe uma agenda
oculta: Lobby fóssil (T ≥ 2,0 em 2050), Mercador de armas (tensão ≥ 80 em 2050), Especulador (comércio ≤ 40),
Muralha (deslocados ≥ 150). **Reunião de emergência:** uma vez por partida, qualquer equipe pode chamar
(2 CP): 60 s de discussão e votação. Acertou: o infiltrado é exposto e a agenda dele falha; errou: o acusado
perde 2 CP e a tensão sobe 5. Votação final em 2050. O infiltrado vence se a agenda dele se cumprir sem ser
exposto; a turma vence se cumprir as metas e não deixar a agenda se cumprir.

## 11. Computador (IA)

- Cada potência do computador tem pesos de prioridade (ex.: EUA: segurança 1,2 · economia 1,2 · influência 1,0
  · ambiente 0,6; UE: ambiente 1,2 · cooperação 1,2 · economia 1,0; China: economia 1,3 · influência 1,2;
  Rússia: segurança 1,3 · energia 1,2; Índia: economia 1,2 · bem-estar 1,1; Brasil: ambiente 1,0 · economia 1,0 ·
  cooperação 1,1) ⚙, descritos de forma neutra. As sete potências da segunda onda têm pesos próprios em `potencias.js` (ex.: Nova Zelândia: ambiente 1,4 · cooperação 1,4; Japão: economia 1,2 · cooperação 1,1; Nigéria: economia 1,2 · segurança 1,1).
- Utilidade de uma carta = Σ peso × efeito esperado (imediato + 0,7 × atrasado) − custo + ruído ±10% +
  reações: tensão ≥ 80 → diplomacia +50% (e militar +30% para quem se sente ameaçado); T ≥ 1,9 → clima +50%;
  deslocados ≥ 150 → ajuda +40%; apoio próprio < 40 → medidas populares +40%.
- Alvos: territórios onde está perto da parceria ou disputando com rivais.
- Votos: a favor se a utilidade esperada ≥ 0; veta sanções contra si ou contra parceiros.
- Potências do computador também são verossímeis e **não** sabotam de propósito.

## 12. Telas e interface (jogo 3D de peças de montar)

**Direção:** o jogo NÃO é um jogo de cartas nem de perguntas. A linguagem é de jogo 3D: o mundo de peças é o palco,
os bonecos de blocos são os personagens, e cada decisão **constrói** algo no mapa ou muda o mundo à vista. Do Carreira
em Jogo fica só a base de sala de aula (telão, turnos, mediador). Ativos open source (modelos CC0, ícones, fontes OFL,
áudio CC0) entram onde elevam o acabamento. Detalhes visuais no guia de arte. Nenhuma marca de terceiros aparece no
jogo, nos créditos de estilo ou nos comentários.

1. **Início:** o mapa de peças ao fundo com a câmera passeando; logotipo "GEOGRAFIA IRADA" em letras de bloco e o
   mascote 3D Globo Irado acenando; botões Jogar, Continuar, Manual do Diplomata, Para o professor.
2. **Lobby das delegações:** (1) Modo; (2) Delegações: as 13 potências lado a lado como bonecos 3D numa plataforma,
   cada uma marcada "Equipe" ou "Computador", com cor e forma; nome da equipe; **editor de avatar** com prévia 3D
   girando (chapéu, tom de pele, cabelo, acessório); (3) Ajustes. Botão grande "Começar".
3. **Revelação secreta:** tela escura, o boneco da equipe em destaque e o papel em letras grandes ("DIPLOMATA" ou
   "INFILTRADO"), ou a missão secreta; "Só a Equipe Verde olha!" e passa adiante.
4. **Partida:** mapa 3D em tela cheia com HUD de jogo: topo = ano/mandato e os 6 indicadores globais com o
   Relógio do Juízo Final; esquerda = placar das delegações (com avatar, cor e forma); direita = painel da equipe da
   vez (indicadores, recursos, Capital Político como pinos); **embaixo = barra de ações** com botões em forma de
   tijolo (as 6 políticas sorteadas + Missão diplomática + Negociar + Trocar); faixa de manchetes.
   Passar o mouse num território abre a ficha em balão. Ao escolher uma ação com alvo, os alvos válidos brilham.
   **A ação vira construção:** um objeto de peças se monta no alvo (turbina, fábrica, embaixada, tendas, navio,
   satélite…), tijolos de influência caem na torre, o território muda de cor em onda, números saltam no HUD e a
   manchete explica o porquê. Na mediação, antes de confirmar, aparece a chance de dar certo com os fatores.
5. **Dilema de governo** (`Dilemas.vez`): painel com o boneco da equipe e os conselheiros (cada um com o chapéu da
   categoria da sua saída), a situação datada, o lugar em foco no mapa e as 2 ou 3 saídas com cor + ícone da
   categoria e o resumo da troca. Ao escolher, a câmera mostra a consequência, os números saltam, a manchete sai no
   Jornal Mundial e um balão diz o porquê e o conceito (e o "Você sabia?"). Na vez do computador, uma animação curta
   mostra a saída escolhida (`Dilemas.mostrarIA`).
6. **Plantão Global estilo telejornal:** vinheta, âncora (boneco) e manchete; a câmera voa até o lugar e o efeito
   acontece no mapa (tempestade, seca, conflito…). Pedido de ajuda com contagem de doações. **Decisão de todas as
   equipes:** cada uma escolhe em segredo (passa o tablet), a revelação é simultânea, cada escolha vira manchete e,
   se a ação coletiva acontecer, o mundo inteiro reage.
7. **ONU estilo reunião de emergência:** sirene e faixa; sala 3D com mesa redonda e os bonecos das delegações;
   tablet de votação com as delegações em linhas, "pular voto"; votos escondidos e revelados com carimbos; "VETO!".
   **Cúpula do Clima:** compromissos secretos revelados juntos.
8. **Balanço do mandato:** a câmera sobrevoa o que mudou; painel de indicadores com antes → depois e setas de causa;
   decisões que demoraram e chegaram agora; emissões por potência (com per capita e histórico, para não culpar
   ninguém de forma simplista).
9. **Fim:** faixa "2050"; vitória ou colapso, com os bonecos em fila; **pódio 3D de tijolos** com chuva de tijolinhos;
   "O mundo em 2050" (gráficos por ano, manchetes marcantes, quem mais emitiu, quem mais ajudou, os dilemas de cada
   equipe); relatório BNCC com as habilidades **vividas** nas ações, eventos e dilemas (nunca acertos); perguntas para
   debater; **foto oficial da cúpula** (PNG).
10. **Manual do Diplomata** (como jogar completo, com abas: objetivo, turno, indicadores, ações explicadas, territórios,
    eventos, ONU, modos, glossário de geopolítica, BNCC) e versão para imprimir. **Para o professor:** mapa BNCC,
    como editar o conteúdo, sugestões de aula.

## 13. Balanceamento (teste automático)

`node teste-simulacao.mjs [n]` joga n partidas (padrão 300) por cenário só com o computador, resolvendo eventos,
decisões, votações, doações, Cúpulas do Clima, dilemas e ações como a interface faria, e verifica:
- Nenhum NaN, nenhum valor fora da faixa (inclusive CP 0–20 e contadores); partidas sempre terminam; nenhum dilema
  repete na partida; nenhuma jogada de briefing; todo dilema e toda decisão de evento geram manchete e porquê.
- **IA padrão (competitivo, 6 rodadas):** colapso entre 1% e 25%; temperatura mediana em 2050 entre 1,85 e 2,25 °C;
  tensão mediana entre 60 e 80; deslocados medianos entre 100 e 160 milhões; nenhuma potência vence mais de 22% das
  partidas e todas vencem pelo menos 1%; 110 a 320 decisões por partida (13 potências: ações + dilemas + decisões em eventos).
- **IA gananciosa** (só economia): colapso em pelo menos 50% (a tragédia dos comuns tem de doer).
- **IA cooperativa, modo cooperativo:** colapso abaixo de 5% e vitória cooperativa (4 de 5 metas) entre 40% e 80%.
- **Dilemas sem resposta certa:** aviso se alguma saída for escolhida pelo computador em mais de 90% das vezes ou nunca.
- **Diplomacia:** relações sempre entre −100 e +100; contrato de `relacoesDe`, reações e efeitos `rel.*` conferido no começo do teste.

Resultado em out/2026, com as **treze** potências e o motor de relações (300 partidas por cenário, sementes 1000–1299):

| Cenário | Colapso | T 2050 | Tensão | Deslocados | Decisões | Vitórias |
|---|---|---|---|---|---|---|
| Padrão, 6 rodadas | 1% | 2,11 °C | 75 | 109 mi | 273 | de 4% (África do Sul) a 16% (Brasil); IGI médio de 99 a 103 em todas |
| Gananciosa | 94% | 2,44 °C | 86 | 138 mi | 275 | — |
| Cooperativa (modo cooperativo) | 0% | 2,01 °C | 40 | 69 mi | 264 | vitória cooperativa 56% |
| Padrão, 4 rodadas | 11% | 2,17 °C | 76 | 134 mi | 178 | — |
| Padrão, 8 rodadas | 0% | 2,06 °C | 79 | 88 mi | 366 | — |

Em média, uma partida de 6 rodadas tem 166 ações + 78 dilemas + 30 decisões em eventos. As equipes humanas dividem a lista de
dilemas (cada um aparece uma vez na mesa); cada potência do computador usa a sua, para não gastar o estoque dos alunos.
Uma jogada do computador em ~6 por partida é hostil (sanção, tarifa, embargo, espionagem), mais retaliações, incidentes e
cooperações espontâneas (`iaRivalidade`, `incidente`, `cooperacaoEspontanea` em `PARAM`).

Ajustes desta calibragem (todos marcados com comentário em `js/simulacao.js` e `conteudo/potencias.js`): CP base 3
sem bônus de acerto; dilemas e decisões escolhidos por sorteio ponderado (`variedadeIA` 1,2); preço da energia menos
sensível a conflitos (0,5 por nível) e à economia (÷ 25), para que exportar petróleo não decida a partida; segurança,
gasto militar e apoio medidos em relação ao próprio 2026; conflitos vizinhos pesam 0,5; polarização dos EUA só nas
quedas; crescimento-base recalibrado para as 13 potências (§5.5); `tcre` 0,00069 e retroalimentação 0,15 acima de 2,1 °C; tensão volta
para 64 e conflitos acima de 19 níveis esquentam; 12% dos deslocados voltam por mandato; acordo na COP baixa a tensão.
