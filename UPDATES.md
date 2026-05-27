# Melhorias Futuras — Nexus Land

> Documento de ideias e melhorias planejadas para o jogo atual.
> Baseado na experiência acumulada e no que funcionou (ou não) no projeto.

---

## 1. Conceito Expandido

Tower defense 2D sci-fi com estética neon. O jogador defende um núcleo de energia contra ondas de inimigos alienígenas/mecânicos. Sem herói controlável — a agência do jogador vem de **5 habilidades ativas** usadas durante a partida.

**Diferenciais planejados:**
- Torres com **especialização de comportamento** no upgrade final (não só stats)
- **Modificadores aleatórios** nos inimigos — o mesmo inimigo é diferente a cada wave
- **Habilidades do jogador** como foco estratégico
- Sinergias explícitas entre torres e habilidades

**Escopo da primeira entrega completa:**
- 5 torres
- 5 habilidades do jogador
- 10 tipos de inimigos
- 1 capítulo com 10 mapas

---

## 2. Torres — 5 Torres, 2 Caminhos + Nó Final

### Estrutura de upgrade de cada torre

```
[Torre Base]
├── [A1] → [A2] → [A3]
│                      ↘
│                        [NÓ FINAL: escolha A ou B — muda o comportamento]
└── [B1] → [B2] → [B3] ↗
```

- Caminhos A e B são independentes — o jogador pode investir em qualquer ordem
- O **Nó Final** exige todos os 3 nós de pelo menos UM caminho completo para ser desbloqueado
- Ao escolher o Nó Final, a torre muda de comportamento **de forma permanente naquela run**
- Custo dos nós: 20 → 40 → 80 moedas (in-run). Nó Final: 150 moedas

### Regras de balanceamento

- **Cooldown tem piso por torre** — upgrades de velocidade jamais vão abaixo do piso:
  - Rail: piso 0.15s | Nova: piso 0.9s | Ice: piso 0.6s | Sniper: piso 1.8s | Tesla: piso 0.5s
- **DPS efetivo ≠ DPS bruto** — pierce, chain e AoE multiplicam DPS real. Custo deve refletir isso.
- **Torres de controle (Ice) custam menos** — se custarem igual às de dano, o jogador nunca compra.
- **Torre mais cara não é necessariamente melhor** — situação define qual é a certa.
- Snapshot dos stats base ao criar a torre. Upgrades sempre partem do base, nunca do valor atual (evita stacking bugs).

### As 5 Torres

---

#### RAIL — Cadência alta, pierce
*Nicho: destruir grupos de inimigos fracos*
- **Custo base:** 70 | **Proj:** linear, velocidade alta
- **Caminho A (Velocidade):** cooldown −0.04s por nó
- **Caminho B (Pierce):** +1 inimigo atravessado por nó
- **Nó Final A — Minigun:** cadência triplicada, sem pierce, dano por tiro reduzido 40%
- **Nó Final B — Railgun:** hitscan que atravessa a linha inteira do mapa, cooldown 2.5s, dano alto

---

#### ICE — Slow, controle de área
*Nicho: reduzir velocidade, amplificar dano de outras torres*
- **Custo base:** 65 | **Proj:** lento, aplica slow ao acertar
- **Caminho A (Slow):** +10% intensidade do slow por nó (cap 90%)
- **Caminho B (Área):** +12px de raio AoE por nó
- **Nó Final A — Campo Gelado:** em vez de projétil, emite aura contínua de slow ao redor da torre (raio = alcance)
- **Nó Final B — Cryo Burst:** ao matar um inimigo congelado, ele explode causando dano em área nos vizinhos

> **Sinergia explícita:** Inimigos com slow ativo tomam +30% de dano da Nova.

---

