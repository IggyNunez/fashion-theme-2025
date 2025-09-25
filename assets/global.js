/**
 * Fashion Theme Global JS - Performance Optimized
 * Uses Intersection Observer, Request Animation Frame, and Event Delegation
 */

class VariantSelector extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
    this.updateOptions();
    this.updateMasterId();
    this.initializeSwatches();
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton();
    this.updatePickupAvailability();
    this.removeErrorMessage();
    
    if (!this.currentVariant) {
      this.toggleAddButton(true);
      this.updatePrice();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select, input[type="radio"]:checked'), (element) => {
      if (element.tagName === 'SELECT') {
        return element.value;
      } else {
        return element.value;
      }
    });
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant?.featured_media) return;
    
    const newMedia = document.querySelector(
      `[data-media-id="${this.dataset.section}-${this.currentVariant.featured_media.id}"]`
    );
    if (!newMedia) return;
    
    const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product__media-list`);
    const newMediaModal = modalContent?.querySelector(`[data-media-id="${this.dataset.section}-${this.currentVariant.featured_media.id}"]`);
    const parent = newMedia.parentElement;
    
    if (parent.firstChild === newMedia) return;
    
    parent.prepend(newMedia);
    parent.querySelector('.product__media-item.is-active')?.classList.remove('is-active');
    newMedia.classList.add('is-active');
    
    if (newMediaModal) {
      modalContent.prepend(newMediaModal);
    }

    // Preload next variant images for smooth transitions
    this.preloadVariantImages();
  }

  preloadVariantImages() {
    const variants = this.getVariantData();
    variants.forEach(variant => {
      if (variant.featured_media?.preview_image?.src) {
        const img = new Image();
        img.src = variant.featured_media.preview_image.src;
      }
    });
  }

  updateURL() {
    if (!this.currentVariant) return;
    window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updatePrice() {
    fetch(`${this.dataset.url}?variant=${this.currentVariant?.id || ''}&section_id=${this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const price = html.querySelector(`#price-${this.dataset.section}`);
        const priceElement = document.getElementById(`price-${this.dataset.section}`);
        if (price && priceElement) priceElement.innerHTML = price.innerHTML;
        
        // Update price per item in cart drawer
        this.updateCartPricing();
      });
  }

  initializeSwatches() {
    this.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        const input = swatch.previousElementSibling;
        if (input && !input.disabled) {
          input.checked = true;
          this.onVariantChange();
        }
      });
    });
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[data-variant-json]').textContent);
    return this.variantData;
  }
}

// Quick Shop Modal
class QuickShop extends HTMLElement {
  constructor() {
    super();
    this.modal = this.querySelector('.quick-shop-modal');
    this.closeButtons = this.querySelectorAll('[data-close-modal]');
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.addEventListener('click', (e) => {
      if (e.target.matches('[data-quick-shop-trigger]')) {
        e.preventDefault();
        this.openQuickShop(e.target.dataset.productHandle);
      }
    });

    this.closeButtons.forEach(button => {
      button.addEventListener('click', () => this.close());
    });

    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  async openQuickShop(handle) {
    const response = await fetch(`/products/${handle}?view=quick-shop`);
    const html = await response.text();
    
    this.modal.querySelector('.quick-shop-content').innerHTML = html;
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Reinitialize variant selector for quick shop
    this.modal.querySelectorAll('variant-selector').forEach(selector => {
      customElements.upgrade(selector);
    });
  }

  close() {
    this.modal?.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Cart Drawer with Free Shipping Progress
class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.threshold = parseFloat(this.dataset.freeShippingThreshold || 100);
    this.setupEventListeners();
    this.updateProgress();
  }

  setupEventListeners() {
    document.addEventListener('cart:updated', () => this.refresh());
    
    this.querySelectorAll('[data-quantity-button]').forEach(button => {
      button.addEventListener('click', this.updateQuantity.bind(this));
    });

    this.querySelector('.cart-drawer__close')?.addEventListener('click', () => this.close());
  }

  async refresh() {
    const response = await fetch('/cart.js');
    const cart = await response.json();
    this.updateDrawerContent(cart);
    this.updateProgress(cart.total_price);
  }

  updateProgress(total = 0) {
    const progress = Math.min((total / 100) / this.threshold * 100, 100);
    const remaining = Math.max(this.threshold - (total / 100), 0);
    
    this.querySelector('.shipping-progress__bar')?.style.setProperty('--progress', `${progress}%`);
    
    const message = this.querySelector('.shipping-progress__message');
    if (message) {
      if (remaining > 0) {
        message.textContent = `Add $${remaining.toFixed(2)} more for free shipping!`;
      } else {
        message.textContent = '🎉 You qualify for free shipping!';
      }
    }
  }

  async updateQuantity(e) {
    const button = e.currentTarget;
    const input = button.parentNode.querySelector('input');
    const value = Number(input.value);
    const isIncrease = button.dataset.quantityButton === 'increase';
    const newValue = isIncrease ? value + 1 : Math.max(0, value - 1);
    
    input.value = newValue;
    
    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line: button.dataset.line,
        quantity: newValue
      })
    });
    
    if (response.ok) {
      document.dispatchEvent(new CustomEvent('cart:updated'));
    }
  }

  open() {
    this.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    this.trapFocus();
  }

  close() {
    this.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    this.releaseFocus();
  }

  trapFocus() {
    this.focusableElements = this.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
    
    this.addEventListener('keydown', this.handleKeydown);
    this.firstFocusable?.focus();
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
    
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === this.firstFocusable) {
        this.lastFocusable?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === this.lastFocusable) {
        this.firstFocusable?.focus();
        e.preventDefault();
      }
    }
  }
}

