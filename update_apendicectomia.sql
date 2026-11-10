-- ==============================================================================
-- ECOSISTEMA PREOPERATORIO "TECH-AND-TOUCH"
-- ACTUALIZACIÓN A APENDICECTOMÍA LAPAROSCÓPICA (CIRUGÍA DE APÉNDICE POR MÍNIMA INVASIÓN)
-- Script: update_apendicectomia.sql
-- ==============================================================================

-- 1. ASEGURAR COLUMNAS EN LA TABLA 'CIRUGIAS'
ALTER TABLE cirugias 
    ADD COLUMN IF NOT EXISTS nombre_sencillo VARCHAR(255),
    ADD COLUMN IF NOT EXISTS especialidad VARCHAR(100),
    ADD COLUMN IF NOT EXISTS duracion_estimada VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tipo_anestesia VARCHAR(255),
    ADD COLUMN IF NOT EXISTS sensacion_anestesia TEXT,
    ADD COLUMN IF NOT EXISTS tiempo_recuperacion VARCHAR(150),
    ADD COLUMN IF NOT EXISTS tiempo_recuperacion_sala VARCHAR(100),
    ADD COLUMN IF NOT EXISTS dias_incapacidad_estimados VARCHAR(100);

-- 2. ASEGURAR VALORES PERMITIDOS EN 'MATERIALES_EDUCATIVOS'
ALTER TABLE materiales_educativos 
    DROP CONSTRAINT IF EXISTS materiales_educativos_categoria_check;

ALTER TABLE materiales_educativos 
    ADD CONSTRAINT materiales_educativos_categoria_check 
    CHECK (categoria IN ('que_esperar', 'preparacion_fisica', 'tecnica_quirurgica', 'cuidados_generales', 'guia_maleta', 'recorrido', 'faq'));

-- 3. TRANSACCIÓN DE ACTUALIZACIÓN DE DATOS (CASO CARLOS MENDOZA / APENDICECTOMÍA)
DO $$
DECLARE
    v_paciente_id UUID;
    v_cirugia_id UUID;
    v_fecha_cirugia TIMESTAMPTZ;
