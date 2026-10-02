# Guia de uso

Configurações e detalhes de funcionamento do CS2 Config Tools. Para conhecer os recursos, veja a [apresentação](README.pt-BR.md).

[English guide](user-guide.md)

## Começar

Instale o VSIX da pasta `artifacts/` em **Extensões → … → Instalar do VSIX**. Abra uma CFG do CS2. Em pastas personalizadas, selecione **CS2 CFG** no indicador de linguagem. Para associar uma pasta exclusiva de CS2 e formatar ao salvar, configure o workspace:

```json
{
  "files.associations": { "*.cfg": "cs2cfg" },
  "cs2Config.descriptionLanguage": "pt-BR",
  "[cs2cfg]": {
    "editor.defaultFormatter": "plajiw.cs2-config-tools",
    "editor.formatOnSave": true
  }
}
```

CFGs em `game/csgo/cfg` e nos perfis Steam em `730/local/cfg` usam **CS2 CFG** automaticamente, inclusive em subpastas. Associações explícitas em `files.associations` têm prioridade. Em outros locais, use o Hub ou o indicador de linguagem; arquivos `.vcfg` não recebem essa associação.

Digite `cl_cross` para comandos de mira, `bind "` para teclas conhecidas ou `bind "x" "` para ações. Sugestões dentro de strings ficam habilitadas por padrão em CS2 CFG; suas configurações do editor podem sobrescrever isso. Use **Ctrl+Espaço** se as sugestões automáticas estiverem desabilitadas.

A política de sugestões continua válida: nomes marcados como ocultos no snapshot, como `cl_crosshairalpha`, exigem `cs2Config.completionMode: "advanced"`. Uma sugestão não comprova comportamento no jogo.

A associação do exemplo fica no workspace exclusivo de CS2 porque outros programas também usam arquivos `.cfg`.

**Conectar configuração**, na Home ou em Workspace, busca a pasta CFG do jogo e o userdata Steam em um único fluxo. Uma pasta/perfil encontrado é proposto automaticamente; vários resultados exigem seleção. Revise os dois caminhos em uma única confirmação antes da leitura do conteúdo. A conexão é local, sem credenciais Steam. A seleção manual continua disponível; sem userdata, escolha **Continuar somente com CFGs**. Cancelar a seleção ou autorização preserva ambas as conexões. As permissões existentes são mantidas. Cada fonte conserva seu estado e pode ser recuperada separadamente quando indisponível.

Cada linha de CFG oferece **Remover CFG**. Revise o caminho exato e confirme **Mover para a Lixeira**; somente essa CFG será removida. Salve ou descarte alterações não salvas primeiro. A remoção exige workspace confiável e verifica novamente a pasta, o arquivo selecionado e sua identidade após a confirmação; alterações no destino bloqueiam a operação. Não há exclusão permanente alternativa se a Lixeira estiver indisponível. Outras CFGs e suas referências exec são preservadas.

O Bind Map mantém uma bolinha com a cor da categoria nas teclas atribuídas mesmo quando o estado é incerto. Bordas tracejadas e descrições acessíveis continuam indicando a incerteza; uma exclamação adicional identifica reatribuição/ambiguidade. Os controles Categoria e Estado ficam alinhados lado a lado em telas estreitas.

## Hub de configurações

Clique em **CS2 Config Tools** na Activity Bar e escolha **Início/Home**, ou execute **CS2 Config: Abrir início/Open Home**. **Conectar configuração** procura locais comuns do Steam, bibliotecas declaradas por ele e perfis locais em um único fluxo, inclusive em outros discos. **Escolher pasta** permite a seleção manual.

A extensão pede consentimento antes de listar as CFGs. Pastas personalizadas fora de `game/csgo/cfg` também são aceitas e identificadas. A pasta fica lembrada localmente para a próxima sessão; **Desconectar** remove a escolha. “Conectado” significa que o diretório está acessível, sem afirmar que o CS2 está aberto ou que a build foi verificada.

A barra lateral lista os arquivos, e a Home reúne abertura no editor, **Mapa visual de binds** somente leitura e **Verificação da CFG**. Arquivos abertos pelo hub recebem o modo CS2 CFG. A análise inclui texto não salvo de editores abertos e atualiza após alterações. **Atualizar** tenta acessar novamente uma pasta indisponível. **Abrir no explorador** revela o diretório conectado. O idioma da Home acompanha `cs2Config.descriptionLanguage`, com inglês como padrão.

