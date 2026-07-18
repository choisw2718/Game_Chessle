# Chessle

Play the public site: **https://choisw2718.github.io/Game_Chessle/**

Chessle is a browser-based chess opening guessing game. This public edition contains only:

- Daily puzzle
- Random puzzle
- Local statistics

Database browsing and review features are intentionally excluded. Game progress and statistics stay in the player's browser.

## Local development

```bash
npm ci
npm run dev
```

## Deployment

Pushes to `main` are exported as a static Next.js site and deployed through GitHub Pages. The workflow lives at `.github/workflows/pages.yml`.
