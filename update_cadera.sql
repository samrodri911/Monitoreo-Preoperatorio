-- ==============================================================================
-- ECOSISTEMA PREOPERATORIO "TECH-AND-TOUCH"
-- ACTUALIZACIÓN DE CONTENIDO EDUCATIVO Y MULTIMEDIA PARA REEMPLAZO DE CADERA
-- Procedimiento: Artroplastia Total de Cadera (Reemplazo con Prótesis)
-- Script: update_cadera.sql
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

-- 3. TRANSACCIÓN DE ACTUALIZACIÓN DE DATOS (CASO ELENA RESTREPO / CADERA)
DO $$
DECLARE
    v_paciente_id UUID;
    v_cirugia_id UUID;
BEGIN
    -- Localizar paciente Elena Restrepo o el ID fijo demo B
    SELECT id INTO v_paciente_id 
    FROM pacientes 
    WHERE id = '33333333-3333-4333-b333-333333333333' 
       OR nombre_completo ILIKE '%Elena%Restrepo%' 
    LIMIT 1;

    -- Localizar la cirugía asociada
    IF v_paciente_id IS NOT NULL THEN
        SELECT id INTO v_cirugia_id 
        FROM cirugias 
        WHERE paciente_id = v_paciente_id 
        LIMIT 1;
    END IF;

    IF v_cirugia_id IS NULL THEN
        SELECT id INTO v_cirugia_id 
        FROM cirugias 
        WHERE tipo_cirugia = 'Artroplastia Total de Cadera' 
        LIMIT 1;
    END IF;

    -- Actualizar metadatos empáticos de la cirugía si existe
    IF v_cirugia_id IS NOT NULL THEN
        UPDATE cirugias
        SET 
            tipo_cirugia = 'Artroplastia Total de Cadera',
            nombre_sencillo = 'Reemplazo total de cadera con prótesis',
            especialidad = 'Ortopedia y Traumatología',
            duracion_estimada = '60 a 90 minutos',
            tipo_anestesia = 'Anestesia Regional (Raquídea/Epidural) + Sedación Suave',
            sensacion_anestesia = 'Adormecimiento completo de la mitad inferior de tu cuerpo con una agradable sensación de descanso y tranquilidad sin dolor.',
            tiempo_recuperacion = '48 a 72 horas de hospitalización',
            tiempo_recuperacion_sala = '2 a 3 horas en Sala de Recuperación (URPA)',
            dias_incapacidad_estimados = '30 a 45 días con fisioterapia progresiva y movilización asistida'
        WHERE id = v_cirugia_id;
    END IF;

    -- Limpiar materiales antiguos del procedimiento de cadera
    DELETE FROM materiales_educativos 
    WHERE tipo_cirugia = 'Artroplastia Total de Cadera' 
       OR (v_cirugia_id IS NOT NULL AND cirugia_id = v_cirugia_id);

    -- =========================================================================
    -- INSERTAR MATERIALES EDUCATIVOS PARA REEMPLAZO TOTAL DE CADERA
    -- =========================================================================

    -- A. CÁPSULA AUDIOVISUAL LOCAL (Video)
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_id,
        'Artroplastia Total de Cadera',
        'tecnica_quirurgica',
        'video',
        'Cápsula Audiovisual Breve: ¿Cómo funciona el Reemplazo Articular de Cadera?',
        'Conoce en 3 minutos el proceso de sustitución del cartílago desgastado por una prótesis biocompatible diseñada para devolver la movilidad natural sin dolor.',
        '### ¿Qué es una Artroplastia Total de Cadera?
Es el procedimiento quirúrgico en el que se sustituye la articulación dañada por la artrosis por componentes protésicos biocompatibles de alta resistencia.

#### ¿Cómo se realiza la intervención?
1. **Preparación y retiro de cartílago desgastado:** Limpieza del acetábulo pélvico y corte milimétrico de la cabeza femoral dañada para recibir los implantes sin fricción dolorosa.
2. **Fijación de componentes protésicos (vástago y copa):** Colocación de la copa acetabular biocompatible en la pelvis y del vástago de titanio en el canal del fémur para máxima estabilidad ósea.
3. **Colocación de esfera articular y comprobación de movilidad:** Inserción de la cabeza esférica pulida, reducción articular y verificación de rangos completos de movimiento sin roce ni dolor.

