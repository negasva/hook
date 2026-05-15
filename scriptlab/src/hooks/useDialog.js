import { useUIStore } from '../store/useUIStore'

export function useDialog() {
  const showDialog = useUIStore((s) => s.showDialog)

  const confirm = (opts) =>
    new Promise((resolve) => {
      showDialog({
        ...opts,
        onConfirm: () => resolve(true),
        onCancel:  () => resolve(false),
      })
    })

  const alert = (opts) =>
    new Promise((resolve) => {
      showDialog({ ...opts, onConfirm: resolve })
    })

  return { confirm, alert }
}
