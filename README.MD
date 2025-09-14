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

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

### 1. Requisitos Previos

Asegúrate de tener instalado lo siguiente:
- [Node.js](https://nodejs.org/es/) (versión 18 o superior recomendada)
- [npm](https://www.npmjs.com/) (viene con Node.js)
- [Git](https://git-scm.com/)

#### Variables de Entorno

Backend (`portalbackend/.env`):
Crea un archivo `.env` en `portalbackend/` y añade:
SUPABASE_URL=TU_SUPABASE_PROYECT_URL
SUPABASE_SERVICE_KEY=TU_SUPABASE_SERVICE_ROLE_KEY


Frontend (portalfrontend/.env):
Crea un archivo .env en portalfrontend/ y añade:
REACT_APP_SUPABASE_URL=TU_SUPABASE_PROYECT_URL
REACT_APP_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY


3. Clonar el Repositorio
Bash

git clone [https://github.com/tu-usuario/nombre-de-tu-repo.git](https://github.com/tu-usuario/nombre-de-tu-repo.git)
cd portalWeb

4. Configuración del Backend

npm install
npm install -D typescript @types/express @types/node @types/cors ts-node-dev dotenv @supabase/supabase-js
npx tsc --init


5. Configuración del Frontend

npm install
npm install @supabase/supabase-js react-router-dom react-icons


6. Ejecutar la Aplicación
Iniciar el Backend Desde la carpeta portalbackend:

npm run dev
El servidor backend se ejecutará en http://localhost:5000.


Iniciar el Frontend
Desde la carpeta portalfrontend:

npm start