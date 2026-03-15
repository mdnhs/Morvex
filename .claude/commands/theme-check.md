Run Shopify Theme Check to lint the theme and fix any issues found.

Steps:
1. Run `shopify theme check` via the CLI
2. If the MCP `validate_theme` tool is available, also use it for additional validation
3. Analyze the output and categorize issues by severity (error, warning, suggestion)
4. Fix all errors automatically
5. Fix warnings where the fix is clear and safe
6. Report any suggestions that need human decision
7. Re-run theme check to verify fixes
