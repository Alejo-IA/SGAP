-- Creación de la base de datos
CREATE DATABASE sgap_db;

-- Conectar a la base de datos
\c sgap_db;

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tablas
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    rol VARCHAR(20) CHECK (rol IN ('profesor', 'estudiante')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profesores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    departamento VARCHAR(100)
);

CREATE TABLE estudiantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo_estudiante VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE materias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE profesor_materia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profesor_id UUID REFERENCES profesores(id) ON DELETE CASCADE,
    materia_id UUID REFERENCES materias(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profesor_id, materia_id)
);

CREATE TABLE matriculas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
    materia_id UUID REFERENCES materias(id) ON DELETE CASCADE,
    estado VARCHAR(20) CHECK (estado IN ('activa', 'retirada', 'finalizada')),
    fecha_matricula TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estudiante_id, materia_id)
);

CREATE TABLE evaluaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materia_id UUID REFERENCES materias(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    porcentaje DECIMAL(5,2) CHECK (porcentaje > 0 AND porcentaje <= 100),
    fecha DATE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_id UUID REFERENCES evaluaciones(id) ON DELETE CASCADE,
    estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
    nota DECIMAL(3,2) CHECK (nota >= 0 AND nota <= 5),
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'aprobado', 'reprobado')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(evaluacion_id, estudiante_id)
);

CREATE TABLE log_notas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nota_id UUID REFERENCES notas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    valor_anterior DECIMAL(3,2),
    valor_nuevo DECIMAL(3,2),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Procedimientos Almacenados

-- Crear Usuario
CREATE OR REPLACE FUNCTION crear_usuario(
    p_username VARCHAR(150),
    p_email VARCHAR(254),
    p_password VARCHAR(255),
    p_first_name VARCHAR(150),
    p_last_name VARCHAR(150),
    p_rol VARCHAR(20)
) RETURNS UUID AS $$
DECLARE
    v_usuario_id UUID;
BEGIN
    -- Validar rol
    IF p_rol NOT IN ('profesor', 'estudiante') THEN
        RAISE EXCEPTION 'Rol inválido. Debe ser profesor o estudiante';
    END IF;

    -- Crear usuario
    INSERT INTO usuarios (username, email, password, first_name, last_name, rol)
    VALUES (p_username, p_email, p_password, p_first_name, p_last_name, p_rol)
    RETURNING id INTO v_usuario_id;

    RETURN v_usuario_id;
END;
$$ LANGUAGE plpgsql;

-- Crear Materia
CREATE OR REPLACE FUNCTION crear_materia(
    p_codigo VARCHAR(20),
    p_nombre VARCHAR(100)
) RETURNS UUID AS $$
DECLARE
    v_materia_id UUID;
BEGIN
    INSERT INTO materias (codigo, nombre)
    VALUES (p_codigo, p_nombre)
    RETURNING id INTO v_materia_id;

    RETURN v_materia_id;
END;
$$ LANGUAGE plpgsql;

-- Asignar Materia a Profesor
CREATE OR REPLACE FUNCTION asignar_materia_profesor(
    p_profesor_id UUID,
    p_materia_id UUID
) RETURNS UUID AS $$
DECLARE
    v_asignacion_id UUID;
BEGIN
    -- Validar existencia
    IF NOT EXISTS (SELECT 1 FROM profesores WHERE id = p_profesor_id) THEN
        RAISE EXCEPTION 'Profesor no encontrado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM materias WHERE id = p_materia_id) THEN
        RAISE EXCEPTION 'Materia no encontrada';
    END IF;

    INSERT INTO profesor_materia (profesor_id, materia_id)
    VALUES (p_profesor_id, p_materia_id)
    RETURNING id INTO v_asignacion_id;

    RETURN v_asignacion_id;
END;
$$ LANGUAGE plpgsql;

-- Matricular Estudiante
CREATE OR REPLACE FUNCTION matricular_estudiante(
    p_estudiante_id UUID,
    p_materia_id UUID
) RETURNS UUID AS $$
DECLARE
    v_matricula_id UUID;
BEGIN
    -- Validar existencia
    IF NOT EXISTS (SELECT 1 FROM estudiantes WHERE id = p_estudiante_id) THEN
        RAISE EXCEPTION 'Estudiante no encontrado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM materias WHERE id = p_materia_id) THEN
        RAISE EXCEPTION 'Materia no encontrada';
    END IF;

    INSERT INTO matriculas (estudiante_id, materia_id, estado)
    VALUES (p_estudiante_id, p_materia_id, 'activa')
    RETURNING id INTO v_matricula_id;

    RETURN v_matricula_id;
