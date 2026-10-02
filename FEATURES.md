# CS2 Config Tools — Features e experiência integrada

> Este documento registra a visão funcional de longo prazo do **CS2 Config Tools**. Ele **não substitui** `PROJECT_VISION.md`, `docs/architecture.md`, `docs/planning/implementation-plan.md`, `docs/planning/roadmap.md` ou `docs/planning/status.md`.
>
> As features descritas aqui são **aditivas** ao que já existe e ao que está em desenvolvimento. Elas não autorizam pular fases, reescrever componentes estáveis sem necessidade, duplicar fontes de verdade ou antecipar builders antes de parser, registry, análise, escrita segura e preservação de fonte estarem prontos.
>
> A ordem de implementação continua sendo definida pelo plano incremental. Este arquivo responde principalmente a: **“como todas as capacidades do produto devem se encontrar em uma experiência única, coerente e útil para a comunidade de CS2?”**

---

## 1. Visão de produto

O **CS2 Config Tools** deve evoluir de uma extensão de linguagem para uma **bancada de configuração do Counter-Strike 2 dentro do VS Code**.

A extensão deve permitir que um jogador:

- entenda uma CFG que já possui;
- descubra por que ela não funciona;
- veja binds em teclado e mouse;
- edite uma CFG com segurança;
- crie uma nova CFG a partir de templates;
- monte aliases sem memorizar sintaxe;
- configure mira, radar, vídeo, binds, áudio e outros grupos de forma visual;
- aplique o resultado diretamente em uma CFG existente ou apenas copie os comandos gerados;
- compare o que está salvo pelo jogo com o que sua `autoexec.cfg` tenta impor;
- acompanhe mudanças relevantes após atualizações do CS2;
- navegar por vários arquivos relacionados por `exec`;
- gerar um relatório compartilhável para pedir ajuda no Discord, Reddit, GitHub ou fóruns.

O objetivo não é criar um “launcher gamer” nem um painel cheio de cards. O produto deve continuar parecendo **ferramenta de desenvolvimento nativa do VS Code**, com UI limpa, técnica e previsível.

### Princípio central

> **Significado humano primeiro. Configuração raw sempre acessível. Complexidade aparece conforme é útil, sem separar o produto em “Simple Mode” e “Advanced Mode”.**

Exemplo:

```text
[ C ]   Flashbang
        slot7
```

O jogador menos técnico entende “C = Flashbang”. O jogador experiente continua vendo `slot7`.

Ao abrir detalhes:

```text
Selected input

C
Flashbang
slot7

Defined at
binds.cfg:70

Raw bind
bind "c" "slot7"
```

Há **uma interface**, com profundidade progressiva.

---

## 2. O produto como sistema único

Todas as features devem se encontrar em algum nível. Nenhum builder deve existir como uma ilha.

```text
                    CS2 CONFIG TOOLS
                           │
                           ▼
                 CS2 Configuration Hub
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    Game CFG files    Steam userdata    Command data
          │                │                │
          │                │                │
          └──────────┬─────┴──────┬─────────┘
                     │            │
                     ▼            ▼
              Unified models   Provenance
                     │
      ┌──────────────┼───────────────────────────┐
      │              │                           │
      ▼              ▼                           ▼
 Understand       Diagnose                    Create/Edit
      │              │                           │
 Hover          Config Doctor                Autoexec Builder
 Completion     Execution Trace              Bind Editor
 Explorer       Health Check                 Alias Builder
 Docs           File Map                     Crosshair
                Compatibility                Radar
                Diff                         Practice
                                             Video
```

A regra é simples:

**o que uma feature produz deve poder ser consumido por outra, sem copiar regras ou inventar semântica paralela.**

---

## 3. Status e implementação incremental

Este documento usa quatro estados conceituais:

- **Implementado** — já existe no projeto e foi integrado ao fluxo atual;
- **Em evolução** — existe, mas ainda está sendo refinado;
- **Planejado** — faz parte da direção do produto, porém depende de fases anteriores;
- **Exploratório** — ideia com potencial, mas que exige validação técnica antes de entrar no plano incremental.

O estado real sempre deve ser confirmado em `docs/planning/status.md`.

### Regra de dependência

Antes de implementar qualquer feature planejada:

1. verificar o plano incremental atual;
2. verificar dependências arquiteturais;
3. reutilizar os modelos e serviços existentes;
4. preservar comportamento já testado;
5. não introduzir escrita destrutiva sem preview, backup e confirmação;
6. não marcar metadados do CS2 como “verificados” sem evidência adequada.

---

# PARTE I — CS2 CONFIGURATION HUB

## 4. CS2 Configuration Hub

### Implementado e próximo incremento

O Hub já oferece pasta CFG, detecção/conexão independente de userdata e inspeção de vídeo. O incremento atual refina nomes, gravidades, categorias e fontes recolhíveis, integra conexão/recuperação nas telas de configurações salvas e abre vídeo/controles no editor de texto. O **Command Explorer** está funcional na Home e em Ferramentas: busca no registry, alternância normal/completo, documentação compartilhada e cópia do nome.

O próximo passo dependente continua sendo fortalecer validação e escrita segura antes de editores visuais de vídeo/builders. O resumo permanece de CFGs; um estado global CFG + userdata não é afirmado. Modelos completos de controles e preferências salvas continuam pendentes.

### Incremento anterior

A Home prioriza CFGs do jogador e arquivos não classificados, recolhe nomes típicos do jogo por heurística e concentra atalhos em uma única região. Fontes de configuração conectam a pasta de CFGs e Steam userdata independentemente. A página de vídeo lê cs2_video.txt, mantém valores literais e deriva resolução/proporção/frequência. Escrita de vídeo, outros domínios userdata e builders continuam planejados.

