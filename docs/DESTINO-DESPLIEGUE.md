# Destino de despliegue confirmado por el usuario

- VPS: `72.60.52.111`
- Backend: `https://api.operfoods.com`
- Healthcheck: `https://api.operfoods.com/health`
- Frontend: `https://app.operfoods.com`
- API pública configurada en el build del frontend: `https://api.operfoods.com/` (sin prefijo `/api`).

El backend ya permite `https://app.operfoods.com` en CORS, incluyendo el encabezado `X-Business-Id`.

Antes de desplegar: inspeccionar servicios y proxy existentes, respaldar la base, restaurar una copia aislada, aplicar y verificar la migración allí, y ejecutar el recorrido completo. No ejecutar los contenedores del sistema de casinos para levantar Operfoods.

Se debe proporcionar en el servidor la configuración real de PostgreSQL y JWT y el archivo privado de Firebase que utiliza el backend, sin incluirlos en Git ni en paquetes públicos.

En esta sesión no se alcanzó la autenticación SSH: el entorno rechazó la conexión al puerto 22. No se verificó el inventario del VPS ni se modificaron servicios o bases de datos.

Comprobación HTTPS: ambos dominios presentan un certificado cuyo nombre es `api-appsegora.chilsmart.com`; la validación TLS falla porque no incluye `api.operfoods.com` ni `app.operfoods.com`. Hay que revisar las rutas del proxy y emitir/asignar los certificados correspondientes antes de considerar el despliegue accesible por HTTPS.
