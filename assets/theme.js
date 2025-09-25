// Main Theme JavaScript
document.addEventListener('DOMContentLoaded', function() {
  
  // Initialize all components
  initHeader();
  initMobileMenu();
  initProductCards();
  initModals();
  initForms();
  initLazyLoading();
  initAnimations();
  
  // Header Functions
  function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    // Sticky header
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > 100) {
        header.classList.add('header--scrolled');
        
        if (scrollTop > lastScrollTop) {
          header.classList.add('header--hidden');
        } else {
          header.classList.remove('header--hidden');
        }
      } else {
        header.classList.remove('header--scrolled', 'header--hidden');
      }
      
      lastScrollTop = scrollTop;
    });
    
    // Search toggle
    const searchToggle = document.querySelector('.header__search-toggle');
    const searchForm = document.querySelector('.header__search-form');
    
    if (searchToggle && searchForm) {
      searchToggle.addEventListener('click', function() {
        searchForm.classList.toggle('header__search-form--active');
        const searchInput = searchForm.querySelector('input');
        if (searchInput) {
          searchInput.focus();
        }
      });
      
      // Close search on click outside
      document.addEventListener('click', function(e) {
        if (!searchForm.contains(e.target) && !searchToggle.contains(e.target)) {
          searchForm.classList.remove('header__search-form--active');
        }
      });
    }
  }
  
  // Mobile Menu
  function initMobileMenu() {
    const menuToggle = document.querySelector('.header__menu-toggle');
    const mobileMenu = document.querySelector('.header__mobile-menu');
    const body = document.body;
    
    if (!menuToggle || !mobileMenu) return;
    
    menuToggle.addEventListener('click', function() {
      const isOpen = mobileMenu.classList.contains('header__mobile-menu--active');
      
      if (isOpen) {
        mobileMenu.classList.remove('header__mobile-menu--active');
        menuToggle.classList.remove('header__menu-toggle--active');
        body.style.overflow = '';
      } else {
        mobileMenu.classList.add('header__mobile-menu--active');
        menuToggle.classList.add('header__menu-toggle--active');
        body.style.overflow = 'hidden';
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('header__mobile-menu--active')) {
        mobileMenu.classList.remove('header__mobile-menu--active');
        menuToggle.classList.remove('header__menu-toggle--active');
        body.style.overflow = '';
      }
    });
  }
  
  // Product Cards
  function initProductCards() {
    // Quick view
    const quickViewButtons = document.querySelectorAll('.quick-view');
    quickViewButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const productUrl = this.dataset.productUrl;
        openQuickView(productUrl);
      });
    });
    
    // Wishlist
    const wishlistButtons = document.querySelectorAll('.add-to-wishlist');
    wishlistButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const productId = this.dataset.productId;
        toggleWishlist(productId, this);
      });
    });
    
    // Compare
    const compareButtons = document.querySelectorAll('.add-to-compare');
    compareButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const productId = this.dataset.productId;
        toggleCompare(productId, this);
      });
    });
  }
  
  // Quick View Modal
  function openQuickView(productUrl) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
      <div class="quick-view-modal__overlay"></div>
      <div class="quick-view-modal__content">
        <button class="quick-view-modal__close" aria-label="Close">&times;</button>
        <div class="quick-view-modal__loading">
          <div class="spinner"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Load product data
    fetch(productUrl + '?view=quick-view')
      .then(response => response.text())
      .then(html => {
        const content = modal.querySelector('.quick-view-modal__content');
        content.innerHTML = html;
        
        // Reinitialize product form
        const form = content.querySelector('product-form');
        if (form) {
          initProductForm(form);
        }
      })
      .catch(error => {
        console.error('Quick view error:', error);
        modal.remove();
        document.body.style.overflow = '';
      });
    
    // Close modal
    modal.addEventListener('click', function(e) {
      if (e.target.classList.contains('quick-view-modal__overlay') || 
          e.target.classList.contains('quick-view-modal__close')) {
        modal.remove();
        document.body.style.overflow = '';
      }
    });
  }
  
  // Wishlist Functions
  function toggleWishlist(productId, button) {
    const isActive = button.classList.contains('active');
    
    if (isActive) {
      removeFromWishlist(productId);
      button.classList.remove('active');
      showNotification('Removed from wishlist');
    } else {
      addToWishlist(productId);
      button.classList.add('active');
      showNotification('Added to wishlist');
    }
    
    updateWishlistCount();
  }
  
  function addToWishlist(productId) {
    let wishlist = getWishlist();
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }
  
  function removeFromWishlist(productId) {
    let wishlist = getWishlist();
    wishlist = wishlist.filter(id => id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }
  
  function getWishlist() {
    const wishlist = localStorage.getItem('wishlist');
    return wishlist ? JSON.parse(wishlist) : [];
  }
  
  function updateWishlistCount() {
    const wishlist = getWishlist();
    const countElements = document.querySelectorAll('.wishlist-count');
    countElements.forEach(el => {
      el.textContent = wishlist.length;
      el.style.display = wishlist.length > 0 ? 'block' : 'none';
    });
  }
  
  // Compare Functions
  function toggleCompare(productId, button) {
    const isActive = button.classList.contains('active');
    
    if (isActive) {
      removeFromCompare(productId);
      button.classList.remove('active');
      showNotification('Removed from compare');
    } else {
      const compareList = getCompareList();
      if (compareList.length >= 4) {
        showNotification('Maximum 4 products can be compared');
        return;
      }
      addToCompare(productId);
      button.classList.add('active');
      showNotification('Added to compare');
    }
  }
  
  function addToCompare(productId) {
    let compareList = getCompareList();
    if (!compareList.includes(productId)) {
      compareList.push(productId);
      localStorage.setItem('compare', JSON.stringify(compareList));
    }
  }
  
  function removeFromCompare(productId) {
    let compareList = getCompareList();
    compareList = compareList.filter(id => id !== productId);
    localStorage.setItem('compare', JSON.stringify(compareList));
  }
  
  function getCompareList() {
    const compareList = localStorage.getItem('compare');
    return compareList ? JSON.parse(compareList) : [];
  }
  
  // Modal Functions
  function initModals() {
    const modalTriggers = document.querySelectorAll('[data-modal]');
    
    modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        const modalId = this.dataset.modal;
        const modal = document.getElementById(modalId);
        if (modal) {
          openModal(modal);
        }
      });
    });
    
    // Close modals
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('modal__overlay') || 
          e.target.classList.contains('modal__close')) {
        const modal = e.target.closest('.modal');
        if (modal) {
          closeModal(modal);
        }
      }
    });
    
    // Close on escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal--active');
        if (openModal) {
          closeModal(openModal);
        }
      }
    });
  }
  
  function openModal(modal) {
    modal.classList.add('modal--active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeModal(modal) {
    modal.classList.remove('modal--active');
    document.body.style.overflow = '';
  }
  
  // Form Functions
  function initForms() {
    // Newsletter form
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    newsletterForms.forEach(form => {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        if (email) {
          subscribeNewsletter(email, this);
        }
      });
    });
    
    // Product forms
    const productForms = document.querySelectorAll('product-form');
    productForms.forEach(form => {
      initProductForm(form);
    });
  }
  
  function initProductForm(form) {
    const submitButton = form.querySelector('[type="submit"]');
    if (!submitButton) return;
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(form.querySelector('form'));
      submitButton.disabled = true;
      submitButton.classList.add('loading');
      
      fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        updateCart();
        showNotification('Product added to cart');
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('Error adding to cart', 'error');
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
      });
    });
  }
  
  function subscribeNewsletter(email, form) {
    // Simulate newsletter subscription
    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    
    setTimeout(() => {
      showNotification('Successfully subscribed!');
      form.reset();
      submitButton.disabled = false;
    }, 1000);
  }
  
  // Cart Functions
  function updateCart() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        updateCartCount(cart.item_count);
        updateCartDrawer(cart);
      });
  }
  
  function updateCartCount(count) {
    const cartCounts = document.querySelectorAll('.header__cart-count');
    cartCounts.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'block' : 'none';
    });
  }
  
  function updateCartDrawer(cart) {
    const cartDrawer = document.querySelector('.cart-drawer');
    if (!cartDrawer) return;
    
    // Update cart drawer content
    // This would be implemented based on your cart drawer structure
  }
  
  // Lazy Loading
  function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });
      
      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }
  
  // Animations
  function initAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    if ('IntersectionObserver' in window) {
      const animationObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            const animation = element.dataset.animate;
            element.classList.add('animate-' + animation);
            animationObserver.unobserve(element);
          }
        });
      }, {
        threshold: 0.1
      });
      
      animatedElements.forEach(el => animationObserver.observe(el));
    }
  }
  
  // Notification System
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
      <div class="notification__content">
        <span class="notification__message">${message}</span>
        <button class="notification__close" aria-label="Close">&times;</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('notification--active');
    }, 100);
    
    // Auto close after 3 seconds
    setTimeout(() => {
      closeNotification(notification);
    }, 3000);
    
    // Manual close
    notification.querySelector('.notification__close').addEventListener('click', function() {
      closeNotification(notification);
    });
  }
  
  function closeNotification(notification) {
    notification.classList.remove('notification--active');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
  
  // Utility Functions
  window.theme = window.theme || {};
  window.theme.updateCart = updateCart;
  window.theme.showNotification = showNotification;
  window.theme.openModal = openModal;
  window.theme.closeModal = closeModal;
  
});

// Debounce Function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle Function
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
