// Product Grid Advanced JavaScript
class ProductGridAdvanced {
  constructor(element) {
    this.element = element;
    this.grid = element.querySelector('.product-grid-advanced__grid');
    this.products = element.querySelectorAll('.product-card-advanced');
    this.filterTabs = element.querySelectorAll('.tab-button');
    this.loadMoreButton = element.querySelector('[data-load-more]');
    
    this.currentFilter = 'all';
    this.productsPerLoad = 12;
    this.currentPage = 1;
    
    this.init();
  }
  
  init() {
    this.initFilters();
    this.initLoadMore();
    this.initQuickActions();
    this.initLayout();
  }
  
  // Initialize filter tabs
  initFilters() {
    if (!this.filterTabs.length) return;
    
    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;
        this.filterProducts(filter);
        this.setActiveTab(tab);
      });
    });
  }
  
  // Filter products by tag
  filterProducts(filter) {
    this.currentFilter = filter;
    
    this.products.forEach(product => {
      const tags = product.dataset.productTags ? product.dataset.productTags.split(',') : [];
      
      if (filter === 'all' || tags.includes(filter)) {
        this.showProduct(product);
      } else {
        this.hideProduct(product);
      }
    });
    
    // Update layout after filtering
    this.updateLayout();
  }
  
  // Show/hide product animations
  showProduct(product) {
    product.style.display = '';
    product.dataset.filtered = 'true';
    setTimeout(() => {
      product.style.opacity = '1';
      product.style.transform = 'scale(1)';
    }, 10);
  }
  
  hideProduct(product) {
    product.style.opacity = '0';
    product.style.transform = 'scale(0.9)';
    product.dataset.filtered = 'false';
    setTimeout(() => {
      product.style.display = 'none';
    }, 300);
  }
  
  // Set active filter tab
  setActiveTab(activeTab) {
    this.filterTabs.forEach(tab => {
      tab.classList.remove('active');
    });
    activeTab.classList.add('active');
  }
  
  // Initialize load more functionality
  initLoadMore() {
    if (!this.loadMoreButton) return;
    
    this.loadMoreButton.addEventListener('click', () => {
      this.loadMoreProducts();
    });
  }
  
  // Load more products via AJAX
  loadMoreProducts() {
    this.loadMoreButton.disabled = true;
    this.loadMoreButton.classList.add('loading');
    
    const collection = this.element.dataset.collection;
    const offset = this.currentPage * this.productsPerLoad;
    
    // Fetch more products
    fetch(`/collections/${collection}/products.json?limit=${this.productsPerLoad}&offset=${offset}`)
      .then(response => response.json())
      .then(data => {
        if (data.products && data.products.length > 0) {
          this.appendProducts(data.products);
          this.currentPage++;
          
          // Hide button if no more products
          if (data.products.length < this.productsPerLoad) {
            this.loadMoreButton.style.display = 'none';
          }
        } else {
          this.loadMoreButton.style.display = 'none';
        }
        
        this.loadMoreButton.disabled = false;
        this.loadMoreButton.classList.remove('loading');
      })
      .catch(error => {
        console.error('Error loading products:', error);
        this.loadMoreButton.disabled = false;
        this.loadMoreButton.classList.remove('loading');
      });
  }
  
  // Append new products to grid
  appendProducts(products) {
    products.forEach(product => {
      const productCard = this.createProductCard(product);
      this.grid.appendChild(productCard);
      
      // Animate in
      setTimeout(() => {
        productCard.style.opacity = '1';
        productCard.style.transform = 'translateY(0)';
      }, 100);
    });
    
    // Reinitialize quick actions for new products
    this.initQuickActions();
  }
  
  // Create product card HTML
  createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card-advanced';
    card.dataset.productId = product.id;
    card.dataset.productTags = product.tags.join(',');
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.3s ease';
    
    // Build card HTML (simplified version)
    card.innerHTML = `
      <div class="product-card-advanced__media">
        <a href="${product.url}" class="product-card-advanced__media-link">
          <div class="product-card-advanced__image-container">
            <img src="${product.featured_image}" alt="${product.title}" class="product-card-advanced__image">
          </div>
        </a>
        <div class="product-card-advanced__badges">
          ${product.compare_at_price > product.price ? '<span class="badge badge--sale">Sale</span>' : ''}
        </div>
        <div class="product-card-advanced__quick-actions">
          <button class="quick-action quick-view" data-product-url="${product.url}">
            <svg><!-- Quick view icon --></svg>
          </button>
          <button class="quick-action add-to-wishlist" data-product-id="${product.id}">
            <svg><!-- Wishlist icon --></svg>
          </button>
        </div>
      </div>
      <div class="product-card-advanced__info">
        <h3 class="product-card-advanced__title">
          <a href="${product.url}">${product.title}</a>
        </h3>
        <div class="product-card-advanced__price">
          <span class="price--regular">${this.formatMoney(product.price)}</span>
        </div>
      </div>
    `;
    
    return card;
  }
  
  // Initialize quick action buttons
  initQuickActions() {
    // Quick view
    const quickViewButtons = this.element.querySelectorAll('.quick-view:not([data-initialized])');
    quickViewButtons.forEach(button => {
      button.dataset.initialized = 'true';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productUrl = button.dataset.productUrl;
        if (window.theme && window.theme.openQuickView) {
          window.theme.openQuickView(productUrl);
        }
      });
    });
    
    // Wishlist
    const wishlistButtons = this.element.querySelectorAll('.add-to-wishlist:not([data-initialized])');
    wishlistButtons.forEach(button => {
      button.dataset.initialized = 'true';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = button.dataset.productId;
        this.toggleWishlist(productId, button);
      });
    });
    
    // Compare
    const compareButtons = this.element.querySelectorAll('.add-to-compare:not([data-initialized])');
    compareButtons.forEach(button => {
      button.dataset.initialized = 'true';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = button.dataset.productId;
        this.toggleCompare(productId, button);
      });
    });
  }
  
  // Toggle wishlist
  toggleWishlist(productId, button) {
    button.classList.toggle('active');
    // Add to wishlist logic (could integrate with theme.js functions)
    if (window.theme && window.theme.toggleWishlist) {
      window.theme.toggleWishlist(productId, button);
    }
  }
  
  // Toggle compare
  toggleCompare(productId, button) {
    button.classList.toggle('active');
    // Add to compare logic (could integrate with theme.js functions)
    if (window.theme && window.theme.toggleCompare) {
      window.theme.toggleCompare(productId, button);
    }
  }
  
  // Initialize layout (grid/masonry/carousel)
  initLayout() {
    const layout = this.grid.dataset.layout;
    
    if (layout === 'carousel') {
      this.initCarousel();
    } else if (layout === 'masonry') {
      this.initMasonry();
    }
  }
  
  // Initialize carousel layout
  initCarousel() {
    // Add carousel controls
    const controls = document.createElement('div');
    controls.className = 'product-grid-advanced__carousel-controls';
    controls.innerHTML = `
      <button class="carousel-prev" aria-label="Previous">‹</button>
      <button class="carousel-next" aria-label="Next">›</button>
    `;
    this.grid.parentNode.appendChild(controls);
    
    const prevButton = controls.querySelector('.carousel-prev');
    const nextButton = controls.querySelector('.carousel-next');
    
    prevButton.addEventListener('click', () => {
      this.grid.scrollBy({
        left: -this.grid.offsetWidth,
        behavior: 'smooth'
      });
    });
    
    nextButton.addEventListener('click', () => {
      this.grid.scrollBy({
        left: this.grid.offsetWidth,
        behavior: 'smooth'
      });
    });
  }
  
  // Initialize masonry layout
  initMasonry() {
    // Masonry layout is handled by CSS columns
    // Additional JavaScript logic could be added here if needed
  }
  
  // Update layout after changes
  updateLayout() {
    // Trigger layout recalculation if needed
    if (this.grid.dataset.layout === 'masonry') {
      // Force reflow for masonry
      this.grid.style.columnCount = 'auto';
      setTimeout(() => {
        this.grid.style.columnCount = '';
      }, 10);
    }
  }
  
  // Format money helper
  formatMoney(cents) {
    const money = (cents / 100).toFixed(2);
    return '$' + money;
  }
}

// Initialize all product grids on the page
document.addEventListener('DOMContentLoaded', function() {
  const productGrids = document.querySelectorAll('.product-grid-advanced');
  productGrids.forEach(grid => {
    new ProductGridAdvanced(grid);
  });
});

// Export for use in other scripts
window.ProductGridAdvanced = ProductGridAdvanced;