**Nova CFG** cria um arquivo vazio após a revisão do nome e destino. Arquivos existentes nunca são substituídos, mesmo se outro processo criar o mesmo nome durante o diálogo. A criação exige um workspace confiável. Edite CFGs existentes no editor de texto; o hub não executa comandos nem salva suas alterações automaticamente.

As contagens excluem o grupo recolhido de nomes típicos do jogo e somam análises independentes por arquivo, sem combinar as CFGs ou representar o jogo em execução. Cada linha distingue resultado parcial de subconjunto modelado, sem certificação de “válido”. São listados até 100 arquivos CFG regulares diretamente na pasta; subpastas e links simbólicos ficam de fora. Arquivos inacessíveis ou acima do limite de análise não têm resumo e ficam fora dos totais analisados. A pasta do hub não altera `cs2Config.cfgRoot`, usado pelos links de exec.

O menu da Home contém apenas ferramentas implementadas: Autoexec Builder, Mapa visual de binds, Verificação da CFG e Nova CFG vazia. Os atalhos usam autoexec.cfg quando existe, ou a primeira CFG visível fora do grupo do jogo; cada linha abre ferramentas para aquele arquivo exato. Pastas vazias permitem criar arquivos. Autoexec Builder funciona também sem pasta conectada; escolha um destino explicitamente. Veja o [estado dos recursos](../FEATURES.md).

## Configurações

Procure por **CS2 Config** nas configurações do VS Code. Todas as opções abaixo usam o prefixo `cs2Config.`.

| Opção                           | Padrão        | Finalidade                                                                             |
| ------------------------------- | ------------- | -------------------------------------------------------------------------------------- |
| `descriptionLanguage`           | `en`          | Descrições em inglês, `pt-BR` ou `auto`, que acompanha o editor com fallback em inglês |
| `hoverDetails`                  | `standard`    | `advanced` adiciona tipos técnicos e proveniência por campo                            |
| `showOriginalDescription`       | `false`       | Mostrar também a descrição original do jogo, quando disponível                         |
| `completionMode`                | `normal`      | `advanced` inclui sugestões com flags `hidden`, `developmentonly` ou `internal`        |
| `parameterValidation`           | `true`        | Avisar sobre tipos, opções e intervalos documentados                                   |
| `bindDiagnostics`               | `information` | Avisos de binds repetidos/substituídos: `off`, `information` ou `warning`              |
| `inlayHints`                    | `false`       | Mostrar significados revisados ao lado dos valores                                     |
| `unknownCommands`               | `information` | Avisos de nomes ausentes do catálogo: `off`, `information` ou `warning`                |
| `cfgRoot`                       | vazio         | Pasta absoluta opcional usada para resolver arquivos de `exec`                         |
| `consoleEvidence`               | `none`        | Perfil opcional de rejeições do relato `user-report-2026-10-01`                        |
| `formatting.maxBlankLines`      | `1`           | Limitar linhas vazias consecutivas; aceita 0–3                                         |
| `formatting.separateSections`   | `true`        | Separar cabeçalhos de comentários com `===` ou `---`                                   |
| `formatting.insertFinalNewline` | `true`        | Adicionar quebra de linha no final do documento formatado                              |

## Explorador de comandos

Abra **Explorador de comandos** nas ações rápidas da Home, na barra lateral Ferramentas ou em **CS2 Config: Explorar comandos**. Digite um nome ou descrição em inglês/pt-BR no seletor nativo; Enter abre a documentação. Nomes exatos aparecem primeiro. O botão de olho alterna catálogo normal/completo naquela busca sem alterar configurações; a política inicial segue cs2Config.completionMode. A busca é offline e limitada aos resultados relevantes do registry compartilhado. Nenhum resultado significa ausência de correspondência na busca/política, não remoção de um comando pelo jogo.

A página usa o mesmo serviço de documentação do hover, separando resumos comunitários, ajuda original, parâmetros revisados, exemplos e proveniência. **Copiar nome do comando** copia apenas o nome selecionado do registry. Não executa nem insere comandos. Defaults e significados desconhecidos não são inventados. **Buscar comandos** retorna ao seletor. O idioma segue a configuração existente da extensão com fallback em inglês.

