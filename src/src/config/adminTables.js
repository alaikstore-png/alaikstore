// Central config for the admin CRUD panels: which Supabase table each tab writes
// to, what to show in the row list, and what fields the add/edit form should render.
// `optionsSource` fields get their `options` filled in at runtime from reference
// lists (categories / games / providers) fetched once by DashboardAdmin.

export const TABLE_CONFIG = {
  banners: {
    table: 'banners',
    titleField: 'title',
    canAdd: true,
    canDelete: true,
    fields: [
      { key: 'title', label: 'Judul', type: 'text', required: true },
      { key: 'subtitle', label: 'Subjudul', type: 'text' },
      { key: 'image_url', label: 'URL Gambar', type: 'text', required: true },
      { key: 'link_url', label: 'Link Tujuan', type: 'text' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  games: {
    table: 'games',
    titleField: 'name',
    canAdd: true,
    canDelete: true,
    fields: [
      { key: 'name', label: 'Nama Game', type: 'text', required: true },
      { key: 'slug', label: 'Slug (URL)', type: 'text', required: true },
      { key: 'publisher', label: 'Publisher', type: 'text' },
      { key: 'category_id', label: 'Kategori', type: 'select', optionsSource: 'categories', required: true },
      { key: 'thumbnail_url', label: 'URL Thumbnail', type: 'text' },
      { key: 'banner_url', label: 'URL Banner Detail', type: 'text' },
      { key: 'is_hot', label: 'Tandai Terlaris', type: 'checkbox' },
      { key: 'needs_server_id', label: 'Butuh Server ID', type: 'checkbox' },
      { key: 'sort_order', label: 'Urutan', type: 'number' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  products: {
    table: 'products',
    titleField: 'name',
    canAdd: true,
    canDelete: true,
    fields: [
      { key: 'game_id', label: 'Game', type: 'select', optionsSource: 'games', required: true },
      { key: 'provider_id', label: 'Provider', type: 'select', optionsSource: 'providers' },
      { key: 'sku_code', label: 'Kode SKU Provider', type: 'text' },
      { key: 'name', label: 'Nama Nominal', type: 'text', required: true },
      { key: 'base_price', label: 'Harga Modal', type: 'number', required: true },
      { key: 'sell_price', label: 'Harga Jual (Publik)', type: 'number', required: true },
      { key: 'discount_price', label: 'Harga Diskon Publik (opsional)', type: 'number' },
      { key: 'price_member', label: 'Harga Member (opsional)', type: 'number' },
      { key: 'price_reseller', label: 'Harga Reseller (opsional)', type: 'number' },
      { key: 'is_popular', label: 'Tandai Populer', type: 'checkbox' },
      {
        key: 'stock_status', label: 'Status Stok', type: 'select',
        options: [{ value: 'available', label: 'Tersedia' }, { value: 'empty', label: 'Kosong' }],
      },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  vouchers: {
    table: 'promos',
    titleField: 'code',
    canAdd: true,
    canDelete: true,
    fields: [
      { key: 'code', label: 'Kode Voucher', type: 'text', required: true },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      {
        key: 'discount_type', label: 'Tipe Diskon', type: 'select', required: true,
        options: [{ value: 'percent', label: 'Persen (%)' }, { value: 'fixed', label: 'Nominal (Rp)' }],
      },
      { key: 'discount_value', label: 'Nilai Diskon', type: 'number', required: true },
      { key: 'min_purchase', label: 'Minimal Pembelian', type: 'number' },
      { key: 'max_discount', label: 'Maks. Potongan', type: 'number' },
      { key: 'usage_limit', label: 'Batas Pemakaian', type: 'number' },
      { key: 'expires_at', label: 'Berlaku Hingga', type: 'date' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  users: {
    table: 'users',
    titleField: 'full_name',
    canAdd: false, // user rows are created automatically on sign-up
    canDelete: false,
    fields: [
      { key: 'full_name', label: 'Nama Lengkap', type: 'text' },
      { key: 'phone', label: 'Nomor WhatsApp', type: 'text' },
      { key: 'role', label: 'Role', type: 'select', options: [{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }], required: true },
      { key: 'balance', label: 'Saldo', type: 'number' },
      {
        key: 'price_tier', label: 'Tingkat Harga', type: 'select', required: true,
        options: [{ value: 'public', label: 'Publik' }, { value: 'member', label: 'Member' }, { value: 'reseller', label: 'Reseller' }],
      },
      { key: 'is_affiliate', label: 'Boleh Jadi Affiliate', type: 'checkbox' },
      { key: 'affiliate_rate', label: 'Komisi Affiliate (%)', type: 'number' },
    ],
  },
  affiliate_commissions: {
    table: 'affiliate_commissions',
    titleField: 'id',
    canAdd: false,
    canDelete: false,
    fields: [
      { key: 'amount', label: 'Nominal Komisi', type: 'number' },
      { key: 'rate', label: 'Rate (%)', type: 'number' },
      {
        key: 'status', label: 'Status', type: 'select',
        options: [{ value: 'credited', label: 'Credited' }, { value: 'reversed', label: 'Reversed' }],
      },
    ],
  },
  cashback_transactions: {
    table: 'cashback_transactions',
    titleField: 'id',
    canAdd: false,
    canDelete: false,
    fields: [
      { key: 'amount', label: 'Nominal Cashback', type: 'number' },
      { key: 'rate', label: 'Rate (%)', type: 'number' },
    ],
  },
  orders: {
    table: 'orders',
    titleField: 'product_slug',
    canAdd: false,
    canDelete: false,
    fields: [
      {
        key: 'status', label: 'Status Pesanan', type: 'select', required: true,
        options: ['pending', 'paid', 'processing', 'success', 'failed', 'expired'].map((s) => ({ value: s, label: s })),
      },
    ],
  },
  providers: {
    table: 'providers',
    titleField: 'name',
    canAdd: true,
    canDelete: true,
    fields: [
      {
        key: 'name', label: 'Nama Provider', type: 'select', required: true,
        options: ['VIP Reseller', 'Digiflazz', 'APIGames', 'Tokovoucher', 'MedanPedia'].map((n) => ({ value: n, label: n })),
      },
      { key: 'base_url', label: 'Base URL API', type: 'text' },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  flash_sales: {
    table: 'flash_sales',
    titleField: 'title',
    canAdd: true,
    canDelete: true,
    // Custom select so the row list can show the product name instead of a raw uuid.
    selectQuery: 'id, product_id, title, discount_type, discount_value, stock_limit, sold_count, starts_at, ends_at, is_active, created_at, products(name, games(name))',
    fields: [
      { key: 'product_id', label: 'Produk', type: 'select', optionsSource: 'products', required: true },
      { key: 'title', label: 'Judul Flash Sale', type: 'text', required: true },
      {
        key: 'discount_type', label: 'Tipe Diskon', type: 'select', required: true,
        options: [{ value: 'percent', label: 'Persen (%)' }, { value: 'fixed', label: 'Potongan Nominal (Rp)' }],
      },
      { key: 'discount_value', label: 'Nilai Diskon', type: 'number', required: true },
      { key: 'stock_limit', label: 'Kuota Stok Flash Sale', type: 'number', required: true },
      { key: 'starts_at', label: 'Mulai', type: 'datetime-local', required: true },
      { key: 'ends_at', label: 'Berakhir', type: 'datetime-local', required: true },
      { key: 'is_active', label: 'Aktif', type: 'checkbox' },
    ],
  },
  product_provider_links: {
    table: 'product_provider_links',
    titleField: 'sku_code',
    canAdd: true,
    canDelete: true,
    // Custom select so the row list can show product name + provider name
    // instead of just raw foreign-key uuids.
    selectQuery: 'id, product_id, provider_id, sku_code, provider_price, priority, is_active, created_at, products(name, games(name)), providers(name)',
    fields: [
      { key: 'product_id', label: 'Produk', type: 'select', optionsSource: 'products', required: true },
      { key: 'provider_id', label: 'Provider', type: 'select', optionsSource: 'providers', required: true },
      { key: 'sku_code', label: 'Kode SKU / Service ID Provider Ini', type: 'text', required: true },
      { key: 'provider_price', label: 'Harga Modal dari Provider Ini', type: 'number', required: true },
      { key: 'priority', label: 'Prioritas Manual (0 = default, makin kecil dicoba lebih dulu)', type: 'number' },
      { key: 'is_active', label: 'Aktif (ikut dipertimbangkan saat pilih termurah)', type: 'checkbox' },
    ],
  },
}
