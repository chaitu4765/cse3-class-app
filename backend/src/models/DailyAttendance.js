import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DailyAttendance = sequelize.define('DailyAttendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  date: {
    type: DataTypes.STRING, // YYYY-MM-DD
    allowNull: false,
  },
  subject: {
    type: DataTypes.ENUM('ME', 'MP', 'DBMS', 'DAA', 'FLAT'),
    allowNull: false,
  },
  markedBy: {
    type: DataTypes.STRING,
    defaultValue: 'CR',
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['date', 'subject'],
    },
  ],
});

export default DailyAttendance;
