// =====================================================================
//  GEOGRAFIA IRADA — Manual do Diplomata e glossário de geopolítica
// =====================================================================
//  MANUAL: seções do "como jogar" { id, titulo, icone, html } (html simples: <p>, <ul>, <li>, <b>, <h3>).
//  A lista detalhada de cada ação o jogo monta sozinho a partir de politicas.js.
//  Marcadores entre chaves duplas são trocados pelos valores de Simulacao.PARAM (js/simulacao.js):
//    {{colapso.temperatura}} {{colapso.tensao}} {{colapso.deslocados}}
//    {{metas.temperatura}} {{metas.tensao}} {{metas.deslocados}} {{metas.desenvolvimento}}
//  Os demais números deste texto seguem os valores atuais do motor: se mudar o balanceamento, revise-os
//  (ferramentas/gerar-como-jogar.mjs avisa quando um número citado aqui muda em Simulacao.PARAM).
//  Regra do jogo: a vez começa com um dilema de governo sem resposta certa (dilemas.js),
//  eventos podem pedir decisões de todas as potências e a mediação depende de chance (chanceMediacao).
//  Depois de editar, rode  node ferramentas/validar-conteudo.mjs manual
//  e  node ferramentas/gerar-como-jogar.mjs  (atualiza docs/COMO-JOGAR.md).
// =====================================================================

