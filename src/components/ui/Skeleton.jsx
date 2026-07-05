export function ProductCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="skeleton aspect-square rounded-none" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="skeleton h-2.5 w-1/2 rounded" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function LineSkeleton({ className = '' }) {
  return <div className={`skeleton h-4 rounded ${className}`} />
}
