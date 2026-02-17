import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Student from './Student.js';
import DailyAttendance from './DailyAttendance.js';

const DailyAttendanceRecord = sequelize.define('DailyAttendanceRecord', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    dailyAttendanceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: DailyAttendance,
            key: 'id',
        },
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Student,
            key: 'id',
        },
    },
    status: {
        type: DataTypes.ENUM('Present', 'Absent'),
        allowNull: false,
    },
}, {
    timestamps: true,
});

DailyAttendance.hasMany(DailyAttendanceRecord, { foreignKey: 'dailyAttendanceId', as: 'records' });
DailyAttendanceRecord.belongsTo(DailyAttendance, { foreignKey: 'dailyAttendanceId' });

DailyAttendanceRecord.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(DailyAttendanceRecord, { foreignKey: 'studentId' });

export default DailyAttendanceRecord;