## Agrupamento de arquivos e vídeo salvo

Configurações de vídeo identifica o escopo somente leitura no cabeçalho. Cada configuração reúne um rótulo e sua chave original; o valor literal ao lado continua visível em painéis estreitos. **Sobre estes valores** explica os limites de interpretação. Arquivos ausentes ou desconectados mostram mensagens de recuperação em vez de uma tabela vazia.

A lista principal inclui nomes conhecidos de CFGs do jogador (autoexec, practice, binds, aliases, crosshair e radar) e arquivos não classificados. Em uma pasta típica game/csgo/cfg, nomes gamemode__, gamemap__ e server*.cfg aparecem em um grupo recolhido na Home e na barra lateral. Os rótulos **Suas CFGs** e **Outras CFGs do CS2** identificam os grupos principal/recolhido. É uma heurística por nome, sem comprovar autoria ou gerenciamento pelo jogo; pastas personalizadas não aplicam a heurística do jogo. Todos os arquivos listados continuam acessíveis para edição como texto. O resumo exclui o grupo recolhido; achados parciais continuam limitados a cada arquivo.

**Configurações salvas do jogo** oferece conexão e recuperação manual diretamente. O item da barra lateral abre vídeo com as mesmas ações de conexão. Use **Conectar configuração** para descobrir ambas as fontes e aprovar os dois caminhos juntos. A detecção enumera perfis numéricos com diretório 730/local/cfg nas raízes Steam descobertas; não infere identidade. Um candidato único é proposto para sua aprovação; vários perfis exigem seleção. Em **Fontes de configuração**, a seleção manual de pastas continua disponível para recuperação independente. As fontes ficam lembradas localmente. **Desconectar configurações** limpa apenas essa conexão. **Atualizar** tenta acessar ambas as fontes novamente.

**Configurações do jogo → Configurações de vídeo** abre uma página somente leitura. Ela lê apenas cs2_video.txt, incluindo texto não salvo do editor, e atualiza após alterações no arquivo/editor. Resolução e proporção reduzida são calculadas com dimensões inteiras positivas; frequência é numerador dividido por denominador positivo. Não são inferidas capacidades do monitor, marca da GPU, defaults ou significados dos enums do jogo. A página continua como inspeção. **Abrir no editor** abre o arquivo de vídeo autorizado para edição manual de texto e save/undo normais do VS Code; não modifica nem salva valores por você e não cria backup automático. Validação de enums, presets, escrita visual segura e fluxos de backup/diff continuam planejados. Rótulos conhecidos identificam chaves literais; chaves e valores desconhecidos continuam visíveis. As definições mantêm origem/confiança no núcleo compartilhado, sem campos editáveis.

**Ver configurações originais** mostra o texto original em um canal Output somente leitura. A inspeção não escreve em userdata nem executa CFGs. Arquivos ausentes, pastas inacessíveis e texto incompleto/não suportado têm estados de recuperação distintos. O parser limitado suporta uma raiz KeyValues entre aspas com pares planos de chave/valor entre aspas, espaços, BOM e comentários //. Estruturas aninhadas, escapes, chaves duplicadas (sem distinguir maiúsculas), aspas incompletas e arquivos acima de 256.000 bytes não são suportados; valores derivados são omitidos para entradas malformadas/conflitantes. A inspeção literal continua disponível para texto lido mas não suportado. Verificações de identidade excluem arquivos de vídeo com links simbólicos e leituras fora da pasta autorizada.

A Home mostra **Controles** apenas como arquivo salvo detectado pelo nome regular; **Abrir** abre esse arquivo como texto, sem modelar seus binds. As linhas Mira e Radar apontam para CFGs que contêm instruções diretas desses grupos; não representam valores salvos/atuais do jogo. Categorias ausentes indicam não encontrado.

O **Resumo das CFGs** conta somente CFGs, sem vídeo. Achados separam erros, avisos e observações. **Analisado**, **Precisa de revisão** e **Análise parcial** descrevem cobertura, sem certificar validade no jogo. O cabeçalho identifica a fonte conectada quando existe apenas uma. Fontes ficam recolhidas com ambas conectadas e vídeo acessível; setup ou vídeo indisponível/malformado/ausente expande a seção, preservando alternâncias manuais durante atualizações rotineiras. Desconectar aparece apenas para fontes selecionadas; userdata conectado oferece Abrir pasta, Trocar conexão e Desconectar. **Escopo da análise** e Acesso à pasta são detalhes recolhidos.

