# 🏥 Ecosistema Phygital Inclusivo "Tech-and-Touch" (Preparación Prequirúrgica)

[![Vue 3](https://img.shields.io/badge/Vue-3.5-4fc08d?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Realtime-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accesibilidad-WCAG%202.1%20AA-0d9488?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **Plataforma web de acompañamiento clínico y quirúrgico diseñada bajo la metodología TRIZ (Principios de Segmentación y Anticipación - Requerimiento RD1).**
> 
> Su misión principal es educar al paciente, disipar la ansiedad anticipatoria prequirúrgica y predecir en tiempo real el riesgo de cancelaciones de cirugías por fallos en ayuno, falta de suspensión de medicamentos o asepsia inadecuada.

---

## 🌟 Características Principales

### 1. Portal del Paciente (`/paciente`) — *Aislamiento Estricto de Roles*
- **Ficha de Presentación Empática (Hero):** Explicación del procedimiento en lenguaje sencillo (ej. *"Cirugía de vesícula por laparoscopia"*), cuenta regresiva dinámica en tiempo real (días, horas, minutos, segundos) e indicadores clave accesibles: tipo de anestesia (y qué se siente), duración estimada, tiempo en sala de recuperación e incapacidad estimada.
- **Centro Educativo Preoperatorio (RD1):**
  - **Módulo Multimedia:** Reproductor de video didáctico responsivo e infografía anatómica explicativa de accesos de mínima invasión con zoom en modal.
  - **El Recorrido de tu Cirugía:** Guía paso a paso en 5 estaciones (1. Admisión, 2. Preparación, 3. Quirófano, 4. Recuperación URPA, 5. Alta médica).
  - **Checklist Interactivo de la Maleta:** Lista interactiva para empacar con persistencia (`localStorage`) y advertencias de seguridad (NO joyas, NO esmaltes de uñas, NO lentes de contacto).
  - **Preguntas Frecuentes (FAQ):** Desplegable interactivo sobre dolor, síntomas de tos/resfriado, ingesta de medicamentos matutinos con agua y acompañante obligatorio.
- **Dosificación Cronológica de Pautas:** Cronograma interactivo por etapas (-72h, -24h, -8h, -2h) con check-ins de confirmación inmediata.
- **Línea de Ayuda & Asistencia 24/7:** Modal de contacto rápido con líneas directas de enfermería y coordinación quirúrgica.
- **Placeholder para Agente IA de Voz / Pulsera Wearable:** Espacio reservado para la futura integración phygital.

### 2. Tablero Clínico Semáforo en Tiempo Real (`/clinica`) — *Supervisión Quirúrgica*
- **Lógica de Semáforo de Riesgo:**
  - 🟢 **Verde (Preparado):** Paciente con pautas críticas verificadas al día.
  - 🟡 **Amarillo (Alerta Leve):** Pauta próxima a vencer sin confirmación.
  - 🔴 **Rojo (Riesgo Crítico):** Incumplimiento o pauta crítica de ayuno vencida sin confirmación (riesgo inminente de cancelación).
- **Sincronización Reactiva:** Escucha eventos WebSockets vía Supabase Realtime (o bus reactivo local). Cuando el paciente completa un check-in en `/paciente`, el semáforo en `/clinica` cambia automáticamente sin recargar la página.
- **Feed de Alertas en Vivo:** Historial reactivo con opción de marcar alertas como atendidas.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Vue 3 (Single File Components con `<script setup lang="ts">`) + Vite.
- **Enrutamiento:** Vue Router 4 (modo HTML5 History).
- **Manejo de Estado:** Pinia.
- **Diseño & Estilos:** Tailwind CSS (Paleta clínica personalizada de alto contraste, WCAG 2.1 AA).
- **Iconografía:** Lucide Icons (`lucide-vue-next`).
- **Backend & Base de Datos:** Supabase (PostgreSQL 15+ & WebSockets Realtime via `@supabase/supabase-js`).
- **Patrón de Adaptador:** Operación dual (Supabase Cloud Live + Modo Demo Local Reactivo para pruebas offline o sin credenciales).

---

## 📂 Estructura del Proyecto

```text
Monitoreo_preoperatorio/
├── schema.sql                         # Script DDL inicial de PostgreSQL para Supabase
├── schema_educativo.sql               # Script DDL base para el módulo educativo RD1
├── update_materiales_educativos.sql   # Script SQL de enriquecimiento de datos clínicos
├── .env.example                       # Plantilla de variables de entorno
├── .env.local                         # Variables locales (URL y Anon Key de Supabase)
├── tailwind.config.js                 # Configuración de diseño accesible y paleta clínica
├── package.json
└── src/
    ├── types/
    │   └── database.types.ts          # Interfaces TypeScript del modelo relacional
    ├── lib/
    │   ├── supabase.ts                # Cliente Supabase con detección automática y bus local
    │   └── mockData.ts                # Datos semilla para pruebas offline/demo
    ├── stores/
    │   ├── pacienteStore.ts           # Store Pinia del paciente y check-ins
    │   └── clinicaStore.ts            # Store Pinia del semáforo hospitalario
    ├── components/
    │   ├── common/
    │   │   └── HeaderNav.vue          # Cabecera adaptativa con aislamiento de roles
    │   ├── paciente/
    │   │   ├── EducationalHero.vue    # Hero empático con countdown e indicadores
    │   │   ├── NavigationTabs.vue     # Alternador de pestañas accesibles
    │   │   ├── VideoPlayer.vue        # Reproductor responsivo 16:9
    │   │   ├── InfographicViewer.vue  # Visor ilustrado con modal zoom
    │   │   ├── DayOfSurgeryTimeline.vue# Recorrido de la cirugía en 5 pasos
    │   │   ├── HospitalBagChecklist.vue# Checklist interactivo con persistencia
    │   │   ├── FaqAccordion.vue       # Preguntas frecuentes interactivas
    │   │   ├── PautasTimeline.vue     # Cronograma de pautas (-72h a -2h)
    │   │   ├── CheckinItem.vue        # Item de verificación interactiva
    │   │   └── AgentMockCard.vue      # Placeholder para agente IA de voz
    │   └── clinica/
    │       ├── SemaforoBadge.vue      # Badge reactivo verde / amarillo / rojo
    │       ├── PatientRiskCard.vue    # Tarjeta médica con horas restantes y alertas
    │       └── LiveAlertFeed.vue      # Feed en vivo de notificaciones de riesgo
    └── views/
        ├── HubView.vue                # Ruta '/' (Hub demostrativo)
        ├── PacienteView.vue           # Ruta '/paciente' (Portal del Paciente)
        └── ClinicaView.vue            # Ruta '/clinica' (Tablero Hospitalario)
```

---

## ⚡ Requisitos Previos

- **Node.js:** Versión 18.0 o superior (Recomendado v20+ o v22+).
- **npm:** Versión 9.0 o superior.

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/Monitoreo-Preoperatorio.git
cd Monitoreo-Preoperatorio
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```

El servidor estará corriendo en: `http://localhost:5173`.

> **Nota:** La aplicación cuenta con **Modo Demo Local Reactivo incorporado**. Puedes abrir e interactuar inmediatamente con todas las vistas sin necesidad de configurar Supabase de entrada.

---

## 🗄️ Configuración de Supabase (Opcional para Nube)

Si deseas conectar el proyecto a tu cuenta en la nube de **Supabase**:

### 1. Crear el proyecto en Supabase
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard) y crea un nuevo proyecto PostgreSQL.
2. Abre el **SQL Editor** en el panel de Supabase.

### 2. Ejecutar los scripts SQL
Copia y ejecuta los scripts en el siguiente orden dentro del SQL Editor:
1. `schema.sql` (Crea las tablas `pacientes`, `cirugias`, `pautas`, `checkins`, `alertas`, habilita RLS y Realtime).
2. `schema_educativo.sql` (Crea la tabla `materiales_educativos`).
3. `update_materiales_educativos.sql` (Carga el catálogo rico de videos, infografías, recorrido y FAQs).

### 3. Configurar variables de entorno
Crea o edita el archivo `.env.local` en la raíz de tu proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

Guarda el archivo y reinicia el servidor (`npm run dev`). La aplicación detectará las credenciales y mostrará el indicador **🟢 Supabase Live** en el tablero clínico.

---

## 🧪 Guía de Prueba Rápida (Reactividad en Tiempo Real)

Para comprobar la sincronización instantánea entre el paciente y el equipo médico:

1. Abre dos ventanas de navegador lado a lado:
   - **Ventana 1:** `http://localhost:5173/clinica` (Tablero Hospitalario).
   - **Ventana 2:** `http://localhost:5173/paciente` (Selecciona a la paciente **Elena Restrepo**, quien se encuentra en 🔴 **Riesgo Crítico** por tener pendiente la pauta de ayuno).
2. En la ventana del paciente, ve a la pestaña **"Mi Preparación Activa"** y haz clic en **"Marcar como Cumplido"** en la pauta de *Ayuno Estricto de Sólidos*.
3. **Observa la ventana de la clínica (`/clinica`):** El semáforo de Elena cambiará de forma totalmente automática de 🔴 **Rojo** a 🟢 **Verde (Preparado)** sin recargar la página.

---

## 📦 Compilación para Producción

Para validar el tipado de TypeScript y generar el bundle optimizado para producción:

```bash
npm run build
```

Para previsualizar la compilación localmente:
```bash
npm run preview
```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más información.
