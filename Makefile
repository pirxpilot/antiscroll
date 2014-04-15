all: lint build

lint:
	@jshint antiscroll.js

build: components antiscroll.js antiscroll.css template.html
	@component build --dev
	@autoprefixer build/build.css

components: component.json
	@component install --dev

clean:
	rm -fr build components

.PHONY: clean
