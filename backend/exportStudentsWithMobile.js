import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Student from './src/models/Student.js';
import sequelize from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportToCSV() {
    try {
        await sequelize.authenticate();
        const students = await Student.findAll({ order: [['regNo', 'ASC']] });

        let csvContent = 'Name,RegNo,DOB,Email,MobileNumber\n';
        students.forEach(s => {
            const dob = s.dob ? new Date(s.dob).toISOString().split('T')[0] : '2003-01-01';
            csvContent += `${s.name},${s.regNo},${dob},${s.email || ''},${s.mobileNumber || ''}\n`;
        });

        const csvPath = path.join(__dirname, 'data', 'students.csv');
        fs.writeFileSync(csvPath, csvContent);
        console.log(`✅ Exported ${students.length} students to ${csvPath}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error exporting to CSV:', error);
        process.exit(1);
    }
}

exportToCSV();
