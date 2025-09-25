// Shopify Function: Volume Discount for Fashion Collections
// Buy 2 get 10% off, Buy 3+ get 20% off on selected collections

import { DiscountApplicationStrategy } from "../generated/api";

const VOLUME_DISCOUNTS = [
  { quantity: 2, percentage: 10 },
  { quantity: 3, percentage: 20 }
];

const ELIGIBLE_COLLECTIONS = [
  "seasonal-collection",
  "clearance",
  "basics"
];

type Configuration = {
  discountMessage: string;
  minimumQuantity: number;
  discountPercentage: number;
  stackWithOtherDiscounts: boolean;
};

type Input = {
  cart: {
    lines: Array<{
      id: string;
      quantity: number;
      merchandise: {
        __typename: string;
        id: string;
        product: {
          id: string;
          vendor: string;
          collections: Array<{
            id: string;
            handle: string;
          }>;
          metafields?: Array<{
            namespace: string;
            key: string;
            value: string;
          }>;
        };
      };
    }>;
    buyerIdentity?: {
      customer?: {
        id: string;
        metafields?: Array<{
          namespace: string;
          key: string;
          value: string;
        }>;
        amountSpent: {
          amount: string;
          currencyCode: string;
        };
      };
    };
  };
  discountNode: {
    metafield?: {
      value: string;
    };
  };
};

type FunctionResult = {
  discountApplicationStrategy: DiscountApplicationStrategy;
  discounts: Array<{
    message?: string;
    value: {
      percentage?: {
        value: number;
      };
      fixedAmount?: {
        amount: number;
      };
    };
    targets: Array<{
      cartLine: {
        id: string;
      };
    }>;
    conditions?: Array<{
      customerSegment?: {
        id: string;
      };
    }>;
  }>;
};

export default function run(input: Input): FunctionResult {
  const discounts = [];
  const configuration: Configuration = input.discountNode?.metafield?.value 
    ? JSON.parse(input.discountNode.metafield.value)
    : {
        discountMessage: "Volume Discount Applied",
        minimumQuantity: 2,
        discountPercentage: 10,
        stackWithOtherDiscounts: false
      };

  // Group products by collection
  const collectionGroups: Map<string, Array<any>> = new Map();
  
  for (const line of input.cart.lines) {
    if (line.merchandise.__typename !== "ProductVariant") {
      continue;
    }

    const collections = line.merchandise.product.collections || [];
    
    for (const collection of collections) {
      if (ELIGIBLE_COLLECTIONS.includes(collection.handle)) {
        if (!collectionGroups.has(collection.handle)) {
          collectionGroups.set(collection.handle, []);
        }
        collectionGroups.get(collection.handle)?.push({
          line,
          quantity: line.quantity
        });
      }
    }
  }

  // Calculate discounts for each collection group
  for (const [collectionHandle, items] of collectionGroups) {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Find applicable discount tier
    let discountPercentage = 0;
    for (const tier of VOLUME_DISCOUNTS) {
      if (totalQuantity >= tier.quantity) {
        discountPercentage = tier.percentage;
      }
    }

    if (discountPercentage > 0) {
      const targets = items.map(item => ({
        cartLine: {
          id: item.line.id
        }
      }));

      discounts.push({
        message: `${discountPercentage}% off - Buy ${totalQuantity} items from ${collectionHandle}`,
        value: {
          percentage: {
            value: discountPercentage
          }
        },
        targets
      });
    }
  }

  // VIP Customer Extra Discount
  const customer = input.cart.buyerIdentity?.customer;
  if (customer) {
    const amountSpent = parseFloat(customer.amountSpent.amount);
    const vipTier = customer.metafields?.find(m => 
      m.namespace === "custom" && m.key === "vip_tier"
    );

    if (vipTier?.value === "gold" || amountSpent > 5000) {
      // Add extra 5% for VIP customers
      for (const line of input.cart.lines) {
        if (line.merchandise.__typename === "ProductVariant") {
          discounts.push({
            message: "VIP Gold Member - Extra 5% off",
            value: {
              percentage: {
                value: 5
              }
            },
            targets: [{
              cartLine: {
                id: line.id
              }
            }]
          });
        }
      }
    }
  }

  // Bundle Detection - Complete outfit discount
  const hasTop = input.cart.lines.some(line => 
    line.merchandise.__typename === "ProductVariant" &&
    line.merchandise.product.metafields?.some(m => 
      m.namespace === "custom" && m.key === "product_type" && m.value === "top"
    )
  );
  
  const hasBottom = input.cart.lines.some(line =>
    line.merchandise.__typename === "ProductVariant" &&
    line.merchandise.product.metafields?.some(m =>
      m.namespace === "custom" && m.key === "product_type" && m.value === "bottom"
    )
  );

  const hasAccessory = input.cart.lines.some(line =>
    line.merchandise.__typename === "ProductVariant" &&
    line.merchandise.product.metafields?.some(m =>
      m.namespace === "custom" && m.key === "product_type" && m.value === "accessory"
    )
  );

  if (hasTop && hasBottom && hasAccessory) {
    // Complete outfit bundle - 15% off everything
    const allTargets = input.cart.lines
      .filter(line => line.merchandise.__typename === "ProductVariant")
      .map(line => ({
        cartLine: {
          id: line.id
        }
      }));

    discounts.push({
      message: "Complete Outfit Bundle - 15% off",
      value: {
        percentage: {
          value: 15
        }
      },
      targets: allTargets
    });
  }

  return {
    discountApplicationStrategy: configuration.stackWithOtherDiscounts 
      ? DiscountApplicationStrategy.Maximum 
      : DiscountApplicationStrategy.First,
    discounts
  };
}