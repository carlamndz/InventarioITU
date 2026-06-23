const express = require('express')
const path = require('path')
const LdapAuthentication = require('ldap-authentication')
const sql = require('mssql')
const mongoose = require('mongoose')
const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

const LDAP_URL   = process.env.LDAP_URL   || 'ldap://ldap-service-external:389'
const MONGO_HOST = process.env.MONGO_HOST || 'localhost'
const SQL_HOST   = process.env.SQLSERVER_HOST || 'localhost' // se mantiene el nombre de variable para no romper el manifiesto de Kubernetes

// ── CONEXIÓN MONGODB ──────────────────────────────────
mongoose.connect(`mongodb://${MONGO_HOST}:27017/inventario_hardware`)
    .then(() => console.log('Conectado a MongoDB ✅'))
    .catch(err => console.log('Error MongoDB:', err))

const Hardware = mongoose.model('Hardware', new mongoose.Schema({
    id: String,
    fabricante: String,
    modelo: String,
    tipo: String,
    cpu: { fabricante: String, modelo: String, frecuencia: String },
    ram: { capacidad_gb: Number, tipo: String },
    disco: { capacidad_gb: Number, tipo: String },
    sistema_operativo: { nombre: String, version: String },
    monitor: { fabricante: String, tamanio: String, resolucion: String },
    perifericos: { detalle: String }
}, { collection: 'hardware' }))

// ── CONEXIÓN SQL SERVER ───────────────────────────────
const sqlConfig = {
    user: process.env.SQL_USER, 
    password: process.env.SQL_PASSWORD ,
    server: process.env.SQLSERVER_HOST,
    port: 1433,
    database: 'inventario_egi',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
}

let pool
sql.connect(sqlConfig)
    .then(p => {
        pool = p
        console.log('Conectado a SQL Server ✅')
    })
    .catch(err => console.log('Error conectando a SQL Server:', err))

// Redirección de la raíz al login
app.get('/', (req, res) => {
    res.redirect('/login.html')
})

// ── LOGIN INTEGRADO (LOCAL + ACTIVE DIRECTORY) ────────
app.post('/login', async (req, res) => {
    const { usuario, password } = req.body

    if (!usuario || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
    }

    // 1. Comodín admin
    if (usuario === 'admin' && password === '1234') {
        console.log('[LOGIN] Acceso exitoso mediante credenciales comodín.')
        return res.json({
            usuario: {
                nombre: 'Administrador ITU',
                usuario: 'admin',
                rol: 'administrador'
            }
        })
    }

    // 2. Comodín alumno — SACAR ANTES DE PRODUCCIÓN
    if (usuario === 'alumno' && password === '1234') {
        return res.json({
            usuario: {
                nombre: 'Alumno Prueba',
                usuario: 'alumno',
                rol: 'alumno'
            }
        })
    }

    // 3. Active Directory
    let options = {
        ldapOpts: { url: LDAP_URL },
        userDn: usuario,
        userPassword: password
    }
  

    try {
        await LdapAuthentication.authenticate(options)
        console.log(`[AD] Usuario ${usuario} autenticado correctamente.`)

        const nombreMostrar = usuario.split('@')[0].toUpperCase()

        return res.json({
            usuario: {
                nombre: nombreMostrar,
                usuario: usuario,
                rol: getRolDesdeUsuario(usuario)  // ← detecta por prefijo
            }
        })
    } catch (error) {
        console.error(`[AD] Fallo de autenticación para el usuario ${usuario}:`, error.message || error)
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos (AD/Local)' })
    }
})

// ── EQUIPOS ────────────────────────────────────────────

