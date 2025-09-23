import express from 'express';
import cors from 'cors';
import productRoutes from './routes/ProductRoutes';
import categoryRoutes from './routes/CategoryRoutes';
import ferreteriaRoutes from './routes/FerreteriaRoutes';
import authRoutes from './routes/AuthRoutes';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use('/api', productRoutes);
app.use('/api', categoryRoutes);
app.use('/api', ferreteriaRoutes);
app.use('/api', authRoutes);

app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});