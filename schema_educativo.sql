-- ==============================================================================
-- ECOSISTEMA PREOPERATORIO "TECH-AND-TOUCH" (FASE 1: MVP BASE)
-- MÓDULO EDUCATIVO PREOPERATORIO (Requerimiento de Diseño RD1)
-- Script complementario: schema_educativo.sql
-- ==============================================================================

-- 1. TABLA: MATERIALES EDUCATIVOS PREQUIRÚRGICOS
CREATE TABLE IF NOT EXISTS materiales_educativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cirugia_id UUID REFERENCES cirugias(id) ON DELETE CASCADE,
    tipo_cirugia VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL 
        CHECK (categoria IN ('que_esperar', 'preparacion_fisica', 'tecnica_quirurgica', 'cuidados_generales', 'guia_maleta')),
    tipo_recurso VARCHAR(50) NOT NULL 
        CHECK (tipo_recurso IN ('video', 'imagen', 'infografia', 'articulo', 'pdf')),
    titulo VARCHAR(255) NOT NULL,
    descripcion_corta TEXT NOT NULL,
    contenido_markdown TEXT,
    url_recurso TEXT,
    orden_visualizacion INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_materiales_tipo_cirugia ON materiales_educativos(tipo_cirugia);
CREATE INDEX IF NOT EXISTS idx_materiales_cirugia_id ON materiales_educativos(cirugia_id);
CREATE INDEX IF NOT EXISTS idx_materiales_categoria ON materiales_educativos(categoria);

-- 3. HABILITACIÓN DE REALTIME Y RLS
ALTER TABLE materiales_educativos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE materiales_educativos;

ALTER TABLE materiales_educativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total a materiales_educativos (dev)" 
    ON materiales_educativos FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. DATOS SEMILLA EDUCATIVOS (Casos de prueba para Colecistectomía y Cadera)
-- ==============================================================================

DO $$
DECLARE
    v_cirugia_carlos_id UUID;
    v_cirugia_elena_id UUID;
BEGIN
    -- Obtenemos los IDs de las cirugías semilla existentes (si ya se corrió schema.sql)
    SELECT id INTO v_cirugia_carlos_id FROM cirugias WHERE tipo_cirugia = 'Colecistectomía Laparoscópica' LIMIT 1;
    SELECT id INTO v_cirugia_elena_id FROM cirugias WHERE tipo_cirugia = 'Artroplastia Total de Cadera' LIMIT 1;

    -- --------------------------------------------------------------------------
    -- MATERIALES PARA COLECISTECTOMÍA LAPAROSCÓPICA (Caso Carlos Mendoza)
    -- --------------------------------------------------------------------------
    
    -- Recurso 1: Video Didáctico Embebible (Qué esperar de la cirugía y anestesia)
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_carlos_id,
        'Colecistectomía Laparoscópica',
        'tecnica_quirurgica',
        'video',
        '¿Cómo funciona la Cirugía Laparoscópica de Vesícula?',
        'Conoce en 3 minutos el procedimiento de mínima invasión y cómo nuestro equipo cuidará de ti sin grandes incisiones.',
        '### ¿Qué es una Colecistectomía Laparoscópica?
Es un procedimiento quirúrgico seguro donde el cirujano retira la vesícula biliar a través de **pequeñas incisiones milimétricas** (de entre 5 mm y 10 mm) en lugar de una herida abierta tradicional.

#### Beneficios clave para ti:
- **Menor dolor posoperatorio:** Al no cortar músculos grandes, la molestia es muy baja.
- **Recuperación acelerada:** Podrás levantarte y caminar el mismo día de la intervención.
- **Mínima cicatriz:** Cicatrices diminutas que sanan rápidamente.',
        'https://www.youtube.com/embed/5qap5aO4i9A',
        1
    );

    -- Recurso 2: Infografía Anatómica Explicativa
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_carlos_id,
        'Colecistectomía Laparoscópica',
        'tecnica_quirurgica',
        'infografia',
        'Anatomía y los 4 Puntos de Acceso Mínimo',
        'Guía visual ilustrada que muestra la ubicación de los 4 pequeños puertos y por qué tu cuerpo seguirá digiriendo los alimentos con normalidad.',
        '### ¿Qué pasa en tu organismo sin la vesícula?
La vesícula no produce la bilis; únicamente la almacena. El hígado es quien realmente la produce. 

Tras la cirugía:
1. Tu hígado seguirá produciendo bilis normalmente.
2. La bilis fluirá directamente al intestino para digerir las grasas.
3. Tras un breve periodo de adaptación con dieta blanda, tu digestión volverá a la normalidad.',
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80',
        2
    );

    -- Recurso 3: Guía Maleta e Ingreso Hospitalario
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_carlos_id,
        'Colecistectomía Laparoscópica',
        'guia_maleta',
        'articulo',
        'Checklist: ¿Qué llevar al hospital el día de tu ingreso?',
        'Lista práctica para empacar sin estrés. Conoce qué cosas son obligatorias y qué objetos es mejor dejar en casa.',
        '### Documentación Indispensable