Modelos userdata de controles, mira/radar, edição de vídeo, backups e aplicação de mudanças continuam planejados. Não há afirmação de verificação em uma build ou no jogo em execução.

## Formatação

Use **Formatar documento** (Shift+Alt+F no Windows) ou **Formatar seleção**. A formatação ajusta espaços fora das aspas, separadores `;` e linhas vazias.

```cfg
// Antes
  sensitivity    "1.40"
rate  1000000;fps_max  "0"

// Depois
sensitivity "1.40"
rate 1000000; fps_max "0"
```

Conteúdo entre aspas, corpos de binds/aliases e texto de `echo` são preservados. Comandos continuam na ordem original. Arquivos com aspas sem fechamento não são formatados; seleções abrangem linhas físicas completas. A formatação não remove comandos repetidos nem altera valores.

## Documentação e sugestões

Passe o mouse sobre um comando ou valor para consultar a explicação. O hover separa **Valor atual** (escrito naquela instrução), **Padrão** (metadado revisado) e **Intervalo permitido**. Enums e booleanos incluem seus significados quando conhecidos. **Valor observado** identifica o dado do dump e não substitui o padrão ou o valor da CFG.

Dentro de binds e aliases, o valor atual descreve a instrução escrita, não uma mudança já executada. Campos desconhecidos são omitidos. Flags e fontes aparecem depois do uso; o modo avançado mostra detalhes adicionais. As fontes técnicas do SteamTracking não são documentação oficial da Valve nem confirmação da build instalada.

Use Ctrl+Espaço para sugestões. O modo normal oculta sugestões internas/de desenvolvimento, mas reconhecimento e hover continuam disponíveis. O autocomplete não inventa valores atuais. Para nomes desconhecidos, **Correção Rápida** oferece nomes próximos: você escolhe a alteração, aplicada apenas ao token selecionado, sem migração de comandos ou conversão de valores.

## Binds e aliases

Binds com texto de ação idêntico geram uma informação de repetição; texto diferente indica substituição. Os avisos vinculam a origem anterior e as chamadas/definições de aliases envolvidas. Uma substituição pode ser intencional; não há limpeza automática.

`unbind` e `unbindall` reiniciam a comparação das teclas afetadas. Efeitos desconhecidos interrompem comparações até novas escritas explícitas. Corpos de teclas não pressionadas não são executados pela análise. Nomes de teclas e ações são comparados literalmente, sem normalização presumida.

F12 leva a definições de aliases locais ou arquivos existentes de `exec`. Links usam `cfgRoot` ou a pasta do documento. O outline e as referências ajudam a navegar no arquivo. Usos imediatos de aliases respeitam definições anteriores; referências em corpos diferidos são do documento, sem prever quando serão executadas.

## Verificar a CFG

Execute **CS2 Config: Verificar CFG** na Paleta de Comandos com uma CS2 CFG ativa. O painel Output separa Resumo, Achados, Efeitos não resolvidos e Escopo/próximos passos. Os achados são agrupados por sintaxe, valores, evidência de console selecionada, compatibilidade, nomes desconhecidos e binds repetidos/substituídos, com totais de erros/avisos/informações e números das linhas. Binds anteriores e definições em aliases preservam as linhas de origem. As explicações são compartilhadas com os diagnósticos do editor; o idioma segue `cs2Config.descriptionLanguage`. Copie o texto do Output para compartilhá-lo. “Requer revisão” refere-se apenas ao relato de console selecionado e seu escopo de build; não afirma remoção universal. Um resultado parcial sem achados ainda pode ter efeitos não resolvidos. O relatório inclui verificações mesmo quando avisos individuais estão desativados no editor.

A análise é estática e de arquivo único. Execs externos, ações dinâmicas, ciclos e limites de processamento produzem resultados parciais. Ela não executa comandos, mede FPS ou representa o estado atual do jogo. Arquivos muito grandes não recebem análise nem formatação.

O perfil opcional do console registra rejeições de mira em uma build não identificada. Não afirma remoção em todas as versões nem oferece substituições automáticas. Um nome ausente do catálogo pode ser um alias externo ou comando de plugin.

