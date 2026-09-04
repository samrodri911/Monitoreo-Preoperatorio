import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CirugiaConDetalle, Alerta, Checkin, AlertaNivel } from '../types/database.types';
import { supabase, isSupabaseConfigured, mockRealtimeBus } from '../lib/supabase';
import {
  initialMockPacientes,
  initialMockCirugias,
  initialMockPautas,
  initialMockCheckins,
  initialMockAlertas,
} from '../lib/mockData';

export const useClinicaStore = defineStore('clinica', () => {
  const cirugias = ref<CirugiaConDetalle[]>([]);
  const alertas = ref<Alerta[]>([...initialMockAlertas]);
  const isLoading = ref<boolean>(false);
  const filtroSemaforo = ref<'todos' | AlertaNivel>('todos');

  // Estado local reactivo para el mock
  const localCheckins = ref<Checkin[]>([...initialMockCheckins]);

  // Cálculo del semáforo clínico de un paciente
  function calcularSemaforo(pautas: any[], alertasPaciente: Alerta[]): { semaforo: AlertaNivel; pendientesCriticas: number } {
    const now = new Date().getTime();
    let hayCriticaVencida = false;
    let hayCriticaProxima = false;
    let pendientesCriticas = 0;

    // Alertas explícitas
    const tieneAlertaRoja = alertasPaciente.some(a => a.nivel === 'rojo' && !a.atendida);
    if (tieneAlertaRoja) {
      hayCriticaVencida = true;
    }

    for (const p of pautas) {
      const estaCompletada = p.checkin?.estado === 'completado';
      const fechaLimite = new Date(p.fecha_limite).getTime();
      const horasHastaLimite = (fechaLimite - now) / (1000 * 60 * 60);

      if (p.es_critica && !estaCompletada) {
        pendientesCriticas++;
        if (horasHastaLimite <= 0) {
          hayCriticaVencida = true;
        } else if (horasHastaLimite <= 6) {
          hayCriticaProxima = true;
        }
      }
    }

    if (hayCriticaVencida) return { semaforo: 'rojo', pendientesCriticas };
    if (hayCriticaProxima) return { semaforo: 'amarillo', pendientesCriticas };
    return { semaforo: 'verde', pendientesCriticas };
  }

  // Métricas para el resumen ejecutivo
  const resumen = computed(() => {
    const total = cirugias.value.length;
    const verdes = cirugias.value.filter(c => c.semaforo === 'verde').length;
    const amarillos = cirugias.value.filter(c => c.semaforo === 'amarillo').length;
    const rojos = cirugias.value.filter(c => c.semaforo === 'rojo').length;
    return { total, verdes, amarillos, rojos };
  });

  const cirugiasFiltradas = computed(() => {
    if (filtroSemaforo.value === 'todos') return cirugias.value;
    return cirugias.value.filter(c => c.semaforo === filtroSemaforo.value);
  });

  // Cargar tablero clínico
  async function cargarTablero() {
    isLoading.value = true;

    if (isSupabaseConfigured && supabase) {
      try {
        // Cargar cirugías con pacientes y pautas
        const { data: cirData, error: cirError } = await supabase
          .from('cirugias')
          .select(`
            *,
            paciente:pacientes(*),
            pautas(*, checkins(*)),
            alertas(*)
          `)
          .order('fecha_programada', { ascending: true });

        if (cirError) throw cirError;

        cirugias.value = (cirData || []).map((c: any) => {
          const pautasNormalizadas = (c.pautas || []).map((p: any) => ({
            ...p,
            checkin: Array.isArray(p.checkins) && p.checkins.length > 0 ? p.checkins[0] : undefined,
          }));

          const { semaforo, pendientesCriticas } = calcularSemaforo(pautasNormalizadas, c.alertas || []);

          return {
            ...c,
            paciente: c.paciente,
            pautas: pautasNormalizadas,
            alertas: c.alertas || [],
            semaforo,
            pautasCriticasPendientes: pendientesCriticas,
          };
        });

        const { data: alertasData } = await supabase
          .from('alertas')
          .select('*')
          .order('created_at', { ascending: false });

        if (alertasData) alertas.value = alertasData;
      } catch (err) {
        console.warn('Error cargando datos de Supabase para clínica, usando Mock:', err);
        cargarDesdeMock();
      }
    } else {
      cargarDesdeMock();
    }

    isLoading.value = false;
  }

  function cargarDesdeMock() {
    cirugias.value = initialMockCirugias.map(cir => {
      const paciente = initialMockPacientes.find(p => p.id === cir.paciente_id)!;
      const pautasRaw = initialMockPautas.filter(p => p.cirugia_id === cir.id);
      const pautasConCheck = pautasRaw.map(p => {
        const ch = localCheckins.value.find(c => c.pauta_id === p.id);
        return {
          ...p,
          checkin: ch ? { ...ch } : undefined,
        };
      });

      const alertasCir = alertas.value.filter(a => a.paciente_id === paciente.id);
      const { semaforo, pendientesCriticas } = calcularSemaforo(pautasConCheck, alertasCir);

      return {
        ...cir,
        paciente,
        pautas: pautasConCheck,
        alertas: alertasCir,
        semaforo,
        pautasCriticasPendientes: pendientesCriticas,
      };
    });
  }

  // Marcar alerta como atendida
  async function marcarAlertaAtendida(alertaId: string) {
    const alertTarget = alertas.value.find(a => a.id === alertaId);
    if (alertTarget) {
      alertTarget.atendida = true;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('alertas').update({ atendida: true }).eq('id', alertaId);
      } catch (e) {
        console.error('Error actualizando alerta en Supabase:', e);
      }
    }

    // Recalcular semáforos
    recalcularTodosLosSemaforos();
  }

  function recalcularTodosLosSemaforos() {
    cirugias.value = cirugias.value.map(c => {
      const alertasCir = alertas.value.filter(a => a.paciente_id === c.paciente_id);
      const { semaforo, pendientesCriticas } = calcularSemaforo(c.pautas, alertasCir);
      return {
        ...c,
        semaforo,
        pautasCriticasPendientes: pendientesCriticas,
      };
    });
  }

  // Suscripción Realtime para la clínica
  function iniciarSuscripcionRealtime() {
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('clinica-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, () => {
          cargarTablero();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas' }, () => {
          cargarTablero();
        })
        .subscribe();

      return () => {
        supabase?.removeChannel(channel);
      };
    } else {
      // Mock Realtime Bus
      const unsubCheckins = mockRealtimeBus.subscribe('checkins', payload => {
        const updated = payload.new as Checkin;
        // Actualizar en el estado local de checkins
        const idx = localCheckins.value.findIndex(c => c.pauta_id === updated.pauta_id);
        if (idx >= 0) {
          localCheckins.value[idx] = { ...updated };
        } else {
          localCheckins.value.push({ ...updated });
        }

        // Actualizar la pauta en las cirugías
        for (const cir of cirugias.value) {
          const targetPauta = cir.pautas.find(p => p.id === updated.pauta_id);
          if (targetPauta) {
            targetPauta.checkin = { ...updated };
            break;
          }
        }

        recalcularTodosLosSemaforos();
      });

      return unsubCheckins;
    }
  }

  return {
    cirugias,
    alertas,
    isLoading,
    filtroSemaforo,
    resumen,
    cirugiasFiltradas,
    cargarTablero,
    marcarAlertaAtendida,
    iniciarSuscripcionRealtime,
  };
});
