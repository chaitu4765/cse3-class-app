import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  regNo: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  dob: {
    type: DataTypes.DATE,
  },
  email: {
    type: DataTypes.STRING,
  },
  mobileNumber: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
});

export default Student;
