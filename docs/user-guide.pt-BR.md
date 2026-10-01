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

Com uma CS2 CFG ativa, execute **CS2 Config: Abrir mapa de binds** na Paleta de Comandos. O painel fica vinculado àquele arquivo e acompanha alterações, inclusive não salvas. Para consultar outra CFG, ative-a e execute o comando novamente. Fechar a origem limpa o mapa.

- Selecione uma tecla modelada de teclado, mouse ou numpad para consultar a ação literal. A lista oferece todos os nomes modelados, inclusive os que não aparecem no desenho.
- **Abrir origem** leva ao bind ou à chamada do alias que o estabeleceu. **Abrir definição do alias** leva à definição quando aplicável. Os botões de binds anteriores mostram substituições ou repetições registradas na análise; esse histórico pode incluir mudanças anteriores a um unbind/reset.
- O desenho é uma referência QWERTY ilustrativa, não uma validação dos nomes aceitos pelo jogo. Nomes são comparados literalmente, sem normalizar maiúsculas. Teclas sem informação não são consideradas sem bind.
- Um resultado parcial lista efeitos não resolvidos: execs externos, ações desconhecidas, sintaxe inválida ou limites de análise. Cada bind preserva seu grau de certeza; ações modeladas não confirmam comportamento no jogo.

O painel é somente leitura, usa o mesmo modelo do health check e dos diagnósticos e segue cs2Config.descriptionLanguage. Tab percorre os botões; Enter ou Espaço os ativa. Selecionar um bind leva o foco aos detalhes. Atualizações preservam o foco pela tecla, mesmo quando a ação muda; se o botão desaparecer, o foco vai ao título dos detalhes. Trocar o arquivo de origem limpa a seleção. A legenda explica resultados modelados, incertos e sem informação sem depender apenas de cores.

Arquivos grandes pausam a análise. Links de uma visualização antiga são rejeitados, inclusive quando dois arquivos têm a mesma versão de documento. O mapa não expande CFGs externas nem executa corpos de binds.
