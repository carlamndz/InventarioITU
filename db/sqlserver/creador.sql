-- 1. Creación de la Base de Datos
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'inventario_egi')
BEGIN
    CREATE DATABASE inventario_egi;
END
GO

USE inventario_egi;
GO

-- 2. Creación de la Tabla Laboratorios
CREATE TABLE laboratorios (
    id_laboratorio INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    capacidad_equipos INT NOT NULL,
    ubicacion VARCHAR(100),
    descripcion VARCHAR(MAX)
);

-- 3. Creación de la Tabla Responsables
CREATE TABLE responsables (
    id_responsable INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    dni VARCHAR(15) NOT NULL UNIQUE,
    rol VARCHAR(20) NOT NULL CONSTRAINT chk_responsables_rol CHECK (rol IN ('administrador', 'usuario'))
);

-- 4. Creación de la Tabla Equipos
CREATE TABLE equipos (
    id_equipo VARCHAR(20) PRIMARY KEY,
    id_laboratorio INT NOT NULL,
    banco VARCHAR(5) NOT NULL,
    id_responsable INT,
    ultimo_mantenimiento DATE,
    estado VARCHAR(20) NOT NULL CONSTRAINT df_equipos_estado DEFAULT 'operativo' CONSTRAINT chk_equipos_estado CHECK (estado IN ('operativo', 'mantenimiento', 'fuera de servicio')),
    fecha_alta DATE NOT NULL CONSTRAINT df_equipos_fecha_alta DEFAULT (CAST(GETDATE() AS DATE)),

    CONSTRAINT fk_equipos_laboratorios
        FOREIGN KEY (id_laboratorio)
        REFERENCES laboratorios(id_laboratorio),

    CONSTRAINT fk_equipos_responsables
        FOREIGN KEY (id_responsable)
        REFERENCES responsables(id_responsable)
);

-- 5. Creación de la Tabla Mantenimientos
CREATE TABLE mantenimientos (
    id_mantenimiento INT IDENTITY(1,1) PRIMARY KEY,
    id_equipo VARCHAR(20) NOT NULL,
    fecha_mantenimiento DATE NOT NULL,
    tipo_mantenimiento VARCHAR(20) NOT NULL CONSTRAINT chk_mantenimientos_tipo CHECK (tipo_mantenimiento IN ('preventivo', 'correctivo', 'actualizacion', 'limpieza')),
    descripcion VARCHAR(MAX) NOT NULL,
    estado VARCHAR(20) NOT NULL CONSTRAINT df_mantenimientos_estado DEFAULT 'pendiente' CONSTRAINT chk_mantenimientos_estado CHECK (estado IN ('pendiente', 'realizado', 'cancelado')),

    CONSTRAINT fk_mantenimientos_equipos
        FOREIGN KEY (id_equipo)
        REFERENCES equipos(id_equipo)
);

-- 6. Creación de la Tabla Actividad Reciente
CREATE TABLE actividad_reciente (
    id_actividad INT IDENTITY(1,1) PRIMARY KEY,
    id_equipo VARCHAR(20) NOT NULL,
    tipo_actividad VARCHAR(20) NOT NULL CONSTRAINT chk_actividad_tipo CHECK (tipo_actividad IN ('registro', 'actualizacion', 'mantenimiento', 'cambio_estado')),
    descripcion VARCHAR(255) NOT NULL,
    fecha_hora DATETIME NOT NULL CONSTRAINT df_actividad_fecha DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_actividad_equipos
        FOREIGN KEY (id_equipo)
        REFERENCES equipos(id_equipo)
);
GO