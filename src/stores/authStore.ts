import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Paciente, PersonalClinico, UserRole } from '../types/database.types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  initialMockPacientes,
  initialMockCirugias,
  initialMockPersonalClinico,
  enrichPacienteWithMeta,
  enrichCirugiaWithMeta,
  loadPersistedDynamicRecords,
} from '../lib/mockData';
import { usePacienteStore } from './pacienteStore';

const AUTH_STORAGE_KEY = 'precare_auth_session_v1';

interface StoredSession {
  role: UserRole;
  pacienteId: string | null;
  pacienteData: Paciente | null;
  medicoData: PersonalClinico | null;
}

export const useAuthStore = defineStore('auth', () => {
  const role = ref<UserRole | null>(null);
  const pacienteId = ref<string | null>(null);
  const pacienteData = ref<Paciente | null>(null);
  const medicoData = ref<PersonalClinico | null>(null);
  const isLoading = ref<boolean>(false);
  const authError = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(role.value));
  const isPaciente = computed(() => role.value === 'paciente');
  const isMedico = computed(() => role.value === 'medico');

  // Hidratar sesión desde localStorage al iniciar
  function hydrateSession() {
    if (typeof window === 'undefined') return;
    loadPersistedDynamicRecords();
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed: StoredSession = JSON.parse(raw);
      if (parsed && parsed.role) {
        role.value = parsed.role;
        pacienteId.value = parsed.pacienteId;
        pacienteData.value = parsed.pacienteData;
        medicoData.value = parsed.medicoData;
      }
    } catch (e) {
      console.warn('[AuthStore] Error restaurando sesión:', e);
    }
  }

  function persistSession() {
    if (typeof window === 'undefined') return;
    try {
      if (!role.value) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }
      const payload: StoredSession = {
        role: role.value,
        pacienteId: pacienteId.value,
        pacienteData: pacienteData.value,
        medicoData: medicoData.value,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[AuthStore] Error guardando sesión:', e);
    }
  }

  /**
   * Inicio de sesión para Paciente mediante Documento + PIN / Código de Cirugía
   */
  async function loginPaciente(documentoInput: string, pinOCodigoInput: string): Promise<boolean> {
    isLoading.value = true;
    authError.value = null;
    loadPersistedDynamicRecords();

    const docClean = documentoInput.trim();
    const pinClean = pinOCodigoInput.trim();

    if (!docClean || !pinClean) {
      authError.value = 'Por favor ingresa tu número de documento y tu PIN o código de acceso.';
      isLoading.value = false;
      return false;
    }

    let foundPaciente: Paciente | null = null;
    let foundCodigoCirugia: string | null = null;

    // 1. Buscar primero en Supabase si está configurado
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: pacRows } = await supabase
          .from('pacientes')
          .select('*')
          .eq('documento', docClean)
          .limit(1);

        if (pacRows && pacRows.length > 0) {
          foundPaciente = enrichPacienteWithMeta(pacRows[0] as Paciente);

          const { data: cirRows } = await supabase
            .from('cirugias')
            .select('*')
            .eq('paciente_id', foundPaciente.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (cirRows && cirRows.length > 0) {
            const enrichedCir = enrichCirugiaWithMeta(cirRows[0]);
            foundCodigoCirugia = enrichedCir.codigo_cirugia || null;
          }
        }
      } catch (err) {
        console.warn('[AuthStore] Consulta Supabase falló, verificando registros locales:', err);
      }
    }

    // 2. Fallback / búsqueda en registros locales o recién creados
    if (!foundPaciente) {
      const localMatch = initialMockPacientes.find(p => p.documento.trim() === docClean);
      if (localMatch) {
        foundPaciente = enrichPacienteWithMeta(localMatch);
        const localCir = initialMockCirugias.find(c => c.paciente_id === localMatch.id);
        if (localCir) {
          foundCodigoCirugia = enrichCirugiaWithMeta(localCir).codigo_cirugia || null;
        }
      }
    }

    if (!foundPaciente) {
      authError.value = `No encontramos ningún expediente registrado con el documento "${docClean}". Verifica los números o consulta con admisiones.`;
      isLoading.value = false;
      return false;
    }

    // Validar PIN de acceso, código de cirugía o últimos 4 dígitos del documento
    const expectedPin = (foundPaciente.pin_acceso || foundPaciente.documento.slice(-4)).trim();
    const ultimos4Doc = foundPaciente.documento.slice(-4);
    const pinValido =
      pinClean === expectedPin ||
      pinClean === ultimos4Doc ||
      (foundCodigoCirugia && pinClean.toUpperCase() === foundCodigoCirugia.toUpperCase());

    if (!pinValido) {
      authError.value = 'El PIN o Código de Cirugía ingresado no coincide con tu documento. Intenta con los últimos 4 dígitos de tu documento o el PIN asignado.';
      isLoading.value = false;
      return false;
    }

    // Autenticación exitosa
    role.value = 'paciente';
    pacienteId.value = foundPaciente.id;
    pacienteData.value = foundPaciente;
    medicoData.value = null;
    persistSession();

    const pacienteStore = usePacienteStore();
    await pacienteStore.cargarDatosPaciente(foundPaciente.id);

    isLoading.value = false;
    return true;
  }

  /**
   * Acceso directo para botones de demostración o prueba rápida de pacientes
   */
  async function loginRapidoPaciente(targetPacienteId: string): Promise<boolean> {
    isLoading.value = true;
    authError.value = null;
    loadPersistedDynamicRecords();

    const pacienteStore = usePacienteStore();
    await pacienteStore.cargarDatosPaciente(targetPacienteId);

    if (pacienteStore.paciente) {
      role.value = 'paciente';
      pacienteId.value = pacienteStore.paciente.id;
      pacienteData.value = enrichPacienteWithMeta(pacienteStore.paciente);
      medicoData.value = null;
      persistSession();
      isLoading.value = false;
      return true;
    }

    authError.value = 'No fue posible cargar el perfil seleccionado.';
    isLoading.value = false;
    return false;
  }

  /**
   * Inicio de sesión para Personal Médico / Clínico
   */
  async function loginMedico(emailInput: string, passwordInput: string): Promise<boolean> {
    isLoading.value = true;
    authError.value = null;

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanEmail || !cleanPass) {
      authError.value = 'Ingresa tu correo institucional y contraseña.';
      isLoading.value = false;
      return false;
    }

    // 1. Verificar en tabla personal_clinico de Supabase (si existe)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: staffRows, error: staffError } = await supabase
          .from('personal_clinico')
          .select('*')
          .ilike('email', cleanEmail)
          .limit(1);

        if (!staffError && staffRows && staffRows.length > 0) {
          const staff = staffRows[0];
          if (staff.password_hash === cleanPass) {
            role.value = 'medico';
            medicoData.value = {
              id: staff.id,
              nombre_completo: staff.nombre_completo,
              email: staff.email,
              rol: staff.rol,
              especialidad: staff.especialidad,
            };
            pacienteId.value = null;
            pacienteData.value = null;
            persistSession();
            isLoading.value = false;
            return true;
          } else {
            authError.value = 'Contraseña institucional incorrecta.';
            isLoading.value = false;
            return false;
          }
        }
      } catch (e) {
        // Si la tabla personal_clinico aún no fue migrada en Supabase, continuar con validación local
      }
    }

    // 2. Verificar contra las cuentas clínicas autorizadas
    const mockStaff = initialMockPersonalClinico.find(
      m => m.email.toLowerCase() === cleanEmail
    );

    if (mockStaff) {
      if (mockStaff.password_Demo === cleanPass) {
        role.value = 'medico';
        medicoData.value = {
          id: mockStaff.id,
          nombre_completo: mockStaff.nombre_completo,
          email: mockStaff.email,
          rol: mockStaff.rol,
          especialidad: mockStaff.especialidad,
        };
        pacienteId.value = null;
        pacienteData.value = null;
        persistSession();
        isLoading.value = false;
        return true;
      } else {
        authError.value = 'La contraseña ingresada no es válida para esta cuenta clínica.';
        isLoading.value = false;
        return false;
      }
    }

    authError.value = 'No se encontró una cuenta médica autorizada con ese correo institucional.';
    isLoading.value = false;
    return false;
  }

  /**
   * Cerrar sesión activa
   */
  function logout() {
    role.value = null;
    pacienteId.value = null;
    pacienteData.value = null;
    medicoData.value = null;
    authError.value = null;
    persistSession();
  }

  // Hidratar inmediatamente al instanciar el store
  hydrateSession();

  return {
    role,
    pacienteId,
    pacienteData,
    medicoData,
    isLoading,
    authError,
    isAuthenticated,
    isPaciente,
    isMedico,
    hydrateSession,
    loginPaciente,
    loginRapidoPaciente,
    loginMedico,
    logout,
  };
});