#### SNIPER — Alcance máximo, dano alto
*Nicho: eliminar alvos prioritários e tanques*
- **Custo base:** 90 | **Proj:** hitscan, sem limite de alcance já na base
- **Caminho A (Alcance/Dano):** +20 range e +5 dano por nó
- **Caminho B (Especial):** +10% chance de ignorar escudo por nó
- **Nó Final A — Artilharia:** vira morteiro, dispara projétil de AoE no inimigo mais distante, sem alcance limite
- **Nó Final B — Disruptor:** cada acerto aplica stun de 1.5s no alvo (cooldown alto: 3.5s)

---

#### NOVA — AoE, burn (dano ao longo do tempo)
*Nicho: grupos densos, inimigos com escudo, burn acumulado*
- **Custo base:** 160 | **Proj:** arco que explode ao impactar
- **Caminho A (Explosão):** +10px raio AoE e +5 dano por nó
- **Caminho B (Burn):** +2 dps de burn e +1s duração por nó
- **Nó Final A — Inferno:** ao explodir, deixa chão em chamas por 6s — inimigos que passam tomam burn constante
- **Nó Final B — Cluster:** explosão se divide em 5 bomblets menores que caem em área maior

---

#### TESLA — Chain lightning, controle por stun
*Nicho: grupos médios, inimigos com armadura, stun de suporte*
- **Custo base:** 110 | **Proj:** elétrico, encadeia entre inimigos próximos
- **Caminho A (Chain):** +1 alvo encadeado por nó (começa em 2)
- **Caminho B (Stun):** +15% chance de stun por nó e +0.3s de stun
- **Nó Final A — Tempestade:** atinge todos os inimigos no alcance simultaneamente (sem limite de chain)
- **Nó Final B — Sobrecarga:** single target, cooldown alto (4s), dano massivo + stun garantido de 3s

> **Sinergia explícita:** Tesla ignora a armadura do inimigo Armored. Única torre que o faz.

---

## 3. Habilidades do Jogador — 5 Habilidades + Árvore Global

Substituem o herói. O jogador ativa manualmente com cooldown. São melhoradas pela **árvore de habilidades persistente** (comprada com estrelas entre partidas).

### Estrutura da árvore de cada habilidade

```
[Nó 1: melhora básica] → [Nó 2: melhora básica] → [Nó 3: melhora significativa] → [Nó Final: muda comportamento]
```

- Custo: 10 → 20 → 40 → 80 estrelas por habilidade
- 5 habilidades × 4 nós = **20 nós totais** na árvore de habilidades
- Decisão real: estrelas gastas em habilidades não vão para torres (mesma moeda)

---

#### 🚀 MÍSSIL
*Clica em área da pista. Após 1.5s de delay visual, impacta com AoE.*
- Cooldown base: 30s
- Nó 1: +60% dano
- Nó 2: +50% raio de impacto
- Nó 3: cooldown −10s
- **Nó Final A — Duplo:** dispara 2 mísseis em sequência com 0.8s de intervalo
- **Nó Final B — Guiado:** míssil persegue o inimigo com maior HP na tela, impacto garante +50% dano

---

#### 🧊 ARMADILHA DE GELO
*Clica na pista. Cria zona que aplica slow de 70% por 8s.*
- Cooldown base: 25s
- Nó 1: +4s de duração
- Nó 2: +80% tamanho da área
- Nó 3: cooldown −8s
- **Nó Final A — Congelamento:** inimigos ficam completamente parados por 3s ao entrar
- **Nó Final B — Campo de Dano:** armadilha também causa 8 dano/s enquanto ativa

> **Sinergia explícita:** Armadilha de Gelo + Nova = explosão causa +30% dano em inimigos congelados.

---

#### 🤖 DRONE DE COMBATE
*Lança drone autônomo que patrulha a pista atacando inimigos próximos por 20s.*
- Cooldown base: 45s
- Nó 1: drone com +80% HP
- Nó 2: drone com +50% dano
- Nó 3: duração +15s
- **Nó Final A — Enxame:** lança 2 drones simultaneamente
- **Nó Final B — Kamikaze:** drone explode ao morrer ou ao fim do timer, causando AoE pesado

---