### Recorte histórico da entrada do Hub

O Hub possui um fluxo único de conexão local para descobrir a pasta do jogo e o perfil Steam, com autorização conjunta, além de remoção individual de CFG para a Lixeira com confirmação. Não exige login ou credenciais Steam.

O health check textual implementado agrupa achados, informa gravidade e linhas de origem e explica os efeitos não resolvidos. Uma página visual de Health Check continua planejada.

O Hub atual reúne Home, conexão manual/detecção de pasta, arquivos CFG, mapa de binds somente leitura, health check e criação de CFG vazia. O menu apresenta somente essas capacidades funcionais. Leitura, escrita e formatação continuam no editor de texto com os providers existentes.

Nesse recorte inicial, builders, Game Settings, Config Doctor, File Map e Command Explorer ficavam fora da navegação. O incremento atual descrito acima registra o avanço implementado. A Home compõe renderizadores de ferramentas, resumo, ações rápidas e lista de arquivos; análise, acesso a arquivos e comandos continuam nos serviços compartilhados. A preparação não conclui a análise multiarquivo nem gera uma distribuição. O estado e a validação ficam em [status](docs/planning/status.md).

O Hub é o ponto central de entrada da extensão.

Ele não deve ser um dashboard inflado. Sua função é responder rapidamente:

- o CS2 foi encontrado?
- quais diretórios relevantes estão conectados?
- quais CFGs existem?
- existem problemas importantes?
- quais ações são possíveis agora?

### Estrutura conceitual

```text
CS2 Config Tools

✓ Counter-Strike 2 detected
✓ Game CFG folder connected
✓ Steam userdata profile connected

CONFIGURATION

Game CFGs
6 files · 78 binds · 0 critical issues

User settings
Video · Controls · Crosshair · Radar · Gameplay

Quick actions
Open autoexec
Visual Bind Map
Diagnose Config
Create CFG
Backup Settings
```

### Navegação na Activity Bar / Side Bar

```text
CS2 CONFIG TOOLS

Home

Configuration
├─ Game CFGs
│  ├─ autoexec.cfg
│  ├─ practice.cfg
│  ├─ binds.cfg
│  └─ aliases.cfg
│
├─ Game Settings
│  ├─ Controls
│  ├─ Video
│  ├─ Crosshair
│  ├─ Radar
│  ├─ Audio
│  └─ Gameplay
│
└─ Tools
   ├─ Visual Bind Map
   ├─ Config Doctor
   ├─ Command Explorer
   ├─ Create CFG
   └─ Backup / Compare
```

A sidebar deve ser navegação. Interfaces maiores devem abrir na área de editor do VS Code.

---

## 5. Descoberta da instalação e diretórios

A extensão não deve assumir um único caminho de instalação.

No Windows, um exemplo válido pode ser:

```text
D:\SteamLibrary\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg
```

O diretório de dados por usuário pode estar em algo como:

```text
C:\Program Files (x86)\Steam\userdata\<STEAM_ID>\730\local\cfg
```

Esses caminhos são exemplos, não constantes.

### Fluxo inicial

```text
Set up CS2 Config Tools

Detected:
✓ Counter-Strike 2 installation
✓ Game CFG directory
✓ Steam userdata directory

Detected CS2 profiles: 2

[ Continue ]
[ Choose manually ]
```

### Consentimento explícito de produto

Mesmo quando o VS Code tecnicamente permite acesso ao filesystem, o usuário deve entender o que será lido e alterado.

```text
CS2 Config Tools will use this folder to:

• read CFG files
• analyze settings and binds
• create files when requested
• edit files only after explicit user actions

No file is modified automatically.

[ Allow this folder ]
```

### Política

```text
Read after connection
        ↓
automatic analysis is allowed

Write
        ↓
requires explicit user action
        ↓
preview / diff when relevant
        ↓
backup for sensitive writes
```

---

## 6. Perfis Steam e múltiplos usuários

`Steam\userdata` pode conter vários IDs.

A extensão deve suportar seleção explícita do perfil quando necessário.

```text
Detected CS2 userdata profiles

● 259744443
  Last modified: today

○ 493820992
  Last modified: 4 months ago
```

Não inferir identidade pessoal apenas pelo número quando não houver evidência confiável.

Depois de escolhido, o perfil pode ser lembrado nas configurações da extensão.

---

# PARTE II — GAME CFG WORKSPACE

## 7. Workspace das CFGs do jogo

O diretório `game/csgo/cfg` deve funcionar como um workspace especializado.

A extensão pode listar arquivos `.cfg` e mostrar informações rápidas:

```text
CONFIG FILES

✓ autoexec.cfg       42 binds
ℹ practice.cfg       practice / sv_cheats
⚠ binds.cfg          1 reassignment
  aliases.cfg        8 aliases
```

Esses estados só devem aparecer quando derivados de análise real.

### Ações contextuais por arquivo

```text
autoexec.cfg

Open as text
Visual Bind Map
Inspect Config
Diagnose Config
Edit Visually
Compare
```

O Bind Map deixa de ser uma feature isolada e passa a ser uma visão contextual de qualquer CFG analisável.

---

## 8. Criar CFG

A ação `New CFG` deve abrir um fluxo simples e extensível.

```text
Create CFG

Type
○ Empty CFG
○ Autoexec
○ Practice Config
○ Bind Config
○ Alias Config
○ Custom

File name
myconfig.cfg

[ Create ]
```

