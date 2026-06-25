import express from 'express';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { createServer } from 'http';
import { initSocket } from './config/socket';

// Charge les variables d'environnement depuis le fichier .env
dotenv.config();

const app = express();
const server = createServer(app);
initSocket(server);

// Centralisation du port via le fichier .env
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Connexion à la base de données
connectDB();

import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import reportsRoutes from './routes/reports.routes';
import dashboardRoutes from './routes/dashboard.routes';
import servicesRoutes from './routes/services.routes';
import ordersRoutes from './routes/orders.routes';
import clientRoutes from './routes/client.routes';
import paymentsRoutes from './routes/payments.routes';
import configRoutes from './routes/config.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/config', configRoutes);

app.get('/', (req, res) => {
  res.status(200).send('API Pressing Gloria en ligne !');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API Pressing Gloria fonctionnelle' });
});

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
