# Estado do projeto

A consolidação do documento mestre e a auditoria arquitetural estão concluídas. Veja a [auditoria](architecture-audit.md) e o [plano de implementação](implementation-plan.md). O registry reconhece os dois dumps completos, com estados de catálogo e proveniência por campo. Há agora um modelo efetivo local conservador, health check textual e mapa visual de binds somente leitura; workspace e builders permanecem planejados.

CS2 Config Tools tem um protótipo local de edição e formatação. O catálogo oferece explicações comunitárias em inglês e pt-BR, com exemplos extraídos das CFGs de referência. A versão vigente está em `package.json`; mudanças ficam no [changelog](../../CHANGELOG.md).

## Implementado

- Config Hub MVP em desenvolvimento: Activity Bar, Home, pasta autorizada/persistida, detecção Steam, listagem, resumos independentes, atalhos para mapa/health e criação exclusiva de CFG vazia. Builders aparecem como planejados; análise multiarquivo continua pendente. Veja [FEATURES](../../FEATURES.md).
- Filtro de categorias com menu colorido acessível, lista de binds com keycaps/descrições/comandos separados e identificação visual do caminho da CFG. Incluídos na distribuição solicitada; veja o [changelog](../../CHANGELOG.md).

- Refinamento do mapa visual: teclado com escala fixa e rolagem local, filtros recolhidos em painéis menores, mouse alinhado à esquerda e inspector com descrição primeiro e histórico apenas para múltiplas atribuições.

- Redesign do mapa de binds com teclado ANSI e mouse interativos em SVG, proporções físicas, filtros de categoria/estado, inspector com descrição/origem/histórico e detalhes de análise recolhidos. Componentes visuais reutilizáveis; edição de binds continua planejada. Veja o [registro do redesign](bind-map-svg-redesign.md).

- Mapa visual de binds somente leitura, com teclado de referência, mouse, numpad e lista de todos os nomes literais. Atualiza durante a edição, navega até origens/aliases/binds anteriores e preserva resultados parciais.

- Validação de metadados e referências, origem preservada e trivia/parentesco no parser.
- Documentação pura, exemplos revisados sem repetição da linha atual e mensagens de parâmetros.
- Modelo local com histórico de binds/atribuições, aliases em ordem e limites explícitos para execs, ciclos e ações desconhecidas.
- Análise compartilhada de repetição/substituição de binds, com resets, barreiras de incerteza, origem em aliases e links para o bind anterior; severidade configurável e contagens no health check.
- Outline, referências de aliases, sugestões de correção, inlays opcionais e comando de health check.

- Coleta de ConVars e comandos na mesma revisão, índice de candidatos, relatório de diferenças e promoção explícita com validação de hashes.
- Registry independente, documentação humana separada dos fatos técnicos e autocomplete normal/avançado.

- Parser com posições e tratamento de texto incompleto, comentários e corpos de binds/aliases.
- Completion, hover, navegação de aliases locais e links para CFGs existentes.
- Diagnósticos de sintaxe, símbolos ausentes e evidência opcional do console.
- Formatter de documento e seleção, com espaços e separação visual configuráveis.
- Núcleo independente do editor, fontes do catálogo em JSON e checks de geração/estilo.
- Testes automatizados, runner de integração no VS Code e empacotamento local.

A revisão da estrutura passou pelos testes do núcleo e do formatter, pelo check de estilo e pelos testes reais de providers no VS Code. A integração inclui formatação de documento e seleção. O VSIX foi regenerado com os novos caminhos; isso não valida o comportamento dos comandos dentro do CS2.

## A verificar

O mapa visual passou por regressões de domínio/protocolo, troca de origem com a mesma versão, navegação assíncrona e limites de documento. A interface foi revista em Chromium com DOM real, teclado e capturas de referência; veja o [registro de validação](bind-map-validation.md). A instalação pessoal do VS Code continua bloqueada por sua atualização, mas a suíte de integração passou em um host isolado 1.96.4, tanto sobre o projeto quanto sobre os arquivos extraídos do VSIX final. O [registro de entrega](release-validation.md) distingue os testes de providers da revisão do renderer e seus limites. O mapa usa o modelo estático e não foi validado dentro do CS2.

- Inventário, descrições originais e flags de uma build identificada do CS2.
- Tipos, assinaturas, intervalos, necessidade de cheats e funcionamento observado.
- Confirmar os metadados de mira já coletados de snapshot na build instalada, antes de qualquer migração; veja [as fontes e limitações](../crosshair.md).
- Semântica de escapes e situações de CFG não representadas pelas fixtures.
- Latência e memória no ambiente de referência.
- Hospedagem, publisher definitivo e processo de releases antes da publicação.

O relatório de console fornecido em 1 de outubro de 2026 registra rejeições de comandos de mira, mas não identifica a build. O perfil mantém essa limitação. Não houve teste desses comandos no jogo durante o desenvolvimento da extensão.

As páginas da Valve Developer Community retornaram HTTP 403 na pesquisa inicial. Documentação comunitária encontrada na web não foi usada para inventar migrações. A próxima coleta deve priorizar evidências da instalação e do servidor de teste.
