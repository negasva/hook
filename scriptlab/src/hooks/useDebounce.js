import { useCallback, useRef } from 'react'

export function useDebounce(fn, delay) {
  const fnRef   = useRef(fn)
  fnRef.current = fn            // always points to the latest closure

  const timer = useRef(null)

  const cancel = useCallback(() => clearTimeout(timer.current), [])

  const debounced = useCallback(
    (...args) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => fnRef.current(...args), delay)
    },
    [delay],
  )

  return { debounced, cancel }
}
