USE inventario_egi;
GO

-- Inserción en Laboratorios
INSERT INTO laboratorios (nombre, capacidad_equipos, ubicacion, descripcion) VALUES
('Laboratorio 1', 28, 'Sector principal', 'Laboratorio de informática general'),
('Laboratorio SO', 32, 'Sector sistemas operativos', 'Laboratorio orientado a sistemas operativos'),
('Laboratorio 4', 24, 'Primer piso', 'Laboratorio de prácticas'),
('Laboratorio 5', 36, 'Segundo piso', 'Laboratorio de programación');

-- Inserción en Responsables
INSERT INTO responsables (nombre, apellido, dni, rol) VALUES
('Lucas', 'Vicino', '40123456', 'administrador'),
('Augusto', 'Rojas', '41234567', 'administrador'),
('Bruno', 'Olaiz', '42345678', 'usuario'),
('Sol', 'Melocchi', '43456789', 'usuario'),
('Nicolas', 'Perez', '44567890', 'usuario');

-- Inserción en Equipos
INSERT INTO equipos (id_equipo, id_laboratorio, banco, id_responsable, ultimo_mantenimiento, estado) VALUES
('PC-LAB1-001', 1, '01', 1, '2025-03-15', 'operativo'),
('PC-LABSO-002', 2, '02', 2, '2025-03-15', 'mantenimiento'),
('PC-LABSO-005', 2, '05', 3, '2025-02-20', 'operativo'),
('PC-LAB4-012', 3, '12', 5, '2025-01-10', 'fuera de servicio'),
('PC-LABSO-009', 2, '09', 4, '2025-04-01', 'operativo'),
('PC-LAB5-003', 4, '03', 2, '2025-03-28', 'mantenimiento');

-- Inserción en Mantenimientos (Se especifica el estado 'realizado' donde corresponde ya que por defecto es 'pendiente')
INSERT INTO mantenimientos (id_equipo, fecha_mantenimiento, tipo_mantenimiento, descripcion, estado) VALUES
('PC-LAB1-001', '2025-03-15', 'preventivo', 'Limpieza general y revisión del sistema', 'realizado'),
('PC-LABSO-002', '2025-03-15', 'correctivo', 'Equipo enviado a mantenimiento por fallas de rendimiento', 'pendiente'),
('PC-LAB4-012', '2025-01-10', 'correctivo', 'Disco dañado. Equipo fuera de servicio', 'pendiente'),
('PC-LABSO-009', '2025-04-01', 'actualizacion', 'Actualización de sistema operativo', 'realizado'),
('PC-LAB5-003', '2025-03-28', 'correctivo', 'Revisión por posible falla de RAM', 'pendiente');

-- Inserción en Actividad Reciente
INSERT INTO actividad_reciente (id_equipo, tipo_actividad, descripcion) VALUES
('PC-LAB1-001', 'cambio_estado', 'PC-LAB1-001 marcada como operativa'),
('PC-LABSO-002', 'mantenimiento', 'PC-LABSO-002 enviada a mantenimiento'),
('PC-LABSO-005', 'registro', 'PC-LABSO-005 registrada como nuevo equipo'),
('PC-LAB4-012', 'cambio_estado', 'PC-LAB4-012 marcada fuera de servicio por disco dañado'),
('PC-LABSO-009', 'actualizacion', 'PC-LABSO-009 actualizada con nuevo sistema operativo');
GO