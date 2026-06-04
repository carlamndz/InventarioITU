const express = require('express')
const app = express()

app.use(express.json())
app.use(express.static('public'))

app.listen(3000, () => {
    console.log('Inventario ITU corriendo en http://localhost:3000')
})

app.post('/login', (req, res) => {
    const { usuario, password } = req.body

    // POR AHORA usuario de prueba - después se conecta a LDAP
    if (usuario === 'admin' && password === '1234') {
        res.json({
            usuario: {
                nombre: 'Administrador ITU',
                usuario: 'admin',
                rol: 'administrador'
            }
        })
    } else {
        res.json({ error: 'Usuario o contraseña incorrectos' })
    }
})