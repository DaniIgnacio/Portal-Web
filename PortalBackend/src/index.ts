import express from 'express';
import cors from 'cors';
import productRoutes from './routes/ProductRoutes';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use('/api', productRoutes); 

app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});