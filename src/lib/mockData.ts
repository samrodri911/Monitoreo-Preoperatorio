import type { Paciente, Cirugia, Pauta, Checkin, Alerta, MaterialEducativo } from '../types/database.types';

// IDs fijos para consistencia en modo demo
export const MOCK_PACIENTE_A_ID = '11111111-1111-4111-a111-111111111111';
export const MOCK_CIRUGIA_A_ID = '22222222-2222-4222-a222-222222222222';

export const MOCK_PACIENTE_B_ID = '33333333-3333-4333-b333-333333333333';
export const MOCK_CIRUGIA_B_ID = '44444444-4444-4444-b444-444444444444';

// Fechas dinámicas calculadas al momento de carga
const now = new Date();
const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
const in6Hours = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();

export const initialMockPacientes: Paciente[] = [
  {
    id: MOCK_PACIENTE_A_ID,
    nombre_completo: 'Carlos Alberto Mendoza',
    documento: '1020304050',
    telefono: '+57 300 123 4567',
    edad: 58,
    contacto_emergencia: 'Marta Mendoza (Hija) - 301 987 6543',
    created_at: now.toISOString(),
  },
  {
    id: MOCK_PACIENTE_B_ID,
    nombre_completo: 'Elena María Restrepo',
    documento: '9876543210',
    telefono: '+57 312 456 7890',
    edad: 67,
    contacto_emergencia: 'Andrés Gómez (Esposo) - 315 222 3344',
    created_at: now.toISOString(),
  }
];

export const initialMockCirugias: Cirugia[] = [
  {
    id: MOCK_CIRUGIA_A_ID,
    paciente_id: MOCK_PACIENTE_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    fecha_programada: in48Hours,
    estado: 'programada',
    created_at: now.toISOString(),
  },
  {
    id: MOCK_CIRUGIA_B_ID,
    paciente_id: MOCK_PACIENTE_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    fecha_programada: in6Hours,
    estado: 'en_preparacion',
    created_at: now.toISOString(),
  }
];