Os templates não devem fingir ser “melhor configuração”, “best FPS” ou “pro settings”. Devem ser descritos pelo propósito.

---

## 9. Autoexec Builder

Feature central de criação.

### Quando não existe `autoexec.cfg`

```text
Create Autoexec

Start from
○ Basic template
○ Empty
○ Import current CFG

[ Continue ]
```

O **Basic template** deve usar somente comandos revisados/permitidos para o escopo em que o template foi validado.

### Quando já existe

```text
autoexec.cfg already exists

[ Edit existing ]
[ Create a new file ]
[ Create backup + replace ]
[ Cancel ]
```

Nunca sobrescrever silenciosamente.

### Estrutura visual futura

```text
Autoexec Builder

Navigation         Editor                     Generated CFG

Keyboard           [ visual controls ]        bind "x" "slot8"
Mouse                                          cl_radar_scale "0.45"
Buy Binds
Crosshair
Radar
Audio
HUD
Viewmodel
Gameplay
Advanced
```

A UI não deve construir strings arbitrariamente. Ela trabalha com modelos estruturados e o serializer comum gera o texto.

---

## 10. Aplicar, copiar ou salvar — contrato comum entre builders

**Toda feature de geração deve usar o mesmo contrato de saída.**

Exemplo: usuário monta uma mira.

Ao terminar:

```text
Crosshair ready

[ Apply to autoexec.cfg ]
[ Apply to another CFG... ]
[ Create crosshair.cfg ]
[ Copy commands ]
[ Open raw preview ]
```

Isso vale para:

- Crosshair Builder;
- Radar Builder;
- Viewmodel Builder;
- Alias Builder;
- Bind Editor;
- Practice Builder;
- Audio / HUD / Gameplay quando existirem.

### Diagrama

```text
Builder
   │
   ▼
Structured change set
   │
   ├──► Preview human diff
   ├──► Preview raw diff
   │
   └──► Destination
           ├─ autoexec.cfg
           ├─ another CFG
           ├─ new CFG
           └─ clipboard
```

Esse padrão é um dos elementos que deixa o produto “redondo”.

---

# PARTE III — VISUALIZAÇÃO E EDIÇÃO

## 11. Visual Bind Map

Implementado em desenvolvimento: teclado com escala fixa e rolagem local, mouse com cinco botões integrados e controles para botões/roda, inspector abaixo e identidade de categoria compartilhada. A composição foi revisada no Extension Development Host em três larguras nos temas claro e escuro. Veja o [registro visual](docs/planning/bind-map-visual-refinement.md). Edição visual permanece planejada.

**Em evolução / parcialmente implementado.**

Objetivos:

- teclado ANSI em SVG;
- mouse em SVG;
- proporções físicas reconhecíveis;
- numpad;
- filtros de categoria e estado;
- inspector do input selecionado;
- origem e histórico;
- conflitos e incerteza;
- navegação para fonte;
- reutilização dos mesmos componentes no futuro editor.

### Regra de escala

O teclado é um objeto técnico, não uma imagem responsiva comum.

Em tela estreita:

```text
┌──────────────────────────────┐
│ [ESC][F1][F2][F3] ...       │
│ [TAB][Q ][W ][E ] ...       │
│                              │
│ ←──── horizontal scroll ───→ │
└──────────────────────────────┘
```

Não encolher indefinidamente até os labels ficarem ilegíveis.

### Categorias

Exemplos:

- Movement;
- Weapons;
- Grenades;
- Communication;
- Buy;
- Utility;
- Interface;
- Custom / Unknown.

Cada categoria pode possuir uma cor discreta e consistente.

```text
● Movement
● Weapons
● Grenades
```

A cor deve aparecer de forma coerente em:

- filtro;
- teclado;
- mouse;
- lista de binds;
- inspector;
- editor visual futuro.

### Lista literal

Evitar:

```text
w · +forward
```

Preferir:

```text
[ W ]      Move forward
           +forward

[ SPACE ]  Jump
           +jump
```

### Inspector

```text
Selected input

C
Flashbang
slot7

Category
Grenades

Defined at
binds.cfg:70

[ Open source ]

Raw bind
bind "c" "slot7"
```

Histórico só deve dominar a interface quando houver mais de uma atribuição ou quando explicar um rebind/effective state.

---

## 12. Bind Editor

O Bind Map deve ser projetado para evoluir naturalmente para edição, sem duplicar o layout.

```text
Select key
    ↓
Inspect current bind
    ↓
Edit
    ↓
Choose category/action
    ↓
Preview
    ↓
Apply
```

Exemplo:

```text
Selected key
P

Current
Global Chat
messagemode

[ Edit ]
```

Depois:

```text
Communication

○ Global Chat
○ Team Chat
○ Voice Chat
○ Player Ping
○ Custom command
```

### Reassignment

```text
P is already assigned

Current
Global Chat
messagemode

New
Buy AWP
buy awp

[ Replace ]
[ Cancel ]
```

A análise deve diferenciar:

- repetição idêntica;
- reassignment;
- assignment histórico;
- assignment efetivo.

---

## 13. Mouse Bind Editor

Mesma arquitetura do teclado.

Controles previstos:

- MOUSE1;
- MOUSE2;
- MOUSE3;
- MOUSE4;
- MOUSE5;
- MWHEELUP;
- MWHEELDOWN.

O mouse SVG não deve ser decorativo: deve ser um componente de input reutilizável.

---

## 14. Buy Bind Builder

Uso natural do numpad e outras teclas.

```text
NUM2

CT
M4A1-S / M4A4

T
AK-47

Generated
bind "kp_2" "buy m4a1; buy ak47"
```