BEGIN
    -- Localizar al paciente de prueba Carlos Mendoza o el ID fijo demo
    SELECT id INTO v_paciente_id 
    FROM pacientes 
    WHERE id = '11111111-1111-4111-a111-111111111111' 
       OR nombre_completo ILIKE '%Carlos%Mendoza%' 
    LIMIT 1;

    -- Si no existe por ID/nombre, buscar el primer paciente
    IF v_paciente_id IS NULL THEN
        SELECT id INTO v_paciente_id FROM pacientes ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- Localizar la cirugía asociada
    SELECT id, fecha_programada INTO v_cirugia_id, v_fecha_cirugia 
    FROM cirugias 
    WHERE paciente_id = v_paciente_id 
    LIMIT 1;

    -- Si no se encontró cirugía, buscar por tipo anterior
    IF v_cirugia_id IS NULL THEN
        SELECT id, fecha_programada INTO v_cirugia_id, v_fecha_cirugia 
        FROM cirugias 
        WHERE tipo_cirugia = 'Colecistectomía Laparoscópica' 
        LIMIT 1;
    END IF;

    IF v_fecha_cirugia IS NULL THEN
        v_fecha_cirugia := timezone('utc'::text, now()) + interval '48 hours';
    END IF;

    -- A) ACTUALIZAR CIRUGÍA A APENDICECTOMÍA LAPAROSCÓPICA
    UPDATE cirugias
    SET 
        tipo_cirugia = 'Apendicectomía Laparoscópica',
        nombre_sencillo = 'Cirugía de apéndice por mínima invasión (laparoscopia)',
        especialidad = 'Cirugía General',
        duracion_estimada = '45 a 60 minutos',
        tipo_anestesia = 'Anestesia General',
        sensacion_anestesia = 'Sentirás una suave calidez en el brazo y te quedarás plácidamente dormido en segundos sin sentir dolor alguno.',
        tiempo_recuperacion = '24 a 48 horas de estancia ambulatoria / observación',
        tiempo_recuperacion_sala = '1 a 2 horas en Sala de Recuperación (URPA)',
        dias_incapacidad_estimados = '7 a 15 días con reincorporación gradual'
    WHERE id = v_cirugia_id;

    -- B) ACTUALIZAR PAUTAS PREQUIRÚRGICAS (CHECK-INS VERÍDICOS)
    -- Eliminar checkins y pautas anteriores vinculadas a esta cirugía
    DELETE FROM checkins WHERE pauta_id IN (SELECT id FROM pautas WHERE cirugia_id = v_cirugia_id);
    DELETE FROM pautas WHERE cirugia_id = v_cirugia_id;

    -- Pauta 1: -24h Fármacos
    INSERT INTO pautas (
        cirugia_id, titulo, descripcion, horas_previas, es_critica, fecha_limite
    ) VALUES (
        v_cirugia_id,
        'Suspensión o Ajuste de Fármacos y Anticoagulantes',
        'Suspender o ajustar antiinflamatorios (ibuprofeno, aspirina) y anticoagulantes según orden médica previa para evitar riesgo de sangrado.',
        24,
        true,
        v_fecha_cirugia - interval '24 hours'
    );

    -- Pauta 2: -12h Higiene Corporal y Limpieza Umbilical
    INSERT INTO pautas (
        cirugia_id, titulo, descripcion, horas_previas, es_critica, fecha_limite
    ) VALUES (
        v_cirugia_id,
        'Ducha Corporal Antiséptica y Limpieza Umbilical',
        'Ducha corporal con jabón antiséptico (o jabón neutro), con énfasis en la limpieza suave del área umbilical (ombligo) y abdomen, secando con toalla limpia.',
        12,
        false,
        v_fecha_cirugia - interval '12 hours'
    );

    -- Pauta 3: -8h Ayuno Absoluto de Sólidos (Crítica)
    INSERT INTO pautas (
        cirugia_id, titulo, descripcion, horas_previas, es_critica, fecha_limite
    ) VALUES (
        v_cirugia_id,
        'Ayuno Absoluto de Sólidos (CRÍTICO)',
        'Ayuno absoluto de sólidos: no ingerir carnes, harinas, grasas ni alimentos pesados para garantizar estómago vacío durante la intubación.',
        8,
        true,
        v_fecha_cirugia - interval '8 hours'
    );

    -- Pauta 4: -2h Ayuno Estricto de Líquidos Claros (Crítica)
    INSERT INTO pautas (
        cirugia_id, titulo, descripcion, horas_previas, es_critica, fecha_limite
    ) VALUES (
        v_cirugia_id,
        'Ayuno Estricto de Líquidos Claros (CRÍTICO)',
        'Ayuno estricto de líquidos: prohibido agua, té, jugos, café, leche o chicles para prevenir broncoaspiración durante la intubación anestésica.',
        2,
        true,
        v_fecha_cirugia - interval '2 hours'
    );

    -- Pauta 5: -2h Presentación Quirúrgica y Retiro de Objetos
    INSERT INTO pautas (
        cirugia_id, titulo, descripcion, horas_previas, es_critica, fecha_limite
    ) VALUES (
        v_cirugia_id,
        'Retiro de Esmaltes, Piercings y Joyas',
        'Retiro de esmaltes de uñas (para permitir la lectura del oxímetro de pulso), piercings, joyas, maquillaje y prótesis dentales removibles antes de ingresar.',
        2,
        true,
        v_fecha_cirugia - interval '2 hours'
    );

    -- C) ACTUALIZAR MATERIALES EDUCATIVOS ENRIQUECIDOS (RD1)
    DELETE FROM materiales_educativos 
    WHERE cirugia_id = v_cirugia_id 
       OR tipo_cirugia IN ('Colecistectomía Laparoscópica', 'Apendicectomía Laparoscópica');

    -- 1. Video Explicativo de la Técnica
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta,
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'tecnica_quirurgica',
        'video',
        '¿Cómo funciona la Cirugía Laparoscópica de Apéndice?',
        'Conoce en 3 minutos la técnica de mínima invasión mediante 3 pequeñas incisiones y microcámara para extraer el apéndice sin dolor excesivo.',
        '### ¿Qué es una Apendicectomía Laparoscópica?
Es la extirpación quirúrgica del **apéndice cecal inflamado** mediante una técnica de **mínima invasión**. En lugar de un corte abierto tradicional, el cirujano utiliza una microcámara (laparoscopio) e instrumentos milimétricos.

