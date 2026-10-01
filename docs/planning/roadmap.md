# Plano de estudos e evolução

Para a ordem de implementação e os critérios de cada fase, consulte o [plano incremental](implementation-plan.md). Esta página mantém o percurso de estudos; a [visão do projeto](../../PROJECT_VISION.md) e a [arquitetura](../architecture.md) definem as dependências. O registry e a análise da linguagem precedem os builders visuais.

O objetivo é tornar a edição de CFGs clara e confiável: sugerir comandos, explicar parâmetros e restrições, detectar problemas e formatar arquivos sem mudar seu comportamento. O catálogo cresce com evidências por build; cobertura no editor não equivale a funcionamento confirmado no jogo.

## Prioridades

| Etapa               | Resultado esperado                                                                    |
| ------------------- | ------------------------------------------------------------------------------------- |
| Experiência inicial | Os dois CFGs de referência podem ser editados, consultados e formatados               |
| Catálogo verificado | Descrições originais, flags e parâmetros coletados de uma build identificada          |
| Análise contextual  | Melhor entendimento de aliases, referências, ordem de execução e contexto do servidor |
| Comunidade          | Contribuições reproduzíveis, traduções revisadas e releases documentadas              |

O parser e os providers atuais formam uma base local. Os próximos passos devem melhorar a qualidade do catálogo e resolver problemas reais antes de ampliar a arquitetura.

## Percurso de estudos

Estimativa inicial: oito semanas com dedicação parcial. Ajuste o ritmo ao conhecimento de TypeScript e ao tempo disponível.

| Foco                       | Prática                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| Console do CS2 e contextos | Coletar inventário, ajuda e flags com build e ambiente identificados |
| TypeScript e dados         | Evoluir tipos e validar o catálogo sem inventar campos desconhecidos |
| Gramática e parsing        | Confirmar regras de aspas, comentários, separadores e escapes        |
| API do VS Code             | Melhorar completion, hover, definições e diagnósticos                |
| Parâmetros e restrições    | Verificar assinaturas, intervalos e regras de cheats com evidências  |
| Binds, aliases e exec      | Resolver casos locais e documentar limites de análise dinâmica       |
| Formatação e desempenho    | Preservar semântica, medir latência e invalidar cache corretamente   |
| Releases e contribuição    | Empacotar, revisar tradução e documentar mudanças                    |

## Como coletar evidência

Preserve a saída bruta e registre build, data UTC, plataforma, cliente ou servidor, mapa/modo, estado de cheats, plugins e procedimento. Verifique os mecanismos de inventário e ajuda disponíveis na versão instalada antes de definir um procedimento automático.

Separe presença, aceitação de parâmetros, permissão de execução e efeito observado. Ausência em uma coleta isolada não prova remoção. Descrições de comunidade e ajuda original também devem permanecer distintas.

Experimentos devem ocorrer em ambiente local controlado, restaurando alterações. Não execute todo o inventário indiscriminadamente: alguns comandos alteram arquivos ou encerram sessões.

## Critérios de qualidade

- Afirmações de compatibilidade, remoção e restrição têm origem e contexto identificáveis.
- Texto incompleto não trava a extensão e não recebe reparos automáticos de formatação.
- O formatter preserva strings, comentários e a sequência dos comandos; formatar novamente não muda o resultado.
- O catálogo pode ser regenerado e suas pendências são visíveis.
- Recursos de edição funcionam offline; o pacote contém apenas os arquivos necessários.
- Testes reais do editor complementam testes do núcleo. Testes de editor não substituem ensaios no CS2.

Metas iniciais de desempenho: completion/hover abaixo de 50 ms no p95 e diagnósticos abaixo de 200 ms após debounce em uma CFG grande de referência. Esses números são objetivos, não resultados já medidos. Documente hardware, VS Code, tamanho do arquivo e catálogo antes de avaliar.

## Limites de escopo

Não executar CFGs automaticamente, alterar a instalação do jogo ou prometer ganho universal de FPS. Melhorias de desempenho do jogo precisam de medições comparáveis, incluindo frametime e variabilidade. Migração de comandos só deve ser oferecida quando a equivalência de comportamento e valores estiver verificada.

Consulte o [escopo inicial](initial-scope.md), o [estado atual](status.md) e a [arquitetura](../architecture.md).
