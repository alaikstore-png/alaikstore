// Client-side flash sale helpers. Reads from the `flash_sale_performance`
// view (see migration 20260708) which already computes is_currently_live and
// sold_pct — this file just shapes it for the UI. The AUTHORITATIVE price and
// stock check always happens server-side in create-order (resolve_price +
// claim_flash_sale_stock), so nothing here can be spoofed into a cheaper order.

import { supabase } from './supabaseClient'

/** All flash sales currently live (within their time window and not sold out yet). */
export async function getActiveFlashSales() {
  const { data, error } = await supabase
    .from('flash_sale_performance')
    .select('*, flash_sales(products(id, name, sell_price, game_id, games(slug, name, thumbnail_url)))')
    .eq('is_currently_live', true)
    .order('ends_at', { ascending: true })

  if (error || !data) return []

  return data.map((r) => {
    const product = r.flash_sales?.products
    const flashPrice =
      r.discount_type === 'percent'
        ? Math.max(Math.round(product?.sell_price - (product?.sell_price * r.discount_value) / 100), 0)
        : Math.max(product?.sell_price - r.discount_value, 0)

    return {
      id: r.id,
      title: r.title,
      productId: r.product_id,
      productName: r.product_name,
      gameSlug: product?.games?.slug,
      gameName: product?.games?.name,
      thumbnail: product?.games?.thumbnail_url,
      originalPrice: product?.sell_price,
      flashPrice,
      soldCount: r.sold_count,
      stockLimit: r.stock_limit,
      soldPct: r.sold_pct || 0,
      endsAt: r.ends_at,
    }
  }).filter((f) => f.gameSlug) // drop rows whose product/game got deleted after the flash sale was created
}

/**
 * Map of product_id -> live flash sale info, for pages (like ProductDetail)
 * that already have their own list of products and just need to know which
 * ones are currently on flash sale.
 */
export async function getLiveFlashSaleMap() {
  const list = await getActiveFlashSales()
  const map = {}
  for (const f of list) map[f.productId] = f
  return map
}
