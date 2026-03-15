/**
 * PRESTIGE THEME — theme.js
 * Main JavaScript for the luxury editorial Shopify theme
 *
 * Sections:
 *  1. Utility helpers
 *  2. Header scroll behavior
 *  3. Mobile menu
 *  4. Cart drawer
 *  5. Add-to-cart AJAX
 *  6. Cart quantity updates
 *  7. Intersection Observer animations
 *  8. Product page: gallery + variant selector
 *  9. Accordion
 * 10. Collection filter drawer (mobile)
 * 11. Product grid view toggle
 * 12. Toast notifications
 * 13. Newsletter form
 * 14. Init
 */

'use strict';

/* =============================================================================
   1. Utility Helpers
   ============================================================================= */

const Prestige = {
  /**
   * Debounce a function call
   */
  debounce(fn, delay = 250) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Throttle a function call
   */
  throttle(fn, limit = 100) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Format money (Shopify returns cents as integer)
   * Uses window.Shopify.money_format if available
   */
  formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    const value = (parseInt(cents, 10) / 100).toFixed(2);
    const moneyFormat = format || window.Prestige?.moneyFormat || '${{amount}}';

    return moneyFormat
      .replace('{{amount}}', value)
      .replace('{{amount_no_decimals}}', Math.floor(parseInt(cents, 10) / 100))
      .replace('{{amount_with_comma_separator}}', value.replace('.', ','))
      .replace('{{amount_no_decimals_with_comma_separator}}', String(Math.floor(parseInt(cents, 10) / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  },

  /**
   * Fetch wrapper with JSON
   */
  async fetchJSON(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Trap focus within an element (accessibility)
   */
  trapFocus(element) {
    const focusable = element.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleTab(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    element._trapFocusHandler = handleTab;
    element.addEventListener('keydown', handleTab);
    first.focus();
  },

  /**
   * Remove focus trap
   */
  removeTrapFocus(element) {
    if (element._trapFocusHandler) {
      element.removeEventListener('keydown', element._trapFocusHandler);
      delete element._trapFocusHandler;
    }
  },
};

/* =============================================================================
   2. Header Scroll Behavior
   ============================================================================= */

class Header {
  constructor() {
    this.header = document.getElementById('site-header');
    if (!this.header) return;

    this.isTransparent = this.header.classList.contains('header--transparent');
    this.scrollThreshold = 80;
    this.lastScrollY = 0;

    this.handleScroll = Prestige.throttle(this._onScroll.bind(this), 50);
    window.addEventListener('scroll', this.handleScroll, { passive: true });

    // Run once on load
    this._onScroll();
  }

  _onScroll() {
    const scrollY = window.scrollY;

    // Add/remove scrolled class
    if (scrollY > this.scrollThreshold) {
      this.header.classList.add('scrolled');
    } else {
      this.header.classList.remove('scrolled');
    }

    // Hide on scroll down, show on scroll up (optional — enabled for collection pages)
    if (this.header.dataset.hideOnScroll === 'true') {
      if (scrollY > this.lastScrollY && scrollY > 300) {
        this.header.style.transform = 'translateY(-100%)';
      } else {
        this.header.style.transform = 'translateY(0)';
      }
    }

    this.lastScrollY = scrollY;
  }
}

/* =============================================================================
   3. Mobile Menu
   ============================================================================= */

class MobileMenu {
  constructor() {
    this.toggle = document.querySelector('.header__menu-toggle');
    this.nav = document.querySelector('.mobile-nav');
    this.overlay = document.querySelector('.mobile-nav-overlay');
    this.isOpen = false;

    if (!this.toggle || !this.nav) return;

    this.toggle.addEventListener('click', () => this.toggleMenu());

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Close when clicking overlay
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    // Sub-menu toggles
    const subToggles = this.nav.querySelectorAll('.mobile-nav__sub-toggle');
    subToggles.forEach((btn) => {
      btn.addEventListener('click', () => {
        const parent = btn.closest('.mobile-nav__item');
        parent.classList.toggle('open');
        const sub = parent.querySelector('.mobile-nav__sub');
        if (sub) {
          sub.style.maxHeight = parent.classList.contains('open')
            ? sub.scrollHeight + 'px'
            : '0';
        }
      });
    });
  }

  toggleMenu() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.nav.classList.add('open');
    this.toggle.classList.add('active');
    this.toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (this.overlay) this.overlay.classList.add('open');
    Prestige.trapFocus(this.nav);
  }

  close() {
    this.isOpen = false;
    this.nav.classList.remove('open');
    this.toggle.classList.remove('active');
    this.toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (this.overlay) this.overlay.classList.remove('open');
    Prestige.removeTrapFocus(this.nav);
    this.toggle.focus();
  }
}

/* =============================================================================
   4. Cart Drawer
   ============================================================================= */

class CartDrawer {
  constructor() {
    this.drawer = document.getElementById('cart-drawer');
    this.overlay = document.getElementById('cart-drawer-overlay');
    this.closeBtn = document.querySelector('.cart-drawer__close');
    this.openBtns = document.querySelectorAll('[data-cart-open]');
    this.itemsContainer = document.querySelector('.cart-drawer__items');
    this.subtotalEl = document.querySelector('.cart-drawer__subtotal-price');
    this.countEls = document.querySelectorAll('.header__cart-count');
    this.isOpen = false;

    if (!this.drawer) return;

    // Open triggers
    this.openBtns.forEach((btn) =>
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      })
    );

    // Close triggers
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Listen for custom cart update events
    document.addEventListener('cart:updated', (e) => {
      this.updateCart(e.detail);
    });

    // Delegated events for qty and remove buttons inside drawer
    if (this.itemsContainer) {
      this.itemsContainer.addEventListener('click', (e) => {
        const qtyBtn = e.target.closest('.cart-drawer__item-qty-btn');
        const removeBtn = e.target.closest('.cart-drawer__item-remove');

        if (qtyBtn) {
          const key = qtyBtn.dataset.lineKey;
          const action = qtyBtn.dataset.action;
          const qtyEl = qtyBtn.parentElement.querySelector('.cart-drawer__item-qty-val');
          let current = parseInt(qtyEl.value || qtyEl.textContent, 10) || 1;

          if (action === 'increase') current += 1;
          if (action === 'decrease') current = Math.max(0, current - 1);

          this.updateLineItem(key, current);
        }

        if (removeBtn) {
          const key = removeBtn.dataset.lineKey;
          this.updateLineItem(key, 0);
        }
      });

      // Quantity input change
      this.itemsContainer.addEventListener('change', (e) => {
        const input = e.target.closest('.cart-drawer__item-qty-val');
        if (input) {
          const key = input.dataset.lineKey;
          const qty = parseInt(input.value, 10);
          if (!isNaN(qty) && qty >= 0) {
            this.updateLineItem(key, qty);
          }
        }
      });
    }
  }

  open() {
    this.isOpen = true;
    this.drawer.classList.add('open');
    if (this.overlay) this.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.drawer.setAttribute('aria-hidden', 'false');
    Prestige.trapFocus(this.drawer);
    this.fetchCart();
  }

  close() {
    this.isOpen = false;
    this.drawer.classList.remove('open');
    if (this.overlay) this.overlay.classList.remove('open');
    document.body.style.overflow = '';
    this.drawer.setAttribute('aria-hidden', 'true');
    Prestige.removeTrapFocus(this.drawer);
  }

  async fetchCart() {
    try {
      const cart = await Prestige.fetchJSON('/cart.js');
      this.renderCart(cart);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }

  renderCart(cart) {
    this.updateCounts(cart.item_count);

    if (!this.itemsContainer) return;

    if (cart.item_count === 0) {
      this.itemsContainer.innerHTML = this._emptyCartHTML();
      if (this.subtotalEl) this.subtotalEl.textContent = '';
      return;
    }

    const itemsHTML = cart.items.map((item) => this._itemHTML(item)).join('');
    this.itemsContainer.innerHTML = itemsHTML;

    if (this.subtotalEl) {
      this.subtotalEl.textContent = Prestige.formatMoney(cart.total_price);
    }

    // Update drawer count label
    const countLabel = this.drawer.querySelector('.cart-drawer__count');
    if (countLabel) {
      countLabel.textContent = `(${cart.item_count})`;
    }

    const footerEl = this.drawer.querySelector('.cart-drawer__footer');
    if (footerEl) {
      footerEl.style.display = cart.item_count === 0 ? 'none' : '';
    }
  }

  _emptyCartHTML() {
    return `
      <div class="cart-drawer__empty">
        <svg class="cart-drawer__empty-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <h3 class="cart-drawer__empty-title">Your cart is empty</h3>
        <p class="cart-drawer__empty-text">Add some items to get started.</p>
        <a href="/collections/all" class="btn btn--secondary btn--sm" onclick="window.cartDrawer && window.cartDrawer.close()">Shop Now</a>
      </div>`;
  }

  _itemHTML(item) {
    const imageURL = item.featured_image?.url
      ? `${item.featured_image.url}&width=200`
      : 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-3_large.png';

    const optionsHTML = item.variant_title && item.variant_title !== 'Default Title'
      ? `<div class="cart-drawer__item-variant">${item.variant_title}</div>`
      : '';

    return `
      <div class="cart-drawer__item" data-key="${item.key}">
        <a href="${item.url}" class="cart-drawer__item-image">
          <img src="${imageURL}" alt="${item.title}" loading="lazy" width="80" height="107">
        </a>
        <div class="cart-drawer__item-info">
          <div class="cart-drawer__item-vendor">${item.vendor}</div>
          <a href="${item.url}" class="cart-drawer__item-title">${item.product_title}</a>
          ${optionsHTML}
          <div class="cart-drawer__item-qty">
            <button class="cart-drawer__item-qty-btn" data-action="decrease" data-line-key="${item.key}" aria-label="Decrease quantity">−</button>
            <input
              type="number"
              class="cart-drawer__item-qty-val"
              value="${item.quantity}"
              min="0"
              data-line-key="${item.key}"
              aria-label="Quantity for ${item.title}"
            >
            <button class="cart-drawer__item-qty-btn" data-action="increase" data-line-key="${item.key}" aria-label="Increase quantity">+</button>
          </div>
          <button class="cart-drawer__item-remove" data-line-key="${item.key}">Remove</button>
        </div>
        <div class="cart-drawer__item-price">${Prestige.formatMoney(item.final_line_price)}</div>
      </div>`;
  }

  async updateLineItem(key, quantity) {
    try {
      const cart = await Prestige.fetchJSON('/cart/change.js', {
        method: 'POST',
        body: JSON.stringify({ id: key, quantity }),
      });
      this.renderCart(cart);
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
    } catch (err) {
      console.error('Failed to update cart:', err);
      Toast.show('Failed to update cart.', 'error');
    }
  }

  updateCounts(count) {
    this.countEls.forEach((el) => {
      el.textContent = count;
      el.classList.toggle('hidden', count === 0);
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 300);
    });
  }

  updateCart(cart) {
    this.updateCounts(cart.item_count);
    if (this.isOpen) {
      this.renderCart(cart);
    }
  }
}

/* =============================================================================
   5. Add to Cart AJAX
   ============================================================================= */

class AddToCart {
  constructor() {
    // Delegate to all add-to-cart forms
    document.addEventListener('submit', (e) => {
      const form = e.target.closest('form[action="/cart/add"]');
      if (!form) return;
      e.preventDefault();
      this.handleSubmit(form);
    });
  }

  async handleSubmit(form) {
    const btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.classList.add('loading');
      btn.disabled = true;
    }

    try {
      const formData = new FormData(form);
      const body = {};
      formData.forEach((value, key) => {
        body[key] = value;
      });

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.description || 'Could not add item to cart.');
      }

      // Fetch updated cart
      const cart = await Prestige.fetchJSON('/cart.js');
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));

      // Open cart drawer
      if (window.cartDrawer) {
        window.cartDrawer.open();
      }

      // Button feedback
      if (btn) {
        btn.classList.remove('loading');
        btn.textContent = 'Added!';
        setTimeout(() => {
          btn.textContent = btn.dataset.originalText || 'Add to Cart';
          btn.disabled = false;
        }, 2000);
      }

      Toast.show('Item added to cart!', 'success');
    } catch (err) {
      console.error('Add to cart error:', err);
      Toast.show(err.message || 'Something went wrong.', 'error');

      if (btn) {
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || 'Add to Cart';
      }
    }
  }
}

