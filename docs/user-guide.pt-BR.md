# Guia de uso

Configura??es e detalhes de funcionamento do CS2 Config Tools. Para conhecer os recursos, veja a [apresenta??o](README.pt-BR.md).

[English guide](user-guide.md)

## Começar

Instale o VSIX da pasta `artifacts/` em **Extensões → … → Instalar do VSIX**. Abra uma CFG e selecione **CS2 CFG** no indicador de linguagem. Para reconhecer as CFGs automaticamente e formatar ao salvar, configure o workspace:

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

A associação fica no workspace porque outros programas também usam arquivos `.cfg`.

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

Execute **CS2 Config: Verificar CFG** na Paleta de Comandos com uma CS2 CFG ativa. O painel Output reúne achados, binds/aliases modelados, contagens de repetições/substituições e limites da análise. O relatório inclui verificações mesmo quando avisos individuais estão desativados no editor.

A análise é estática e de arquivo único. Execs externos, ações dinâmicas, ciclos e limites de processamento produzem resultados parciais. Ela não executa comandos, mede FPS ou representa o estado atual do jogo. Arquivos muito grandes não recebem análise nem formatação.

O perfil opcional do console registra rejeições de mira em uma build não identificada. Não afirma remoção em todas as versões nem oferece substituições automáticas. Um nome ausente do catálogo pode ser um alias externo ou comando de plugin.

## Mapa visual de binds

Com uma CS2 CFG ativa, clique no ícone de teclado na barra superior do editor ou execute **CS2 Config: Abrir mapa de binds**. Se o arquivo abrir como texto simples, selecione primeiro a linguagem **CS2 CFG**. O painel acompanha aquele arquivo, inclusive alterações não salvas; para trocar a origem, ative outra CFG e execute o comando novamente.

- **Explore suas entradas:** selecione qualquer tecla do teclado ANSI proporcional, do numpad ou do mouse. O mouse inclui cinco botões e as duas direções de rolagem. Entradas ausentes desta análise mostram "Nenhum bind encontrado"; elas ainda podem ter binds no jogo.
- **Entenda o bind:** o inspector mostra a ação literal, explicação/categoria disponível no catálogo, linha de origem, comando original e histórico de atribuições. As descrições seguem cs2Config.descriptionLanguage, com inglês como fallback. Aliases e sequências sem classificação segura aparecem como personalizados.
- **Encontre a origem:** use **Abrir origem**, **Abrir definição do alias** ou um link do histórico. Atribuições anteriores podem preceder um unbind/reset. O marcador de reatribuição é informativo: substituições podem ser intencionais.
- **Filtre a consulta:** filtros de categoria e estado atenuam o desenho físico. Expanda **Todos os binds literais** para nomes fora da referência. Nomes em maiúsculas e minúsculas podem compartilhar uma tecla visual, mas continuam independentes; consulte cada um pelo inspector ou pela lista.
- **Consulte a análise:** ! indica reatribuição/ambiguidade; ? e borda tracejada indicam incerteza. Expanda **Detalhes da análise** para efeitos não resolvidos, como execs externos, ações não suportadas e limites de sintaxe/análise. O resultado descreve um modelo estático de arquivo único, não comportamento confirmado no jogo.

O painel é somente leitura. Tab percorre os controles; Enter ou Espaço seleciona uma entrada. A seleção leva o foco ao inspector. Atualizações preservam o foco pela identidade da entrada/nome literal; trocar a origem limpa a seleção. Temas claro, escuro e de alto contraste usam as cores do VS Code. Em painéis estreitos, o inspector fica abaixo do desenho, mantendo as proporções físicas.

Fechar a origem limpa o resultado. Arquivos grandes pausam a análise. Se a análise falhar, **Tentar novamente** solicita outra visualização; erros técnicos ficam no log do Extension Host. Links de visualizações antigas são rejeitados. O mapa não expande CFGs externas, executa corpos de binds ou grava bindings.