#### ⚡ SOBRECARGA
*Clica em uma torre. Ela dispara 2× mais rápido por 10s.*
- Cooldown base: 35s
- Nó 1: +6s de duração
- Nó 2: também adiciona +30% de dano durante sobrecarga
- Nó 3: cooldown −12s
- **Nó Final A — Em Área:** afeta a torre clicada + todas as torres num raio de 120px
- **Nó Final B — Modo Crítico:** durante sobrecarga, dano da torre sempre é crítico (2× dano)

---

#### 🛡️ PULSO DEFENSIVO
*Global. Todos os inimigos na tela ficam 50% mais lentos por 4s.*
- Cooldown base: 50s
- Nó 1: +4s de duração
- Nó 2: também causa 15 dano em todos os inimigos afetados
- Nó 3: cooldown −15s
- **Nó Final A — Escudo do Core:** além do slow, core fica invulnerável durante toda a duração
- **Nó Final B — Pulso Ofensivo:** slow vira stun total por 2.5s (todos os inimigos parados)

---

## 4. Inimigos — 10 Tipos + Modificadores Aleatórios

### Filosofia de design dos inimigos

- Cada inimigo tem **um gimmick principal** — uma coisa que o torna diferente
- O jogador deve reconhecer o gimmick visualmente antes de ler qualquer texto
- Modificadores são camadas adicionais, nunca o único diferencial de um inimigo

### Os 10 Tipos Base

| # | Nome | HP base | Velocidade | Gimmick principal |
|---|---|---|---|---|
| 1 | **Drone** | 12 | Alta | Fraco, vem em grupos de 6–8 |
| 2 | **Brute** | 120 | Baixa | HP alto, dano pesado no core |
| 3 | **Specter** | 35 | Média | Fica invisível 1.5s a cada 4s — Ice e Tesla revelam |
| 4 | **Splitter** | 50 | Média | Ao morrer, spawna 2 Drones menores |
| 5 | **Healer** | 30 | Baixa | Regenera 8 HP/s nos inimigos dentro de 80px |
| 6 | **Armored** | 80 | Média-baixa | Armadura reduz 60% do dano — Tesla ignora |
| 7 | **Charger** | 45 | Baixa→Alta | Começa lento, acelera até 3× ao longo do path |
| 8 | **Carrier** | 60 | Muito baixa | Spawna 1 Drone a cada 7s enquanto vivo |
| 9 | **Phantom** | 40 | Alta | Atravessa soldados/bloqueios sem parar |
| 10 | **Colossus** | 600 | Muito baixa | Boss — regenera 15 HP/s, imune a slow, aparece em boss waves |

### Scaling de HP por wave

```
HP final = baseHp + (hpPerWave × waveNumber)
```

Calibrar `hpPerWave` para que o jogador PRECISE de upgrades, mas não sinta impossível.

### Sistema de Modificadores — Probabilidade Aleatória

Ao spawnar, cada inimigo rola a chance de receber um modificador. **Máximo 1 modificador** por inimigo nas waves 1–6. A partir da wave 7, chance de receber 2 modificadores.

| Modificador | Efeito | Imunidade gerada | Chance base | Disponível a partir de |
|---|---|---|---|---|
| **Escudo Azul** | +20 HP de escudo | Rail enquanto ativo | 18% | Wave 2 |
| **Escudo Dourado** | +50 HP de escudo | Rail enquanto ativo | 8% | Wave 5 |
| **Velocidade** | +80% speed | Ice (slow) | 16% | Wave 3 |
| **Invisível** | Invisível até levar dano | — | 10% | Wave 4 |
| **Reforçado** | +60% HP máximo | — | 14% | Wave 2 |
| **Regeneração** | +10 HP/s | — | 10% | Wave 5 |
| **Blink** | Invulnerável 0.5s a cada 2s | — | 8% | Wave 6 |

**Probabilidade cresce por wave:**
- Wave 1–3: 15% chance global de receber qualquer modificador
- Wave 4–6: 30%
- Wave 7–9: 45%
- Wave 10+: 55%, com chance de 2 modificadores simultâneos