/* =============================================================================
   6. Cart Quantity Updates (cart page)
   ============================================================================= */

class CartPage {
  constructor() {
    this.form = document.querySelector('form[data-cart-form]');
    if (!this.form) return;

    // Delegate quantity changes
    this.form.addEventListener('change', Prestige.debounce((e) => {
      const input = e.target.closest('.cart-item-qty');
      if (!input) return;
      const lineIndex = input.dataset.line;
      const qty = parseInt(input.value, 10);
      if (!isNaN(qty)) this.updateItem(lineIndex, qty);
    }, 400));

    this.form.addEventListener('click', (e) => {
      const btn = e.target.closest('.cart-item-qty-btn');
      if (!btn) return;
      const lineIndex = btn.dataset.line;
      const action = btn.dataset.action;
      const input = this.form.querySelector(`.cart-item-qty[data-line="${lineIndex}"]`);
      if (!input) return;
      let qty = parseInt(input.value, 10) || 1;
      if (action === 'increase') qty += 1;
      if (action === 'decrease') qty = Math.max(0, qty - 1);
      input.value = qty;
      this.updateItem(lineIndex, qty);
    });

    // Remove buttons
    this.form.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-item]');
      if (!btn) return;
      const lineIndex = btn.dataset.removeItem;
      this.updateItem(lineIndex, 0);
    });
  }

  async updateItem(lineIndex, quantity) {
    try {
      const cart = await Prestige.fetchJSON('/cart/change.js', {
        method: 'POST',
        body: JSON.stringify({ line: lineIndex, quantity }),
      });
      // Reload the page to reflect changes (simpler for full cart page)
      window.location.reload();
    } catch (err) {
      console.error('Cart update error:', err);
      Toast.show('Failed to update cart.', 'error');
    }
  }
}

