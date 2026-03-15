Add theme settings to the section or schema specified: "$ARGUMENTS"

Follow these rules:
1. Read the existing section/schema file first
2. Add settings using proper Shopify setting types (text, richtext, image_picker, color, range, select, checkbox, url, etc.)
3. Use translatable labels: `"t:sections.SECTION_NAME.settings.SETTING_ID.label"`
4. Add corresponding translation keys to `locales/en.default.schema.json`
5. Include sensible defaults for all settings
6. Add `info` text for settings that need explanation
7. Group related settings logically
8. Wire up the new settings in the Liquid template code
9. Ensure the section renders correctly with default values
