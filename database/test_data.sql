-- Datos de prueba para usuarios y perfiles

-- Profesores
SELECT crear_usuario(
    'juan.perez1234',
    'juan.perez1234@unaula.edu.co',
    'Jp@2024#Seguro',
    'Juan',
    'Pérez',
    'profesor'
) INTO TEMP profesor1_id;

SELECT crear_usuario(
    'maria.gomez5678',
    'maria.gomez5678@unaula.edu.co',
    'Mg@2024#Seguro',
    'María',
    'Gómez',
    'profesor'
) INTO TEMP profesor2_id;

-- Estudiantes
SELECT crear_usuario(
    'carlos.rodriguez9012',
    'carlos.rodriguez9012@unaula.edu.co',
    'Cr@2024#Seguro',
    'Carlos',
    'Rodríguez',
    'estudiante'
) INTO TEMP estudiante1_id;

SELECT crear_usuario(
    'ana.martinez3456',
    'ana.martinez3456@unaula.edu.co',
    'Am@2024#Seguro',
    'Ana',
    'Martínez',
    'estudiante'
) INTO TEMP estudiante2_id;

SELECT crear_usuario(
    'pedro.lopez7890',
    'pedro.lopez7890@unaula.edu.co',
    'Pl@2024#Seguro',
    'Pedro',
    'López',
    'estudiante'
) INTO TEMP estudiante3_id;

SELECT crear_usuario(
    'laura.sanchez2345',
    'laura.sanchez2345@unaula.edu.co',
    'Ls@2024#Seguro',
    'Laura',
    'Sánchez',
    'estudiante'
) INTO TEMP estudiante4_id;

SELECT crear_usuario(
    'david.torres6789',
    'david.torres6789@unaula.edu.co',
    'Dt@2024#Seguro',
    'David',
    'Torres',
    'estudiante'
) INTO TEMP estudiante5_id;

-- Insertar perfiles de profesores
INSERT INTO profesores (usuario_id, departamento)
SELECT profesor1_id, 'Matemáticas';

INSERT INTO profesores (usuario_id, departamento)
SELECT profesor2_id, 'Informática';

-- Insertar perfiles de estudiantes
INSERT INTO estudiantes (usuario_id, codigo_estudiante)
SELECT estudiante1_id, '2024001';

INSERT INTO estudiantes (usuario_id, codigo_estudiante)
SELECT estudiante2_id, '2024002';

INSERT INTO estudiantes (usuario_id, codigo_estudiante)
SELECT estudiante3_id, '2024003';

INSERT INTO estudiantes (usuario_id, codigo_estudiante)
SELECT estudiante4_id, '2024004';

INSERT INTO estudiantes (usuario_id, codigo_estudiante)
SELECT estudiante5_id, '2024005';

-- Crear materias
SELECT crear_materia('MAT101', 'Cálculo I') INTO TEMP materia1_id;
SELECT crear_materia('INF201', 'Programación Avanzada') INTO TEMP materia2_id;
SELECT crear_materia('MAT102', 'Álgebra Lineal') INTO TEMP materia3_id;

-- Asignar materias a profesores
SELECT asignar_materia_profesor(
    (SELECT id FROM profesores WHERE usuario_id = profesor1_id),
    materia1_id
);

SELECT asignar_materia_profesor(
    (SELECT id FROM profesores WHERE usuario_id = profesor1_id),
    materia3_id
);

SELECT asignar_materia_profesor(
    (SELECT id FROM profesores WHERE usuario_id = profesor2_id),
    materia2_id
);

-- Matricular estudiantes
SELECT matricular_estudiante(
    (SELECT id FROM estudiantes WHERE usuario_id = estudiante1_id),
    materia1_id
);

SELECT matricular_estudiante(
    (SELECT id FROM estudiantes WHERE usuario_id = estudiante1_id),
    materia2_id
);

SELECT matricular_estudiante(
    (SELECT id FROM estudiantes WHERE usuario_id = estudiante2_id),
    materia1_id
);

SELECT matricular_estudiante(
    (SELECT id FROM estudiantes WHERE usuario_id = estudiante2_id),
    materia3_id
);

SELECT matricular_estudiante(
    (SELECT id FROM estudiantes WHERE usuario_id = estudiante3_id),
    materia2_id
);

SELECT matricular_estudiante(
    (SELECT id FROM estudiantes WHERE usuario_id = estudiante4_id),
    materia1_id
);

SELECT matricular_estudiante(
    (SELECT id FROM estudiantes WHERE usuario_id = estudiante5_id),
    materia3_id
);

-- Crear evaluaciones
SELECT crear_evaluacion(
    materia1_id,
    'Primer Parcial',
    30.00,
    '2024-03-15'
) INTO TEMP evaluacion1_id;

SELECT crear_evaluacion(
    materia1_id,
    'Segundo Parcial',
    30.00,
    '2024-04-15'
) INTO TEMP evaluacion2_id;

SELECT crear_evaluacion(
    materia1_id,
    'Final',
    40.00,
    '2024-05-15'
) INTO TEMP evaluacion3_id;

-- Registrar algunas notas
SELECT registrar_nota(
    evaluacion1_id,
    (SELECT id FROM estudiantes WHERE usuario_id = estudiante1_id),
    4.5,
    (SELECT id FROM usuarios WHERE username = 'juan.perez1234')
);

SELECT registrar_nota(
    evaluacion1_id,
    (SELECT id FROM estudiantes WHERE usuario_id = estudiante2_id),
    3.8,
    (SELECT id FROM usuarios WHERE username = 'juan.perez1234')
);

SELECT registrar_nota(
    evaluacion1_id,
    (SELECT id FROM estudiantes WHERE usuario_id = estudiante4_id),
    2.5,
    (SELECT id FROM usuarios WHERE username = 'juan.perez1234')
); 