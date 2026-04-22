# Estrutura CSS Modular

Este projeto agora utiliza uma arquitetura CSS modular organizada por componentes.

## Estrutura de Pastas

```
css/
├── modules/
│   ├── base/
│   │   ├── variables.css    # Variáveis do design system
│   │   └── animations.css   # Keyframes e animações globais
│   ├── components/
│   │   ├── header.css       # Header e data
│   │   ├── progress.css     # Barra de progresso e estatísticas
│   │   ├── controls.css     # Filtros e botões
│   │   ├── search.css       # Campo de busca
│   │   ├── month-week.css   # Cards de mês/semana
│   │   ├── content-items.css # Itens de conteúdo
│   │   ├── video-cards.css  # Cards de vídeo
│   │   ├── timeline.css     # Semana 0
│   │   ├── complementary.css # Materiais complementares
│   │   ├── modal.css        # Modais
│   │   └── footer-pwa.css   # Footer e PWA
│   └── main.css             # Arquivo principal (importa tudo)
├── 6meses.css               # CSS antigo (backup)
└── geral.css                # CSS antigo (backup)
```

## Como Usar

Todas as páginas HTML agora importam apenas:

```html
<link rel="stylesheet" href="css/modules/main.css">
```

Ou para páginas em subpastas:

```html
<link rel="stylesheet" href="../css/modules/main.css">
<link rel="stylesheet" href="../../css/modules/main.css">
```

## Benefícios

1. **Manutenção facilitada**: Cada componente tem seu próprio arquivo
2. **Cache eficiente**: Arquivos menores podem ser cacheados separadamente
3. **Desenvolvimento paralelo**: Vários devs podem trabalhar em componentes diferentes
4. **Escopo claro**: Saber exatamente onde encontrar cada estilo
5. **Hot reloading**: Mudanças em um componente não afetam outros

## Convenções

- Use `var(--nome)` para variáveis do design system
- Componentes devem ser independentes quando possível
- Media queries ficam no final de cada arquivo
- Evite duplicação - use variáveis!

## Arquivos Legados

Os arquivos antigos (`6meses.css` e `geral.css`) foram mantidos como backup.
Para restaurar, basta mudar o import no HTML de volta para o caminho antigo.
