// Shared helpers for balance deposits and referral bonuses. Both use the
// `increment_balance` Postgres function (schema.sql) for atomic, race-safe updates.

export async function creditBalance(supabaseAdmin: any, userId: string, amount: number) {
  const { error } = await supabaseAdmin.rpc('increment_balance', { uid: userId, amount })
  if (error) throw error
}

/**
 * Grants a one-time referral bonus to whoever referred `userId`, the first
 * time `userId`'s order ever reaches "success" (checked by excluding the
 * current order and counting any prior successful orders).
 */
export async function maybeGrantReferralBonus(supabaseAdmin: any, userId: string, currentOrderId: string) {
  const bonus = Number(Deno.env.get('REFERRAL_BONUS') || 5000)

  const { data: user } = await supabaseAdmin.from('users').select('referred_by').eq('id', userId).maybeSingle()
  if (!user?.referred_by) return

  const { count } = await supabaseAdmin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'success')
    .neq('id', currentOrderId)
  if (count && count > 0) return // not this user's first successful order — bonus already handled (or not owed)

  const { data: referrer } = await supabaseAdmin.from('users').select('id').eq('referral_code', user.referred_by).maybeSingle()
  if (!referrer) return

  await creditBalance(supabaseAdmin, referrer.id, bonus)
  await supabaseAdmin.from('logs').insert({
    type: 'referral_bonus',
    message: `Bonus referral Rp${bonus} untuk ${referrer.id} (dari pembelian pertama ${userId})`,
    payload: { referrer_id: referrer.id, referred_user_id: userId, order_id: currentOrderId, bonus },
  })
}