const MANUAL = [
  {
    id: 'objetivo', titulo: 'Missão 2050', icone: '🌍',
    html: `
<p>Bem-vindo, diplomata! Em <b>Geografia Irada</b>, cada equipe governa uma das <b>seis potências</b> do mapa — Brasil, Estados Unidos, China, União Europeia, Índia e Rússia — de <b>2026 a 2050</b>. Cada rodada é um <b>mandato</b> de alguns anos, e cada decisão mexe no mundo inteiro.</p>
<p>O desafio é o mesmo da geopolítica de verdade: todo governo quer ver o próprio país prosperar, mas todos dividem <b>um planeta só</b>. Um clima estável, a paz e o comércio são <b>bens comuns</b>: ninguém consegue tê-los sozinho, e as crises humanitárias afetam todos. Quem só pensa em si empurra o mundo para o colapso — e, num planeta em colapso, <b>ninguém vence</b>.</p>
<h3>Aqui ninguém ataca ninguém</h3>
<p>Não existe guerra entre jogadores. A disputa é por <b>influência</b>: diplomacia, comércio, investimento, ajuda, cultura e ciência. Os conflitos aparecem no mapa como focos de crise que reagem às decisões de todos e pedem mediação, ajuda humanitária e missões de paz.</p>
<h3>Escolha o modo</h3>
<ul>
<li><b>Cada nação por si (competitivo):</b> vence quem chegar a 2050 com o maior <b>Índice Geografia Irada (IGI)</b> — desde que o planeta sobreviva. Com as <b>missões secretas</b> ligadas, cada potência ainda persegue um objetivo escondido.</li>
<li><b>Em blocos:</b> as equipes se juntam em 2 ou 3 blocos, e vence o bloco com a maior média de IGI. Aqui também há missões secretas.</li>
<li><b>Todos pelo planeta (cooperativo):</b> a turma inteira tenta cumprir as <b>Metas 2050</b>. Opcional: um <b>agente infiltrado</b> com agenda secreta.</li>
<li><b>Solo:</b> uma equipe contra (ou junto com) cinco potências do computador.</li>
</ul>
<p>As potências que nenhuma equipe escolher ficam com o <b>computador</b>, que joga de forma realista e não sabota ninguém de propósito.</p>
<h3>Metas 2050 (modo cooperativo)</h3>
<ul>
<li>🌡️ <b>Clima:</b> temperatura abaixo de +{{metas.temperatura}} °C.</li>
<li>⏰ <b>Paz:</b> tensão mundial abaixo de {{metas.tensao}}.</li>
<li>🧳 <b>Humanidade:</b> menos de {{metas.deslocados}} milhões de pessoas deslocadas.</li>
<li>📈 <b>Desenvolvimento:</b> desenvolvimento médio dos territórios de {{metas.desenvolvimento}} ou mais.</li>
<li>💰 <b>Prosperidade:</b> nenhuma potência com a economia menor que a de 2026.</li>
</ul>
<p>A turma vence se cumprir <b>pelo menos 4 das 5 metas</b>, sem colapso. Elas se inspiram no <b>Acordo de Paris</b> e nos <b>Objetivos de Desenvolvimento Sustentável</b> (ODS) da Agenda 2030 da ONU.</p>
<h3>As seis potências</h3>
<p>Cada potência tem uma <b>força</b> e uma <b>fraqueza</b> inspiradas no mundo real: o Brasil é potência ambiental e agrícola, mas desigual; a União Europeia regula e negocia bem, mas importa energia; a Índia tem a maior população do mundo e sofre com o calor extremo… No lobby, toque numa potência para ver os detalhes. Os números do jogo são uma <b>aproximação didática</b> de dados reais: servem para o mundo começar parecido com o de verdade, não para dar nota a nenhum país.</p>`,
  },
  {
    id: 'como-jogar', titulo: 'Como uma partida funciona', icone: '🎮',
    html: `
<p>A partida sempre vai de 2026 a 2050. O professor escolhe quantos mandatos ela tem:</p>
<ul>
<li><b>Rápida:</b> 4 mandatos de 6 anos (cerca de 30 minutos).</li>
<li><b>Aula:</b> 6 mandatos de 4 anos (cerca de 45 minutos) — o padrão.</li>
<li><b>Completa:</b> 8 mandatos de 3 anos (cerca de 60 minutos).</li>
</ul>
<p>Cada mandato tem três momentos.</p>
<h3>1. Abertura: o mundo dá notícias</h3>
<p>Uma faixa anuncia o ano e entra no ar o <b>Plantão Global</b>, o telejornal do Jornal Mundial, com um evento (dois, se o mundo estiver em crise). Alguns eventos pedem uma votação na ONU, um pedido de ajuda ou uma <b>decisão de todas as potências</b>. Nos mandatos pares acontece também a <b>Cúpula do Clima</b>.</p>
<h3>2. A vez de cada potência</h3>
<p>As potências jogam na ordem do mapa, e a cada mandato começa uma diferente. Na vez da sua equipe:</p>
<ul>
<li><b>Dilema de governo:</b> a vez começa com uma situação real e datada, com 2 ou 3 saídas defendidas pelos seus conselheiros. <b>Não existe resposta certa</b>: cada saída ganha numa coisa e perde em outra. A equipe escolhe, e a consequência aparece na hora no mapa e nos indicadores, com a manchete e o porquê (veja “Dilemas de governo”).</li>
<li><b>Ações:</b> gaste seu Capital Político (CP) nas ações da barra (veja “Ações de governo”). Quando a ação tem alvo, os alvos válidos brilham no mapa — e também aparecem numa lista.</li>
<li><b>Encerrar a vez:</b> até 1 CP que sobrar fica guardado para a próxima.</li>
</ul>
<p>A vez de cada equipe leva pouco mais de um minuto: uns 25 segundos para o dilema e uns 50 para as ações. As potências do computador também enfrentam dilemas: decidem sozinhas, cada uma do jeito do seu governo, e jogam em poucos segundos. Dá para pular a animação.</p>
<h3>Capital Político (CP)</h3>
<p>É a força política do governo para agir: cada ação custa CP. No começo de cada vez, você recebe:</p>
<ul>
<li><b>3 CP</b> de base;</li>
<li>+ o CP guardado da vez anterior (no máximo 1);</li>
<li>+1 se o apoio popular estiver em 70 ou mais, ou −1 se estiver abaixo de 30 (crise política);</li>
<li>+1 para cada <b>liderança continental</b>.</li>
</ul>
<p>Você sempre começa a vez com pelo menos 1 CP. O dilema não dá CP de presente, mas algumas saídas custam 1 CP nesta vez: oferecer uma mediação, fiscalizar uma empresa ou fazer uma consulta prévia também gastam capital político.</p>
<h3>3. Balanço do mandato</h3>
<p>Quando todos jogam, o mundo avança alguns anos, nesta ordem:</p>
<ul>
<li>chegam os <b>efeitos que demoram</b> (educação, pesquisa, obras e escolhas de dilemas de mandatos anteriores);</li>
<li>cada potência <b>produz e consome</b> recursos, e o <b>mercado mundial</b> fecha as compras e as vendas;</li>
<li>as <b>emissões</b> do mundo inteiro aquecem o planeta;</li>
<li>o <b>dano climático</b> e o ritmo da economia mudam os indicadores de cada nação;</li>
<li>os territórios mudam: desenvolvimento, estabilidade, conflitos e pressão;</li>
<li>mudam os números do mundo: tensão, comércio, cooperação, preço da energia e deslocados.</li>
</ul>
<p>A tela de Balanço mostra o <b>antes</b>, o <b>depois</b> e, principalmente, o <b>porquê</b> de cada mudança. Se algum limite de colapso for atingido, a partida acaba na hora. O jogo salva sozinho a cada mandato.</p>`,
  },
  {
    id: 'dilemas', titulo: 'Dilemas de governo', icone: '⚖️',
    html: `
<p>Governar é escolher entre coisas boas que não cabem juntas — ou entre problemas, decidindo qual aceitar. Por isso, a vez de cada potência começa com um <b>dilema de governo</b>: uma situação inspirada em fatos reais de 2023 a 2026, com data e fonte, que cai na mesa da sua equipe.</p>
<h3>Como funciona</h3>
<ul>
<li>A tela mostra a situação, o lugar em foco no mapa e <b>2 ou 3 saídas</b>. Cada saída é defendida por um <b>conselheiro</b> com o chapéu e a cor da sua categoria (Diplomacia, Economia, Natureza, Segurança, Pessoas ou Ciência) e vem com um resumo da troca.</li>
<li><b>Não há resposta certa nem errada</b>, e nenhuma saída dá pontos por estar “certa”. Cada uma é uma <b>troca real</b>: ganha aqui e perde ali, agora ou depois, em casa ou no resto do mundo.</li>
<li>Escolhida a saída, a câmera mostra a consequência, os números saltam no painel, a manchete sai no Jornal Mundial e um balão explica o <b>porquê</b> e o <b>conceito</b> que a turma acabou de viver, com um “Você sabia?”.</li>
<li>Alguns efeitos <b>demoram</b> e só chegam no Balanço; outros dependem de sorte, como uma mediação que pode ou não funcionar. Algumas saídas custam 1 CP desta vez.</li>
<li>Um dilema não se repete na mesma partida. Alguns só aparecem para certas potências — o Essequibo e os abrigos de Roraima para o Brasil, as águas do Indo para a Índia, a Rota Marítima do Norte para a Rússia, a devolução de um tesouro colonial para a União Europeia. O momento também pesa no sorteio: com o apoio popular baixo, a promessa eleitoral fácil aparece mais; com armazéns cheios, o pedido de comida para quem passa fome.</li>
</ul>
<h3>Um exemplo: “Mais soja ou mais floresta?” (Brasil)</h3>
<ul>
<li><b>Abrir novas áreas:</b> a economia e os alimentos sobem na hora, mas o desmatamento cresce, o ambiente cai e o planeta esquenta um pouco mais.</li>
<li><b>Produzir mais no mesmo lugar:</b> gasta tecnologia agora, e a economia só melhora no Balanço seguinte — sem derrubar floresta.</li>
<li><b>Moratória e rastreio:</b> o desmatamento cai um quarto, o ambiente e a cooperação mundial sobem, mas a economia perde pontos e parte do eleitorado reclama.</li>
</ul>
<p>Qual é a melhor? Depende do plano da equipe, do momento do mundo e do que cada um valoriza. É isso que a turma discute.</p>
<h3>Como decidir em equipe</h3>
<ul>
<li>Leiam a situação em voz alta e encontrem o lugar no mapa.</li>
<li>Para cada saída, perguntem: <b>quem ganha e quem perde, agora e depois?</b></li>
<li>Escolham a troca que combina com o plano da equipe e digam por quê, numa frase.</li>
<li>Depois, confiram no mapa e no Balanço se o mundo reagiu como vocês esperavam.</li>
</ul>
<p>O computador também decide dilemas: escolhe por sorteio, puxando para o que cada governo mais valoriza, para que nenhuma saída vire “a certa”. Os conteúdos da BNCC estão nas próprias situações: o relatório de 2050 mostra as habilidades que a turma <b>viveu</b> em cada decisão.</p>`,
  },
  {
    id: 'indicadores', titulo: 'Os indicadores da sua nação', icone: '📊',
    html: `
<p>Cada potência tem cinco indicadores, de 0 a 100. Eles são uma aproximação didática de dados reais e contam como vai a sua nação.</p>
<h3>💰 Economia</h3>
<p><b>No mundo real:</b> a força da economia do país — a riqueza produzida (o PIB), o emprego e a renda.</p>
<p><b>Sobe com:</b> comércio mundial aquecido, territórios parceiros, tecnologia, acordos comerciais, exportações e investimentos. Economias emergentes, como Índia e China, tendem a crescer mais rápido. Quem exporta energia (como Rússia, EUA e Brasil) ganha quando ela fica cara.</p>
<p><b>Cai com:</b> dano climático, sanções sofridas, gasto militar muito alto, insegurança, compras caras de comida e energia no mercado e, para quem importa energia, petróleo caro.</p>
<h3>❤️ Bem-estar</h3>
<p><b>No mundo real:</b> parecido com o <b>IDH</b> do PNUD, que junta renda, educação e saúde. Em 2023, o IDH do Brasil era 0,786 (PNUD, relatório de 2025).</p>
<p><b>Sobe com:</b> crescimento econômico e políticas sociais — educação, saúde, combate à fome, adaptação climática.</p>
<p><b>Cai com:</b> dano climático, falta de alimentos e pandemias.</p>
<p>No Brasil, por causa da desigualdade, o crescimento vira bem-estar mais devagar: as políticas sociais fazem mais diferença.</p>
<h3>🌳 Ambiente</h3>
<p><b>No mundo real:</b> a saúde da natureza do país — florestas, rios, ar e biodiversidade.</p>
<p><b>Sobe com:</b> energia limpa, desmatamento zero e direitos de indígenas e quilombolas.</p>
<p><b>Cai com:</b> desmatamento, petróleo, expansão da fronteira agrícola, mineração e um planeta acima de 1,5 °C.</p>
<h3>🛡️ Segurança</h3>
<p><b>No mundo real:</b> o quanto a população e as instituições estão protegidas de ameaças — conflitos, crime organizado, ataques de hackers.</p>
<p><b>Sobe com:</b> defesa, alianças, ciberdefesa e combate ao crime transnacional.</p>
<p><b>Cai com:</b> tensão mundial alta, conflitos fortes em territórios vizinhos e ciberataques. Armar-se demais também custa caro: veja o <b>dilema de segurança</b> em “Ações de governo”.</p>
<h3>🗳️ Apoio popular</h3>
<p><b>No mundo real:</b> a aprovação do governo nas pesquisas de opinião.</p>
<p><b>Sobe e desce</b> junto com a economia, o bem-estar e a segurança, e com medidas populares. Com o tempo, tende a voltar ao nível que o próprio país tinha em 2026 — cada país tem o seu. Nos EUA, por causa da polarização, o apoio despenca mais rápido quando as coisas pioram.</p>
<p><b>Apoio de 70 ou mais:</b> +1 CP por vez. <b>Abaixo de 30:</b> crise política e −1 CP por vez.</p>
<h3>Outros números da ficha</h3>
<ul>
<li><b>⚡ Energia limpa:</b> a porcentagem da energia do país que vem de fontes de baixo carbono (sol, vento, água, biomassa, nuclear). Em 2025, cerca de metade da energia usada no Brasil veio de fontes renováveis (EPE). Sobe com renováveis, nuclear e acordos do clima; cai com petróleo.</li>
<li><b>🏭 Emissões:</b> bilhões de toneladas (Gt) de CO₂ por ano, calculadas a partir da economia, da energia limpa e do desmatamento. Para comparar com justiça, olhe também as emissões <b>por habitante</b> e o <b>histórico</b>: quem emite mais no total nem sempre é quem emite mais por pessoa, nem quem mais emitiu no passado.</li>
<li><b>Vulnerabilidade climática:</b> o quanto o país sofre com secas, cheias e calor. Cresce um pouco a cada mandato se nada for feito; a adaptação climática a reduz.</li>
<li><b>Capacidade militar:</b> fica nos bastidores. Aumenta a segurança, mas pesa na economia e assusta os vizinhos.</li>
</ul>`,
  },
  {
    id: 'mundo', titulo: 'Os indicadores do mundo', icone: '🌐',
    html: `
<p>No topo da tela ficam os números que todas as potências dividem. São eles que decidem se o planeta chega inteiro a 2050.</p>
<h3>🌡️ Temperatura</h3>
<p><b>No mundo real:</b> quanto a Terra está mais quente do que antes da Revolução Industrial. Em 2024, ano que bateu o recorde de calor, a média global ficou 1,60 °C acima do nível pré-industrial, segundo o Copernicus (a OMM calculou 1,55 °C). O Acordo de Paris busca manter o aquecimento bem abaixo de 2 °C, com esforços para limitá-lo a 1,5 °C. A meta é de longo prazo: a ciência olha a média de cerca de 20 anos, não um ano só.</p>
<p><b>Sobe com:</b> as emissões de todas as potências, dos territórios e do transporte internacional. Perto de 2 °C, o aquecimento se acelera sozinho — degelo, florestas morrendo: é a <b>retroalimentação</b>.</p>
<p><b>Atenção:</b> a temperatura quase nunca desce. O que dá para fazer é frear a subida, com energia limpa, desmatamento zero, fundos e acordos do clima e transferência de tecnologia para os países em desenvolvimento.</p>
<p>Cada décimo de grau acima de 1,4 °C tira pontos de economia e de bem-estar de todos — e muito mais de quem é vulnerável.</p>
<p><b>Colapso:</b> {{colapso.temperatura}} °C, o ponto de não retorno.</p>
<h3>⏰ Tensão mundial</h3>
<p><b>No mundo real:</b> o risco de uma grande guerra. O jogo mostra a tensão como o <b>Relógio do Juízo Final</b>, criado em 1947 pelo Boletim dos Cientistas Atômicos: quanto mais perto da meia-noite, maior o perigo. Em janeiro de 2026, o relógio real marcava 85 segundos para a meia-noite, o mais perto da história.</p>
<p><b>Sobe com:</b> sanções, tarifas, ampliação da defesa, bases militares, alianças, conflitos que escalam e muitas armas no mundo.</p>
<p><b>Desce com:</b> mediações de paz, desarmamento, missões de paz, acordos de paz e cooperação forte. Se nada for feito, ela tende a ficar na casa dos 70: o mundo de hoje já é tenso.</p>
<p><b>Colapso:</b> tensão {{colapso.tensao}}, o relógio chegou à meia-noite.</p>
<h3>🚢 Comércio global</h3>
<p><b>No mundo real:</b> o volume de mercadorias e serviços trocados entre os países.</p>
<p><b>Sobe com:</b> acordos de livre-comércio, empresas transnacionais, internet e negociações. <b>Cai com:</b> sanções, tarifas, pandemias e conflitos em rotas estratégicas — os estreitos de Ormuz, Malaca e Taiwan, o Mar Vermelho, os estreitos turcos e os canais de Suez e do Panamá.</p>
<p>Com o comércio fraco, todas as economias crescem menos.</p>
<h3>🕊️ Cooperação internacional</h3>
<p><b>No mundo real:</b> a força da ONU, dos tratados e da confiança entre os países — o <b>multilateralismo</b>.</p>
<p><b>Sobe com:</b> missões diplomáticas, resoluções aprovadas, fundos e acordos, Cúpulas do Clima bem-sucedidas e metas cumpridas. <b>Cai com:</b> vetos, sanções unilaterais, resoluções rejeitadas, fronteiras fechadas, cúpulas fracassadas e promessas descumpridas.</p>
<p>Com cooperação alta, os conflitos esfriam mais rápido, a tensão cede e as mediações ganham credibilidade.</p>
<h3>🧳 Pessoas deslocadas</h3>
<p><b>No mundo real:</b> refugiados, solicitantes de refúgio e deslocados internos — gente forçada a deixar a própria casa. No fim de 2025, o ACNUR contava 117,8 milhões de pessoas deslocadas à força por guerras, violência e perseguições (relatório de 2026). No jogo, quem foge de desastres também entra na conta.</p>
<p><b>Sobe com:</b> conflitos, aquecimento e fronteiras fechadas. <b>Desce com:</b> acolhimento, ajuda humanitária, reconstrução, missões e acordos de paz — e com a volta de parte das pessoas para casa a cada mandato.</p>
<p><b>Colapso:</b> {{colapso.deslocados}} milhões, uma catástrofe humanitária global.</p>
<h3>🛢️ Preço da energia</h3>
<p><b>No mundo real:</b> o preço do petróleo, do gás e da eletricidade. No jogo, 50 é o normal.</p>
<p><b>Sobe com:</b> conflitos em regiões produtoras (Península Arábica, Levante, Irã, Leste Europeu, Venezuela, Norte da África), crises no Estreito de Ormuz e sanções à Rússia. <b>Cai com:</b> mais petróleo explorado e mais energia limpa no mundo.</p>
<p>Energia cara ajuda quem exporta e pesa para quem importa, como a União Europeia, a China e a Índia.</p>`,
  },
  {
    id: 'recursos', titulo: 'Recursos e mercado mundial', icone: '🌾',
    html: `
<p>Nenhum país tem tudo. Cada potência produz e usa quatro recursos, guardados num estoque de até 12 unidades de cada:</p>
<ul>
<li>🌾 <b>Alimentos</b> — grãos, carnes, frutas.</li>
<li>⚡ <b>Energia</b> — petróleo, gás e eletricidade.</li>
<li>💎 <b>Minerais críticos</b> — lítio, cobre, níquel, terras raras: a base de baterias, painéis solares e chips.</li>
<li>💻 <b>Tecnologia</b> — chips, software e pesquisa.</li>
</ul>
<h3>Produzir e consumir</h3>
<p>A cada Balanço, sua potência produz o que o próprio território permite, mais o que os seus <b>territórios parceiros</b> produzem. Depois, consome alimentos e energia. Algumas ações também gastam recursos: a energia renovável, por exemplo, gasta minerais críticos — a transição energética depende deles.</p>
<h3>O mercado mundial (automático)</h3>
<ul>
<li><b>Faltou?</b> O país compra no mercado e paga com pontos de 💰. A energia encarece quando o preço mundial sobe; os alimentos, quando há mais deslocados e mais calor.</li>
<li><b>Sobrou?</b> Acima de 8 unidades, o excedente é vendido (até 3 por Balanço) e vira 💰.</li>
<li><b>Sanções</b> cortam a produção de energia de quem é sancionado e o obrigam a vender pela metade do preço.</li>
</ul>
<h3>🤝 Negociar</h3>
<p>Na sua vez, use <b>Negociar</b> para propor uma troca direta a outra potência — por exemplo, 2 🌾 por 1 💻. Não custa CP. Uma equipe decide na tela; o computador aceita se a troca for vantajosa para ele. Se houver sanções entre os dois países, o comércio fica bloqueado. Cada troca ainda aquece um pouco o comércio global.</p>
<h3>Por que isso importa?</h3>
<p>É a <b>interdependência</b>: a União Europeia precisa de energia, a China de alimentos, quase todos de minerais críticos. Na vida real, o Brasil importa a maior parte dos fertilizantes que usa no campo, e uma guerra do outro lado do mundo pode encarecer a comida aqui. Cada país produz melhor certas coisas (<b>vantagem comparativa</b>), e o comércio deixa todos mais fortes — até alguém fechar a porta.</p>`,
  },
  {
    id: 'territorios', titulo: 'Influência e parcerias', icone: '🧱',
    html: `
<p>Além das seis potências, o mapa tem <b>32 territórios</b> — países e regiões como o Cone Sul, o Sahel, a Península Arábica ou o Japão e a Coreia do Sul — e a <b>Antártida</b>. É um “War” sem guerra: ninguém conquista ninguém. As potências disputam <b>influência</b>. Toque num território para ver a ficha dele, com o “Você sabia?”.</p>
<h3>🧱 Influência</h3>
<p>Cada ponto de influência é um tijolo numa torre com a cor da sua potência (até 10). A torre cresce com missões diplomáticas, comércio, investimento, ajuda, cultura e ciência. E encolhe quando um conflito piora no lugar (todos perdem 1), com eventos como golpes, com o desgaste de vetos na ONU e com a <b>reação soberanista</b>.</p>
<h3>🤝 Parceria</h3>
<p>Um território vira <b>parceiro</b> da sua potência quando a sua influência ali:</p>
<ul>
<li>alcança a <b>resistência</b> do território, que vai de 3 a 7 (3, mais 1 a cada 25 pontos de estabilidade); <b>e</b></li>
<li>fica pelo menos <b>2 tijolos à frente</b> da segunda potência mais influente.</li>
</ul>
<p>Ser parceiro vale muito:</p>
<ul>
<li>o território ganha a cor da sua potência no mapa;</li>
<li>os recursos dele entram na sua produção;</li>
<li>ele vota com você na ONU (a não ser que a pressão ali esteja alta);</li>
<li>sua economia cresce um pouco mais, e o desenvolvimento dele também;</li>
<li>cada parceiro vale <b>+3 no IGI</b>.</li>
</ul>
<h3>🏆 Liderança continental</h3>
<p>Seja parceiro da <b>maioria</b> dos territórios de um continente e ganhe <b>+1 CP em toda vez</b> e <b>+6 no IGI</b>.</p>
<h3>✊ Pressão e soberania</h3>
<p>Influência imposta gera ressentimento. <b>Bases militares</b> (+15 de pressão), <b>obras com dívida</b> no exterior (+10) e <b>mineração</b> em território alheio (+8) aumentam a <b>pressão</b>. A cada Balanço, ela cai 10; se mesmo assim ficar em <b>60 ou mais</b>, acontece a <b>reação soberanista</b>: a população protesta e a potência mais influente ali perde <b>metade</b> da influência. Com pressão alta, o território também fica menos estável e deixa de votar automaticamente com o parceiro.</p>
<p>Na vida real, a <b>soberania</b> — o direito de cada Estado decidir sobre o próprio território — é um princípio central da Carta da ONU. A dependência imposta de fora, mesmo depois da independência, é chamada de <b>neocolonialismo</b>. Por isso a cooperação costuma durar mais do que a imposição.</p>
<h3>🔥 Conflitos e estabilidade</h3>
<p>Alguns territórios começam com conflitos de nível 1 a 3 (3 é guerra aberta). A cada Balanço, um conflito pode piorar — mais provável com tensão mundial alta e estabilidade baixa — ou esfriar — mais provável com cooperação alta, mediações e estabilidade. Conflitos tiram desenvolvimento, geram deslocados e afetam os vizinhos; em rotas de comércio e regiões de petróleo, mexem com a economia do mundo todo.</p>
<p>A <b>estabilidade</b> (0 a 100) mede o quanto o território está calmo e governável; o <b>desenvolvimento</b> (0 a 100) se parece com o IDH. Os dois sobem com paz, investimento e ajuda.</p>
<h3>🧊 Antártida</h3>
<p>Ninguém é dono da Antártida: o <b>Tratado da Antártida</b> (1959) reserva o continente para a paz e a ciência, e o <b>Protocolo de Madri</b> (1991) proíbe a mineração. No jogo, ela não aceita influência, bases nem obras.</p>`,
  },
  {
    id: 'acoes', titulo: 'Ações de governo', icone: '🛠️',
    html: `
<p>Na sua vez, a <b>barra de ações</b> mostra 6 ações sorteadas — uma de cada categoria — e duas que estão sempre lá:</p>
<ul>
<li>🧳 <b>Missão diplomática</b> (1 CP): +2 de influência num território e +1 de cooperação.</li>
<li>🤝 <b>Negociar</b> (sem CP): troca de recursos com outra potência.</li>
</ul>
<p>Não gostou das opções? <b>Trocar as ações</b> custa 1 CP e sorteia outras 6. Cada ação pode ser usada uma vez por vez. Algumas também custam pontos de 💰 ou recursos, e várias pedem um alvo: um território, uma potência ou até três territórios.</p>
<p>Toda ação mostra o <b>porquê</b>: a frase de causa e efeito que liga a decisão ao mundo real. E as ações <b>viram construções</b> no mapa — turbinas, fábricas, embaixadas, tendas, satélites —, que vão contando a história das decisões da turma.</p>
<p>Fique de olho nos <b>efeitos que demoram</b>: educação, pesquisa e obras só aparecem no Balanço, às vezes só no do mandato seguinte. Governar também é plantar para colher depois.</p>
<h3>🤝 Diplomacia</h3>
<p>O poder de convencer e de fazer acordos: embaixadas, cúpulas regionais, cooperação entre países em desenvolvimento (<b>cooperação Sul-Sul</b>), propostas na ONU, alianças e sanções. Por trás: política externa, multilateralismo e o <b>dilema de segurança</b> — a aliança que protege você pode assustar quem ficou de fora. Sanções pressionam um governo, mas também custam caro a quem as aplica.</p>
<h3>💰 Economia e Comércio</h3>
<p>Comércio, investimento e indústria: acordos de livre-comércio, tarifas, obras no exterior, exportação de commodities, política industrial, empresas transnacionais e empréstimos a países em crise. Por trás: globalização, <b>divisão internacional do trabalho</b>, protecionismo, dívida externa e dependência. Quase toda decisão econômica tem ganhadores e perdedores.</p>
<h3>🌱 Natureza e Energia</h3>
<p>A matriz energética e o uso da terra: energia renovável ou nuclear, petróleo e gás, desmatamento zero ou expansão agrícola, minerais críticos, fundos e metas climáticas, adaptação. Por trás: <b>transição energética</b>, Acordo de Paris, justiça climática e a disputa entre lucro rápido e sustentabilidade.</p>
<h3>🛡️ Paz e Segurança</h3>
<p>Proteger o país sem incendiar o mundo: defesa, ciberdefesa, bases no exterior, mediação de paz, reconstrução, combate ao crime transnacional e desarmamento. Por trás: soberania, segurança coletiva, resolução pacífica de conflitos e, de novo, o dilema de segurança: quando um país se arma, o vizinho também se arma. Desarmar no mesmo mandato que outra potência derruba ainda mais a tensão.</p>
<h3>👥 Pessoas e Direitos</h3>
<p>Políticas para gente: acolher refugiados ou fechar fronteiras, ajuda humanitária, educação, saúde, combate à fome e à desigualdade e direitos de povos indígenas e quilombolas. Por trás: <b>direitos humanos</b>, refúgio, desenvolvimento humano e desigualdade.</p>
<h3>💡 Ciência e Informação</h3>
<p>Conhecimento é poder: pesquisa e inovação, combate à desinformação, satélites, internet e cabos submarinos e diplomacia cultural. Por trás: <b>soft power</b> (o poder de atrair pela cultura), soberania digital e as redes que fazem a informação circular.</p>
<h3>🕊️ Mediação de paz</h3>
<p>Mediar um conflito custa 2 CP e depende de <b>credibilidade</b>, não de força. Antes de confirmar, a tela mostra a <b>chance de dar certo</b> e o que pesa nela:</p>
<ul>
<li>ponto de partida: <b>30%</b> (as partes aceitam conversar);</li>
<li><b>+6%</b> por ponto da sua influência no lugar, até +30%: é a confiança construída antes;</li>
<li>a <b>cooperação internacional</b> ajuda quando passa de 45 e atrapalha quando fica abaixo (0,6% por ponto);</li>
<li>a <b>estabilidade</b> do lugar ajuda quando passa de 35 e atrapalha quando fica abaixo (0,4% por ponto);</li>
<li><b>−10%</b> por nível de conflito acima de 1: em guerra aberta, um cessar-fogo é mais difícil;</li>
<li><b>−30%</b> se a sua potência é parte do conflito (em 2026, a Rússia no Leste Europeu e os EUA no Irã, ou quem tem base militar ali) e <b>−10%</b> se é vizinha, com interesses diretos na região.</li>
</ul>
<p>A chance fica sempre entre 5% e 90%. <b>Deu certo:</b> o conflito perde um nível, a tensão mundial cai 5, e você ganha 2 de influência no lugar e 3 de apoio. <b>Não deu:</b> a tensão cai só 1, e você ganha 1 de influência — tentar também aproxima. Duas mediações bem-sucedidas valem o selo da Paz. Na vida real também é assim: um mediador precisa da confiança dos dois lados.</p>`,
  },
  {
    id: 'eventos', titulo: 'Jornal Mundial', icone: '📰',
    html: `
<p>No começo de cada mandato, o <b>Plantão Global</b> entra no ar com uma notícia do <b>Jornal Mundial</b>. A câmera voa até o lugar e o efeito acontece no mapa. Se o mundo estiver em crise — tensão de 80 ou mais, temperatura de 2,0 °C ou mais ou 150 milhões de deslocados ou mais —, saem <b>dois</b> eventos.</p>
<h3>Tipos de evento</h3>
<ul>
<li><b>Clima:</b> ondas de calor, secas, ciclones, enchentes, incêndios, avanço do mar e degelo do Ártico. Ficam mais frequentes e mais fortes quanto mais quente o planeta, e pesam mais sobre os lugares vulneráveis.</li>
<li><b>Crises:</b> petróleo em alta, pandemias, ciberataques, cabos submarinos rompidos, crises alimentares e de dívida, rotas de comércio travadas e ondas de desinformação.</li>
<li><b>Conflitos:</b> golpes, escaladas, testes de mísseis, disputas de território e crises humanitárias. São mais prováveis quando a tensão está alta.</li>
<li><b>Migrações:</b> a acolhida de quem chega e as travessias perigosas de quem foge.</li>
<li><b>Recursos:</b> corridas por lítio e terras raras, disputas pela água de rios e novas fronteiras do petróleo.</li>
<li><b>Política:</b> eleições, protestos por democracia, ondas populistas, a Assembleia Geral da ONU e a voz de indígenas e quilombolas nas decisões sobre o clima.</li>
<li><b>Boas notícias:</b> acordos de paz e de comércio, recordes de energia solar, vacinas compartilhadas e a Olimpíada. Aparecem mais num mundo cooperativo.</li>
</ul>
<h3>Quando a notícia pede uma decisão</h3>
<ul>
<li><b>Votação na ONU:</b> um golpe ou uma escalada pode levar a uma votação de missão de paz; uma pandemia, à de vacinas para todos; um teste de míssil, à de um tratado de desarmamento; uma guerra com fome, à de um fundo humanitário.</li>
<li><b>Pedido de ajuda:</b> cada potência decide quanto doar — alimentos depois de um desastre, energia numa crise da dívida. Quem doa ganha apoio em casa e, se a crise for num território, influência no lugar. Se a meta de doações for atingida, a crise melhora; se não, piora.</li>
<li><b>Decisão de todas as potências:</b> algumas crises pedem que cada equipe escolha, em segredo, uma de 2 ou 3 saídas — de novo, sem resposta certa. As escolhas são reveladas juntas, e cada uma vira manchete com o seu porquê. Hoje pedem decisão a crise no Estreito de Ormuz, a onda de desinformação, os ataques no Mar Vermelho, a tensão no Estreito de Taiwan, as travessias perigosas de migrantes e a disputa pelas terras raras.</li>
</ul>
<h3>Ação coletiva: quando o mundo só muda se vários agirem juntos</h3>
<p>Em algumas dessas crises, o que uma potência faz sozinha muda pouco. Mas, se várias escolherem a mesma saída, o mundo inteiro sente:</p>
<ul>
<li><b>Crise em Ormuz:</b> se 4 ou mais liberarem estoques de petróleo ao mesmo tempo, o preço da energia despenca.</li>
<li><b>Onda de desinformação:</b> se 4 ou mais apostarem em checagem e educação, a mentira é desmontada, a tensão cai e a cooperação sobe. Quem já tinha investido em <b>combate à desinformação</b> não sofre o estrago de ignorar a notícia falsa.</li>
<li><b>Mar Vermelho:</b> se 3 ou mais escoltarem navios juntos, a rota reabre e o comércio mundial se recupera.</li>
<li><b>Estreito de Taiwan:</b> se 4 ou mais pedirem diálogo, a crise esfria e a tensão mundial cai.</li>
</ul>
<p>Conversem antes de escolher: combinar é o que transforma várias decisões soltas numa ação coletiva.</p>
<p>Todo evento traz um <b>“Você sabia?”</b> com um fato real e a fonte. As notícias do jogo são situações possíveis no futuro, inspiradas em fatos reais — não previsões.</p>`,
  },
  {
    id: 'onu', titulo: 'ONU: Assembleia Geral e Conselho de Segurança', icone: '🏛️',
    html: `
<p>Problemas que nenhum país resolve sozinho vão para a <b>ONU</b>, criada em 1945, que em 2026 tinha 193 países-membros. No jogo, uma reunião começa quando alguém usa a ação <b>Propor resolução na ONU</b> (2 CP) ou quando um evento convoca a ONU.</p>
<h3>As resoluções</h3>
<ul>
<li>🪖 <b>Missão de paz</b> (Conselho de Segurança): capacetes azuis num território em conflito. O conflito esfria, a estabilidade sobe e os deslocados diminuem. Se for aprovada, quem votou sim contribui com 1 ponto de 💰.</li>
<li>⛔ <b>Sanções da ONU</b> (Conselho de Segurança): sanções contra uma potência que valem para o mundo todo e pesam bem mais do que as de um país sozinho.</li>
<li>🌡️ <b>Acordo climático global</b> (Assembleia Geral): todos aceleram a energia limpa, e os países mais pobres recebem tecnologia.</li>
<li>📦 <b>Fundo humanitário</b> (Assembleia Geral): comida, água, abrigo e saúde para quem fugiu de guerras e desastres.</li>
<li>🕊️ <b>Tratado de desarmamento</b> (Assembleia Geral): todos reduzem armas, e a tensão cai.</li>
<li>💉 <b>Vacinas para todos</b> (Assembleia Geral): proteção contra pandemias, inclusive para os países mais pobres.</li>
</ul>
<p>Os acordos, fundos e vacinas custam 1 ponto de 💰 a cada potência: cooperar também tem preço.</p>
<h3>Conselho de Segurança</h3>
<p>Decide sobre paz e sanções. No jogo votam as 6 potências e o Reino Unido. Têm <b>poder de veto</b> os EUA, a China, a Rússia, o Reino Unido e a União Europeia, que representa a França. A resolução passa com <b>pelo menos 4 votos sim e nenhum veto</b>. Como na ONU de verdade, o voto “não” de um membro permanente já é um veto; a abstenção não é.</p>
<p>Vetar tem preço: a cooperação mundial cai 3, e quem vetou perde influência em até dois territórios.</p>
<h3>Assembleia Geral</h3>
<p>Decide sobre clima, ajuda humanitária, vacinas e desarmamento. Cada potência tem 1 voto, e cada território também. Os territórios parceiros votam com a sua potência (se a pressão ali não estiver alta); os outros votam pelo próprio interesse — os mais vulneráveis ao clima, por exemplo, apoiam acordos climáticos. Passa por <b>maioria simples</b>: mais votos sim do que não.</p>
<h3>Como votar</h3>
<p>As equipes votam em segredo, uma de cada vez: <b>sim</b>, <b>não</b>, <b>abstenção</b> ou, no Conselho, <b>veto</b>. Depois, os votos são revelados todos juntos. Antes da votação, vale ouvir quem propôs e quem é contra.</p>
<p>Resolução aprovada: os efeitos valem na hora, e cada potência que votou sim avança rumo ao selo de Diplomacia. Resolução rejeitada: a cooperação mundial cai 1.</p>
<h3>Na ONU de verdade</h3>
<p>O Conselho de Segurança tem 15 membros: 5 permanentes, com direito a veto (EUA, Rússia, China, Reino Unido e França), e 10 eleitos para mandatos de dois anos. Uma resolução precisa de 9 votos e de nenhum veto, e as decisões do Conselho podem ser obrigatórias. Na Assembleia Geral, cada país tem um voto, e as resoluções, em geral, são recomendações. O jogo encolheu a sala para caber no telão, mas a lógica do veto é a mesma.</p>`,
  },
  {
    id: 'cop', titulo: 'Cúpula do Clima', icone: '🌡️',
    html: `
<p>Nos mandatos pares, as potências se reúnem na <b>Cúpula do Clima</b>, inspirada nas <b>COPs</b>, as conferências anuais da ONU sobre o clima. A COP30 aconteceu em Belém (PA), em novembro de 2025.</p>
<h3>Como funciona</h3>
<p>Cada potência escolhe em segredo o seu compromisso:</p>
<ul>
<li><b>Alto:</b> +12 de energia limpa e −3 de 💰. Vale 2 pontos na soma.</li>
<li><b>Médio:</b> +6 de energia limpa e −1 de 💰. Vale 1 ponto.</li>
<li><b>Nenhum:</b> nada muda em casa. Vale 0.</li>
</ul>
<p>Os compromissos são revelados juntos. Se a soma chegar a <b>7 pontos</b>, sai um <b>acordo histórico</b>: a cooperação sobe 6, os países em desenvolvimento recebem tecnologia limpa (e passam a emitir menos) e o número de deslocados cai. Se não chegar, a cúpula fracassa e a cooperação cai 3.</p>
<h3>A tragédia dos comuns</h3>
<p>Quem não se compromete economiza agora e ainda aproveita o esforço dos outros. Mas, se todos pensarem assim, o acordo não sai e todos perdem. É a <b>tragédia dos comuns</b>, descrita pelo ecólogo Garrett Hardin em 1968: um recurso de todos — como a atmosfera — tende a se esgotar quando cada um só pensa em si. A cientista política Elinor Ostrom, primeira mulher a ganhar o Nobel de Economia (2009), mostrou que comunidades conseguem cuidar de bens comuns quando criam regras, confiança e fiscalização.</p>
<p>Dica: conversem antes! Promessas públicas, confiança e cobrança são o que tira acordos reais do papel.</p>
<h3>Metas nacionais</h3>
<p>Fora da cúpula, a ação <b>Meta climática ambiciosa</b> funciona como uma <b>NDC</b>, a meta que cada país apresenta no Acordo de Paris: você promete +15 de energia limpa até o próximo Balanço. Cumpriu? Ganha cooperação e apoio. Descumpriu? Perde credibilidade: a cooperação mundial e o seu apoio caem.</p>`,
  },
  {
    id: 'missoes', titulo: 'Missões secretas', icone: '🎯',
    html: `
<p>Nos modos competitivo e em blocos, com a opção ligada pelo professor, cada potência recebe no começo uma <b>missão secreta</b>, sorteada entre as que são possíveis para ela. Só a sua equipe vê: na hora da revelação, a tela avisa qual equipe deve olhar, e o resto da turma vira de costas.</p>
<p>A missão é conferida em <b>2050</b> e vale <b>+12 no IGI</b>. Alguns exemplos:</p>
<ul>
<li><b>Liderança sul-americana:</b> ser parceiro de 3 territórios da América do Sul.</li>
<li><b>Amiga da África:</b> ser parceiro de 3 territórios africanos.</li>
<li><b>Potência verde:</b> chegar a 70% de energia limpa e a 70 de ambiente.</li>
<li><b>Pacificadora:</b> terminar com a tensão mundial abaixo de 55.</li>
<li><b>Mediadora da paz:</b> fazer 2 mediações de paz bem-sucedidas.</li>
<li><b>Diplomata-chefe:</b> propor 2 resoluções que a ONU aprove.</li>
</ul>
<p>As potências do computador também têm missões. Disfarce a sua: se os outros adivinharem, podem atrapalhar. E lembre que nenhuma missão vale nada se o planeta entrar em colapso.</p>`,
  },
  {
    id: 'infiltrado', titulo: 'Agente infiltrado', icone: '🕵️',
    html: `
<p>Opcional no modo <b>Todos pelo planeta</b>, com pelo menos 3 equipes. No começo, cada equipe vê em segredo o seu papel: <b>Diplomata</b> ou <b>Infiltrado</b> (só um). O infiltrado recebe uma <b>agenda oculta</b> que vai contra as Metas 2050:</p>
<ul>
<li><b>Lobby fóssil:</b> temperatura de 2,0 °C ou mais em 2050.</li>
<li><b>Mercador de armas:</b> tensão mundial de 80 ou mais em 2050.</li>
<li><b>Especulador:</b> comércio global de 40 ou menos em 2050.</li>
<li><b>Muralha:</b> 150 milhões de deslocados ou mais em 2050.</li>
</ul>
<p>O infiltrado joga como os outros, mas puxa o mundo, discretamente, na direção da agenda dele. Ser óbvio demais é o jeito mais rápido de ser descoberto!</p>
<h3>🚨 Reunião de emergência</h3>
<p>Desconfiou de alguém? Uma vez por partida, qualquer equipe pode chamar uma reunião de emergência pagando <b>2 CP</b>. A turma discute — com evidências: quem votou contra o quê? quem só explorou petróleo? — e todas as equipes votam em quem acusar. É preciso <b>maioria</b>.</p>
<ul>
<li><b>Era mesmo o infiltrado:</b> ele é exposto, a agenda dele deixa de valer e ele passa a ter 1 CP a menos em cada vez.</li>
<li><b>Era inocente:</b> a equipe acusada injustamente perde 2 CP na próxima vez, e a tensão mundial sobe 5. Desconfiança também custa caro.</li>
<li><b>Sem maioria:</b> ninguém é acusado, e a reunião da partida já foi usada.</li>
</ul>
<h3>Quem vence?</h3>
<p>A turma vence se cumprir pelo menos 4 das 5 Metas 2050, sem colapso, e se a agenda do infiltrado não se cumprir (ou se ele tiver sido exposto). O infiltrado vence se a agenda se cumprir sem que ninguém o descubra.</p>`,
  },
  {
    id: 'placar', titulo: 'Placar: o IGI', icone: '🏆',
    html: `
<p>Nos modos competitivo e em blocos, o placar é o <b>Índice Geografia Irada (IGI)</b>. Todo mundo começa com <b>100</b>. Em 2050, o IGI soma:</p>
<ul>
<li><b>O progresso dos indicadores</b> desde 2026: cada ponto ganho de ❤️ bem-estar vale 2; de 💰 economia, 1,5; de 🌳 ambiente e de 🛡️ segurança, 1; de 🗳️ apoio, 0,5. Se o indicador caiu, desconta.</li>
<li><b>+3</b> por território parceiro e <b>+6</b> por liderança continental.</li>
<li><b>+12</b> pela missão secreta cumprida.</li>
<li><b>+4</b> por selo conquistado.</li>
<li><b>Saúde do planeta:</b> +10 para todos se a temperatura ficar abaixo de 1,8 °C e a tensão abaixo de 50; −10 para todos se a temperatura chegar a 2,0 °C, a tensão a 85 ou os deslocados a 150 milhões.</li>
</ul>
<p>Repare: o bem-estar das pessoas é o que mais pesa. Crescer a economia destruindo todo o resto não costuma vencer.</p>
<h3>Os selos</h3>
<ul>
<li>🌍 <b>Clima:</b> cortar as próprias emissões em 30% em relação a 2026 ou chegar a 70% de energia limpa.</li>
<li>🕊️ <b>Paz:</b> fazer 2 mediações de paz bem-sucedidas.</li>
<li>🤲 <b>Solidariedade:</b> 2 gestos solidários — acolher refugiados, enviar ajuda humanitária ou doar 2 ou mais unidades num pedido de ajuda.</li>
<li>❤️ <b>Desenvolvimento:</b> bem-estar 8 pontos acima do de 2026.</li>
<li>🏛️ <b>Diplomacia:</b> votar sim em 3 resoluções aprovadas na ONU.</li>
</ul>
<p>No modo <b>em blocos</b>, vale a média de IGI das potências de cada bloco. No modo <b>cooperativo</b>, quem decide são as Metas 2050.</p>`,
  },
  {
    id: 'colapso', titulo: 'Colapso global', icone: '⚠️',
    html: `
<p>Se, no fim de qualquer Balanço, o mundo atingir um destes limites, a partida <b>acaba na hora</b> e <b>todos perdem</b>:</p>
<ul>
<li>🌡️ <b>Temperatura</b> de {{colapso.temperatura}} °C ou mais: o planeta passou do ponto de não retorno.</li>
<li>⏰ <b>Tensão</b> {{colapso.tensao}}: o Relógio do Juízo Final chegou à meia-noite.</li>
<li>🧳 <b>{{colapso.deslocados}} milhões de deslocados</b> ou mais: uma catástrofe humanitária global.</li>
</ul>
<p>No colapso não há vencedor — nem a potência mais rica. O relatório final mostra a <b>contribuição de cada uma</b>: quanto emitiu, quanta tensão gerou, quantas vezes ajudou e mediou e que saídas escolheu nos dilemas. É um ótimo ponto de partida para a conversa da turma.</p>
<h3>Sinais de alerta</h3>
<p>Qualquer um destes sinais põe o mundo em crise, e o Jornal Mundial passa a trazer dois eventos por mandato:</p>
<ul>
<li><b>Temperatura de 2,0 °C ou mais:</b> o aquecimento se acelera sozinho e os desastres pioram.</li>
<li><b>Tensão de 80 ou mais:</b> os conflitos escalam com mais facilidade.</li>
<li><b>150 milhões de deslocados ou mais:</b> emergência humanitária.</li>
</ul>
<p>Na vida real, cientistas estudam os <b>pontos de não retorno</b> do clima: limites que, depois de cruzados, fazem um sistema mudar por conta própria, como o derretimento do gelo da Groenlândia ou a perda de partes da Floresta Amazônica. O número exato do jogo é uma simplificação, mas a ideia é real.</p>`,
  },
  {
    id: 'dicas', titulo: 'Dicas de estratégia', icone: '💡',
    html: `
<ul>
<li><b>Nos dilemas, não procure a saída certa.</b> Procure a que combina com o seu plano. Antes de escolher, pensem em quem ganha e quem perde — agora e daqui a um mandato.</li>
<li><b>Plante cedo.</b> Educação e pesquisa demoram, mas rendem até 2050. Deixar para o último mandato é desperdício.</li>
<li><b>Mire na parceria.</b> Concentre influência em poucos territórios, de preferência com os recursos que faltam para você. Parceiro produz, vota e pontua.</li>
<li><b>Influência imposta escorrega.</b> Bases, dívidas e mineração aumentam a pressão: se ela continuar em 60 ou mais depois do Balanço, vem a reação soberanista.</li>
<li><b>Guarde reservas.</b> Comprar comida e energia no mercado em plena crise sai caro. E não deixe a economia fraca demais: as ações mais caras ficam bloqueadas.</li>
<li><b>Credibilidade antes de mediar.</b> Confira a chance na tela. Construa influência no lugar antes, não seja parte do conflito e aproveite quando o mundo estiver mais cooperativo.</li>
<li><b>Combine antes das decisões de todos.</b> Nas crises que pedem a escolha de todas as potências, a ação coletiva só acontece se várias escolherem a mesma saída.</li>
<li><b>Olhe o relógio.</b> Tensão alta deixa todos menos seguros, inclusive você. Às vezes, desarmar junto com outra potência rende mais do que se armar.</li>
<li><b>Combine na Cúpula do Clima.</b> Se ninguém se comprometer, todos pagam o preço do calor — principalmente os mais vulneráveis.</li>
<li><b>Vete com cuidado.</b> O veto protege seus interesses, mas custa cooperação e influência.</li>
<li><b>Desconfie das manchetes.</b> Antes de reagir a uma notícia bombástica, cheque a fonte, a data e o autor.</li>
<li><b>Ninguém vence sozinho num planeta em colapso.</b> Fique de olho nos três limites do mundo.</li>
</ul>`,
  },
  {
    id: 'professor', titulo: 'Para o professor', icone: '📚',
    html: `
<p>O Geografia Irada foi feito para o telão da sala, com um computador e um projetor. Não precisa do celular dos alunos nem de internet: abre direto no navegador. Os conteúdos seguem a <b>BNCC do Ensino Médio</b> (Ciências Humanas e Sociais Aplicadas, com pontes para Ciências da Natureza, Matemática e Linguagens) e trazem exemplos do Brasil e de Santa Catarina.</p>
<p><b>Não há perguntas para responder nem gabarito.</b> A turma aprende vivendo os conteúdos: cada decisão gera uma consequência visível no mapa e nos indicadores, e o jogo explica o porquê com o nome do conceito (“isso foi o dilema de segurança”). A BNCC define os conteúdos que a turma vai viver; ela não vira prova dentro do jogo.</p>
<h3>Uma aula de 50 minutos</h3>
<ul>
<li><b>0 a 5 minutos — preparação:</b> divida a turma em até 6 equipes (uma por potência), escolham nomes e avatares e façam a revelação das missões secretas. Combine papéis dentro de cada equipe: quem lê o dilema, quem cuida do mapa, quem fala na ONU.</li>
<li><b>5 a 35 minutos — partida Rápida</b> (4 mandatos de 6 anos). A cada dilema, a equipe da vez lê a situação em voz alta e diz, numa frase, por que escolheu aquela saída. Em aula dupla, use a partida Aula (6 mandatos) ou a Completa (8).</li>
<li><b>35 a 50 minutos — conversa final:</b> use o relatório de 2050 (gráficos ano a ano, manchetes, dilemas e escolhas de cada equipe, habilidades da BNCC vividas) e as sugestões de debate abaixo. Feche pedindo que cada equipe explique uma decisão que mudou o mundo — e por quê.</li>
</ul>
<p>O jogo salva sozinho a cada mandato: dá para parar e terminar na aula seguinte com <b>Continuar</b>, no mesmo computador e no mesmo navegador.</p>
<h3>Como discutir os dilemas</h3>
<ul>
<li><b>Antes da escolha:</b> peça que a equipe diga, para cada saída, quem ganha e quem perde — em casa e no mundo, agora e depois. Uma frase basta.</li>
<li><b>Depois da consequência:</b> leia o porquê em voz alta e pergunte: “o mundo reagiu como vocês esperavam?”. O mapa e os números que saltaram são a evidência.</li>
<li><b>Avalie o argumento, não a escolha.</b> Não existe saída certa. Um bom argumento usa o conceito, cita um dado do painel ou do “Você sabia?” e leva em conta quem fica do outro lado.</li>
<li><b>Compare governos.</b> O mesmo tipo de dilema pede respostas diferentes ao Brasil e à União Europeia? Por quê? Geografia, economia e história pesam na decisão.</li>
<li><b>Troque de lado.</b> Peça a alguém que defenda a saída que a equipe rejeitou. Quem consegue defender o outro lado entendeu o dilema.</li>
<li><b>Volte ao mundo real.</b> Cada dilema tem data e fonte. Pergunte o que o país de verdade fez e o que aconteceu depois, sem tomar partido.</li>
<li><b>Escreva depois:</b> uma carta da delegação à ONU, um artigo de opinião sobre um dilema vivido ou um “diário do diplomata” com três decisões e suas consequências.</li>
</ul>
<h3>O seu papel na partida</h3>
<p>Você conduz a partida: lê os dilemas (ou pede que a equipe da vez leia), dá a palavra a equipes diferentes, organiza as escolhas secretas nas crises que pedem a decisão de todas as potências e conduz as reuniões da ONU e de emergência. Peça evidências (“o que no mapa mostra isso?”) e cuide do tom: no jogo, como na diplomacia, critica-se a ideia, nunca a pessoa.</p>
<h3>Foco da aula e ajustes</h3>
<p>Nos ajustes, escolha um ou mais temas para o <b>foco da aula</b>: Território e Soberania, Ordem Mundial, Globalização e Economia, Natureza, Clima e Energia, Conflitos e Paz ou Pessoas e Direitos. Os dilemas e os eventos ligados a esses temas passam a sair com muito mais frequência (2,5 vezes mais). Alguns exemplos de dilemas por tema:</p>
<ul>
<li>🗺️ <b>Território e Soberania:</b> base militar no vizinho, Essequibo, Ártico, Rota Marítima do Norte, pastores nômades, Antártida, pesca no alto-mar.</li>
<li>🌐 <b>Ordem Mundial:</b> vetar uma resolução contra um parceiro, sair de um organismo internacional, escolher entre dois polos, sediar uma cúpula, mandar soldados para uma missão de paz, golpe na região.</li>
<li>🚢 <b>Globalização e Economia:</b> tarifa sofrida, proteger a indústria, refinar terras raras, fábrica de chips, robôs no trabalho, primeiro emprego, plataforma que não cumpre a lei, acordo Mercosul–União Europeia.</li>
<li>🌱 <b>Natureza, Clima e Energia:</b> soja ou floresta, minas de carvão, águas do Indo, meta climática, fundo das florestas tropicais, cidade alagada, geoengenharia, lixo eletrônico.</li>
<li>🕊️ <b>Conflitos e Paz:</b> venda de armas, corrida armamentista, resposta a um atentado, cessar-fogo rápido ou paz completa.</li>
<li>👥 <b>Pessoas e Direitos:</b> refugiados na fronteira, abrigos em Roraima, xenofobia, terras indígenas, tesouro colonial, vídeo falso na eleição, censo, promessa eleitoral, surto no vizinho, grãos para quem tem fome.</li>
</ul>
<p>Você também escolhe o número de mandatos, o modo, as missões secretas e, se quiser, um cronômetro para as decisões.</p>
<ul>
<li><b>Turma que está começando:</b> partida Rápida e modo cooperativo.</li>
<li><b>Turma competitiva:</b> modo em blocos, que mistura disputa e cooperação.</li>
<li><b>Para treinar argumentação:</b> antes de cada escolha, dê 30 segundos para a equipe defender a saída em voz alta; nas crises que pedem a decisão de todos, deixe as equipes negociarem antes da escolha secreta.</li>
<li><b>Acessibilidade:</b> o jogo respeita a opção de reduzir movimento do sistema, nunca usa só a cor (sempre há forma ou ícone), oferece lista para tudo o que se escolhe no mapa e permite desligar a música e os efeitos.</li>
</ul>
<h3>Como editar o conteúdo</h3>
<p>Todo o texto do jogo fica na pasta <b>conteudo/</b>, em arquivos que abrem em qualquer editor de texto:</p>
<ul>
<li><b>dilemas.js</b>: os dilemas de governo. O modelo de cada dilema está no começo do arquivo.</li>
<li><b>eventos.js</b>: as notícias do Jornal Mundial, inclusive as crises que pedem a decisão de todas as potências.</li>
<li><b>fichas.js</b> e <b>territorios.js</b>: os textos das potências e dos territórios.</li>
<li><b>manual.js</b> (este manual e o glossário) e <b>bncc.js</b> (o mapa da BNCC).</li>
</ul>
<p>O jeito mais seguro é copiar um dilema ou um evento que já existe e trocar os textos. Conte a situação com data e fonte e confira se cada saída ganha numa coisa e perde em outra: se uma saída for melhor em tudo, ela vira resposta certa, e o dilema deixa de ser dilema. Use aspas curvas “ ” dentro dos textos e mantenha as vírgulas entre os itens. Se algo quebrar, a tela inicial avisa. Quem tiver o Node instalado pode conferir tudo com <b>node ferramentas/validar-conteudo.mjs</b>. Os números do jogo (custos, efeitos e limites) ficam em <b>politicas.js</b>, <b>potencias.js</b>, <b>resolucoes.js</b> e <b>js/simulacao.js</b>: mexa só se quiser rebalancear e rode <b>node teste-simulacao.mjs</b> depois (ele também avisa se o computador escolhe sempre a mesma saída de um dilema).</p>
<h3>Sugestões de debate</h3>
<ul>
<li>Teve um dilema em que nenhuma saída parecia boa? O que vocês precisariam saber para decidir melhor?</li>
<li>Por que é tão difícil cooperar no clima, mesmo quando todos sabem do risco?</li>
<li>Numa crise que pedia ação coletiva, por que algumas potências não acompanharam as outras?</li>
<li>Quem deve pagar mais pela transição energética: quem mais emitiu no passado ou quem mais emite hoje?</li>
<li>A influência conquistada com bases militares dura? E a conquistada com ajuda e cultura?</li>
<li>O veto no Conselho de Segurança é justo? Que reformas já foram propostas, inclusive pelo Brasil?</li>
<li>Fechar fronteiras resolve uma crise de refugiados? O que acontece com as pessoas?</li>
<li>Que decisões da partida ajudaram ou prejudicaram o Brasil e Santa Catarina?</li>
<li>O que o jogo simplifica demais? Que parte do mundo real ficou de fora?</li>
</ul>
<h3>Cuidados</h3>
<p>O jogo não toma partido em disputas políticas, e os dilemas não têm lado certo: evite apresentar uma saída como a correta, inclusive nos temas brasileiros. As notícias são situações possíveis no futuro, não previsões, e os números das potências são aproximações didáticas. Conflitos reais aparecem com foco humanitário. Se um tema tocar alguém da turma de perto — migração, guerra, enchentes no Sul —, acolha e abra espaço para a conversa.</p>
<p>O mapa completo das habilidades da BNCC está na aba <b>BNCC</b>, e o relatório de 2050 mostra quais habilidades a turma viveu nas ações, nos eventos e nos dilemas da partida.</p>`,
  },
];

