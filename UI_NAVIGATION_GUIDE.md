# File Upload UI Navigation Guide

## Overview
I've added seamless navigation between Single File Upload and Bulk Folder Upload pages to improve user experience.

## What's Been Added

### 1. **File Upload Page (Single File)**
Located at: `/file-upload`

#### New UI Elements:

**A. Header Navigation Button**
- Position: Top-right corner of the page
- Button: "Bulk Upload" with folder icon
- Color: Green (#52c41a)
- Action: Navigates to `/folder-upload`

**B. Info Banner**
- Position: Below page header, above main upload card
- Type: Info alert (blue)
- Content: 
  - Title: "Need to upload multiple files?"
  - Description: Explains bulk upload feature
  - Button: "Go to Bulk Upload" - navigates to folder upload
- Dismissible: Yes (users can close it)
- Visibility: Only shows when no file has been uploaded yet

### 2. **Folder Upload Page (Bulk Upload)**
Located at: `/folder-upload`

#### New UI Elements:

**A. Header Navigation Button**
- Position: Top-right corner of the page
- Button: "Single File Upload" with cloud icon
- Color: Blue (#1890ff)
- Action: Navigates to `/file-upload`

**B. Info Banner**
- Position: Below page header
- Type: Info alert (blue)
- Content:
  - Title: "How Bulk Upload Works"
  - Description: 4-step guide explaining the process
  - Footer: Link to single file upload
- Dismissible: Yes (users can close it)
- Visibility: Only shows before files are uploaded

## User Flow

### Scenario 1: User Starts with Single File Upload
1. User lands on `/file-upload`
2. Sees info banner about bulk upload feature
3. Can click "Go to Bulk Upload" button in banner OR "Bulk Upload" button in header
4. Navigates to `/folder-upload`

### Scenario 2: User Starts with Bulk Upload
1. User lands on `/folder-upload`
2. Sees info banner explaining how bulk upload works
3. If they need single file upload, clicks "Single File Upload" button in header
4. Navigates to `/file-upload`

### Scenario 3: User Switches Between Pages
1. User can freely switch between both pages using header buttons
2. Info banners are dismissible if user doesn't need guidance
3. After successful upload, banners hide automatically

## Visual Design

### Button Styles
```
Single File Upload Page:
- Button: "Bulk Upload"
- Icon: FolderOpenOutlined
- Border: Green (#52c41a)
- Text: Green (#52c41a)
- Height: 40px
- Border Radius: 6px

Folder Upload Page:
- Button: "Single File Upload"
- Icon: CloudUploadOutlined
- Border: Blue (#1890ff)
- Text: Blue (#1890ff)
- Height: 40px
- Border Radius: 6px
```

### Info Banner Styles
```
Both Pages:
- Type: Alert (info)
- Icon: Auto (info icon for alerts)
- Border Radius: 6px
- Margin: 16px bottom
- Closable: Yes
- Show Icon: Yes
```

## Responsive Design

### Desktop (> 768px)
- Header buttons appear on the right side
- Info banners show full content
- Layout: Flex row with space-between

### Mobile (< 768px)
- Header buttons stack below title
- Info banners remain full width
- Layout: Flex column

## Benefits

1. **Easy Navigation**: Users can quickly switch between upload modes
2. **Clear Guidance**: Info banners explain features and use cases
3. **Consistent Design**: Both pages follow same design patterns
4. **User-Friendly**: Dismissible banners don't clutter the interface
5. **Contextual Help**: Information appears when needed, hides after upload

## Routes Required

Make sure these routes are configured in your router:

```javascript
// In your router configuration
<Route path="/file-upload" element={<FileUpload />} />
<Route path="/folder-upload" element={<FolderUpload />} />
```

## Testing Checklist

- [ ] Click "Bulk Upload" button on File Upload page
- [ ] Click "Single File Upload" button on Folder Upload page
- [ ] Verify info banners appear on both pages
- [ ] Dismiss info banners and verify they close
- [ ] Upload a file and verify banner hides
- [ ] Test navigation on mobile devices
- [ ] Verify button styling matches design
- [ ] Check that routes work correctly

## Future Enhancements

Consider adding:
1. Breadcrumb navigation
2. Recent uploads widget
3. Quick stats (files uploaded today, total storage used)
4. Keyboard shortcuts (Ctrl+B for bulk upload)
5. User preferences to remember last used upload mode
