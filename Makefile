PROJECT=antiscroll

all: check build

check: lint

lint:
	jshint antiscroll.js

build: build/build.js build/build.css

build/build.js: node_modules antiscroll.js
	mkdir -p build
	browserify \
		--require component-event:event \
		--require component-query:query \
		--require ./antiscroll.js:$(PROJECT) \
		--outfile $@

build/build.css: antiscroll.css
	cp $< $@

node_modules: package.json
	npm install

clean:
	rm -fr build node_modules

.PHONY: clean lint check all build
