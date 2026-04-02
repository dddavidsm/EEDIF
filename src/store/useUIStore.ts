import { create } from 'zustand'

interface UIState {
  /** Tema (per a futura implementació Light/Dark) */
  theme: 'dark' | 'light'
  /** Toast global */
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
}

interface UIActions {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  dismissToast: () => void
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  theme: 'dark',
  toast: null,

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3500)
  },

  dismissToast: () => set({ toast: null }),
}))