/* =============================================================================
   7. Intersection Observer Animations
   ============================================================================= */

class AnimationObserver {
  constructor() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: make all elements visible immediately
      document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach((el) => {
        el.classList.add('visible');
      });
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    this.observe();
  }

  observe() {
    document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach((el) => {
      this.observer.observe(el);
    });
  }

  // Re-observe after dynamic content loads
  refresh() {
    this.observe();
  }
}

/* =============================================================================
   8. Product Page — Gallery + Variant Selector
   ============================================================================= */

class ProductGallery {
  constructor(container) {
    this.container = container;
    this.mainImage = container.querySelector('.product-gallery__main-img');
    this.thumbs = container.querySelectorAll('.product-gallery__thumb');

    if (!this.mainImage || !this.thumbs.length) return;

    this.thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => this.setActive(i));
    });
  }

  setActive(index) {
    const thumb = this.thumbs[index];
    if (!thumb) return;

    const src = thumb.dataset.src || thumb.querySelector('img')?.src;
    if (!src) return;

    // Fade transition
    this.mainImage.style.opacity = '0';
    setTimeout(() => {
      this.mainImage.src = src;
      this.mainImage.style.opacity = '1';
    }, 150);

    // Update active thumb
    this.thumbs.forEach((t) => t.classList.remove('active'));
    thumb.classList.add('active');
  }
}