Suportar sequências com vários itens quando válidas.

A UI deve usar catálogo estruturado de ações/itens, nunca uma lista paralela hardcoded sem fonte compartilhada.

---

# PARTE IV — BUILDERS DE CONFIGURAÇÃO

## 15. Crosshair Builder

A mira é uma feature ideal para integrar visual, raw CFG e destino de aplicação.

### Layout conceitual

```text
Crosshair

Preview
[ visual crosshair ]

Style           [ ... ]
Length          [ ... ]
Thickness       [ ... ]
Gap             [ ... ]
Color           [ ... ]
Opacity         [ ... ]
Outline         [ ... ]
Dot             [ ... ]
T shape         [ ... ]
Recoil behavior [ ... ]

Generated commands
...

[ Apply to autoexec.cfg ]
[ Create crosshair.cfg ]
[ Copy commands ]
```

Somente comandos atuais do registry devem alimentar o builder.

Se a semântica de um valor ainda não estiver verificada, a UI não deve inventar labels ou equivalências.

---

## 16. Radar Builder

```text
Radar

Rotate with player       [✓]
Always centered          [ ]
Radar scale              0.45
HUD radar scale          1.00
Icon scale               0.60
Square with scoreboard   [✓]

Generated CFG
cl_radar_rotate "1"
...
```

Mesmas opções de saída:

- aplicar à autoexec;
- outro arquivo;
- `radar.cfg` novo;
- copiar comandos.

---

## 17. Viewmodel Builder

Controles previstos:

- FOV;
- offset X;
- offset Y;
- offset Z;
- handedness quando aplicável.

Ranges e defaults devem vir do registry com proveniência.

---

## 18. Practice Config Builder

```text
Practice Config

Server
☑ sv_cheats
☑ Long rounds
☑ Buy anywhere
☑ Infinite money

Practice
☑ Infinite ammo
☑ Grenade trajectory
☑ Bullet impacts
☑ Noclip
☑ Rethrow grenade
☑ Remove smoke

Bots
☑ Place bot
☑ Freeze bots
☑ Disable shooting

Bindings
ALT  Noclip
F1   Place bot
F7   Rethrow grenade
...
```

Saída típica:

```text
practice.cfg
```

Com preview completo antes de salvar.

Comandos exclusivos de treino devem permanecer claramente classificados como practice/local/private server e não serem confundidos com configuração competitiva comum.

---

## 19. Alias Builder

```text
Create Alias

Name
practice_bots_freeze

Actions
1. Freeze bots
2. Disable bot shooting

Generated
alias "practice_bots_freeze" "bot_stop 1; bot_dont_shoot 1"

[ Add to autoexec.cfg ]
[ Add to aliases.cfg ]
[ Create new CFG ]
[ Copy ]
```

Futuro:

- reorder de comandos;
- referência a aliases existentes;
- detecção de alias ausente;
- ciclos;
- alias não utilizado;
- edição raw contextual.

Não implementar lógica complexa de alias antes do analisador suportá-la com segurança.

---

# PARTE V — CURRENT GAME SETTINGS / STEAM USERDATA

## 20. Current Game Settings

A área **Game Settings** representa configurações persistidas pelo CS2 para um perfil Steam selecionado.

Ela não substitui as CFGs executáveis. É uma segunda fonte de estado.

```text
CONFIGS
├─ autoexec.cfg
├─ practice.cfg
└─ binds.cfg

GAME SETTINGS
├─ Controls
├─ Video
├─ Crosshair
├─ Radar
├─ Audio
└─ Gameplay
```

### Fontes potenciais

Dentro de `Steam\userdata\<STEAM_ID>\730\local\cfg` podem existir arquivos como:

- `cs2_video.txt`;
- arquivos `cs2_user_convars_*.vcfg`;
- arquivos `cs2_user_keys_*.vcfg`;
- outros arquivos geridos pelo jogo.

**A semântica e segurança de escrita de cada arquivo devem ser validadas separadamente antes de habilitar edição.**

---

## 21. Video Settings

`cs2_video.txt` é um primeiro candidato forte porque possui significado visual claro.

Um arquivo pode conter valores como:

```text
setting.defaultres
setting.defaultresheight
setting.refreshrate_numerator
setting.refreshrate_denominator
setting.fullscreen
setting.mat_vsync
setting.msaa_samples
...
```

A UI não deve apresentar o arquivo cru como experiência principal.

### Exemplo

```text
Video Settings

DISPLAY
Resolution        1280 × 960
Aspect ratio      4:3
Display mode      Fullscreen
Refresh rate      74.973 Hz

ADVANCED VIDEO
V-Sync            Off
MSAA              None
Shadow quality    Low
Texture detail    Low
...
```

Um refresh rate armazenado como numerador/denominador pode ser apresentado como valor derivado, preservando os campos originais nos detalhes.

### Classificação de propriedades

A UI precisa distinguir:

```text
User configurable
Derived / composite
Game-managed / system metadata
```

Exemplos de metadata possivelmente gerida pelo jogo/hardware:

```text
VendorID
DeviceID
Version
Autoconfig
knowndevice
```

Essas chaves não devem virar controles editáveis automaticamente.

---

## 22. Video Settings Registry

Não tratar `cs2_video.txt` como um dicionário sem tipo.

Modelo conceitual:

```ts
interface Cs2VideoSetting {
  key: string;
  label: string;
  description?: string;
  category: 'display' | 'quality' | 'latency' | 'effects' | 'advanced';
  type: 'boolean' | 'integer' | 'float' | 'enum' | 'resolution' | 'refresh-rate';
  writable: boolean;
  confidence: 'verified' | 'high' | 'community' | 'unknown';
  sources: SourceReference[];
}
```

