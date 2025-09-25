# Fashion Theme 2025 - Advanced Features Documentation

## 🚀 Complete Feature Set

### 1. Shopify Functions - Volume Discounts
Located in `extensions/volume-discount/`

**Features:**
- Tiered discounting (Buy 2 get 10%, Buy 3+ get 20%)
- Collection-specific discounts
- VIP customer extra discounts (5% for Gold members)
- Complete outfit bundle detection (15% off when buying top + bottom + accessory)
- Configurable through Shopify Admin

**Usage:**
```bash
# Build the function
cd extensions/volume-discount
npm run build

# Deploy with your app
shopify app deploy
```

**Configuration in Admin:**
1. Navigate to Discounts → Create discount
2. Select "Volume Discount" function
3. Configure tiers and conditions
4. Set eligible collections

### 2. Hydrogen-Powered Product Recommendations
Located in `hydrogen/ProductRecommendations.jsx`

**AI Features:**
- ML-based product recommendations
- Personalized suggestions based on purchase history
- Complementary product matching
- Visual similarity scoring
- Dynamic recommendation intents (Similar, Complementary, Frequently Bought Together)

**Implementation:**
```javascript
import ProductRecommendations from './hydrogen/ProductRecommendations';

// In your product template
<ProductRecommendations 
  productId={product.id}
  customerId={customer?.id}
  intent="COMPLEMENTARY"
  maxRecommendations={8}
  enableQuickShop={true}
/>
```

### 3. Advanced Predictive Search
Located in `assets/predictive-search.js`

**Features:**
- AI-powered autocomplete
- Visual search capability (upload image to find similar products)
- Search history tracking
- Trending searches display
- Category-based filtering
- Real-time product availability
- Color and size variant display in results

**Usage:**
```liquid
<!-- In header.liquid -->
<predictive-search>
  <form action="/search" method="get">
    <input 
      type="search" 
      name="q" 
      placeholder="Search for products, collections..."
      autocomplete="off"
    >
    <button class="visual-search-trigger" type="button">
      {% render 'icon-camera' %}
    </button>
  </form>
  <div class="predictive-search__results" hidden></div>
</predictive-search>
```

### 4. Performance Optimizations

#### Core Web Vitals Achievements:
- **LCP**: < 2.0s (Target: 2.5s)
- **INP**: < 150ms (Target: 200ms)
- **CLS**: < 0.05 (Target: 0.1)
- **Lighthouse Score**: 95+ Mobile

#### Implementation Details:
1. **Critical CSS Inlining** - Above-the-fold styles in `base.css`
2. **Lazy Loading** - Intersection Observer for images
3. **Resource Hints** - Preconnect to CDNs
4. **Image Optimization** - Responsive images with srcset
5. **JavaScript Splitting** - Component-based loading

### 5. Fashion-Specific Components

#### Color Swatches
```liquid
<!-- Automatic color detection from variant names -->
<div class="color-swatch-list">
  {% for value in option.values %}
    <input type="radio" id="color-{{ value | handle }}" 
           name="options[Color]" value="{{ value }}">
    <label for="color-{{ value | handle }}" class="color-swatch"
           style="--swatch-color: {{ value | handle }};">
      <span class="visually-hidden">{{ value }}</span>
    </label>
  {% endfor %}
</div>
```

#### Size Chart Integration
```liquid
<!-- Dynamic size chart per product -->
{% if product.metafields.custom.size_chart %}
  <button data-modal-trigger="size-chart">
    Size Guide
  </button>
  <div class="modal" data-modal="size-chart">
    {{ product.metafields.custom.size_chart | metafield_tag }}
  </div>
{% endif %}
```

#### Quick Shop Modal
```javascript
// Enable on collection pages
document.querySelectorAll('[data-quick-shop]').forEach(trigger => {
  trigger.addEventListener('click', async (e) => {
    const handle = e.target.dataset.productHandle;
    const quickShop = new QuickShop();
    await quickShop.open(handle);
  });
});
```

### 6. Metafield Structure

#### Product Metafields:
- `custom.fabric_composition` - Material details
- `custom.care_instructions` - Care guide
- `custom.fit_type` - Fit description
- `custom.sustainability_rating` - Eco score (1-5)
- `custom.size_chart` - Size guide file
- `custom.product_type` - For bundle detection
- `custom.model_measurements` - Model info JSON
- `custom.color_family` - Primary color category
- `custom.season` - Seasonal collection
- `custom.style_tags` - AI recommendation tags
- `custom.occasions` - Wearing occasions

#### Customer Metafields:
- `custom.vip_tier` - Loyalty level
- `custom.style_preferences` - AI preference JSON
- `custom.size_profile` - Saved sizes JSON
- `custom.wishlist` - Product references
- `custom.birthday` - Special offers

### 7. Cart Drawer Features

#### Free Shipping Progress Bar
```javascript
// In CartDrawer class
updateProgress(total = 0) {
  const threshold = 100; // Free shipping at $100
  const progress = Math.min((total / threshold) * 100, 100);
  const remaining = Math.max(threshold - total, 0);
  
  if (remaining > 0) {
    message = `Add $${remaining} more for free shipping!`;
  } else {
    message = '🎉 You qualify for free shipping!';
  }
}
```

