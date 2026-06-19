use inventario_hardware

db.hardware.deleteMany({})

db.hardware.insertMany([
  {
    id: "PC-LAB1-001",
    fabricante: "Dell",
    modelo: "OptiPlex 7090",
    tipo: "Desktop",
    cpu: {
      fabricante: "Intel",
      modelo: "Core i5-10500",
      frecuencia: "3.1GHz"
    },
    ram: {
      capacidad_gb: 8,
      tipo: "DDR4"
    },
    disco: {
      capacidad_gb: 256,
      tipo: "SSD"
    },
    sistema_operativo: {
      nombre: "Ubuntu",
      version: "22.04 LTS"
    },
    monitor: {
      fabricante: "Dell",
      tamanio: "22 pulgadas",
      resolucion: "Full HD"
    },
    perifericos: {
      mouse: true,
      teclado: true,
      detalle: "Mouse + Teclado USB"
    }
  },
  {
    id: "PC-LABSO-002",
    fabricante: "HP",
    modelo: "ProDesk 400 G7",
    tipo: "Desktop",
    cpu: {
      fabricante: "Intel",
      modelo: "Core i5-9500",
      frecuencia: "3.0GHz"
    },
    ram: {
      capacidad_gb: 8,
      tipo: "DDR4"
    },
    disco: {
      capacidad_gb: 512,
      tipo: "SSD"
    },
    sistema_operativo: {
      nombre: "Windows",
      version: "10 Pro"
    },
    monitor: {
      fabricante: "HP",
      tamanio: "21 pulgadas",
      resolucion: "Full HD"
    },
    perifericos: {
      mouse: true,
      teclado: true,
      detalle: "Mouse + Teclado USB"
    }
  },
  {
    id: "PC-LABSO-005",
    fabricante: "Lenovo",
    modelo: "ThinkCentre M75q",
    tipo: "Desktop",
    cpu: {
      fabricante: "AMD",
      modelo: "Ryzen 5 PRO 4650G",
      frecuencia: null
    },
    ram: {
      capacidad_gb: 16,
      tipo: "DDR4"
    },
    disco: {
      capacidad_gb: 512,
      tipo: "SSD"
    },
    sistema_operativo: {
      nombre: "Ubuntu",
      version: "22.04 LTS"
    },
    monitor: {
      fabricante: "Lenovo",
      tamanio: "24 pulgadas",
      resolucion: "Full HD"
    },
    perifericos: {
      mouse: true,
      teclado: true,
      detalle: "Mouse + Teclado USB"
    }
  },
  {
    id: "PC-LAB4-012",
    fabricante: "Dell",
    modelo: "OptiPlex 5090",
    tipo: "Desktop",
    cpu: {
      fabricante: "Intel",
      modelo: "Core i3-10100",
      frecuencia: "3.6GHz"
    },
    ram: {
      capacidad_gb: 4,
      tipo: "DDR4"
    },
    disco: {
      capacidad_gb: 1024,
      tipo: "HDD"
    },
    sistema_operativo: {
      nombre: "Windows",
      version: "11 Pro"
    },
    monitor: {
      fabricante: "Dell",
      tamanio: "19 pulgadas",
      resolucion: "HD"
    },
    perifericos: {
      mouse: true,
      teclado: true,
      detalle: "Mouse + Teclado USB"
    }
  },
  {
    id: "PC-LABSO-009",
    fabricante: "HP",
    modelo: "EliteDesk 800 G6",
    tipo: "Desktop",
    cpu: {
      fabricante: "Intel",
      modelo: "Core i7-10700",
      frecuencia: "2.9GHz"
    },
    ram: {
      capacidad_gb: 16,
      tipo: "DDR4"
    },
    disco: {
      capacidad_gb: 256,
      tipo: "SSD"
    },
    sistema_operativo: {
      nombre: "Ubuntu",
      version: "20.04 LTS"
    },
    monitor: {
      fabricante: "HP",
      tamanio: "24 pulgadas",
      resolucion: "Full HD"
    },
    perifericos: {
      mouse: true,
      teclado: true,
      detalle: "Mouse + Teclado USB"
    }
  },
  {
    id: "PC-LAB5-003",
    fabricante: "Lenovo",
    modelo: "IdeaCentre 5 14IMB05",
    tipo: "Desktop",
    cpu: {
      fabricante: "AMD",
      modelo: "Ryzen 3 3250U",
      frecuencia: null
    },
    ram: {
      capacidad_gb: 8,
      tipo: "DDR4"
    },
    disco: {
      capacidad_gb: 256,
      tipo: "SSD"
    },
    sistema_operativo: {
      nombre: "Windows",
      version: "11 Home"
    },
    monitor: {
      fabricante: "Lenovo",
      tamanio: "22 pulgadas",
      resolucion: "Full HD"
    },
    perifericos: {
      mouse: true,
      teclado: true,
      detalle: "Mouse + Teclado USB"
    }
  }
])

db.hardware.countDocuments()