-- ==============================================================================
-- ECOSISTEMA PREOPERATORIO "TECH-AND-TOUCH" (FASE 1: MVP BASE)
-- MÓDULO EDUCATIVO PREOPERATORIO ENRIQUECIDO (RD1 & AISLAMIENTO DE ROLES)
-- Script de actualización: update_materiales_educativos.sql
-- ==============================================================================

-- 1. AMPLIACIÓN DE LA TABLA 'CIRUGIAS' PARA METADATOS CLÍNICOS EMPÁTICOS
ALTER TABLE cirugias 
    ADD COLUMN IF NOT EXISTS nombre_sencillo VARCHAR(255),
    ADD COLUMN IF NOT EXISTS duracion_estimada VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tipo_anestesia VARCHAR(255),
    ADD COLUMN IF NOT EXISTS sensacion_anestesia TEXT,
    ADD COLUMN IF NOT EXISTS tiempo_recuperacion_sala VARCHAR(100),
    ADD COLUMN IF NOT EXISTS dias_incapacidad_estimados VARCHAR(100);

-- Actualizar cirugías existentes con metadatos descriptivos en lenguaje claro
UPDATE cirugias
SET 
    nombre_sencillo = 'Cirugía de vesícula por laparoscopia',
    duracion_estimada = '60 a 90 minutos',
    tipo_anestesia = 'Anestesia General (Sueño profundo y seguro)',
    sensacion_anestesia = 'Sentirás una suave calidez reconfortante en el brazo y te quedarás plácidamente dormido en segundos sin sentir dolor alguno.',
    tiempo_recuperacion_sala = '1 a 2 horas en Sala de Recuperación (URPA)',
    dias_incapacidad_estimados = '3 a 5 días de reposo relativo en casa'
WHERE tipo_cirugia = 'Colecistectomía Laparoscópica';

UPDATE cirugias
SET 
    nombre_sencillo = 'Reemplazo total de cadera con prótesis',
    duracion_estimada = '90 a 120 minutos',
    tipo_anestesia = 'Anestesia Regional (Epidural) + Sedación Suave',
    sensacion_anestesia = 'Adormecimiento completo y relajante de la mitad inferior de tu cuerpo con una agradable sensación de descanso.',
    tiempo_recuperacion_sala = '2 a 3 horas en Sala de Recuperación (URPA)',
    dias_incapacidad_estimados = '15 a 30 días con fisioterapia progresiva'
WHERE tipo_cirugia = 'Artroplastia Total de Cadera';


-- 2. FLEXIBILIZACIÓN DE CATEGORÍAS EN 'MATERIALES_EDUCATIVOS'
ALTER TABLE materiales_educativos 
    DROP CONSTRAINT IF EXISTS materiales_educativos_categoria_check;

ALTER TABLE materiales_educativos 
    ADD CONSTRAINT materiales_educativos_categoria_check 
    CHECK (categoria IN ('que_esperar', 'preparacion_fisica', 'tecnica_quirurgica', 'cuidados_generales', 'guia_maleta', 'recorrido', 'faq'));


-- 3. LIMPIEZA Y REINSERCIÓN DE MATERIALES ENRIQUECIDOS (COLECISTECTOMÍA Y CADERA)
DELETE FROM materiales_educativos WHERE tipo_cirugia IN ('Colecistectomía Laparoscópica', 'Artroplastia Total de Cadera');

DO $$
DECLARE
    v_cirugia_carlos_id UUID;
    v_cirugia_elena_id UUID;
BEGIN
    SELECT id INTO v_cirugia_carlos_id FROM cirugias WHERE tipo_cirugia = 'Colecistectomía Laparoscópica' LIMIT 1;
    SELECT id INTO v_cirugia_elena_id FROM cirugias WHERE tipo_cirugia = 'Artroplastia Total de Cadera' LIMIT 1;

    -- --------------------------------------------------------------------------
    -- MATERIALES ENRIQUECIDOS: COLECISTECTOMÍA LAPAROSCÓPICA (Caso Carlos Mendoza)
    -- --------------------------------------------------------------------------
    
    -- VIDEO DIDÁCTICO
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_carlos_id,
        'Colecistectomía Laparoscópica',
        'tecnica_quirurgica',
        'video',
        '¿Cómo funciona la Cirugía Laparoscópica de Vesícula?',
        'Conoce en 3 minutos la técnica de mínima invasión y cómo nuestro equipo cuidará de ti sin cortes grandes.',
        '### ¿Qué es una Colecistectomía Laparoscópica?
Es un procedimiento quirúrgico seguro donde el cirujano retira la vesícula biliar a través de **4 pequeñas incisiones milimétricas** (de entre 5 mm y 10 mm) en lugar de una herida abierta tradicional.

