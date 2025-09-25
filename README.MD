##  Tecnologías Utilizadas

**Frontend:**
- React (con TypeScript)
- React Router DOM
- Supabase (para autenticación y base de datos)
- CSS Modular (para estilos)

**Backend:**
- Node.js
- Express
- TypeScript
- Supabase (para base de datos)
- dotenv (para gestión de variables de entorno)
- Cors (para habilitar solicitudes entre dominios)

## Configuración del Entorno de Desarrollo

### Variables de Entorno

Backend (`portalbackend/.env`):
- `SUPABASE_URL=TU_SUPABASE_PROYECT_URL`
- `SUPABASE_SERVICE_KEY=TU_SUPABASE_SERVICE_ROLE_KEY`


Frontend (portalfrontend/.env):
- `REACT_APP_SUPABASE_URL=TU_SUPABASE_PROYECT_URL`
- `REACT_APP_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY`


### Clonar el Repositorio
Bash

git clone [https://github.com/tu-usuario/nombre-de-tu-repo.git](https://github.com/tu-usuario/nombre-de-tu-repo.git)
cd portalWeb

### Configuración del Backend

- `npm install`
- `npm install -D typescript @types/express @types/node @types/cors ts-node-dev dotenv @supabase/supabase-js`
- `npm install jsonwebtoken`
- `npm install --save-dev @types/jsonwebtoken`
- `npm install bcryptjs`
- `npm install --save-dev @types/bcryptjs`


### Configuración del Frontend

- `npm install`
- `npm install @supabase/supabase-js react-router-dom react-icons`


### Ejecutar la Aplicación
Iniciar el Backend Desde la carpeta portalbackend:

- `npm run dev`
El servidor backend se ejecutará en http://localhost:5000.


Iniciar el Frontend
Desde la carpeta portalfrontend:

- `npm start`