#### Beneficios clave para ti:
- **Alivio inmediato del dolor por artrosis:** Desaparición del dolor de choque hueso contra hueso.
- **Movilización precoz asistida:** Primeros pasos con andador desde las primeras 24 horas.
- **Calidad de vida y autonomía:** Recuperación de la marcha fluida y descanso nocturno continuo.',
        '/videos/cirugia-cadera.mp4',
        1
    );

    -- B. INFOGRAFÍA ANATÓMICA Y DETALLE DE LA PRÓTESIS
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_id,
        'Artroplastia Total de Cadera',
        'tecnica_quirurgica',
        'infografia',
        'Anatomía Articular y Componentes de la Nueva Prótesis',
        'Guía visual detallada sobre el desgaste del cartílago por artrosis y los componentes biocompatibles de la prótesis total de cadera.',
        '### Anatomía de la Cadera y Desgaste por Artrosis
La articulación coxofemoral conecta el fémur con la pelvis. Cuando el cartílago se erosiona, el roce óseo produce dolor agudo e incapacidad funcional.

#### Los 3 Componentes Clave de la Prótesis:
1. **Copa Acetabular (Pelvis):** Fijada en la cavidad pélvica con un inserto de deslizamiento ultrasuave (cerámica o polietileno de alta densidad).
2. **Cabeza Protésica Esférica:** Esfera pulida a espejo que reproduce la anatomía articular con mínima fricción.
3. **Vástago Femoral de Titanio:** Anclaje anatómico de alta solidez insertado en el canal del fémur.

