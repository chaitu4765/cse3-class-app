# Backend Data Directory

## Overview
This directory contains CSV data files used for importing student information into MongoDB.

## Files

### `students.csv` (Real Data - NOT TRACKED)
- **Purpose**: Contains actual student information for MongoDB import
- **Status**: ⚠️ **This file is ignored by git for privacy and security**
- **Location**: Stored locally only, never committed to the repository
- **Usage**: Used by the MongoDB import scripts to populate the database
- **Format**: CSV with columns: `Name`, `RegNo`, `DOB`, `Email`

### `students.sample.csv` (Template - TRACKED)
- **Purpose**: Provides a template showing the expected CSV structure
- **Status**: ✅ Tracked in git as a reference
- **Contents**: Dummy data with example headers and values
- **Usage**: Use this as a reference when creating your own `students.csv` file

## Security & Privacy

🔒 **Important Security Notes:**
- Real student data (`students.csv`) is **never committed** to the repository
- The file is excluded via `.gitignore` to prevent accidental exposure
- Only dummy/sample data is tracked in the repository
- This follows best practices for handling sensitive information in public repositories

## Setup Instructions

1. **For Development:**
   - Copy `students.sample.csv` to `students.csv`
   - Replace dummy data with your actual student information
   - The real `students.csv` will be ignored by git automatically

2. **For MongoDB Import:**
   - Ensure `students.csv` exists in this directory with real data
   - Run the import script: `node scripts/importStudents.js`
   - The script will read from `backend/data/students.csv`

## Data Format

The CSV file must follow this structure:

```csv
Name,RegNo,DOB,Email
John Doe,CSE001,2003-01-15,john.doe@example.com
Jane Smith,CSE002,2003-05-22,jane.smith@example.com
```

### Column Descriptions:
- **Name**: Student's full name
- **RegNo**: Registration number (unique identifier)
- **DOB**: Date of birth (YYYY-MM-DD format)
- **Email**: Student's email address

## MongoDB Integration

The data from `students.csv` is imported into the MongoDB `students` collection with additional fields:
- Auto-generated `_id`
- Hashed password (default: registration number)
- Role assignment (default: "student")
- Timestamps (createdAt, updatedAt)

See `scripts/importStudents.js` for implementation details.
