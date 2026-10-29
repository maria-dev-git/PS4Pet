import { Component } from '@theme/component';

class JournalFilters extends Component {
  #controller;
  #cards;
  #intent = 0;

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#controller?.abort();
    this.#cards = undefined;
    this.#intent++;
  }

  /** @param {MouseEvent} event - Category activation. */
  async filter(event, expand = false) {
    const button = event.target instanceof Element ? event.target.closest('button[data-tag]') : null;
    const section = this.closest('.shopify-section');
    let sibling = section?.nextElementSibling;
    let results;
    while (sibling && !results) {
      results = sibling.querySelector('[data-journal-results]');
      sibling = sibling.nextElementSibling;
    }
    if (!(button instanceof HTMLButtonElement) || !(results instanceof HTMLElement)) return;
    const intent = ++this.#intent;
    for (const item of this.querySelectorAll('button[data-tag]')) {
      item.setAttribute('aria-pressed', String(item === button));
    }
    const status = results.querySelector('[data-journal-status]');
    if (status) status.textContent = '';
    results.setAttribute('aria-busy', 'true');
    try {
      // Read all server-rendered pages from this actual section, preserving its settings.
      // No alternate blog template or blog assignment in the category section is needed.
      this.#controller?.abort();
      const controller = new AbortController();
      this.#controller = controller;
      if (!this.#cards) {
        const cards = [];
        let url = new URL(location.href);
        url.searchParams.delete('page');
        url.searchParams.set('section_id', results.dataset.sectionId);
        const visited = new Set();
        while (url && !visited.has(url.href)) {
          visited.add(url.href);
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error('Journal request failed');
          const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
          const content = doc.querySelector('[data-journal-content]');
          if (!content) throw new Error('Journal section missing');
          cards.push(...content.querySelectorAll('.journal-card'));
          const next = content.querySelector('[data-journal-pagination] .next a');
          url = next ? new URL(next.getAttribute('href'), location.href) : null;
          if (url) url.searchParams.set('section_id', results.dataset.sectionId);
        }
        if (controller.signal.aborted || intent !== this.#intent) return;
        this.#cards = cards;
      }
      if (intent !== this.#intent) return;
      const tag = (button.dataset.tag || '').trim().toLocaleLowerCase();
      const matching = this.#cards.filter((card) => {
        const tags = JSON.parse(card.getAttribute('data-journal-tags') || '[]');
        return !tag || tags.some((value) => value.trim().toLocaleLowerCase() === tag);
      });
      const grid = results.querySelector('.journal-grid');
      if (grid) grid.replaceChildren(...matching.map((card) => card.cloneNode(true)));
      results.querySelector('[data-journal-pagination]')?.remove();
      results.toggleAttribute('data-expanded', expand);
      const expandButton = results.querySelector('[aria-controls]');
      if (expandButton) {
        expandButton.setAttribute('aria-expanded', String(expand));
        expandButton.hidden = expand || matching.length <= 3;
      }
      const empty = results.querySelector('[data-journal-empty]');
      if (empty instanceof HTMLElement) empty.hidden = matching.length !== 0;
    } catch (error) {
      if (intent === this.#intent && expand) results.removeAttribute('data-expanded');
      if (intent === this.#intent && error.name !== 'AbortError' && status) {
        status.textContent = results.dataset.error || '';
      }
    } finally {
      if (intent === this.#intent) results.removeAttribute('aria-busy');
    }
  }
}

if (!customElements.get('journal-filters')) customElements.define('journal-filters', JournalFilters);

class JournalArticles extends Component {
  /** Expand the currently selected category in this article section. */
  async expand() {
    let sibling = this.closest('.shopify-section')?.previousElementSibling;
    let filters;
    while (sibling && !filters) {
      filters = sibling.querySelector('journal-filters');
      sibling = sibling.previousElementSibling;
    }
    const selected = filters?.querySelector('button[aria-pressed="true"]');
    if (filters instanceof JournalFilters && selected) {
      await filters.filter({ target: selected }, true);
    } else {
      this.setAttribute('data-expanded', '');
      this.querySelector('[aria-controls]')?.setAttribute('aria-expanded', 'true');
    }
  }
}
if (!customElements.get('journal-articles')) customElements.define('journal-articles', JournalArticles);
