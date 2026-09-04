import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HubView from '../views/HubView.vue';
import PacienteView from '../views/PacienteView.vue';
import ClinicaView from '../views/ClinicaView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'hub',
    component: HubView,
  },
  {
    path: '/paciente',
    name: 'paciente',
    component: PacienteView,
  },
  {
    path: '/clinica',
    name: 'clinica',
    component: ClinicaView,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