#### Beneficios clave para ti:
- **Menor dolor posoperatorio:** Al no cortar músculos grandes, la molestia es mínima y fácil de manejar con analgésicos.
- **Recuperación acelerada:** Podrás incorporarte y caminar el mismo día de la cirugía.
- **Cicatrices diminutas:** Sanan en pocas semanas dejando marcas casi imperceptibles.',
        'https://www.youtube.com/embed/5qap5aO4i9A',
        1
    );

    -- INFOGRAFÍA ANATÓMICA
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_carlos_id,
        'Colecistectomía Laparoscópica',
        'tecnica_quirurgica',
        'infografia',
        'Anatomía y los 4 Puntos de Acceso Mínimo',
        'Guía visual que ilustra las 4 diminutas entradas y explica por qué tu digestión continuará funcionando con normalidad.',
        '### ¿Qué ocurre en tu cuerpo al retirar la vesícula?
La vesícula no produce la bilis; solo sirve de pequeño tanque de almacenamiento. El hígado es quien produce la bilis continuamente.

Tras la cirugía:
1. El hígado seguirá produciendo bilis normalmente.
2. La bilis fluirá directamente al intestino para digerir los alimentos.
3. Después de un periodo breve de adaptación con dieta suave (15 a 30 días), volverás a tu alimentación habitual.',
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80',
        2
    );

    -- EL RECORRIDO DE TU CIRUGÍA (5 PASOS DETALLADOS)
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES 
    (
        v_cirugia_carlos_id, 'Colecistectomía Laparoscópica', 'recorrido', 'articulo',
        '1. Ingreso y Admisión', 'Llegada 2 horas antes del procedimiento con tu acompañante.',
        'Llegas a la clínica con tu acompañante. En la recepción de admisión validan tus documentos (cédula, orden médica y exámen prequirúrgico impreso), te colocan tu brazalete de identificación clínica y te asignan un casillero seguro para guardar tus pertenencias.',
        NULL, 10
    ),
    (
        v_cirugia_carlos_id, 'Colecistectomía Laparoscópica', 'recorrido', 'articulo',
        '2. Preparación Inmediata', 'Cambio a bata limpia y canalización suave de vía venosa.',
        'Pasas al área de vestier quirúrgico para colocar la bata cómoda y el gorro antiséptico. La enfermera canalizará una vía venosa en tu brazo con una aguja pequeña para suministrar suero hidratante. El anestesiólogo te saludará y revisará tus constantes.',
        NULL, 11
    ),
    (
        v_cirugia_carlos_id, 'Colecistectomía Laparoscópica', 'recorrido', 'articulo',
        '3. Entrada a Quirófano', 'Ambiente limpio, monitoreo continuo y anestesia confortable.',
        'Ingresas a la sala quirúrgica climatizada. El equipo se presenta. Sentirás cómo los parches de monitorización registran tu pulso rítmicamente. El anestesiólogo te colocará una mascarilla de oxígeno suave y medicación relajante: **te quedarás dormido en segundos.**',
        NULL, 12
    ),
    (
        v_cirugia_carlos_id, 'Colecistectomía Laparoscópica', 'recorrido', 'articulo',
        '4. Sala de Recuperación (URPA)', 'Despertar asistido con mantas térmicas y control del dolor.',
        'Despertarás arropado con mantas térmicas confortables. Una enfermera estará a tu lado verificando que te sientas bien. Si notas cualquier molestia en el abdomen, te suministrará analgésicos intravenosos inmediatos.',
        NULL, 13
    ),
    (
        v_cirugia_carlos_id, 'Colecistectomía Laparoscópica', 'recorrido', 'articulo',
        '5. Criterios de Alta y Regreso', 'Evaluación médica y retorno seguro a casa.',
        'Una vez toleres un vaso de té o agua y puedas incorporarte con apoyo, el cirujano firmará tu alta con la receta de medicamentos y las pautas para casa. Saldrás acompañado en transporte privado.',
        NULL, 14
    );

    -- GUÍA CHECKLIST DE LA MALETA
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_carlos_id, 'Colecistectomía Laparoscópica', 'guia_maleta', 'articulo',
        'Checklist: ¿Qué empacar en tu maleta prequirúrgica?',
        'Lista completa de documentos, ropa y aseo permitidos, junto con las cosas que debes dejar en casa.',
        '### Documentación Obligatoria
- [ ] Documento de identidad original (Cédula de ciudadanía o extranjería).
- [ ] Orden médica quirúrgica y autorización firmada de tu EPS o aseguradora.
- [ ] Resultados físicos de tus exámenes prequirúrgicos (sangre y electrocardiograma).

### Ropa y Confort
- [ ] Ropa muy holgada y fácil de vestir (camisa o blusa con botones al frente para no forzar el abdomen).
- [ ] Calzado plano, cerrado y con suela de goma antideslizante.
- [ ] Muda de ropa interior holgada de algodón.
- [ ] Artículos personales permitidos: cepillo de dientes, crema dental y toalla pequeña.

