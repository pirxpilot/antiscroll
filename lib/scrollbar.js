import events from '@pirxpilot/events';

class Scrollbar {
  /**
   * Scrollbar constructor.
   *
   * @param {Element|jQuery} element
   */

  constructor(pane, type) {
    pane.el.insertAdjacentHTML(
      'beforeend',
      `<div class="antiscroll-scrollbar antiscroll-scrollbar-${type}"/>`
    );
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
    this.innerEvents.bind('mousewheel', 'mousewheel', { passive: true });

    // show
    const initialDisplay = this.pane.options.initialDisplay;

    if (initialDisplay !== false) {
      this.show();
      if (this.pane.autoHide) {
        this.hiding = setTimeout(
          this.hide.bind(this),
          Number.parseInt(initialDisplay, 10) || 3000
        );
      }
    }
  }

  /**
   * Cleans up.
   *
   * @return {Scrollbar} for chaining
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
   */

  mouseenter() {
    this.enter = true;
    this.show();
  }

  /**
   * Called upon mouseleave.
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
   */

  mousedown(ev) {
    ev.preventDefault();

    this.dragging = true;
    this.el.classList.add('antiscroll-scrollbar-dragging');

    const scroll = matrix2position(getComputedStyle(this.el).transform);
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
   */

  cancelDragging() {
    if (!this.dragging) {
      return;
    }

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

export class Horizontal extends Scrollbar {
  constructor(pane) {
    super(pane, 'horizontal');
  }

  /**
   * Updates size/position of scrollbar.
   */

  update() {
    const paneWidth = this.pane.el.offsetWidth;
    const trackWidth = paneWidth - this.pane.padding * 2;
    const scrollWidth = this.pane.inner.scrollWidth;

    const translateX = Math.floor(
      (trackWidth * this.pane.inner.scrollLeft) / scrollWidth
    );
    this.el.style.transform = `translateX(${translateX}px)`;
    const width = Math.floor((trackWidth * paneWidth) / scrollWidth);
    this.el.style.width = `${width}px`;
    return paneWidth < scrollWidth;
  }

  /**
   * Called upon drag.
   */

  mousemove(ev) {
    const trackWidth = this.pane.el.offsetWidth - this.pane.padding * 2;
    const pos = ev.pageX - this.startPageX;
    const barWidth = this.el.offsetWidth;
    const innerEl = this.pane.inner;

    // minimum top is 0, maximum is the track height
    const y = Math.min(Math.max(pos, 0), trackWidth - barWidth);

    innerEl.scrollLeft =
      ((innerEl.scrollWidth - this.pane.el.offsetWidth) * y) /
      (trackWidth - barWidth);
  }

  /**
   * Called upon container mousewheel.
   */

  mousewheel(ev, _delta, x) {
    if (
      (x < 0 && 0 === this.pane.inner.scrollLeft) ||
      (x > 0 &&
        this.pane.inner.scrollLeft + Math.ceil(this.pane.el.offsetWidth) ===
          this.pane.inner.scrollWidth)
    ) {
      ev.preventDefault();
      return false;
    }
  }
}

export class Vertical extends Scrollbar {
  /**
   * Vertical scrollbar constructor
   */

  constructor(pane) {
    super(pane, 'vertical');
  }

  /**
   * Updates size/position of scrollbar.
   */

  update() {
    const paneHeight = this.pane.el.offsetHeight;
    const trackHeight = paneHeight - this.pane.padding * 2;
    const scrollHeight = this.pane.inner.scrollHeight;

    let scrollbarHeight = (trackHeight * paneHeight) / scrollHeight;
    scrollbarHeight = scrollbarHeight < 20 ? 20 : scrollbarHeight;

    let topPos = (trackHeight * this.pane.inner.scrollTop) / scrollHeight;

    if (topPos + scrollbarHeight > trackHeight) {
      const diff = topPos + scrollbarHeight - trackHeight;
      topPos = topPos - diff - 3;
    }

    scrollbarHeight = Math.floor(scrollbarHeight);
    topPos = Math.floor(topPos);

    this.el.style.height = `${scrollbarHeight}px`;
    this.el.style.transform = `translateY(${topPos}px)`;

    return paneHeight < scrollHeight;
  }

  /**
   * Called upon drag.
   */

  mousemove(ev) {
    const paneHeight = this.pane.el.offsetHeight;
    const trackHeight = paneHeight - this.pane.padding * 2;
    const pos = ev.pageY - this.startPageY;
    const barHeight = this.el.offsetHeight;
    const innerEl = this.pane.inner;

    // minimum top is 0, maximum is the track height
    const y = Math.min(Math.max(pos, 0), trackHeight - barHeight);

    innerEl.scrollTop =
      ((innerEl.scrollHeight - paneHeight) * y) / (trackHeight - barHeight);
  }

  /**
   * Called upon container mousewheel.
   */

  mousewheel(ev, _delta, _x, y) {
    if (
      (y > 0 && 0 === this.pane.inner.scrollTop) ||
      (y < 0 &&
        this.pane.inner.scrollTop + Math.ceil(this.pane.el.offsetHeight) ===
          this.pane.inner.scrollHeight)
    ) {
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
