# Inventario ITU — App Web (`app/`)

Aplicación web para la gestión centralizada del inventario de equipos informáticos de los laboratorios del ITU Mendoza. Permite consultar, registrar, editar y eliminar equipos, gestionar responsables técnicos, y visualizar estadísticas de ocupación por laboratorio.

Este módulo es la **capa de presentación y lógica de negocio** del proyecto integrador (`inventario-web`), desarrollado por Sol Melocchi. Se integra con dos bases de datos (SQL Server y MongoDB) y con el servicio de autenticación LDAP/Active Directory desarrollado por otro integrante del equipo.

---

## Tabla de contenidos

- [Qué hace la aplicación](#qué-hace-la-aplicación)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Configuración de SQL Server (entorno local)](#configuración-de-sql-server-entorno-local)
- [Configuración de bases de datos en el código](#configuración-de-bases-de-datos-en-el-código)
- [Documentación de la API](#documentación-de-la-api)
- [Modelo de datos](#modelo-de-datos)
- [Despliegue con Docker y Kubernetes](#despliegue-con-docker-y-kubernetes)
- [Arquitectura de Red e Infraestructura del Proyecto](#arquitectura-de-red-e-infraestructura-del-proyecto)
- [Problemas conocidos y troubleshooting](#problemas-conocidos-y-troubleshooting)

---

## Qué hace la aplicación

El sistema le permite al personal administrativo del ITU:

- Ver en un dashboard el estado general del inventario (total de equipos, equipos por estado, ocupación por laboratorio, actividad reciente).
- Buscar equipos por texto, laboratorio o estado.
- Ver el detalle completo de un equipo: ubicación/asignación (SQL Server) y especificaciones de hardware (MongoDB) en una misma pantalla.
- Registrar un equipo nuevo, cargando tanto sus datos de ubicación como su hardware en un solo formulario.
- Editar o eliminar un equipo existente (la eliminación borra el registro en ambas bases de datos).
- Gestionar responsables técnicos (CRUD completo), incluyendo la posibilidad de crear un responsable nuevo sin salir del formulario de alta de equipo.
- Iniciar sesión contra el directorio institucional (Active Directory / LDAP), con un acceso local de respaldo para desarrollo.

## Stack tecnológico

| Tecnología                  | Uso                                       | Por qué se eligió                                                                          |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Node.js**                 | Entorno de ejecución del servidor         | Permite correr JavaScript del lado del servidor, mismo lenguaje que el frontend            |
| **Express**                 | Framework web / API REST                  | Liviano, rápido de configurar, ideal para una API de este tamaño                           |
| **SQL Server**              | Base de datos relacional (`ubicacion-db`) | Datos con relaciones claras: equipos → laboratorios → responsables. Requerido por cátedra. |
| **mssql**                   | Driver de conexión a SQL Server           | Soporta consultas parametrizadas (previene inyección SQL), pool de conexiones y promesas   |
| **MongoDB**                 | Base de datos NoSQL (`inventario-db`)     | Datos de hardware con estructura anidada y flexible por equipo                             |
| **Mongoose**                | ODM para MongoDB                          | Define un Schema fijo para los documentos y simplifica las consultas                       |
| **ldap-authentication**     | Cliente LDAP                              | Valida usuario y contraseña contra el directorio Active Directory (`ldap-service`)         |
| **HTML / CSS / JS vanilla** | Frontend                                  | Sin frameworks, comunicación directa con la API vía `fetch()`                              |
| **Docker**                  | Contenerización                           | Empaqueta la app para que Kubernetes pueda orquestarla                                     |

## Arquitectura

La aplicación sigue una arquitectura de 3 capas, integrada con el resto de los servicios del ecosistema:

| Servicio         | Descripción                                                    | Puerto |
| ---------------- | -------------------------------------------------------------- | ------ |
| `inventario-web` | Esta aplicación (Node.js + Express)                            | 3000   |
| `ubicacion-db`   | Base de datos SQL Server (equipos, laboratorios, responsables) | 1433   |
| `inventario-db`  | Base de datos MongoDB (hardware)                               | 27017  |
| `ldap-service`   | Servidor OpenLDAP / Active Directory (autenticación)           | 389    |

Las dos bases de datos se vinculan mediante un identificador compartido: el **ID de equipo** (ej. `PC-LAB1-001`) es la primary key en SQL Server y el campo `id` en los documentos de MongoDB. No existe una clave foránea real entre motores distintos, por lo que la app resuelve esta relación a nivel de aplicación, haciendo dos consultas independientes con el mismo ID y combinando los resultados.

El login no valida usuario y contraseña contra una tabla propia: delega esa validación al servicio `ldap-service`, consultando el directorio institucional vía el protocolo LDAP. Se mantiene además un acceso local de respaldo (`admin` / `1234`) para poder seguir desarrollando sin depender de que el directorio esté siempre disponible.

<p align="center">
<img width="1024" height="1392" alt="15b850e9-f90b-4751-b75e-3ed8ffbce746" src="https://github.com/user-attachments/assets/3aeda5d6-6a1c-454b-b844-5fafe02cd191" />
</p>

## Flujo: registrar un equipo nuevo

<p align="center">
<img width="1024" height="1536" alt="ChatGPT Image 20 jun 2026, 01_42_56 p m" src="https://github.com/user-attachments/assets/7e54d754-85c6-44a1-ba64-07b336ed5c33" />
</p>
## Estructura de carpetas

```
app/
├── index.js              # Servidor Express + rutas API + conexión a SQL Server, MongoDB y LDAP
├── package.json
├── Dockerfile             # Empaquetado para Kubernetes
└── public/
    ├── login.html          # Login contra LDAP, con respaldo local
    ├── dashboard.html       # Vista general + estadísticas
    ├── buscar.html          # Búsqueda y filtros de equipos
    ├── detalle.html          # Detalle de un equipo (SQL Server + MongoDB)
    ├── agregar.html          # Alta de equipo (ubicación + hardware)
    └── responsables.html      # CRUD de responsables
```

## Instalación y ejecución local

**Requisitos previos:** Node.js instalado, SQL Server corriendo localmente (Express o Developer) con la base `inventario_egi` creada, MongoDB corriendo localmente con la base `inventario_hardware`.

```bash
cd app
npm install
node index.js
```

## Configuración de bases de datos en el código

La conexión a SQL Server se configura en `index.js`:

```javascript
const sqlConfig = {
  user: "admin",
  password: "1234", // ajustar según el entorno local
  server: SQL_HOST, // 'localhost' en desarrollo, nombre del Service en K8s
  port: 1433,
  database: "inventario_egi",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};
```

La conexión a MongoDB:

```javascript
mongoose.connect(`mongodb://${MONGO_HOST}:27017/inventario_hardware`);
```

La validación contra LDAP:

```javascript
const LDAP_URL = process.env.LDAP_URL || "ldap://ldap-service-external:389";
```

## Documentación de la API

Todas las rutas devuelven JSON. En caso de error, el formato de respuesta es `{ error: "mensaje" }`.

### Equipos

| Método   | Ruta               | Base de datos        | Descripción                                                    |
| -------- | ------------------ | -------------------- | -------------------------------------------------------------- |
| `GET`    | `/api/equipos`     | SQL Server           | Lista todos los equipos con JOIN a laboratorios y responsables |
| `GET`    | `/api/equipos/:id` | SQL Server           | Trae un equipo específico por su ID                            |
| `POST`   | `/api/equipos`     | SQL Server           | Registra un nuevo equipo                                       |
| `PUT`    | `/api/equipos/:id` | SQL Server           | Edita un equipo existente                                      |
| `DELETE` | `/api/equipos/:id` | SQL Server + MongoDB | Elimina el equipo y su hardware asociado en ambas bases        |

### Responsables

| Método   | Ruta                    | Descripción                                          |
| -------- | ----------------------- | ---------------------------------------------------- |
| `GET`    | `/api/responsables`     | Lista responsables con cantidad de equipos asignados |
| `POST`   | `/api/responsables`     | Agrega un nuevo responsable                          |
| `PUT`    | `/api/responsables/:id` | Edita un responsable                                 |
| `DELETE` | `/api/responsables/:id` | Elimina un responsable                               |

### Hardware (MongoDB)

| Método | Ruta                | Descripción                                                       |
| ------ | ------------------- | ----------------------------------------------------------------- |
| `GET`  | `/api/hardware/:id` | Trae las especificaciones de hardware de un equipo                |
| `POST` | `/api/hardware`     | Guarda o actualiza el hardware (`upsert: true`, evita duplicados) |

### Estadísticas

| Método | Ruta         | Descripción                                                               |
| ------ | ------------ | ------------------------------------------------------------------------- |
| `GET`  | `/api/stats` | Totales, conteo por estado, ocupación por laboratorio, actividad reciente |

### Autenticación

| Método | Ruta     | Descripción                                                                                              |
| ------ | -------- | -------------------------------------------------------------------------------------------------------- |
| `POST` | `/login` | Valida credenciales contra LDAP/Active Directory. Mantiene `admin`/`1234` como acceso local de respaldo. |

## Modelo de datos

### SQL Server — tablas principales (`inventario_egi`)

- `laboratorios` (id_laboratorio, nombre, capacidad_equipos, ubicacion, descripcion)
- `responsables` (id_responsable, nombre, apellido, dni, rol)
- `equipos` (id_equipo, id_laboratorio, banco, id_responsable, ultimo_mantenimiento, estado, fecha_alta)
- `mantenimientos` (id_mantenimiento, id_equipo, fecha_mantenimiento, tipo_mantenimiento, descripcion, estado)
- `actividad_reciente` (id_actividad, id_equipo, tipo_actividad, descripcion, fecha_hora)

### MongoDB — colección `hardware` (`inventario_hardware`)

```javascript
{
  id: String,                // vincula con id_equipo de SQL Server
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

## Despliegue con Docker y Kubernetes

El `Dockerfile` empaqueta la aplicación para que pueda ser orquestada por Kubernetes junto al resto de los servicios del ecosistema (`ubicacion-db`, `inventario-db`, `ldap-service`):

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

Dentro del clúster, la app no se conecta a `localhost` sino a los nombres de los Services internos de Kubernetes (`ubicacion-db:1433`, `inventario-db:27017`, `ldap-service-external:389`), inyectados como variables de entorno desde `inventario-web-deployment.yaml`. Una `NetworkPolicy` (`network-policy.yaml`) restringe el tráfico a `inventario-db`, permitiendo conexiones únicamente desde el Pod de `inventario-web`.

## Arquitectura de Red e Infraestructura del Proyecto

El sistema se despliega sobre un laboratorio de red segmentado y aislado mediante un firewall pfSense. La infraestructura consta de tres máquinas virtuales principales interconectadas en la LAN (192.168.1.X). El clúster de Kubernetes (Minikube) se encuentra alojado en la VM Xubuntu, centralizando la lógica de la aplicación y el almacenamiento de datos bajo un espacio de nombres aislado (egi-inventario). El tráfico externo está estrictamente controlado mediante reglas NAT perimetrales en el firewall, garantizando que los servicios internos no queden expuestos directamente a Internet.

[![](https://mermaid.ink/img/pako:eNqNVm1v4kYQ_isjn05KJOD8gsG41UkkvraogVJAyakQndb2GNwYL1rbeWmSH9O_0a_3xzprY8eBcMRfmJ2deZ6Z2dlZHhWP-6jYylKwzQpmzkIsYqBvEKcoYkxP5qV0fQrN5mfYBFOME5xfDu1Shp9d8Rl-CQXesSiCTzDhGflcS6wSL8ncgmKC_rcLFsOcBLjgHougCRMWLzloPb2ldayW1vp6XfrJry5__AiXQ9Dqqsvht74zl1obrsLY53cJTFHcooC-I0M753EqeMR8LsBHcPg6jENOcTqjqdwfjO0at6YeIdd3yIlTsut77IPB9NP0z4t9Cv0YhQEnXzM3i9PstL5ZFZFYt_sgqQ0byuUfUyrnazbjNZv8fDorLw15DLOz3b2KZEhVuslchPl59P2_hE4Ufqel7AVMqHrl_h76MYbdnPeYR2yNyYZ5RF2JNuAybIbxLcYpEyF_k1V-_c1mPua-LQW4Qveg4fTWc87m8qxCj9rBObPhPMpknoPxQSfyOMnRh5xa1jk7PWj55T4tsDGZk0x1o1YvNcWVGbINcmpSeADqk4NII0zHPKIgMXkk-Y6LGygVBdAElxFLZHPPxPd_g9Djz4fAflC2_H7nVflhyXKzwzYlUC3_t0wx9nfVO6raciuWS7ok24xH_ZnMejuIyv1yLlEYT9LCMKweTJzxUzErDpm1VV1VKzu6zIcMLRV-m82OmnVMk_CoFCOasWMuUtsgAvVJlmgvnYhRE8aYH6IcjfQT8QT2O2dFhgxYkKFgZBWBt72dJVyt8HkoZUvAhdMfw5j8Ug5UkZ1qHHSj1iy9tLZh7GZdy4LmKYwFBihCn-cZ0BFdDhMIwr9ZGTlF_EJaQOV8r5x3YqvNu3eY0oVqtshsyqLQZ3DVH8EtEf_KUnqgHp7q3VIL_kuShlTx6sFKH6KqsSiBKLI_YGAaptpI6DW5QfuD29U8zdsum3ehn65sfXP_02uIIqACwHV9DNwKQPXbXaa9A0DWqEDwLOx4vQpBc03U1XcglOUrUIIAVVevULBjaupRlJepXIIEBr5UIzC73lsgSoP-XIS-Yqciw4ayRrFmcqk8SvCFkq5wjQvFJtFn4mahLOJn8tmw-C_O16Wb4NlypdgBixJaZRufDtMJGb0X60oraEygOOeUqGKblpWDKPajcq_Ymmq2dENr6x2rbeq61TEbyoNiN7Vuq2e2O-22bvV0y9I65nND-ScnVls9zaD72ialZnY1S3_-H5gbuHY?type=png)](https://mermaid.live/edit#pako:eNqNVm1v4kYQ_isjn05KJOD8gsF2q5NIfG1RA6WAklMhOq3tMbgxXrS289IkP6Z_o1_vj3XWxsSBcMRfmJ2deZ6Z2dlZHhWfB6g4ykKw9RKm7lzME6Cvn2QoEsxOZpV0fQrN5mdYhxNMUpxdDpxKhp898Rl-iQTesTiGTzDmOflcS6wKL829kmKMwbcLlsCMBLjgPouhCWOWLDhott7SOlZLa329rvzkV5c_foTLAWh11eXgW8-dSa0DV1ES8LsUJihuUUDPlaGd8yQTPGYBFxAguHwVJRGnON3hRO73R06NW1OPkOs75MQp2fU99n5_8mny58U-hX6MwoCTr7mXJ1l-Wt_cFpFYN_sgqQ0HquUfEyrnazbjNZv8AjorP4t4AtOz3b0tyYCqdJN7CLPz-Pt_KZ0o_E5L2QuYUvWq_T30Ywy7Oe8xD9kK0zXziXorOoCLqBklt5hkTET8TVb59dbr2YgHjhTgCr2DhpNb3z2bybOKfGoH98yB8ziXefZHB53I46RAH3BqWffs9KDll_usxMZ0RjLVjVq90pRXZsDWyKlJ4QGoTw4iDTEb8ZiCxPSR5DsubqBSlEBjXMQslc09Fd__DSOfPx8C-0HZivtdVOWHJSvMDttUQLX83zLFJNhV76hqy41YLemSbDIe9qYy680gqvaruURhPEkLw7BsGLujp3JWHDJrq7qqbu3oMh8ytFT4bTo9atYxTcKjUgxpxo64yByDCNQnWaK9dGJGTZhgcYhyNNJPzFPY75wlGTJgYY6CkVUM_uZ2VnC1whehVC0BF25vBCPyyzhQRXaqcdCNWrPy0tqGsZt1LQuapzASGKKIAl5kQEd0OUghjP5mVeQU8QtpCVXwvXLeia02795hSheq2SKzCYujgMFVbwi3RPwry-iBeniqd0st-C9pFlHFtw9W9hBvG4sSiGPnA4amYaqNlF6TG3Q-eF3N1_zNsnkXBdnS0df3P72GKAMqATwvwNDbAqhBu8u0dwDIGpUIvoUd394iaJ6JuvoOhKp8JUoYourpWxTsmJp6FOVlKlcgoYEv1QjNrv8WiNKgPxdRoDiZyLGhrFCsmFwqjxJ8rmRLXOFccUgMmLiZK_PkmXzWLPmL81XlJni-WCpOyOKUVvk6oMN0I0bvxWqrFTQmUJxzSlRxTKtbgCjOo3KvOJRfy-pYuqZpqmmZXdVuKA-kbrd0s93RTMu2baNt6_pzQ_mn4CX7tmm2Tdvuaqplax3t-X_h2bhd)

## Problemas conocidos y troubleshooting

- **Login failed for user genérico**: SQL Server devuelve el mismo mensaje de "Login failed" tanto si la contraseña es incorrecta como si la base de datos especificada en la conexión no existe todavía. Si esto pasa, verificar primero que la base `inventario_egi` esté creada antes de sospechar de la contraseña.
- **Duplicados en MongoDB**: el endpoint `POST /api/hardware` usa `findOneAndUpdate` con `upsert: true` para evitar crear documentos duplicados si se reenvía el mismo ID.
- **Eliminación de equipos**: el `DELETE /api/equipos/:id` borra explícitamente en ambas bases (SQL Server y MongoDB) para no dejar registros huérfanos en MongoDB.

---

_Proyecto Integrador EGI, ITU Mendoza, 2026._
