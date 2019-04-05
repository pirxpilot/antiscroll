const css = require('css');
const events = require('@pirxpilot/events');

let passiveFlag = false;

try {
  window.addEventListener(
    "test",
    null,
    Object.defineProperty({}, "passive", {
      get() { passiveFlag = { passive: true }; }
  }));
} catch(err) {}


class Scrollbar {
  /**
   * Scrollbar constructor.
   *
   * @param {Element|jQuery} element
   * @api public
   */

  constructor(pane, type) {
    pane.el.insertAdjacentHTML('beforeend', `<div class="antiscroll-scrollbar antiscroll-scrollbar-${type}"/>`);
    this.el = pane.el.querySelector(`.antiscroll-scrollbar-${type}`);

    this.pane = pane;
    this.pane.el.appendChild(this.el);

    this.dragging = false;
    this.enter = false;
    this.shown = false;

    // hovering
    this.paneEvents = events(this.pane.el, this);
    this.paneEvents.bind('mouseenter');
    this.paneEvents.bind('mouseleave');

    // dragging
    this.events = events(this.el, this);
    this.events.bind('mousedown');

    // scrolling
    this.innerEvents = events(this.pane.inner, this);
    this.innerEvents.bind('scroll');
    this.innerEvents.bind('mousewheel', 'mousewheel', passiveFlag);

    // show
    const initialDisplay = this.pane.options.initialDisplay;

    if (initialDisplay !== false) {
      this.show();
      if (this.pane.autoHide) {
        this.hiding = setTimeout(this.hide.bind(this), parseInt(initialDisplay, 10) || 3000);
      }
    }
  }

  /**
   * Cleans up.
   *
   * @return {Scrollbar} for chaining
   * @api public
   */

  destroy() {
    this.innerEvents.unbind();
    this.events.unbind();
    this.paneEvents.unbind();
    this.el.parentNode.removeChild(this.el);
    return this;
  }

  /**
   * Called upon mouseenter.
   *
   * @api private
   */

  mouseenter() {
    this.enter = true;
    this.show();
  }

  /**
   * Called upon mouseleave.
   *
   * @api private
   */

  mouseleave() {
    this.enter = false;

    if (!this.dragging) {
      if (this.pane.autoHide) {
        this.hide();
      }
    }
  }

  /**
   * Called upon wrap scroll.
   *
   * @api private
   */

  scroll() {
    if (!this.shown) {
      this.show();
      if (!this.enter && !this.dragging) {
        if (this.pane.autoHide) {
          this.hiding = setTimeout(this.hide.bind(this), 1500);
        }
      }
    }

    this.update();
  }

  /**
   * Called upon scrollbar mousedown.
   *
   * @api private
   */

  mousedown(ev) {
    ev.preventDefault();

    this.dragging = true;
    this.el.classList.add('antiscroll-scrollbar-dragging');

    const scroll = matrix2position(css(this.el, 'transform'));
    this.startPageX = ev.pageX - scroll[0];
    this.startPageY = ev.pageY - scroll[1];

    this.ownerEvents = events(this.el.ownerDocument, this);

    // prevent crazy selections on IE
    this.el.ownerDocument.onselectstart = () => false;

    this.ownerEvents.bind('mousemove');
    this.ownerEvents.bind('mouseup', 'cancelDragging');
  }

  /**
   * Called on mouseup to cancel dragging
   *
   * @api private
   */

  cancelDragging() {
    this.dragging = false;
    this.el.classList.remove('antiscroll-scrollbar-dragging');

    this.el.ownerDocument.onselectstart = null;

    this.ownerEvents.unbind();
    this.ownerEvents = null;

    if (!this.enter) {
      this.hide();
    }
  }

  /**
   * Show scrollbar.
   *
   * @api private
   */

  show() {
    if (!this.shown && this.update()) {
      this.el.classList.add('antiscroll-scrollbar-shown');
      if (this.hiding) {
        clearTimeout(this.hiding);
        this.hiding = null;
      }
      this.shown = true;
    }
  }

  /**
   * Hide scrollbar.
   *
   * @api private
   */

  hide() {
    if (this.pane.autoHide !== false && this.shown) {
      // check for dragging
      this.el.classList.remove('antiscroll-scrollbar-shown');
      this.shown = false;
    }
  }
}

/**
 * Inherits from Scrollbar.
 */

