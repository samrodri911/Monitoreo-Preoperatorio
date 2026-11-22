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
  enrichPacienteWithMeta,
  enrichCirugiaWithMeta,
  loadPersistedDynamicRecords,
  findCatalogoCirugia,
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

  function resolverMaterialesPorProcedimiento(cir: Cirugia): MaterialEducativo[] {
    const exactMatch = initialMockMateriales.filter(
      m => m.tipo_cirugia === cir.tipo_cirugia || m.cirugia_id === cir.id
    );
    if (exactMatch.length > 0) return exactMatch;

    const cat = findCatalogoCirugia(cir.catalogo_cirugia_id || cir.tipo_cirugia);
    const esCaderaOOrtopedia =
      cir.tipo_cirugia?.toLowerCase().includes('cadera') ||
      cir.tipo_cirugia?.toLowerCase().includes('artroplastia') ||
      cir.especialidad?.toLowerCase().includes('ortopedia');

    const templateTipo = esCaderaOOrtopedia
      ? 'Artroplastia Total de Cadera'
      : 'Apendicectomía Laparoscópica';

    const baseList = initialMockMateriales
      .filter(m => m.tipo_cirugia === templateTipo)
      .map(m => ({ ...m }));

    if (cat) {
      return baseList.map(m => {
        if (m.tipo_recurso === 'video') {
          return {
            ...m,
            tipo_cirugia: cat.tipo_cirugia,
            titulo: cat.video_titulo || m.titulo,
            descripcion_corta: cat.video_descripcion || m.descripcion_corta,
            url_recurso: cat.video_url || m.url_recurso,
          };
        }
        if (m.tipo_recurso === 'infografia') {
          return {
            ...m,
            tipo_cirugia: cat.tipo_cirugia,
            titulo: cat.infografia_titulo || m.titulo,
            descripcion_corta: cat.infografia_descripcion || m.descripcion_corta,
            url_recurso: cat.infografia_url || m.url_recurso,
          };
        }
        return { ...m, tipo_cirugia: cat.tipo_cirugia };
      });
    }

    return baseList;
  }

  // Cargar datos
  async function cargarDatosPaciente(pacienteId: string = currentPacienteId.value) {
    isLoading.value = true;
    currentPacienteId.value = pacienteId;
    loadPersistedDynamicRecords();
    for (const ch of initialMockCheckins) {
      if (!localCheckins.value.some(existing => existing.id === ch.id)) {
        localCheckins.value.push(ch);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Cargar desde Supabase
        const { data: pacData, error: pacError } = await supabase
          .from('pacientes')
          .select('*')
          .eq('id', pacienteId)
          .single();

        if (pacError) throw pacError;
        paciente.value = enrichPacienteWithMeta(pacData);

        const { data: cirData, error: cirError } = await supabase
          .from('cirugias')
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (cirError) throw cirError;
        cirugia.value = enrichCirugiaWithMeta(cirData);

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

          materiales.value = matData && matData.length > 0
            ? matData
            : resolverMaterialesPorProcedimiento(cirugia.value);
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
    loadPersistedDynamicRecords();
    const foundPac = initialMockPacientes.find(p => p.id === pacienteId) || initialMockPacientes[0];
    paciente.value = enrichPacienteWithMeta(foundPac);

    const foundCir = initialMockCirugias.find(c => c.paciente_id === foundPac.id) || initialMockCirugias[0];
    cirugia.value = enrichCirugiaWithMeta(foundCir);

    const pautasDelProcedimiento = initialMockPautas.filter(p => p.cirugia_id === foundCir.id);
    pautas.value = pautasDelProcedimiento.map(p => {
      const check = localCheckins.value.find(c => c.pauta_id === p.id) || initialMockCheckins.find(c => c.pauta_id === p.id);
      return {
        ...p,
        checkin: check ? { ...check } : undefined,
      };
    });

    materiales.value = resolverMaterialesPorProcedimiento(foundCir);
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
        console.error('Error al actualizar checkin en Supabase, aplicando fallback local:', err);
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
        mockRealtimeBus.emit('checkins', 'UPDATE', existing);
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

  async function completarCheckin(pautaId: string) {
    const targetPauta = pautas.value.find(p => p.id === pautaId);
    if (!targetPauta) return;
    if (targetPauta.checkin?.estado !== 'completado') {
      await toggleCheckin(pautaId);
    }
  }

  // Desmarcar check-in para que vuelva a estar pendiente (usado para pautas continuas de ayuno antes de sonar la próxima alarma)
  async function desmarcarCheckin(pautaId: string) {
    const targetPauta = pautas.value.find(p => p.id === pautaId);
    if (!targetPauta) return;
    if (targetPauta.checkin?.estado === 'completado') {
      await toggleCheckin(pautaId);
    }
  }

  // Confirmar temporalmente el ciclo actual de una pauta continua (ayuno)
  async function confirmarCheckinRecurrente(pautaId: string, observacion?: string) {
    const targetPauta = pautas.value.find(p => p.id === pautaId);
    if (!targetPauta) return;
    const ahoraIso = new Date().toISOString();
    const obs = observacion || `Ayuno verificado a las ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} (vigilancia horaria activa)`;

    if (targetPauta.checkin?.estado !== 'completado') {
      await toggleCheckin(pautaId);
    }
    if (targetPauta.checkin) {
      targetPauta.checkin.observaciones = obs;
      targetPauta.checkin.fecha_respuesta = ahoraIso;
      mockRealtimeBus.emit('checkins', 'UPDATE', targetPauta.checkin);
    }
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
    completarCheckin,
    desmarcarCheckin,
    confirmarCheckinRecurrente,
    iniciarSuscripcionRealtime,
  };
});
