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
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    nombre_sencillo: 'Cirugía de apéndice por mínima invasión (laparoscopia)',
    especialidad: 'Cirugía General',
    duracion_estimada: '45 a 60 minutos',
    tipo_anestesia: 'Anestesia General',
    sensacion_anestesia: 'Sentirás una suave calidez en el brazo y te quedarás plácidamente dormido en segundos sin sentir dolor alguno.',
    tiempo_recuperacion: '24 a 48 horas de estancia ambulatoria / observación',
    tiempo_recuperacion_sala: '1 a 2 horas en Sala de Recuperación (URPA)',
    dias_incapacidad_estimados: '7 a 15 días con reincorporación gradual',
    fecha_programada: in48Hours,
    estado: 'programada',
    created_at: now.toISOString(),
  },
  {
    id: MOCK_CIRUGIA_B_ID,
    paciente_id: MOCK_PACIENTE_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    nombre_sencillo: 'Reemplazo total de cadera con prótesis',
    especialidad: 'Ortopedia y Traumatología',
    duracion_estimada: '60 a 90 minutos',
    tipo_anestesia: 'Anestesia Regional (Raquídea/Epidural) + Sedación Suave',
    sensacion_anestesia: 'Adormecimiento completo de la mitad inferior de tu cuerpo con una agradable sensación de descanso y tranquilidad sin dolor.',
    tiempo_recuperacion: '48 a 72 horas de hospitalización',
    tiempo_recuperacion_sala: '2 a 3 horas en Sala de Recuperación (URPA)',
    dias_incapacidad_estimados: '30 a 45 días con fisioterapia progresiva y movilización asistida',
    fecha_programada: in6Hours,
    estado: 'en_preparacion',
    created_at: now.toISOString(),
  }
];

export const initialMockPautas: Pauta[] = [
  // Pautas Carlos Mendoza (Apendicectomía Laparoscópica en 48h)
  {
    id: 'pauta-a-1',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    titulo: 'Suspensión o Ajuste de Fármacos y Anticoagulantes',
    descripcion: 'Suspender o ajustar antiinflamatorios (ibuprofeno, aspirina) y anticoagulantes según orden médica previa para evitar riesgo de sangrado.',
    horas_previas: 24,
    es_critica: true,
    fecha_limite: new Date(new Date(in48Hours).getTime() - 24 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-a-2',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    titulo: 'Ducha Corporal Antiséptica y Limpieza Umbilical',
    descripcion: 'Ducha corporal con jabón antiséptico (o jabón neutro), con énfasis en la limpieza suave del área umbilical (ombligo) y abdomen, secando con toalla limpia.',
    horas_previas: 12,
    es_critica: false,
    fecha_limite: new Date(new Date(in48Hours).getTime() - 12 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-a-3',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    titulo: 'Ayuno Absoluto de Sólidos (CRÍTICO)',
    descripcion: 'Ayuno absoluto de sólidos: no ingerir carnes, harinas, grasas ni alimentos pesados para garantizar estómago vacío durante la intubación.',
    horas_previas: 8,
    es_critica: true,
    fecha_limite: new Date(new Date(in48Hours).getTime() - 8 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-a-4',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    titulo: 'Ayuno Estricto de Líquidos Claros (CRÍTICO)',
    descripcion: 'Ayuno estricto de líquidos: prohibido agua, té, jugos, café, leche o chicles para prevenir broncoaspiración durante la intubación anestésica.',
    horas_previas: 2,
    es_critica: true,
    fecha_limite: new Date(new Date(in48Hours).getTime() - 2 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-a-5',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    titulo: 'Retiro de Esmaltes, Piercings y Joyas',
    descripcion: 'Retiro de esmaltes de uñas (para permitir la lectura del oxímetro de pulso), piercings, joyas, maquillaje y prótesis dentales removibles antes de ingresar.',
    horas_previas: 2,
    es_critica: true,
    fecha_limite: new Date(new Date(in48Hours).getTime() - 2 * 3600 * 1000).toISOString(),
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
    fecha_respuesta: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
    observaciones: 'Medicamentos suspendidos según indicación previa.',
    updated_at: now.toISOString(),
  },
  {
    id: 'check-a-2',
    pauta_id: 'pauta-a-2',
    estado: 'completado',
    fecha_respuesta: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    observaciones: 'Ducha realizada con énfasis en la zona umbilical.',
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
    id: 'check-a-5',
    pauta_id: 'pauta-a-5',
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
    mensaje: 'Paciente con check-ins prequirúrgicos al día para Apendicectomía Laparoscópica en 48h con preparación óptima.',
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
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'tecnica_quirurgica',
    tipo_recurso: 'video',
    titulo: '¿Cómo funciona la Cirugía Laparoscópica de Apéndice?',
    descripcion_corta: 'Conoce en 3 minutos la técnica de mínima invasión mediante 3 pequeñas incisiones y microcámara para extraer el apéndice sin dolor excesivo.',
    contenido_markdown: `### ¿Qué es una Apendicectomía Laparoscópica?
Es la extirpación quirúrgica del **apéndice cecal inflamado** mediante una técnica de **mínima invasión**. En lugar de un corte abierto tradicional, el cirujano utiliza una microcámara (laparoscopio) e instrumentos milimétricos.

#### ¿Cómo se realiza la intervención?
1. **3 incisiones milimétricas:** Una incisión diminuta en el ombligo (para la microcámara HD) y dos en la parte inferior del abdomen (de 5 a 10 mm) para instrumentos de máxima precisión.
2. **Visualización en alta definición:** La microcámara ilumina y amplifica la cavidad abdominal en un monitor quirúrgico especializado.
3. **Extracción segura:** El apéndice inflamado se aísla, se sella en su base y se extrae dentro de una pequeña bolsa estéril protectora, lavando suavemente la zona.

#### Beneficios clave para ti:
- **Menor dolor posoperatorio:** Al no seccionar grandes masas musculares, el dolor es mínimo y controlable con analgésicos suaves.
- **Rápida recuperación:** Podrás incorporarte y caminar el mismo día de la intervención.
- **Cicatrices casi invisibles:** Incisiones milimétricas que cicatrizan en pocas semanas dejando marcas estéticas mínimas.`,
    url_recurso: '/videos/cirugia-apendice.mp4',
    orden_visualizacion: 1,
    created_at: now.toISOString()
  },
  // INFOGRAFÍA ANATÓMICA
  {
    id: 'mat-2',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'tecnica_quirurgica',
    tipo_recurso: 'infografia',
    titulo: 'Anatomía del Apéndice y los 3 Puertos de Mínima Invasión',
    descripcion_corta: 'Guía visual ilustrada que muestra la ubicación del apéndice en la fosa ilíaca derecha y los 3 diminutos accesos milimétricos.',
    contenido_markdown: `### ¿Dónde está el apéndice y qué función cumple?
El apéndice cecal es un pequeño conducto cilíndrico conectado al inicio del intestino grueso, localizado en la parte inferior derecha del abdomen (fosa ilíaca derecha).

#### Tu cuerpo sin apéndice:
El apéndice no es un órgano vital. Su extracción no altera en absoluto la absorción de nutrientes, la digestión de alimentos ni el tránsito intestinal regular.

#### Ubicación de los 3 puertos laparoscópicos:
1. **Puerto Umbilical (10 mm):** Permite el paso de la microcámara óptica. Queda camuflado en el pliegue natural del ombligo.
2. **Puerto Suprapúbico (5 mm):** Ubicado en la línea baja del abdomen (zona del vello púbico).
3. **Puerto Fosa Ilíaca Izquierda (5 mm):** Punto de trabajo delicado para movilizar y sellar los vasos del apéndice con pinzas milimétricas.`,
    url_recurso: '/images/infografia-apendice.png',
    orden_visualizacion: 2,
    created_at: now.toISOString()
  },
  // EL RECORRIDO DE TU CIRUGÍA (5 PASOS)
  {
    id: 'mat-rec-1',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '1. Admisión Hospitalaria y Registro',
    descripcion_corta: 'Llegada 2 horas antes con tu acompañante para validación documental y consentimiento.',
    contenido_markdown: 'Llegas a la clínica 2 horas antes de la cirugía con tu acompañante. En admisión validan tu documento de identidad original, orden médica y resultados prequirúrgicos impresos. El personal verifica el estricto cumplimiento del ayuno y te coloca tu brazalete de identificación clínica.',
    url_recurso: null,
    orden_visualizacion: 10,
    created_at: now.toISOString()
  },
  {
    id: 'mat-rec-2',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '2. Preparación Preanestésica y Vía Intravenosa',
    descripcion_corta: 'Cambio a bata quirúrgica y canalización suave de vía venosa en el brazo.',
    contenido_markdown: 'Pasas al área de vestier para colocarte la bata quirúrgica limpia y gorro desechable. La enfermera canaliza una pequeña vía intravenosa en tu antebrazo con una aguja fina para suero hidratante y protectores gástricos. Conocerás a tu anestesiólogo, quien revisará tus signos vitales y despejará cualquier inquietud.',
    url_recurso: null,
    orden_visualizacion: 11,
    created_at: now.toISOString()
  },
  {
    id: 'mat-rec-3',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '3. Paso a Quirófano y Anestesia General',
    descripcion_corta: 'Entorno quirúrgico climatizado, monitorización continua y sueño profundo sin dolor.',
    contenido_markdown: 'Ingresas a la sala quirúrgica estéril. El equipo asistencial se presenta. Te colocarán parches adhesivos para registrar tu pulso y ritmo cardíaco de forma continua. El anestesiólogo te administrará una medicación relajante suave por la vía y una mascarilla de oxígeno: te quedarás plácidamente dormido en segundos.',
    url_recurso: null,
    orden_visualizacion: 12,
    created_at: now.toISOString()
  },
  {
    id: 'mat-rec-4',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '4. Sala de Recuperación Postanestésica (URPA)',
    descripcion_corta: 'Despertar cálido con mantas térmicas, oxigenación y analgesia inmediata.',
    contenido_markdown: 'Despertarás abrigado con mantas térmicas confortables. Una enfermera especializada estará a tu lado vigilando tus signos vitales y oxigenación. Si sientes alguna molestia abdominal o tirantez, te administrará analgésicos intravenosos inmediatos para garantizar tu confort.',
    url_recurso: null,
    orden_visualizacion: 13,
    created_at: now.toISOString()
  },
  {
    id: 'mat-rec-5',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '5. Criterios de Alta y Retorno Seguro a Casa',
    descripcion_corta: 'Tolerancia de líquidos orales, micción espontánea y alta con acompañante.',
    contenido_markdown: 'Una vez toleres líquidos suaves por vía oral (agua o aromática), orines de forma espontánea y puedas levantarte a caminar asistido sin mareos, el cirujano firmará el alta hospitalaria con la fórmula de analgésicos y la guía de cuidados para casa.',
    url_recurso: null,
    orden_visualizacion: 14,
    created_at: now.toISOString()
  },
  // CHECKLIST MALETA
  {
    id: 'mat-3',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'guia_maleta',
    tipo_recurso: 'articulo',
    titulo: 'Checklist: ¿Qué empacar en tu maleta prequirúrgica?',
    descripcion_corta: 'Lista práctica de documentos, ropa holgada que no presione el abdomen bajo y artículos indispensables.',
    contenido_markdown: `### Documentación Indispensable
- [ ] Documento de identidad original (Cédula de Ciudadanía, extranjería o pasaporte).
- [ ] Orden médica quirúrgica y autorización vigente de tu EPS o póliza de salud.
- [ ] Resultados físicos recientes de analítica de sangre y electrocardiograma.

### Ropa y Confort Abdominal
- [ ] Ropa muy holgada y cómoda (preferiblemente pantalones deportivos con pretina o elástico muy suave que **no presione el bajo abdomen ni las incisiones**, o vestido amplio).
- [ ] Calzado plano, cerrado y con suela de goma antideslizante.
- [ ] Muda de ropa interior holgada 100% de algodón.
- [ ] Cargador de teléfono móvil con cable largo para tu estancia de observación.

### ❌ DEJA OBLIGATORIAMENTE EN CASA:
- ❌ Joyas, anillos, aretes o cadenas (riesgo de quemadura por electrobisturí).
- ❌ Esmalte en uñas de manos y pies (el oxímetro de pulso requiere uña limpia).
- ❌ Lentes de contacto (usa tus gafas de marco habituales).
- ❌ Prótesis dentales removibles o piercings (deben retirarse antes de ingresar).
- ❌ Grandes sumas de dinero o artículos de alto valor.`,
    url_recurso: null,
    orden_visualizacion: 20,
    created_at: now.toISOString()
  },
  // PREGUNTAS FRECUENTES (FAQS)
  {
    id: 'mat-faq-1',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Sentiré dolor después de la cirugía y qué es el dolor en el hombro?',
    descripcion_corta: 'Manejo analgésico intravenoso y explicación de la molestia por gas CO2.',
    contenido_markdown: 'Durante la intervención NO sentirás ningún dolor por efecto de la anestesia general. En la sala de recuperación y en casa recibirás analgésicos programados por el equipo médico.\n\nEs muy frecuente y normal sentir una ligera molestia o pinchazo en el hombro derecho o cuello: esto se debe al gas (dióxido de carbono) utilizado para insuflar suavemente el abdomen durante la laparoscopia, el cual puede irritar de forma refleja el nervio frénico. Esta sensación desaparece por completo al caminar suavemente en 24 a 48 horas.',
    url_recurso: null,
    orden_visualizacion: 30,
    created_at: now.toISOString()
  },
  {
    id: 'mat-faq-2',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Cuánto tardaré en volver a mis actividades cotidianas y trabajo?',
    descripcion_corta: 'Tiempos de recuperación, caminata precoz y restricciones de esfuerzo físico.',
    contenido_markdown: 'Podrás levantarte y dar caminatas suaves dentro de tu hogar desde el primer día; caminar estimula la digestión y acelera la eliminación de gases.\n\nDurante las primeras 3 a 4 semanas está terminantemente prohibido levantar objetos de más de 5 kg, realizar abdominales o esfuerzos violentos para permitir que los pequeños puertos cicatricen con total solidez interna. La mayoría de los pacientes se reincorporan a labores de oficina o estudio entre los 7 y 15 días.',
    url_recurso: null,
    orden_visualizacion: 31,
    created_at: now.toISOString()
  },
  {
    id: 'mat-faq-3',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Por qué son tan estrictas las horas de ayuno de sólidos y líquidos?',
    descripcion_corta: 'Seguridad de la vía respiratoria y prevención de complicaciones anestésicas.',
    contenido_markdown: 'El ayuno de sólidos (8 horas) y líquidos claros (2 horas) asegura que tu estómago esté completamente desocupado. Al recibir anestesia general, los reflejos que protegen tu garganta y pulmones se desactivan temporalmente.\n\nTener el estómago vacío impide que jugos gástricos o residuos de comida asciendan a los pulmones (broncoaspiración). ¡Cumplir este ayuno con exactitud es la regla de oro para tu seguridad!',
    url_recurso: null,
    orden_visualizacion: 32,
    created_at: now.toISOString()
  },
  {
    id: 'mat-faq-4',
    cirugia_id: MOCK_CIRUGIA_A_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Qué señales de alarma debo vigilar antes de ingresar a cirugía?',
    descripcion_corta: 'Identificación inmediata de complicaciones o sospecha de perforación.',
    contenido_markdown: 'Si antes de ingresar al hospital presentas fiebre superior a 38.5°C, escalofríos intensos, vómitos repetitivos o un dolor abdominal punzante e insoportable en el lado inferior derecho (fosa ilíaca derecha) que empeora al toser o moverse, debes acudir de inmediato a Urgencias de la clínica para descartar una perforación del apéndice o peritonitis.',
    url_recurso: null,
    orden_visualizacion: 33,
    created_at: now.toISOString()
  },
  // =========================================================================
  // MATERIALES EDUCATIVOS: ARTROPLASTIA TOTAL DE CADERA (Elena Restrepo)
  // =========================================================================
  // VIDEO DIDÁCTICO CADERA
  {
    id: 'mat-cad-1',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'tecnica_quirurgica',
    tipo_recurso: 'video',
    titulo: 'Cápsula Audiovisual Breve: ¿Cómo funciona el Reemplazo Articular de Cadera?',
    descripcion_corta: 'Conoce en 3 minutos el proceso de sustitución del cartílago desgastado por una prótesis biocompatible diseñada para devolver la movilidad natural sin dolor.',
    contenido_markdown: `### ¿Qué es una Artroplastia Total de Cadera?
Es el procedimiento quirúrgico en el que se sustituye la articulación dañada por la artrosis por componentes protésicos biocompatibles de alta resistencia.

#### ¿Cómo se realiza la intervención?
1. **Preparación y retiro de cartílago desgastado:** Limpieza del acetábulo pélvico y corte milimétrico de la cabeza femoral dañada para recibir los implantes sin fricción dolorosa.
2. **Fijación de componentes protésicos (vástago y copa):** Colocación de la copa acetabular biocompatible en la pelvis y del vástago de titanio en el canal del fémur para máxima estabilidad ósea.
3. **Colocación de esfera articular y comprobación de movilidad:** Inserción de la cabeza esférica pulida, reducción articular y verificación de rangos completos de movimiento sin roce ni dolor.

#### Beneficios clave para ti:
- **Alivio inmediato del dolor por artrosis:** Desaparición del dolor de choque hueso contra hueso.
- **Movilización precoz asistida:** Primeros pasos con andador desde las primeras 24 horas.
- **Calidad de vida y autonomía:** Recuperación de la marcha fluida y descanso nocturno continuo.`,
    url_recurso: '/videos/cirugia-cadera.mp4',
    orden_visualizacion: 1,
    created_at: now.toISOString()
  },
  // INFOGRAFÍA ANATÓMICA Y PRÓTESIS CADERA
  {
    id: 'mat-cad-2',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'tecnica_quirurgica',
    tipo_recurso: 'infografia',
    titulo: 'Anatomía Articular y Componentes de la Nueva Prótesis',
    descripcion_corta: 'Guía visual detallada sobre el desgaste del cartílago por artrosis y los componentes biocompatibles de la prótesis total de cadera.',
    contenido_markdown: `### Anatomía de la Cadera y Desgaste por Artrosis
La articulación coxofemoral conecta el fémur con la pelvis. Cuando el cartílago se erosiona, el roce óseo produce dolor agudo e incapacidad funcional.

#### Los 3 Componentes Clave de la Prótesis:
1. **Copa Acetabular (Pelvis):** Fijada en la cavidad pélvica con un inserto de deslizamiento ultrasuave (cerámica o polietileno de alta densidad).
2. **Cabeza Protésica Esférica:** Esfera pulida a espejo que reproduce la anatomía articular con mínima fricción.
3. **Vástago Femoral de Titanio:** Anclaje anatómico de alta solidez insertado en el canal del fémur.

#### Pautas de Protección y Prevención de Luxación:
- Evitar flexiones de cadera superiores a 90 grados y no cruzar las piernas en tijera.
- Uso temporal de calzador largo y asiento elevado en el inodoro para evitar agacharse en exceso.`,
    url_recurso: '/images/infografia-cadera.png',
    orden_visualizacion: 2,
    created_at: now.toISOString()
  },
  // RECORRIDO DE LA CIRUGÍA (5 PASOS)
  {
    id: 'mat-cad-rec-1',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '1. Admisión Hospitalaria y Verificación Previa',
    descripcion_corta: 'Llegada 2 horas antes con tu acompañante para registro, validación y consentimiento.',
    contenido_markdown: 'Llegas a la clínica 2 horas antes de la cirugía con tu acompañante. En admisión validan tu documento de identidad, órdenes médicas, valoraciones preanestésicas y radiografías. El personal corrobora el cumplimiento estricto del ayuno y te coloca tu brazalete de identificación clínica.',
    url_recurso: null,
    orden_visualizacion: 10,
    created_at: now.toISOString()
  },
  {
    id: 'mat-cad-rec-2',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '2. Preparación Preanestésica y Vía Intravenosa',
    descripcion_corta: 'Colocación de bata, canalización venosa y profilaxis antibiótica.',
    contenido_markdown: 'Pasas al área prequirúrgica para cambiarte a la bata hospitalaria limpia. La enfermera canaliza una vía intravenosa para hidratación, profilaxis antibiótica y medicación protectora. El anestesiólogo revisa tus signos vitales y te explica la anestesia raquídea o regional.',
    url_recurso: null,
    orden_visualizacion: 11,
    created_at: now.toISOString()
  },
  {
    id: 'mat-cad-rec-3',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '3. Quirófano y Anestesia Regional con Sedación',
    descripcion_corta: 'Procedimiento sin dolor con adormecimiento de la mitad inferior y sedación suave.',
    contenido_markdown: 'Ingresas a la sala quirúrgica estéril y climatizada. Se administra la anestesia raquídea o epidural en la espalda para adormecer completamente tus piernas, complementada con una sedación suave y relajante. El cirujano ortopedista retira las superficies dañadas, implanta la prótesis y comprueba los arcos de movilidad.',
    url_recurso: null,
    orden_visualizacion: 12,
    created_at: now.toISOString()
  },
  {
    id: 'mat-cad-rec-4',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '4. Sala de Recuperación Postanestésica (URPA)',
    descripcion_corta: 'Control del dolor, mantas térmicas y verificación de retorno sensitivo.',
    contenido_markdown: 'Despertarás cómodo con mantas térmicas y monitoreo constante de tensión arterial y pulso. Se administra analgesia intravenosa continua para evitar molestias articulares. El equipo confirma la movilidad de los dedos de tus pies antes de trasladarte a tu habitación.',
    url_recurso: null,
    orden_visualizacion: 13,
    created_at: now.toISOString()
  },
  {
    id: 'mat-cad-rec-5',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'recorrido',
    tipo_recurso: 'articulo',
    titulo: '5. Movilización Precoz Asistida y Criterios de Alta',
    descripcion_corta: 'Primeros pasos con andador en las primeras 24 horas y retorno seguro.',
    contenido_markdown: 'En las primeras 24 horas, el fisioterapeuta te asistirá para dar los primeros pasos con andador o bastón. Tras 48 a 72 horas de hospitalización y buena evolución de la herida, el equipo ortopédico firmará el alta con las pautas de prevención de luxación y tu plan de fisioterapia domiciliaria.',
    url_recurso: null,
    orden_visualizacion: 14,
    created_at: now.toISOString()
  },
  // CHECKLIST MALETA CADERA
  {
    id: 'mat-cad-3',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'guia_maleta',
    tipo_recurso: 'articulo',
    titulo: 'Checklist: ¿Qué empacar en tu maleta prequirúrgica (Cadera)?',
    descripcion_corta: 'Documentos, ropa muy holgada que no presione la cadera, calzador largo y ayudas de marcha.',
    contenido_markdown: `### Documentación Indispensable
- [ ] Documento de identidad original (Cédula o pasaporte).
- [ ] Orden médica quirúrgica, autorización de EPS y consentimiento informado firmado.
- [ ] Radiografías impresas o estudios de cadera previos y analítica de sangre.

### Ropa y Confort para Movilidad
- [ ] Ropa muy holgada y fácil de poner (pantalones anchos deportivos o batas que no requieran flexionar la cadera para vestirse).
- [ ] Calzado plano, cerrado, antideslizante y sin cordones (tipo slip-on).
- [ ] Calzador de mango largo para ponerte los zapatos sin doblar la cintura.
- [ ] Andador o bastones canadienses coordinados para el momento del alta.
- [ ] Artículos de aseo personal básicos en neceser pequeño.

### ❌ DEJA OBLIGATORIAMENTE EN CASA:
- ❌ Joyas, pulseras, anillos o cadenas metálicas.
- ❌ Esmalte de uñas en manos y pies.
- ❌ Objetos de alto valor o sumas elevadas de dinero.`,
    url_recurso: null,
    orden_visualizacion: 20,
    created_at: now.toISOString()
  },
  // FAQS CADERA
  {
    id: 'mat-cad-faq-1',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Sentiré dolor durante o después de la cirugía de cadera?',
    descripcion_corta: 'Control anestésico y alivio definitivo del dolor por artrosis.',
    contenido_markdown: 'Durante la cirugía no sentirás ningún dolor gracias a la anestesia regional (raquídea/epidural) y la sedación suave. Al despertar, contarás con un esquema de analgesia intravenosa continua.\\n\\nNotarás una gran mejoría: el dolor punzante y constante de la artrosis desaparece de inmediato al haber retirado las superficies de roce óseo.',
    url_recurso: null,
    orden_visualizacion: 30,
    created_at: now.toISOString()
  },
  {
    id: 'mat-cad-faq-2',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Cómo prevengo una luxación de la prótesis en mi hogar?',
    descripcion_corta: 'Reglas de oro durante las primeras 6 a 8 semanas.',
    contenido_markdown: 'Para asegurar que la prótesis cicatrice firme en su cápsula articular:\\n1. **No flexiones la cadera más de 90°:** No te agaches al suelo ni acerques las rodillas al pecho.\\n2. **No cruces las piernas en tijera:** Mantén las piernas separadas al sentarte y al dormir (puedes usar un cojín entre las piernas).\\n3. **Usa asiento elevado de inodoro y calzador largo:** Evitan sentarte en superficies muy bajas.',
    url_recurso: null,
    orden_visualizacion: 31,
    created_at: now.toISOString()
  },
  {
    id: 'mat-cad-faq-3',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Cuándo podré levantarme y apoyar la pierna operada?',
    descripcion_corta: 'Movilización precoz desde las primeras 24 horas.',
    contenido_markdown: 'El protocolo moderno estimula la deambulación asistida desde las primeras 24 horas. Guiado por el equipo de fisioterapia, te pondrás de pie y darás pasos con un andador o bastón canadiense. La movilización precoz activa la circulación, evita trombos venosos y acelera tu recuperación.',
    url_recurso: null,
    orden_visualizacion: 32,
    created_at: now.toISOString()
  },
  {
    id: 'mat-cad-faq-4',
    cirugia_id: MOCK_CIRUGIA_B_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    categoria: 'faq',
    tipo_recurso: 'articulo',
    titulo: '¿Qué signos de alarma debo reportar de urgencia?',
    descripcion_corta: 'Identificación de luxación, trombosis o infección.',
    contenido_markdown: 'Debes consultar de urgencias si presentas:\\n- Dolor agudo y súbito en la cadera con imposibilidad de apoyar o si notas que la pierna operada se ve más corta o girada hacia afuera (sospecha de luxación).\\n- Dolor punzante o hinchazón intensa en la pantorrilla (sospecha de trombosis venosa).\\n- Fiebre superior a 38°C o secreción purulenta en la herida quirúrgica.',
    url_recurso: null,
    orden_visualizacion: 33,
    created_at: now.toISOString()
  }
];
