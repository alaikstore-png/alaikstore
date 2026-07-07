// Client-side mirror of the tiered pricing rule in supabase/migrations (function
// resolve_price). Used ONLY to display the right price in the UI — the real,
// trusted price is always recalculated server-side in create-order so this
// can never be spoofed into a cheaper checkout.

export const TIER_LABEL = {
  public: 'Publik',
  member: 'Member',
  reseller: 'Reseller',
}

// product: { sell_price, discount_price, price_member, price_reseller }
export function resolveTierPrice(product, tier) {
  if (tier === 'reseller' && product.price_reseller != null) return Number(product.price_reseller)
  if (tier === 'member' && product.price_member != null) return Number(product.price_member)
  return Number(product.discount_price ?? product.sell_price)
}
