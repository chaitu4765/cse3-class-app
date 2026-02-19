import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (process.env.DATABASE_URL) {
    // For Supabase/Postgres in production
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: isProduction ? {
                require: true,
                rejectUnauthorized: false
            } : false
        },
        logging: false
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
