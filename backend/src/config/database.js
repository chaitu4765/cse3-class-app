import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

let sequelize;

if (process.env.DATABASE_URL) {
    // For Supabase/Postgres in production
    // Ensure the URL uses postgresql:// protocol
    const dbUrl = process.env.DATABASE_URL.replace('postgres://', 'postgresql://');

    sequelize = new Sequelize(dbUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
} else {
    // Fallback to local SQLite for development
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../../data/database_v2.sqlite'),
        logging: false,
    });
}

export default sequelize;
