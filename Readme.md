[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]

# @pirxpilot/antiscroll

OS X Lion style cross-browser native scrolling on the web that gets out of the way.
It is a component compatible, jQuery free, clone of [LearnBoost/antiscroll]

Antiscroll fixes a fundamental problem JavaScript UI developers commonly face:
how do I customize scrollbars so that they get out of the way (for example, for
different form widgets), but retain their native scrolling properties (like OS
widge scrolling velocity, or OS specific inertia)?

Antiscroll addresses this issue by providing a cross-browser implementation of
the scrollbars popularized by OS X Lion that retains native properties.

## Installation

  Install with [npm]:

    $ npm install @pirxpilot/antiscroll

## Features

- Supports mousewheels, trackpads, other input devices natively.
- Doesn't magically autowrap your elements with divs (manual wrapping is necessary,
  please see `index.html` demo)
- Fade in/out controlled with CSS3 animations.
- Shows scrollbars upon hovering.
- Scrollbars are draggable.
- Size of container can be dynamically adjusted and scrollbars will adapt.

## Demo

Please click [here](http://pirxpilot.github.io/antiscroll/) to see it in
action.

## Installation

1. Wrap scrollable content with the class ```antiscroll-inner```
1. Wrap the above with the class ```antiscroll-wrap```
1. Include the following Javascript

```javascript
  const antiscroll = require('Antiscroll');

  antiscroll(document.querySelector('.antiscroll-wrap'));
```

### Configuration

You may remove automatic scrollbar hiding by passing in a key-value to the ```antiscroll()``` function like so:

```javascript
  antiscroll(el, {
    autoHide: false
  });
```

## How does it work?

The idea behind Antiscroll is to leverage real scrollbars, but hide them from the
view. The implementation consists of 3 steps.

### 1. Measure scrollbars width

In order to measure scrollbars width we use the following technique:

1. Insert a div with a fixed width and measure the inner width
2. Force `overflow: scroll`
3. Measure the inner width. The difference is the scrollbar width

The caveat of this technique is precisely OSX Lion. Since the scrollbars
_float_ on top of the content, their width is always zero but they still
overlay your content. To address this issue we add an aditional step which
consists of declaring `::-webkit-scrollbar` and `::scrollbar` CSS
pseudo-properties that set the width of the scrollbars to zero for modern
browsers.

### 2. Adjust the width of the inner element

The parent element receives `overflow: hidden` and the desired width and height
for the widget.

The inner `.antiscroll-inner` element receives the same width and height, but
the script augments this two values with the size of the scrollbars,
effectively hiding them.

![](http://f.cl.ly/items/431G35281X3t052m3J1V/Image%202011.11.23%2010:42:52%20AM.png)

The inner element is always `overflow: scroll`.

### 3. Listen on the scroll event

We attach the `scroll` event to the scrollable element, and we create our
scrollbars as absolutely positioned divs. We update our scrollbars based on the
detected `scrollLeft` and `scrollTop` of the element.

## Credits

This technique was inspired by Facebook's chat sidebar/ticker, which also reproduces
Lion's scrollbars, but relying on setting the width of the inner container to an
arbitrarily large width, therefore allowing scrolling of a single axis
(vertical).

Scrollbar size detection based on the work of [Jonathan
Sharp](http://jdsharp.us/jQuery/minute/calculate-scrollbar-width.php).

### Contributors

jQuery plugin written by [@guille]
Other contributors listed [here](https://github.com/pirxpilot/antiscroll/graphs/contributors)

## License

(The MIT License)

Copyright (c) 2011 Guillermo Rauch &lt;guillermo@learnboost.com&gt;
Copyright (c) 2012 [Damian Krzeminski](https://pirxpilot.me)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


[LearnBoost/antiscroll]: https://github.com/LearnBoost/antiscroll
[@guille]: https://github.com/guille
[npm]: https://www.npmjs.org/

[npm-image]: https://img.shields.io/npm/v/@pirxpilot/antiscroll
[npm-url]: https://npmjs.org/package/@pirxpilot/antiscroll

[build-url]: https://github.com/pirxpilot/antiscroll/actions/workflows/check.yaml
[build-image]: https://img.shields.io/github/actions/workflow/status/pirxpilot/antiscroll/check.yaml?branch=main
