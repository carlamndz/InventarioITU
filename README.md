# Ecosistema de Inventario Seguro — ITU Mendoza

Proyecto Integrador EGI (Cloud, Linux, Windows, Base de Datos)

## Descripción

Sistema centralizado para inventariar las computadoras de los laboratorios de informática del ITU Mendoza. La aplicación web permite consultar ubicación y asignación de equipos (SQL Server) y sus componentes de hardware (MongoDB), con autenticación contra Active Directory/LDAP y despliegue contenerizado en Kubernetes.

## Arquitectura

| Servicio | Descripción | Puerto |
|---|---|---|
| inventario-web | Aplicación web frontend | 3000 |
| ubicacion-db | Base de datos SQL Server | 1433 |
| inventario-db | Base de datos MongoDB | 27017 |
| ldap-service | Servidor OpenLDAP | 389 |

## Estructura del repositorio

- app/ → Aplicación web (Node.js + Express)
- db/sqlserver/ → Scripts SQL y modelo relacional
- db/mongodb/ → Documentos JSON y scripts de inicialización
- ldap/ → Configuración OpenLDAP
- k8s/ → Manifiestos de Kubernetes
- docs/ → Diagramas y documentación

## Equipo

Proyecto Integrador — 2026

## Tecnologías

- Node.js + Express
- SQL Server / MySQL
- MongoDB
- OpenLDAP
- Docker
- Kubernetes (Minikube + Calico)
- GUFW (Firewall)
