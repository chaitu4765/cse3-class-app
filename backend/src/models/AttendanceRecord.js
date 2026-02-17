import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Student from './Student.js';

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Student,
      key: 'id',
    },
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  present: {
    type: DataTypes.BOOLEAN,
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
      fields: ['studentId', 'subject', 'date'],
    },
  ],
});

AttendanceRecord.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(AttendanceRecord, { foreignKey: 'studentId' });

export default AttendanceRecord;
