USE inventario_egi;
GO

-- 1. Consulta con resultado para el Dashboard
SELECT 
    e.id_equipo AS id,
    l.nombre AS laboratorio,
    e.banco,
    CONCAT(r.apellido, ', ', r.nombre) AS responsable,
    e.ultimo_mantenimiento,
    e.estado
FROM equipos e
INNER JOIN laboratorios l 
    ON e.id_laboratorio = l.id_laboratorio
LEFT JOIN responsables r 
    ON e.id_responsable = r.id_responsable;

-- 2. Total de equipos
SELECT COUNT(*) AS total_equipos 
FROM equipos;

-- 3. Equipos por estado
SELECT estado, COUNT(*) AS cantidad
FROM equipos
GROUP BY estado;

-- 4. Ocupación por laboratorios
SELECT 
    l.nombre AS laboratorio,
    COUNT(e.id_equipo) AS equipos_registrados,
    l.capacidad_equipos
FROM laboratorios l
LEFT JOIN equipos e 
    ON l.id_laboratorio = e.id_laboratorio
GROUP BY l.nombre, l.capacidad_equipos;

-- 5. Responsables con cantidad de equipos asignados
SELECT 
    r.id_responsable,
    CONCAT(r.apellido, ', ', r.nombre) AS responsable,
    r.dni,
    r.rol,
    COUNT(e.id_equipo) AS equipos_asignados
FROM responsables r
LEFT JOIN equipos e 
    ON r.id_responsable = e.id_responsable
GROUP BY r.id_responsable, r.apellido, r.nombre, r.dni, r.rol;
GO