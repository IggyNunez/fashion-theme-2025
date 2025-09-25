import { useState, useEffect } from 'react';
import { useShopQuery, ProductProvider, useProduct } from '@shopify/hydrogen-react';
import { gql } from '@shopify/hydrogen';

/**
 * AI-Powered Product Recommendations using Hydrogen
 * This component uses Shopify's Storefront API with ML-based recommendations
 */

const RECOMMENDATIONS_QUERY = gql`
  query ProductRecommendations(
    $productId: ID!
    $intent: RecommendationIntent
    $count: Int
  ) {
    productRecommendations(
      productId: $productId
      intent: $intent
      first: $count
    ) {
      id
      title
      handle
      vendor
      availableForSale
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      compareAtPriceRange {
        minVariantPrice {
          amount
        }
      }
      images(first: 2) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 100) {
        edges {
          node {
            id
            availableForSale
            selectedOptions {
              name
              value
            }
            image {
              url
              altText
            }
          }
        }
      }
      options {
        name
        values
      }
      metafields(identifiers: [
        {namespace: "custom", key: "fabric_composition"},
        {namespace: "custom", key: "care_instructions"},
        {namespace: "custom", key: "fit_type"},
        {namespace: "custom", key: "sustainability_rating"}
      ]) {
        key
        value
        type
      }
    }
  }
`;

