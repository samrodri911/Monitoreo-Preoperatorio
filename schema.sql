-- ==============================================================================
-- ECOSISTEMA PREOPERATORIO "TECH-AND-TOUCH" (FASE 1: MVP BASE)
-- Script de Base de Datos para Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 1. LIMPIEZA DE TABLAS PREVIAS (Por si se requiere reiniciar el entorno)
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS checkins CASCADE;
DROP TABLE IF EXISTS pautas CASCADE;
DROP TABLE IF EXISTS cirugias CASCADE;
DROP TABLE IF EXISTS pacientes CASCADE;

-- Habilitar extensión para UUIDs criptográficos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. DEFINICIÓN DE TABLAS PRINCIPALES
-- ==============================================================================

-- Tabla: PACIENTES
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR(255) NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE,
    telefono VARCHAR(50) NOT NULL,
    edad INTEGER NOT NULL CHECK (edad >= 0),
    contacto_emergencia VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: CIRUGIAS
CREATE TABLE cirugias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo_cirugia VARCHAR(255) NOT NULL,
    fecha_programada TIMESTAMPTZ NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'programada' 
        CHECK (estado IN ('programada', 'en_preparacion', 'cancelada', 'realizada')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: PAUTAS (Segmentación temporal prequirúrgica)
CREATE TABLE pautas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cirugia_id UUID NOT NULL REFERENCES cirugias(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    horas_previas INTEGER NOT NULL CHECK (horas_previas >= 0),
    es_critica BOOLEAN NOT NULL DEFAULT false,
    fecha_limite TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: CHECKINS (Registro de cumplimiento del paciente)
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pauta_id UUID NOT NULL REFERENCES pautas(id) ON DELETE CASCADE,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'completado', 'omitido')),
    fecha_respuesta TIMESTAMPTZ,
    observaciones TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: ALERTAS (Semáforo de riesgo y contingencia clínica)
CREATE TABLE alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    cirugia_id UUID REFERENCES cirugias(id) ON DELETE CASCADE,
    nivel VARCHAR(50) NOT NULL DEFAULT 'verde' 
        CHECK (nivel IN ('verde', 'amarillo', 'rojo')),
    mensaje TEXT NOT NULL,
    atendida BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. OPTIMIZACIÓN E ÍNDICES
-- ==============================================================================
CREATE INDEX idx_cirugias_paciente ON cirugias(paciente_id);
CREATE INDEX idx_pautas_cirugia ON pautas(cirugia_id);
CREATE INDEX idx_checkins_pauta ON checkins(pauta_id);
CREATE INDEX idx_alertas_paciente ON alertas(paciente_id);
CREATE INDEX idx_alertas_nivel ON alertas(nivel);

-- ==============================================================================
-- 4. CONFIGURACIÓN DE SUPABASE REALTIME
-- ==============================================================================
-- Habilitar REPLICA IDENTITY FULL para capturar el estado anterior y nuevo en WebSockets
ALTER TABLE checkins REPLICA IDENTITY FULL;
ALTER TABLE alertas REPLICA IDENTITY FULL;
ALTER TABLE cirugias REPLICA IDENTITY FULL;

-- Agregar tablas a la publicación de tiempo real de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE alertas;
ALTER PUBLICATION supabase_realtime ADD TABLE cirugias;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - MODO PROTOTIPO / DESARROLLO
-- ==============================================================================
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cirugias ENABLE ROW LEVEL SECURITY;
ALTER TABLE pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (anon) para agilizar el desarrollo del MVP
CREATE POLICY "Acceso total a pacientes (dev)" ON pacientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a cirugias (dev)" ON cirugias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a pautas (dev)" ON pautas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a checkins (dev)" ON checkins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a alertas (dev)" ON alertas FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 6. DATOS SEMILLA (SEED DATA)
-- Casos clínicos calculados dinámicamente según NOW() para pruebas inmediatas
-- ==============================================================================

DO $$
DECLARE
    -- IDs para Paciente A (En regla / Semáforo Verde)
    v_paciente_a_id UUID := gen_random_uuid();
    v_cirugia_a_id UUID := gen_random_uuid();
    v_pauta_a1_id UUID := gen_random_uuid();
    v_pauta_a2_id UUID := gen_random_uuid();
    v_pauta_a3_id UUID := gen_random_uuid();
    v_pauta_a4_id UUID := gen_random_uuid();

    -- IDs para Paciente B (Alerta Crítica / Semáforo Rojo)
    v_paciente_b_id UUID := gen_random_uuid();
    v_cirugia_b_id UUID := gen_random_uuid();
    v_pauta_b1_id UUID := gen_random_uuid();
    v_pauta_b2_id UUID := gen_random_uuid();
    v_pauta_b3_id UUID := gen_random_uuid();
    v_pauta_b4_id UUID := gen_random_uuid();
