const express = require('express')
const path = require('path')
const LdapAuthentication = require('ldap-authentication')
const mysql = require('mysql2')
const mongoose = require('mongoose')
const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

const LDAP_URL = process.env.LDAP_URL || 'ldap://ldap-service-external:389'

const MONGO_HOST = process.env.MONGO_HOST || 'localhost' 
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost'

// CONEXIÓN MONGODB
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

// Redirección de la raíz al login
app.get('/', (req, res) => {
    res.redirect('/login.html')
})

// CONEXIÓN MYSQL
const db = mysql.createConnection({
    host: MYSQL_HOST,
    port: 3306,
    user: 'root',
    password: '',
    database: 'inventario_egi'
})

db.connect((err) => {
    if (err) {
        console.log('Error conectando a MySQL:', err)
        return
    }
    console.log('Conectado a MySQL ✅')
})

// ── LOGIN INTEGRADO ROBUSTO (CORREGIDO DE RAÍZ) ───────────────────────
app.post('/login', async (req, res) => {
    const { usuario, password } = req.body

    if (!usuario || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
    }

    // 1. VALIDACIÓN COMODÍN (LOCAL)
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

    // 2. VALIDACIÓN CONTRA ACTIVE DIRECTORY PLANA (EVITA EL BUG INTERNAL TOSTRING)
    let options = {
        ldapOpts: { url: LDAP_URL },
        userDn: usuario, // Se envía el UPN directo (ej: tecnico01@itu.local)
        userPassword: password
    }

    try {
        // Autenticación por Bind puro. Si la clave es incorrecta va al catch.
        await LdapAuthentication.authenticate(options)
        
        console.log(`[AD] Usuario ${usuario} autenticado correctamente.`);

        // Formateamos un nombre estético basado en su propio UPN de forma segura
        // Ej: "juan.perez@itu.local" -> "JUAN.PEREZ"
        // Ej: "tecnico01@itu.local" -> "TECNICO01"
        const nombreMostrar = usuario.split('@')[0].toUpperCase();

        return res.json({
            usuario: {
                nombre: nombreMostrar, // 🎯 Nombre limpio garantizado sin romper la librería
                usuario: usuario,
                rol: 'usuario_autenticado_ad'
            }
        })

    } catch (error) {
        console.error(`[AD] Fallo de autenticación para el usuario ${usuario}:`, error.message || error)
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos (AD/Local)' })
    }
})
// ── EQUIPOS ──────────────────────────────────────────

// GET todos los equipos
app.get('/api/equipos', (req, res) => {
    const sql = `
        SELECT e.id_equipo AS id, l.nombre AS laboratorio, e.banco,
        CONCAT(r.apellido, ', ', r.nombre) AS responsable,
        e.ultimo_mantenimiento AS mantenimiento, e.estado
        FROM equipos e
        INNER JOIN laboratorios l ON e.id_laboratorio = l.id_laboratorio
        LEFT JOIN responsables r ON e.id_responsable = r.id_responsable
    `
    db.query(sql, (err, results) => {
        if (err) return res.json({ error: err.message })
        res.json(results)
    })
})

// GET un equipo por ID
app.get('/api/equipos/:id', (req, res) => {
    const sql = `
        SELECT e.id_equipo AS id, l.nombre AS laboratorio, e.banco,
        CONCAT(r.apellido, ', ', r.nombre) AS responsable,
        e.ultimo_mantenimiento AS mantenimiento, e.estado
        FROM equipos e
        INNER JOIN laboratorios l ON e.id_laboratorio = l.id_laboratorio
        LEFT JOIN responsables r ON e.id_responsable = r.id_responsable
        WHERE e.id_equipo = ?
    `
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.json({ error: err.message })
        if (results.length === 0) return res.json({ error: 'Equipo no encontrado' })
        res.json(results[0])
    })
})

// POST agregar equipo
app.post('/api/equipos', (req, res) => {
    const { id, id_laboratorio, banco, id_responsable, ultimo_mantenimiento, estado } = req.body
    const sql = 'INSERT INTO equipos (id_equipo, id_laboratorio, banco, id_responsable, ultimo_mantenimiento, estado) VALUES (?, ?, ?, ?, ?, ?)'
    db.query(sql, [id, id_laboratorio, banco, id_responsable, ultimo_mantenimiento, estado], (err) => {
        if (err) return res.json({ error: err.message })
        res.json({ mensaje: 'Equipo registrado ✅' })
    })
})

