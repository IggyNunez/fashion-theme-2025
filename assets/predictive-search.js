/**
 * Advanced Predictive Search with AI Autocomplete
 * Fashion-specific search with visual results and filters
 */

class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input[type="search"]');
    this.results = this.querySelector('.predictive-search__results');
    this.searchHistory = this.loadSearchHistory();
    this.trendingSearches = [];
    this.debounceTimer = null;
    this.currentQuery = '';
    this.abortController = null;
    
    this.init();
  }

  async init() {
    // Load trending searches
    await this.loadTrendingSearches();
    
    // Event listeners
    this.input?.addEventListener('input', this.handleInput.bind(this));
    this.input?.addEventListener('focus', this.handleFocus.bind(this));
    this.input?.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) {
        this.close();
      }
    });
    
    // Initialize AI suggestions
    this.initAISuggestions();
  }

  handleInput(event) {
    const query = event.target.value.trim();
    
    // Clear previous timer
    clearTimeout(this.debounceTimer);
    
    // Abort previous request
    if (this.abortController) {
      this.abortController.abort();
    }
    
    if (query.length < 2) {
      this.showDefaultSuggestions();
      return;
    }
    
    // Debounce search
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, 300);
    
    // Show instant AI suggestions
    this.showAISuggestions(query);
  }

  async performSearch(query) {
    this.currentQuery = query;
    this.abortController = new AbortController();
    
    try {
      // Parallel requests for different result types
      const [products, collections, articles, suggestions] = await Promise.all([
        this.searchProducts(query),
        this.searchCollections(query),
        this.searchArticles(query),
        this.getAISuggestions(query)
      ]);
      
      this.renderResults({
        products,
        collections,
        articles,
        suggestions,
        query
      });
      
      // Track successful search
      this.trackSearch(query);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
        this.showError();
      }
    }
  }

  async searchProducts(query) {
    const response = await fetch(
      `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=10&resources[options][unavailable_products]=last&resources[options][fields]=title,product_type,vendor,variants.title,tag,variants.sku`,
      { signal: this.abortController.signal }
    );
    
    const data = await response.json();
    return this.processProductResults(data.resources.results.products || []);
  }

  processProductResults(products) {
    return products.map(product => {
      // Calculate relevance score
      const relevanceScore = this.calculateRelevance(product, this.currentQuery);
      
      // Extract color and size options
      const colors = new Set();
      const sizes = new Set();
      
      product.variants?.forEach(variant => {
        const variantTitle = variant.title.toLowerCase();
        
        // Extract colors (common fashion colors)
        ['black', 'white', 'red', 'blue', 'green', 'navy', 'grey', 'beige', 'pink'].forEach(color => {
          if (variantTitle.includes(color)) colors.add(color);
        });
        
        // Extract sizes
        ['xs', 's', 'm', 'l', 'xl', 'xxl'].forEach(size => {
          if (variantTitle.includes(size)) sizes.add(size.toUpperCase());
        });
      });
      
      return {
        ...product,
        relevanceScore,
        availableColors: Array.from(colors),
        availableSizes: Array.from(sizes),
        badges: this.generateSearchBadges(product)
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateRelevance(product, query) {
    let score = 0;
    const queryLower = query.toLowerCase();
    const titleLower = product.title.toLowerCase();
    
    // Exact match in title
    if (titleLower === queryLower) score += 100;
    
    // Title starts with query
    if (titleLower.startsWith(queryLower)) score += 50;
    
    // Title contains query
    if (titleLower.includes(queryLower)) score += 30;
    
    // Product type match
    if (product.product_type?.toLowerCase().includes(queryLower)) score += 20;
    
    // Tag match
    if (product.tags?.some(tag => tag.toLowerCase().includes(queryLower))) score += 15;
    
    // Vendor match
    if (product.vendor?.toLowerCase().includes(queryLower)) score += 10;
    
    // Boost for available products
    if (product.available) score += 25;
    
    // Boost for products with images
    if (product.image) score += 10;
    
    // Boost for sale items
    if (product.compare_at_price && product.price < product.compare_at_price) {
      score += 20;
    }
    
    return score;
  }

  generateSearchBadges(product) {
    const badges = [];
    
    if (!product.available) {
      badges.push({ type: 'sold-out', text: 'Sold Out' });
    }
    
    if (product.compare_at_price && product.price < product.compare_at_price) {
      const discount = Math.round(
        ((product.compare_at_price - product.price) / product.compare_at_price) * 100
      );
      badges.push({ type: 'sale', text: `${discount}% OFF` });
    }
    
    // Check if new (would need created date)
    const createdDate = new Date(product.created_at);
    const daysSinceCreated = (Date.now() - createdDate) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 14) {
      badges.push({ type: 'new', text: 'NEW' });
    }
    
    return badges;
  }

  async getAISuggestions(query) {
    // Simulate AI suggestions based on query analysis
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // Fashion-specific suggestions
    const fashionTerms = {
      'dress': ['summer dress', 'cocktail dress', 'maxi dress', 'midi dress', 'evening dress'],
      'shirt': ['t-shirt', 'polo shirt', 'dress shirt', 'casual shirt', 'oversized shirt'],
      'pants': ['jeans', 'chinos', 'trousers', 'leggings', 'cargo pants'],
      'jacket': ['denim jacket', 'leather jacket', 'bomber jacket', 'blazer', 'windbreaker'],
      'shoes': ['sneakers', 'boots', 'sandals', 'heels', 'loafers'],
      'bag': ['tote bag', 'crossbody bag', 'backpack', 'clutch', 'messenger bag']
    };
    
    // Find matching category
    for (const [key, values] of Object.entries(fashionTerms)) {
      if (queryLower.includes(key)) {
        suggestions.push(...values.filter(v => v.includes(queryLower) || queryLower.includes(v)));
      }
    }
    
    // Add style suggestions
    if (queryLower.includes('casual')) {
      suggestions.push('casual friday', 'casual chic', 'smart casual');
    }
    
    if (queryLower.includes('formal')) {
      suggestions.push('formal wear', 'formal dress', 'business formal');
    }
    
    // Add seasonal suggestions
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) { // Spring
      suggestions.push('spring collection', 'light layers', 'pastel colors');
    } else if (month >= 5 && month <= 7) { // Summer
      suggestions.push('summer essentials', 'beach wear', 'lightweight fabrics');
    } else if (month >= 8 && month <= 10) { // Fall
      suggestions.push('fall fashion', 'layering pieces', 'autumn colors');
    } else { // Winter
      suggestions.push('winter coats', 'cozy knits', 'holiday outfits');
    }
    
    return suggestions.slice(0, 5);
  }

  renderResults({ products, collections, articles, suggestions, query }) {
    const html = `
      <div class="predictive-search__content">
        ${suggestions.length > 0 ? `
          <div class="search-suggestions">
            <h3 class="search-section-title">Suggestions</h3>
            <ul class="suggestions-list">
              ${suggestions.map(suggestion => `
                <li>
                  <button class="suggestion-item" data-suggestion="${suggestion}">
                    <svg class="icon icon-search" viewBox="0 0 20 20">
                      <path d="M8 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm9.707 4.293l-4.82-4.82C13.585 10.493 14 9.296 14 8c0-3.313-2.687-6-6-6S2 4.687 2 8s2.687 6 6 6c1.296 0 2.493-.415 3.473-1.113l4.82 4.82c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.024 0-1.414z"/>
                    </svg>
                    <span>${suggestion}</span>
                    <svg class="icon icon-arrow" viewBox="0 0 20 20">
                      <path d="M7 2l8 8-8 8" stroke="currentColor" fill="none" stroke-width="2"/>
                    </svg>
                  </button>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${products.length > 0 ? `
          <div class="search-products">
            <h3 class="search-section-title">
              Products
              <a href="/search?q=${encodeURIComponent(query)}" class="view-all">
                View all ${products.length}+ results →
              </a>
            </h3>
            <div class="products-grid">
              ${products.slice(0, 6).map(product => `
                <a href="${product.url}" class="product-item">
                  <div class="product-media">
                    ${product.image ? `
                      <img src="${product.image}" alt="${product.title}" loading="lazy">
                    ` : `
                      <div class="no-image">No Image</div>
                    `}
                    ${product.badges?.length > 0 ? `
                      <div class="product-badges">
                        ${product.badges.map(badge => `
                          <span class="badge badge--${badge.type}">${badge.text}</span>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                  <div class="product-info">
                    <h4 class="product-title">${this.highlightMatch(product.title, query)}</h4>
                    ${product.vendor ? `
                      <p class="product-vendor">${product.vendor}</p>
                    ` : ''}
                    <p class="product-price">
                      ${product.compare_at_price ? `
                        <span class="price--compare">$${product.compare_at_price}</span>
                      ` : ''}
                      <span class="price--main">$${product.price}</span>
                    </p>
                    ${product.availableColors?.length > 0 ? `
                      <div class="product-colors">
                        ${product.availableColors.slice(0, 5).map(color => `
                          <span class="color-dot" style="background-color: ${color}"></span>
                        `).join('')}
                        ${product.availableColors.length > 5 ? `
                          <span class="more-colors">+${product.availableColors.length - 5}</span>
                        ` : ''}
                      </div>
                    ` : ''}
                  </div>
                </a>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${collections.length > 0 ? `
          <div class="search-collections">
            <h3 class="search-section-title">Collections</h3>
            <ul class="collections-list">
              ${collections.map(collection => `
                <li>
                  <a href="${collection.url}" class="collection-item">
                    ${collection.image ? `
                      <img src="${collection.image}" alt="${collection.title}">
                    ` : ''}
                    <span>${this.highlightMatch(collection.title, query)}</span>
                    <span class="collection-count">${collection.products_count} items</span>
                  </a>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${products.length === 0 && collections.length === 0 ? `
          <div class="no-results">
            <p>No results for "<strong>${query}</strong>"</p>
            <p class="suggestions-prompt">Try searching for:</p>
            <ul class="alternative-searches">
              ${this.getAlternativeSearches(query).map(alt => `
                <li><button data-search="${alt}">${alt}</button></li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    
    this.results.innerHTML = html;
    this.open();
    
    // Add event listeners to suggestion items
    this.results.querySelectorAll('[data-suggestion]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.input.value = e.currentTarget.dataset.suggestion;
        this.performSearch(e.currentTarget.dataset.suggestion);
      });
    });
  }

  highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  getAlternativeSearches(query) {
    // Generate alternative search suggestions
    const alternatives = [];
    
    // Common misspellings
    const corrections = {
      'tshirt': 't-shirt',
      'mens': "men's",
      'womens': "women's",
      'denım': 'denim'
    };
    
    if (corrections[query.toLowerCase()]) {
      alternatives.push(corrections[query.toLowerCase()]);
    }
    
    // Related searches
    alternatives.push(
      'new arrivals',
      'best sellers',
      'sale items'
    );
    
    return alternatives.slice(0, 3);
  }

  showDefaultSuggestions() {
    const html = `
      <div class="predictive-search__default">
        ${this.searchHistory.length > 0 ? `
          <div class="search-history">
            <h3 class="search-section-title">
              Recent Searches
              <button class="clear-history">Clear</button>
            </h3>
            <ul class="history-list">
              ${this.searchHistory.map(term => `
                <li>
                  <button class="history-item" data-search="${term}">
                    <svg class="icon icon-clock" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M10 5v5l3 3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                    <span>${term}</span>
                  </button>
                  <button class="remove-history" data-term="${term}">×</button>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${this.trendingSearches.length > 0 ? `
          <div class="trending-searches">
            <h3 class="search-section-title">
              <svg class="icon icon-trending" viewBox="0 0 20 20">
                <path d="M3 13h2l2-4 2 8 2-6 2 3h4" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
              Trending Now
            </h3>
            <ul class="trending-list">
              ${this.trendingSearches.map(term => `
                <li>
                  <button class="trending-item" data-search="${term}">
                    ${term}
                  </button>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="popular-categories">
          <h3 class="search-section-title">Popular Categories</h3>
          <div class="categories-grid">
            <a href="/collections/new-arrivals" class="category-card">
              <span class="category-icon">🆕</span>
              <span>New Arrivals</span>
            </a>
            <a href="/collections/womens" class="category-card">
              <span class="category-icon">👗</span>
              <span>Women</span>
            </a>
            <a href="/collections/mens" class="category-card">
              <span class="category-icon">👔</span>
              <span>Men</span>
            </a>
            <a href="/collections/accessories" class="category-card">
              <span class="category-icon">👜</span>
              <span>Accessories</span>
            </a>
            <a href="/collections/shoes" class="category-card">
              <span class="category-icon">👟</span>
              <span>Shoes</span>
            </a>
            <a href="/collections/sale" class="category-card">
              <span class="category-icon">🏷️</span>
              <span>Sale</span>
            </a>
          </div>
        </div>
      </div>
    `;
    
    this.results.innerHTML = html;
    this.open();
    
    // Add event listeners
    this.results.querySelector('.clear-history')?.addEventListener('click', () => {
      this.clearSearchHistory();
    });
    
    this.results.querySelectorAll('[data-search]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const term = e.currentTarget.dataset.search;
        this.input.value = term;
        this.performSearch(term);
      });
    });
  }

  async loadTrendingSearches() {
    // In production, this would fetch from your analytics API
    this.trendingSearches = [
      'summer dress',
      'denim jacket',
      'white sneakers',
      'crossbody bag',
      'oversized blazer'
    ];
  }

  loadSearchHistory() {
    const history = localStorage.getItem('search-history');
    return history ? JSON.parse(history) : [];
  }

  saveSearchHistory(term) {
    if (!this.searchHistory.includes(term)) {
      this.searchHistory.unshift(term);
      this.searchHistory = this.searchHistory.slice(0, 5);
      localStorage.setItem('search-history', JSON.stringify(this.searchHistory));
    }
  }

  clearSearchHistory() {
    this.searchHistory = [];
    localStorage.removeItem('search-history');
    this.showDefaultSuggestions();
  }

  trackSearch(query) {
    // Save to history
    this.saveSearchHistory(query);
    
    // Send analytics event
    if (window.gtag) {
      window.gtag('event', 'search', {
        search_term: query
      });
    }
  }

  open() {
    this.setAttribute('data-open', 'true');
    this.results.removeAttribute('hidden');
  }

  close() {
    this.setAttribute('data-open', 'false');
    this.results.setAttribute('hidden', '');
  }

  handleFocus() {
    if (this.input.value.trim().length < 2) {
      this.showDefaultSuggestions();
    }
  }

  handleKeyDown(event) {
    // Handle arrow key navigation
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateResults(event.key === 'ArrowDown' ? 1 : -1);
    }
    
    // Handle enter key
    if (event.key === 'Enter') {
      const focused = this.results.querySelector('.focused');
      if (focused) {
        focused.click();
      }
    }
    
    // Handle escape key
    if (event.key === 'Escape') {
      this.close();
      this.input.blur();
    }
  }

  navigateResults(direction) {
    const items = this.results.querySelectorAll('a, button');
    const current = this.results.querySelector('.focused');
    let index = current ? Array.from(items).indexOf(current) : -1;
    
    // Remove previous focus
    current?.classList.remove('focused');
    
    // Calculate new index
    index += direction;
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;
    
    // Add focus to new item
    items[index]?.classList.add('focused');
  }

  // AI-powered visual search
  async initVisualSearch() {
    const uploadButton = this.querySelector('.visual-search-trigger');
    if (!uploadButton) return;
    
    uploadButton.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          await this.performVisualSearch(file);
        }
      };
      input.click();
    });
  }

  async performVisualSearch(imageFile) {
    // Show loading state
    this.showLoading();
    
    try {
      // In production, this would upload to your visual search API
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch('/api/visual-search', {
        method: 'POST',
        body: formData
      });
      
      const results = await response.json();
      this.renderVisualSearchResults(results);
      
    } catch (error) {
      console.error('Visual search failed:', error);
      this.showError('Visual search is temporarily unavailable');
    }
  }

  renderVisualSearchResults(results) {
    // Render visual search results with similarity scores
    const html = `
      <div class="visual-search-results">
        <h3>Visually Similar Items</h3>
        <div class="similarity-grid">
          ${results.products.map(product => `
            <a href="${product.url}" class="similarity-item">
              <img src="${product.image}" alt="${product.title}">
              <div class="similarity-score">${Math.round(product.similarity * 100)}% match</div>
              <h4>${product.title}</h4>
              <p>$${product.price}</p>
            </a>
          `).join('')}
        </div>
      </div>
    `;
    
    this.results.innerHTML = html;
    this.open();
  }
}

// Register custom element
customElements.define('predictive-search', PredictiveSearch);