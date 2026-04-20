// ═══════════════════════════════════════════════════════════════
// Backoffice Store - Zustand State Management
// Global state for super admin backoffice
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { User, SupportTicket, TicketFilters } from '../types';

interface BackofficeState {
  // Auth
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;

  // Tickets
  selectedTicket: SupportTicket | null;
  ticketFilters: TicketFilters;
  setSelectedTicket: (ticket: SupportTicket | null) => void;
  setTicketFilters: (filters: TicketFilters) => void;
  clearTicketFilters: () => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Toast/Notifications
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  clearToast: () => void;

  // Reset
  reset: () => void;
}

const initialFilters: TicketFilters = {};

export const useBackofficeStore = create<BackofficeState>((set) => ({
  // Auth
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),

  // Tickets
  selectedTicket: null,
  ticketFilters: initialFilters,
  setSelectedTicket: (selectedTicket) => set({ selectedTicket }),
  setTicketFilters: (filters) => set({ ticketFilters: filters }),
  clearTicketFilters: () => set({ ticketFilters: initialFilters }),

  // UI State
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Toast
  toast: null,
  showToast: (message, type) => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),

  // Reset
  reset: () => set({
    user: null,
    isLoading: false,
    selectedTicket: null,
    ticketFilters: initialFilters,
    sidebarOpen: true,
    toast: null,
  }),
}));
