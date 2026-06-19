# Despliegue en Minikube — Proyecto EGI Inventario ITU

## Requisitos previos
- Minikube instalado
- kubectl instalado
- Docker instalado

---

## Paso 1 — Iniciar Minikube con Calico (obligatorio para NetworkPolicies)

```bash
minikube start --cni=calico
```

---

## Paso 2 — Cargar la imagen del frontend en Minikube

Como usamos `imagePullPolicy: Never`, Minikube tiene que tener la imagen
construida localmente. Para eso:

```bash
# Apuntar Docker al daemon de Minikube
eval $(minikube docker-env)

# Construir la imagen dentro de Minikube
docker build -t inventario-itu:latest .
```

---

## Paso 3 — Actualizar la IP de PC-A

Antes de aplicar los manifiestos, reemplazar `192.168.1.10` con la IP real
de la PC donde corren SQL Server y LDAP. Para saber esa IP, correr en PC-A:

```
ipconfig
```

Editar estos archivos con la IP correcta:
- `k8s/03-external-services.yaml`
- `k8s/05-networkpolicies.yaml`

---

## Paso 4 — Aplicar los manifiestos en orden

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-mongodb.yaml
kubectl apply -f k8s/03-external-services.yaml
kubectl apply -f k8s/04-frontend.yaml
```

Verificar que todo esté corriendo antes de continuar:

```bash
kubectl get pods -n egi-inventario
# Esperar a que todos digan Running
```

---

## Paso 5 — Acceder a la aplicación

```bash
minikube service inventario-web -n egi-inventario
# Abre el navegador automáticamente en la IP:puerto correcta
```

O manualmente:
```bash
minikube ip
# Usar esa IP con el puerto 30080
# Ejemplo: http://192.168.49.2:30080
```

---

## Paso 6 — Aplicar NetworkPolicies (SOLO cuando todo funcione)

```bash
kubectl apply -f k8s/05-networkpolicies.yaml
```

Verificar que la app sigue funcionando después de aplicarlas.

---

## Comandos útiles de debug

```bash
# Ver estado de los pods
kubectl get pods -n egi-inventario

# Ver logs de la app
kubectl logs -l app=inventario-web -n egi-inventario

# Ver logs de MongoDB
kubectl logs -l app=inventario-db -n egi-inventario

# Conectarse a MongoDB desde consola
kubectl exec -it deployment/inventario-db -n egi-inventario -- \
  mongosh -u admin -p admin1234 --authenticationDatabase admin

# Ver las NetworkPolicies activas
kubectl get networkpolicies -n egi-inventario

# Describir un pod con problemas
kubectl describe pod <nombre-del-pod> -n egi-inventario
```

---

## Estructura del repositorio

```
/
├── app/                  ← código del frontend (de tu compañera)
│   ├── public/
│   ├── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── k8s/                  ← manifiestos de Kubernetes
│   ├── 00-namespace.yaml
│   ├── 01-secrets.yaml
│   ├── 02-mongodb.yaml
│   ├── 03-external-services.yaml
│   ├── 04-frontend.yaml
│   └── 05-networkpolicies.yaml
├── db/
│   ├── sqlserver/        ← scripts .sql (compañero de BD)
│   └── mongodb/          ← archivos .json con documentos (compañero de BD)
├── ldap/                 ← config del servidor (compañero de Windows)
└── docs/                 ← diagramas y documentación
```