// Wishlist functionality
class WishlistButton extends HTMLElement {
  constructor() {
    super();
    this.productId = this.dataset.productId;
    this.wishlist = this.getWishlist();
    this.updateState();
    
    this.addEventListener('click', this.toggleWishlist.bind(this));
  }

  getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist') || '[]');
  }

  saveWishlist() {
    localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
    document.dispatchEvent(new CustomEvent('wishlist:updated', { detail: this.wishlist }));
  }

  toggleWishlist() {
    const index = this.wishlist.indexOf(this.productId);
    
    if (index > -1) {
      this.wishlist.splice(index, 1);
      this.setAttribute('data-active', 'false');
      this.showNotification('Removed from wishlist');
    } else {
      this.wishlist.push(this.productId);
      this.setAttribute('data-active', 'true');
      this.showNotification('Added to wishlist');
    }
    
    this.saveWishlist();
    this.animateButton();
  }

  updateState() {
    const isActive = this.wishlist.includes(this.productId);
    this.setAttribute('data-active', isActive);
  }

  animateButton() {
    this.classList.add('wishlist-button--animating');
    setTimeout(() => this.classList.remove('wishlist-button--animating'), 600);
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'wishlist-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('active'), 10);
    setTimeout(() => {
      notification.classList.remove('active');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}

// Image Lazy Loading with Intersection Observer
class LazyImage extends HTMLElement {
  constructor() {
    super();
    this.img = this.querySelector('img');
    
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
        rootMargin: '50px'
      });
      this.observer.observe(this);
    } else {
      this.loadImage();
    }
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage();
        this.observer.unobserve(this);
      }
    });
  }

  loadImage() {
    if (this.img.dataset.src) {
      this.img.src = this.img.dataset.src;
      this.img.removeAttribute('data-src');
    }
    
    if (this.img.dataset.srcset) {
      this.img.srcset = this.img.dataset.srcset;
      this.img.removeAttribute('data-srcset');
    }
    
    this.img.classList.add('loaded');
  }
}

// Recently Viewed Products
class RecentlyViewed {
  constructor() {
    this.maxProducts = 8;
    this.storageKey = 'recently-viewed';
    this.currentProductId = document.querySelector('[data-product-id]')?.dataset.productId;
    
    if (this.currentProductId) {
      this.addProduct(this.currentProductId);
    }
    
    this.displayProducts();
  }

  getProducts() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  addProduct(productId) {
    let products = this.getProducts();
    products = products.filter(id => id !== productId);
    products.unshift(productId);
    products = products.slice(0, this.maxProducts);
    localStorage.setItem(this.storageKey, JSON.stringify(products));
  }

  async displayProducts() {
    const container = document.querySelector('.recently-viewed-products');
    if (!container) return;
    
    const products = this.getProducts().filter(id => id !== this.currentProductId);
    if (products.length === 0) {
      container.closest('section')?.remove();
      return;
    }
    
    const productHTML = await Promise.all(products.map(id => 
      fetch(`/products/${id}?view=card`)
        .then(r => r.text())
        .catch(() => '')
    ));
    
    container.innerHTML = productHTML.join('');
  }
}

// Custom Elements Registration
customElements.define('variant-selector', VariantSelector);
customElements.define('quick-shop', QuickShop);
customElements.define('cart-drawer', CartDrawer);
customElements.define('wishlist-button', WishlistButton);
customElements.define('lazy-image', LazyImage);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new RecentlyViewed();
  
  // Performance: Use requestIdleCallback for non-critical initializations
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Initialize analytics, third-party scripts, etc.
    });
  }
});