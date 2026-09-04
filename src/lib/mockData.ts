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
    nombre_sencillo: 'Cirugía de vesícula por laparoscopia',
    duracion_estimada: '60 a 90 minutos',
    tipo_anestesia: 'Anestesia General (Sueño profundo y seguro)',
    sensacion_anestesia: 'Sentirás una suave calidez reconfortante en el brazo y te quedarás plácidamente dormido en segundos sin sentir molestia alguna.',
    tiempo_recuperacion_sala: '1 a 2 horas en Sala de Recuperación (URPA)',
    dias_incapacidad_estimados: '3 a 5 días de reposo relativo en casa',
    fecha_programada: in48Hours,
    estado: 'programada',
    created_at: now.toISOString(),
  },
  {
    id: MOCK_CIRUGIA_B_ID,
    paciente_id: MOCK_PACIENTE_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    nombre_sencillo: 'Reemplazo total de cadera con prótesis',
    duracion_estimada: '90 a 120 minutos',
    tipo_anestesia: 'Anestesia Regional (Epidural) + Sedación Suave',
    sensacion_anestesia: 'Adormecimiento completo de la mitad inferior de tu cuerpo con una agradable sensación de descanso y tranquilidad.',
    tiempo_recuperacion_sala: '2 a 3 horas en Sala de Recuperación (URPA)',
    dias_incapacidad_estimados: '15 a 30 días con fisioterapia progresiva',
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
  // VIDEO DIDÁCTICO
  {
    id: 'mat-1',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'tecnica_quirurgica',
    tipo_recurso: 'video',
    titulo: '¿Cómo funciona la Cirugía Laparoscópica de Vesícula?',
    descripcion_corta: 'Conoce en 3 minutos la técnica de mínima invasión y cómo nuestro equipo cuidará de ti sin grandes cortes.',
    contenido_markdown: `### ¿Qué es una Colecistectomía Laparoscópica?
Es un procedimiento quirúrgico seguro donde el cirujano retira la vesícula biliar a través de **4 pequeñas incisiones milimétricas** (de entre 5 mm y 10 mm) en lugar de una herida abierta tradicional.

#### Beneficios clave para ti:
- **Menor dolor posoperatorio:** Al no cortar músculos grandes, la molestia es mínima y fácil de manejar con analgésicos.
- **Recuperación acelerada:** Podrás incorporarte y caminar el mismo día de la cirugía.
- **Cicatrices diminutas:** Sanan en pocas semanas dejando marcas casi imperceptibles.`,
    url_recurso: 'https://www.youtube.com/embed/5qap5aO4i9A',
    orden_visualizacion: 1,
    created_at: now.toISOString()
  },
  // INFOGRAFÍA ANATÓMICA
  {
    id: 'mat-2',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'tecnica_quirurgica',
    tipo_recurso: 'infografia',
    titulo: 'Anatomía y los 4 Puntos de Acceso Mínimo',
    descripcion_corta: 'Guía visual que ilustra las 4 diminutas entradas y explica por qué tu digestión continuará funcionando con normalidad.',
    contenido_markdown: `### ¿Qué ocurre en tu cuerpo al retirar la vesícula?
La vesícula no produce la bilis; solo sirve de pequeño tanque de almacenamiento. El hígado es quien realmente produce la bilis continuamente.

Tras la cirugía:
1. El hígado seguirá produciendo bilis normalmente.
2. La bilis fluirá directamente al intestino para digerir las grasas.
3. Después de un periodo breve de adaptación con dieta suave (15 a 30 días), volverás a tu alimentación habitual.`,
    url_recurso: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80',
    orden_visualizacion: 2,
    created_at: now.toISOString()
  },
  // EL RECORRIDO DE TU CIRUGÍA (5 PASOS)
  {
    id: 'mat-rec-1',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '1. Ingreso y Admisión',
    descripcion_corta: 'Llegada 2 horas antes del procedimiento con tu acompañante.',
    contenido_markdown: 'Llegas a la clínica con tu acompañante. En la recepción de admisión validan tus documentos (cédula, orden médica y exámen prequirúrgico impreso), te colocan tu brazalete de identificación clínica y te asignan un casillero seguro para guardar tus pertenencias.',
    url_recurso: null,
    orden_visualizacion: 10,
    created_at: now.toISOString()
  },
  {
    id: 'mat-rec-2',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '2. Preparación Inmediata',
    descripcion_corta: 'Cambio a bata limpia y canalización suave de vía venosa.',
    contenido_markdown: 'Pasas al área de vestier quirúrgico para colocar la bata cómoda y el gorro antiséptico. La enfermera canalizará una vía venosa en tu brazo con una aguja pequeña para suministrar suero hidratante. El anestesiólogo te saludará y revisará tus constantes.',
    url_recurso: null,
    orden_visualizacion: 11,
    created_at: now.toISOString()
  },
  {
    id: 'mat-rec-3',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '3. Entrada a Quirófano',
    descripcion_corta: 'Ambiente limpio, monitoreo continuo y anestesia confortable.',
    contenido_markdown: 'Ingresas a la sala quirúrgica climatizada. El equipo se presenta. Sentirás cómo los parches de monitorización registran tu pulso rítmicamente. El anestesiólogo te colocará una mascarilla de oxígeno suave y medicación relajante: **te quedarás dormido en segundos.**',
    url_recurso: null,
    orden_visualizacion: 12,
    created_at: now.toISOString()
  },
  {
    id: 'mat-rec-4',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '4. Sala de Recuperación (URPA)',
    descripcion_corta: 'Despertar asistido con mantas térmicas y control del dolor.',
    contenido_markdown: 'Despertarás arropado con mantas térmicas confortables. Una enfermera estará a tu lado verificando que te sientas bien. Si notas cualquier molestia en el abdomen, te suministrará analgésicos intravenosos inmediatos.',
    url_recurso: null,
    orden_visualizacion: 13,
    created_at: now.toISOString()
  },
  {
    id: 'mat-rec-5',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '5. Criterios de Alta y Regreso',
    descripcion_corta: 'Evaluación médica y retorno seguro a casa.',
    contenido_markdown: 'Una vez toleres un vaso de té o agua y puedas incorporarte con apoyo, el cirujano firmará tu alta con la receta de medicamentos y las pautas para casa. Saldrás acompañado en transporte privado.',
    url_recurso: null,
    orden_visualizacion: 14,
    created_at: now.toISOString()
  },
  // CHECKLIST MALETA
  {
    id: 'mat-3',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'guia_maleta',
    tipo_recurso: 'articulo',
    titulo: 'Checklist: ¿Qué empacar en tu maleta prequirúrgica?',
    descripcion_corta: 'Lista completa de documentos, ropa y aseo permitidos, junto con las cosas que debes dejar en casa.',
    contenido_markdown: `### Documentación Obligatoria
- [ ] Documento de identidad original (Cédula o pasaporte).
- [ ] Orden médica quirúrgica y autorización de tu EPS o aseguradora de salud.
- [ ] Resultados físicos recientes de analítica de sangre y electrocardiograma.

### Ropa y Confort
- [ ] Ropa muy holgada y cómoda (preferiblemente camisa o vestido abotonado al frente para no forzar el abdomen).
- [ ] Calzado plano, cerrado y con suela de goma antideslizante.
- [ ] Muda de ropa interior holgada de algodón.
- [ ] Útiles personales permitidos: cepillo de dientes, pasta dental y toalla pequeña.

### ❌ LO QUE DEBES DEJAR EN CASA:
- ❌ Joyas, anillos, aretes o cadenas (por electrocauterio quirúrgico).
- ❌ Esmalte en uñas de manos y pies (el oxímetro requiere uña limpia).
- ❌ Lentes de contacto (usa tus gafas de marco habituales).
- ❌ Grandes sumas de dinero o artículos de alto valor.`,
    url_recurso: null,
    orden_visualizacion: 20,
    created_at: now.toISOString()
  },
  // PREGUNTAS FRECUENTES (FAQS)
  {
    id: 'mat-faq-1',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Sentiré dolor durante o después de la cirugía?',
    descripcion_corta: 'Explicación transparente sobre el protocolo de anestesia y analgesia.',
    contenido_markdown: '**Durante la cirugía NO sentirás ningún dolor**, ya que estarás bajo anestesia general profunda monitoreada segundo a segundo por un médico anestesiólogo especialista.\n\nDespués de la cirugía es normal sentir una sensación de distensión o tirantez abdominal similar a haber hecho ejercicio. En la sala de recuperación te suministraremos analgésicos inmediatos para que te sientas completamente cómodo.',
    url_recurso: null,
    orden_visualizacion: 30,
    created_at: now.toISOString()
  },
  {
    id: 'mat-faq-2',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Qué hago si tengo tos, fiebre o resfriado el día anterior?',
    descripcion_corta: 'Pauta clínica ante síntomas respiratorios repentinos.',
    contenido_markdown: 'Si presentas fiebre, tos con flema, secreción nasal abundante o congestión fuerte el día anterior a tu cirugía, **debes avisar a nuestro equipo de enfermería de inmediato** a través de la línea de ayuda del portal.\n\nEl equipo médico evaluará la inflamación de tu vía respiratoria para decidir si es seguro continuar o si es mejor reprogramar unos días para garantizar tu total seguridad.',
    url_recurso: null,
    orden_visualizacion: 31,
    created_at: now.toISOString()
  },
  {
    id: 'mat-faq-3',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Puedo tomar agua con mis medicamentos habituales de la mañana?',
    descripcion_corta: 'Regla médica sobre la ingesta de fármacos matutinos.',
    contenido_markdown: 'Solo debes tomar los medicamentos que tu anestesiólogo o cirujano te haya indicado explícitamente durante la cita prequirúrgica (por ejemplo, antihipertensivos en dosis específica).\n\nSi te autorizaron tomarlo, hazlo **con un solo sorbo de agua muy pequeño (máximo un trago)** al menos 2 horas antes de tu hora de llegada. No consumas nada más.',
    url_recurso: null,
    orden_visualizacion: 32,
    created_at: now.toISOString()
  },
  {
    id: 'mat-faq-4',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Quién me debe acompañar para el regreso a casa?',
    descripcion_corta: 'Requisito obligatorio de acompañante adulto responsable.',
    contenido_markdown: 'Es un requisito obligatorio ingresar y salir del hospital con **un adulto responsable de tu confianza**.\n\nTras la anestesia no podrás conducir ni tomar transporte público tú solo. Tu acompañante escuchará las recomendaciones del cirujano, reclamará la fórmula médica y te acompañará en vehículo privado o taxi hasta tu hogar.',
    url_recurso: null,
    orden_visualizacion: 33,
    created_at: now.toISOString()
  }
];