Isso é paralelo ao `CommandRegistry`, não uma substituição dele.

---

## 23. Modelo de configuração unificado

Longo prazo:

```text
CS2 Metadata
│
├─ CommandRegistry
│  └─ console / .cfg
│
├─ VideoSettingsRegistry
│  └─ cs2_video.txt
│
├─ UserConVarRegistry
│  └─ user convars .vcfg
│
└─ InputSettingsRegistry
   └─ user keys .vcfg

            ↓

CS2 Configuration Model
```

O modelo unificado é a base para comparar:

- arquivo escrito pelo jogador;
- configuração salva pelo jogo;
- resultado efetivo após `exec`;
- mudanças propostas por builders.

---

## 24. Current CS2 Configuration

Página conceitual:

```text
Current CS2 Configuration

Mouse
Sensitivity          1.00

Crosshair
Style                Static
Color                Green

Radar
Scale                0.45

Video
Resolution           1280 × 960
Aspect ratio         4:3
Refresh rate         74.973 Hz

Input
42 custom binds
```

Cada valor deve informar sua origem quando expandido:

```text
Resolution
1280 × 960

Stored in
cs2_video.txt

Keys
setting.defaultres
setting.defaultresheight

[ Open source ]
```

---

## 25. Saved Game vs Autoexec

Uma das comparações mais úteis do produto.

```text
Setting             Game saved      autoexec

Sensitivity         1.20            1.00       ⚠
Radar scale         0.45            0.45       ✓
X bind              slot7           slot8      ⚠
```

O usuário deve conseguir entender por que uma configuração “volta”, “não aplica” ou muda depois de carregar a autoexec.

Essa feature depende de:

- parser estável;
- leitura segura dos arquivos de usuário;
- modelos normalizados;
- regras confiáveis de precedência.

---

# PARTE VI — DIAGNÓSTICO

## 26. Config Doctor — “Por que minha CFG não funciona?”

Feature principal de diagnóstico.

O Health Check é uma visão geral. O **Config Doctor** deve responder uma pergunta concreta: **o que está impedindo ou alterando o comportamento esperado?**

```text
Diagnose Config

✓ File found in CS2 cfg folder
✓ Parsed successfully
✓ 73 commands recognized

Problems found

autoexec.cfg:84
bind "f" "use weapon_flashbang"
              └ Command unavailable / incompatible

Suggested
bind "f" "slot7"

binds.cfg referenced at line 102
└ File not found

X is assigned twice
├ line 44 → slot8
└ line 91 → slot7
           ↑ Effective assignment
```

### Tipos de diagnóstico

- erro de sintaxe;
- comando desconhecido;
- comando removido quando houver evidência suficiente;
- `exec` ausente;
- ciclo de `exec`;
- bind reassigned;
- alias inexistente;
- alias recursivo quando analisável;
- valor inválido;
- range inválido;
- requisito de `sv_cheats` / contexto;
- linha sobrescrita posteriormente;
- resultado incerto por efeito não modelado.

A feature nunca deve transformar ausência de evidência em certeza.

---

## 27. Config Execution Trace

Mostrar a ordem de influência entre arquivos e atribuições.

```text
autoexec.cfg
   ↓
exec binds.cfg
   ↓
exec crosshair.cfg
   ↓
exec aliases.cfg
```

Para um símbolo:

```text
sensitivity

autoexec.cfg:20        1.4
mouse.cfg:8            1.2
autoexec.cfg:105       1.0

Effective value
1.0
```

Para binds:

```text
X

binds.cfg:14           slot8
binds.cfg:42           slot7
                       ↑ effective
```

Isso substitui mensagens simplistas de “duplicado” por uma explicação do resultado efetivo.

---

## 28. CFG Relationships / File Map

Visualização clicável das relações por `exec`.

```text
                 autoexec.cfg
                /      |      \
               /       |       \
        binds.cfg   radar.cfg   aliases.cfg
                         |
                   crosshair.cfg
```

Estados possíveis:

```text
✓ resolved
⚠ missing file
↻ cycle
? dynamic / uncertain
```

Ações:

- abrir arquivo;
- abrir linha do `exec`;
- mostrar ciclo;
- destacar arquivo não referenciado quando essa conclusão for segura dentro do escopo analisado.

---

## 29. Health Check

Continua existindo como resumo rápido.

```text
124 statements analyzed

0 errors
2 warnings
3 reassignments
1 unresolved exec
```

O Health Check não deve competir com o Config Doctor.

```text
Health Check = visão geral
Config Doctor = investigação e explicação
```

---

# PARTE VII — COMPATIBILIDADE E MIGRAÇÃO

## 30. Safe Update / Migration Assistant

Depois de atualização relevante do CS2:

```text
CS2 Config Compatibility

4 settings in your configs need attention

Removed
old_command

Changed
command_x

Verified replacement available
old_binding
→ new_binding

[ Review changes ]
```

### Regra crítica

Nunca inventar replacement.

Uma substituição só pode ser oferecida como equivalente quando houver evidência suficiente de equivalência de comportamento e valores.

Caso contrário:

```text
Command no longer appears in the reviewed metadata.
No verified replacement is available.
```

---

## 31. Build-aware change tracking

O pipeline de dados deve permitir comparar revisões/builds de maneira rastreável.

Exemplos:

- símbolo adicionado;
- símbolo ausente na revisão atual;
- default alterado;
- flags alteradas;
- range alterado;
- descrição técnica alterada;
- candidate esperando revisão.