class VariantSelector {
  constructor(form) {
    this.form = form;
    this.product = null;
    this.selectedVariant = null;

    const dataEl = document.getElementById('product-json');
    if (dataEl) {
      try {
        this.product = JSON.parse(dataEl.textContent);
        this.selectedVariant = this.product.variants.find((v) => v.available) || this.product.variants[0];
      } catch (e) {
        console.error('Failed to parse product JSON:', e);
        return;
      }
    } else {
      return;
    }

    this.priceEl = document.querySelector('.product-info__price-current');
    this.comparePriceEl = document.querySelector('.product-info__price-compare');
    this.savingsEl = document.querySelector('.product-info__price-savings');
    this.addToCartBtn = this.form.querySelector('[type="submit"]');
    this.variantInput = this.form.querySelector('[name="id"]');
    this.availabilityEl = document.querySelector('.product-availability');

    this._bindOptions();
    this._updateUI();
  }

  _bindOptions() {
    const optionBtns = this.form.querySelectorAll('.variant-option-btn, .variant-option-swatch');

    optionBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const optionIndex = parseInt(btn.dataset.optionIndex, 10);
        const optionValue = btn.dataset.value;

        // Update active state for the group
        const siblings = this.form.querySelectorAll(
          `.variant-option-btn[data-option-index="${optionIndex}"],
           .variant-option-swatch[data-option-index="${optionIndex}"]`
        );
        siblings.forEach((s) => s.classList.remove('active'));
        btn.classList.add('active');

        // Find matching variant
        this._findVariant();
      });
    });
  }

  _findVariant() {
    const selectedOptions = [];
    const optionCount = this.product.options.length;

    for (let i = 1; i <= optionCount; i++) {
      const activeBtn = this.form.querySelector(
        `.variant-option-btn.active[data-option-index="${i}"],
         .variant-option-swatch.active[data-option-index="${i}"]`
      );
      if (activeBtn) {
        selectedOptions.push(activeBtn.dataset.value);
      }
    }

    this.selectedVariant = this.product.variants.find((variant) => {
      return variant.options.every((opt, idx) => opt === selectedOptions[idx]);
    }) || null;

    this._updateUI();
    this._updateURL();
  }

  _updateUI() {
    if (!this.selectedVariant) {
      if (this.addToCartBtn) {
        this.addToCartBtn.disabled = true;
        this.addToCartBtn.textContent = 'Unavailable';
      }
      return;
    }

    // Update hidden variant input
    if (this.variantInput) {
      this.variantInput.value = this.selectedVariant.id;
    }

    // Update price
    if (this.priceEl) {
      this.priceEl.textContent = Prestige.formatMoney(this.selectedVariant.price);
      this.priceEl.classList.toggle(
        'product-info__price-current--sale',
        !!this.selectedVariant.compare_at_price && this.selectedVariant.compare_at_price > this.selectedVariant.price
      );
    }

    if (this.comparePriceEl) {
      if (this.selectedVariant.compare_at_price && this.selectedVariant.compare_at_price > this.selectedVariant.price) {
        this.comparePriceEl.textContent = Prestige.formatMoney(this.selectedVariant.compare_at_price);
        this.comparePriceEl.style.display = '';

        const savings = this.selectedVariant.compare_at_price - this.selectedVariant.price;
        if (this.savingsEl) {
          this.savingsEl.textContent = `Save ${Prestige.formatMoney(savings)}`;
          this.savingsEl.style.display = '';
        }
      } else {
        this.comparePriceEl.style.display = 'none';
        if (this.savingsEl) this.savingsEl.style.display = 'none';
      }
    }

    // Update availability
    if (this.addToCartBtn) {
      if (this.selectedVariant.available) {
        this.addToCartBtn.disabled = false;
        this.addToCartBtn.textContent = this.addToCartBtn.dataset.addText || 'Add to Cart';
      } else {
        this.addToCartBtn.disabled = true;
        this.addToCartBtn.textContent = this.addToCartBtn.dataset.soldOutText || 'Sold Out';
      }
    }

    if (this.availabilityEl) {
      this.availabilityEl.textContent = this.selectedVariant.available ? 'In stock' : 'Sold out';
      this.availabilityEl.dataset.available = this.selectedVariant.available;
    }

    // Update gallery image if variant has featured image
    if (this.selectedVariant.featured_image) {
      const gallery = document.querySelector('.product-gallery');
      if (gallery) {
        const matchingThumb = gallery.querySelector(
          `[data-src*="${this.selectedVariant.featured_image.id}"]`
        );
        if (matchingThumb) {
          const galleryInstance = window._productGallery;
          if (galleryInstance) {
            const index = Array.from(gallery.querySelectorAll('.product-gallery__thumb')).indexOf(matchingThumb);
            if (index !== -1) galleryInstance.setActive(index);
          }
        }
      }
    }
  }

  _updateURL() {
    if (!this.selectedVariant) return;
    const url = new URL(window.location.href);
    url.searchParams.set('variant', this.selectedVariant.id);
    window.history.replaceState({}, '', url.toString());
  }
}