---

## 5. Economia

### Duas moedas, responsabilidades separadas

| Moeda | Como ganha | Como gasta |
|---|---|---|
| **Moedas** (in-run) | Matando inimigos + bonus por wave | Torres, upgrades de torre, Nó Final |
| **Estrelas** (persistente) | Completando waves e mapas | Árvore de torres (global), Árvore de habilidades (global) |

**Decisão real:** estrelas são escassas. Investir em melhorar Torres globalmente OU melhorar Habilidades globalmente é uma escolha que define o estilo de jogo do jogador.

### Valores de referência

- Moedas iniciais: 150
- Reward por inimigo: 5 (Drone) a 80 (Colossus)
- Bonus wave completa: 30 moedas
- Vender torre: 70% do total investido (incluindo upgrades)
- Estrelas por wave: 2
- Bonus mapa completo: 35 estrelas
- Bonus boss wave: 8 estrelas

### Regras anti-exploit

- Venda de torre retorna 70%, nunca 100% — evita farming de posicionamento
- Reposicionamento de torre: 3 trocas por mapa (recurso finito, não monetário)
- Nó Final é irreversível na run — incentiva planejamento

---

## 6. Progressão Persistente — Skill Tree Global

Duas árvores separadas, compradas com estrelas:

```
ÁRVORE DE TORRES (por torre)       ÁRVORE DE HABILIDADES (por habilidade)
├── Rail (10 nós)                  ├── Míssil (4 nós)
├── Ice (10 nós)                   ├── Armadilha de Gelo (4 nós)
├── Sniper (10 nós)                ├── Drone de Combate (4 nós)
├── Nova (10 nós)                  ├── Sobrecarga (4 nós)
└── Tesla (10 nós)                 └── Pulso Defensivo (4 nós)
                                   
Total: 50 nós de torres            Total: 20 nós de habilidades
```

**O que salvar (localStorage):**
- Mapas completos por ID
- Estrelas totais acumuladas
- Estado das duas árvores (quais nós foram comprados)
- Progresso do capítulo

**Bug crítico a evitar:**
Eventos de "mapa completo" e "wave completa" podem disparar mais de uma vez. Usar uma flag de estado (`alreadyFired`, `state = "victory"`) para garantir que estrelas são concedidas **uma única vez** por evento.

---

## 7. Composição das Waves

O designer define o **tipo e quantidade** de inimigos por wave. O sistema aplica modificadores aleatoriamente.

```js
// Exemplo de definição de wave
const waves = [
  { enemies: [["drone", 6]], boss: false },                          // Wave 1
  { enemies: [["drone", 4], ["brute", 1]], boss: false },            // Wave 2
  { enemies: [["drone", 6], ["splitter", 2]], boss: false },         // Wave 3
  // ...
  { enemies: [["drone", 8], ["armored", 2], ["carrier", 1]],
    boss: true, bossType: "colossus" },                              // Wave 10
];
```

Isso separa: o designer controla a **curva de dificuldade**, o sistema de modificadores garante a **variação** e replayability.

---

## 8. Mapas — 1 Capítulo, 10 Mapas

Cada mapa introduz ou enfatiza um elemento. Não são só visuais diferentes — são desafios de design diferentes.

| Mapa | Gancho do design | Novidade introduzida |
|---|---|---|
| 1 | Path único e reto, muitos slots | Tutorial: Rail e Ice |
| 2 | Path em curva, menos slots | Brute: precisa de Sniper |
| 3 | Dois paths convergindo | Splitter: requer AoE |
| 4 | Path longo e sinuoso | Healer: priorização de alvos |
| 5 | Slots em posições não óbvias | Primeiros modificadores aparecem |
| 6 | Path curto e reto (difícil) | Armored: introduz Tesla |
| 7 | Dois pontos de entrada | Carrier: gestão de ameaças múltiplas |
| 8 | Obstáculos bloqueando linha de tiro | Specter e Phantom: invisibilidade |
| 9 | Poucos slots, path agressivo | Todos os modificadores ativos |
| 10 | Mapa final: 3 entradas, boss wave | Colossus + composição completa |

