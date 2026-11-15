-- =====================================================================================
-- MIGRACIÓN: AUTENTICACIÓN DUAL, CATÁLOGO REUTILIZABLE DE CIRUGÍAS Y PERFIL ESPECÍFICO
-- Proyecto: Tech-and-Touch (Ecosistema Phygital Prequirúrgico)
-- =====================================================================================

-- 1. CREAR TABLA DE CATÁLOGO GENERAL DE CIRUGÍAS (PROTOCOLOS BASE REUTILIZABLES)
CREATE TABLE IF NOT EXISTS catalogo_cirugias (
  id TEXT PRIMARY KEY,
  codigo_base TEXT UNIQUE NOT NULL,
  tipo_cirugia TEXT UNIQUE NOT NULL,
  nombre_sencillo TEXT NOT NULL,
  especialidad TEXT NOT NULL DEFAULT 'Cirugía General',
  tipo_anestesia TEXT NOT NULL DEFAULT 'Anestesia General',
  sensacion_anestesia TEXT NOT NULL,
  duracion_estimada TEXT NOT NULL,
  tiempo_recuperacion TEXT NOT NULL,
  tiempo_recuperacion_sala TEXT NOT NULL DEFAULT '1 a 2 horas en Sala de Recuperación (URPA)',
  dias_incapacidad_estimados TEXT NOT NULL DEFAULT '7 a 15 días',
  horas_ayuno_solidos INT NOT NULL DEFAULT 8,
  descripcion_ayuno_solidos TEXT NOT NULL,
  horas_ayuno_liquidos INT NOT NULL DEFAULT 2,
  descripcion_ayuno_liquidos TEXT NOT NULL,
  incluir_suspension_farmacos BOOLEAN NOT NULL DEFAULT TRUE,
  horas_suspension_farmacos INT NOT NULL DEFAULT 24,
  detalle_farmacos_base TEXT NOT NULL,
  incluir_ducha_antiseptica BOOLEAN NOT NULL DEFAULT TRUE,
  horas_ducha_antiseptica INT NOT NULL DEFAULT 12,
  descripcion_ducha_antiseptica TEXT NOT NULL,
  pauta_especifica_titulo TEXT,
  pauta_especifica_descripcion TEXT,
  pauta_especifica_horas INT DEFAULT 12,
  video_url TEXT DEFAULT '/videos/cirugia-apendice.mp4',
  video_titulo TEXT,
  video_descripcion TEXT,
  infografia_url TEXT DEFAULT '/images/infografia-apendice.png',
  infografia_titulo TEXT,
  infografia_descripcion TEXT,
  explicacion_sofi TEXT NOT NULL,
  cuidados_especificos_sofi TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EXTENDER TABLA PACIENTES (Credenciales + Perfil Clínico Específico del Paciente)
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS pin_acceso TEXT DEFAULT '1234',
  ADD COLUMN IF NOT EXISTS grupo_sanguineo TEXT DEFAULT 'O+',
  ADD COLUMN IF NOT EXISTS peso_kg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS talla_cm NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS alergias TEXT DEFAULT 'Ninguna conocida',
  ADD COLUMN IF NOT EXISTS comorbilidades TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS medicacion_habitual TEXT,
  ADD COLUMN IF NOT EXISTS nivel_ansiedad TEXT DEFAULT 'moderada';

-- 3. EXTENDER TABLA CIRUGIAS (Vínculo al Catálogo Base + Personalización del Paciente)
ALTER TABLE cirugias
  ADD COLUMN IF NOT EXISTS catalogo_cirugia_id TEXT REFERENCES catalogo_cirugias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS codigo_cirugia TEXT,
  ADD COLUMN IF NOT EXISTS medico_tratante TEXT DEFAULT 'Dr. Alejandro Ramírez',
  ADD COLUMN IF NOT EXISTS notas_medicas TEXT,
  ADD COLUMN IF NOT EXISTS nombre_sencillo TEXT,
  ADD COLUMN IF NOT EXISTS especialidad TEXT DEFAULT 'Cirugía General',
  ADD COLUMN IF NOT EXISTS duracion_estimada TEXT DEFAULT '45 a 60 minutos',
  ADD COLUMN IF NOT EXISTS tipo_anestesia TEXT DEFAULT 'Anestesia General',
  ADD COLUMN IF NOT EXISTS sensacion_anestesia TEXT,
  ADD COLUMN IF NOT EXISTS tiempo_recuperacion TEXT,
  ADD COLUMN IF NOT EXISTS tiempo_recuperacion_sala TEXT,
  ADD COLUMN IF NOT EXISTS dias_incapacidad_estimados TEXT;

-- 4. CREAR TABLA PERSONAL_CLINICO (Acceso Institucional)
CREATE TABLE IF NOT EXISTS personal_clinico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'Cirujano Tratante',
  especialidad TEXT NOT NULL DEFAULT 'Cirugía General',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. HABILITAR RLS Y POLÍTICAS DE ACCESO
ALTER TABLE catalogo_cirugias ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_clinico ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'catalogo_cirugias' AND policyname = 'Acceso publico catalogo_cirugias'
  ) THEN
    CREATE POLICY "Acceso publico catalogo_cirugias" ON catalogo_cirugias FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'personal_clinico' AND policyname = 'Lectura personal_clinico'
  ) THEN
    CREATE POLICY "Lectura personal_clinico" ON personal_clinico FOR SELECT USING (true);
  END IF;