### ❌ LO QUE DEBES DEJAR EN CASA:
- ❌ Joyas, anillos, aretes, piercing o cadenas (el electrobisturí requiere cuerpo libre de metales).
- ❌ Esmalte de uñas en manos y pies (el oxímetro de pulso no lee a través de esmaltes oscuros).
- ❌ Lentes de contacto (usa tus gafas de marco convencionales).
- ❌ Joyas de alto valor o grandes sumas de dinero en efectivo.',
        NULL, 20
    );

    -- PREGUNTAS FRECUENTES (FAQS)
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES 
    (
        v_cirugia_carlos_id, 'Colecistectomía Laparoscópica', 'faq', 'articulo',
        '¿Sentiré dolor durante o después de la cirugía?',
        'Explicación transparente sobre el protocolo de anestesia y analgesia.',
        '**Durante la cirugía NO sentirás ningún dolor**, ya que estarás bajo anestesia general profunda monitoreada segundo a segundo por un médico anestesiólogo especialista.\n\nDespués de la cirugía es normal sentir una sensación de distensión o tirantez abdominal similar a haber hecho ejercicio. En la sala de recuperación te suministraremos analgésicos inmediatos para que te sientas completamente cómodo.',
        NULL, 30
    ),
    (
        v_cirugia_carlos_id, 'Colecistectomía Laparoscópica', 'faq', 'articulo',
        '¿Qué hago si tengo tos, fiebre o resfriado el día anterior?',
        'Pauta clínica ante síntomas respiratorios repentinos.',
        'Si presentas fiebre, tos con flema, secreción nasal abundante o congestión fuerte el día anterior a tu cirugía, **debes avisar a nuestro equipo de enfermería de inmediato** a través de la línea de ayuda del portal.\n\nEl equipo médico evaluará la inflamación de tu vía respiratoria para decidir si es seguro continuar o si es mejor reprogramar unos días para garantizar tu total seguridad.',
        NULL, 31
    ),
    (
        v_cirugia_carlos_id, 'Colecistectomía Laparoscópica', 'faq', 'articulo',
        '¿Puedo tomar agua con mis medicamentos habituales de la mañana?',
        'Regla médica sobre la ingesta de fármacos matutinos.',
        'Solo debes tomar los medicamentos que tu anestesiólogo o cirujano te haya indicado explícitamente durante la cita prequirúrgica (por ejemplo, antihipertensivos en dosis específica).\n\nSi te autorizaron tomarlo, hazlo **con un solo sorbo de agua muy pequeño (máximo un trago)** al menos 2 horas antes de tu hora de llegada. No consumas nada más.',
        NULL, 32
    ),
    (
        v_cirugia_carlos_id, 'Colecistectomía Laparoscópica', 'faq', 'articulo',
        '¿Quién me debe acompañar para el regreso a casa?',
        'Requisito obligatorio de acompañante adulto responsable.',
        'Es un requisito obligatorio ingresar y salir del hospital con **un adulto responsable de tu confianza**.\n\nTras la anestesia no podrás conducir ni tomar transporte público tú solo. Tu acompañante escuchará las recomendaciones del cirujano, reclamará la fórmula médica y te acompañará en vehículo privado o taxi hasta tu hogar.',
        NULL, 33
    );

    -- --------------------------------------------------------------------------
    -- MATERIALES ENRIQUECIDOS: ARTROPLASTIA DE CADERA (Caso Elena Restrepo)
    -- --------------------------------------------------------------------------
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES 
    (
        v_cirugia_elena_id, 'Artroplastia Total de Cadera', 'tecnica_quirurgica', 'video',
        '¿Cómo funciona la Prótesis Total de Cadera?',
        'Video explicativo de 3 minutos sobre la sustitución articular y la pronta recuperación del caminar.',
        '### Reemplazo de Cadera: De vuelta a una vida sin dolor
El procedimiento sustituye las superficies desgastadas por componentes biocompatibles de titanio y cerámica diseñados para durar décadas.',
        'https://www.youtube.com/embed/5qap5aO4i9A', 1
    ),
    (
        v_cirugia_elena_id, 'Artroplastia Total de Cadera', 'faq', 'articulo',
        '¿Sentiré dolor durante o después de la cirugía?',
        'Explicación de anestesia regional y analgesia postoperatoria.',
        'Durante el procedimiento estarás con anestesia epidural y sedación profunda sin sentir absolutamente nada en las piernas. Al despertar tendrás una bomba de analgesia continua.',
        NULL, 30
    ),
    (
        v_cirugia_elena_id, 'Artroplastia Total de Cadera', 'faq', 'articulo',
        '¿Qué hago si tengo tos, fiebre o resfriado el día anterior?',
        'Pautas clínicas respiratorias.',
        'Infórmalo inmediatamente a la clínica para evaluar tu estado bronquial antes del ingreso.',
        NULL, 31
    ),
    (
        v_cirugia_elena_id, 'Artroplastia Total de Cadera', 'faq', 'articulo',
        '¿Puedo tomar agua con mis medicamentos de la mañana?',
        'Indicación estricta de fármacos autorizados.',
        'Toma únicamente los medicamentos autorizados por el anestesiólogo con un sorbo mínimo de agua.',
        NULL, 32
    ),
    (
        v_cirugia_elena_id, 'Artroplastia Total de Cadera', 'faq', 'articulo',
        '¿Quién me debe acompañar para el regreso a casa?',
        'Requisito de transporte asistido.',
        'Debes contar con un familiar o acompañante adulto para apoyarte en el traslado e ingreso al hogar.',
        NULL, 33
    );

END $$;
