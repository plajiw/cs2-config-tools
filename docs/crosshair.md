# Mira: snapshot de setembro de 2026

O catálogo inclui os nomes atuais de tamanho, espessura, espaço, canais de cor/opacidade, contorno e estilos de mira. As entradas guardam defaults, limites e fonte vinculada a uma revisão imutável de 30/09/2026. Isso identifica o snapshot consultado, não a build instalada pelo usuário.

Fontes: [dump de convars](https://github.com/SteamTracking/GameTracking-CS2/blob/6ac247908a83c309b37314fd097c47dc78103746/DumpSource2/convars.txt) e [notas oficiais da Valve](https://steamcommunity.com/app/730/announcements/?l=english).

## Medidas e resolução

As notas de 23/09 esclarecem que as medidas são pixels na resolução em que a mira foi configurada. Ao trocar de resolução, o jogo reescala os valores para preservar a proporção visual. Portanto, não se deve prometer que uma espessura ficará com o mesmo número de pixels em qualquer resolução.

Os comandos `cl_crosshair_length`, `cl_crosshair_thickness` e `cl_crosshair_gap` têm limites no dump. O gap pode ser negativo; ele é um deslocamento, não simplesmente a medida absoluta do espaço final. A extensão apresenta esses dados no hover.

## Nomes históricos

`cl_crosshairsize`, `cl_crosshairthickness` e `cl_crosshairalpha` aparecem com flag `hidden`, sem descrição. O catálogo informa esse estado e sugere os controles atuais relacionados. A flag sozinha não prova que sejam aliases nem que produzam o mesmo efeito com o mesmo valor.

O aviso é informativo. Não há Quick Fix que troque nomes ou valores automaticamente. Para preservar a aparência de uma mira antiga, é necessário ajustar os controles atuais no jogo.

Os quatro comandos rejeitados no relato de console anterior continuam associados àquela evidência. Não foram convertidos em uma afirmação de remoção global.

## Exemplos

O hover usa os valores padrão do snapshot como exemplos de sintaxe. Esses exemplos não são uma recomendação de mira, e os multiplicadores de opacidade/divisão podem depender do estilo. As descrições dos controles de divisão mantêm a referência ao estilo 2, conforme a ajuda consultada.

Nenhuma CFG do usuário foi migrada ou executada. Os testes verificam o catálogo e o comportamento da extensão; o funcionamento dentro da instalação local do CS2 permanece uma verificação separada.
