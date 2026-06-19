# Inventario ITU — App Web (`app/`)
 
Aplicación web para la gestión centralizada del inventario de equipos informáticos de los laboratorios del ITU Mendoza. Permite consultar, registrar, editar y eliminar equipos, gestionar responsables técnicos, y visualizar estadísticas de ocupación por laboratorio.
 
Este módulo es la **capa de presentación y lógica de negocio** del proyecto integrador. Se integra con dos bases de datos (MySQL y MongoDB) y está preparado para conectarse al servicio de autenticación LDAP desarrollado por otro integrante del equipo.
 
---
 
## Tabla de contenidos
 
- [Qué hace la aplicación](#qué-hace-la-aplicación)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Configuración de bases de datos](#configuración-de-bases-de-datos)
- [Documentación de la API](#documentación-de-la-api)
- [Modelo de datos](#modelo-de-datos)
- [Despliegue con Docker](#despliegue-con-docker)
- [Problemas conocidos y troubleshooting](#problemas-conocidos-y-troubleshooting)
---
 
## Qué hace la aplicación
 
El sistema le permite al personal administrativo del ITU:
 
- Ver en un dashboard el estado general del inventario (total de equipos, equipos por estado, ocupación por laboratorio, actividad reciente).
- Buscar equipos por texto, laboratorio o estado.
- Ver el detalle completo de un equipo: ubicación/asignación (MySQL) y especificaciones de hardware (MongoDB) en una misma pantalla.
- Registrar un equipo nuevo, cargando tanto sus datos de ubicación como su hardware en un solo formulario.
- Editar o eliminar un equipo existente (la eliminación borra el registro en ambas bases de datos).
- Gestionar responsables técnicos (CRUD completo), incluyendo la posibilidad de crear un responsable nuevo sin salir del formulario de alta de equipo.
## Stack tecnológico
 
| Tecnología | Uso | Por qué se eligió |
|---|---|---|
| **Node.js** | Entorno de ejecución del servidor | Permite correr JavaScript del lado del servidor, mismo lenguaje que el frontend |
| **Express** | Framework web / API REST | Liviano, rápido de configurar, ideal para una API de este tamaño |
| **MySQL** | Base de datos relacional | Datos con relaciones claras: equipos → laboratorios → responsables |
| **mysql2** | Driver de conexión a MySQL | Soporta consultas parametrizadas (previene inyección SQL) y promesas |
| **MongoDB** | Base de datos NoSQL | Datos de hardware con estructura anidada y flexible por equipo |
| **Mongoose** | ODM para MongoDB | Define un Schema fijo para los documentos y simplifica las consultas |
| **HTML / CSS / JS vanilla** | Frontend | Sin frameworks, comunicación directa con la API vía `fetch()` |
| **Docker** | Contenerización | Empaqueta la app para que Kubernetes pueda orquestarla |
 
## Arquitectura
 
La aplicación sigue una arquitectura de 3 capas:
 
1. **Presentación** — páginas HTML servidas como archivos estáticos desde `public/`, con JavaScript que consume la API mediante `fetch()`.
2. **Lógica de negocio** — servidor Express (`index.js`) que expone los endpoints REST y orquesta las consultas a ambas bases de datos.
3. **Datos** — MySQL para datos relacionales (equipos, laboratorios, responsables, actividad) y MongoDB para los documentos de hardware.
Las dos bases de datos se vinculan mediante un identificador compartido: el **ID de equipo** (ej. `PC-LAB1-001`) es la primary key en MySQL y el campo `id` en los documentos de MongoDB. No existe una clave foránea real entre motores distintos, por lo que la app resuelve esta relación a nivel de aplicación, haciendo dos consultas independientes con el mismo ID y combinando los resultados.

 **Arquitectura del sistema** 
<p align="center">
  <img width="500" alt="DIAGRAMA DE ARQ" src="https://github.com/user-attachments/assets/884d7562-7b2e-4197-a807-ac846fbfdc67" />
</p>


## Flujo: registrar un equipo nuevo

<p align="center">
  <img width="500" alt="DIAGRAMA DE USO" src="https://github.com/user-attachments/assets/5bf41982-f42e-48f4-8b64-6770ab32c799" />
</p>

 
## Estructura de carpetas
 
```
app/
├── index.js              # Servidor Express + rutas API + conexión a ambas bases
├── package.json
├── Dockerfile             # Empaquetado para Kubernetes
└── public/
    ├── login.html          # Login
    ├── dashboard.html       # Vista general + estadísticas
    ├── buscar.html          # Búsqueda y filtros de equipos
    ├── detalle.html          # Detalle de un equipo (MySQL + MongoDB)
    ├── agregar.html          # Alta de equipo (ubicación + hardware)
    └── responsables.html      # CRUD de responsables
```
 
## Instalación y ejecución local
 
**Requisitos previos:** Node.js instalado, MySQL corriendo localmente con la base `inventario_egi` ya creada, MongoDB corriendo localmente con la base `inventario_hardware`.
 
```bash
cd app
npm install
node index.js
```
 
La aplicación queda disponible en `http://localhost:3000`, redirigiendo automáticamente a `/login.html`.
 
## Configuración de bases de datos
 
La conexión a MySQL se configura directamente en `index.js`:
 
```javascript
const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '1234',       // ajustar según el entorno local
    database: 'inventario_egi'
})
```
 
> **Nota:** la contraseña de MySQL varía según cómo cada integrante tiene configurado su entorno local. Verificar este valor antes de correr el proyecto.
 
La conexión a MongoDB:
 
```javascript
mongoose.connect('mongodb://localhost:27017/inventario_hardware')
```
 
## Documentación de la API
 
Todas las rutas devuelven JSON. En caso de error, el formato de respuesta es `{ error: "mensaje" }`.
 
### Equipos
 
| Método | Ruta | Base de datos | Descripción |
|---|---|---|---|
| `GET` | `/api/equipos` | MySQL | Lista todos los equipos con JOIN a laboratorios y responsables |
| `GET` | `/api/equipos/:id` | MySQL | Trae un equipo específico por su ID |
| `POST` | `/api/equipos` | MySQL | Registra un nuevo equipo |
| `PUT` | `/api/equipos/:id` | MySQL | Edita un equipo existente |
| `DELETE` | `/api/equipos/:id` | MySQL + MongoDB | Elimina el equipo y su hardware asociado en ambas bases |
 
### Responsables
 
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/responsables` | Lista responsables con cantidad de equipos asignados |
| `POST` | `/api/responsables` | Agrega un nuevo responsable |
| `PUT` | `/api/responsables/:id` | Edita un responsable |
| `DELETE` | `/api/responsables/:id` | Elimina un responsable |
 
### Hardware (MongoDB)
 
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/hardware/:id` | Trae las especificaciones de hardware de un equipo |
| `POST` | `/api/hardware` | Guarda o actualiza el hardware (`upsert: true`, evita duplicados) |
 
### Estadísticas
 
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/stats` | Totales, conteo por estado, ocupación por laboratorio, actividad reciente |
 
### Autenticación
 
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/login` | Valida credenciales (actualmente simulado: `admin` / `1234`). Diseñado para integrarse con el servicio LDAP en una versión futura. |
 
## Modelo de datos
 
### MySQL — tablas principales
 
- `laboratorios` (id_laboratorio, nombre, capacidad_equipos)
- `responsables` (id_responsable, nombre, apellido, dni, rol)
- `equipos` (id_equipo, id_laboratorio, banco, id_responsable, ultimo_mantenimiento, estado)
- `actividad_reciente` (id_equipo, tipo_actividad, descripcion, fecha_hora)
### MongoDB — colección `hardware`
 
```javascript
{
  id: String,                // vincula con id_equipo de MySQL
  fabricante: String,
  modelo: String,
  tipo: String,
  cpu: { fabricante, modelo, frecuencia },
  ram: { capacidad_gb, tipo },
  disco: { capacidad_gb, tipo },
  sistema_operativo: { nombre, version },
  monitor: { fabricante, tamanio, resolucion },
  perifericos: { detalle }
}
```
 
## Despliegue con Docker
 
El `Dockerfile` empaqueta la aplicación para que pueda ser orquestada por Kubernetes junto al resto de los servicios del proyecto (`ubicacion-db`, `inventario-db`, `ldap-service`):
 
```dockerfile
FROM node:22-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```
 
Dentro del clúster, la app no se conecta a `localhost` sino a los nombres de los Services internos de Kubernetes (ej. `ubicacion-db:3306`, `inventario-db:27017`).
 
## Problemas conocidos y troubleshooting
 
- **Contraseña de MySQL vacía vs configurada**: distintos entornos locales tienen distinta contraseña de root. Verificar antes de correr.
- **Duplicados en MongoDB**: el endpoint `POST /api/hardware` usa `findOneAndUpdate` con `upsert: true` para evitar crear documentos duplicados si se reenvía el mismo ID.
- **Eliminación de equipos**: el `DELETE /api/equipos/:id` borra explícitamente en ambas bases (MySQL y MongoDB) para no dejar registros huérfanos en MongoDB.
- **mongosh y comandos largos**: al insertar datos de prueba, pegar comandos `insertMany` extensos directamente en la shell interactiva puede fallar por sintaxis. Se recomienda ejecutar el script como archivo: `mongosh inventario_hardware archivo.js`.
---
 
*Proyecto Integrador EGI, ITU Mendoza, 2026.*