END $$;

-- 6. SEMILLA DEL CATÁLOGO GENERAL DE CIRUGÍAS (REUTILIZABLES)
INSERT INTO catalogo_cirugias (
  id, codigo_base, tipo_cirugia, nombre_sencillo, especialidad, tipo_anestesia, sensacion_anestesia,
  duracion_estimada, tiempo_recuperacion, tiempo_recuperacion_sala, dias_incapacidad_estimados,
  horas_ayuno_solidos, descripcion_ayuno_solidos, horas_ayuno_liquidos, descripcion_ayuno_liquidos,
  incluir_suspension_farmacos, horas_suspension_farmacos, detalle_farmacos_base,
  incluir_ducha_antiseptica, horas_ducha_antiseptica, descripcion_ducha_antiseptica,
  pauta_especifica_titulo, pauta_especifica_descripcion, pauta_especifica_horas,
  video_url, video_titulo, video_descripcion, infografia_url, infografia_titulo, infografia_descripcion,
  explicacion_sofi, cuidados_especificos_sofi
) VALUES
(
  'cat-apendicectomia-lap',
  'PROT-APEN-01',
  'Apendicectomía Laparoscópica',
  'Cirugía de apéndice por mínima invasión (3 puertos)',
  'Cirugía General',
  'Anestesia General Balanceada',
  'Sentirás una suave calidez en el brazo y te quedarás plácidamente dormido en segundos sin sentir dolor alguno.',
  '45 a 60 minutos',
  '24 a 48 horas de estancia ambulatoria / observación',
  '1 a 2 horas en Sala de Recuperación (URPA)',
  '7 a 12 días con reincorporación gradual',
  8,
  'Cero alimentos sólidos, lácteos, jugos con pulpa ni café con leche. El estómago debe estar completamente vacío para una inducción anestésica segura.',
  2,
  'Suspender absolutamente el consumo de agua, aromáticas o cualquier líquido por vía oral.',
  true,
  24,
  'Suspender antiinflamatorios (ibuprofeno, naproxeno, aspirina) y anticoagulantes según orden médica previa para evitar riesgo de sangrado.',
  true,
  12,
  'Realizar baño corporal completo con jabón de clorhexidina, haciendo énfasis especial en el ombligo y la zona abdominal inferior derecha.',
  'Vigilancia de Signos de Alarma (Fiebre o Dolor Intenso)',
  'Reportar de inmediato si presenta fiebre >38°C o dolor abdominal punzante súbito antes del ingreso para descartar perforación.',
  6,
  '/videos/cirugia-apendice.mp4',
  'Cápsula Educativa: ¿Cómo se realiza tu Apendicectomía Laparoscópica?',
  'Recorrido visual paso a paso sobre la extracción segura del apéndice mediante 3 microincisiones milimétricas guiadas por cámara de alta definición.',
  '/images/infografia-apendice.png',
  'Infografía Anatómica: Técnica de 3 Puertos y Recuperación Temprana',
  'Esquema ilustrado de los 3 puertos laparoscópicos (umbilical y suprapúbicos), insuflación suave con gas CO2 medicinal y rápida cicatrización.',
  'Explica el proceso en lenguaje cotidiano, destacando que el equipo médico estará a su lado monitoreando cada segundo, que estará bajo anestesia general sin sentir dolor, y que se extrae el apéndice inflamado mediante 3 incisiones milimétricas con microcámara para una recuperación rápida.',
  'Si el paciente menciona fiebre superior a 38.5°C o dolor abdominal punzante insoportable en el lado inferior derecho previo al ingreso, ordénale acudir a Urgencias inmediatamente.'
),
(
  'cat-artroplastia-cadera',
  'PROT-CAD-02',
  'Artroplastia Total de Cadera',
  'Reemplazo articular total de cadera con prótesis biocompatible',
  'Ortopedia y Traumatología',
  'Anestesia Regional (Raquídea/Epidural) + Sedación Consciente',
  'Adormecimiento completo de la mitad inferior de tu cuerpo con una agradable sensación de descanso tranquilo sin dolor.',
  '60 a 90 minutos',
  '48 a 72 horas de hospitalización y rehabilitación asistida',
  '2 a 3 horas en Sala de Recuperación (URPA)',
  '30 a 45 días con fisioterapia progresiva y apoyo en caminador',
  8,
  'Suspender por completo alimentos sólidos, caldos con grasa, lácteos y bebidas oscuras al menos 8 horas antes.',
  2,
  'No ingerir ni una gota de agua, infusiones ni caramelos durante las últimas 2 horas previas a quirófano.',
  true,
  48,
  'Suspender anticoagulantes, aspirina y antiinflamatorios 48h antes según esquema de anestesiología para profilaxis de hematoma espinal y sangrado.',
  true,
  12,
  'Higiene corporal rigurosa con jabón quirúrgico de clorhexidina desde la cintura hasta los pies, enfatizando cadera, ingle y muslo.',
  'Alistamiento de Caminador / Bastón y Adecuación del Hogar',
  'Tener listo el caminador ortopédico para el alta, zapatos cerrados antideslizantes y retirar alfombras sueltas en casa.',
  24,
  '/videos/cirugia-cadera.mp4',
  'Cápsula Educativa: ¿En qué consiste el Reemplazo Total de Cadera?',
  'Animación biomecánica que muestra cómo se sustituye el cartílago desgastado por la artrosis mediante una copa acetabular y vástago de titanio.',
  '/images/infografia-cadera.png',
  'Infografía Anatómica: Componentes Protésicos y Posturas Seguras',
  'Guía visual de los 4 componentes biomecánicos de la prótesis y las reglas de oro posturales (no cruzar piernas y no flexionar más de 90 grados).',
  'Explica en lenguaje cálido que bajo anestesia regional controlada con sedación suave no sentirá dolor en las piernas, y que se sustituye la superficie articular desgastada por una prótesis biocompatible que permite caminar con andador desde las primeras 24 horas.',
  'Prevención estricta de luxación: Prohibido cruzar las piernas en tijera al sentarse o acostarse; evitar flexiones de cadera superiores a 90 grados; promover asiento elevado en inodoro y calzador largo.'
),
(
  'cat-colecistectomia-lap',
  'PROT-COLE-03',
  'Colecistectomía Laparoscópica',
  'Extracción de la vesícula biliar por videolaparoscopia',
  'Cirugía General y Digestiva',
  'Anestesia General Balanceada',
  'Te quedarás profundamente dormido en pocos segundos y despertarás cuando la cirugía haya concluido sin haber sentido dolor.',
  '60 a 75 minutos',
  '24 horas de observación hospitalaria o alta ambulatoria',
  '1 a 2 horas en Sala de Recuperación (URPA)',
  '8 a 14 días con dieta baja en grasas',
  8,
  'Ayuno absoluto de alimentos sólidos, grasas y lácteos durante las 8 horas previas para mantener la vesícula en reposo.',
  2,
  'Suspensión total de agua y líquidos claros 2 horas antes del procedimiento.',
  true,
  24,
  'Suspender antiinflamatorios no esteroideos (AINEs) y suplementos herbales. Si toma antihipertensivos, consultar toma con sorbo mínimo de agua.',
  true,
  12,
  'Baño general con jabón antiséptico haciendo énfasis en el abdomen superior derecho y la región umbilical.',
  'Dieta Liviana Libre de Grasas el Día Previo',
  'Durante las 24 horas previas al ayuno, evitar frituras, salsas, embutidos o lácteos enteros para prevenir cólicos biliares.',
  24,
  '/videos/cirugia-apendice.mp4',
  'Cápsula Educativa: Cirugía Laparoscópica Abdominal por Mínima Invasión',
  'Conoce cómo funciona el abordaje laparoscópico mediante microcámara de alta definición para extraer la vesícula con rápida recuperación.',
  '/images/infografia-apendice.png',
  'Infografía: Abordaje Laparoscópico y Cuidados Digestivos',
  'Ubicación de las pequeñas incisiones abdominales, beneficios del abordaje mínimamente invasivo y pautas de alimentación posoperatoria.',
  'Explica con calidez que la extracción de la vesícula biliar se realiza por videolaparoscopia a través de pequeñas incisiones milimétricas bajo anestesia general segura.',
  'Vigilar signos de alarma previos como coloración amarilla en ojos/piel (ictericia), fiebre o dolor intenso en la boca del estómago.'
)
ON CONFLICT (id) DO UPDATE SET
  nombre_sencillo = EXCLUDED.nombre_sencillo,
  explicacion_sofi = EXCLUDED.explicacion_sofi,
  cuidados_especificos_sofi = EXCLUDED.cuidados_especificos_sofi;

-- 7. SEMILLA PERSONAL CLÍNICO
INSERT INTO personal_clinico (nombre_completo, email, password_hash, rol, especialidad)
VALUES
  ('Dr. Alejandro Ramírez', 'dr.ramirez@hospital.org', 'Clinica2026*', 'Cirujano Jefe', 'Cirugía General y Laparoscopia'),
  ('Dra. Sofía Valencia', 'dra.valencia@hospital.org', 'Clinica2026*', 'Cirujana Ortopedista', 'Ortopedia y Traumatología'),
  ('Jefe Laura Gómez', 'enfermeria@hospital.org', 'Clinica2026*', 'Coordinadora Prequirúrgica', 'Enfermería Quirúrgica')
ON CONFLICT (email) DO NOTHING;
