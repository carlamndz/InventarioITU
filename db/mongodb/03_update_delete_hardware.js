use inventario_hardware

// 1. Actualizar la memoria RAM de una PC
db.hardware.updateOne(
  { id: "PC-LAB1-001" },
  {
    $set: {
      "ram.capacidad_gb": 16,
      "ram.tipo": "DDR4"
    }
  }
)

// Verificar actualización de RAM
db.hardware.findOne(
  { id: "PC-LAB1-001" },
  { _id: 0, id: 1, ram: 1 }
)

// 2. Actualizar el disco de una PC
db.hardware.updateOne(
  { id: "PC-LAB4-012" },
  {
    $set: {
      "disco.capacidad_gb": 512,
      "disco.tipo": "SSD"
    }
  }
)

// Verificar actualización de disco
db.hardware.findOne(
  { id: "PC-LAB4-012" },
  { _id: 0, id: 1, disco: 1 }
)

// 3. Agregar un campo nuevo solo a un equipo
db.hardware.updateOne(
  { id: "PC-LAB4-012" },
  {
    $set: {
      diagnostico: {
        falla_detectada: "Disco dañado",
        requiere_reemplazo: true
      }
    }
  }
)

// Verificar documento con estructura diferente
db.hardware.findOne(
  { id: "PC-LAB4-012" },
  { _id: 0 }
)

// 4. Insertar un equipo temporal de prueba
db.hardware.insertOne({
  id: "PC-TEST-001",
  fabricante: "Equipo de prueba",
  modelo: "Temporal",
  tipo: "Desktop",
  cpu: {
    fabricante: "Intel",
    modelo: "Prueba",
    frecuencia: null
  },
  ram: {
    capacidad_gb: 4,
    tipo: "DDR3"
  },
  disco: {
    capacidad_gb: 128,
    tipo: "SSD"
  },
  sistema_operativo: {
    nombre: "Linux",
    version: "Test"
  },
  monitor: null,
  perifericos: {
    mouse: false,
    teclado: false,
    detalle: "Sin periféricos"
  }
})

// Verificar que existe
db.hardware.findOne(
  { id: "PC-TEST-001" },
  { _id: 0 }
)

// 5. Eliminar el equipo temporal
db.hardware.deleteOne({ id: "PC-TEST-001" })

// Verificar eliminación
db.hardware.findOne(
  { id: "PC-TEST-001" },
  { _id: 0 }
)