#### ¿Cómo se realiza la intervención?
1. **3 incisiones milimétricas:** Una incisión diminuta en el ombligo (para la microcámara HD) y dos en la parte inferior del abdomen (de 5 a 10 mm) para instrumentos de máxima precisión.
2. **Visualización en alta definición:** La microcámara ilumina y amplifica la cavidad abdominal en un monitor quirúrgico especializado.
3. **Extracción segura:** El apéndice inflamado se aísla, se sella en su base y se extrae dentro de una pequeña bolsa estéril protectora, lavando suavemente la zona.

#### Beneficios clave para ti:
- **Menor dolor posoperatorio:** Al no seccionar grandes masas musculares, el dolor es mínimo y controlable con analgésicos suaves.
- **Rápida recuperación:** Podrás incorporarte y caminar el mismo día de la intervención.
- **Cicatrices casi invisibles:** Incisiones milimétricas que cicatrizan en pocas semanas dejando marcas estéticas mínimas.',
        '/videos/apendicectomia-laparoscopica.mp4',
        1
    );

    -- 2. Infografía Anatómica: Anatomía y los 3 Puertos
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta,
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'tecnica_quirurgica',
        'infografia',
        'Anatomía del Apéndice y los 3 Puertos de Mínima Invasión',
        'Guía visual ilustrada que muestra la ubicación del apéndice en la fosa ilíaca derecha y los 3 diminutos accesos milimétricos.',
        '### ¿Dónde está el apéndice y qué función cumple?
El apéndice cecal es un pequeño conducto cilíndrico conectado al inicio del intestino grueso, localizado en la parte inferior derecha del abdomen (fosa ilíaca derecha).

#### Tu cuerpo sin apéndice:
El apéndice no es un órgano vital. Su extracción no altera en absoluto la absorción de nutrientes, la digestión de alimentos ni el tránsito intestinal regular.

