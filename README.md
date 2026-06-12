# PrestaControl NI 💰
Sistema de control de préstamos con cuotas semanales — Nicaragua (Córdobas C$)

---

## PASOS PARA PUBLICAR (sigue en orden)

---

### PASO 1 — Crear proyecto en Supabase (base de datos gratis)

1. Ve a https://supabase.com y crea una cuenta gratis
2. Click en **"New project"**
3. Nombre del proyecto: `prestacontrol`
4. Elige una contraseña fuerte (guárdala)
5. Región: **South America (São Paulo)** — la más cercana a Nicaragua
6. Click **"Create new project"** — espera ~2 minutos

---

### PASO 2 — Crear las tablas en Supabase

1. En tu proyecto Supabase, ve al menú izquierdo → **SQL Editor**
2. Click en **"New query"**
3. Abre el archivo `schema.sql` de esta carpeta
4. Copia todo el contenido y pégalo en el editor
5. Click **"Run"** (botón verde)
6. Debe decir: *"Success. No rows returned"*

---

### PASO 3 — Crear los usuarios (tú y el cobrador)

1. En Supabase, ve a **Authentication → Users**
2. Click **"Add user"** → "Create new user"
3. Crea tu usuario (el admin):
   - Email: tu correo
   - Password: tu contraseña
4. Crea el usuario del cobrador:
   - Email: correo del cobrador
   - Password: contraseña para él

**Darle rol admin a tu usuario:**
1. Ve a **SQL Editor** → New query
2. Primero busca tu UUID:
   ```sql
   select id, email from auth.users;
   ```
3. Copia el UUID de TU correo
4. Ejecuta esto (reemplaza el UUID):
   ```sql
   update public.usuarios
   set rol = 'admin'
   where id = 'PEGA-TU-UUID-AQUI';
   ```
5. Click Run ✓

---

### PASO 4 — Obtener las claves de Supabase

1. En Supabase, ve a **Settings → API**
2. Copia estos dos valores:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** key → texto largo que empieza con `eyJ...`
3. Guárdalos, los necesitas en el Paso 6

---

### PASO 5 — Subir el código a GitHub

1. Ve a https://github.com y crea una cuenta si no tienes
2. Click **"New repository"**
3. Nombre: `prestacontrol-ni`
4. Visibility: **Private**
5. Click **"Create repository"**
6. Sube todos los archivos de esta carpeta al repo
   (puedes usar "uploading an existing file" si no sabes git)

---

### PASO 6 — Publicar en Vercel (gratis)

1. Ve a https://vercel.com → crea cuenta con tu GitHub
2. Click **"Add New Project"**
3. Selecciona el repo `prestacontrol-ni`
4. En **"Environment Variables"** agrega:
   - `VITE_SUPABASE_URL` = la URL de Supabase del Paso 4
   - `VITE_SUPABASE_ANON_KEY` = la anon key del Paso 4
5. Click **"Deploy"**
6. Espera ~1 minuto
7. Vercel te da un link como: `https://prestacontrol-ni.vercel.app`

---

### PASO 7 — Probar y compartir

- **Tú (admin)**: abre el link en tu celular, entra con tu correo/contraseña
  → Ves panel completo, puedes agregar préstamos
- **Cobrador**: abre el mismo link en su celular, entra con su correo/contraseña
  → Ve solo los cobros pendientes, toca cada cuota para marcarla pagada
- **Tiempo real**: cuando el cobrador marca una cuota, tú la ves al instante

---

## Funciones de la app

| Función | Admin | Cobrador |
|---------|-------|----------|
| Ver todos los clientes | ✓ | ✓ |
| Ver cuotas pendientes | ✓ | ✓ |
| Marcar cuota como pagada | ✓ | ✓ |
| Agregar nuevo préstamo | ✓ | ✗ |
| Eliminar préstamo | ✓ | ✗ |
| Resumen financiero (C$) | ✓ | ✗ |

---

## Soporte

Si tienes dudas en algún paso, pregúntale a Claude con el mensaje:
"Estoy configurando PrestaControl NI y tengo problemas en el Paso X"
