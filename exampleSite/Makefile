.PHONY: all serve map

all: map
	hugo --themesDir=../..

serve: map
	hugo server --themesDir=../..

map:
	jq -r '.[][] | .authors[]?' data/reading_log.json | \
		uvx around-the-word --colorscale reds --include-authors \
		-o static/authors_map.html -c data/authors_cache.json
