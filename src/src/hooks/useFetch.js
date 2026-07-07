import { useEffect, useState, useCallback } from 'react'

/**
 * Generic hook to run a Supabase query builder and expose { data, loading, error, refetch }
 * Usage: const { data, loading } = useFetch(() => supabase.from('games').select('*'), [])
 */
export function useFetch(queryFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await queryFn()
      if (error) throw error
      setData(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { data, loading, error, refetch: run }
}
