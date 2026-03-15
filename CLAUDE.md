# Morvex - Shopify Theme

## Project Overview
This is **Morvex**, a custom Shopify theme built on Online Store 2.0 architecture (based on Dawn).

## Theme Structure
```
assets/        → CSS, JS, images, SVGs
config/        → settings_schema.json, settings_data.json
layout/        → theme.liquid, password.liquid
locales/       → Translation JSON files
sections/      → Merchant-customizable content sections
snippets/      → Reusable Liquid partials
templates/     → JSON templates (OS 2.0)
```

## CLI Commands
```bash
shopify theme dev                              # Start local dev server
shopify theme dev --store STORE.myshopify.com  # Dev with specific store
shopify theme push                             # Push to store
shopify theme pull                             # Pull from store
shopify theme check                            # Lint with Theme Check
shopify theme list                             # List all themes
```

## MCP Server
This project uses `@shopify/dev-mcp` for Shopify API docs, GraphQL introspection, and theme validation.

---

## Liquid Rules

### MUST follow
- **Always use `{% render %}`** — NEVER use `{% include %}` (deprecated)
- Pass data explicitly: `{% render 'card-product', product: item, show_badge: true %}`
- Only ONE `{% schema %}` tag per section file, containing valid JSON
- All setting IDs must be unique within a section
- Always include `{{ block.shopify_attributes }}` when rendering blocks
- Never hardcode English text — use `{{ 'key.path' | t }}` for all user-facing strings
- Use `content_for_header` and `content_for_layout` in layout files

### Naming Conventions
- All filenames: lowercase, hyphen-separated (`card-product.liquid`, `main-collection-product-grid.liquid`)
- CSS: prefix with `component-` or `section-` (`component-card.css`, `section-image-banner.css`)
- JS: match the component name (`product-form.js`, `cart-drawer.js`)

### Pagination
```liquid
{% paginate collection.products by 12 %}
  {% for product in collection.products %}
    {% render 'card-product', product: product %}
  {% endfor %}
  {{ paginate | default_pagination }}
{% endpaginate %}
```

### Images
```liquid
{{ image | image_url: width: 400 | image_tag: loading: 'lazy', alt: image.alt }}
```

### Money
```liquid
{{ product.price | money }}
```

---

## CSS Rules
- **BEM naming**: `.product-card`, `.product-card__title`, `.product-card__title--sale`
- Use CSS custom properties for design tokens
- Scope section styles with `#shopify-section-{{ section.id }}`
- Use logical properties (`margin-inline-start`) for RTL support
- Use `min()`, `max()`, `clamp()` for fluid typography/spacing
- Keep CSS bundles under 16 KB minified
- No heavy CSS frameworks via CDN

## JavaScript Rules
- **Web Components pattern**: extend `HTMLElement` for custom elements
- No heavy frameworks (React, Vue, jQuery) in theme code
- Use native browser APIs and modern DOM methods
- All scripts must be `defer` or `async` — never parser-blocking
- Keep JS bundles under 16 KB minified
- Use Pub/Sub pattern (custom events) for component communication
- Progressive enhancement: core functionality must work without JS

## Accessibility (WCAG 2.2)
- Lighthouse accessibility score minimum: 90
- All `<img>` require `alt` attribute (`alt=""` for decorative)
- Visible focus indicators on all interactive elements
- Single `<h1>` per page, sequential heading levels
- Color contrast: 4.5:1 small text, 3:1 large text/icons
- Touch targets: minimum 44x44px
- Modals: `role="dialog"`, focus trap, Esc to close, return focus
- Form fields: always have labels (`<label>`, `aria-label`, or visually hidden)
- Never use color alone to convey information

## Performance
- Lighthouse performance score minimum: 60
- Lazy load below-fold images: `loading: 'lazy'`
- Use `image_tag` filter for responsive srcsets
- Host all assets on Shopify CDN (use `| asset_url`)
- Preload max 2 resources per template
- Perform Liquid operations (sort, filter) BEFORE loops, not inside
- Avoid `.liquid` extension on CSS/JS files (prevents caching)

## Section Schema Template
```json
{
  "name": "t:sections.SECTION_NAME.name",
  "tag": "section",
  "class": "section",
  "settings": [],
  "blocks": [],
  "presets": [
    {
      "name": "t:sections.SECTION_NAME.presets.name"
    }
  ]
}
```

## Translation Keys
- Store in `locales/en.default.json`
- Schema translations in `locales/en.default.schema.json`
- Use `"t:sections.section_name.name"` pattern in schema
