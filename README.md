# Sistema XV Astrid — Invitación + Panel del festejado + Panel de recepción

Sistema completo con backend real (Node/Express) para que el panel del festejado
y el panel de recepción compartan la misma base de datos de invitados.

## Estructura

```
astrid-sistema/
├── server.js              → servidor Express + API
├── package.json
├── db.json                → "base de datos" (archivo JSON, se crea solo)
└── public/
    ├── invitacion.html    → invitación para los invitados
    ├── panel-festejado.html   → para que Astrid gestione invitados
    └── panel-recepcion.html   → para escanear QR el día del evento
```

## Cómo funciona

1. En **panel-festejado.html**, agregas cada invitado (nombre + núm. de pases).
   El sistema genera automáticamente un **link único**, ej:
   `https://tu-app.onrender.com/invitacion.html?id=b62b2d48`
2. Le mandas ese link a cada invitado (por WhatsApp, por ejemplo). Cuando lo abre,
   la invitación se personaliza sola con su nombre y su número de pases, y su
   pase QR queda ligado a su propio link.
3. Cuando el invitado confirma asistencia (RSVP), el panel del festejado se
   actualiza con su estado en tiempo real.
4. El día del evento, abres **panel-recepcion.html** en un celular o tablet en
   la puerta. Escaneas el QR de cada invitado con la cámara y el sistema
   marca su entrada automáticamente — y avisa si alguien ya había entrado.

## Probar en tu computadora (opcional, antes de subirlo)

```bash
npm install
npm start
```

Abre `http://localhost:3000/invitacion.html`,
`http://localhost:3000/panel-festejado.html` y
`http://localhost:3000/panel-recepcion.html`.

## Subir a GitHub

```bash
git init
git add .
git commit -m "Sistema completo XV Astrid"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

## Desplegar en Render (con base de datos real)

### 1. Crea la base de datos primero

1. En Render, click en **"New +" → "PostgreSQL"**
2. Ponle un nombre, ej. `astrid-xv-db`
3. **Instance Type:** Free
4. Click **"Create Database"**
5. Espera 1-2 minutos a que quede lista. Cuando esté lista, busca el campo
   **"Internal Database URL"** y cópialo (empieza con `postgres://...`)

### 2. Crea el servicio web

1. Click en **"New +" → "Web Service"**
2. Conecta tu repositorio de GitHub (el que subiste)
3. Configura:
   - **Name:** `astrid-xv-sistema`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Antes de crear, baja hasta **"Environment Variables"** y agrega una:
   - **Key:** `DATABASE_URL`
   - **Value:** (pega el "Internal Database URL" que copiaste en el paso 1)
5. Click en **"Create Web Service"**

Con eso, tu invitados quedan guardados en PostgreSQL — **no se pierden** aunque
el servidor se duerma y despierte, ni aunque hagas otro `git push` después.

### Cómo saber si quedó bien conectado

En los logs de Render (pestaña "Logs" de tu Web Service), deberías ver:
```
✅ Conectado a PostgreSQL — los datos son permanentes.
```
Si en cambio ves `⚠️ Sin DATABASE_URL...`, significa que la variable de entorno
no quedó bien puesta — revisa el paso 4.

### Nota sobre el plan gratis de PostgreSQL en Render

La base de datos gratis de Render **expira a los 90 días** (te avisan por correo
antes). Para un evento que ya tiene fecha (12 de septiembre 2026), esto es más
que suficiente. Si más adelante quieres seguir usando el sistema para otros
eventos, en ese momento se puede subir a un plan pagado (~$7 USD/mes) o migrar
a otra base gratuita — dile a Claude cuando llegue el momento.

## Notas de diseño

- Paleta de colores: verde oliva + dorado (inspirada en la imagen de Tiana que compartiste)
- Tema: "Ghostin" — usamos un audio instrumental de ejemplo en la invitación,
  ya que no podemos incluir la canción original de Ariana Grande por derechos
  de autor. Puedes reemplazar el `<audio src="...">` en `invitacion.html` por
  tu propia pista.