- [ ] Documento de identidad original (Cédula de Ciudadanía o extranjería).
- [ ] Orden médica y autorización de tu EPS o aseguradora.
- [ ] Resultados físicos de tus exámenes prequirúrgicos (electrocardiograma y analítica de sangre).

### Ropa y Confort
- [ ] Ropa muy holgada y cómoda (preferiblemente blusa o camisa abotonada al frente).
- [ ] Calzado plano, cerrado y con suela antideslizante.
- [ ] Muda de ropa interior holgada de algodón.

### Lo que DEBES dejar en casa:
- ❌ Joyas, anillos, aretes o cadenas (por protocolo de electrocauterio).
- ❌ Esmalte en uñas de manos y pies (impide la lectura del oxímetro de pulso).
- ❌ Lentes de contacto (usa tus gafas de marco habituales).
- ❌ Grandes cantidades de dinero en efectivo.',
        NULL,
        3
    );

    -- Recurso 4: El Día de la Cirugía Paso a Paso
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_carlos_id,
        'Colecistectomía Laparoscópica',
        'que_esperar',
        'articulo',
        '¿Qué pasará minuto a minuto el día de tu cirugía?',
        'Conoce cada estación del hospital para que nada te tome por sorpresa: desde la admisión hasta tu regreso a casa.',
        '### La Ruta Segura de tu Atención

#### 1. Admisión y Registro (2 horas antes)
Llegas con tu acompañante. El equipo valida tus documentos y te entrega tu brazalete de identificación clínica.

#### 2. Preparación Prequirúrgica
Pasas al área vestier, te pones la bata quirúrgica. La enfermera te canalizará una pequeña vía venosa en el brazo para hidratación. Conocerás a tu anestesiólogo, quien resolverá tus últimas dudas.

#### 3. Quirófano
Entras a una sala limpia y climatizada. Sentirás cómo el monitor de signos vitales comienza a registrar tu pulso. El anestesiólogo te administrará una medicación relajante por la vena y te colocará una mascarilla de oxígeno suave. **Te quedarás dormido plácidamente en segundos.**

#### 4. Sala de Recuperación (URPA)
Despertarás arropado con mantas térmicas. Sentirás el abdomen algo tirante (similar a haber hecho mucho ejercicio abdominal). La enfermera te administrará analgésicos inmediatos si sientes molestia.

#### 5. Alta y Camino a Casa
Una vez toleres un vaso de líquido y puedas caminar con asistencia, el cirujano firmará tu alta con las pautas de cuidado domiciliario.',
        NULL,
        4
    );

    -- Recurso 5: Preguntas Frecuentes y Control de Ansiedad
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_carlos_id,
        'Colecistectomía Laparoscópica',
        'cuidados_generales',
        'articulo',
        'Preguntas Frecuentes: Despejando Miedos Habituales',
        'Respuestas empáticas a las dudas que más suelen preocupar a nuestros pacientes antes de entrar al quirófano.',
        '### ¿Sentiré dolor durante la cirugía?
**Absolutamente no.** Estarás bajo anestesia general controlada por un médico especialista dedicado exclusivamente a vigilar tus constantes vitales y asegurar que estés en un sueño profundo y sin dolor.

### ¿Por qué es tan estricto el ayuno de 8 horas?
Cuando estás bajo anestesia, los reflejos normales que protegen tu vía respiratoria se relajan. Tener el estómago completamente vacío garantiza que ningún jugo gástrico o residuo de comida pueda ascender hacia tus pulmones. ¡Cumplirlo salva vidas!

### ¿Es normal sentir ansiedad o miedo?
**Totalmente normal.** La incertidumbre produce temor natural. Respira profundo con técnica 4-7-8 (inhalar en 4 seg, sostener en 7, exhalar en 8). Todo nuestro equipo está capacitado en contención humana y cuidado cálido.',
        NULL,
        5
    );

    -- --------------------------------------------------------------------------
    -- MATERIAL EXTRA: Artroplastia Total de Cadera (Caso Elena Restrepo)
    -- --------------------------------------------------------------------------
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_elena_id,
        'Artroplastia Total de Cadera',
        'tecnica_quirurgica',
        'articulo',
        'Reemplazo Articular: Recuperando tu Movilidad y Alivio del Dolor',
        'Entiende en qué consiste la prótesis de cadera de titanio/cerámica y cómo te devolverá la independencia al caminar.',
        '### El Objetivo: Una Vida Sin Dolor
El reemplazo articular sustituye las superficies desgastadas de la articulación por componentes biocompatibles diseñados para durar décadas.

1. **Retiro del cartílago desgastado:** Se pule con precisión la cabeza femoral y el acetábulo.
2. **Fijación del componente protésico:** Se inserta el implante que reproducirá el movimiento natural.
3. **Inicio precoz de fisioterapia:** Dentro de las primeras 24 horas aprenderás a dar tus primeros pasos con andador asistido.',
        NULL,
        1
    );

END $$;
