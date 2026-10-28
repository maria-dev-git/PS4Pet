import { Component } from '@theme/component';

/** Keeps visual, reading and keyboard order aligned for an image/text pair. */
class SectionMobileOrder extends Component {
  #mobile = window.matchMedia('(max-width: 749px)');
  /** @type {Element[]} */
  #desktopOrder = [];

  connectedCallback() {
    super.connectedCallback();
    this.#mobile.addEventListener('change', this.#applyOrder);
    this.#applyOrder();
  }

  updatedCallback() {
    super.updatedCallback();
    this.#applyOrder();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#mobile.removeEventListener('change', this.#applyOrder);
  }

  #applyOrder = () => {
    const container = this.querySelector('[data-testid="section-content"]');
    if (!container) return;
    const children = [...container.children];
    // Other compositions keep their merchant-defined order.
    if (children.length !== 2) return;
    const image = children.find((child) => child.matches('.image-block'));
    const text = children.find((child) => child.matches('.group-block'));
    if (!image || !text) return;
    if (this.#desktopOrder.length !== 2 || !this.#desktopOrder.every((child) => children.includes(child))) {
      this.#desktopOrder = children;
    }
    const order = this.#mobile.matches
      ? this.dataset.mobileOrder === 'image_first' ? [image, text] : [text, image]
      : this.#desktopOrder;
    if (container.firstElementChild === order[0]) return;
    const activeElement = document.activeElement;
    const restoreFocus = activeElement instanceof HTMLElement && container.contains(activeElement);
    container.insertBefore(order[0], order[1]);
    if (restoreFocus && activeElement.isConnected) activeElement.focus({ preventScroll: true });
  };
}

if (!customElements.get('section-mobile-order')) {
  customElements.define('section-mobile-order', SectionMobileOrder);
}
