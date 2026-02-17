import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Student from '../src/models/Student.js';
import sequelize from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '..', '..', '2-6 CSE-3 MAIL ID REQUEST.csv');

async function populateMobileNumbers() {
    try {
        console.log('⏳ Connecting to database...');
        await sequelize.authenticate();

        if (!fs.existsSync(CSV_PATH)) {
            console.error(`❌ CSV file not found at: ${CSV_PATH}`);
            process.exit(1);
        }

        const content = fs.readFileSync(CSV_PATH, 'utf-8');
        const lines = content.split('\n');
        const headers = lines[0].split(',');

        // Find column indices
        const regNoIdx = headers.findIndex(h => h.includes('REISTRATION NO'));
        const mobileIdx = headers.findIndex(h => h.includes('MOBILE NUMBER'));

        if (regNoIdx === -1 || mobileIdx === -1) {
            console.error('❌ Could not find Registration No or Mobile Number columns in CSV');
            process.exit(1);
        }

        console.log('📊 Updating mobile numbers...');
        let updatedCount = 0;
        let notFoundCount = 0;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const row = lines[i].split(',');
            const regNo = row[regNoIdx]?.trim();
            const mobile = row[mobileIdx]?.trim();

            if (regNo && mobile) {
                const [updatedRows] = await Student.update(
                    { mobileNumber: mobile },
                    { where: { regNo: regNo } }
                );

                if (updatedRows > 0) {
                    updatedCount++;
                    console.log(`✅ Updated: ${regNo} -> ${mobile}`);
                } else {
                    notFoundCount++;
                    console.log(`⚠️ Student not found in DB: ${regNo}`);
                }
            }
        }

        console.log('\n✨ Mobile number population complete!');
        console.log(`✅ Students Updated: ${updatedCount}`);
        console.log(`⚠️ Students not found: ${notFoundCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during update:', error);
        process.exit(1);
    }
}

populateMobileNumbers();