Isso alimenta a compatibilidade sem transformar cada atualização em ruído para o usuário.

Mostrar somente alterações relevantes para as configs analisadas.

---

# PARTE VIII — EDIÇÃO SEGURA

## 32. Diff antes de salvar

Toda edição visual significativa deve produzir preview.

### Visão humana

```text
X
Smoke Grenade → Flashbang

Radar scale
0.45 → 0.50
```

### Raw diff

```diff
- bind "x" "slot8"
+ bind "x" "slot7"

- cl_radar_scale "0.45"
+ cl_radar_scale "0.50"
```

O jogador menos técnico pode permanecer na primeira visão. O avançado pode abrir o raw diff.

---

## 33. Escrita source-preserving

Meta de longo prazo:

- preservar comentários;
- preservar ordem quando não precisar mudar;
- preservar linhas não relacionadas;
- alterar somente os nós solicitados;
- manter trivia/whitespace quando suportado;
- evitar reserialização completa de arquivos quando não necessária.

Builders não devem “formatar o arquivo inteiro” só porque um valor mudou.

---

## 34. Backup e rollback

Antes de operações mais sensíveis:

```text
Snapshot created
2026-10-01 17:42

[ View changes ]
[ Restore ]
```

O objetivo não é substituir Git. É fornecer segurança para jogadores.

Possíveis snapshots:

```text
Before Crosshair Edit
Before Video Change
Competitive
Mouse Test
```

---

## 35. Escrita em arquivos de userdata

Mais conservadora que `.cfg`.

Processo desejado:

```text
Read original
   ↓
Parse
   ↓
Validate target keys
   ↓
Create backup
   ↓
Preview diff
   ↓
Modify only requested keys
   ↓
Atomic write when possible
```

Chaves desconhecidas devem ser preservadas.

Se o CS2 estiver em execução e houver risco de o jogo reescrever o arquivo ao fechar, a extensão deve avisar quando esse comportamento estiver tecnicamente validado.

---

# PARTE IX — COMMAND EXPLORER E LINGUAGEM

## 36. Command Explorer

Pesquisa unificada de comandos e ConVars.

```text
Search
crosshair

cl_crosshair_length
Crosshair bar length

cl_crosshair_gap
Gap between bars
...
```

Filtros possíveis:

- Active;
- Legacy;
- Removed, quando provado;
- Cheat;
- Client;
- Server;
- Archived;
- Development;
- Hidden.

Sempre priorizar significado humano.

---

## 37. Hover

Estrutura desejada:

```text
cl_radar_scale

Controls how much of the map is visible on the radar.

Current: 0.45
Default: 0.7
Range: ...

Source: Source 2 metadata via SteamTracking
```

Detalhes avançados podem incluir:

- flags;
- proveniência por campo;
- lifecycle;
- última verificação.

Não expor jargão interno do pipeline como informação principal.

---

## 38. Autocomplete contextual

Contextos previstos:

```text
cl_cross...
→ commands / ConVars

bind "
→ keys

bind "x" "
→ actions / aliases

exec
→ cfg files

buy
→ items
```

Completion deve usar o mesmo registry e índices do resto do produto.

---

# PARTE X — SHARE / COMUNIDADE

## 39. Shareable Sanitized Config Report

Botão:

```text
Copy Config Report
```

Saída:

```text
CS2 Config Tools Report

CS2 build: ...
autoexec.cfg: parsed

Errors: 1
Warnings: 2

L84: unknown command ...
L102: missing exec target ...
X: reassigned at L44/L91
```

### Sanitização

O relatório compartilhável não deve incluir automaticamente:

- caminhos locais completos desnecessários;
- SteamID;
- nome de usuário do sistema;
- outros dados pessoais do filesystem.

Preferir:

```text
autoexec.cfg:84
```

em vez de:

```text
C:\Users\Name\...\autoexec.cfg:84
```

Isso deve ser seguro para colar em Discord, Reddit ou GitHub.

---

## 40. Exportar blocos de configuração

Qualquer builder deve poder gerar um trecho independente:

```text
Crosshair commands copied
```

ou:

```text
Radar configuration copied
```

Isso permite compartilhar presets sem obrigar o usuário a compartilhar a CFG inteira.

---

# PARTE XI — BACKUP, COMPARAÇÃO E TRANSFERÊNCIA

## 41. Backup de configuração do CS2

Visão futura:

```text
Create CS2 Settings Backup

Game CFGs
☑ autoexec.cfg
☑ binds.cfg
☑ aliases.cfg

User settings
☑ controls
☑ crosshair/radar data
☐ video settings

[ Create snapshot ]
```

Video pode ser opcional porque configurações podem depender de outro monitor/GPU.

---

## 42. Semantic Config Diff

Comparar intenção, não só linhas.

```text
Bindings
X
Smoke Grenade → Flashbang

Mouse
Sensitivity
1.4 → 1.2

Radar
Scale
0.45 → 0.50
```

Raw diff continua disponível.

---

## 43. Transferência entre perfis

**Exploratório.** Só depois de dominar os formatos de userdata.

```text
Copy settings

From
Steam profile A

To
Steam profile B

Include
☑ binds
☑ crosshair
☑ radar
☑ gameplay
☐ video
```

Nunca copiar campos dependentes de hardware indiscriminadamente.

---

# PARTE XII — ARQUITETURA FUNCIONAL

## 44. Fontes de verdade compartilhadas

Nenhuma UI deve manter semântica paralela.