class Horizontal extends Scrollbar {
  /**
   * Horizontal scrollbar constructor
   *
   * @api private
   */

  constructor(pane) {
    super(pane, 'horizontal');
  }

  /**
   * Updates size/position of scrollbar.
   *
   * @api private
   */

  update() {
    const paneWidth = this.pane.el.offsetWidth;
    const trackWidth = paneWidth - this.pane.padding * 2;
    const scrollWidth = this.pane.inner.scrollWidth;

    css(this.el, {
      width: Math.floor(trackWidth * paneWidth / scrollWidth),
      transform: `translateX(${Math.floor(trackWidth * this.pane.inner.scrollLeft / scrollWidth)}px)`
    });

    return paneWidth < scrollWidth;
  }

  /**
   * Called upon drag.
   *
   * @api private
   */

  mousemove(ev) {
    const trackWidth = this.pane.el.offsetWidth - this.pane.padding * 2;
    const pos = ev.pageX - this.startPageX;
    const barWidth = this.el.offsetWidth;
    const innerEl = this.pane.inner;

    // minimum top is 0, maximum is the track height
    const y = Math.min(Math.max(pos, 0), trackWidth - barWidth);

    innerEl.scrollLeft = (innerEl.scrollWidth - this.pane.el.offsetWidth) * y / (trackWidth - barWidth);
  }

  /**
   * Called upon container mousewheel.
   *
   * @api private
   */

  mousewheel(ev, delta, x) {
    if ((x < 0 && 0 === this.pane.inner.scrollLeft) ||
        (x > 0 && (this.pane.inner.scrollLeft + Math.ceil(this.pane.el.offsetWidth) === this.pane.inner.scrollWidth))) {
      ev.preventDefault();
      return false;
    }
  }

}

class Vertical extends Scrollbar {
  /**
   * Vertical scrollbar constructor
   *
   * @api private
   */

  constructor(pane) {
    super(pane, 'vertical');
  }

  /**
   * Updates size/position of scrollbar.
   *
   * @api private
   */

  update() {
    const paneHeight = this.pane.el.offsetHeight;
    const trackHeight = paneHeight - this.pane.padding * 2;
    const scrollHeight = this.pane.inner.scrollHeight;

    let scrollbarHeight = trackHeight * paneHeight / scrollHeight;
    scrollbarHeight = scrollbarHeight < 20 ? 20 : scrollbarHeight;

    let topPos = trackHeight * this.pane.inner.scrollTop / scrollHeight;

    if((topPos + scrollbarHeight) > trackHeight) {
      const diff = (topPos + scrollbarHeight) - trackHeight;
      topPos = topPos - diff - 3;
    }

    scrollbarHeight = Math.floor(scrollbarHeight);
    topPos = Math.floor(topPos);

    css(this.el, {
      height: scrollbarHeight,
      transform: `translateY(${topPos}px)`
    });

    return paneHeight < scrollHeight;
  }

  /**
   * Called upon drag.
   *
   * @api private
   */

  mousemove(ev) {
    const paneHeight = this.pane.el.offsetHeight;
    const trackHeight = paneHeight - this.pane.padding * 2;
    const pos = ev.pageY - this.startPageY;
    const barHeight = this.el.offsetHeight;
    const innerEl = this.pane.inner;

    // minimum top is 0, maximum is the track height
    const y = Math.min(Math.max(pos, 0), trackHeight - barHeight);

    innerEl.scrollTop = (innerEl.scrollHeight - paneHeight) * y / (trackHeight - barHeight);
  }

  /**
   * Called upon container mousewheel.
   *
   * @api private
   */

  mousewheel(ev, delta, x, y) {
    if ((y > 0 && 0 === this.pane.inner.scrollTop) ||
        (y < 0 && (this.pane.inner.scrollTop + Math.ceil(this.pane.el.offsetHeight) === this.pane.inner.scrollHeight))) {
      ev.preventDefault();
      return false;
    }
  }
}

/**
 * Calculate scrollbar position from transform matrix
 *
 * Transform matrix looks like this: matrix(1, 0, 0, 1, X, Y) - we are only interested in 2 last numbers
 */

function matrix2position(str) {
  const match = str.match(/^\w+\((.+)\)/);
  if (!match) {
    return [0, 0];
  }
  return match[1].split(/,\s+/).map(Number).slice(-2);
}

module.exports = {
  Horizontal,
  Vertical
};
