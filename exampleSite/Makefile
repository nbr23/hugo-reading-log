.PHONY: all serve map

all: map
	hugo --themesDir=../..

serve: map
	hugo server --themesDir=../..

map:
	uv run --with pyyaml python -c "import yaml; [print(a) for books in yaml.safe_load(open('data/reading_log.yaml')).values() for b in books if not b.get('hidden') for a in (b.get('authors') or [])]" | \
		uvx around-the-word --colorscale reds --include-authors \
		-o static/authors_map.html -c data/authors_cache.json
