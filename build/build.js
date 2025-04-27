var antiscroll = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // antiscroll.js
  var antiscroll_exports = {};
  __export(antiscroll_exports, {
    Antiscroll: () => Antiscroll
  });

  // node_modules/@pirxpilot/events/index.js
  function events(el, obj) {
    const handlers = /* @__PURE__ */ new Map();
    function bind(name, handler, opts) {
      if (!handler) {
        handler = name;
      }
      if (typeof handler === "string") {
        handler = obj[handler].bind(obj);
      }
      el.addEventListener(name, handler, opts);
      handlers.set(name, {
        handler,
        opts
      });
    }
    function do_unbind(name) {
      const h = handlers.get(name);
      if (h) {
        el.removeEventListener(name, h.handler, h.opts);
        handlers.delete(name);
      }
    }
    function unbind(name) {
      return name ? do_unbind(name) : unbindAll();
    }
    function unbindAll() {
      handlers.forEach((h, name) => el.removeEventListener(name, h.handler, h.opts));
      handlers.clear();
    }
    return {
      bind,
      unbind
    };
  }

  // lib/scrollbar.js
  var Scrollbar = class {
    /**
     * Scrollbar constructor.
     *
     * @param {Element|jQuery} element
     */
    constructor(pane, type) {
      pane.el.insertAdjacentHTML(
        "beforeend",
        `<div class="antiscroll-scrollbar antiscroll-scrollbar-${type}"/>`
      );
      this.el = pane.el.querySelector(`.antiscroll-scrollbar-${type}`);
      this.pane = pane;
      this.pane.el.appendChild(this.el);
      this.dragging = false;
      this.enter = false;
      this.shown = false;
      this.paneEvents = events(this.pane.el, this);
      this.paneEvents.bind("mouseenter");
      this.paneEvents.bind("mouseleave");
      this.events = events(this.el, this);
      this.events.bind("mousedown");
      this.innerEvents = events(this.pane.inner, this);
      this.innerEvents.bind("scroll");
      this.innerEvents.bind("mousewheel", "mousewheel", { passive: true });
      const initialDisplay = this.pane.options.initialDisplay;
      if (initialDisplay !== false) {
        this.show();
        if (this.pane.autoHide) {
          this.hiding = setTimeout(
            this.hide.bind(this),
            Number.parseInt(initialDisplay, 10) || 3e3
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
      this.el.classList.add("antiscroll-scrollbar-dragging");
      const scroll = matrix2position(getComputedStyle(this.el).transform);
      this.startPageX = ev.pageX - scroll[0];
      this.startPageY = ev.pageY - scroll[1];
      this.ownerEvents = events(this.el.ownerDocument, this);
      this.el.ownerDocument.onselectstart = () => false;
      this.ownerEvents.bind("mousemove");
      this.ownerEvents.bind("mouseup", "cancelDragging");
    }
    /**
     * Called on mouseup to cancel dragging
     */
    cancelDragging() {
      if (!this.dragging) {
        return;
      }
      this.dragging = false;
      this.el.classList.remove("antiscroll-scrollbar-dragging");
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
        this.el.classList.add("antiscroll-scrollbar-shown");
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
        this.el.classList.remove("antiscroll-scrollbar-shown");
        this.shown = false;
      }
    }
  };
  var Horizontal = class extends Scrollbar {
    constructor(pane) {
      super(pane, "horizontal");
    }
    /**
     * Updates size/position of scrollbar.
     */
    update() {
      const paneWidth = this.pane.el.offsetWidth;
      const trackWidth = paneWidth - this.pane.padding * 2;
      const scrollWidth = this.pane.inner.scrollWidth;
      const translateX = Math.floor(
        trackWidth * this.pane.inner.scrollLeft / scrollWidth
      );
      this.el.style.transform = `translateX(${translateX}px)`;
      const width = Math.floor(trackWidth * paneWidth / scrollWidth);
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
      const y = Math.min(Math.max(pos, 0), trackWidth - barWidth);
      innerEl.scrollLeft = (innerEl.scrollWidth - this.pane.el.offsetWidth) * y / (trackWidth - barWidth);
    }
    /**
     * Called upon container mousewheel.
     */
    mousewheel(ev, _delta, x) {
      if (x < 0 && 0 === this.pane.inner.scrollLeft || x > 0 && this.pane.inner.scrollLeft + Math.ceil(this.pane.el.offsetWidth) === this.pane.inner.scrollWidth) {
        ev.preventDefault();
        return false;
      }
    }
  };
  var Vertical = class extends Scrollbar {
    /**
     * Vertical scrollbar constructor
     */
    constructor(pane) {
      super(pane, "vertical");
    }
    /**
     * Updates size/position of scrollbar.
     */
    update() {
      const paneHeight = this.pane.el.offsetHeight;
      const trackHeight = paneHeight - this.pane.padding * 2;
      const scrollHeight = this.pane.inner.scrollHeight;
      let scrollbarHeight = trackHeight * paneHeight / scrollHeight;
      scrollbarHeight = scrollbarHeight < 20 ? 20 : scrollbarHeight;
      let topPos = trackHeight * this.pane.inner.scrollTop / scrollHeight;
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
      const y = Math.min(Math.max(pos, 0), trackHeight - barHeight);
      innerEl.scrollTop = (innerEl.scrollHeight - paneHeight) * y / (trackHeight - barHeight);
    }
    /**
     * Called upon container mousewheel.
     */
    mousewheel(ev, _delta, _x, y) {
      if (y > 0 && 0 === this.pane.inner.scrollTop || y < 0 && this.pane.inner.scrollTop + Math.ceil(this.pane.el.offsetHeight) === this.pane.inner.scrollHeight) {
        ev.preventDefault();
        return false;
      }
    }
  };
  function matrix2position(str) {
    const match = str.match(/^\w+\((.+)\)/);
    if (!match) {
      return [0, 0];
    }
    return match[1].split(/,\s+/).map(Number).slice(-2);
  }

  // antiscroll.js
  var Antiscroll = class _Antiscroll {
    static of(...params) {
      return new _Antiscroll(...params);
    }
    constructor(el, opts = {}) {
      this.el = el;
      this.options = opts;
      this.x = false !== this.options.x || this.options.forceHorizontal;
      this.y = false !== this.options.y || this.options.forceVertical;
      this.autoHide = false !== this.options.autoHide;
      this.padding = void 0 === this.options.padding ? 2 : this.options.padding;
      this.inner = this.el.querySelector(".antiscroll-inner");
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
        } else if (this.horizontal && !needHScroll) {
          this.horizontal.destroy();
          this.horizontal = null;
        } else if (this.horizontal) {
          this.horizontal.update();
        }
      }
      if (this.y) {
        if (!this.vertical && needVScroll) {
          this.vertical = new Vertical(this);
        } else if (this.vertical && !needVScroll) {
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
      this.inner.removeAttribute("style");
      const width = this.inner.offsetWidth + (this.y ? scrollbarSize() : 0);
      const height = this.inner.offsetHeight + (this.x ? scrollbarSize() : 0);
      this.inner.style.width = `${width}px`;
      this.inner.style.height = `${height}px`;
      this.refresh();
      return this;
    }
  };
  var size;
  var template = `
<div id="antiscroll-size-detection"
  class="antiscroll-inner"
  style="width:50px;height:50px;overflow-y:scroll;position:absolute;top:-200px;left:-200px;">
    <div style="height:100px;width:100%"/>
</div>
`;
  function scrollbarSize() {
    if (size === void 0) {
      document.body.insertAdjacentHTML("beforeend", template);
      const div = document.querySelector("#antiscroll-size-detection");
      size = div.offsetWidth - div.clientWidth;
      div.remove();
    }
    return size;
  }
  return __toCommonJS(antiscroll_exports);
})();