```text
Source 2 / reviewed evidence
          │
          ▼
Command Database + Provenance
          │
          ▼
CommandRegistry
          │
          ├───────────────┐
          ▼               ▼
CFG Language Model     Documentation
          │
          ▼
Static Analysis
          │
          ├─ Hover
          ├─ Completion
          ├─ Diagnostics
          ├─ Health Check
          ├─ Config Doctor
          ├─ Execution Trace
          ├─ Bind Map
          └─ Builders
```

Para userdata:

```text
Validated file metadata
      │
      ├─ VideoSettingsRegistry
      ├─ UserConVarRegistry
      └─ InputSettingsRegistry
                │
                ▼
      CS2 Configuration Model
```

---

## 45. Fluxo de mudança comum

Todas as ferramentas de edição devem convergir para um pipeline único.

```text
Visual control / raw editor
           │
           ▼
Structured Change
           │
           ▼
Shared Validation
           │
           ▼
Destination Resolver
           │
           ├─ existing CFG
           ├─ new CFG
           ├─ userdata file
           └─ clipboard
           │
           ▼
Diff / Preview
           │
           ▼
Safe Writer
```

O WebView nunca deve editar arquivo diretamente.

---

## 46. Shared Visual Input System

Teclado e mouse devem existir uma única vez como componentes reutilizáveis.

```text
visual-input/
├─ keyboard-layout
├─ key-mapping
├─ KeyboardSvg
├─ MouseSvg
├─ state model
└─ shared styles
```

Consumidores:

```text
Visual Bind Map
Bind Editor
Autoexec Builder
Buy Bind Builder
Practice Builder
```

---

## 47. Human Meaning Registry

O produto deve ter um mecanismo compartilhado para traduzir símbolos técnicos em significado humano quando isso for comprovável.

Exemplos:

```text
+forward      → Move forward
+jump         → Jump
slot8         → Smoke Grenade
messagemode2  → Team Chat
```

Esse mapeamento deve ser reutilizado por:

- Bind Map;
- Completion;
- Inspector;
- Alias Builder;
- Reports;
- Semantic Diff.

Não espalhar labels hardcoded por WebViews.

---

# PARTE XIII — EXPERIÊNCIA VISUAL

## 48. Direção de design

A extensão deve parecer:

```text
VS Code
+
configuration tooling
+
CS2-specific utilities
```

Não deve parecer:

```text
gaming launcher
+
RGB dashboard
+
generic AI-generated admin panel
```

### Preferir

- hierarquia clara;
- espaçamento funcional;
- alta densidade sem poluição;
- componentes do VS Code quando apropriados;
- cores de categoria discretas;
- navegação previsível;
- estados visuais consistentes;
- dark/light theme compatibility;
- teclado e mouse legíveis;
- inspector próximo do objeto selecionado.

### Evitar

- emojis como linguagem visual principal;
- gradientes excessivos;
- neon;
- cards para cada pequeno texto;
- cabeçalhos gigantes;
- warnings permanentes quando tudo está normal;
- linguagem interna como “modeled subset complete” na superfície da UI;
- repetição da mesma limitação em vários lugares.

---

## 49. Regra de silêncio quando tudo está normal

Se não há problema, não transformar sucesso em ruído.

Preferir:

```text
42 binds · 0 conflicts · 0 uncertain
```

Em vez de vários badges explicando internamente o modelo.

Detalhes técnicos podem existir em seção recolhida.

---

## 50. Progressive disclosure sem modos globais

Nunca exigir que a pessoa escolha “Simple” ou “Advanced”.

```text
Primary
Human meaning

Secondary
Raw symbol / current value

Details
Source, flags, provenance, history
```

Exemplo:

```text
Smoke Grenade
slot8

[ Show details ]
```

E nos detalhes:

```text
Raw bind
bind "x" "slot8"

Source
binds.cfg:42
```

---

# PARTE XIV — FLUXOS COMPLETOS

## 51. Fluxo: primeiro uso

```text
Install extension
      ↓
Open CS2 Config Tools
      ↓
Detect CS2 + cfg + userdata
      ↓
User confirms directories/profile
      ↓
Index CFG files
      ↓
Read-only analysis
      ↓
Home shows useful summary
```

Nenhuma escrita acontece só por conectar o diretório.

---

## 52. Fluxo: criar autoexec

```text
Home
  ↓
Create CFG
  ↓
Autoexec
  ↓
Basic template / Empty / Import
  ↓
Visual sections
  ↓
Generated preview
  ↓
Diff if replacing existing
  ↓
Save
  ↓
Open file / Bind Map / Diagnose
```

O arquivo recém-criado entra imediatamente no mesmo ecossistema de análise.

---

## 53. Fluxo: criar mira e aplicar

```text
Crosshair Builder
      ↓
Visual preview
      ↓
Generated structured settings
      ↓
Choose output
      ├─ Apply to autoexec
      ├─ Apply to another CFG
      ├─ Create crosshair.cfg
      └─ Copy commands
      ↓
Preview diff
      ↓
Save
      ↓
Health/Doctor can analyze result
```

---

## 54. Fluxo: diagnosticar uma CFG quebrada

```text
Select autoexec.cfg
      ↓
Diagnose Config
      ↓
Parser
      ↓
Registry validation
      ↓
Alias / exec / effective-state analysis
      ↓
Problems ordered by relevance
      ↓
Open source / Quick Fix / Explain
```

---

## 55. Fluxo: edição visual

```text
Open existing CFG
      ↓
Visual Editor
      ↓
Read current values from language model
      ↓
User changes Radar Scale
      ↓
Structured change
      ↓
Human diff + raw diff
      ↓
Source-preserving writer
      ↓
Re-analysis
```