#### Pautas de Protección y Prevención de Luxación:
- Evitar flexiones de cadera superiores a 90 grados y no cruzar las piernas en tijera.
- Uso temporal de calzador largo y asiento elevado en el inodoro para evitar agacharse en exceso.',
        '/images/infografia-cadera.png',
        2
    );

    -- C. RECORRIDO DE LA CIRUGÍA (5 PASOS)
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES 
    (
        v_cirugia_id, 'Artroplastia Total de Cadera', 'recorrido', 'articulo',
        '1. Admisión Hospitalaria y Verificación Previa',
        'Llegada 2 horas antes con tu acompañante para registro, validación y consentimiento.',
        'Llegas a la clínica 2 horas antes de la cirugía con tu acompañante. En admisión validan tu documento de identidad, órdenes médicas, valoraciones preanestésicas y radiografías. El personal corrobora el cumplimiento estricto del ayuno y te coloca tu brazalete de identificación clínica.',
        NULL, 10
    ),
    (
        v_cirugia_id, 'Artroplastia Total de Cadera', 'recorrido', 'articulo',
        '2. Preparación Preanestésica y Vía Intravenosa',
        'Colocación de bata, canalización venosa y profilaxis antibiótica.',
        'Pasas al área prequirúrgica para cambiarte a la bata hospitalaria limpia. La enfermera canaliza una vía intravenosa para hidratación, profilaxis antibiótica y medicación protectora. El anestesiólogo revisa tus signos vitales y te explica la anestesia raquídea o regional.',
        NULL, 11
    ),
    (
        v_cirugia_id, 'Artroplastia Total de Cadera', 'recorrido', 'articulo',
        '3. Quirófano y Anestesia Regional con Sedación',
        'Procedimiento sin dolor con adormecimiento de la mitad inferior y sedación suave.',
        'Ingresas a la sala quirúrgica estéril y climatizada. Se administra la anestesia raquídea o epidural en la espalda para adormecer completamente tus piernas, complementada con una sedación suave y relajante. El cirujano ortopedista retira las superficies dañadas, implanta la prótesis y comprueba los arcos de movilidad.',
        NULL, 12
    ),
    (
        v_cirugia_id, 'Artroplastia Total de Cadera', 'recorrido', 'articulo',
        '4. Sala de Recuperación Postanestésica (URPA)',
        'Control del dolor, mantas térmicas y verificación de retorno sensitivo.',
        'Despertarás cómodo con mantas térmicas y monitoreo constante de tensión arterial y pulso. Se administra analgesia intravenosa continua para evitar molestias articulares. El equipo confirma la movilidad de los dedos de tus pies antes de trasladarte a tu habitación.',
        NULL, 13
    ),
    (
        v_cirugia_id, 'Artroplastia Total de Cadera', 'recorrido', 'articulo',
        '5. Movilización Precoz Asistida y Criterios de Alta',
        'Primeros pasos con andador en las primeras 24 horas y retorno seguro.',
        'En las primeras 24 horas, el fisioterapeuta te asistirá para dar los primeros pasos con andador o bastón. Tras 48 a 72 horas de hospitalización y buena evolución de la herida, el equipo ortopédico firmará el alta con las pautas de prevención de luxación y tu plan de fisioterapia domiciliaria.',
        NULL, 14
    );

    -- D. CHECKLIST MALETA QUIRÚRGICA ORTOPÉDICA
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES (
        v_cirugia_id,
        'Artroplastia Total de Cadera',
        'guia_maleta',
        'articulo',
        'Checklist: ¿Qué empacar en tu maleta prequirúrgica (Cadera)?',
        'Documentos, ropa muy holgada que no presione la cadera, calzador largo y ayudas de marcha.',
        '### Documentación Indispensable
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
- ❌ Objetos de alto valor o sumas elevadas de dinero.',
        NULL,
        20
    );

    -- E. PREGUNTAS FRECUENTES (FAQS)
    INSERT INTO materiales_educativos (
        cirugia_id, tipo_cirugia, categoria, tipo_recurso, titulo, descripcion_corta, 
        contenido_markdown, url_recurso, orden_visualizacion
    ) VALUES 
    (
        v_cirugia_id, 'Artroplastia Total de Cadera', 'faq', 'articulo',
        '¿Sentiré dolor durante o después de la cirugía de cadera?',
        'Control anestésico y alivio definitivo del dolor por artrosis.',
        'Durante la cirugía no sentirás ningún dolor gracias a la anestesia regional (raquídea/epidural) y la sedación suave. Al despertar, contarás con un esquema de analgesia intravenosa continua.\n\nNotarás una gran mejoría: el dolor punzante y constante de la artrosis desaparece de inmediato al haber retirado las superficies de roce óseo.',
        NULL, 30
    ),
    (
        v_cirugia_id, 'Artroplastia Total de Cadera', 'faq', 'articulo',
        '¿Cómo prevengo una luxación de la prótesis en mi hogar?',
        'Reglas de oro durante las primeras 6 a 8 semanas.',
        'Para asegurar que la prótesis cicatrice firme en su cápsula articular:\n1. **No flexiones la cadera más de 90°:** No te agaches al suelo ni acerques las rodillas al pecho.\n2. **No cruces las piernas en tijera:** Mantén las piernas separadas al sentarte y al dormir (puedes usar un cojín entre las piernas).\n3. **Usa asiento elevado de inodoro y calzador largo:** Evitan sentarte en superficies muy bajas.',
        NULL, 31
    ),
    (
        v_cirugia_id, 'Artroplastia Total de Cadera', 'faq', 'articulo',
        '¿Cuándo podré levantarme y apoyar la pierna operada?',
        'Movilización precoz desde las primeras 24 horas.',
        'El protocolo moderno estimula la deambulación asistida desde las primeras 24 horas. Guiado por el equipo de fisioterapia, te pondrás de pie y darás pasos con un andador o bastón canadiense. La movilización precoz activa la circulación, evita trombos venosos y acelera tu recuperación.',
        NULL, 32
    ),
    (
        v_cirugia_id, 'Artroplastia Total de Cadera', 'faq', 'articulo',
        '¿Qué signos de alarma debo reportar de urgencia?',
        'Identificación de luxación, trombosis o infección.',
        'Debes consultar de urgencias si presentas:\n- Dolor agudo y súbito en la cadera con imposibilidad de apoyar o si notas que la pierna operada se ve más corta o girada hacia afuera (sospecha de luxación).\n- Dolor punzante o hinchazón intensa en la pantorrilla (sospecha de trombosis venosa).\n- Fiebre superior a 38°C o secreción purulenta en la herida quirúrgica.',
        NULL, 33
    );

    RAISE NOTICE 'Materiales educativos para Artroplastia Total de Cadera actualizados exitosamente para cirugía ID: %', v_cirugia_id;
END $$;
