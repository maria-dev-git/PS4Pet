import { Component } from '@theme/component';

/** Adds mobile accordions to footer groups 2–7, preserving editable text nodes. */
class FooterMenus extends Component {
  #controller;
  #mobile = window.matchMedia('(max-width: 749px)');

  connectedCallback() {
    super.connectedCallback();
    this.#enhance();
    this.#controller?.abort();
    this.#controller = new AbortController();
    this.#mobile.addEventListener('change', this.#handleViewportChange, {
      signal: this.#controller.signal,
    });
    this.addEventListener('shopify:block:select', this.#revealSelectedBlock, {
      signal: this.#controller.signal,
    });
  }

  updatedCallback() {
    super.updatedCallback();
    this.#enhance();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#controller?.abort();
  }

  #enhance() {
    if (this.dataset.enabled !== 'true' || !this.#mobile.matches) {
      this.#restoreGroups();
      return;
    }

    for (const group of [...this.children].slice(1, 7)) {
      if (!group.matches('.group-block')) continue;
      const container = group.querySelector(':scope > .group-block-content');
      if (!(container instanceof HTMLElement)) continue;
      if (container.querySelector(':scope > .footer-menu-accordion')) continue;

      const blocks = [...container.children];
      if (blocks.length !== 2 || !blocks.every((node) => node.matches('.text-block'))) continue;
      const [heading, body] = blocks;
      const details = document.createElement('details');
      details.className = 'footer-menu-accordion';
      const summary = document.createElement('summary');
      summary.className = 'footer-menu-accordion__heading';
      const indicator = document.createElement('span');
      indicator.className = 'footer-menu-accordion__indicator';
      indicator.setAttribute('aria-hidden', 'true');
      const content = document.createElement('div');
      content.className = 'footer-menu-accordion__content';

      summary.append(heading, indicator);
      content.append(body);
      details.append(summary, content);
      container.append(details);
    }
  }

  #handleViewportChange = () => {
    this.#enhance();
  };

  #restoreGroups() {
    for (const details of this.querySelectorAll('.footer-menu-accordion')) {
      const heading = details.querySelector(':scope > summary > .text-block');
      const content = details.querySelector(':scope > .footer-menu-accordion__content');
      if (!heading || !content) continue;
      const activeElement = document.activeElement;
      const restoreFocus = activeElement instanceof HTMLElement && details.contains(activeElement);
      details.replaceWith(heading, ...content.children);
      if (restoreFocus && activeElement.isConnected) activeElement.focus({ preventScroll: true });
    }
  }
  /** @param {Event} event - Shopify editor block selection event. */
  #revealSelectedBlock = (event) => {
    if (!(event.target instanceof Element)) return;
    const details = event.target.closest('.footer-menu-accordion');
    if (details instanceof HTMLDetailsElement) details.open = true;
  };
}

if (!customElements.get('footer-menus')) {
  customElements.define('footer-menus', FooterMenus);
}
