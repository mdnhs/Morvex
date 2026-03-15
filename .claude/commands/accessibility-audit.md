Perform an accessibility audit on the specified file or the entire theme: "$ARGUMENTS"

Check for:
1. **Images**: All `<img>` have `alt` attributes, decorative images use `alt=""`
2. **Headings**: Single `<h1>` per page, sequential heading levels (no skipping)
3. **Focus**: Visible focus indicators on all interactive elements, logical tab order
4. **Forms**: All inputs have associated labels, error messages use `aria-describedby`
5. **Color**: Contrast ratios meet WCAG 2.2 (4.5:1 small text, 3:1 large text)
6. **ARIA**: Proper use of roles, states, and properties. No redundant ARIA on semantic elements
7. **Navigation**: Wrapped in `<nav>`, current page uses `aria-current="page"`
8. **Modals/Drawers**: Have `role="dialog"`, focus trapping, Esc to close
9. **Touch targets**: Minimum 44x44px for interactive elements
10. **Motion**: Respect `prefers-reduced-motion` media query
11. **Skip links**: Present and functional

Fix all issues found and report what was changed.