export const initialMockPautas: Pauta[] = [
  // Pautas Carlos Mendoza (Cirugía en 48h)
  {
    id: 'pauta-a-1',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    titulo: 'Suspensión de Anticoagulantes/Aspirina',
    descripcion: 'Suspender ácido acetilsalicílico o anticoagulantes orales según prescripción médica.',
    horas_previas: 72,
    es_critica: true,
    fecha_limite: new Date(new Date(in48Hours).getTime() - 72 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-a-2',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    titulo: 'Dieta Ligera e Hidratación Abundante',
    descripcion: 'Consumir alimentos de fácil digestión (sopas claras, pollo a la plancha), evitar grasas y lácteos pesados.',
    horas_previas: 48,
    es_critica: false,
    fecha_limite: new Date(new Date(in48Hours).getTime() - 48 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-a-3',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    titulo: 'Ducha Prequirúrgica con Clorhexidina',
    descripcion: 'Realizar baño corporal completo con jabón antiséptico especial la noche anterior. Enfatizar abdomen.',
    horas_previas: 24,
    es_critica: true,
    fecha_limite: new Date(new Date(in48Hours).getTime() - 24 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-a-4',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    titulo: 'Ayuno Total de Sólidos y Líquidos',
    descripcion: 'No ingerir ningún tipo de alimento sólido ni agua a partir de este momento para evitar complicaciones anestésicas.',
    horas_previas: 8,
    es_critica: true,
    fecha_limite: new Date(new Date(in48Hours).getTime() - 8 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },

  // Pautas Elena Restrepo (Cirugía en 6h)
  {
    id: 'pauta-b-1',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    titulo: 'Suspensión de Antiinflamatorios',
    descripcion: 'No tomar Ibuprofeno, Naproxeno ni analgésicos que alteren la coagulación.',
    horas_previas: 72,
    es_critica: true,
    fecha_limite: new Date(new Date(in6Hours).getTime() - 72 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-b-2',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    titulo: 'Ducha Antiséptica con Clorhexidina',
    descripcion: 'Lavado cuidadoso de la zona de cadera e ingle con esponja suave sin frotar con fuerza.',
    horas_previas: 24,
    es_critica: true,
    fecha_limite: new Date(new Date(in6Hours).getTime() - 24 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-b-3',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    titulo: 'Ayuno Estricto de Sólidos (CRÍTICO)',
    descripcion: 'AYUNO OBLIGATORIO: Cero alimentos sólidos. El estómago debe estar 100% vacío antes del traslado a quirófano.',
    horas_previas: 8,
    es_critica: true,
    fecha_limite: new Date(new Date(in6Hours).getTime() - 8 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-b-4',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    titulo: 'Presentación en Admisión con Acompañante',
    descripcion: 'Llegada al centro quirúrgico con documento de identidad y acompañante adulto responsable.',
    horas_previas: 2,
    es_critica: true,
    fecha_limite: new Date(new Date(in6Hours).getTime() - 2 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  }
];

export const initialMockCheckins: Checkin[] = [
  // Checkins Carlos (Al día)
  {
    id: 'check-a-1',
    pauta_id: 'pauta-a-1',
    estado: 'completado',
    fecha_respuesta: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    observaciones: 'Medicamento suspendido desde el lunes según indicación.',
    updated_at: now.toISOString(),
  },
  {
    id: 'check-a-2',
    pauta_id: 'pauta-a-2',
    estado: 'completado',
    fecha_respuesta: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    observaciones: 'Cena ligera cumplida sin molestias.',
    updated_at: now.toISOString(),
  },
  {
    id: 'check-a-3',
    pauta_id: 'pauta-a-3',
    estado: 'pendiente',
    fecha_respuesta: null,
    observaciones: null,
    updated_at: now.toISOString(),
  },
  {
    id: 'check-a-4',
    pauta_id: 'pauta-a-4',
    estado: 'pendiente',
    fecha_respuesta: null,
    observaciones: null,
    updated_at: now.toISOString(),
  },

  // Checkins Elena (Falta de confirmación de ayuno = Alerta Roja)
  {
    id: 'check-b-1',
    pauta_id: 'pauta-b-1',
    estado: 'completado',
    fecha_respuesta: new Date(now.getTime() - 60 * 3600 * 1000).toISOString(),
    observaciones: 'Confirmado por vía telefónica.',
    updated_at: now.toISOString(),
  },
  {
    id: 'check-b-2',
    pauta_id: 'pauta-b-2',
    estado: 'completado',
    fecha_respuesta: new Date(now.getTime() - 18 * 3600 * 1000).toISOString(),
    observaciones: 'Ducha realizada en la noche.',
    updated_at: now.toISOString(),
  },
  {
    id: 'check-b-3',
    pauta_id: 'pauta-b-3',
    estado: 'pendiente',
    fecha_respuesta: null,
    observaciones: 'ALERTA: Han pasado más de 2 horas de la hora límite de ayuno sin reporte.',
    updated_at: now.toISOString(),
  },
  {
    id: 'check-b-4',
    pauta_id: 'pauta-b-4',
    estado: 'pendiente',
    fecha_respuesta: null,
    observaciones: null,
    updated_at: now.toISOString(),
  }
];

export const initialMockAlertas: Alerta[] = [
  {
    id: 'alert-1',
    paciente_id: MOCK_PACIENTE_A_ID,
    cirugia_id: MOCK_CIRUGIA_A_ID,
    nivel: 'verde',
    mensaje: 'Paciente con check-ins críticos al día. Procedimiento en 48h con preparación óptima.',
    atendida: false,
    created_at: now.toISOString(),
  },
  {
    id: 'alert-2',
    paciente_id: MOCK_PACIENTE_B_ID,
    cirugia_id: MOCK_CIRUGIA_B_ID,
    nivel: 'rojo',
    mensaje: 'RIESGO CRÍTICO DE CANCELACIÓN: Pauta de Ayuno Estricto (-8h) no confirmada. Cirugía en 6 horas.',
    atendida: false,
    created_at: now.toISOString(),
  }
];

export const initialMockMateriales: MaterialEducativo[] = [
  {
    id: 'mat-1',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'tecnica_quirurgica',
    tipo_recurso: 'video',
    titulo: '¿Cómo funciona la Cirugía Laparoscópica de Vesícula?',
    descripcion_corta: 'Conoce en 3 minutos el procedimiento de mínima invasión y cómo nuestro equipo cuidará de ti sin grandes cortes.',
    contenido_markdown: `### ¿Qué es una Colecistectomía Laparoscópica?
Es un procedimiento quirúrgico seguro donde el cirujano retira la vesícula biliar a través de **pequeñas incisiones milimétricas** (de entre 5 mm y 10 mm) en lugar de una herida abierta tradicional.

#### Beneficios clave para ti:
- **Menor dolor posoperatorio:** Al no cortar músculos grandes, la molestia es muy baja y controlable con analgésicos comunes.
- **Recuperación acelerada:** Podrás levantarte y caminar el mismo día de la intervención.
- **Mínima cicatriz:** Cicatrices diminutas que sanan rápidamente.`,
    url_recurso: 'https://www.youtube.com/embed/5qap5aO4i9A',
    orden_visualizacion: 1,
    created_at: now.toISOString()
  },
  {
    id: 'mat-2',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'tecnica_quirurgica',
    tipo_recurso: 'infografia',
    titulo: 'Anatomía y los 4 Puntos de Acceso Mínimo',
    descripcion_corta: 'Guía visual ilustrada que muestra la ubicación de los 4 pequeños accesos y por qué tu cuerpo seguirá digiriendo alimentos normalmente.',
    contenido_markdown: `### ¿Qué pasa en tu organismo sin la vesícula?
La vesícula no produce la bilis; únicamente la almacena como un pequeño reservorio. El hígado es quien realmente la produce continuamente.

Tras la cirugía:
1. Tu hígado seguirá produciendo bilis normalmente.
2. La bilis fluirá directamente al intestino delgado para emulsionar y digerir las grasas.
3. Tras un breve periodo de adaptación con dieta blanda (15 a 30 días), tu digestión volverá a la normalidad completa.`,
    url_recurso: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80',
    orden_visualizacion: 2,
    created_at: now.toISOString()
  },
  {
    id: 'mat-3',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'guia_maleta',
    tipo_recurso: 'articulo',
    titulo: 'Checklist: ¿Qué llevar al hospital el día de tu ingreso?',
    descripcion_corta: 'Lista práctica para empacar sin estrés. Conoce qué cosas son obligatorias y qué objetos es indispensable dejar en casa.',
    contenido_markdown: `### Documentación Indispensable
- Documento de identidad original (Cédula o pasaporte).
- Orden médica quirúrgica y autorización de tu EPS o aseguradora de salud.
- Resultados físicos recientes de analítica de sangre y electrocardiograma.

### Ropa y Confort
- Ropa muy holgada y cómoda (preferiblemente camisa o vestido abotonado al frente para no forzar el abdomen).
- Calzado plano, cerrado y con suela de goma antideslizante.
- Muda de ropa interior holgada de algodón.

### Lo que DEBES dejar en casa:
- ❌ Joyas, anillos, aretes o cadenas (por protocolo de electrocauterio quirúrgico).
- ❌ Esmalte en uñas de manos y pies (el sensor del oxímetro requiere uña limpia).
- ❌ Lentes de contacto (usa tus gafas de marco habituales).
- ❌ Grandes sumas de dinero o artículos de alto valor.`,
    url_recurso: null,
    orden_visualizacion: 3,
    created_at: now.toISOString()
  },
  {
    id: 'mat-4',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'que_esperar',
    tipo_recurso: 'articulo',
    titulo: '¿Qué pasará minuto a minuto el día de tu cirugía?',
    descripcion_corta: 'Conoce cada estación del hospital para que nada te tome por sorpresa: desde la admisión hasta tu regreso seguro a casa.',
    contenido_markdown: `### La Ruta Segura de tu Atención

#### 1. Admisión y Registro (2 horas antes)
Llegas con tu acompañante. El equipo valida tus documentos y coloca tu brazalete de identificación clínica.

#### 2. Preparación Prequirúrgica
Pasas al área vestier, te pones la bata quirúrgica. La enfermera canalizará una pequeña vía venosa en tu brazo para hidratación. Conocerás a tu anestesiólogo, quien revisará tus signos y resolverá tus últimas dudas.

#### 3. Quirófano
Entras a una sala limpia y climatizada. Sentirás cómo el monitor registra tu pulso con suaves pitidos rítmicos. El anestesiólogo te administrará una medicación relajante por la vena y te pondrá una mascarilla de oxígeno suave. **Te quedarás dormido plácidamente en segundos.**

#### 4. Sala de Recuperación (URPA)
Despertarás arropado con mantas térmicas. Sentirás el abdomen algo tirante (similar a haber hecho mucho ejercicio abdominal). La enfermera te administrará analgésicos inmediatos si sientes cualquier molestia.

#### 5. Alta y Camino a Casa
Una vez toleres un vaso de líquido y puedas incorporarte con asistencia, el cirujano firmará tu alta con la receta de analgesia y cuidados domiciliarios.`,
    url_recurso: null,
    orden_visualizacion: 4,
    created_at: now.toISOString()
  },
  {
    id: 'mat-5',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'cuidados_generales',
    tipo_recurso: 'articulo',
    titulo: 'Preguntas Frecuentes: Despejando Miedos Habituales',
    descripcion_corta: 'Respuestas empáticas a las dudas que más suelen preocupar a nuestros pacientes antes de entrar al quirófano.',
    contenido_markdown: `### ¿Sentiré dolor durante la cirugía?
**Absolutamente no.** Estarás bajo anestesia general profunda controlada por un médico anestesiólogo especialista dedicado 100% a vigilar tus constantes vitales y asegurar que no sientas nada.

### ¿Por qué es tan estricto el ayuno de 8 horas?
Cuando estás bajo anestesia, los reflejos normales que protegen tu vía respiratoria se duermen. Tener el estómago completamente vacío garantiza que ningún jugo gástrico pueda ascender hacia tus pulmones. ¡Cumplirlo previene cualquier riesgo!

### ¿Es normal sentir ansiedad o nervios?
**Completamente normal y comprensible.** La incertidumbre produce temor natural. Prueba respirar en patrón 4-7-8 (inhalar en 4 seg, sostener en 7, exhalar en 8). Recuerda que nuestro equipo realiza este procedimiento a diario con los más altos estándares de seguridad.`,
    url_recurso: null,
    orden_visualizacion: 5,
    created_at: now.toISOString()
  }
];