## Mapa visual de binds

O mouse tem botões principais espelhados, wheel/M3 central e regiões M4/M5 separadas e embutidas. Regiões do dispositivo e controles adjacentes compartilham seleção, incerteza e categorias; as direções da wheel continuam em controles separados. O teclado preserva sua escala legível com rolagem local.

Com uma CS2 CFG ativa, clique no ícone de teclado na barra superior do editor ou execute **CS2 Config: Abrir mapa de binds**. Se o arquivo abrir como texto simples, selecione primeiro a linguagem **CS2 CFG**. O painel acompanha aquele arquivo, inclusive alterações não salvas; para trocar a origem, ative outra CFG e execute o comando novamente.

- **Explore suas entradas:** selecione qualquer tecla do teclado ANSI proporcional, do numpad ou do mouse. O mouse inclui cinco botões e as duas direções de rolagem. Entradas ausentes desta análise mostram "Nenhum bind encontrado"; elas ainda podem ter binds no jogo.
- **Entenda o bind:** o inspector destaca a explicação disponível no catálogo antes da ação literal, seguida da categoria e linha de origem. Expanda **Bind original** para consultar o comando escrito. **Histórico de binds** aparece somente quando há múltiplas atribuições. As descrições seguem cs2Config.descriptionLanguage, com inglês como fallback. Aliases e sequências sem classificação segura aparecem como personalizados; slots preservam explicações genéricas quando não há correspondência documentada com um item específico.
- **Encontre a origem:** use **Abrir origem**, **Abrir definição do alias** ou um link do histórico. Atribuições anteriores podem preceder um unbind/reset. O marcador de reatribuição é informativo: substituições podem ser intencionais.
- **Filtre a consulta:** filtros de categoria e estado atenuam o desenho físico. O menu de categorias mostra uma bolinha da mesma cor no valor selecionado e nas opções. Setas, Home/End e letras iniciais percorrem as opções; Enter/Espaço seleciona, Escape cancela e Tab segue ao próximo controle. Expanda **Binds literais** para consultar keycaps com explicações do catálogo e comandos literais secundários, inclusive nomes fora da referência. Os nomes mantêm maiúsculas/minúsculas originais e continuam independentes.
- **Consulte a análise:** ! indica reatribuição/ambiguidade; borda tracejada e descrição acessível indicam incerteza. As bolinhas de categoria continuam visíveis. Expanda **Detalhes da análise** para efeitos não resolvidos, como execs externos, ações não suportadas e limites de sintaxe/análise. O resultado descreve um modelo estático de arquivo único, não comportamento confirmado no jogo.

O painel é somente leitura. Tab percorre os controles; Enter ou Espaço seleciona uma entrada. A seleção leva o foco ao inspector. Atualizações preservam o foco pela identidade da entrada/nome literal; trocar a origem limpa a seleção. Temas claro, escuro e de alto contraste usam as cores do VS Code. O teclado mantém 1080 pixels de largura: role sua região na horizontal ou use Tab para revelar uma tecla fora da área visível. A página permanece dentro do painel. O inspector ocupa a largura da página abaixo dos dois dispositivos em qualquer tamanho. As seções Teclado e Mouse ficam lado a lado quando há espaço para o teclado inteiro e o mouse; caso contrário, se empilham. O mouse mostra M1–M5 dentro do corpo, com sete controles ao lado para esses botões e as duas direções de rolagem. Os controles exibem explicações do catálogo quando disponíveis e compartilham seleção, categoria e estado com o desenho. Abaixo de 900 pixels os filtros se recolhem e o desenho ocupa a largura disponível. O header identifica a origem com um selo CFG e o nome do arquivo; o tooltip mantém o caminho completo. Explicações do escopo ficam nos detalhes recolhidos.

Fechar a origem limpa o resultado. Arquivos grandes pausam a análise. Se a análise falhar, **Tentar novamente** solicita outra visualização; erros técnicos ficam no log do Extension Host. Links de visualizações antigas são rejeitados. O mapa não expande CFGs externas, executa corpos de binds ou grava bindings.

Os binds de placar e eixos do mouse (`bind "TAB" "+showscores"`, `bind "MOUSE_X" "yaw"`, `bind "MOUSE_Y" "pitch"`) são reconhecidos com descrições bilíngues e referência fixa ao arquivo de teclas padrão. Isso não comprova uma build testada nem permissões de execução.

