import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificación estricta de credenciales
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey &&
  supabaseAnonKey.length > 20 &&
  !supabaseUrl.includes('tu-proyecto')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Bus de eventos reactivo para emular Supabase Realtime cuando se opera en Mock Mode
type RealtimeCallback = (payload: { table: string; eventType: string; new: any; old: any }) => void;

class MockRealtimeBus {
  private listeners: Map<string, Set<RealtimeCallback>> = new Map();

  subscribe(table: string, callback: RealtimeCallback) {
    if (!this.listeners.has(table)) {
      this.listeners.set(table, new Set());
    }
    this.listeners.get(table)!.add(callback);

    // Retorna función para desuscribirse
    return () => {
      this.listeners.get(table)?.delete(callback);
    };
  }

  emit(table: string, eventType: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow?: any) {
    const callbacks = this.listeners.get(table);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb({ table, eventType, new: newRow, old: oldRow || newRow });
        } catch (e) {
          console.error('[MockRealtimeBus Error]', e);
        }
      });
    }
  }
}

export const mockRealtimeBus = new MockRealtimeBus();
