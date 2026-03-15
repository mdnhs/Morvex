Create a new Shopify theme snippet named "$ARGUMENTS".

Follow these rules:
1. Create the snippet file in `snippets/` using lowercase hyphen-separated naming
2. Document expected parameters at the top of the file with comments
3. Use `{% render %}` compatible patterns (no global variable access)
4. Accept all data via explicit parameters
5. Create matching CSS in `assets/` prefixed with `component-` if needed
6. Use BEM CSS naming convention
7. Ensure accessibility: alt texts, ARIA attributes, semantic HTML
8. Use defensive coding: check for nil/blank values before rendering
9. Use translation keys for all user-facing text
