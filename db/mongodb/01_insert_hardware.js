const mongoose = require('mongoose');
const MongoClient = mongoose.mongo.MongoClient;

// Configuración de la URL de conexión.
// Cuando se haga el port-forward, el túnel local abrirá el puerto 27017.
const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const dbName = 'inventario_hardware';

async function main() {
    const client = new MongoClient(url);

    try {
        console.log('Conectando al servidor de MongoDB...');
        await client.connect();
        console.log('Conectado exitosamente a MongoDB ✅');

        const db = client.db(dbName);
        const collection = db.collection('hardware');

        // 1. Limpiar los datos viejos
        console.log('Limpiando colección existente...');
        const deleteResult = await collection.deleteMany({});
        console.log(`Documentos eliminados: ${deleteResult.deletedCount}`);

        // 2. Insertar tu set de datos de hardware
        console.log('Insertando nuevos equipos de hardware...');
        const documentos = [
            {
                id: "PC-LAB1-001",
                fabricante: "Dell",
                modelo: "OptiPlex 7090",
                tipo: "Desktop",
                cpu: { fabricante: "Intel", modelo: "Core i5-10500", frecuencia: "3.1GHz" },
                ram: { capacidad_gb: 8, tipo: "DDR4" },
                disco: { capacidad_gb: 256, tipo: "SSD" },
                sistema_operativo: { nombre: "Ubuntu", version: "22.04 LTS" },
                monitor: { fabricante: "Dell", tamanio: "22 pulgadas", resolucion: "Full HD" },
                perifericos: { mouse: true, teclado: true, detalle: "Mouse + Teclado USB" }
            },
            {
                id: "PC-LABSO-002",
                fabricante: "HP",
                modelo: "ProDesk 400 G7",
                tipo: "Desktop",
                cpu: { fabricante: "Intel", modelo: "Core i5-9500", frecuencia: "3.0GHz" },
                ram: { capacidad_gb: 8, tipo: "DDR4" },
                disco: { capacidad_gb: 512, tipo: "SSD" },
                sistema_operativo: { nombre: "Windows", version: "10 Pro" },
                monitor: { fabricante: "HP", tamanio: "21 pulgadas", resolucion: "Full HD" },
                perifericos: { mouse: true, teclado: true, detalle: "Mouse + Teclado USB" }
            },
            {
                id: "PC-LABSO-005",
                fabricante: "Lenovo",
                modelo: "ThinkCentre M75q",
                tipo: "Desktop",
                cpu: { fabricante: "AMD", modelo: "Ryzen 5 PRO 4650G", frecuencia: null },
                ram: { capacidad_gb: 16, tipo: "DDR4" },
                disco: { capacidad_gb: 512, tipo: "SSD" },
                sistema_operativo: { nombre: "Ubuntu", version: "22.04 LTS" },
                monitor: { fabricante: "Lenovo", tamanio: "24 pulgadas", resolucion: "Full HD" },
                perifericos: { mouse: true, teclado: true, detalle: "Mouse + Teclado USB" }
            },
            {
                id: "PC-LAB4-012",
                fabricante: "Dell",
                modelo: "OptiPlex 5090",
                tipo: "Desktop",
                cpu: { fabricante: "Intel", modelo: "Core i3-10100", frecuencia: "3.6GHz" },
                ram: { capacidad_gb: 4, tipo: "DDR4" },
                disco: { capacidad_gb: 1024, tipo: "HDD" },
                sistema_operativo: { nombre: "Windows", version: "11 Pro" },
                monitor: { fabricante: "Dell", tamanio: "19 pulgadas", resolucion: "HD" },
                perifericos: { mouse: true, teclado: true, detalle: "Mouse + Teclado USB" }
            },
            {
                id: "PC-LABSO-009",
                fabricante: "HP",
                modelo: "EliteDesk 800 G6",
                tipo: "Desktop",
                cpu: { fabricante: "Intel", modelo: "Core i7-10700", frecuencia: "2.9GHz" },
                ram: { capacidad_gb: 16, tipo: "DDR4" },
                disco: { capacidad_gb: 256, tipo: "SSD" },
                sistema_operativo: { nombre: "Ubuntu", version: "20.04 LTS" },
                monitor: { fabricante: "HP", tamanio: "24 pulgadas", resolucion: "Full HD" },
                perifericos: { mouse: true, teclado: true, detalle: "Mouse + Teclado USB" }
            },
            {
                id: "PC-LAB5-003",
                fabricante: "Lenovo",
                modelo: "IdeaCentre 5 14IMB05",
                tipo: "Desktop",
                cpu: { fabricante: "AMD", modelo: "Ryzen 3 3250U", frecuencia: null },
                ram: { capacidad_gb: 8, tipo: "DDR4" },
                disco: { capacidad_gb: 256, tipo: "SSD" },
                sistema_operativo: { nombre: "Windows", version: "11 Home" },
                monitor: { fabricante: "Lenovo", tamanio: "22 pulgadas", resolucion: "Full HD" },
                perifericos: { mouse: true, teclado: true, detalle: "Mouse + Teclado USB" }
            }
        ];

        const insertResult = await collection.insertMany(documentos);
        console.log(`Inserción exitosa. Se agregaron ${insertResult.insertedCount} equipos.`);

        // 3. Contar documentos para verificar (Tu db.hardware.countDocuments())
        const total = await collection.countDocuments();
        console.log(`Total actual de equipos en la colección 'hardware': ${total}`);

    } catch (error) {
        console.error('Ocurrió un error ejecutando el script:', error);
    } finally {
        // Cerramos la conexión de forma limpia al terminar
        await client.close();
        console.log('Conexión con MongoDB cerrada de forma segura.');
    }
}

main();
