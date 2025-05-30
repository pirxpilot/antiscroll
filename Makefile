PROJECT=antiscroll

all: check build

check: lint

lint:
	biome ci

format:
	biome check --fix

build: build/build.js build/build.css

build/build.js: node_modules antiscroll.js
	mkdir -p build
	esbuild \
		--bundle \
		--global-name=${PROJECT} \
		--outfile=$@ \
		antiscroll.js

build/build.css: antiscroll.css
	cp $< $@

node_modules: package.json
	yarn

clean:
	rm -fr build node_modules

.PHONY: clean lint check all build format
