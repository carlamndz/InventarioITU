use inventario_hardware

// 1. Ver todos los documentos cargados
db.hardware.find({}, { _id: 0 }).toArray()

// 2. Contar documentos
db.hardware.countDocuments()

// 3. Buscar hardware por ID de equipo
db.hardware.findOne(
  { id: "PC-LAB1-001" },
  { _id: 0 }
)

// 4. Buscar equipos con disco SSD
db.hardware.find(
  { "disco.tipo": "SSD" },
  { _id: 0, id: 1, fabricante: 1, modelo: 1, disco: 1 }
).toArray()

// 5. Buscar equipos con disco HDD
db.hardware.find(
  { "disco.tipo": "HDD" },
  { _id: 0, id: 1, fabricante: 1, modelo: 1, disco: 1 }
).toArray()

// 6. Buscar equipos con 16 GB de RAM o más
db.hardware.find(
  { "ram.capacidad_gb": { $gte: 16 } },
  { _id: 0, id: 1, fabricante: 1, modelo: 1, ram: 1 }
).toArray()

// 7. Buscar equipos con sistema operativo Ubuntu
db.hardware.find(
  { "sistema_operativo.nombre": "Ubuntu" },
  { _id: 0, id: 1, fabricante: 1, modelo: 1, sistema_operativo: 1 }
).toArray()

// 8. Buscar equipos fabricante Dell
db.hardware.find(
  { fabricante: "Dell" },
  { _id: 0, id: 1, fabricante: 1, modelo: 1 }
).toArray()

// 9. Buscar equipos con CPU Intel
db.hardware.find(
  { "cpu.fabricante": "Intel" },
  { _id: 0, id: 1, fabricante: 1, modelo: 1, cpu: 1 }
).toArray()