/* =============================================================================
   9. Accordion
   ============================================================================= */

class Accordion {
  constructor(container) {
    this.headers = container.querySelectorAll('.accordion-header');
    this.headers.forEach((header) => {
      header.addEventListener('click', () => this.toggle(header));
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle(header);
        }
      });
    });
  }

  toggle(header) {
    const item = header.closest('.accordion-item');
    const isOpen = item.classList.contains('open');

    // Close all others (optional - set to false for multi-open)
    const closeOthers = item.closest('.accordion')?.dataset.singleOpen !== 'false';
    if (closeOthers) {
      item.closest('.accordion')?.querySelectorAll('.accordion-item.open').forEach((openItem) => {
        if (openItem !== item) openItem.classList.remove('open');
      });
    }

    item.classList.toggle('open', !isOpen);
    header.setAttribute('aria-expanded', String(!isOpen));
  }
}

/* =============================================================================
   10. Collection Filter Drawer (Mobile)
   ============================================================================= */

class FilterDrawer {
  constructor() {
    this.filterPanel = document.querySelector('.filters');
    this.openBtn = document.querySelector('[data-filter-open]');
    this.closeBtn = document.querySelector('[data-filter-close]');
    this.overlay = document.querySelector('.filter-overlay');

    if (!this.filterPanel || !this.openBtn) return;

    this.openBtn.addEventListener('click', () => this.open());
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    if (this.overlay) this.overlay.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  open() {
    this.filterPanel.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (this.overlay) this.overlay.classList.add('open');
  }

  close() {
    this.filterPanel.classList.remove('open');
    document.body.style.overflow = '';
    if (this.overlay) this.overlay.classList.remove('open');
  }
}

/* =============================================================================
   11. Product Grid View Toggle
   ============================================================================= */

class GridViewToggle {
  constructor() {
    const btns = document.querySelectorAll('[data-grid-view]');
    const grid = document.querySelector('.product-grid');
    if (!btns.length || !grid) return;

    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cols = btn.dataset.gridView;
        grid.className = grid.className.replace(/product-grid--\d+/g, '');
        if (cols !== '4') grid.classList.add(`product-grid--${cols}`);
        btns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Persist preference
        try { localStorage.setItem('grid_view', cols); } catch(e) {}
      });
    });

    // Restore saved preference
    try {
      const saved = localStorage.getItem('grid_view');
      if (saved) {
        const btn = document.querySelector(`[data-grid-view="${saved}"]`);
        if (btn) btn.click();
      }
    } catch(e) {}
  }
}

