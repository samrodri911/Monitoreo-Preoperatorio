import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HubView from '../views/HubView.vue'
import PacienteView from '../views/PacienteView.vue'
import ClinicaView from '../views/ClinicaView.vue'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'root',
      redirect: () => {
        const authStore = useAuthStore()
        authStore.hydrateSession()
        if (authStore.isPaciente) return '/paciente'
        if (authStore.isMedico) return '/clinica'
        return '/login'
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: 'Iniciar Sesión — PreCare',
      },
    },
    {
      path: '/paciente',
      name: 'paciente',
      component: PacienteView,
      meta: {
        title: 'Mi Preparación Quirúrgica — PreCare',
        requiresAuth: true,
        allowedRoles: ['paciente', 'medico'],
      },
    },
    {
      path: '/clinica',
      name: 'clinica',
      component: ClinicaView,
      meta: {
        title: 'Tablero Clínico Semáforo — PreCare',
        requiresAuth: true,
        allowedRoles: ['medico'],
      },
    },
    {
      path: '/hub',
      name: 'hub',
      component: HubView,
      meta: {
        title: 'PreCare | Arquitectura del Ecosistema',
      },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  authStore.hydrateSession()

  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Si intenta ir a una ruta protegida sin sesión activa -> redirigir a /login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      path: '/login',
      query: to.path === '/clinica' ? { rol: 'medico' } : undefined,
    }
  }

  // Protección estricta de rol: un paciente autenticado no puede entrar a /clinica
  const allowedRoles = to.meta.allowedRoles as string[] | undefined
  if (allowedRoles && authStore.role && !allowedRoles.includes(authStore.role)) {
    return authStore.isPaciente ? { path: '/paciente' } : { path: '/clinica' }
  }

  return true
})

export default router
