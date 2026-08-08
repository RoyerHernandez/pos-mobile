# CLAUDE.md

## Project
PWA frontend for POS table management. Vanilla HTML/CSS/JS, no frameworks.

## API
- Base URL: configured in js/api.js (default http://localhost:8080/api/pos/v1)
- Auth: JWT Bearer token in Authorization header
- See RFC-001 in the pos-system repo for full endpoint reference

## Conventions
- ES6 modules (import/export)
- Mobile-first CSS with CSS custom properties for theming
- No build step - files served directly
- Spanish UI labels, English code/variable names
