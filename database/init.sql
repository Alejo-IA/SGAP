-- Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('profesor', 'estudiante')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de profesores
CREATE TABLE profesores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    departamento VARCHAR(100),
    CONSTRAINT unique_profesor_usuario UNIQUE (usuario_id)
);

-- Tabla de estudiantes
CREATE TABLE estudiantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    codigo_estudiante VARCHAR(20) UNIQUE NOT NULL,
    CONSTRAINT unique_estudiante_usuario UNIQUE (usuario_id)
);

-- Tabla de materias
CREATE TABLE materias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de asignación profesor-materia
CREATE TABLE profesor_materia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profesor_id UUID NOT NULL REFERENCES profesores(id),
    materia_id UUID NOT NULL REFERENCES materias(id),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_profesor_materia UNIQUE (profesor_id, materia_id)
);

-- Tabla de matrículas
CREATE TABLE matriculas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id),
    materia_id UUID NOT NULL REFERENCES materias(id),
    fecha_matricula TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'retirada', 'finalizada')),
    CONSTRAINT unique_matricula UNIQUE (estudiante_id, materia_id)
);

-- Tabla de evaluaciones
CREATE TABLE evaluaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materia_id UUID NOT NULL REFERENCES materias(id),
    nombre VARCHAR(100) NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
    fecha DATE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de notas
CREATE TABLE notas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_id UUID NOT NULL REFERENCES evaluaciones(id),
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id),
    nota DECIMAL(4,2) NOT NULL CHECK (nota >= 0 AND nota <= 5),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'reprobado')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_nota UNIQUE (evaluacion_id, estudiante_id)
);

