import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Student from './Student.js';

const LeaveRequest = sequelize.define('LeaveRequest', {
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
  studentName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  regNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  },
  reviewedAt: {
    type: DataTypes.DATE,
  },
  reviewedBy: {
    type: DataTypes.STRING,
    defaultValue: 'CR',
  },
}, {
  timestamps: true,
});

LeaveRequest.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(LeaveRequest, { foreignKey: 'studentId' });

export default LeaveRequest;
