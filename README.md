# Shizuru portfolio

Public website: https://shizuru892.github.io/

Edit artwork and collection order in `portfolio.json`. Artwork files live in `assets/`.

After changing portfolio content, page markup or scripts, run:

```sh
node scripts/build-seo.mjs
```

Commit the generated HTML pages, sitemap and robots file with the content changes. GitHub Pages publishes the root of `main`.

The builder reuses the browser rendering functions, so the static HTML and interactive gallery show the same content. It generates page titles, descriptions, canonical URLs, social previews, structured data, an image sitemap and a custom 404 page. Existing Google verification meta tags are preserved.
