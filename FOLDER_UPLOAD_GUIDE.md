# Folder Upload Feature Guide

## Overview
The Folder Upload feature allows you to upload multiple PDF and Excel files from a folder with automatic password generation and Excel-based metadata mapping.

## Key Features

### 1. **Automatic Password Generation**
- Each file gets a unique 10-character password
- Passwords include lowercase, uppercase, numbers, and special characters
- All passwords are automatically copied and can be exported to Excel

### 2. **Excel Mapping File**
- Upload an Excel file containing metadata for your files
- System auto-detects column headers
- Maps file details like:
  - Filename
  - QP Details
  - Subcourse
  - Subject
  - Session
  - Semester/Year
  - Group/University
  - Start Time
  - End Time

### 3. **Bulk File Upload**
- Select entire folders
- Only PDF and Excel files are processed
- Max file size: 10MB per file
- Files are encrypted with unique passwords

### 4. **User Assignment (Admin Only)**
- Select default group/university
- Assign files to specific users
- Bulk assignment to multiple users

## How to Use

### Step 1: Prepare Your Excel Mapping File
Create an Excel file with columns matching your file details. Example:

| Filename | QPdetails | Subcourse | Subject | Session | Semyear | Group | StartTime | EndTime |
|----------|-----------|-----------|---------|---------|---------|-------|-----------|---------|
| exam1.pdf | QP-001 | CS | Math | 2024-2025 | Sem 1 | MIT | 2024-12-01 | 2024-12-31 |
| exam2.pdf | QP-002 | CS | Physics | 2024-2025 | Sem 1 | MIT | 2024-12-01 | 2024-12-31 |

### Step 2: Upload Excel Mapping File
1. Click "Select Excel Mapping File"
2. Choose your Excel file
3. System will auto-detect headers
4. Verify or adjust column mappings

### Step 3: Select Folder
1. Click or drag folder to upload area
2. System will filter only PDF and Excel files
3. Review selected files list

### Step 4: Configure Settings (Admin Only)
1. Select default group/university
2. Choose users to assign files to (optional)

### Step 5: Upload
1. Click "Upload X File(s)" button
2. Wait for processing (progress bar shows status)
3. View results table with all uploaded files

### Step 6: Export Results
1. Click "Copy All Passwords" to copy all passwords
2. Click "Export to Excel" to download results with:
   - Filenames
   - Passwords
   - Upload status
   - Download links

## Excel Header Mapping

The system auto-detects headers based on keywords:

| Field | Detected Keywords |
|-------|------------------|
| Filename | "file", "name" |
| QPdetails | "qp", "paper" |
| Subcourse | "subcourse", "course" |
| Subject | "subject" |
| Session | "session" |
| Semyear | "sem", "year" |
| Group | "group", "university" |
| StartTime | "start" |
| EndTime | "end" |

## File Naming Tips

- Ensure filenames in Excel match actual file names
- System matches with or without file extensions
- Partial matches are supported

## Security Features

- Each file gets unique password
- PDF files: Server-side password protection
- Excel files: Server-side password protection
- Other files: Client-side encryption
- Passwords stored securely
- Download links include password parameter

## Export Format

The exported Excel file contains:
- Filename
- Password
- Status (success/failed)
- Upload Date
- Download Link

## Troubleshooting

### Files Not Uploading
- Check file size (max 10MB)
- Ensure files are PDF or Excel format
- Verify Excel mapping file is uploaded

### Mapping Not Working
- Check filename column is correctly mapped
- Ensure filenames match between Excel and actual files
- Verify Excel file format (.xlsx or .xls)

### Users Not Showing
- Select group/university first
- Ensure users exist in selected group
- Admin role required for user assignment

## API Integration

The feature uses existing APIs:
- `uploadFile()` - Uploads individual files
- `assignFileToUsers()` - Assigns files to users
- `getUsers()` - Fetches available users and groups

## Notes

- Only admins can see group/user assignment options
- Files without mapping use default values
- Failed uploads are tracked and reported
- All operations are logged for audit