-- Tabla de auditoría de notas
CREATE TABLE log_notas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nota_id UUID NOT NULL REFERENCES notas(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    valor_anterior DECIMAL(4,2),
    valor_nuevo DECIMAL(4,2),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Procedimientos Almacenados

-- Crear usuario
CREATE OR REPLACE FUNCTION crear_usuario(
    p_nombre VARCHAR(100),
    p_correo VARCHAR(100),
    p_contrasena VARCHAR(255),
    p_rol VARCHAR(20)
) RETURNS UUID AS $$
DECLARE
    v_usuario_id UUID;
BEGIN
    IF p_rol NOT IN ('profesor', 'estudiante') THEN
        RAISE EXCEPTION 'Rol no válido';
    END IF;
    
    INSERT INTO usuarios (nombre, correo, contrasena, rol)
    VALUES (p_nombre, p_correo, p_contrasena, p_rol)
    RETURNING id INTO v_usuario_id;
    
    RETURN v_usuario_id;
END;
$$ LANGUAGE plpgsql;

-- Crear materia
CREATE OR REPLACE FUNCTION crear_materia(
    p_nombre VARCHAR(100),
    p_codigo VARCHAR(20)
) RETURNS UUID AS $$
DECLARE
    v_materia_id UUID;
BEGIN
    INSERT INTO materias (nombre, codigo)
    VALUES (p_nombre, p_codigo)
    RETURNING id INTO v_materia_id;
    
    RETURN v_materia_id;
END;
$$ LANGUAGE plpgsql;

-- Asignar materia a profesor
CREATE OR REPLACE FUNCTION asignar_materia_profesor(
    p_profesor_id UUID,
    p_materia_id UUID
) RETURNS UUID AS $$
DECLARE
    v_asignacion_id UUID;
BEGIN
    -- Verificar que el profesor existe
    IF NOT EXISTS (SELECT 1 FROM profesores WHERE id = p_profesor_id) THEN
        RAISE EXCEPTION 'Profesor no encontrado';
    END IF;
    
    -- Verificar que la materia existe
    IF NOT EXISTS (SELECT 1 FROM materias WHERE id = p_materia_id) THEN
        RAISE EXCEPTION 'Materia no encontrada';
    END IF;
    
    INSERT INTO profesor_materia (profesor_id, materia_id)
    VALUES (p_profesor_id, p_materia_id)
    RETURNING id INTO v_asignacion_id;
    
    RETURN v_asignacion_id;
END;
$$ LANGUAGE plpgsql;

-- Matricular estudiante
CREATE OR REPLACE FUNCTION matricular_estudiante(
    p_estudiante_id UUID,
    p_materia_id UUID
) RETURNS UUID AS $$
DECLARE
    v_matricula_id UUID;
BEGIN
    -- Verificar que el estudiante existe
    IF NOT EXISTS (SELECT 1 FROM estudiantes WHERE id = p_estudiante_id) THEN
        RAISE EXCEPTION 'Estudiante no encontrado';
    END IF;
    
    -- Verificar que la materia existe
    IF NOT EXISTS (SELECT 1 FROM materias WHERE id = p_materia_id) THEN
        RAISE EXCEPTION 'Materia no encontrada';
    END IF;
    
    INSERT INTO matriculas (estudiante_id, materia_id)
    VALUES (p_estudiante_id, p_materia_id)
    RETURNING id INTO v_matricula_id;
    
    RETURN v_matricula_id;
END;
$$ LANGUAGE plpgsql;

-- Crear evaluación
CREATE OR REPLACE FUNCTION crear_evaluacion(
    p_materia_id UUID,
    p_nombre VARCHAR(100),
    p_porcentaje DECIMAL(5,2),
    p_fecha DATE
) RETURNS UUID AS $$
DECLARE
    v_evaluacion_id UUID;
    v_total_porcentaje DECIMAL(5,2);
BEGIN
    -- Calcular el total de porcentajes existentes
    SELECT COALESCE(SUM(porcentaje), 0)
    INTO v_total_porcentaje
    FROM evaluaciones
    WHERE materia_id = p_materia_id;
    
    -- Verificar que no exceda el 100%
    IF (v_total_porcentaje + p_porcentaje) > 100 THEN
        RAISE EXCEPTION 'El total de porcentajes excedería el 100%%';
    END IF;
    
    INSERT INTO evaluaciones (materia_id, nombre, porcentaje, fecha)
    VALUES (p_materia_id, p_nombre, p_porcentaje, p_fecha)
    RETURNING id INTO v_evaluacion_id;
    
    RETURN v_evaluacion_id;
END;
$$ LANGUAGE plpgsql;

-- Registrar nota
CREATE OR REPLACE FUNCTION registrar_nota(
    p_evaluacion_id UUID,
    p_estudiante_id UUID,
    p_nota DECIMAL(4,2)
) RETURNS UUID AS $$
DECLARE
    v_nota_id UUID;
BEGIN
    INSERT INTO notas (evaluacion_id, estudiante_id, nota)
    VALUES (p_evaluacion_id, p_estudiante_id, p_nota)
    RETURNING id INTO v_nota_id;
    
    RETURN v_nota_id;
END;
$$ LANGUAGE plpgsql;

-- Ver notas estudiante
CREATE OR REPLACE FUNCTION ver_notas_estudiante(p_estudiante_id UUID)
RETURNS TABLE (
    materia_nombre VARCHAR(100),
    evaluacion_nombre VARCHAR(100),
    nota DECIMAL(4,2),
    porcentaje DECIMAL(5,2),
    estado VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.nombre as materia_nombre,
        e.nombre as evaluacion_nombre,
        n.nota,
        e.porcentaje,
        n.estado
    FROM notas n
    JOIN evaluaciones e ON n.evaluacion_id = e.id
    JOIN materias m ON e.materia_id = m.id
    WHERE n.estudiante_id = p_estudiante_id
    ORDER BY m.nombre, e.fecha;
END;
$$ LANGUAGE plpgsql;

-- Ver evaluaciones por materia
CREATE OR REPLACE FUNCTION ver_evaluaciones_por_materia(p_materia_id UUID)
RETURNS TABLE (
    evaluacion_id UUID,
    nombre VARCHAR(100),
    porcentaje DECIMAL(5,2),
    fecha DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        nombre,
        porcentaje,
        fecha
    FROM evaluaciones
    WHERE materia_id = p_materia_id
    ORDER BY fecha;
END;
$$ LANGUAGE plpgsql;

-- Editar nota
CREATE OR REPLACE FUNCTION editar_nota(
    p_nota_id UUID,
    p_nueva_nota DECIMAL(4,2)
) RETURNS VOID AS $$
BEGIN
    UPDATE notas
    SET nota = p_nueva_nota
    WHERE id = p_nota_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nota no encontrada';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Consultar materias profesor
CREATE OR REPLACE FUNCTION consultar_materias_profesor(p_profesor_id UUID)
RETURNS TABLE (
    materia_id UUID,
    codigo VARCHAR(20),
    nombre VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.codigo,
        m.nombre
    FROM materias m
    JOIN profesor_materia pm ON m.id = pm.materia_id
    WHERE pm.profesor_id = p_profesor_id
    ORDER BY m.nombre;
END;
$$ LANGUAGE plpgsql;

-- Consultar estudiantes materia
CREATE OR REPLACE FUNCTION consultar_estudiantes_materia(p_materia_id UUID)
RETURNS TABLE (
    estudiante_id UUID,
    codigo_estudiante VARCHAR(20),
    nombre VARCHAR(100),
    correo VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.codigo_estudiante,
        u.nombre,
        u.correo
    FROM estudiantes e
    JOIN usuarios u ON e.usuario_id = u.id
    JOIN matriculas m ON e.id = m.estudiante_id
    WHERE m.materia_id = p_materia_id
    ORDER BY u.nombre;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Trigger para validar porcentaje total de evaluaciones
CREATE OR REPLACE FUNCTION validar_porcentaje_total()
RETURNS TRIGGER AS $$
DECLARE
    v_total_porcentaje DECIMAL(5,2);
BEGIN
    -- Calcular nuevo total de porcentajes
    SELECT COALESCE(SUM(porcentaje), 0)
    INTO v_total_porcentaje
    FROM evaluaciones
    WHERE materia_id = NEW.materia_id
    AND id != NEW.id;
    
    v_total_porcentaje := v_total_porcentaje + NEW.porcentaje;
    
    IF v_total_porcentaje > 100 THEN
        RAISE EXCEPTION 'El total de porcentajes no puede exceder el 100%%';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_porcentaje_total
BEFORE INSERT OR UPDATE ON evaluaciones
FOR EACH ROW
EXECUTE FUNCTION validar_porcentaje_total();

-- Trigger para auditoría de notas
CREATE OR REPLACE FUNCTION auditar_cambios_notas()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO log_notas (nota_id, usuario_id, valor_anterior, valor_nuevo)
        VALUES (NEW.id, current_user::UUID, OLD.nota, NEW.nota);
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO log_notas (nota_id, usuario_id, valor_anterior, valor_nuevo)
        VALUES (NEW.id, current_user::UUID, NULL, NEW.nota);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auditar_notas
AFTER INSERT OR UPDATE ON notas
FOR EACH ROW
EXECUTE FUNCTION auditar_cambios_notas();

-- Trigger para actualizar estado de nota
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