// GET todos los equipos
app.get('/api/equipos', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT e.id_equipo AS id, l.nombre AS laboratorio, e.banco,
            CONCAT(r.apellido, ', ', r.nombre) AS responsable,
            e.ultimo_mantenimiento AS mantenimiento, e.estado
            FROM equipos e
            INNER JOIN laboratorios l ON e.id_laboratorio = l.id_laboratorio
            LEFT JOIN responsables r ON e.id_responsable = r.id_responsable
        `)
        res.json(result.recordset)
    } catch (err) {
        res.json({ error: err.message })
    }
})

// GET un equipo por ID
app.get('/api/equipos/:id', async (req, res) => {
    try {
        const result = await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .query(`
                SELECT e.id_equipo AS id, l.nombre AS laboratorio, e.banco,
                CONCAT(r.apellido, ', ', r.nombre) AS responsable,
                e.ultimo_mantenimiento AS mantenimiento, e.estado
                FROM equipos e
                INNER JOIN laboratorios l ON e.id_laboratorio = l.id_laboratorio
                LEFT JOIN responsables r ON e.id_responsable = r.id_responsable
                WHERE e.id_equipo = @id
            `)
        if (result.recordset.length === 0) return res.json({ error: 'Equipo no encontrado' })
        res.json(result.recordset[0])
    } catch (err) {
        res.json({ error: err.message })
    }
})

// POST agregar equipo
app.post('/api/equipos', async (req, res) => {
    const { id, id_laboratorio, banco, id_responsable, ultimo_mantenimiento, estado } = req.body
    try {
        await pool.request()
            .input('id', sql.VarChar, id)
            .input('id_laboratorio', sql.Int, id_laboratorio)
            .input('banco', sql.VarChar, banco)
            .input('id_responsable', sql.Int, id_responsable || null)
            .input('ultimo_mantenimiento', sql.Date, ultimo_mantenimiento || null)
            .input('estado', sql.VarChar, estado)
            .query(`
                INSERT INTO equipos (id_equipo, id_laboratorio, banco, id_responsable, ultimo_mantenimiento, estado)
                VALUES (@id, @id_laboratorio, @banco, @id_responsable, @ultimo_mantenimiento, @estado)
            `)
        res.json({ mensaje: 'Equipo registrado ✅' })
    } catch (err) {
        res.json({ error: err.message })
    }
})

// PUT editar equipo
app.put('/api/equipos/:id', async (req, res) => {
    const { id_laboratorio, banco, id_responsable, ultimo_mantenimiento, estado } = req.body
    try {
        await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .input('id_laboratorio', sql.Int, id_laboratorio)
            .input('banco', sql.VarChar, banco)
            .input('id_responsable', sql.Int, id_responsable || null)
            .input('ultimo_mantenimiento', sql.Date, ultimo_mantenimiento || null)
            .input('estado', sql.VarChar, estado)
            .query(`
                UPDATE equipos
                SET id_laboratorio=@id_laboratorio, banco=@banco, id_responsable=@id_responsable,
                    ultimo_mantenimiento=@ultimo_mantenimiento, estado=@estado
                WHERE id_equipo=@id
            `)
        res.json({ mensaje: 'Equipo actualizado ✅' })
    } catch (err) {
        res.json({ error: err.message })
    }
})


app.delete('/api/equipos/:id', async (req, res) => {
    try {
        // Primero borrar actividad relacionada
        await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .query('DELETE FROM actividad_reciente WHERE id_equipo = @id')

        // Después borrar mantenimientos relacionados
        await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .query('DELETE FROM mantenimientos WHERE id_equipo = @id')

        // Ahora sí borrar el equipo
        await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .query('DELETE FROM equipos WHERE id_equipo = @id')

        // Y borrar de MongoDB
        await Hardware.deleteMany({ id: req.params.id })

        res.json({ mensaje: 'Equipo eliminado ✅' })
    } catch (err) {
        res.json({ error: err.message })
    }
})

// DELETE eliminar equipo (borra de SQL Server y de MongoDB)
app.delete('/api/equipos/:id', async (req, res) => {
    try {
        await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .query('DELETE FROM equipos WHERE id_equipo = @id')

        await Hardware.deleteMany({ id: req.params.id })

        res.json({ mensaje: 'Equipo eliminado ✅' })
    } catch (err) {
        res.json({ error: err.message })
    }
})

// ── RESPONSABLES ───────────────────────────────────────

// GET todos
app.get('/api/responsables', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT r.id_responsable AS id, r.nombre, r.apellido, r.dni, r.rol,
            COUNT(e.id_equipo) AS equipos
            FROM responsables r
            LEFT JOIN equipos e ON r.id_responsable = e.id_responsable
            GROUP BY r.id_responsable, r.nombre, r.apellido, r.dni, r.rol
        `)
        res.json(result.recordset)
    } catch (err) {
        res.json({ error: err.message })
    }
})

// POST agregar
app.post('/api/responsables', async (req, res) => {
    const { nombre, apellido, dni, rol } = req.body
    try {
        const result = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('dni', sql.VarChar, dni)
            .input('rol', sql.VarChar, rol)
            .query(`
                INSERT INTO responsables (nombre, apellido, dni, rol)
                OUTPUT INSERTED.id_responsable AS id
                VALUES (@nombre, @apellido, @dni, @rol)
            `)
        res.json({ mensaje: 'Responsable agregado ✅', id: result.recordset[0].id })
    } catch (err) {
        res.json({ error: err.message })
    }
})

