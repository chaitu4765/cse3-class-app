import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Student from './Student.js';

const Attendance = sequelize.define('Attendance', {
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
  attended: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  total: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  percentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('Eligible', 'Ineligible'),
    defaultValue: 'Eligible',
  },
}, {
  timestamps: true,
  hooks: {
    beforeSave: (attendance) => {
      if (attendance.total > 0) {
        attendance.percentage = Math.round((attendance.attended / attendance.total) * 100);

        if (attendance.percentage >= 75) {
          attendance.status = 'Eligible';
        } else {
          attendance.status = 'Ineligible';
        }
      } else {
        attendance.percentage = 0;
      }
    },
  },
});

Attendance.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(Attendance, { foreignKey: 'studentId' });

export default Attendance;
