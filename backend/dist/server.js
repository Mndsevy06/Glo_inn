"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const http_1 = require("http");
const socket_1 = require("./config/socket");
// Charge les variables d'environnement depuis le fichier .env
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
(0, socket_1.initSocket)(server);
// Centralisation du port via le fichier .env
const PORT = process.env.PORT || 5000;
// Middlewares
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Connexion à la base de données
(0, db_1.connectDB)();
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const services_routes_1 = __importDefault(require("./routes/services.routes"));
const orders_routes_1 = __importDefault(require("./routes/orders.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
const payments_routes_1 = __importDefault(require("./routes/payments.routes"));
const config_routes_1 = __importDefault(require("./routes/config.routes"));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/reports', reports_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/services', services_routes_1.default);
app.use('/api/orders', orders_routes_1.default);
app.use('/api/client', client_routes_1.default);
app.use('/api/payments', payments_routes_1.default);
app.use('/api/config', config_routes_1.default);
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
