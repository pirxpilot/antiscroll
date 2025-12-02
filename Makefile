PROJECT=antiscroll
NODE_BIN=node_modules/.bin

all: check build

check: lint

lint:
	$(NODE_BIN)/biome ci

format:
	$(NODE_BIN)/biome check --fix

build: build/build.js build/build.css

build/build.js: antiscroll.js
	mkdir -p build
	$(NODE_BIN)/esbuild \
		--bundle \
		--global-name=${PROJECT} \
		--outfile=$@ \
		antiscroll.js

build/build.css: antiscroll.css
	cp $< $@

clean:
	rm -fr build

.PHONY: clean lint check all build format