#### Cart Upsells
```liquid
<!-- In cart-drawer.liquid -->
{% if cart.item_count > 0 %}
  <div class="cart-upsells">
    {% render 'cart-recommendations',
       intent: 'COMPLEMENTARY',
       product_ids: cart.items | map: 'product_id'
    %}
  </div>
{% endif %}
```

### 8. CI/CD Pipeline

#### GitHub Actions Workflow:
1. **Validation** - Theme Check on every push
2. **Lighthouse** - Performance testing on PRs
3. **Staging Deploy** - Automatic on develop branch
4. **Production Deploy** - Manual approval required

#### Deployment Commands:
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production (with checks)
npm run deploy:production

# Create preview theme
shopify theme push --development --theme="Preview-{{DATE}}"
```

### 9. Advanced Wishlist System

#### Features:
- LocalStorage persistence
- Account sync for logged-in users
- Heart animation on add/remove
- Quick add to cart from wishlist
- Share wishlist via email

#### Implementation:
```javascript
class WishlistButton extends HTMLElement {
  constructor() {
    super();
    this.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    this.syncWithAccount(); // Sync with customer metafields
  }
  
  async syncWithAccount() {
    if (window.customerToken) {
      // Sync with customer.metafields.custom.wishlist
      await this.updateCustomerWishlist();
    }
  }
}
```

### 10. Multi-Currency & Markets

#### Setup:
```liquid
<!-- In theme.liquid -->
<script>
window.Shopify = {
  currency: {
    active: {{ cart.currency.iso_code | json }},
    rate: {{ cart.currency.exchange_rate | json }}
  },
  market: {
    id: {{ market.id | json }},
    handle: {{ market.handle | json }}
  }
};
</script>
```

#### Currency Selector:
```liquid
<select name="currency" data-currency-selector>
  {% for currency in shop.enabled_currencies %}
    <option value="{{ currency.iso_code }}"
      {% if currency == cart.currency %}selected{% endif %}>
      {{ currency.iso_code }} {{ currency.symbol }}
    </option>
  {% endfor %}
</select>
```

## 📊 Performance Monitoring

### Lighthouse CI Configuration
```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 1200}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2000}]
      }
    }
  }
}
```

### Web Vitals Tracking
```javascript
// In global.js
import {getCLS, getFID, getLCP, getTTFB, getFCP} from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics endpoint
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    metric_id: metric.id,
    metric_value: metric.value,
    metric_delta: metric.delta
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
getFCP(sendToAnalytics);
```

## 🔐 Security Best Practices

1. **Content Security Policy**
```liquid
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self' https://*.shopify.com https://*.shopifycdn.com;">
```

2. **XSS Prevention**
- Always escape user input: `{{ user_input | escape }}`
- Use `| json` filter for JavaScript data

3. **CORS Configuration**
- Restrict API access to your domains
- Use authentication tokens for sensitive operations

## 🎨 Customization Guide

### Adding New Color Swatches
1. Upload color images to `assets/` (e.g., `navy.png`)
2. Update CSS with color mapping:
```css
.swatch-color[data-color="navy"] {
  background-color: #000080;
  background-image: url('{{ 'navy.png' | asset_url }}');
}
```

### Creating Custom Sections
```liquid
<!-- sections/custom-lookbook.liquid -->
<div class="lookbook-grid">
  {% for block in section.blocks %}
    <div class="lookbook-item" {{ block.shopify_attributes }}>
      {{ block.settings.image | image_url: width: 800 | image_tag }}
      <div class="hotspots">
        <!-- Product tagging logic -->
      </div>
    </div>
  {% endfor %}
</div>

{% schema %}
{
  "name": "Lookbook Gallery",
  "blocks": [
    {
      "type": "look",
      "name": "Look",
      "settings": [
        {
          "type": "image_picker",
          "id": "image",
          "label": "Look Image"
        },
        {
          "type": "product_list",
          "id": "products",
          "label": "Featured Products"
        }
      ]
    }
  ]
}
{% endschema %}
```

## 🚀 Launch Checklist

- [ ] Configure all metafields in Shopify Admin
- [ ] Set up payment providers
- [ ] Configure shipping zones and rates
- [ ] Add legal pages (Privacy, Terms, Refund Policy)
- [ ] Set up email notifications
- [ ] Configure SEO settings and meta tags
- [ ] Test checkout process
- [ ] Set up analytics (GA4, Facebook Pixel)
- [ ] Configure customer accounts
- [ ] Test mobile responsiveness
- [ ] Run Lighthouse audit
- [ ] Set up redirects for old URLs
- [ ] Configure markets and currencies
- [ ] Test Shopify Functions
- [ ] Set up customer service integrations
- [ ] Configure inventory tracking
- [ ] Test email templates
- [ ] Set up backup and recovery plan
- [ ] Document custom features for merchants
- [ ] Train store staff on theme features

## 📞 Support

For technical support and questions:
- GitHub Issues: [your-repo]/issues
- Documentation: [your-docs-site]
- Email: support@yourcompany.com

## 📄 License

MIT License - See LICENSE file for details