O editor visual não deve reconstruir o documento a partir de zero.

---

## 56. Fluxo: update do CS2

```text
Catalog update reviewed
      ↓
Local metadata version changes
      ↓
Analyze only symbols used by user's configs
      ↓
Compatibility report
      ↓
No issue → silence
Issue → Review Changes
```

---

# PARTE XV — FEATURES E DEPENDÊNCIAS

## 57. Matriz resumida

| Feature             | Resultado                  | Dependências principais               |
| ------------------- | -------------------------- | ------------------------------------- |
| Visual Bind Map     | Entender binds fisicamente | Parser + bind analysis + human labels |
| Bind Editor         | Editar binds visualmente   | Bind Map + safe writer + diff         |
| Autoexec Builder    | Criar autoexec             | Registry + generators + writer        |
| Crosshair Builder   | Montar/aplicar mira        | Crosshair metadata validado           |
| Radar Builder       | Montar/aplicar radar       | Registry + ranges/semantics           |
| Practice Builder    | Criar practice.cfg         | Practice command validation           |
| Alias Builder       | Montar aliases             | Alias parser/semantics                |
| Config Doctor       | Explicar problemas         | Diagnostics + effective analysis      |
| Execution Trace     | Mostrar precedência        | Multi-file exec analysis              |
| File Map            | Visualizar exec graph      | Workspace + dependency graph          |
| Migration Assistant | Ajudar após updates        | Historical/build-aware metadata       |
| Game Settings       | Ver estado persistido      | Userdata discovery + parsers          |
| Video Editor        | Editar vídeo com segurança | Video registry + safe userdata writer |
| Saved vs Autoexec   | Comparar fontes            | Unified configuration model           |
| Semantic Diff       | Comparar intenção          | Normalized domain models              |
| Backup/Restore      | Segurança                  | Snapshot service                      |
| Shareable Report    | Ajuda comunitária          | Diagnostics + sanitization            |

---

# PARTE XVI — O QUE NÃO FAZER

## 58. Restrições de produto

Não implementar como comportamento padrão:

- execução automática de CFGs no CS2;
- alteração silenciosa da instalação do jogo;
- overwrite sem confirmação;
- edição de userdata sem backup/preview quando o risco for relevante;
- recomendações universais de FPS sem medição;
- “pro settings” apresentadas como superiores por padrão;
- replacement de comando sem equivalência verificada;
- marcar comando como removido apenas porque não apareceu em uma coleta;
- duplicar banco de comandos dentro dos builders;
- baixar dados da internet no runtime para a funcionalidade básica;
- Simple Mode / Advanced Mode globais;
- UI que esconda completamente a representação raw;
- UI que force usuários iniciantes a entender flags internas.

---

# PARTE XVII — PRINCÍPIOS DE PRODUTO

## 59. Os seis pilares

O produto deve ser avaliado por seis pilares:

```text
UNDERSTAND
Hover · Docs · Human meaning · Explorer

VISUALIZE
Bind Map · Mouse · Settings previews

CREATE
Autoexec · Practice · Aliases · Builders

EDIT
Visual + raw · Source-aware · Safe writes

DIAGNOSE
Health · Doctor · Trace · File Map

MAINTAIN
Backups · Diff · Migration · Compatibility
```

Uma nova feature deve fortalecer pelo menos um desses pilares e se integrar aos outros quando fizer sentido.

---

## 60. Critério de valor para a comunidade

Antes de adicionar uma feature, perguntar:

```text
Que problema real de um player de CS2 isso resolve?
```

Boas respostas:

- “meu autoexec parou depois do update”;
- “não sei qual bind está valendo”;
- “não sei onde minha CFG fica”;
- “quero montar uma practice cfg sem decorar comandos”;
- “quero copiar minha mira para minha autoexec”;
- “o jogo está salvando uma configuração diferente da minha autoexec”;
- “quero saber o que mudou antes de salvar”;
- “quero mandar um diagnóstico para alguém me ajudar”.

Evitar features adicionadas apenas para aumentar o número de botões.

---

## 61. Princípio final

O CS2 Config Tools deve ser **simples sem ser raso** e **poderoso sem ser intimidador**.

Um jogador novo deve conseguir:

```text
abrir uma CFG
entender os principais binds
criar uma autoexec
montar uma mira
criar practice.cfg
aplicar mudanças com segurança
```

sem precisar aprender toda a sintaxe antes.

Um jogador experiente deve conseguir:

```text
ver raw CFG
usar aliases
organizar múltiplos arquivos
acompanhar execs
descobrir estado efetivo
inspecionar proveniência
comparar configurações
revisar migrações
controlar exatamente onde cada mudança será escrita
```

sem ser limitado por uma interface simplificada.

### Síntese

```text
               CS2 CONFIG TOOLS
                      │
              Understand the config
                      │
              Visualize the config
                      │
                Diagnose issues
                      │
              Create / edit safely
                      │
             Apply where the user wants
                      │
             Keep it working over time
```

Esse é o objetivo do produto.

---

## 62. Manutenção deste documento

Quando uma nova ideia de produto for aceita:

1. registrar aqui a intenção e integração;
2. definir dependências;
3. não iniciar implementação automaticamente;
4. atualizar o plano incremental quando a feature realmente entrar na fila;
5. atualizar `status.md` quando começar ou terminar;
6. remover descrições conflitantes caso a direção mude.

`FEATURES.md` é a memória de **produto e experiência integrada**. O plano de implementação continua sendo a fonte da ordem de execução.
