import dotenv from 'dotenv';
dotenv.config();

import sequelize from "../src/config/database.js";
import Student from "../src/models/Student.js";

const test = async () => {
  try {
    console.log("Testing database connection...");
    await sequelize.authenticate();
    console.log("✅ Database connected");
    
    await sequelize.sync();
    console.log("✅ Database synced");
    
    const count = await Student.count();
    console.log(`✅ Found ${count} students in database`);
    
    const firstStudent = await Student.findOne();
    if (firstStudent) {
      console.log("\nFirst student:", {
        name: firstStudent.name,
        regNo: firstStudent.regNo,
        mobileNumber: firstStudent.mobileNumber
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
};

test();
