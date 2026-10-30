import { Component } from '@theme/component';
import { morphSection } from '@theme/section-renderer';

class CollectionSelector extends Component {
  #controller;
  #intent = 0;

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#controller?.abort();
    this.#intent++;
  }

  /** @param {MouseEvent} event - Collection link activation. */
  async select(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    const grid = document.querySelector('results-list[section-id]');
    if (!(link instanceof HTMLAnchorElement) || !grid) return;
    event.preventDefault();
    const sectionId = grid.getAttribute('section-id');
    const intent = ++this.#intent;
    this.#controller?.abort();
    const controller = new AbortController();
    this.#controller = controller;
    const status = this.querySelector('[data-status]');
    if (status) status.textContent = '';
    grid.setAttribute('aria-busy', 'true');
    try {
      const url = new URL(link.href);
      const request = new URL(url);
      request.searchParams.set('section_id', sectionId);
      const response = await fetch(request, { signal: controller.signal });
      if (!response.ok) throw new Error('Collection request failed');
      const html = await response.text();
      if (intent !== this.#intent) return;
      await morphSection(sectionId, html, { injectStylesheet: true });
      if (intent !== this.#intent) return;
      // Facets and infinite scrolling read the current collection from this URL.
      history.replaceState(history.state, '', url);
      for (const item of this.querySelectorAll('a[href]')) {
        item.setAttribute('aria-current', String(item === link));
      }
    } catch (error) {
      if (intent === this.#intent && error.name !== 'AbortError' && status) {
        status.textContent = this.dataset.error || '';
      }
    } finally {
      if (intent === this.#intent) document.querySelector('results-list[section-id]')?.removeAttribute('aria-busy');
    }
  }
}

if (!customElements.get('collection-selector')) customElements.define('collection-selector', CollectionSelector);