END;
$$ LANGUAGE plpgsql;

-- Crear Evaluación
CREATE OR REPLACE FUNCTION crear_evaluacion(
    p_materia_id UUID,
    p_nombre VARCHAR(100),
    p_porcentaje DECIMAL(5,2),
    p_fecha DATE
) RETURNS UUID AS $$
DECLARE
    v_evaluacion_id UUID;
    v_porcentaje_total DECIMAL(5,2);
BEGIN
    -- Validar materia
    IF NOT EXISTS (SELECT 1 FROM materias WHERE id = p_materia_id) THEN
        RAISE EXCEPTION 'Materia no encontrada';
    END IF;

    -- Validar porcentaje
    SELECT COALESCE(SUM(porcentaje), 0) INTO v_porcentaje_total
    FROM evaluaciones
    WHERE materia_id = p_materia_id;

    IF v_porcentaje_total + p_porcentaje > 100 THEN
        RAISE EXCEPTION 'La suma de porcentajes excede el 100%%';
    END IF;

    INSERT INTO evaluaciones (materia_id, nombre, porcentaje, fecha)
    VALUES (p_materia_id, p_nombre, p_porcentaje, p_fecha)
    RETURNING id INTO v_evaluacion_id;

    RETURN v_evaluacion_id;
END;
$$ LANGUAGE plpgsql;

-- Registrar Nota
CREATE OR REPLACE FUNCTION registrar_nota(
    p_evaluacion_id UUID,
    p_estudiante_id UUID,
    p_nota DECIMAL(3,2),
    p_usuario_id UUID
) RETURNS UUID AS $$
DECLARE
    v_nota_id UUID;
    v_estado VARCHAR(20);
BEGIN
    -- Validar evaluación y estudiante
    IF NOT EXISTS (SELECT 1 FROM evaluaciones WHERE id = p_evaluacion_id) THEN
        RAISE EXCEPTION 'Evaluación no encontrada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM estudiantes WHERE id = p_estudiante_id) THEN
        RAISE EXCEPTION 'Estudiante no encontrado';
    END IF;

    -- Determinar estado
    IF p_nota >= 3.0 THEN
        v_estado := 'aprobado';
    ELSE
        v_estado := 'reprobado';
    END IF;

    INSERT INTO notas (evaluacion_id, estudiante_id, nota, estado)
    VALUES (p_evaluacion_id, p_estudiante_id, p_nota, v_estado)
    RETURNING id INTO v_nota_id;

    -- Registrar en log
    INSERT INTO log_notas (nota_id, usuario_id, valor_nuevo)
    VALUES (v_nota_id, p_usuario_id, p_nota);

    RETURN v_nota_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Validación de Porcentaje Total
CREATE OR REPLACE FUNCTION validar_porcentaje_total()
RETURNS TRIGGER AS $$
DECLARE
    v_porcentaje_total DECIMAL(5,2);
BEGIN
    SELECT COALESCE(SUM(porcentaje), 0) INTO v_porcentaje_total
    FROM evaluaciones
    WHERE materia_id = NEW.materia_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

    IF v_porcentaje_total + NEW.porcentaje > 100 THEN
        RAISE EXCEPTION 'La suma de porcentajes excede el 100%%';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_porcentaje_total
BEFORE INSERT OR UPDATE ON evaluaciones
FOR EACH ROW
EXECUTE FUNCTION validar_porcentaje_total();

-- Auditoría de Notas
CREATE OR REPLACE FUNCTION auditar_cambios_notas()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO log_notas (nota_id, usuario_id, valor_anterior, valor_nuevo)
        VALUES (NEW.id, current_setting('app.current_user_id', TRUE)::UUID, OLD.nota, NEW.nota);
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO log_notas (nota_id, usuario_id, valor_nuevo)
        VALUES (NEW.id, current_setting('app.current_user_id', TRUE)::UUID, NEW.nota);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auditar_notas
AFTER INSERT OR UPDATE ON notas
FOR EACH ROW
EXECUTE FUNCTION auditar_cambios_notas();

-- Actualización de Estado de Nota
CREATE OR REPLACE FUNCTION actualizar_estado_nota()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nota >= 3.0 THEN
        NEW.estado := 'aprobado';
    ELSE
        NEW.estado := 'reprobado';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_estado_nota
BEFORE INSERT OR UPDATE ON notas
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_nota(); 