// Glossário de geopolítica do Ensino Médio (em ordem alfabética)
const GLOSSARIO = [
  { termo: 'Ação coletiva', definicao: 'Situação em que todos ganham se agirem juntos, mas cada um, sozinho, prefere deixar o custo para os outros. Por isso, cortar emissões, combater uma pandemia ou proteger uma rota marítima depende de acordos e de confiança entre os países.' },
  { termo: 'Acordo de Paris', definicao: 'Tratado do clima adotado em 2015, na COP21. Os países buscam manter o aquecimento global bem abaixo de 2 °C, com esforços para 1,5 °C; cada um define a própria meta (NDC) e deve torná-la mais ambiciosa a cada cinco anos.' },
  { termo: 'Amazônia Azul', definicao: 'Nome dado pela Marinha às águas jurisdicionais e à plataforma continental do Brasil: cerca de 5,7 milhões de km² reivindicados no Atlântico Sul. Ali estão pesca, petróleo, minérios, rotas de navegação e cabos submarinos.' },
  { termo: 'Apátrida', definicao: 'Pessoa que não é reconhecida como cidadã por nenhum país e, por isso, pode ficar sem documentos e sem acesso a direitos básicos, como escola, saúde e trabalho formal.' },
  { termo: 'Assembleia Geral da ONU', definicao: 'Órgão em que todos os países-membros da ONU têm um voto cada. Debate os grandes temas globais; suas resoluções, em geral, são recomendações, não ordens.' },
  { termo: 'Autodeterminação dos povos', definicao: 'Princípio segundo o qual cada povo pode decidir livremente seu destino político. Pode entrar em choque com a integridade territorial dos Estados, como nos casos de separatismo.' },
  { termo: 'Autoritarismo', definicao: 'Regime político que concentra o poder, limita a oposição, a imprensa e as liberdades e não aceita a troca livre de governantes por eleições.' },
  { termo: 'Bloco econômico', definicao: 'Grupo de países que reduzem barreiras ao comércio entre si. Pode ser zona de livre-comércio, união aduaneira (com tarifa externa comum), mercado comum ou união econômica e monetária, como a zona do euro.' },
  { termo: 'BRICS', definicao: 'Agrupamento político-diplomático de economias emergentes criado por Brasil, Rússia, Índia e China e ampliado com a África do Sul, com Egito, Etiópia, Irã e Emirados Árabes Unidos (2024) e com a Indonésia (2025). A Arábia Saudita aparece na lista do grupo, mas não confirmou a adesão. Não é bloco comercial nem aliança militar.' },
  { termo: 'Cadeia global de valor', definicao: 'As etapas da fabricação de um produto (pesquisa, peças, montagem, transporte, marca) espalhadas por vários países. O maior lucro costuma ficar com quem controla a tecnologia e a marca.' },
  { termo: 'Cessar-fogo', definicao: 'Acordo para suspender os combates. É diferente de um acordo de paz, que trata das causas do conflito e de como os lados vão conviver.' },
  { termo: 'Commodity', definicao: 'Produto básico e padronizado, como soja, minério de ferro ou petróleo, com preço definido no mercado internacional. Depender da exportação de commodities deixa a economia sujeita às oscilações desse preço.' },
  { termo: 'Conselho de Segurança', definicao: 'Órgão da ONU responsável pela paz e pela segurança internacionais. Tem 15 membros: 5 permanentes com direito a veto (EUA, Rússia, China, Reino Unido e França) e 10 eleitos para mandatos de dois anos.' },
  { termo: 'Cooperação Sul-Sul', definicao: 'Parcerias entre países em desenvolvimento para trocar experiências em saúde, agricultura, educação e tecnologia, como as do Brasil com países da África e da América Latina.' },
  { termo: 'COP', definicao: 'Conferência das Partes: a reunião anual dos países da Convenção-Quadro da ONU sobre Mudança do Clima, de 1992. A COP30 aconteceu em Belém (PA), em novembro de 2025.' },
  { termo: 'Corte Internacional de Justiça', definicao: 'Tribunal da ONU, em Haia, que julga disputas entre Estados e dá pareceres sobre o direito internacional. Não confunda com o Tribunal Penal Internacional, que julga pessoas.' },
  { termo: 'Crime organizado transnacional', definicao: 'Grupos que cometem crimes graves com fins de lucro em mais de um país, como tráfico de drogas, de armas e de pessoas e lavagem de dinheiro. A Convenção de Palermo (ONU, 2000) organiza a cooperação contra eles.' },
  { termo: 'Crise humanitária', definicao: 'Situação em que muitas pessoas perdem ao mesmo tempo o acesso a comida, água, saúde e segurança, em geral por guerras ou desastres, e precisam de ajuda externa.' },
  { termo: 'Democracia', definicao: 'Regime em que o poder vem do povo, com eleições livres e periódicas, liberdades civis, imprensa livre, separação de poderes, respeito às minorias e alternância no governo.' },
  { termo: 'Desenvolvimento sustentável', definicao: 'Desenvolvimento que atende às necessidades de hoje sem comprometer as das próximas gerações, equilibrando economia, sociedade e ambiente (Relatório Brundtland, ONU, 1987).' },
  { termo: 'Desinformação', definicao: 'Conteúdo falso ou enganoso criado ou espalhado de propósito para enganar, lucrar ou obter vantagem política. Checar a fonte, a data e o autor é a melhor defesa.' },
  { termo: 'Deslocado interno', definicao: 'Pessoa forçada a deixar a própria casa, por conflito, violência ou desastre, que continua dentro do próprio país. Como não cruzou uma fronteira, não é considerada refugiada.' },
  { termo: 'Dilema de segurança', definicao: 'Situação em que um país se arma para se proteger e o vizinho, sentindo-se ameaçado, também se arma. No fim, todos podem acabar menos seguros.' },
  { termo: 'Direitos humanos', definicao: 'Direitos que todas as pessoas têm por serem humanas, sem distinção: vida, liberdade, igualdade, educação, saúde, moradia, entre outros. São universais e dependem uns dos outros.' },
  { termo: 'Dissuasão', definicao: 'Estratégia de evitar um ataque mostrando que a resposta seria muito pior para quem atacasse. Para seus defensores, a dissuasão nuclear evita guerras entre grandes potências; para os críticos, alimenta corridas armamentistas e o risco de catástrofe.' },
  { termo: 'DIT (divisão internacional do trabalho)', definicao: 'A especialização dos países no comércio mundial: quem produz e exporta o quê. Na DIT clássica, uns vendiam matérias-primas e outros, produtos industrializados; hoje, as etapas da produção se espalham pelo mundo.' },
  { termo: 'Dívida externa', definicao: 'Dinheiro que um país, seu governo ou suas empresas devem a credores estrangeiros. Em crises, os empréstimos de socorro costumam vir com exigências de cortes de gastos.' },
  { termo: 'DUDH', definicao: 'Declaração Universal dos Direitos Humanos, adotada pela Assembleia Geral da ONU em 10 de dezembro de 1948. Seus 30 artigos afirmam que todas as pessoas nascem livres e iguais em dignidade e direitos.' },
  { termo: 'Efeito estufa', definicao: 'Fenômeno natural em que gases da atmosfera retêm parte do calor e mantêm a Terra habitável. O aquecimento global atual vem da intensificação desse efeito pelas emissões humanas, como as da queima de combustíveis fósseis.' },
  { termo: 'Estado', definicao: 'Organização política que exerce poder soberano sobre uma população num território, por meio de instituições permanentes (leis, governo, forças armadas). Governos mudam; o Estado permanece.' },
  { termo: 'FMI e Banco Mundial', definicao: 'Instituições criadas em 1944, em Bretton Woods. O FMI cuida da estabilidade financeira e empresta a países em crise, em geral com condições; o Banco Mundial financia projetos de desenvolvimento. Nos dois, o peso do voto depende da cota de cada país.' },
  { termo: 'Fronteira', definicao: 'Zona de contato em torno do limite entre dois territórios, marcada por trocas, controles e, às vezes, conflitos. O limite é a linha definida por tratados; a fronteira é o espaço vivido ao redor dela.' },
  { termo: 'G20', definicao: 'Fórum que reúne 19 países de economias grandes e emergentes, a União Europeia e a União Africana para coordenar a economia global. O Brasil presidiu o grupo em 2024.' },
  { termo: 'Gargalo logístico', definicao: 'Passagem estreita por onde circula boa parte do comércio mundial, como os estreitos de Ormuz e de Malaca e os canais de Suez e do Panamá. Um bloqueio ali afeta o mundo inteiro.' },
  { termo: 'Geopolítica', definicao: 'Estudo das relações entre poder, território e recursos na política mundial: quem controla o quê, por quê e com quais consequências.' },
  { termo: 'Globalização', definicao: 'Intensificação das trocas de mercadorias, capitais, pessoas, informações e culturas em escala mundial, impulsionada por transportes, telecomunicações e acordos entre países.' },
  { termo: 'Guerra Fria', definicao: 'Disputa entre EUA e União Soviética, de 1947 a 1991, por áreas de influência, com corrida armamentista e espacial e guerras indiretas, mas sem confronto militar direto entre as duas superpotências.' },
  { termo: 'Hegemonia', definicao: 'Liderança de um país que combina força com a capacidade de definir regras, instituições e valores aceitos pelos outros.' },
  { termo: 'IDH', definicao: 'Índice de Desenvolvimento Humano, do PNUD. Vai de 0 a 1 e combina saúde (expectativa de vida), educação (anos de estudo) e renda. Em 2023, o IDH do Brasil era 0,786 (relatório de 2025).' },
  { termo: 'Índice de Gini', definicao: 'Mede a desigualdade de renda de 0 (todos ganham igual) a 1 (uma só pessoa concentra toda a renda). Pelos dados do Banco Mundial, o Brasil está entre os países mais desiguais do mundo.' },
  { termo: 'Interdependência', definicao: 'Situação em que os países dependem uns dos outros para obter energia, alimentos, tecnologia e mercados. Aumenta os ganhos da cooperação e também os prejuízos das crises.' },
  { termo: 'Justiça climática', definicao: 'Ideia de que quem menos contribuiu para a crise do clima, como os países pobres e as ilhas do Pacífico, costuma sofrer mais com ela, e de que quem mais emitiu deve fazer mais.' },
  { termo: 'Matriz energética', definicao: 'O conjunto das fontes de energia que um país usa em transportes, indústrias e casas. A matriz elétrica é só a parte usada para gerar eletricidade. No Brasil, ela é bem mais renovável: em 2025, 86,8% da eletricidade e 49,4% de toda a energia vieram de fontes renováveis (EPE).' },
  { termo: 'Mediação', definicao: 'Negociação conduzida por um terceiro aceito pelos dois lados de um conflito, que ajuda a chegar a um cessar-fogo ou a um acordo. Funciona quando o mediador tem a confiança das partes; foi assim que a ONU e a Turquia mediaram o acordo de exportação de grãos da Ucrânia em 2022.' },
  { termo: 'Mercosul', definicao: 'Mercado Comum do Sul, criado em 1991 pelo Tratado de Assunção por Argentina, Brasil, Paraguai e Uruguai. É uma união aduaneira em construção; a Bolívia virou membro pleno em 2024, e a Venezuela está suspensa desde 2016.' },
  { termo: 'Minerais críticos', definicao: 'Minerais essenciais para tecnologias estratégicas, como baterias, painéis solares, chips e turbinas eólicas, cujo fornecimento corre risco. Exemplos: lítio, cobalto, níquel e terras raras.' },
  { termo: 'Missão de paz', definicao: 'Operação da ONU, aprovada pelo Conselho de Segurança, que envia capacetes azuis — militares e policiais cedidos pelos países — para proteger civis e ajudar a manter um cessar-fogo. A ONU não tem exército próprio.' },
  { termo: 'Mitigação e adaptação', definicao: 'As duas frentes contra a crise do clima. Mitigar é reduzir as emissões (energia limpa, fim do desmatamento); adaptar é conviver com os impactos que já não dá para evitar (diques, cisternas, alertas de desastre).' },
  { termo: 'Multilateralismo', definicao: 'Decidir em conjunto, entre muitos países, com regras comuns, em organismos como a ONU e a OMC.' },
  { termo: 'Multipolaridade', definicao: 'Ordem mundial com vários polos de poder (como EUA, China, União Europeia, Rússia e Índia), alianças mais flexíveis e disputas regionais.' },
  { termo: 'Nação', definicao: 'Comunidade de pessoas que se reconhecem como um povo por compartilharem história, cultura, língua ou projeto político. Pode existir sem Estado próprio, como os curdos.' },
  { termo: 'NDC', definicao: 'Contribuição Nacionalmente Determinada: a meta que cada país apresenta no Acordo de Paris, dizendo quanto vai cortar das suas emissões e como vai se adaptar.' },
  { termo: 'Neocolonialismo', definicao: 'Dependência econômica, financeira, tecnológica ou militar que continua depois da independência de um país e o mantém sob influência de potências estrangeiras.' },
  { termo: 'ODS', definicao: 'Os 17 Objetivos de Desenvolvimento Sustentável, com 169 metas, adotados pela ONU em 2015 na Agenda 2030: acabar com a pobreza e a fome, proteger o planeta e garantir paz e prosperidade.' },
  { termo: 'OMC', definicao: 'Organização Mundial do Comércio, criada em 1995, com sede em Genebra. Define as regras do comércio entre os países e julga disputas comerciais.' },
  { termo: 'OMS', definicao: 'Organização Mundial da Saúde, agência da ONU criada em 1948. Coordena a resposta a epidemias e define normas de saúde, mas não manda nos países.' },
  { termo: 'ONU', definicao: 'Organização das Nações Unidas, criada em 1945, depois da Segunda Guerra Mundial, para manter a paz e promover a cooperação entre os países. Em 2026, tinha 193 países-membros.' },
  { termo: 'Ordem mundial', definicao: 'O arranjo de poder entre os países num período: quem lidera, quais regras valem e como os conflitos são administrados. Foi bipolar na Guerra Fria; hoje, muitos a descrevem como multipolar.' },
  { termo: 'OTAN', definicao: 'Organização do Tratado do Atlântico Norte: aliança militar criada em 1949 por países da América do Norte e da Europa, em que um ataque a um membro é considerado ataque a todos. Em 2024, chegou a 32 membros.' },
  { termo: 'Populismo', definicao: 'Estilo político que divide a sociedade entre um “povo puro” e uma “elite corrupta” e apresenta um líder como a voz direta do povo. Existe tanto à direita quanto à esquerda.' },
  { termo: 'Protecionismo', definicao: 'Uso de tarifas, cotas e outras barreiras para proteger produtores nacionais da concorrência estrangeira. Pode proteger empregos no curto prazo, mas encarece produtos e provoca retaliações.' },
  { termo: 'Quilombo', definicao: 'Na história, comunidade formada sobretudo por pessoas que fugiam da escravidão e resistiam a ela. Hoje, as comunidades quilombolas são grupos com trajetória histórica própria e ancestralidade negra ligada a essa resistência; a Constituição de 1988 (ADCT, art. 68) garante a elas a propriedade definitiva das terras que ocupam.' },
  { termo: 'Refugiado', definicao: 'Pessoa que deixou seu país por fundado temor de perseguição (por raça, religião, nacionalidade, grupo social ou opinião política) ou, pela lei brasileira de 1997, por grave e generalizada violação de direitos humanos. Não pode ser devolvida ao perigo.' },
  { termo: 'Sanções econômicas', definicao: 'Restrições ao comércio, a investimentos e a operações financeiras com um país para pressionar seu governo. Também custam caro a quem sanciona e podem atingir a população comum.' },
  { termo: 'Segurança alimentar', definicao: 'Quando todas as pessoas têm acesso, o tempo todo, a comida suficiente, segura e nutritiva (FAO). Em 2025, a FAO anunciou que o Brasil havia saído do Mapa da Fome.' },
  { termo: 'Separatismo', definicao: 'Movimento que busca separar uma região de um Estado para criar um novo país ou se unir a outro. Escócia, Catalunha e Quebec são exemplos de regiões com movimentos desse tipo.' },
  { termo: 'Soberania', definicao: 'Poder supremo do Estado sobre o próprio território e sua independência em relação aos outros Estados. É um princípio central da Carta da ONU.' },
  { termo: 'Soberania digital', definicao: 'Capacidade de um país e de sua sociedade de controlar os próprios dados, as redes e as regras do ambiente digital, como a regulação das plataformas.' },
  { termo: 'Soft power', definicao: 'Poder brando: a capacidade de atrair e influenciar pela cultura, pelos valores e pela diplomacia, sem usar a força nem o dinheiro. O oposto é o hard power, feito de armas e sanções.' },
  { termo: 'Sul Global', definicao: 'Expressão para os países em desenvolvimento, muitos com passado colonial. Não segue o hemisfério: a Austrália fica no Sul e não faz parte dele; a Índia fica no Norte e faz.' },
  { termo: 'Terra indígena', definicao: 'Terra tradicionalmente ocupada por povos indígenas. Pela Constituição de 1988 (arts. 20 e 231), pertence à União, com posse permanente e uso exclusivo das comunidades. Segundo o MapBiomas, as terras indígenas estão entre as áreas mais preservadas do Brasil.' },
  { termo: 'Território', definicao: 'Porção do espaço apropriada e controlada por um grupo ou por um Estado, ligada a poder, identidade e recursos. O território de um país inclui solo, subsolo, águas, mar territorial e espaço aéreo.' },
  { termo: 'Terrorismo', definicao: 'Uso ou ameaça de violência, em geral contra civis, para espalhar medo e pressionar governos ou sociedades em nome de objetivos políticos, religiosos ou ideológicos. Não há uma definição única aceita por todos os países na ONU.' },
  { termo: 'TNP', definicao: 'Tratado de Não Proliferação de Armas Nucleares, de 1968. Reconhece cinco países com armas nucleares; os demais membros se comprometem a não tê-las. Prevê negociações de desarmamento e garante o uso pacífico da energia nuclear. O Brasil aderiu em 1998.' },
  { termo: 'Tragédia dos comuns', definicao: 'Quando um recurso é de todos, cada um tende a usá-lo ao máximo, e o recurso se esgota. Descrita por Garrett Hardin em 1968, explica por que acordos, regras e fiscalização são necessários para proteger bens comuns.' },
  { termo: 'Transição energética', definicao: 'Troca gradual dos combustíveis fósseis (carvão, petróleo e gás) por fontes de baixo carbono, como sol, vento e água, junto com mais eficiência e eletrificação.' },
  { termo: 'Transnacional', definicao: 'Empresa com sede num país e fábricas, escritórios ou lojas em vários outros. Leva investimentos e empregos, mas busca custos baixos e pode mudar a produção de lugar.' },
  { termo: 'Tratado da Antártida', definicao: 'Acordo de 1959 que reserva a Antártida para a paz e a ciência e congela as reivindicações de território. O Protocolo de Madri, de 1991, proibiu a mineração. O Brasil mantém lá a Estação Antártica Comandante Ferraz.' },
  { termo: 'Vantagem comparativa', definicao: 'Ideia de que cada país ganha ao se especializar no que produz com menor custo relativo e trocar com os outros. Ajuda a explicar o comércio internacional.' },
  { termo: 'Veto', definicao: 'Poder de cada membro permanente do Conselho de Segurança (EUA, Rússia, China, Reino Unido e França) de barrar sozinho uma resolução. Basta votar não; a abstenção não é veto.' },
  { termo: 'Xenofobia', definicao: 'Aversão, discriminação ou hostilidade contra estrangeiros ou contra pessoas vistas como “de fora”.' },
  { termo: 'Zona Econômica Exclusiva', definicao: 'Faixa de mar de até 200 milhas náuticas (cerca de 370 km) a partir da costa, onde o país controla a pesca, o petróleo e os minérios, segundo a Convenção da ONU sobre o Direito do Mar (1982).' },
];