BEGIN
    -- --------------------------------------------------------------------------
    -- CASO A: Carlos Mendoza (Cirugía en 48 horas - Preparación Óptima / Verde)
    -- --------------------------------------------------------------------------
    INSERT INTO pacientes (id, nombre_completo, documento, telefono, edad, contacto_emergencia)
    VALUES (v_paciente_a_id, 'Carlos Alberto Mendoza', '1020304050', '+57 300 123 4567', 58, 'Marta Mendoza (Hija) - 301 987 6543');

    INSERT INTO cirugias (id, paciente_id, tipo_cirugia, fecha_programada, estado)
    VALUES (v_cirugia_a_id, v_paciente_a_id, 'Colecistectomía Laparoscópica', NOW() + INTERVAL '48 hours', 'programada');

    -- Pautas Paciente A
    INSERT INTO pautas (id, cirugia_id, titulo, descripcion, horas_previas, es_critica, fecha_limite) VALUES
    (v_pauta_a1_id, v_cirugia_a_id, 'Suspensión de Anticoagulantes/Aspirina', 'Suspender ácido acetilsalicílico o anticoagulantes orales según prescripción médica.', 72, true, (NOW() + INTERVAL '48 hours') - INTERVAL '72 hours'),
    (v_pauta_a2_id, v_cirugia_a_id, 'Dieta Ligera e Hidratación', 'Consumir alimentos de fácil digestión, evitar grasas y lácteos pesados.', 48, false, (NOW() + INTERVAL '48 hours') - INTERVAL '48 hours'),
    (v_pauta_a3_id, v_cirugia_a_id, 'Ducha Prequirúrgica con Clorhexidina', 'Realizar baño corporal completo con jabón antiséptico especial la noche anterior.', 24, true, (NOW() + INTERVAL '48 hours') - INTERVAL '24 hours'),
    (v_pauta_a4_id, v_cirugia_a_id, 'Ayuno Total de Sólidos y Líquidos', 'No ingerir ningún tipo de alimento sólido ni agua a partir de este momento.', 8, true, (NOW() + INTERVAL '48 hours') - INTERVAL '8 hours');

    -- Checkins Paciente A (Completó las que ya vencieron)
    INSERT INTO checkins (pauta_id, estado, fecha_respuesta, observaciones) VALUES
    (v_pauta_a1_id, 'completado', NOW() - INTERVAL '24 hours', 'Medicamento suspendido desde el lunes.'),
    (v_pauta_a2_id, 'completado', NOW() - INTERVAL '2 hours', 'Cena ligera cumplida sin problemas.'),
    (v_pauta_a3_id, 'pendiente', NULL, NULL),
    (v_pauta_a4_id, 'pendiente', NULL, NULL);

    -- Alerta Paciente A (Verde)
    INSERT INTO alertas (paciente_id, cirugia_id, nivel, mensaje, atendida)
    VALUES (v_paciente_a_id, v_cirugia_a_id, 'verde', 'Paciente con check-ins críticos al día. Procedimiento en 48h con preparación óptima.', false);

    -- --------------------------------------------------------------------------
    -- CASO B: Elena Restrepo (Cirugía en 6 horas - RIESGO DE CANCELACIÓN / Rojo)
    -- --------------------------------------------------------------------------
    INSERT INTO pacientes (id, nombre_completo, documento, telefono, edad, contacto_emergencia)
    VALUES (v_paciente_b_id, 'Elena María Restrepo', '9876543210', '+57 312 456 7890', 67, 'Andrés Gómez (Esposo) - 315 222 3344');

    INSERT INTO cirugias (id, paciente_id, tipo_cirugia, fecha_programada, estado)
    VALUES (v_cirugia_b_id, v_paciente_b_id, 'Artroplastia Total de Cadera', NOW() + INTERVAL '6 hours', 'en_preparacion');

    -- Pautas Paciente B
    INSERT INTO pautas (id, cirugia_id, titulo, descripcion, horas_previas, es_critica, fecha_limite) VALUES
    (v_pauta_b1_id, v_cirugia_b_id, 'Suspensión de Antiinflamatorios', 'No tomar Ibuprofeno, Naproxeno o similares.', 72, true, (NOW() + INTERVAL '6 hours') - INTERVAL '72 hours'),
    (v_pauta_b2_id, v_cirugia_b_id, 'Ducha Antiséptica con Clorhexidina', 'Lavado cuidadoso de la zona inguinal y cadera con solución jabonosa.', 24, true, (NOW() + INTERVAL '6 hours') - INTERVAL '24 hours'),
    (v_pauta_b3_id, v_cirugia_b_id, 'Ayuno Estricto de Sólidos', 'AYUNO OBLIGATORIO: Cero alimentos sólidos para evitar broncoaspiración anestésica.', 8, true, (NOW() + INTERVAL '6 hours') - INTERVAL '8 hours'),
    (v_pauta_b4_id, v_cirugia_b_id, 'Presentación en Admisión con Acompañante', 'Llegada al centro quirúrgico con documentación y kit de aseo personal.', 2, true, (NOW() + INTERVAL '6 hours') - INTERVAL '2 hours');

    -- Checkins Paciente B (Incumplimiento o falta de confirmación de ayuno que venció hace 2 horas)
    INSERT INTO checkins (pauta_id, estado, fecha_respuesta, observaciones) VALUES
    (v_pauta_b1_id, 'completado', NOW() - INTERVAL '60 hours', 'Confirmado por vía telefónica.'),
    (v_pauta_b2_id, 'completado', NOW() - INTERVAL '18 hours', 'Ducha realizada en la noche.'),
    (v_pauta_b3_id, 'pendiente', NULL, 'ALERTA: Han pasado 2 horas del límite y el paciente no ha reportado el inicio de ayuno.'),
    (v_pauta_b4_id, 'pendiente', NULL, NULL);

    -- Alerta Paciente B (Rojo - Cancelación Inminente)
    INSERT INTO alertas (paciente_id, cirugia_id, nivel, mensaje, atendida)
    VALUES (v_paciente_b_id, v_cirugia_b_id, 'rojo', 'RIESGO CRÍTICO DE CANCELACIÓN: Pauta de Ayuno Estricto (-8h) vencida sin confirmación. Cirugía en 6 horas.', false);

END $$;