// PUT editar
app.put('/api/responsables/:id', async (req, res) => {
    const { nombre, apellido, dni, rol } = req.body
    try {
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('dni', sql.VarChar, dni)
            .input('rol', sql.VarChar, rol)
            .query(`
                UPDATE responsables
                SET nombre=@nombre, apellido=@apellido, dni=@dni, rol=@rol
                WHERE id_responsable=@id
            `)
        res.json({ mensaje: 'Responsable actualizado ✅' })
    } catch (err) {
        res.json({ error: err.message })
    }
})

app.delete('/api/responsables/:id', async (req, res) => {
    try {
        const check = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) AS total FROM equipos WHERE id_responsable = @id')

        if (check.recordset[0].total > 0) {
            return res.json({ error: 'No se puede eliminar: tiene equipos asignados' })
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM responsables WHERE id_responsable = @id')

        res.json({ mensaje: 'Responsable eliminado ✅' })
    } catch (err) {
        res.json({ error: err.message })
    }
})

// DELETE eliminar
app.delete('/api/responsables/:id', async (req, res) => {
    try {
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM responsables WHERE id_responsable = @id')
        res.json({ mensaje: 'Responsable eliminado ✅' })
    } catch (err) {
        res.json({ error: err.message })
    }
})

// ── STATS DASHBOARD ─────────────────────────────────────

app.get('/api/stats', async (req, res) => {
    try {
        const totalResult     = await pool.request().query('SELECT COUNT(*) AS total FROM equipos')
        const estadosResult   = await pool.request().query('SELECT estado, COUNT(*) AS cantidad FROM equipos GROUP BY estado')
        const labsResult      = await pool.request().query(`
            SELECT l.nombre, COUNT(e.id_equipo) AS activos, l.capacidad_equipos AS total
            FROM laboratorios l LEFT JOIN equipos e ON l.id_laboratorio = e.id_laboratorio
            GROUP BY l.nombre, l.capacidad_equipos
        `)
        const actividadResult = await pool.request().query(`
            SELECT TOP 5 id_equipo, tipo_actividad, descripcion, fecha_hora
            FROM actividad_reciente
            ORDER BY fecha_hora DESC
        `)

        res.json({
            total: totalResult.recordset[0].total,
            estados: estadosResult.recordset,
            labs: labsResult.recordset,
            actividad: actividadResult.recordset
        })
    } catch (err) {
        res.json({ error: err.message })
    }
})

// ── HARDWARE (MONGODB) ──────────────────────────────────

app.get('/api/hardware/:id', async (req, res) => {
    try {
        const hw = await Hardware.findOne({ id: req.params.id })
        if (!hw) return res.json({ error: 'Hardware no encontrado' })
        res.json({
            fabricante: hw.fabricante,
            modelo: hw.modelo,
            tipo: hw.tipo,
            cpu: `${hw.cpu.fabricante} ${hw.cpu.modelo}${hw.cpu.frecuencia ? ' @ ' + hw.cpu.frecuencia : ''}`,
            ram: `${hw.ram.capacidad_gb} GB ${hw.ram.tipo}`,
            disco: `${hw.disco.capacidad_gb} GB ${hw.disco.tipo}`,
            so: `${hw.sistema_operativo.nombre} ${hw.sistema_operativo.version}`,
            monitor: `${hw.monitor.fabricante} ${hw.monitor.tamanio}`,
            perifericos: hw.perifericos.detalle
        })
    } catch (err) {
        res.json({ error: err.message })
    }
})

app.post('/api/hardware', async (req, res) => {
    try {
        await Hardware.findOneAndUpdate(
            { id: req.body.id },
            { $set: req.body },
            { upsert: true, new: true }
        )
        res.json({ mensaje: 'Hardware guardado ✅' })
    } catch (err) {
        res.json({ error: err.message })
    }
})

function getRolDesdeUsuario(usuario) {
    const u = usuario.toLowerCase().split('@')[0]
    if (u.startsWith('alumno'))  return 'alumno'
    if (u.startsWith('docente')) return 'docente'
    if (u.startsWith('tecnico')) return 'tecnico'
    if (u === 'ad_admin_itu')    return 'administrador'
    return 'tecnico'
}

// Escuchar en 0.0.0.0 es indispensable para ambientes contenerizados
app.listen(3000, '0.0.0.0', () => {
    console.log('Inventario ITU corriendo en http://localhost:3000')
})
