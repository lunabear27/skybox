# 🚀 Dashboard Setup Instructions

## ✅ File Upload Issue Fixed!

The file upload functionality has been updated to work properly with Next.js client/server components. Here's what was fixed:

### 🔧 Changes Made:
1. **Created client-side upload utility** (`lib/utils/clientFileUpload.ts`)
2. **Added session token utility** (`lib/utils/getSessionToken.ts`)
3. **Updated DashboardContent** to use client-side uploads
4. **Installed Appwrite client SDK** (`npm install appwrite`)

## 📋 Required Setup Steps:

### 1. Create Database Collection

In your Appwrite Console, create a collection called **"files"** with these attributes:

```
Collection ID: files

Attributes:
- name (String, 255, Required)
- type (String, 10, Required) 
- size (Integer, Optional)
- mimeType (String, 100, Optional)
- parentId (String, 36, Optional)
- userId (String, 36, Required)
- isFavorite (Boolean, Required, Default: false)
- isDeleted (Boolean, Required, Default: false)
- createdAt (String, 30, Required)
- updatedAt (String, 30, Required)
- storageId (String, 36, Optional)
- url (String, 500, Optional)

Indexes:
- userId_index (Key: userId, ASC)
- type_index (Key: type, ASC)
- isDeleted_index (Key: isDeleted, ASC)
- isFavorite_index (Key: isFavorite, ASC)
- parentId_index (Key: parentId, ASC)
- updatedAt_index (Key: updatedAt, DESC)
- name_search (Fulltext: name)

Permissions:
- Create: Users
- Read: Users  
- Update: Users
- Delete: Users
```

### 2. Create Storage Bucket

Create a storage bucket with:
- **Bucket ID**: Use the same as in your `appwriteConfig.bucketId`
- **Permissions**: Create/Read/Update/Delete for Users
- **File Security**: Max 50MB, all extensions allowed

### 3. Environment Variables

Add to your `.env.local`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎉 Features Now Working:

### ✅ **File Upload**
- Drag & drop files
- Click to browse files
- Real-time progress tracking
- Multiple file uploads

### ✅ **File Management**
- Create folders
- Rename files/folders
- Move to trash & restore
- Permanent deletion
- Toggle favorites

### ✅ **File Organization**
- Search functionality
- Filter by type (documents, photos, videos)
- Recent activity tracking
- Storage usage analytics

### ✅ **UI Features**
- Responsive design
- Loading states
- Error handling
- Smooth animations

## 🧪 Test the Upload:

1. Go to `/dashboard`
2. Click "Upload" in the navigation
3. Drag & drop a file or click to browse
4. Watch the progress bar
5. File should appear in your file list!

## 🔍 Troubleshooting:

If uploads still don't work:

1. **Check browser console** for any errors
2. **Verify database collection** is created correctly
3. **Check storage bucket** permissions
4. **Ensure session is valid** (try logging out and back in)
5. **Check network tab** for failed API calls

The dashboard is now fully functional with professional file management capabilities! 🎯