/* =============================================================================
   12. Toast Notifications
   ============================================================================= */

const Toast = {
  container: null,
  currentTimeout: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast';
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');
    document.body.appendChild(this.container);
  },

  show(message, type = 'default', duration = 3000) {
    if (!this.container) this.init();

    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.container.classList.remove('show');
    }

    this.container.textContent = message;
    this.container.className = `toast toast--${type}`;

    // Force reflow
    this.container.offsetHeight;
    this.container.classList.add('show');

    this.currentTimeout = setTimeout(() => {
      this.container.classList.remove('show');
    }, duration);
  },
};

/* =============================================================================
   13. Newsletter Form
   ============================================================================= */

class NewsletterForm {
  constructor(form) {
    this.form = form;
    this.input = form.querySelector('input[type="email"]');
    this.btn = form.querySelector('[type="submit"]');
    this.successMsg = form.querySelector('.newsletter__success');

    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  handleSubmit(e) {
    // Shopify handles the form POST natively for customer subscriptions
    // This adds a visual enhancement
    if (!this.input?.value.trim()) {
      e.preventDefault();
      this.input?.focus();
      Toast.show('Please enter your email address.', 'error');
      return;
    }

    if (this.btn) {
      this.btn.textContent = 'Subscribing...';
      this.btn.disabled = true;
    }
  }
}

/* =============================================================================
   14. Init — Run everything on DOMContentLoaded
   ============================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Core
  new Header();
  new MobileMenu();

  // Cart
  window.cartDrawer = new CartDrawer();
  new AddToCart();
  new CartPage();

  // Animations
  window.animationObserver = new AnimationObserver();

  // Product gallery
  const galleryEl = document.querySelector('.product-gallery');
  if (galleryEl) {
    window._productGallery = new ProductGallery(galleryEl);
  }

  // Variant selector
  const productForm = document.querySelector('form[action="/cart/add"]');
  if (productForm && document.getElementById('product-json')) {
    new VariantSelector(productForm);
  }

  // Accordions
  document.querySelectorAll('.accordion').forEach((el) => new Accordion(el));

  // Collection filters
  new FilterDrawer();
  new GridViewToggle();

  // Newsletter forms
  document.querySelectorAll('.newsletter__form, .footer__newsletter-form').forEach((f) => {
    new NewsletterForm(f);
  });

  // Toast init
  Toast.init();

  // Save original button text for ATC buttons
  document.querySelectorAll('[type="submit"][data-add-text]').forEach((btn) => {
    btn.dataset.originalText = btn.textContent.trim();
  });

  // Quantity selector buttons (product page)
  document.querySelectorAll('.quantity-selector').forEach((selector) => {
    const input = selector.querySelector('.quantity-selector__input');
    const minusBtn = selector.querySelector('[data-qty-minus]');
    const plusBtn = selector.querySelector('[data-qty-plus]');

    if (!input) return;

    minusBtn?.addEventListener('click', () => {
      const val = parseInt(input.value, 10) || 1;
      input.value = Math.max(1, val - 1);
      input.dispatchEvent(new Event('change'));
    });

    plusBtn?.addEventListener('click', () => {
      const val = parseInt(input.value, 10) || 1;
      const max = parseInt(input.max, 10) || Infinity;
      input.value = Math.min(max, val + 1);
      input.dispatchEvent(new Event('change'));
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('%c✦ Prestige Theme Loaded', 'color: #c9a96e; font-family: Georgia; font-size: 14px;');
});
