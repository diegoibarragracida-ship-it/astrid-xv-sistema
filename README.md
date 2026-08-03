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

## Desplegar en Render

1. Entra a **[render.com](https://render.com)** y crea una cuenta (puedes usar tu cuenta de GitHub)
2. Click en **"New +" → "Web Service"**
3. Conecta tu repositorio de GitHub (el que acabas de subir)
4. Configura:
   - **Name:** `astrid-xv-sistema` (o el que quieras)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (suficiente para un evento)
5. Click en **"Create Web Service"**

Render te dará una URL como:
```
https://astrid-xv-sistema.onrender.com
```

Esa es tu base. Los tres módulos quedan en:
- `https://astrid-xv-sistema.onrender.com/invitacion.html` (invitación genérica de ejemplo)
- `https://astrid-xv-sistema.onrender.com/panel-festejado.html`
- `https://astrid-xv-sistema.onrender.com/panel-recepcion.html`

## ⚠️ Importante sobre el plan gratuito de Render

- En el plan **Free**, el servidor "se duerme" tras ~15 min sin uso y tarda unos
  segundos en despertar la primera vez que alguien entra — normal, no es un error.
- El archivo `db.json` vive en el disco del servidor. En el plan Free, **ese disco
  se reinicia vacío cada vez que Render reinicia el servicio** (por ejemplo, al
  hacer un nuevo `git push`). Para el día del evento:
  - Agrega a todos tus invitados en el panel **unos días antes**, sin volver a
    hacer `git push` después de eso, y listo — los datos se mantienen mientras
    no vuelvas a desplegar.
  - Si quieres que los datos sean 100% permanentes pase lo que pase (útil si vas
    a seguir usando el sistema para más eventos), el siguiente paso sería conectar
    una base de datos real (Render ofrece PostgreSQL gratis) — dile a Claude
    cuando quieras dar ese salto y te ayuda a migrarlo.

## Notas de diseño

- Paleta de colores: verde oliva + dorado (inspirada en la imagen de Tiana que compartiste)
- Tema: "Ghostin" — usamos un audio instrumental de ejemplo en la invitación,
  ya que no podemos incluir la canción original de Ariana Grande por derechos
  de autor. Puedes reemplazar el `<audio src="...">` en `invitacion.html` por
  tu propia pista.