**Regras de level design:**
- Posicionar slots **manualmente** — nunca gerar automaticamente
- **Validar** que nenhum slot está sobre o path antes de publicar
- Path curto = mapa mais difícil (menos tempo de fogo das torres)
- `coreHp` variável por mapa — mapas finais podem ter core com menos HP para aumentar tensão
- Primeiro delay antes da wave 1: **15s** mínimo para o jogador posicionar torres

---

## 9. Sinergias Explícitas

Sinergias não são acidentais — são parte do design e devem ser comunicadas ao jogador na UI.

| Combinação | Efeito |
|---|---|
| Ice slow + Nova | Inimigos com slow tomam +30% dano da explosão Nova |
| Tesla + Armored | Tesla é a única torre que ignora armadura do Armored |
| Armadilha de Gelo + Nova | Congelados pela habilidade recebem +30% dano de AoE |
| Sobrecarga + Sniper/Tesla | Amplifica torres de alto impacto, não as de spray |
| Ice Campo Gelado + Míssil Guiado | Míssil guiado prioriza o inimigo parado no campo — dano garantido |

**Como implementar:** ao calcular dano, o sistema verifica tags no inimigo (`hasSlow`, `isFrozen`, etc.) e aplica multiplicadores. Simples de adicionar e poderoso de usar.

---

## 10. UI / UX — Decisões de Design

### O que já funciona e deve ser mantido
- **Painel de torre contextual** (aparece ao clicar na torre, some ao clicar fora) — não ocupa tela
- **Preview de range** ao passar mouse sobre slot vazio — feedback imediato antes de comprar
- **Tab de stats ao vivo** no painel da torre — jogadores adoram ver números (DPS, slow%, pierce)
- **Wave dots na top bar** — progresso visual imediato da wave atual
- **Botão "Iniciar wave"** antes do timer acabar — jogadores confiantes não querem esperar
- **Velocidade 1× / 2× / pause** — controle de tempo é essencial em TD
- **Floating texts** ("+5 ◈", "-3 CORE") — feedback de evento sem ocupar UI

### O que evitar
- Múltiplos sistemas usando `mouse.clicked` sem consumir o clique → ações em cascata indesejadas
- Texto muito junto de outros textos sem calcular tamanho antes — sobrepõe e fica ilegível

### Barra de habilidades (a implementar)
```
[Míssil  ▣][Gelo  ▣][Drone ▣][Sobrc ▣][Pulso ▣]
  30s          25s       45s      35s       50s
```
- Ícone + nome curto + cooldown restante
- Brilha quando disponível, acinzentado durante cooldown
- Clique ativa modo de mirar (para habilidades que precisam de alvo no mapa)

---

## 11. Lições Aprendidas — O que Fazer Diferente

1. **Definir a identidade visual antes de codar** — arte placeholder desde o dia 1, mesmo que feia. É mais fácil codar com referência visual do que imaginar.
2. **Áudio desde cedo** — adicionar sons depois exige revisitar cada sistema. Criar um `AudioManager` centralizado no início e plugar os sons quando existirem.
3. **Mapas no papel antes de implementar** — desenhar o path e posicionar slots no papel evita retrabalho de validação.
4. **Playtest com estranhos o quanto antes** — o dev fica cego para a dificuldade. O que parece óbvio para quem fez é invisível para quem está jogando pela primeira vez.
5. **Um sistema por vez, testável isoladamente** — não começar a wave sem ter o enemy funcionando. Não começar upgrades sem ter a torre funcionando.

---

*Este documento cobre o escopo de primeira entrega completa. Capítulos futuros, novos inimigos e torres podem ser adicionados sem mudar a arquitetura base — essa é a prioridade do design.*