## Autoexec Builder MVP

Abra **Autoexec Builder** em Home → Ações rápidas ou na árvore Ferramentas (comando **CS2: Autoexec Builder**). Escolha uma CFG existente ou um novo destino. Uma pasta conectada sugere autoexec.cfg. Se o arquivo já existe, edite-o ou escolha outro nome; não há fluxo de sobrescrita. Escolher/cancelar o destino não cria arquivo.

1. Escolha uma tecla ou controle de mouse suportado.
2. Busque a ação pelo comando ou significado humano (fumaça / slot8, granada de luz, molotov / incendiária, arma primária).
3. Adicione o bind ao rascunho. Restrições numéricas conhecidas de ConVars são validadas pelo registry. Outros parâmetros usam tokens seguros separados por espaços; argumentos entre aspas, escapes, aliases e sequências de comandos ficam fora deste MVP.
4. Selecione **Revisar alterações**. O diff humano mostra o significado anterior/novo; expanda **Diff técnico da CFG** ou abra o diff completo no editor para conferir a fonte exata.
5. Se a tecla já possui bind, confira sua ação atual e marque explicitamente **Substituir existente**, depois revise novamente. Teclas duplicadas no rascunho bloqueiam a aplicação.
6. Revise as notas de incerteza/contexto e confirme sua leitura antes de **Aplicar no editor**. Cancele o preview ou feche o builder para manter o destino intacto.

Alterações em CFG existente permanecem no buffer com Undo normal; salve quando estiver pronto. Arquivos novos são criados exclusivamente por edição do workspace, com o texto gerado aberto no editor. O builder compara versão/texto do buffer e texto em disco com o preview; qualquer mudança intermediária invalida a aplicação e exige nova revisão. Preserva comentários, texto não relacionado, aspas existentes, CRLF/LF e presença de quebra final. Um bind escrito por alias recebe um bind explícito acrescentado; o corpo do alias nunca é reescrito.

Significados de slots são compartilhados com Mapa de binds, hover e completion. slot1–slot10 têm nomes humanos (incluindo **Faca / Corpo a corpo**, **Alternar granadas**, **C4 / Bomba** e **Molotov / Incendiária**). slot11 tem mapeamento comunitário Zeus x27; slot12 é a injeção de cura dependente do modo; slot13 mantém o nome técnico com nota provisória sobre itens utilitários. São explicações comunitárias, não texto original da Valve nem verificação de build do jogo. Itens podem estar indisponíveis. A análise de arquivo único não resolve execs externos ou efeitos dinâmicos; o preview expõe essa incerteza. Nenhuma CFG é executada.

## Segurança e limites da análise

Trocar o destino do Autoexec Builder, cancelar ou fechar o painel invalida o preview revisado. Revise novamente após mudanças no buffer/disco. Os destinos suportados são arquivos regulares UTF-8 de até quatro milhões de bytes e um milhão de caracteres; buffers não salvos excessivos também são rejeitados antes da cópia do texto. Codificação inválida, arquivo inacessível ou alterado produz erro explícito. As edições preservam texto não relacionado, aspas, comentários, quebras de linha e newline final, com undo no editor.

Aliases imediatos seguem a ordem escrita de execução. Uma definição posterior não suprime um aviso anterior de valor; aliases invocados podem criar aliases usados depois. Corpos de binds permanecem adiados. Ciclos aparecem tanto nos diagnósticos quanto no Health; efeitos não resolvidos continuam tornando a análise parcial. Rótulos revisados de slots descrevem apenas ações literais reconhecidas: `slot8 unexpected` mantém a ação bruta sem um significado confiante da ação completa.

Em larguras estreitas do Hub, role a tabela localmente para alcançar as ações; os nomes permanecem em uma linha. A navegação exec verifica lotes limitados e para de agendar ao cancelar. Rejeita nomes absolutos/traversal, mas pode seguir links do sistema de arquivos; não executa nem inclui as CFGs alvo no estado efetivo. Abrir controles salvos seleciona o primeiro arquivo correspondente como atalho, não como o slot efetivo do jogo.

Se o catálogo não carregar, a análise fica indisponível e a extensão orienta reinstalar ou reconstruir o checkout de desenvolvimento. Nunca substitui o catálogo por um vazio.