const PERSONALIZED_QUERY = gql`
  query PersonalizedRecommendations(
    $customerId: ID!
    $productId: ID
  ) {
    customer(id: $customerId) {
      recommendations(first: 12) {
        products {
          ... on Product {
            id
            title
            handle
            vendor
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            metafield(namespace: "predictions", key: "score") {
              value
            }
          }
        }
        intent
        confidence
      }
      purchaseHistory: orders(first: 5) {
        edges {
          node {
            lineItems(first: 10) {
              edges {
                node {
                  variant {
                    product {
                      productType
                      vendor
                      tags
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export function ProductRecommendations({ 
  productId, 
  customerId,
  intent = 'COMPLEMENTARY',
  maxRecommendations = 8,
  layout = 'grid',
  enableQuickShop = true,
  showPersonalized = true 
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [activeView, setActiveView] = useState('ai-picks');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch standard recommendations
  const { data: recData, loading: recLoading } = useShopQuery({
    query: RECOMMENDATIONS_QUERY,
    variables: {
      productId,
      intent,
      count: maxRecommendations
    }
  });

  // Fetch personalized recommendations if customer is logged in
  const { data: personalData, loading: personalLoading } = useShopQuery({
    query: PERSONALIZED_QUERY,
    variables: {
      customerId,
      productId
    },
    skip: !customerId || !showPersonalized
  });

  useEffect(() => {
    if (!recLoading && recData) {
      setRecommendations(processRecommendations(recData.productRecommendations));
    }
    
    if (!personalLoading && personalData) {
      setPersonalizedRecs(processPersonalizedRecs(personalData.customer));
    }

    setIsLoading(recLoading || personalLoading);
  }, [recData, personalData, recLoading, personalLoading]);

  // Process recommendations with scoring
  const processRecommendations = (products) => {
    return products.map(product => ({
      ...product,
      score: calculateRecommendationScore(product),
      badges: generateProductBadges(product),
      quickShopData: prepareQuickShopData(product)
    })).sort((a, b) => b.score - a.score);
  };

  const calculateRecommendationScore = (product) => {
    let score = 100;
    
    // Boost for sustainability
    const sustainabilityRating = product.metafields?.find(m => m.key === 'sustainability_rating');
    if (sustainabilityRating?.value) {
      score += parseInt(sustainabilityRating.value) * 10;
    }
    
    // Boost for availability
    if (product.availableForSale) {
      score += 20;
    }
    
    // Boost for sale items
    if (product.compareAtPriceRange?.minVariantPrice?.amount) {
      const discount = 
        (product.compareAtPriceRange.minVariantPrice.amount - 
         product.priceRange.minVariantPrice.amount) /
        product.compareAtPriceRange.minVariantPrice.amount;
      score += discount * 50;
    }
    
    return score;
  };

  const generateProductBadges = (product) => {
    const badges = [];
    
    // Sale badge
    if (product.compareAtPriceRange?.minVariantPrice?.amount) {
      const discount = Math.round(
        ((product.compareAtPriceRange.minVariantPrice.amount - 
          product.priceRange.minVariantPrice.amount) /
         product.compareAtPriceRange.minVariantPrice.amount) * 100
      );
      badges.push({ type: 'sale', text: `${discount}% OFF` });
    }
    
    // Sustainability badge
    const sustainabilityRating = product.metafields?.find(m => m.key === 'sustainability_rating');
    if (sustainabilityRating?.value >= 4) {
      badges.push({ type: 'eco', text: 'ECO-FRIENDLY' });
    }
    
    // New arrival (would need created_at date)
    // badges.push({ type: 'new', text: 'NEW' });
    
    return badges;
  };

  const prepareQuickShopData = (product) => {
    // Prepare variant matrix for quick shop
    const variantMatrix = {};
    
    product.variants?.edges?.forEach(({ node: variant }) => {
      const key = variant.selectedOptions
        .map(opt => `${opt.name}:${opt.value}`)
        .join('|');
      variantMatrix[key] = {
        id: variant.id,
        available: variant.availableForSale,
        image: variant.image?.url
      };
    });
    
    return {
      options: product.options,
      variantMatrix,
      defaultVariant: product.variants?.edges?.[0]?.node?.id
    };
  };

  return (
    <div className="product-recommendations" data-layout={layout}>
      <div className="recommendations-header">
        <h2 className="recommendations-title">
          {customerId ? 'Picked for You' : 'You Might Also Like'}
        </h2>
        
        {customerId && (
          <div className="recommendations-tabs">
            <button 
              className={`tab ${activeView === 'ai-picks' ? 'active' : ''}`}
              onClick={() => setActiveView('ai-picks')}
            >
              AI Picks
            </button>
            <button 
              className={`tab ${activeView === 'similar' ? 'active' : ''}`}
              onClick={() => setActiveView('similar')}
            >
              Similar Items
            </button>
            <button 
              className={`tab ${activeView === 'complete' ? 'active' : ''}`}
              onClick={() => setActiveView('complete')}
            >
              Complete the Look
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton count={maxRecommendations} />
      ) : (
        <div className={`recommendations-grid ${layout}`}>
          {(activeView === 'ai-picks' ? personalizedRecs : recommendations)
            .slice(0, maxRecommendations)
            .map(product => (
              <ProductCard
                key={product.id}
                product={product}
                enableQuickShop={enableQuickShop}
                badges={product.badges}
                quickShopData={product.quickShopData}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, enableQuickShop, badges, quickShopData }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showQuickShop, setShowQuickShop] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleQuickShop = async () => {
    setShowQuickShop(true);
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    
    const variantKey = Object.entries(selectedOptions)
      .map(([name, value]) => `${name}:${value}`)
      .join('|');
    
    const variant = quickShopData.variantMatrix[variantKey];
    
    if (variant?.available) {
      try {
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{
              id: variant.id,
              quantity: 1
            }]
          })
        });
        
        // Trigger cart update event
        document.dispatchEvent(new CustomEvent('cart:updated'));
        setShowQuickShop(false);
      } catch (error) {
        console.error('Failed to add to cart:', error);
      }
    }
    
    setIsAddingToCart(false);
  };

  return (
    <article className="recommendation-card">
      <a href={`/products/${product.handle}`} className="card-media-link">
        <div className="card-media">
          {product.images?.edges?.[0] && (
            <img
              src={product.images.edges[0].node.url}
              alt={product.images.edges[0].node.altText || product.title}
              loading="lazy"
              className="primary-image"
            />
          )}
          {product.images?.edges?.[1] && (
            <img
              src={product.images.edges[1].node.url}
              alt={product.images.edges[1].node.altText || product.title}
              loading="lazy"
              className="secondary-image"
            />
          )}
          
          {badges?.length > 0 && (
            <div className="product-badges">
              {badges.map((badge, idx) => (
                <span key={idx} className={`badge badge--${badge.type}`}>
                  {badge.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </a>

      <div className="card-content">
        <h3 className="card-title">
          <a href={`/products/${product.handle}`}>{product.title}</a>
        </h3>
        
        {product.vendor && (
          <p className="card-vendor">{product.vendor}</p>
        )}
        
        <div className="card-price">
          {product.compareAtPriceRange?.minVariantPrice?.amount && (
            <span className="price--compare">
              ${product.compareAtPriceRange.minVariantPrice.amount}
            </span>
          )}
          <span className="price--main">
            ${product.priceRange.minVariantPrice.amount}
          </span>
        </div>

        {enableQuickShop && (
          <button 
            className="quick-shop-trigger"
            onClick={handleQuickShop}
            aria-label={`Quick shop for ${product.title}`}
          >
            Quick Shop
          </button>
        )}
      </div>

      {showQuickShop && (
        <QuickShopModal
          product={product}
          quickShopData={quickShopData}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          onAddToCart={handleAddToCart}
          onClose={() => setShowQuickShop(false)}
          isAddingToCart={isAddingToCart}
        />
      )}
    </article>
  );
}

function QuickShopModal({ 
  product, 
  quickShopData, 
  selectedOptions, 
  setSelectedOptions, 
  onAddToCart, 
  onClose,
  isAddingToCart 
}) {
  return (
    <div className="quick-shop-modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-grid">
          <div className="modal-media">
            {product.images?.edges?.[0] && (
              <img
                src={product.images.edges[0].node.url}
                alt={product.title}
              />
            )}
          </div>
          
          <div className="modal-details">
            <h2>{product.title}</h2>
            <p className="vendor">{product.vendor}</p>
            
            <div className="price">
              ${product.priceRange.minVariantPrice.amount}
            </div>
            
            <div className="options">
              {quickShopData.options?.map(option => (
                <div key={option.name} className="option-group">
                  <label>{option.name}</label>
                  <div className="option-values">
                    {option.values.map(value => (
                      <button
                        key={value}
                        className={`option-value ${
                          selectedOptions[option.name] === value ? 'selected' : ''
                        }`}
                        onClick={() => 
                          setSelectedOptions(prev => ({
                            ...prev,
                            [option.name]: value
                          }))
                        }
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              className="add-to-cart-button"
              onClick={onAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({ count }) {
  return (
    <div className="recommendations-skeleton">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <div className="skeleton-media" />
          <div className="skeleton-content">
            <div className="skeleton-title" />
            <div className="skeleton-price" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductRecommendations;