import type {
  Paciente,
  Cirugia,
  Pauta,
  Checkin,
  Alerta,
  MaterialEducativo,
  PersonalClinico,
  CatalogoCirugia,
  NivelAnsiedad,
} from '../types/database.types';

// IDs fijos para consistencia en modo demo
export const MOCK_PACIENTE_A_ID = '11111111-1111-4111-a111-111111111111';
export const MOCK_CIRUGIA_A_ID = '22222222-2222-4222-a222-222222222222';

export const MOCK_PACIENTE_B_ID = '33333333-3333-4333-b333-333333333333';
export const MOCK_CIRUGIA_B_ID = '44444444-4444-4444-b444-444444444444';

export const MOCK_PACIENTE_C_ID = '55555555-5555-4555-c555-555555555555';
export const MOCK_CIRUGIA_C_ID = '66666666-6666-4666-c666-666666666666';

export const MOCK_PACIENTE_D_ID = '77777777-7777-4777-d777-777777777777';
export const MOCK_CIRUGIA_D_ID = '88888888-8888-4888-d888-888888888888';

export const MOCK_PACIENTE_E_ID = '99999999-9999-4999-e999-999999999999';
export const MOCK_CIRUGIA_E_ID = 'aaaaaaaa-aaaa-4aaa-eaaa-aaaaaaaaaaaa';

export const CATALOGO_APENDICE_ID = 'cat-apendicectomia-lap';
export const CATALOGO_CADERA_ID = 'cat-artroplastia-cadera';
export const CATALOGO_COLECISTECTOMIA_ID = 'cat-colecistectomia-lap';
export const CATALOGO_HERNIA_ID = 'cat-herniorrafia-inguinal';

// Fechas dinámicas calculadas al momento de carga
const now = new Date();
const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
const in6Hours = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
const in72Hours = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
const in36Hours = new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString();

export const initialCatalogoCirugias: CatalogoCirugia[] = [
  {
    id: CATALOGO_APENDICE_ID,
    codigo_base: 'PROT-APEN-01',
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    nombre_sencillo: 'Cirugía de apéndice por mínima invasión (3 puertos)',
    especialidad: 'Cirugía General',
    tipo_anestesia: 'Anestesia General Balanceada',
    sensacion_anestesia:
      'Sentirás una suave calidez en el brazo y te quedarás plácidamente dormido en segundos sin sentir dolor alguno.',
    duracion_estimada: '45 a 60 minutos',
    tiempo_recuperacion: '24 a 48 horas de estancia ambulatoria / observación',
    tiempo_recuperacion_sala: '1 a 2 horas en Sala de Recuperación (URPA)',
    dias_incapacidad_estimados: '7 a 12 días con reincorporación gradual',
    horas_ayuno_solidos: 8,
    descripcion_ayuno_solidos:
      'Cero alimentos sólidos, lácteos, jugos con pulpa ni café con leche. El estómago debe estar completamente vacío para una inducción anestésica segura.',
    horas_ayuno_liquidos: 2,
    descripcion_ayuno_liquidos:
      'Suspender absolutamente el consumo de agua, aromáticas o cualquier líquido por vía oral.',
    incluir_suspension_farmacos: true,
    horas_suspension_farmacos: 24,
    detalle_farmacos_base:
      'Suspender antiinflamatorios (ibuprofeno, naproxeno, aspirina) y anticoagulantes según orden médica previa para evitar riesgo de sangrado.',
    incluir_ducha_antiseptica: true,
    horas_ducha_antiseptica: 12,
    descripcion_ducha_antiseptica:
      'Realizar baño corporal completo con jabón de clorhexidina, haciendo énfasis especial en el ombligo y la zona abdominal inferior derecha.',
    pauta_especifica_titulo: 'Vigilancia de Signos de Alarma (Fiebre o Dolor Intenso)',
    pauta_especifica_descripcion:
      'Reportar de inmediato si presenta fiebre >38°C o dolor abdominal punzante súbito antes del ingreso para descartar perforación.',
    pauta_especifica_horas: 6,
    video_url: '/videos/cirugia-apendice.mp4',
    video_titulo: 'Cápsula Educativa: ¿Cómo se realiza tu Apendicectomía Laparoscópica?',
    video_descripcion:
      'Recorrido visual paso a paso sobre la extracción segura del apéndice mediante 3 microincisiones milimétricas guiadas por cámara de alta definición.',
    infografia_url: '/images/infografia-apendice.png',
    infografia_titulo: 'Infografía Anatómica: Técnica de 3 Puertos y Recuperación Temprana',
    infografia_descripcion:
      'Esquema ilustrado de los 3 puertos laparoscópicos (umbilical y suprapúbicos), insuflación suave con gas CO₂ medicinal y rápida cicatrización.',
    explicacion_sofi:
      'Explica el proceso en lenguaje cotidiano, destacando que el equipo médico estará a su lado monitoreando cada segundo, que estará bajo anestesia general sin sentir dolor, y que se extrae el apéndice inflamado mediante 3 incisiones milimétricas (una en el ombligo y dos en el bajo abdomen) con microcámara para una recuperación rápida con mínimo dolor muscular.',
    cuidados_especificos_sofi:
      'Si el paciente menciona fiebre superior a 38.5°C o dolor abdominal punzante insoportable en el lado inferior derecho previo al ingreso, ordénale de inmediato acudir a Urgencias para descartar perforación del apéndice o peritonitis. En el posoperatorio, recuérdale caminar suave y que una molestia leve en el hombro por el gas CO₂ es normal y desaparece en 24-48h.',
    created_at: now.toISOString(),
  },
  {
    id: CATALOGO_CADERA_ID,
    codigo_base: 'PROT-CAD-02',
    tipo_cirugia: 'Artroplastia Total de Cadera',
    nombre_sencillo: 'Reemplazo articular total de cadera con prótesis biocompatible',
    especialidad: 'Ortopedia y Traumatología',
    tipo_anestesia: 'Anestesia Regional (Raquídea/Epidural) + Sedación Consciente',
    sensacion_anestesia:
      'Adormecimiento completo de la mitad inferior de tu cuerpo con una agradable sensación de descanso tranquilo sin dolor.',
    duracion_estimada: '60 a 90 minutos',
    tiempo_recuperacion: '48 a 72 horas de hospitalización y rehabilitación asistida',
    tiempo_recuperacion_sala: '2 a 3 horas en Sala de Recuperación (URPA)',
    dias_incapacidad_estimados: '30 a 45 días con fisioterapia progresiva y apoyo en caminador',
    horas_ayuno_solidos: 8,
    descripcion_ayuno_solidos:
      'Suspender por completo alimentos sólidos, caldos con grasa, lácteos y bebidas oscuras al menos 8 horas antes.',
    horas_ayuno_liquidos: 2,
    descripcion_ayuno_liquidos:
      'No ingerir ni una gota de agua, infusiones ni caramelos durante las últimas 2 horas previas a quirófano.',
    incluir_suspension_farmacos: true,
    horas_suspension_farmacos: 48,
    detalle_farmacos_base:
      'Suspender anticoagulantes, aspirina y antiinflamatorios 48h antes según esquema de anestesiología para profilaxis de hematoma espinal y sangrado.',
    incluir_ducha_antiseptica: true,
    horas_ducha_antiseptica: 12,
    descripcion_ducha_antiseptica:
      'Higiene corporal rigurosa con jabón quirúrgico de clorhexidina desde la cintura hasta los pies, enfatizando cadera, ingle y muslo.',
    pauta_especifica_titulo: 'Alistamiento de Caminador / Bastón y Adecuación del Hogar',
    pauta_especifica_descripcion:
      'Tener listo el caminador ortopédico para el alta, zapatos cerrados antideslizantes y retirar alfombras sueltas en casa.',
    pauta_especifica_horas: 24,
    video_url: '/videos/cirugia-cadera.mp4',
    video_titulo: 'Cápsula Educativa: ¿En qué consiste el Reemplazo Total de Cadera?',
    video_descripcion:
      'Animación biomecánica que muestra cómo se sustituye el cartílago desgastado por la artrosis mediante una copa acetabular y vástago de titanio.',
    infografia_url: '/images/infografia-cadera.png',
    infografia_titulo: 'Infografía Anatómica: Componentes Protésicos y Posturas Seguras',
    infografia_descripcion:
      'Guía visual de los 4 componentes biomecánicos de la prótesis y las reglas de oro posturales (no cruzar piernas y no flexionar más de 90°).',
    explicacion_sofi:
      'Explica en lenguaje cálido que bajo anestesia regional controlada con sedación suave no sentirá dolor en las piernas, y que se sustituye la superficie articular desgastada por la artrosis por una prótesis biocompatible (copa acetabular, inserto de polietileno, esfera pulida y vástago de titanio) que elimina el roce óseo doloroso y permite caminar con andador desde las primeras 24 horas.',
    cuidados_especificos_sofi:
      'Prevención estricta de luxación: Prohibido cruzar las piernas en tijera al sentarse o acostarse; evitar flexiones de cadera superiores a 90 grados; promover asiento elevado en inodoro y calzador largo. Si manifiesta dolor punzante en la pantorrilla con hinchazón (sospecha de trombosis) o rotación anormal de la pierna operada, acudir de inmediato a Urgencias.',
    created_at: now.toISOString(),
  },
  {
    id: CATALOGO_COLECISTECTOMIA_ID,
    codigo_base: 'PROT-COLE-03',
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    nombre_sencillo: 'Extracción de la vesícula biliar por videolaparoscopia',
    especialidad: 'Cirugía General y Digestiva',
    tipo_anestesia: 'Anestesia General Balanceada',
    sensacion_anestesia:
      'Te quedarás profundamente dormido en pocos segundos y despertarás cuando la cirugía haya concluido sin haber sentido dolor.',
    duracion_estimada: '60 a 75 minutos',
    tiempo_recuperacion: '24 horas de observación hospitalaria o alta ambulatoria',
    tiempo_recuperacion_sala: '1 a 2 horas en Sala de Recuperación (URPA)',
    dias_incapacidad_estimados: '8 a 14 días con dieta baja en grasas',
    horas_ayuno_solidos: 8,
    descripcion_ayuno_solidos:
      'Ayuno absoluto de alimentos sólidos, grasas y lácteos durante las 8 horas previas para mantener la vesícula en reposo.',
    horas_ayuno_liquidos: 2,
    descripcion_ayuno_liquidos:
      'Suspensión total de agua y líquidos claros 2 horas antes del procedimiento.',
    incluir_suspension_farmacos: true,
    horas_suspension_farmacos: 24,
    detalle_farmacos_base:
      'Suspender antiinflamatorios no esteroideos (AINEs) y suplementos herbales. Si toma antihipertensivos, consultar toma con sorbo mínimo de agua.',
    incluir_ducha_antiseptica: true,
    horas_ducha_antiseptica: 12,
    descripcion_ducha_antiseptica:
      'Baño general con jabón antiséptico haciendo énfasis en el abdomen superior derecho y la región umbilical.',
    pauta_especifica_titulo: 'Dieta Liviana Libre de Grasas el Día Previo',
    pauta_especifica_descripcion:
      'Durante las 24 horas previas al ayuno, evitar frituras, salsas, embutidos o lácteos enteros para prevenir cólicos biliares.',
    pauta_especifica_horas: 24,
    video_url: '/videos/cirugia-apendice.mp4',
    video_titulo: 'Cápsula Educativa: Cirugía Laparoscópica Abdominal por Mínima Invasión',
    video_descripcion:
      'Conoce cómo funciona el abordaje laparoscópico mediante microcámara de alta definición para extraer la vesícula con rápida recuperación.',
    infografia_url: '/images/infografia-apendice.png',
    infografia_titulo: 'Infografía: Abordaje Laparoscópico y Cuidados Digestivos',
    infografia_descripcion:
      'Ubicación de las pequeñas incisiones abdominales, beneficios del abordaje mínimamente invasivo y pautas de alimentación posoperatoria.',
    explicacion_sofi:
      'Explica con calidez que la extracción de la vesícula biliar se realiza por videolaparoscopia a través de pequeñas incisiones milimétricas bajo anestesia general segura, permitiendo que el hígado siga produciendo bilis normalmente para la digestión y logrando un retorno temprano a casa.',
    cuidados_especificos_sofi:
      'Vigilar signos de alarma previos como coloración amarilla en ojos/piel (ictericia), fiebre o dolor intenso en la boca del estómago. Recordar mantener dieta baja en grasas durante las primeras semanas posoperatorias.',
    created_at: now.toISOString(),
  },
  {
    id: CATALOGO_HERNIA_ID,
    codigo_base: 'PROT-HERN-04',
    tipo_cirugia: 'Herniorrafia Inguinal Laparoscópica con Malla',
    nombre_sencillo: 'Corrección de hernia inguinal con malla biocompatible',
    especialidad: 'Cirugía General y Pared Abdominal',
    tipo_anestesia: 'Anestesia General o Regional según valoración preanestésica',
    sensacion_anestesia:
      'Estarás completamente relajado y sin dolor durante toda la reparación de la pared abdominal.',
    duracion_estimada: '45 a 60 minutos',
    tiempo_recuperacion: 'Estancia ambulatoria (alta el mismo día tras 6-8 horas de observación)',
    tiempo_recuperacion_sala: '1 a 2 horas en Sala de Recuperación (URPA)',
    dias_incapacidad_estimados: '7 a 14 días (evitando alzar peso mayor a 5 kg por 4 semanas)',
    horas_ayuno_solidos: 8,
    descripcion_ayuno_solidos:
      'No consumir alimentos sólidos, lácteos ni bebidas espesas desde 8 horas antes de la hora programada.',
    horas_ayuno_liquidos: 2,
    descripcion_ayuno_liquidos:
      'Suspender agua y líquidos claros 2 horas antes del ingreso a cirugía.',
    incluir_suspension_farmacos: true,
    horas_suspension_farmacos: 24,
    detalle_farmacos_base:
      'Suspender aspirina, ibuprofeno y anticoagulantes según indicación médica para prevenir hematomas en la región inguinal.',
    incluir_ducha_antiseptica: true,
    horas_ducha_antiseptica: 12,
    descripcion_ducha_antiseptica:
      'Baño corporal completo con jabón de clorhexidina enfatizando ombligo y región inguinal (sin rasurar con cuchilla en casa).',
    pauta_especifica_titulo: 'Prohibición de Rasurado con Cuchilla en Casa',
    pauta_especifica_descripcion:
      'No afeitar la zona inguinal con cuchilla en casa para evitar microheridas que aumenten el riesgo de infección.',
    pauta_especifica_horas: 18,
    video_url: '/videos/cirugia-apendice.mp4',
    video_titulo: 'Cápsula Educativa: Reparación Laparoscópica de Pared Abdominal',
    video_descripcion:
      'Explicación clara sobre el refuerzo de la pared inguinal con malla ultraligera mediante mínima invasión.',
    infografia_url: '/images/infografia-apendice.png',
    infografia_titulo: 'Infografía: Refuerzo con Malla y Cuidados de Esfuerzo Físico',
    infografia_descripcion:
      'Ilustración de la reparación sin tensión y guía de reincorporación progresiva sin levantar objetos pesados.',
    explicacion_sofi:
      'Explica de manera sencilla que se refuerza el punto débil de la pared abdominal colocando una malla flexible biocompatible mediante mínimas incisiones, sin tensión muscular y con alta ambulatoria temprana.',
    cuidados_especificos_sofi:
      'Advertir que no debe rasurarse con cuchilla en casa antes de la cirugía. Si la hernia se torna dura, roja, no regresa a su sitio y produce dolor intenso o vómito (sospecha de estrangulamiento), acudir a Urgencias de inmediato.',
    created_at: now.toISOString(),
  },
];

export const initialMockPersonalClinico: (PersonalClinico & { password_Demo: string })[] = [
  {
    id: 'med-1111-2222',
    nombre_completo: 'Dr. Alejandro Ramírez',
    email: 'dr.ramirez@hospital.org',
    rol: 'Cirujano Jefe',
    especialidad: 'Cirugía General y Laparoscopia',
    password_Demo: 'Clinica2026*',
  },
  {
    id: 'med-3333-4444',
    nombre_completo: 'Dra. Sofía Valencia',
    email: 'dra.valencia@hospital.org',
    rol: 'Cirujana Ortopedista',
    especialidad: 'Ortopedia y Traumatología',
    password_Demo: 'Clinica2026*',
  },
  {
    id: 'med-5555-6666',
    nombre_completo: 'Jefe Laura Gómez',
    email: 'enfermeria@hospital.org',
    rol: 'Coordinadora Prequirúrgica',
    especialidad: 'Enfermería Quirúrgica',
    password_Demo: 'Clinica2026*',
  },
];

export const initialMockPacientes: Paciente[] = [
  {
    id: MOCK_PACIENTE_A_ID,
    nombre_completo: 'Gerardo Andrés Martínez',
    documento: '1020304050',
    telefono: '+57 300 123 4567',
    edad: 58,
    contacto_emergencia: 'Camila Martínez (Hija) - 301 987 6543',
    email: 'gerardo.martinez@ejemplo.com',
    pin_acceso: '1234',
    grupo_sanguineo: 'O+',
    peso_kg: 78,
    talla_cm: 172,
    alergias: 'Ninguna conocida',
    comorbilidades: ['Hipertensión Arterial (HTA)'],
    medicacion_habitual: 'Losartán 50mg cada 12 horas',
    nivel_ansiedad: 'moderada',
    created_at: now.toISOString(),
  },
  {
    id: MOCK_PACIENTE_B_ID,
    nombre_completo: 'Luisa Castro',
    documento: '9876543210',
    telefono: '+57 312 456 7890',
    edad: 67,
    contacto_emergencia: 'Alonso Rodríguez (Esposo) - 315 222 3344',
    email: 'luisa.castro@ejemplo.com',
    pin_acceso: '5678',
    grupo_sanguineo: 'A+',
    peso_kg: 65,
    talla_cm: 160,
    alergias: 'Alergia leve a Penicilina',
    comorbilidades: ['Artrosis Severa de Cadera', 'Hipertensión Arterial (HTA)'],
    medicacion_habitual: 'Amlodipino 5mg diario, Acetaminofén condicional',
    nivel_ansiedad: 'alta',
    created_at: now.toISOString(),
  },
  {
    id: MOCK_PACIENTE_C_ID,
    nombre_completo: 'Samuel Ramírez',
    documento: '1030405060',
    telefono: '+57 310 987 6543',
    edad: 54,
    contacto_emergencia: 'Carolina Ramírez (Esposa) - 312 876 5432',
    email: 'samuel.ramirez@ejemplo.com',
    pin_acceso: '2468',
    grupo_sanguineo: 'O+',
    peso_kg: 76,
    talla_cm: 170,
    alergias: 'Ninguna conocida',
    comorbilidades: ['Dislipidemia', 'Gastritis leve'],
    medicacion_habitual: 'Atorvastatina 20mg noche',
    nivel_ansiedad: 'moderada',
    created_at: now.toISOString(),
  },
  {
    id: MOCK_PACIENTE_D_ID,
    nombre_completo: 'Alonso Rodríguez',
    documento: '1040506070',
    telefono: '+57 314 333 4455',
    edad: 62,
    contacto_emergencia: 'Paola Rodríguez (Hija) - 320 123 4567',
    email: 'alonso.rodriguez@ejemplo.com',
    pin_acceso: '1357',
    grupo_sanguineo: 'B+',
    peso_kg: 81,
    talla_cm: 175,
    alergias: 'Ninguna conocida',
    comorbilidades: ['Hipertensión Arterial'],
    medicacion_habitual: 'Enalapril 10mg diario',
    nivel_ansiedad: 'baja',
    created_at: now.toISOString(),
  },
  {
    id: MOCK_PACIENTE_E_ID,
    nombre_completo: 'Luis Solarte',
    documento: '1050607080',
    telefono: '+57 318 444 3322',
    edad: 49,
    contacto_emergencia: 'Diana Solarte (Hermana) - 317 654 3210',
    email: 'luis.solarte@ejemplo.com',
    pin_acceso: '9012',
    grupo_sanguineo: 'A+',
    peso_kg: 72,
    talla_cm: 168,
    alergias: 'Ninguna conocida',
    comorbilidades: [],
    medicacion_habitual: 'Ninguna',
    nivel_ansiedad: 'moderada',
    created_at: now.toISOString(),
  },
];

export const initialMockCirugias: Cirugia[] = [
  {
    id: MOCK_CIRUGIA_A_ID,
    paciente_id: MOCK_PACIENTE_A_ID,
    catalogo_cirugia_id: CATALOGO_APENDICE_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    codigo_cirugia: 'CIR-2026-A',
    medico_tratante: 'Dr. Alejandro Ramírez',
    notas_medicas: 'Paciente hipertenso controlado con Losartán 50mg. Autorizado tomar su dosis matutina con un sorbo mínimo de agua 3 horas antes del ingreso. Reforzar tranquilidad sobre la anestesia general.',
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
    catalogo_cirugia_id: CATALOGO_CADERA_ID,
    tipo_cirugia: 'Artroplastia Total de Cadera',
    codigo_cirugia: 'CIR-2026-B',
    medico_tratante: 'Dra. Sofía Valencia',
    notas_medicas: 'Paciente con artrosis severa bilateral y alergia a Penicilina (usar profilaxis antibiótica alternativa). Prioridad en educación temprana sobre uso de caminador y prohibición de cruzar las piernas.',
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
  },
  {
    id: MOCK_CIRUGIA_C_ID,
    paciente_id: MOCK_PACIENTE_C_ID,
    catalogo_cirugia_id: CATALOGO_COLECISTECTOMIA_ID,
    tipo_cirugia: 'Colecistectomía Laparoscópica',
    codigo_cirugia: 'CIR-2026-C',
    medico_tratante: 'Dr. Alejandro Ramírez',
    notas_medicas: 'Colecistectomía laparoscópica electiva por colelitiasis sintomática. Cumplir ayuno estricto de grasas 24h previas y ayuno general de 8 horas.',
    nombre_sencillo: 'Extracción de la vesícula biliar por videolaparoscopia',
    especialidad: 'Cirugía General y Digestiva',
    duracion_estimada: '60 a 75 minutos',
    tipo_anestesia: 'Anestesia General Balanceada',
    sensacion_anestesia: 'Te quedarás profundamente dormido en pocos segundos y despertarás cuando la cirugía haya concluido sin haber sentido dolor.',
    tiempo_recuperacion: '24 horas de observación hospitalaria o alta ambulatoria',
    tiempo_recuperacion_sala: '1 a 2 horas en Sala de Recuperación (URPA)',
    dias_incapacidad_estimados: '8 a 14 días con dieta baja en grasas',
    fecha_programada: in24Hours,
    estado: 'en_preparacion',
    created_at: now.toISOString(),
  },
  {
    id: MOCK_CIRUGIA_D_ID,
    paciente_id: MOCK_PACIENTE_D_ID,
    catalogo_cirugia_id: CATALOGO_HERNIA_ID,
    tipo_cirugia: 'Herniorrafia Inguinal con Malla',
    codigo_cirugia: 'CIR-2026-D',
    medico_tratante: 'Dr. Alejandro Ramírez',
    notas_medicas: 'Reparación de hernia inguinal derecha con colocación de malla de baja densidad. Advertir no rasurar la zona inguinal en casa.',
    nombre_sencillo: 'Reparación de hernia inguinal con colocación de malla',
    especialidad: 'Cirugía General',
    duracion_estimada: '45 a 60 minutos',
    tipo_anestesia: 'Anestesia Regional o General',
    sensacion_anestesia: 'Descanso completo y adormecimiento de la región quirúrgica sin dolor ni tensión muscular.',
    tiempo_recuperacion: '12 a 24 horas ambulatoria',
    tiempo_recuperacion_sala: '1 hora en URPA',
    dias_incapacidad_estimados: '10 a 20 días evitando levantar objetos pesados',
    fecha_programada: in72Hours,
    estado: 'programada',
    created_at: now.toISOString(),
  },
  {
    id: MOCK_CIRUGIA_E_ID,
    paciente_id: MOCK_PACIENTE_E_ID,
    catalogo_cirugia_id: CATALOGO_APENDICE_ID,
    tipo_cirugia: 'Apendicectomía Laparoscópica',
    codigo_cirugia: 'CIR-2026-E',
    medico_tratante: 'Dra. Sofía Valencia',
    notas_medicas: 'Procedimiento programado ambulatorio. Preparación física estándar y ayuno de 8 horas sólidos y 2 horas líquidos claros.',
    nombre_sencillo: 'Cirugía de apéndice por mínima invasión (3 puertos)',
    especialidad: 'Cirugía General',
    duracion_estimada: '45 a 60 minutos',
    tipo_anestesia: 'Anestesia General Balanceada',
    sensacion_anestesia: 'Sentirás una suave calidez en el brazo y te quedarás plácidamente dormido en segundos sin sentir dolor.',
    tiempo_recuperacion: '24 a 48 horas ambulatoria',
    tiempo_recuperacion_sala: '1 a 2 horas en URPA',
    dias_incapacidad_estimados: '7 a 12 días con reincorporación gradual',
    fecha_programada: in36Hours,
    estado: 'programada',
    created_at: now.toISOString(),
  },
];

export const initialMockPautas: Pauta[] = [
  // Pautas Gerardo Andrés Martínez (Apendicectomía Laparoscópica en 48h)
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
    tipo_alarma: 'recordatorio_periodico',
    intervalo_minutos: 60,
    alarma_activa: true,
    es_vigilancia_continua: true,
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
    tipo_alarma: 'recordatorio_periodico',
    intervalo_minutos: 60,
    alarma_activa: true,
    es_vigilancia_continua: true,
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

  // Pautas Luisa Castro (Artroplastia Total de Cadera en 6h)
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
    tipo_alarma: 'recordatorio_periodico',
    intervalo_minutos: 60,
    alarma_activa: true,
    es_vigilancia_continua: true,
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
  },

  // Pautas Samuel Ramírez (Colecistectomía Laparoscópica en 24h)
  {
    id: 'pauta-c-1',
    cirugia_id: MOCK_CIRUGIA_C_ID,
    titulo: 'Dieta Liviana Libre de Grasas el Día Previo',
    descripcion: 'Evitar alimentos grasos, fritos, lácteos enteros o salsas 24 horas antes para prevenir cólicos.',
    horas_previas: 24,
    es_critica: true,
    fecha_limite: new Date(new Date(in24Hours).getTime() - 24 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-c-2',
    cirugia_id: MOCK_CIRUGIA_C_ID,
    titulo: 'Suspensión de Antiinflamatorios y AINEs',
    descripcion: 'Suspender ibuprofeno, naproxeno o aspirina para evitar sangrado intraoperatorio.',
    horas_previas: 24,
    es_critica: true,
    fecha_limite: new Date(new Date(in24Hours).getTime() - 24 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-c-3',
    cirugia_id: MOCK_CIRUGIA_C_ID,
    titulo: 'Ducha Corporal Antiséptica',
    descripcion: 'Baño corporal riguroso con jabón quirúrgico, limpiando suavemente ombligo y cuadrante superior derecho.',
    horas_previas: 12,
    es_critica: false,
    fecha_limite: new Date(new Date(in24Hours).getTime() - 12 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-c-4',
    cirugia_id: MOCK_CIRUGIA_C_ID,
    titulo: 'Ayuno Absoluto de Sólidos (CRÍTICO)',
    descripcion: 'Cero comida sólida o lácteos durante las 8 horas previas al procedimiento.',
    horas_previas: 8,
    es_critica: true,
    fecha_limite: new Date(new Date(in24Hours).getTime() - 8 * 3600 * 1000).toISOString(),
    tipo_alarma: 'recordatorio_periodico',
    intervalo_minutos: 60,
    alarma_activa: true,
    es_vigilancia_continua: true,
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-c-5',
    cirugia_id: MOCK_CIRUGIA_C_ID,
    titulo: 'Ayuno de Líquidos Claros (CRÍTICO)',
    descripcion: 'Suspender agua y aromáticas 2 horas antes de entrar a salas.',
    horas_previas: 2,
    es_critica: true,
    fecha_limite: new Date(new Date(in24Hours).getTime() - 2 * 3600 * 1000).toISOString(),
    tipo_alarma: 'recordatorio_periodico',
    intervalo_minutos: 60,
    alarma_activa: true,
    es_vigilancia_continua: true,
    created_at: now.toISOString(),
  },

  // Pautas Alonso Rodríguez (Herniorrafia Inguinal con Malla en 72h)
  {
    id: 'pauta-d-1',
    cirugia_id: MOCK_CIRUGIA_D_ID,
    titulo: 'Suspensión de Fármacos Anticoagulantes',
    descripcion: 'Ajuste de medicamentos según protocolo anestésico previo.',
    horas_previas: 48,
    es_critica: true,
    fecha_limite: new Date(new Date(in72Hours).getTime() - 48 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-d-2',
    cirugia_id: MOCK_CIRUGIA_D_ID,
    titulo: 'Prohibición de Rasurado en Casa',
    descripcion: 'No rasurar la ingle con cuchilla en casa para evitar micro-infecciones en la piel.',
    horas_previas: 24,
    es_critica: false,
    fecha_limite: new Date(new Date(in72Hours).getTime() - 24 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-d-3',
    cirugia_id: MOCK_CIRUGIA_D_ID,
    titulo: 'Ducha Antiséptica General',
    descripcion: 'Baño corporal la noche previa con jabón antiséptico.',
    horas_previas: 12,
    es_critica: false,
    fecha_limite: new Date(new Date(in72Hours).getTime() - 12 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-d-4',
    cirugia_id: MOCK_CIRUGIA_D_ID,
    titulo: 'Ayuno Absoluto de Sólidos',
    descripcion: '8 horas de ayuno completo sin alimentos pesados ni lácteos.',
    horas_previas: 8,
    es_critica: true,
    fecha_limite: new Date(new Date(in72Hours).getTime() - 8 * 3600 * 1000).toISOString(),
    tipo_alarma: 'recordatorio_periodico',
    intervalo_minutos: 60,
    alarma_activa: true,
    es_vigilancia_continua: true,
    created_at: now.toISOString(),
  },

  // Pautas Luis Solarte (Apendicectomía Laparoscópica en 36h)
  {
    id: 'pauta-e-1',
    cirugia_id: MOCK_CIRUGIA_E_ID,
    titulo: 'Ducha Antiséptica y Limpieza Abdominal',
    descripcion: 'Baño con énfasis en abdomen y ombligo usando toalla limpia.',
    horas_previas: 12,
    es_critica: false,
    fecha_limite: new Date(new Date(in36Hours).getTime() - 12 * 3600 * 1000).toISOString(),
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-e-2',
    cirugia_id: MOCK_CIRUGIA_E_ID,
    titulo: 'Ayuno de Sólidos',
    descripcion: 'Ayuno estricto de alimentos sólidos 8 horas antes del ingreso.',
    horas_previas: 8,
    es_critica: true,
    fecha_limite: new Date(new Date(in36Hours).getTime() - 8 * 3600 * 1000).toISOString(),
    tipo_alarma: 'recordatorio_periodico',
    intervalo_minutos: 60,
    alarma_activa: true,
    es_vigilancia_continua: true,
    created_at: now.toISOString(),
  },
  {
    id: 'pauta-e-3',
    cirugia_id: MOCK_CIRUGIA_E_ID,
    titulo: 'Presentación Puntual en Admisiones',
    descripcion: 'Llegada 2 horas antes con ropa cómoda y documento de identidad.',
    horas_previas: 2,
    es_critica: true,
    fecha_limite: new Date(new Date(in36Hours).getTime() - 2 * 3600 * 1000).toISOString(),
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
  },

  // Checkins Samuel Ramírez (Caso C)
  {
    id: 'check-c-1',
    pauta_id: 'pauta-c-1',
    estado: 'completado',
    fecha_respuesta: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    observaciones: 'Dieta liviana iniciada sin grasas.',
    updated_at: now.toISOString(),
  },
  {
    id: 'check-c-2',
    pauta_id: 'pauta-c-2',
    estado: 'pendiente',
    fecha_respuesta: null,
    observaciones: 'Pendiente confirmar suspensión de analgésicos.',
    updated_at: now.toISOString(),
  },
  {
    id: 'check-c-3',
    pauta_id: 'pauta-c-3',
    estado: 'pendiente',
    fecha_respuesta: null,
    observaciones: null,
    updated_at: now.toISOString(),
  },
  {
    id: 'check-c-4',
    pauta_id: 'pauta-c-4',
    estado: 'pendiente',
    fecha_respuesta: null,
    observaciones: null,
    updated_at: now.toISOString(),
  },
  {
    id: 'check-c-5',
    pauta_id: 'pauta-c-5',
    estado: 'pendiente',
    fecha_respuesta: null,
    observaciones: null,
    updated_at: now.toISOString(),
  },

  // Checkins Alonso Rodríguez (Caso D)
  {
    id: 'check-d-1',
    pauta_id: 'pauta-d-1',
    estado: 'completado',
    fecha_respuesta: new Date(now.getTime() - 20 * 3600 * 1000).toISOString(),
    observaciones: 'Medicación ajustada con su médico internista.',
    updated_at: now.toISOString(),
  },
  {
    id: 'check-d-2',
    pauta_id: 'pauta-d-2',
    estado: 'completado',
    fecha_respuesta: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
    observaciones: 'Instrucción de no rasurado comprendida.',
    updated_at: now.toISOString(),
  },
  {
    id: 'check-d-3',
    pauta_id: 'pauta-d-3',
    estado: 'pendiente',
    fecha_respuesta: null,
    observaciones: null,
    updated_at: now.toISOString(),
  },
  {
    id: 'check-d-4',
    pauta_id: 'pauta-d-4',
    estado: 'pendiente',
    fecha_respuesta: null,
    observaciones: null,
    updated_at: now.toISOString(),
  },

  // Checkins Luis Solarte (Caso E)
  {
    id: 'check-e-1',
    pauta_id: 'pauta-e-1',
    estado: 'completado',
    fecha_respuesta: new Date(now.getTime() - 8 * 3600 * 1000).toISOString(),
    observaciones: 'Baño antiséptico ejecutado.',
    updated_at: now.toISOString(),
  },
  {
    id: 'check-e-2',
    pauta_id: 'pauta-e-2',
    estado: 'pendiente',
    fecha_respuesta: null,
    observaciones: null,
    updated_at: now.toISOString(),
  },
  {
    id: 'check-e-3',
    pauta_id: 'pauta-e-3',
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
  },
  {
    id: 'alert-3',
    paciente_id: MOCK_PACIENTE_C_ID,
    cirugia_id: MOCK_CIRUGIA_C_ID,
    nivel: 'amarillo',
    mensaje: 'Pauta de suspensión de AINEs próxima al límite para Colecistectomía en 24h. Pendiente confirmación.',
    atendida: false,
    created_at: now.toISOString(),
  },
  {
    id: 'alert-4',
    paciente_id: MOCK_PACIENTE_D_ID,
    cirugia_id: MOCK_CIRUGIA_D_ID,
    nivel: 'verde',
    mensaje: 'Preparación oportuna en curso para Herniorrafia Inguinal en 72h.',
    atendida: false,
    created_at: now.toISOString(),
  },
  {
    id: 'alert-5',
    paciente_id: MOCK_PACIENTE_E_ID,
    cirugia_id: MOCK_CIRUGIA_E_ID,
    nivel: 'verde',
    mensaje: 'Protocolo preoperatorio ambulatorio sin novedades para Apendicectomía en 36h.',
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
  // MATERIALES EDUCATIVOS: ARTROPLASTIA TOTAL DE CADERA (Luisa Castro)
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
    contenido_markdown: 'Debes consultar de urgencias si presentas:\n- Dolor agudo y súbito en la cadera con imposibilidad de apoyar o si notas que la pierna operada se ve más corta o girada hacia afuera (sospecha de luxación).\n- Dolor punzante o hinchazón intensa en la pantorrilla (sospecha de trombosis venosa).\n- Fiebre superior a 38°C o secreción purulenta en la herida quirúrgica.',
    url_recurso: null,
    orden_visualizacion: 33,
    created_at: now.toISOString()
  }
];

// ============================================================================
// CAPA DE PERSISTENCIA HÍBRIDA LOCAL (Sincroniza nuevos registros entre sesiones)
// ============================================================================
const STORAGE_KEY_DYNAMIC_DATA = 'precare_dynamic_records_v1';
const STORAGE_KEY_EXTENDED_META = 'precare_extended_meta_v1';
const STORAGE_KEY_CATALOGO_CIRUGIAS = 'precare_catalogo_cirugias_v1';

interface StoredDynamicRecords {
  pacientes: Paciente[];
  cirugias: Cirugia[];
  pautas: Pauta[];
  checkins: Checkin[];
  alertas: Alerta[];
}

export interface ExtendedPacienteMeta {
  pin_acceso: string;
  email?: string;
  grupo_sanguineo?: string | null;
  peso_kg?: number | null;
  talla_cm?: number | null;
  alergias?: string | null;
  comorbilidades?: string[] | null;
  medicacion_habitual?: string | null;
  nivel_ansiedad?: NivelAnsiedad | null;
}

export interface ExtendedCirugiaMeta {
  catalogo_cirugia_id?: string | null;
  codigo_cirugia?: string;
  medico_tratante?: string;
  notas_medicas?: string;
}

export interface ExtendedClinicalMeta {
  pacientePinMap: Record<string, ExtendedPacienteMeta>; // key: documento o paciente.id
  cirugiaMetaMap: Record<string, ExtendedCirugiaMeta>; // key: cirugia.id o paciente.id
}

export function loadPersistedCatalogoCirugias(): CatalogoCirugia[] {
  if (typeof window === 'undefined') return initialCatalogoCirugias;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATALOGO_CIRUGIAS);
    if (!raw) return initialCatalogoCirugias;
    const savedList: CatalogoCirugia[] = JSON.parse(raw);
    for (const item of savedList) {
      const idx = initialCatalogoCirugias.findIndex(
        c => c.id === item.id || c.tipo_cirugia.toLowerCase() === item.tipo_cirugia.toLowerCase()
      );
      if (idx >= 0) {
        initialCatalogoCirugias[idx] = item;
      } else {
        initialCatalogoCirugias.push(item);
      }
    }
  } catch (e) {
    console.warn('[mockData] Error cargando catálogo de cirugías:', e);
  }
  return initialCatalogoCirugias;
}

export function saveCatalogoCirugiaLocally(item: CatalogoCirugia): CatalogoCirugia[] {
  const idx = initialCatalogoCirugias.findIndex(
    c => c.id === item.id || c.tipo_cirugia.toLowerCase() === item.tipo_cirugia.toLowerCase()
  );
  if (idx >= 0) {
    initialCatalogoCirugias[idx] = item;
  } else {
    initialCatalogoCirugias.unshift(item);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CATALOGO_CIRUGIAS, JSON.stringify(initialCatalogoCirugias));
    } catch (e) {
      console.warn('[mockData] Error guardando catálogo de cirugías:', e);
    }
  }
  return [...initialCatalogoCirugias];
}

export function findCatalogoCirugia(tipoOrId?: string | null): CatalogoCirugia | undefined {
  if (!tipoOrId) return undefined;
  loadPersistedCatalogoCirugias();
  const q = tipoOrId.trim().toLowerCase();
  return (
    initialCatalogoCirugias.find(c => c.id.toLowerCase() === q) ||
    initialCatalogoCirugias.find(c => c.tipo_cirugia.toLowerCase() === q) ||
    initialCatalogoCirugias.find(
      c => q.includes(c.tipo_cirugia.toLowerCase()) || c.tipo_cirugia.toLowerCase().includes(q)
    )
  );
}

export function getExtendedClinicalMeta(): ExtendedClinicalMeta {
  if (typeof window === 'undefined') {
    return { pacientePinMap: {}, cirugiaMetaMap: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXTENDED_META);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[mockData] Error leyendo metadatos extendidos:', e);
  }
  return { pacientePinMap: {}, cirugiaMetaMap: {} };
}

export function saveExtendedClinicalMeta(
  paciente: Paciente,
  cirugia: Cirugia
) {
  if (typeof window === 'undefined') return;
  const current = getExtendedClinicalMeta();
  const pacMeta: ExtendedPacienteMeta = {
    pin_acceso: paciente.pin_acceso || paciente.documento.slice(-4),
    email: paciente.email || undefined,
    grupo_sanguineo: paciente.grupo_sanguineo ?? null,
    peso_kg: paciente.peso_kg ?? null,
    talla_cm: paciente.talla_cm ?? null,
    alergias: paciente.alergias ?? null,
    comorbilidades: paciente.comorbilidades ?? null,
    medicacion_habitual: paciente.medicacion_habitual ?? null,
    nivel_ansiedad: paciente.nivel_ansiedad ?? null,
  };
  current.pacientePinMap[paciente.id] = pacMeta;
  current.pacientePinMap[paciente.documento] = pacMeta;

  const cirMeta: ExtendedCirugiaMeta = {
    catalogo_cirugia_id: cirugia.catalogo_cirugia_id ?? null,
    codigo_cirugia: cirugia.codigo_cirugia || undefined,
    medico_tratante: cirugia.medico_tratante || undefined,
    notas_medicas: cirugia.notas_medicas || undefined,
  };
  current.cirugiaMetaMap[cirugia.id] = cirMeta;
  current.cirugiaMetaMap[cirugia.paciente_id] = cirMeta;
  try {
    localStorage.setItem(STORAGE_KEY_EXTENDED_META, JSON.stringify(current));
  } catch (e) {
    console.warn('[mockData] Error guardando metadatos extendidos:', e);
  }
}

export function enrichPacienteWithMeta(pac: Paciente): Paciente {
  const meta = getExtendedClinicalMeta();
  const byId = meta.pacientePinMap[pac.id];
  const byDoc = meta.pacientePinMap[pac.documento];
  const seedMatch = initialMockPacientes.find(p => p.documento === pac.documento || p.id === pac.id);
  return {
    ...pac,
    pin_acceso: pac.pin_acceso || byId?.pin_acceso || byDoc?.pin_acceso || seedMatch?.pin_acceso || pac.documento.slice(-4),
    email: pac.email || byId?.email || byDoc?.email || seedMatch?.email || null,
    grupo_sanguineo: pac.grupo_sanguineo || byId?.grupo_sanguineo || byDoc?.grupo_sanguineo || seedMatch?.grupo_sanguineo || null,
    peso_kg: pac.peso_kg ?? byId?.peso_kg ?? byDoc?.peso_kg ?? seedMatch?.peso_kg ?? null,
    talla_cm: pac.talla_cm ?? byId?.talla_cm ?? byDoc?.talla_cm ?? seedMatch?.talla_cm ?? null,
    alergias: pac.alergias || byId?.alergias || byDoc?.alergias || seedMatch?.alergias || null,
    comorbilidades: pac.comorbilidades || byId?.comorbilidades || byDoc?.comorbilidades || seedMatch?.comorbilidades || null,
    medicacion_habitual: pac.medicacion_habitual || byId?.medicacion_habitual || byDoc?.medicacion_habitual || seedMatch?.medicacion_habitual || null,
    nivel_ansiedad: pac.nivel_ansiedad || byId?.nivel_ansiedad || byDoc?.nivel_ansiedad || seedMatch?.nivel_ansiedad || null,
  };
}

export function enrichCirugiaWithMeta(cir: Cirugia): Cirugia {
  const meta = getExtendedClinicalMeta();
  const byCirId = meta.cirugiaMetaMap[cir.id];
  const byPacId = meta.cirugiaMetaMap[cir.paciente_id];
  const seedMatch = initialMockCirugias.find(c => c.id === cir.id || c.paciente_id === cir.paciente_id);
  const catMatch = findCatalogoCirugia(cir.catalogo_cirugia_id || byCirId?.catalogo_cirugia_id || cir.tipo_cirugia);
  return {
    ...cir,
    catalogo_cirugia_id: cir.catalogo_cirugia_id || byCirId?.catalogo_cirugia_id || byPacId?.catalogo_cirugia_id || seedMatch?.catalogo_cirugia_id || catMatch?.id || null,
    codigo_cirugia: cir.codigo_cirugia || byCirId?.codigo_cirugia || byPacId?.codigo_cirugia || seedMatch?.codigo_cirugia || null,
    medico_tratante: cir.medico_tratante || byCirId?.medico_tratante || byPacId?.medico_tratante || seedMatch?.medico_tratante || 'Dr. Alejandro Ramírez',
    notas_medicas: cir.notas_medicas || byCirId?.notas_medicas || byPacId?.notas_medicas || seedMatch?.notas_medicas || null,
    nombre_sencillo: cir.nombre_sencillo || catMatch?.nombre_sencillo || cir.tipo_cirugia,
    especialidad: cir.especialidad || catMatch?.especialidad || 'Cirugía General',
    duracion_estimada: cir.duracion_estimada || catMatch?.duracion_estimada || '45 a 60 minutos',
    tipo_anestesia: cir.tipo_anestesia || catMatch?.tipo_anestesia || 'Anestesia General',
    sensacion_anestesia: cir.sensacion_anestesia || catMatch?.sensacion_anestesia || 'Estarás plácidamente dormido y sin dolor.',
    tiempo_recuperacion: cir.tiempo_recuperacion || catMatch?.tiempo_recuperacion || '24 a 48 horas de observación',
    tiempo_recuperacion_sala: cir.tiempo_recuperacion_sala || catMatch?.tiempo_recuperacion_sala || '1 a 2 horas en URPA',
    dias_incapacidad_estimados: cir.dias_incapacidad_estimados || catMatch?.dias_incapacidad_estimados || '7 a 15 días',
  };
}

export function loadPersistedDynamicRecords(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DYNAMIC_DATA);
    if (!raw) return;
    const data: StoredDynamicRecords = JSON.parse(raw);

    for (const p of data.pacientes || []) {
      if (!initialMockPacientes.some(existing => existing.id === p.id || existing.documento === p.documento)) {
        initialMockPacientes.push(p);
      }
    }
    for (const c of data.cirugias || []) {
      if (!initialMockCirugias.some(existing => existing.id === c.id)) {
        initialMockCirugias.push(c);
      }
    }
    for (const pt of data.pautas || []) {
      if (!initialMockPautas.some(existing => existing.id === pt.id)) {
        initialMockPautas.push(pt);
      }
    }
    for (const ch of data.checkins || []) {
      if (!initialMockCheckins.some(existing => existing.id === ch.id)) {
        initialMockCheckins.push(ch);
      }
    }
    for (const al of data.alertas || []) {
      if (!initialMockAlertas.some(existing => existing.id === al.id)) {
        initialMockAlertas.unshift(al);
      }
    }
  } catch (e) {
    console.warn('[mockData] Error cargando registros dinámicos:', e);
  }
}

export function persistNewRegistrationLocally(
  paciente: Paciente,
  cirugia: Cirugia,
  pautas: Pauta[],
  checkins: Checkin[],
  alerta: Alerta
): void {
  // Actualizar arreglos en memoria
  const existingPacIdx = initialMockPacientes.findIndex(p => p.id === paciente.id || p.documento === paciente.documento);
  if (existingPacIdx >= 0) {
    initialMockPacientes[existingPacIdx] = paciente;
  } else {
    initialMockPacientes.push(paciente);
  }

  if (!initialMockCirugias.some(c => c.id === cirugia.id)) {
    initialMockCirugias.unshift(cirugia);
  }
  for (const pt of pautas) {
    if (!initialMockPautas.some(existing => existing.id === pt.id)) {
      initialMockPautas.push(pt);
    }
  }
  for (const ch of checkins) {
    if (!initialMockCheckins.some(existing => existing.id === ch.id)) {
      initialMockCheckins.push(ch);
    }
  }
  if (!initialMockAlertas.some(a => a.id === alerta.id)) {
    initialMockAlertas.unshift(alerta);
  }

  saveExtendedClinicalMeta(paciente, cirugia);

  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DYNAMIC_DATA);
    const current: StoredDynamicRecords = raw
      ? JSON.parse(raw)
      : { pacientes: [], cirugias: [], pautas: [], checkins: [], alertas: [] };

    current.pacientes = current.pacientes.filter(p => p.id !== paciente.id && p.documento !== paciente.documento);
    current.pacientes.push(paciente);
    current.cirugias.push(cirugia);
    current.pautas.push(...pautas);
    current.checkins.push(...checkins);
    current.alertas.unshift(alerta);

    localStorage.setItem(STORAGE_KEY_DYNAMIC_DATA, JSON.stringify(current));
  } catch (e) {
    console.warn('[mockData] Error guardando registro en localStorage:', e);
  }
}

// Hidratar inmediatamente al importar el módulo
loadPersistedCatalogoCirugias();
loadPersistedDynamicRecords();

