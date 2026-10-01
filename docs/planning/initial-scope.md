# Escopo inicial

Os arquivos [autoexec.cfg](../../tests/fixtures/autoexec.cfg) e [practice.cfg](../../tests/fixtures/practice.cfg) orientam o primeiro fluxo completo de edição. Seus comandos, binds, aliases e exemplos de parâmetros devem ser reconhecidos pelo editor. Comentários são dados de referência, não instruções para executar.

O [inventário original](../../catalog/source/inventory.json) registra a coleta e seus hashes. As fixtures são editáveis; os hashes históricos não representam necessariamente seu conteúdo atual. Preservar mudanças locais faz parte do fluxo de desenvolvimento.

## Cobertura esperada

- Comandos e variáveis nas instruções ativas, inclusive dentro de binds e aliases.
- Aliases locais como símbolos do arquivo, sem promovê-los a comandos nativos.
- Comandos adicionais citados em comentários como candidatos ao catálogo, sem diagnósticos de execução nesses comentários.
- Valores observados, teclas e itens de compra como exemplos de completion.
- Referências entre os dois CFGs, com a diferença entre `exec` imediato e `exec` dentro de um bind.
- Formatação de espaços e separação visual, sem reordenar nem deduplicar comandos.

## Idiomas

Preservar descrições originais em inglês quando coletadas. Manter explicações comunitárias em inglês e traduções revisadas em pt-BR. A configuração de idioma deve atualizar a documentação sem reiniciar o editor e usar inglês quando faltar tradução.

## Casos que precisam de cuidado

- `true`, `false`, `0` e `1` não são intercambiáveis por uma regra global; verificar cada variável.
- Compras encadeadas dentro de strings exigem entender separadores sem alterar a ordem.
- A existência de um alvo em `ent_fire` e seu efeito dependem de contexto e build.
- `toggle bot_stop` não equivale necessariamente a um alias que altera outras variáveis.
- Reaplicar `autoexec` não desfaz automaticamente todas as alterações da CFG de treino.
- Mensagens de `echo` e nomes como `immortal` descrevem a intenção do autor, não provam funcionamento.
- Comandos de mira mudaram; registrar rejeições observadas e verificar substituições antes de migrar valores.

## Aceitação

Os recursos devem reconhecer o corpus sem falsos erros conhecidos, oferecer documentação bilíngue e navegação local, preservar seu fluxo de comandos após formatação e produzir um VSIX testado. Incompatibilidades comprovadas continuam sendo informadas. Verificação incompleta do jogo permanece explícita.