#### Ubicación de los 3 puertos laparoscópicos:
1. **Puerto Umbilical (10 mm):** Permite el paso de la microcámara óptica. Queda camuflado en el pliegue natural del ombligo.
2. **Puerto Suprapúbico (5 mm):** Ubicado en la línea baja del abdomen (zona del vello púbico).
3. **Puerto Fosa Ilíaca Izquierda (5 mm):** Punto de trabajo delicado para movilizar y sellar los vasos del apéndice con pinzas milimétricas.',
        '/images/infografia-apendice.png',
        2
    );

    -- 3. Recorrido el Día de la Cirugía (Paso a Paso)
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta,
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES 
    (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'recorrido',
        'articulo',
        '1. Admisión Hospitalaria y Registro',
        'Llegada 2 horas antes con tu acompañante para validación documental y consentimiento.',
        'Llegas a la clínica 2 horas antes de la cirugía con tu acompañante. En admisión validan tu documento de identidad original, orden médica y resultados prequirúrgicos impresos. El personal verifica el estricto cumplimiento del ayuno y te coloca tu brazalete de identificación clínica.',
        NULL,
        10
    ),
    (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'recorrido',
        'articulo',
        '2. Preparación Preanestésica y Vía Intravenosa',
        'Cambio a bata quirúrgica y canalización suave de vía venosa en el brazo.',
        'Pasas al área de vestier para colocarte la bata quirúrgica limpia y gorro desechable. La enfermera canaliza una pequeña vía intravenosa en tu antebrazo con una aguja fina para suero hidratante y protectores gástricos. Conocerás a tu anestesiólogo, quien revisará tus signos vitales y despejará cualquier inquietud.',
        NULL,
        11
    ),
    (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'recorrido',
        'articulo',
        '3. Paso a Quirófano y Anestesia General',
        'Entorno quirúrgico climatizado, monitorización continua y sueño profundo sin dolor.',
        'Ingresas a la sala quirúrgica estéril. El equipo asistencial se presenta. Te colocarán parches adhesivos para registrar tu pulso y ritmo cardíaco de forma continua. El anestesiólogo te administrará una medicación relajante suave por la vía y una mascarilla de oxígeno: te quedarás plácidamente dormido en segundos.',
        NULL,
        12
    ),
    (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'recorrido',
        'articulo',
        '4. Sala de Recuperación Postanestésica (URPA)',
        'Despertar cálido con mantas térmicas, oxigenación y analgesia inmediata.',
        'Despertarás abrigado con mantas térmicas confortables. Una enfermera especializada estará a tu lado vigilando tus signos vitales y oxigenación. Si sientes alguna molestia abdominal o tirantez, te administrará analgésicos intravenosos inmediatos para garantizar tu confort.',
        NULL,
        13
    ),
    (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'recorrido',
        'articulo',
        '5. Criterios de Alta y Retorno Seguro a Casa',
        'Tolerancia de líquidos orales, micción espontánea y alta con acompañante.',
        'Una vez toleres líquidos suaves por vía oral (agua o aromática), orines de forma espontánea y puedas levantarte a caminar asistido sin mareos, el cirujano firmará el alta hospitalaria con la fórmula de analgésicos y la guía de cuidados para casa.',
        NULL,
        14
    );

    -- 4. Guía de Maleta
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta,
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'guia_maleta',
        'articulo',
        'Checklist: ¿Qué empacar en tu maleta prequirúrgica?',
        'Lista práctica de documentos, ropa holgada que no presione el abdomen bajo y artículos indispensables.',
        '### Documentación Indispensable
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
- ❌ Grandes sumas de dinero o artículos de alto valor.',
        NULL,
        20
    );

    -- 5. Preguntas Frecuentes (FAQs)
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta,
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES 
    (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'faq',
        'articulo',
        '¿Sentiré dolor después de la cirugía y qué es el dolor en el hombro?',
        'Manejo analgésico intravenoso y explicación de la molestia por gas CO2.',
        'Durante la intervención NO sentirás ningún dolor por efecto de la anestesia general. En la sala de recuperación y en casa recibirás analgésicos programados por el equipo médico.\n\nEs muy frecuente y normal sentir una ligera molestia o pinchazo en el hombro derecho o cuello: esto se debe al gas (dióxido de carbono) utilizado para insuflar suavemente el abdomen durante la laparoscopia, el cual puede irritar de forma refleja el nervio frénico. Esta sensación desaparece por completo al caminar suavemente en 24 a 48 horas.',
        NULL,
        30
    ),
    (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'faq',
        'articulo',
        '¿Cuánto tardaré en volver a mis actividades cotidianas y trabajo?',
        'Tiempos de recuperación, caminata precoz y restricciones de esfuerzo físico.',
        'Podrás levantarte y dar caminatas suaves dentro de tu hogar desde el primer día; caminar estimula la digestión y acelera la eliminación de gases.\n\nDurante las primeras 3 a 4 semanas está terminantemente prohibido levantar objetos de más de 5 kg, realizar abdominales o esfuerzos violentos para permitir que los pequeños puertos cicatricen con total solidez interna. La mayoría de los pacientes se reincorporan a labores de oficina o estudio entre los 7 y 15 días.',
        NULL,
        31
    ),
    (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'faq',
        'articulo',
        '¿Por qué son tan estrictas las horas de ayuno de sólidos y líquidos?',
        'Seguridad de la vía respiratoria y prevención de complicaciones anestésicas.',
        'El ayuno de sólidos (8 horas) y líquidos claros (2 horas) asegura que tu estómago esté completamente desocupado. Al recibir anestesia general, los reflejos que protegen tu garganta y pulmones se desactivan temporalmente.\n\nTener el estómago vacío impide que jugos gástricos o residuos de comida asciendan a los pulmones (broncoaspiración). ¡Cumplir este ayuno con exactitud es la regla de oro para tu seguridad!',
        NULL,
        32
    ),
    (
        v_cirugia_id,
        'Apendicectomía Laparoscópica',
        'faq',
        'articulo',
        '¿Qué señales de alarma debo vigilar antes de ingresar a cirugía?',
        'Identificación inmediata de complicaciones o sospecha de perforación.',
        'Si antes de ingresar al hospital presentas fiebre superior a 38.5°C, escalofríos intensos, vómitos repetitivos o un dolor abdominal punzante e insoportable en el lado inferior derecho (fosa ilíaca derecha) que empeora al toser o moverse, debes acudir de inmediato a Urgencias de la clínica para descartar una perforación del apéndice o peritonitis.',
        NULL,
        33
    );

    RAISE NOTICE 'Actualización a Apendicectomía Laparoscópica completada con éxito para la cirugía %', v_cirugia_id;
END $$;
