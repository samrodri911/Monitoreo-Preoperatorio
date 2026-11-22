import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  CirugiaConDetalle,
  Alerta,
  Checkin,
  AlertaNivel,
  NuevaCirugiaPayload,
  Paciente,
  Cirugia,
  Pauta,
  CatalogoCirugia,
  TipoAlarmaPauta,
  ReporteAnsiedad,
} from '../types/database.types';
import { supabase, isSupabaseConfigured, mockRealtimeBus } from '../lib/supabase';
import { usePautaAlarms } from '../composables/usePautaAlarms';
import { useAnxietyMonitoring } from '../composables/useAnxietyMonitoring';
import {
  initialMockPacientes,
  initialMockCirugias,
  initialMockPautas,
  initialMockCheckins,
  initialMockAlertas,
  initialCatalogoCirugias,
  enrichPacienteWithMeta,
  enrichCirugiaWithMeta,
  loadPersistedDynamicRecords,
  loadPersistedCatalogoCirugias,
  saveCatalogoCirugiaLocally,
  findCatalogoCirugia,
  persistNewRegistrationLocally,
  saveExtendedClinicalMeta,
} from '../lib/mockData';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const useClinicaStore = defineStore('clinica', () => {
  const cirugias = ref<CirugiaConDetalle[]>([]);
  const alertas = ref<Alerta[]>([...initialMockAlertas]);
  const catalogoCirugias = ref<CatalogoCirugia[]>([...loadPersistedCatalogoCirugias()]);
  const isLoading = ref<boolean>(false);
  const isSaving = ref<boolean>(false);
  const filtroSemaforo = ref<'todos' | AlertaNivel>('todos');

  // Estado local reactivo para el mock
  const localCheckins = ref<Checkin[]>([...initialMockCheckins]);

  /**
   * Carga el catálogo general de cirugías (Supabase + local)
   */
  async function cargarCatalogoCirugias() {
    loadPersistedCatalogoCirugias();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('catalogo_cirugias')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          for (const item of data as CatalogoCirugia[]) {
            saveCatalogoCirugiaLocally(item);
          }
        }
      } catch {
        // Si la tabla catalogo_cirugias aún no fue creada en Supabase, usar catálogo local
      }
    }
    catalogoCirugias.value = [...initialCatalogoCirugias];
  }

  /**
   * Guarda o actualiza una cirugía general en el Catálogo Reutilizable
   */
  async function guardarCatalogoCirugia(
    payload: Omit<CatalogoCirugia, 'created_at'> & { created_at?: string }
  ): Promise<CatalogoCirugia> {
    isSaving.value = true;
    const nowIso = new Date().toISOString();
    const itemCompleto: CatalogoCirugia = {
      ...payload,
      id:
        payload.id ||
        `cat-${payload.tipo_cirugia
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')}-${Math.floor(10 + Math.random() * 90)}`,
      created_at: payload.created_at || nowIso,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('catalogo_cirugias').upsert(itemCompleto, { onConflict: 'id' });
      } catch (e) {
        console.warn('[ClinicaStore] Catálogo guardado localmente (fallback Supabase):', e);
      }
    }

    catalogoCirugias.value = saveCatalogoCirugiaLocally(itemCompleto);
    isSaving.value = false;
    return itemCompleto;
  }

  const anxietyMonitoring = useAnxietyMonitoring();

  // Cálculo del semáforo clínico de un paciente (pautas + alertas + monitoreo de ansiedad IA/encuesta)
  function calcularSemaforo(
    pautas: any[],
    alertasPaciente: Alerta[],
    reportesPaciente: ReporteAnsiedad[] = []
  ): { semaforo: AlertaNivel; pendientesCriticas: number } {
    const now = new Date().getTime();
    let hayCriticaVencida = false;
    let hayCriticaProxima = false;
    let pendientesCriticas = 0;

    // Alertas explícitas (Roja o Amarilla sin atender)
    const tieneAlertaRoja = alertasPaciente.some(a => a.nivel === 'rojo' && !a.atendida);
    if (tieneAlertaRoja) {
      hayCriticaVencida = true;
    }
    const tieneAlertaAmarilla = alertasPaciente.some(a => a.nivel === 'amarillo' && !a.atendida);
    if (tieneAlertaAmarilla) {
      hayCriticaProxima = true;
    }

    // Reportes de Ansiedad (Llamada IA o Encuesta)
    const tieneAnsiedadUrgente = reportesPaciente.some(
      r => !r.revisado_medico && (r.es_urgente || r.riesgo_cancelacion || r.nivel === 'alta')
    );
    if (tieneAnsiedadUrgente) {
      hayCriticaVencida = true;
    }
    const tieneAnsiedadModerada = reportesPaciente.some(
      r => !r.revisado_medico && r.nivel === 'moderada'
    );
    if (tieneAnsiedadModerada) {
      hayCriticaProxima = true;
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

  // Ordenar siempre por urgencia (ROJO primero, luego AMARILLO, luego VERDE)
  const cirugiasFiltradas = computed(() => {
    const prioridad: Record<AlertaNivel, number> = { rojo: 0, amarillo: 1, verde: 2 };
    const base =
      filtroSemaforo.value === 'todos'
        ? [...cirugias.value]
        : cirugias.value.filter(c => c.semaforo === filtroSemaforo.value);
    return base.sort((a, b) => {
      const diff = prioridad[a.semaforo] - prioridad[b.semaforo];
      if (diff !== 0) return diff;
      return new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime();
    });
  });

  // Cargar tablero clínico
  async function cargarTablero() {
    isLoading.value = true;
    await cargarCatalogoCirugias();
    loadPersistedDynamicRecords();
    anxietyMonitoring.loadPersistedAnxietyData();
    const dynamicAnxAlerts = anxietyMonitoring.getDynamicAlerts();

    for (const ch of initialMockCheckins) {
      if (!localCheckins.value.some(existing => existing.id === ch.id)) {
        localCheckins.value.push(ch);
      }
    }

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

        const { data: alertasData } = await supabase
          .from('alertas')
          .select('*')
          .order('created_at', { ascending: false });

        const mergedAlertas: Alerta[] = [...(alertasData || [])];
        for (const da of dynamicAnxAlerts) {
          if (!mergedAlertas.some(a => a.id === da.id)) {
            mergedAlertas.unshift(da);
          }
        }
        alertas.value = mergedAlertas;

        cirugias.value = (cirData || []).map((c: any) => {
          const pautasNormalizadas = (c.pautas || []).map((p: any) => ({
            ...p,
            checkin: Array.isArray(p.checkins) && p.checkins.length > 0 ? p.checkins[0] : undefined,
          }));

          const alertasPac = mergedAlertas.filter(a => a.paciente_id === c.paciente_id);
          const reportesPac = anxietyMonitoring.getReportesPorPaciente(c.paciente_id);
          const { semaforo, pendientesCriticas } = calcularSemaforo(pautasNormalizadas, alertasPac, reportesPac);
          const enrichedCir = enrichCirugiaWithMeta(c);
          const enrichedPac = c.paciente ? enrichPacienteWithMeta(c.paciente) : c.paciente;

          return {
            ...enrichedCir,
            paciente: enrichedPac,
            pautas: pautasNormalizadas,
            alertas: alertasPac,
            reportesAnsiedad: reportesPac,
            ultimoReporteAnsiedad: reportesPac[0] || null,
            semaforo,
            pautasCriticasPendientes: pendientesCriticas,
          };
        });
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
    loadPersistedDynamicRecords();
    anxietyMonitoring.loadPersistedAnxietyData();
    const dynamicAnxAlerts = anxietyMonitoring.getDynamicAlerts();
    const combinedAlerts: Alerta[] = [...dynamicAnxAlerts];
    for (const a of initialMockAlertas) {
      if (!combinedAlerts.some(existing => existing.id === a.id)) {
        combinedAlerts.push(a);
      }
    }
    combinedAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    alertas.value = combinedAlerts;

    cirugias.value = initialMockCirugias.map(cir => {
      const enrichedCir = enrichCirugiaWithMeta(cir);
      const rawPac = initialMockPacientes.find(p => p.id === cir.paciente_id) || initialMockPacientes[0];
      const paciente = enrichPacienteWithMeta(rawPac);
      const pautasRaw = initialMockPautas.filter(p => p.cirugia_id === cir.id);
      const pautasConCheck = pautasRaw.map(p => {
        const ch = localCheckins.value.find(c => c.pauta_id === p.id) || initialMockCheckins.find(c => c.pauta_id === p.id);
        return {
          ...p,
          checkin: ch ? { ...ch } : undefined,
        };
      });

      const alertasCir = alertas.value.filter(a => a.paciente_id === paciente.id);
      const reportesPac = anxietyMonitoring.getReportesPorPaciente(paciente.id);
      const { semaforo, pendientesCriticas } = calcularSemaforo(pautasConCheck, alertasCir, reportesPac);

      return {
        ...enrichedCir,
        paciente,
        pautas: pautasConCheck,
        alertas: alertasCir,
        reportesAnsiedad: reportesPac,
        ultimoReporteAnsiedad: reportesPac[0] || null,
        semaforo,
        pautasCriticasPendientes: pendientesCriticas,
      };
    });
  }

  /**
   * Registra un nuevo Paciente, su Cirugía parametrizada y genera automáticamente las Pautas y Check-ins
   */
  async function registrarNuevaCirugia(payload: NuevaCirugiaPayload): Promise<{
    ok: boolean;
    paciente?: Paciente;
    cirugia?: Cirugia;
    error?: string;
  }> {
    isSaving.value = true;
    const nowIso = new Date().toISOString();
    const fechaCirugiaMs = new Date(payload.fecha_programada).getTime();
    const codigoGenerado = `CIR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const pinFinal = (payload.pin_acceso || payload.documento.slice(-4) || '1234').trim();

    const baseCatalogo = findCatalogoCirugia(payload.catalogo_cirugia_id || payload.tipo_cirugia);

    let pacienteCreado: Paciente = {
      id: generateUuid(),
      nombre_completo: payload.nombre_completo.trim(),
      documento: payload.documento.trim(),
      telefono: payload.telefono.trim(),
      edad: Number(payload.edad) || 45,
      contacto_emergencia: payload.contacto_emergencia.trim(),
      email: payload.email?.trim() || null,
      pin_acceso: pinFinal,
      grupo_sanguineo: payload.grupo_sanguineo?.trim() || 'O+',
      peso_kg: payload.peso_kg ?? null,
      talla_cm: payload.talla_cm ?? null,
      alergias: payload.alergias?.trim() || 'Ninguna conocida',
      comorbilidades: payload.comorbilidades || [],
      medicacion_habitual: payload.medicacion_habitual?.trim() || null,
      nivel_ansiedad: payload.nivel_ansiedad || 'moderada',
      created_at: nowIso,
    };

    let cirugiaCreada: Cirugia = {
      id: generateUuid(),
      paciente_id: pacienteCreado.id,
      catalogo_cirugia_id: payload.catalogo_cirugia_id || baseCatalogo?.id || null,
      tipo_cirugia: payload.tipo_cirugia.trim(),
      codigo_cirugia: codigoGenerado,
      medico_tratante: payload.medico_tratante.trim(),
      notas_medicas: payload.notas_medicas.trim() || null,
      nombre_sencillo: payload.nombre_sencillo.trim() || baseCatalogo?.nombre_sencillo || payload.tipo_cirugia.trim(),
      especialidad: payload.especialidad.trim() || baseCatalogo?.especialidad || 'Cirugía General',
      duracion_estimada: payload.duracion_estimada.trim() || baseCatalogo?.duracion_estimada || '45 a 60 minutos',
      tipo_anestesia: payload.tipo_anestesia.trim() || baseCatalogo?.tipo_anestesia || 'Anestesia General',
      sensacion_anestesia:
        payload.sensacion_anestesia.trim() ||
        baseCatalogo?.sensacion_anestesia ||
        'Estarás plácidamente dormido y sin dolor durante el procedimiento.',
      tiempo_recuperacion: payload.tiempo_recuperacion.trim() || baseCatalogo?.tiempo_recuperacion || '24 a 48 horas',
      tiempo_recuperacion_sala:
        payload.tiempo_recuperacion_sala.trim() ||
        baseCatalogo?.tiempo_recuperacion_sala ||
        '1 a 2 horas en Sala de Recuperación (URPA)',
      dias_incapacidad_estimados:
        payload.dias_incapacidad_estimados.trim() ||
        baseCatalogo?.dias_incapacidad_estimados ||
        '7 a 15 días con reincorporación gradual',
      fecha_programada: new Date(payload.fecha_programada).toISOString(),
      estado: 'programada',
      created_at: nowIso,
    };

    // Construir pautas automáticas combinando la Base de la Cirugía + Personalización del Paciente
    const definicionesPautas: Array<{
      titulo: string;
      descripcion: string;
      horas_previas: number;
      es_critica: boolean;
      tipo_alarma: TipoAlarmaPauta;
      hora_alarma?: string | null;
      intervalo_minutos?: number | null;
    }> = [];

    const formatHoraFromMs = (ms: number) => {
      const d = new Date(ms);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    if (payload.incluirSuspensionFarmacos) {
      const horasFarmacos = Number(payload.horasSuspensionFarmacos) || baseCatalogo?.horas_suspension_farmacos || 24;
      const detalleExtra = payload.detalleFarmacos?.trim()
        ? payload.detalleFarmacos.trim()
        : baseCatalogo?.detalle_farmacos_base ||
          'Suspender antiinflamatorios (ibuprofeno, aspirina) o ajustar medicación crónica según orden médica.';
      definicionesPautas.push({
        titulo: `Control de Medicamentos y Fármacos (-${horasFarmacos}h)`,
        descripcion: detalleExtra,
        horas_previas: horasFarmacos,
        es_critica: true,
        tipo_alarma: 'hora_exacta',
        hora_alarma: formatHoraFromMs(fechaCirugiaMs - horasFarmacos * 3600 * 1000),
        intervalo_minutos: 60,
      });
    }

    // Pauta específica propia del protocolo base de esa cirugía (si existe en el catálogo)
    if (baseCatalogo?.pauta_especifica_titulo && baseCatalogo?.pauta_especifica_descripcion) {
      definicionesPautas.push({
        titulo: baseCatalogo.pauta_especifica_titulo,
        descripcion: baseCatalogo.pauta_especifica_descripcion,
        horas_previas: baseCatalogo.pauta_especifica_horas || 18,
        es_critica: false,
        tipo_alarma: 'recordatorio_periodico',
        intervalo_minutos: 60,
      });
    }

    if (payload.incluirDuchaAntiseptica !== false) {
      definicionesPautas.push({
        titulo: 'Ducha Corporal Antiséptica Prequirúrgica',
        descripcion:
          baseCatalogo?.descripcion_ducha_antiseptica ||
          'Baño corporal completo con jabón antiséptico (clorhexidina o neutro), limpiando con cuidado la zona operatoria y secando con toalla limpia.',
        horas_previas: baseCatalogo?.horas_ducha_antiseptica || 12,
        es_critica: false,
        tipo_alarma: 'recordatorio_periodico',
        intervalo_minutos: 60,
      });
    }

    definicionesPautas.push(
      {
        titulo: `Ayuno Absoluto de Sólidos (-${payload.horasAyunoSolidos}h CRÍTICO)`,
        descripcion:
          baseCatalogo?.descripcion_ayuno_solidos ||
          `Suspender por completo todo alimento sólido (carnes, harinas, lácteos, grasas) ${payload.horasAyunoSolidos} horas antes de la cirugía para evitar broncoaspiración.`,
        horas_previas: Number(payload.horasAyunoSolidos) || 8,
        es_critica: true,
        tipo_alarma: 'recordatorio_periodico',
        intervalo_minutos: 60,
      },
      {
        titulo: `Ayuno Estricto de Líquidos Claros (-${payload.horasAyunoLiquidos}h CRÍTICO)`,
        descripcion:
          baseCatalogo?.descripcion_ayuno_liquidos ||
          `Prohibido ingerir agua, aromáticas, jugos, café o chicles durante las ${payload.horasAyunoLiquidos} horas previas al procedimiento.`,
        horas_previas: Number(payload.horasAyunoLiquidos) || 2,
        es_critica: true,
        tipo_alarma: 'recordatorio_periodico',
        intervalo_minutos: 60,
      },
      {
        titulo: 'Retiro de Joyas/Esmaltes e Ingreso con Acompañante',
        descripcion:
          'Acudir a Admisiones con documento original, sin esmalte en uñas, sin joyas ni prótesis removibles y en compañía de un adulto responsable.',
        horas_previas: 2,
        es_critica: true,
        tipo_alarma: 'hora_exacta',
        hora_alarma: formatHoraFromMs(fechaCirugiaMs - 2 * 3600 * 1000),
        intervalo_minutos: 60,
      }
    );

    // Pautas adicionales exclusivas personalizadas para ESTE paciente
    if (Array.isArray(payload.pautasPersonalizadasExtra)) {
      for (const extra of payload.pautasPersonalizadasExtra) {
        if (extra.titulo?.trim()) {
          const hPrev = Number(extra.horas_previas) || 4;
          definicionesPautas.push({
            titulo: `[Personalizada] ${extra.titulo.trim()}`,
            descripcion: extra.descripcion?.trim() || 'Indicación personalizada asignada por tu cirujano tratante.',
            horas_previas: hPrev,
            es_critica: Boolean(extra.es_critica),
            tipo_alarma: extra.tipo_alarma || 'hora_exacta',
            hora_alarma: extra.hora_alarma || formatHoraFromMs(fechaCirugiaMs - hPrev * 3600 * 1000),
            intervalo_minutos: extra.intervalo_minutos || 60,
          });
        }
      }
    }

    // Ordenar pautas de mayor a menor anticipación
    definicionesPautas.sort((a, b) => b.horas_previas - a.horas_previas);

    const pautasGeneradas: Pauta[] = definicionesPautas.map(def => ({
      id: generateUuid(),
      cirugia_id: cirugiaCreada.id,
      titulo: def.titulo,
      descripcion: def.descripcion,
      horas_previas: def.horas_previas,
      es_critica: def.es_critica,
      fecha_limite: new Date(fechaCirugiaMs - def.horas_previas * 3600 * 1000).toISOString(),
      tipo_alarma: def.tipo_alarma,
      hora_alarma: def.hora_alarma || null,
      intervalo_minutos: def.intervalo_minutos || 60,
      alarma_activa: true,
      created_at: nowIso,
    }));

    const checkinsGenerados: Checkin[] = pautasGeneradas.map(p => ({
      id: generateUuid(),
      pauta_id: p.id,
      estado: 'pendiente',
      fecha_respuesta: null,
      observaciones: null,
      updated_at: nowIso,
    }));

    const alertaInicial: Alerta = {
      id: generateUuid(),
      paciente_id: pacienteCreado.id,
      cirugia_id: cirugiaCreada.id,
      nivel: 'verde',
      mensaje: `Nuevo expediente quirúrgico registrado (${cirugiaCreada.tipo_cirugia}) por ${cirugiaCreada.medico_tratante}. Protocolo de pautas activo.`,
      atendida: false,
      created_at: nowIso,
    };

    // Si Supabase está configurado, persistir en la nube con tolerancia a migraciones parciales
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Insertar o recuperar Paciente por documento
        const { data: existingPac } = await supabase
          .from('pacientes')
          .select('*')
          .eq('documento', pacienteCreado.documento)
          .limit(1);

        if (existingPac && existingPac.length > 0) {
          pacienteCreado = {
            ...pacienteCreado,
            id: existingPac[0].id,
          };
          cirugiaCreada.paciente_id = pacienteCreado.id;
          alertaInicial.paciente_id = pacienteCreado.id;
        } else {
          // Intentar inserción completa con email y pin_acceso
          const { data: insertedPac, error: pacErr } = await supabase
            .from('pacientes')
            .insert({
              nombre_completo: pacienteCreado.nombre_completo,
              documento: pacienteCreado.documento,
              telefono: pacienteCreado.telefono,
              edad: pacienteCreado.edad,
              contacto_emergencia: pacienteCreado.contacto_emergencia,
              email: pacienteCreado.email,
              pin_acceso: pacienteCreado.pin_acceso,
            })
            .select('*')
            .single();

          if (pacErr) {
            // Reintentar solo con columnas base si aún no se corrió update_auth_y_cirugias.sql
            const { data: basePac, error: basePacErr } = await supabase
              .from('pacientes')
              .insert({
                nombre_completo: pacienteCreado.nombre_completo,
                documento: pacienteCreado.documento,
                telefono: pacienteCreado.telefono,
                edad: pacienteCreado.edad,
                contacto_emergencia: pacienteCreado.contacto_emergencia,
              })
              .select('*')
              .single();

            if (basePacErr) throw basePacErr;
            if (basePac) {
              pacienteCreado.id = basePac.id;
              cirugiaCreada.paciente_id = basePac.id;
              alertaInicial.paciente_id = basePac.id;
            }
          } else if (insertedPac) {
            pacienteCreado.id = insertedPac.id;
            cirugiaCreada.paciente_id = insertedPac.id;
            alertaInicial.paciente_id = insertedPac.id;
          }
        }

        // 2. Insertar Cirugía
        const { data: insertedCir, error: cirErr } = await supabase
          .from('cirugias')
          .insert({
            paciente_id: cirugiaCreada.paciente_id,
            tipo_cirugia: cirugiaCreada.tipo_cirugia,
            codigo_cirugia: cirugiaCreada.codigo_cirugia,
            medico_tratante: cirugiaCreada.medico_tratante,
            notas_medicas: cirugiaCreada.notas_medicas,
            nombre_sencillo: cirugiaCreada.nombre_sencillo,
            especialidad: cirugiaCreada.especialidad,
            duracion_estimada: cirugiaCreada.duracion_estimada,
            tipo_anestesia: cirugiaCreada.tipo_anestesia,
            sensacion_anestesia: cirugiaCreada.sensacion_anestesia,
            tiempo_recuperacion: cirugiaCreada.tiempo_recuperacion,
            tiempo_recuperacion_sala: cirugiaCreada.tiempo_recuperacion_sala,
            dias_incapacidad_estimados: cirugiaCreada.dias_incapacidad_estimados,
            fecha_programada: cirugiaCreada.fecha_programada,
            estado: 'programada',
          })
          .select('*')
          .single();

        if (cirErr) {
          // Reintentar con columnas base de cirugias
          const { data: baseCir, error: baseCirErr } = await supabase
            .from('cirugias')
            .insert({
              paciente_id: cirugiaCreada.paciente_id,
              tipo_cirugia: cirugiaCreada.tipo_cirugia,
              fecha_programada: cirugiaCreada.fecha_programada,
              estado: 'programada',
            })
            .select('*')
            .single();

          if (baseCirErr) throw baseCirErr;
          if (baseCir) {
            cirugiaCreada.id = baseCir.id;
          }
        } else if (insertedCir) {
          cirugiaCreada.id = insertedCir.id;
        }

        alertaInicial.cirugia_id = cirugiaCreada.id;
        saveExtendedClinicalMeta(pacienteCreado, cirugiaCreada);

        // 3. Insertar Pautas y sus Check-ins
        const pautasPayload = definicionesPautas.map(def => ({
          cirugia_id: cirugiaCreada.id,
          titulo: def.titulo,
          descripcion: def.descripcion,
          horas_previas: def.horas_previas,
          es_critica: def.es_critica,
          fecha_limite: new Date(fechaCirugiaMs - def.horas_previas * 3600 * 1000).toISOString(),
        }));

        const { data: insertedPautas, error: pautasErr } = await supabase
          .from('pautas')
          .insert(pautasPayload)
          .select('*');

        if (!pautasErr && insertedPautas && insertedPautas.length > 0) {
          const enrichedInsertedPautas = (insertedPautas as Pauta[]).map((p, idx) => ({
            ...p,
            tipo_alarma: definicionesPautas[idx]?.tipo_alarma || 'recordatorio_periodico',
            hora_alarma: definicionesPautas[idx]?.hora_alarma || null,
            intervalo_minutos: definicionesPautas[idx]?.intervalo_minutos || 60,
            alarma_activa: true,
          }));
          pautasGeneradas.splice(0, pautasGeneradas.length, ...enrichedInsertedPautas);
          const checkinsPayload = insertedPautas.map((p: any) => ({
            pauta_id: p.id,
            estado: 'pendiente',
          }));
          const { data: insertedCheckins } = await supabase
            .from('checkins')
            .insert(checkinsPayload)
            .select('*');

          if (insertedCheckins) {
            checkinsGenerados.splice(0, checkinsGenerados.length, ...(insertedCheckins as Checkin[]));
          }
        }

        // 4. Insertar Alerta Inicial
        await supabase.from('alertas').insert({
          paciente_id: pacienteCreado.id,
          cirugia_id: cirugiaCreada.id,
          nivel: 'verde',
          mensaje: alertaInicial.mensaje,
          atendida: false,
        });
      } catch (e: any) {
        console.warn('[ClinicaStore] Fallback a persistencia local tras error en Supabase:', e);
      }
    }

    // Registrar configuración de alarmas para cada pauta creada
    const { updateAlarmConfig } = usePautaAlarms();
    for (const p of pautasGeneradas) {
      updateAlarmConfig(p, {
        tipo_alarma: p.tipo_alarma,
        hora_alarma: p.hora_alarma || undefined,
        intervalo_minutos: p.intervalo_minutos || 60,
        alarma_activa: true,
      });
    }

    // Persistir siempre también en la capa local reactiva para acceso inmediato
    persistNewRegistrationLocally(
      pacienteCreado,
      cirugiaCreada,
      pautasGeneradas,
      checkinsGenerados,
      alertaInicial
    );

    localCheckins.value.push(...checkinsGenerados);
    mockRealtimeBus.emit('cirugias', 'INSERT', cirugiaCreada);
    mockRealtimeBus.emit('alertas', 'INSERT', alertaInicial);

    await cargarTablero();
    isSaving.value = false;

    return {
      ok: true,
      paciente: pacienteCreado,
      cirugia: cirugiaCreada,
    };
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

  function marcarReporteAnsiedadRevisado(reporteId: string) {
    anxietyMonitoring.marcarReporteRevisado(reporteId);
    recalcularTodosLosSemaforos();
  }

  function recalcularTodosLosSemaforos() {
    cirugias.value = cirugias.value.map(c => {
      const alertasCir = alertas.value.filter(a => a.paciente_id === c.paciente_id);
      const reportesPac = anxietyMonitoring.getReportesPorPaciente(c.paciente_id);
      const { semaforo, pendientesCriticas } = calcularSemaforo(c.pautas, alertasCir, reportesPac);
      return {
        ...c,
        alertas: alertasCir,
        reportesAnsiedad: reportesPac,
        ultimoReporteAnsiedad: reportesPac[0] || null,
        semaforo,
        pautasCriticasPendientes: pendientesCriticas,
      };
    });
  }

  // Suscripción Realtime para la clínica
  function iniciarSuscripcionRealtime() {
    const unsubReportesAnsiedad = mockRealtimeBus.subscribe('reportes_ansiedad', () => {
      recalcularTodosLosSemaforos();
    });

    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('clinica-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, () => {
          cargarTablero();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas' }, () => {
          cargarTablero();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cirugias' }, () => {
          cargarTablero();
        })
        .subscribe();

      const unsubLocalAlertas = mockRealtimeBus.subscribe('alertas', payload => {
        const nueva = payload.new as Alerta;
        if (!alertas.value.some(a => a.id === nueva.id)) {
          alertas.value.unshift(nueva);
        }
        recalcularTodosLosSemaforos();
      });

      return () => {
        unsubReportesAnsiedad();
        unsubLocalAlertas();
        supabase?.removeChannel(channel);
      };
    } else {
      // Mock Realtime Bus
      const unsubCheckins = mockRealtimeBus.subscribe('checkins', payload => {
        const updated = payload.new as Checkin;
        const idx = localCheckins.value.findIndex(c => c.pauta_id === updated.pauta_id);
        if (idx >= 0) {
          localCheckins.value[idx] = { ...updated };
        } else {
          localCheckins.value.push({ ...updated });
        }

        for (const cir of cirugias.value) {
          const targetPauta = cir.pautas.find(p => p.id === updated.pauta_id);
          if (targetPauta) {
            targetPauta.checkin = { ...updated };
            break;
          }
        }

        recalcularTodosLosSemaforos();
      });

      const unsubAlertas = mockRealtimeBus.subscribe('alertas', payload => {
        const nueva = payload.new as Alerta;
        if (!alertas.value.some(a => a.id === nueva.id)) {
          alertas.value.unshift(nueva);
        }
        recalcularTodosLosSemaforos();
      });

      const unsubCirugias = mockRealtimeBus.subscribe('cirugias', () => {
        cargarDesdeMock();
      });

      return () => {
        unsubReportesAnsiedad();
        unsubCheckins();
        unsubAlertas();
        unsubCirugias();
      };
    }
  }

  return {
    cirugias,
    alertas,
    catalogoCirugias,
    reportesAnsiedad: anxietyMonitoring.anxietyReports,
    reportesUrgentesSinRevisar: anxietyMonitoring.reportesUrgentesSinRevisar,
    isLoading,
    isSaving,
    filtroSemaforo,
    resumen,
    cirugiasFiltradas,
    cargarTablero,
    cargarCatalogoCirugias,
    guardarCatalogoCirugia,
    registrarNuevaCirugia,
    marcarAlertaAtendida,
    marcarReporteAnsiedadRevisado,
    iniciarSuscripcionRealtime,
  };
});
