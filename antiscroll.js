const css = require('@pirxpilot/css');
const { Horizontal, Vertical } = require('./lib/scrollbar');

/**
 * Antiscroll pane constructor.
 *
 * @param {Element|jQuery} main pane
 * @parma {Object} options
 * @api public
 */

class Antiscroll {
  static of(...params) {
    return new Antiscroll(...params);
  }

  constructor(el, opts = {}) {
    this.el = el;
    this.options = opts;

    this.x = (false !== this.options.x) || this.options.forceHorizontal;
    this.y = (false !== this.options.y) || this.options.forceVertical;
    this.autoHide = false !== this.options.autoHide;
    this.padding = undefined === this.options.padding ? 2 : this.options.padding;

    this.inner = this.el.querySelector('.antiscroll-inner');

    this.rebuild();
  }

  /**
   * refresh scrollbars
   *
   * @api public
   */

  refresh() {
    const needHScroll = this.inner.scrollWidth > this.el.offsetWidth + (this.y ? scrollbarSize() : 0);
    const needVScroll = this.inner.scrollHeight > this.el.offsetHeight + (this.x ? scrollbarSize() : 0);

    if (this.x) {
      if (!this.horizontal && needHScroll) {
        this.horizontal = new Horizontal(this);
      } else if (this.horizontal && !needHScroll)  {
        this.horizontal.destroy();
        this.horizontal = null;
      } else if (this.horizontal) {
        this.horizontal.update();
      }
    }

    if (this.y) {
      if (!this.vertical && needVScroll) {
        this.vertical = new Vertical(this);
      } else if (this.vertical && !needVScroll)  {
        this.vertical.destroy();
        this.vertical = null;
      } else if (this.vertical) {
        this.vertical.update();
      }
    }
  }

  /**
   * Cleans up.
   *
   * @return {Antiscroll} for chaining
   * @api public
   */

  destroy() {
    if (this.horizontal) {
      this.horizontal.destroy();
      this.horizontal = null;
    }
    if (this.vertical) {
      this.vertical.destroy();
      this.vertical = null;
    }
    return this;
  }

  /**
   * Rebuild Antiscroll.
   *
   * @return {Antiscroll} for chaining
   * @api public
   */

  rebuild() {
    this.destroy();
    this.inner.removeAttribute('style');

    css(this.inner, {
      width:  this.inner.offsetWidth + (this.y ? scrollbarSize() : 0),
      height: this.inner.offsetHeight + (this.x ? scrollbarSize() : 0)
    });

    this.refresh();
    return this;
  }
}

/**
 * Scrollbar size detection.
 */

let size;

const template = `
<div id="antiscroll-size-detection"
  class="antiscroll-inner"
  style="width:50px;height:50px;overflow-y:scroll;position:absolute;top:-200px;left:-200px;">
    <div style="height:100px;width:100%"/>
</div>
`;

function scrollbarSize () {
  if (size === undefined) {
    document.body.insertAdjacentHTML('beforeend', template);

    const div = document.querySelector('#antiscroll-size-detection');
    size = div.offsetWidth - div.clientWidth;

    document.body.removeChild(div);

    if (size === 0) {
      // HACK: assume it's a floating scrollbars browser like FF on MacOS Lion
      size = 14;
    }
  }

  return size;
}

module.exports = Antiscroll;
