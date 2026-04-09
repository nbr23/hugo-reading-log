# Hugo Reading Log

A minimal single-page Hugo theme for displaying a personal reading log. Click an author to highlight all their books and see their country flag.

Optionally embeds an interactive world map showing author nationalities (via [around-the-word](https://github.com/nbr23/around-the-word) or any other map HTML).

## Quick Start

```
hugo new site my-reading-log
cd my-reading-log
git clone https://github.com/nbr23/hugo-reading-log themes/hugo-reading-log
```

Add to `hugo.toml`:

```toml
theme = "hugo-reading-log"

[taxonomies]

[params]
  mapEnabled = false
```

Create `content/_index.md`:

```md
---
---
```

Create `data/reading_log.yaml`:

```yaml
"2026":
  - title: Les Misérables
    authors: [Victor Hugo]

"2025":
  - title: L'Étranger
    authors: [Albert Camus]
  - title: Madame Bovary
    authors: [Gustave Flaubert]
```

Run `hugo server` and open http://localhost:1313.

## Data Files

All data goes in your site's `data/` directory. Hugo supports YAML, JSON, and TOML formats.

### `data/reading_log.yaml` (required)

Top-level keys are years (or any string like `"Previously..."`). Each year maps to a list of books.

```yaml
"2026":
  - title: Les Misérables
    authors: [Victor Hugo]
  - title: Fahrenheit 451
    authors: [Ray Bradbury]
    hidden: true

"Previously…":
  - title: L'Étranger
    authors: [Albert Camus]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Book title |
| `authors` | string[] | yes | Author names |
| `hidden` | bool | no | Hide from the list |

Years are sorted descending. A key named `"Previously…"` is always placed last.

### `data/authors_cache.yaml` (optional)

Maps author names to country names. Enables country flag display when clicking an author.

```yaml
Victor Hugo: France
Albert Camus: France
Gustave Flaubert: France
Marcel Proust: France
Alexandre Dumas: France
```

The theme already ships with [ISO 3166-1 country code data](https://gist.githubusercontent.com/ssskip/5a94bfcd2835bf1dea52/raw/59272a2d1c2122f0cedd83a76780a01d50726d98/ISO3166-1.alpha2.json) to convert country names to flag emojis — you don't need to provide that yourself.

## Configuration

```toml
[params]
  siteTitle = "My Reading Log"  # defaults to site title
  mapEnabled = true              # show the map panel (default: true)
  mapURL = "authors_map.html"    # path to map HTML in static/ (default: "authors_map.html")
```

## Map Integration

The theme can display any HTML map in a side panel via iframe. Set `mapEnabled = true` and place your map HTML in `static/`.

If you use [around-the-word](https://github.com/nbr23/around-the-word) to generate an author nationality map:

```sh
jq -r '.[][] | .authors[]?' data/reading_log.json | \
  around-the-word --colorscale reds --include-authors \
  -o static/authors_map.html -c data/authors_cache.json
```

## Features

- Single-page responsive layout (book list + optional map panel)
- Click an author to highlight all their books with country flag
- Hover a year heading to see book count
- Mobile: map opens as a full-screen overlay
- Print-friendly (hides map, shows full list)

## Requirements

Hugo >= 0.123.0 (extended edition not required).

## License

MIT
