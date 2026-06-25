"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const connectDB = async () => {
    try {
        // Une simple requête pour tester la connexion
        await prisma.$connect();
        console.log('✅ Connexion à la base de données PostgreSQL réussie (via Prisma).');
    }
    catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
exports.default = prisma;