// PUT editar equipo
app.put('/api/equipos/:id', (req, res) => {
    const { id_laboratorio, banco, id_responsable, ultimo_mantenimiento, estado } = req.body
    const sql = 'UPDATE equipos SET id_laboratorio=?, banco=?, id_responsable=?, ultimo_mantenimiento=?, estado=? WHERE id_equipo=?'
    db.query(sql, [id_laboratorio, banco, id_responsable, ultimo_mantenimiento, estado, req.params.id], (err) => {
        if (err) return res.json({ error: err.message })
        res.json({ mensaje: 'Equipo actualizado ✅' })
    })
})

// DELETE eliminar equipo
app.delete('/api/equipos/:id', async (req, res) => {
    try {
        // Borra de MySQL
        await db.promise().query('DELETE FROM equipos WHERE id_equipo = ?', [req.params.id])

        // Borra de MongoDB también
        await Hardware.deleteMany({ id: req.params.id })

        res.json({ mensaje: 'Equipo eliminado ✅' })
    } catch (err) {
        res.json({ error: err.message })
    }
})

// ── RESPONSABLES ─────────────────────────────────────

// GET todos
app.get('/api/responsables', (req, res) => {
    const sql = `
        SELECT r.id_responsable AS id, r.nombre, r.apellido, r.dni, r.rol,
        COUNT(e.id_equipo) AS equipos
        FROM responsables r
        LEFT JOIN equipos e ON r.id_responsable = e.id_responsable
        GROUP BY r.id_responsable
    `
    db.query(sql, (err, results) => {
        if (err) return res.json({ error: err.message })
        res.json(results)
    })
})

// POST agregar
app.post('/api/responsables', (req, res) => {
    const { nombre, apellido, dni, rol } = req.body
    db.query('INSERT INTO responsables (nombre, apellido, dni, rol) VALUES (?, ?, ?, ?)',
        [nombre, apellido, dni, rol], (err, result) => {
            if (err) return res.json({ error: err.message })
            res.json({ mensaje: 'Responsable agregado ✅', id: result.insertId })
        })
})

// PUT editar
app.put('/api/responsables/:id', (req, res) => {
    const { nombre, apellido, dni, rol } = req.body
    db.query('UPDATE responsables SET nombre=?, apellido=?, dni=?, rol=? WHERE id_responsable=?',
        [nombre, apellido, dni, rol, req.params.id], (err) => {
            if (err) return res.json({ error: err.message })
            res.json({ mensaje: 'Responsable actualizado ✅' })
        })
})

// DELETE eliminar
app.delete('/api/responsables/:id', (req, res) => {
    db.query('DELETE FROM responsables WHERE id_responsable = ?', [req.params.id], (err) => {
        if (err) return res.json({ error: err.message })
        res.json({ mensaje: 'Responsable eliminado ✅' })
    })
})

// ── STATS DASHBOARD ──────────────────────────────────

app.get('/api/stats', (req, res) => {
    const queries = {
        total: 'SELECT COUNT(*) AS total FROM equipos',
        estados: 'SELECT estado, COUNT(*) AS cantidad FROM equipos GROUP BY estado',
        labs: `SELECT l.nombre, COUNT(e.id_equipo) AS activos, l.capacidad_equipos AS total
               FROM laboratorios l LEFT JOIN equipos e ON l.id_laboratorio = e.id_laboratorio
               GROUP BY l.id_laboratorio`,
        actividad: 'SELECT id_equipo, tipo_actividad, descripcion, fecha_hora FROM actividad_reciente ORDER BY fecha_hora DESC LIMIT 5'
    }
    const resultado = {}
    db.query(queries.total, (err, r) => {
        resultado.total = r[0].total
        db.query(queries.estados, (err, r) => {
            resultado.estados = r
            db.query(queries.labs, (err, r) => {
                resultado.labs = r
                db.query(queries.actividad, (err, r) => {
                    resultado.actividad = r
                    res.json(resultado)
                })
            })
        })
    })
})

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
            { id: req.body.id },        // busca por ID
            { $set: req.body },          // actualiza con los nuevos datos
            { upsert: true, new: true }  // si no existe, lo crea
        )
        res.json({ mensaje: 'Hardware guardado ✅' })
    } catch (err) {
        res.json({ error: err.message })
    }
})

// Escuchar en 0.0.0.0 es indispensable para ambientes contenerizados
app.listen(3000, '0.0.0.0', () => {
    console.log('Inventario ITU corriendo en http://localhost:3000')
})