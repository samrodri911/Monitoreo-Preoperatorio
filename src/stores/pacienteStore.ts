import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Paciente, Cirugia, PautaConCheckin, Checkin, MaterialEducativo, AlertaNivel } from '../types/database.types';
import { supabase, isSupabaseConfigured, mockRealtimeBus } from '../lib/supabase';
import {
  MOCK_PACIENTE_A_ID,
  initialMockPacientes,
  initialMockCirugias,
  initialMockPautas,
  initialMockCheckins,
  initialMockMateriales,
} from '../lib/mockData';

export const usePacienteStore = defineStore('paciente', () => {
  const currentPacienteId = ref<string>(MOCK_PACIENTE_A_ID);
  const paciente = ref<Paciente | null>(null);
  const cirugia = ref<Cirugia | null>(null);
  const pautas = ref<PautaConCheckin[]>([]);
  const materiales = ref<MaterialEducativo[]>([]);
  const isLoading = ref<boolean>(false);
  const isSyncing = ref<boolean>(false);

  // Almacenamiento local reactivo para el mock
  const localCheckins = ref<Checkin[]>([...initialMockCheckins]);

  // Cómputos
  const pautasCriticas = computed(() => pautas.value.filter(p => p.es_critica));
  const pautasCompletadas = computed(() => pautas.value.filter(p => p.checkin?.estado === 'completado'));
  const porcentajeCumplimiento = computed(() => {
    if (!pautas.value.length) return 0;
    return Math.round((pautasCompletadas.value.length / pautas.value.length) * 100);
  });

  // Cálculo del semáforo individual
  const semaforoIndividual = computed<AlertaNivel>(() => {
    const now = new Date().getTime();
    let hayCriticaVencida = false;
    let hayCriticaProxima = false;

    for (const p of pautas.value) {
      const estaCompletada = p.checkin?.estado === 'completado';
      const fechaLimite = new Date(p.fecha_limite).getTime();
      const horasHastaLimite = (fechaLimite - now) / (1000 * 60 * 60);

      if (p.es_critica && !estaCompletada) {
        if (horasHastaLimite <= 0) {
          hayCriticaVencida = true; // Rojo inmediato
        } else if (horasHastaLimite <= 6) {
          hayCriticaProxima = true; // Amarillo advertencia
        }
      }
    }

    if (hayCriticaVencida) return 'rojo';
    if (hayCriticaProxima) return 'amarillo';
    return 'verde';
  });

  // Cargar datos
  async function cargarDatosPaciente(pacienteId: string = currentPacienteId.value) {
    isLoading.value = true;
    currentPacienteId.value = pacienteId;

    if (isSupabaseConfigured && supabase) {
      try {
        // Cargar desde Supabase
        const { data: pacData, error: pacError } = await supabase
          .from('pacientes')
          .select('*')
          .eq('id', pacienteId)
          .single();

        if (pacError) throw pacError;
        paciente.value = pacData;

        const { data: cirData, error: cirError } = await supabase
          .from('cirugias')
          .select('*')
          .eq('paciente_id', pacienteId)
          .single();

        if (cirError) throw cirError;
        cirugia.value = cirData;

        if (cirugia.value) {
          // Pautas y checkins
          const { data: pautasData } = await supabase
            .from('pautas')
            .select('*, checkins(*)')
            .eq('cirugia_id', cirugia.value.id)
            .order('horas_previas', { ascending: false });

          pautas.value = (pautasData || []).map((p: any) => ({
            ...p,
            checkin: Array.isArray(p.checkins) && p.checkins.length > 0 ? p.checkins[0] : undefined,
          }));

          // Materiales educativos
          const { data: matData } = await supabase
            .from('materiales_educativos')
            .select('*')
            .or(`cirugia_id.eq.${cirugia.value.id},tipo_cirugia.eq.${cirugia.value.tipo_cirugia}`)
            .order('orden_visualizacion', { ascending: true });

          materiales.value = matData || [];
        }
      } catch (err) {
        console.warn('Error conectando a Supabase, recurriendo a Mock Fallback:', err);
        cargarDesdeMock(pacienteId);
      }
    } else {
      cargarDesdeMock(pacienteId);
    }

    isLoading.value = false;
  }

  function cargarDesdeMock(pacienteId: string) {
    const foundPac = initialMockPacientes.find(p => p.id === pacienteId) || initialMockPacientes[0];
    paciente.value = foundPac;

    const foundCir = initialMockCirugias.find(c => c.paciente_id === foundPac.id) || initialMockCirugias[0];
    cirugia.value = foundCir;

    const pautasDelProcedimiento = initialMockPautas.filter(p => p.cirugia_id === foundCir.id);
    pautas.value = pautasDelProcedimiento.map(p => {
      const check = localCheckins.value.find(c => c.pauta_id === p.id);
      return {
        ...p,
        checkin: check ? { ...check } : undefined,
      };
    });

    materiales.value = initialMockMateriales.filter(
      m => m.tipo_cirugia === foundCir.tipo_cirugia || m.cirugia_id === foundCir.id
    );
  }

  // Marcar o desmarcar cumplimiento de una pauta
  async function toggleCheckin(pautaId: string) {
    isSyncing.value = true;
    const targetPauta = pautas.value.find(p => p.id === pautaId);
    if (!targetPauta) return;

    const estadoActual = targetPauta.checkin?.estado;
    const nuevoEstado = estadoActual === 'completado' ? 'pendiente' : 'completado';
    const nuevaFecha = nuevoEstado === 'completado' ? new Date().toISOString() : null;

    if (isSupabaseConfigured && supabase) {
      try {
        if (targetPauta.checkin?.id) {
          const { data, error } = await supabase
            .from('checkins')
            .update({
              estado: nuevoEstado,
              fecha_respuesta: nuevaFecha,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetPauta.checkin.id)
            .select()
            .single();

          if (error) throw error;
          if (data) targetPauta.checkin = data;
        } else {
          const { data, error } = await supabase
            .from('checkins')
            .insert({
              pauta_id: pautaId,
              estado: nuevoEstado,
              fecha_respuesta: nuevaFecha,
            })
            .select()
            .single();

          if (error) throw error;
          if (data) targetPauta.checkin = data;
        }
      } catch (err) {
        console.error('Error al actualizar checkin en Supabase:', err);
      }
    } else {
      // Modo Mock Local
      let existing = localCheckins.value.find(c => c.pauta_id === pautaId);
      if (existing) {
        existing.estado = nuevoEstado;
        existing.fecha_respuesta = nuevaFecha;
        existing.updated_at = new Date().toISOString();
      } else {
        existing = {
          id: `check-mock-${Date.now()}`,
          pauta_id: pautaId,
          estado: nuevoEstado,
          fecha_respuesta: nuevaFecha,
          observaciones: null,
          updated_at: new Date().toISOString(),
        };
        localCheckins.value.push(existing);
      }

      targetPauta.checkin = { ...existing };
      // Notificar al bus de tiempo real para que el panel clínico se entere de inmediato
      mockRealtimeBus.emit('checkins', 'UPDATE', existing);
    }

    isSyncing.value = false;
  }

  // Inicializar suscripción en tiempo real
  function iniciarSuscripcionRealtime() {
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('paciente-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, payload => {
          const updatedCheckin = payload.new as Checkin;
          const pautaTarget = pautas.value.find(p => p.id === updatedCheckin.pauta_id);
          if (pautaTarget) {
            pautaTarget.checkin = updatedCheckin;
          }
        })
        .subscribe();

      return () => {
        supabase?.removeChannel(channel);
      };
    } else {
      const unsubscribe = mockRealtimeBus.subscribe('checkins', payload => {
        const updatedCheckin = payload.new as Checkin;
        const pautaTarget = pautas.value.find(p => p.id === updatedCheckin.pauta_id);
        if (pautaTarget) {
          pautaTarget.checkin = { ...updatedCheckin };
        }
      });
      return unsubscribe;
    }
  }

  return {
    currentPacienteId,
    paciente,
    cirugia,
    pautas,
    materiales,
    isLoading,
    isSyncing,
    pautasCriticas,
    pautasCompletadas,
    porcentajeCumplimiento,
    semaforoIndividual,
    cargarDatosPaciente,
    toggleCheckin,
    iniciarSuscripcionRealtime,
  };
});
