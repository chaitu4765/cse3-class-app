import fs from "fs";
import path from "path";
import csv from "csv-parser";
import sequelize from "../src/config/database.js";
import Student from "../src/models/Student.js";

const userCsvPath = path.join(process.cwd(), "..", "2-6 CSE-3 MAIL ID REQUEST.csv");
const seedCsvPath = path.join(process.cwd(), "data", "students.csv");

const studentUpdates = new Map();

const runUpdate = async () => {
    try {
        await sequelize.sync();
        console.log("Database connected.");

        if (!fs.existsSync(userCsvPath)) {
            console.error(`❌ User CSV file not found at: ${userCsvPath}`);
            process.exit(1);
        }

        console.log(`Reading user CSV: ${userCsvPath}`);

        const rows = [];
        fs.createReadStream(userCsvPath)
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("end", async () => {
                console.log(`Read ${rows.length} rows.`);

                // Process rows to handle duplicates (take latest based on file order/timestamp)
                for (const row of rows) {
                    const regNo = row["REISTRATION NO:"]?.trim();
                    if (!regNo) continue;

                    const firstName = row["FIRST NAME:"]?.trim() || "";
                    const lastName = row["LAST NAME:"]?.trim() || "";
                    const email = row["PERSONAL MAIL ID:"]?.trim() || "";
                    const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");

                    // Normalize regNo to match database format (likely string)
                    studentUpdates.set(regNo, {
                        name: fullName,
                        email: email,
                        timestamp: row["Timestamp"]
                    });
                }

                console.log(`Found ${studentUpdates.size} unique students to update.`);

                let updatedDbCount = 0;

                // 1. Update Database
                for (const [regNo, data] of studentUpdates.entries()) {
                    const [affectedRows] = await Student.update(
                        { name: data.name, email: data.email },
                        { where: { regNo: regNo } }
                    );
                    if (affectedRows > 0) {
                        updatedDbCount++;
                    }
                }
                console.log(`✅ Updated ${updatedDbCount} records in database.`);

                // 2. Update students.csv seed file
                if (fs.existsSync(seedCsvPath)) {
                    console.log(`Updating seed file: ${seedCsvPath}`);
                    const seedRows = [];
                    fs.createReadStream(seedCsvPath)
                        .pipe(csv())
                        .on("data", (row) => seedRows.push(row))
                        .on("end", () => {
                            const newSeedRows = seedRows.map(row => {
                                const update = studentUpdates.get(row.RegNo);
                                if (update) {
                                    return {
                                        ...row,
                                        Name: update.name,
                                        Email: update.email
                                    };
                                }
                                return row;
                            });

                            // Construct CSV content manually to ensure headers match exactly
                            const csvContent = "Name,RegNo,DOB,Email\n" +
                                newSeedRows.map(r => `${r.Name},${r.RegNo},${r.DOB},${r.Email}`).join("\n");

                            fs.writeFileSync(seedCsvPath, csvContent);
                            console.log(`✅ Updated ${seedCsvPath} code successfully.`);
                            console.log("\n✨ All student data updates completed!");
                            process.exit(0);
                        });
                } else {
                    console.log("⚠️ Seed CSV file not found, skipping seed update.");
                    process.exit(0);
                }
            });
    } catch (err) {
        console.error("❌ Error during update:", err);
        process.exit(1);
    }
};

runUpdate();
