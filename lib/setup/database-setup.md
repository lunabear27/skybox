# Database Setup Instructions

To use the full dashboard functionality, you need to create a "files" collection in your Appwrite database.

## Required Collection: `files`

### Collection ID: `files`

### Attributes:

1. **name** (String, Required)
   - Size: 255
   - Description: File or folder name

2. **type** (String, Required)
   - Size: 10
   - Description: "file" or "folder"

3. **size** (Integer, Optional)
   - Description: File size in bytes

4. **mimeType** (String, Optional)
   - Size: 100
   - Description: MIME type of the file

5. **parentId** (String, Optional)
   - Size: 36
   - Description: Parent folder ID

6. **userId** (String, Required)
   - Size: 36
   - Description: Owner user ID

7. **isFavorite** (Boolean, Required)
   - Default: false
   - Description: Whether file is marked as favorite

8. **isDeleted** (Boolean, Required)
   - Default: false
   - Description: Whether file is in trash

9. **createdAt** (String, Required)
   - Size: 30
   - Description: ISO date string

10. **updatedAt** (String, Required)
    - Size: 30
    - Description: ISO date string

11. **storageId** (String, Optional)
    - Size: 36
    - Description: Appwrite storage file ID

12. **url** (String, Optional)
    - Size: 500
    - Description: File download URL

### Indexes:

1. **userId_index**
   - Type: Key
   - Attributes: userId
   - Orders: ASC

2. **type_index**
   - Type: Key
   - Attributes: type
   - Orders: ASC

3. **isDeleted_index**
   - Type: Key
   - Attributes: isDeleted
   - Orders: ASC

4. **isFavorite_index**
   - Type: Key
   - Attributes: isFavorite
   - Orders: ASC

5. **parentId_index**
   - Type: Key
   - Attributes: parentId
   - Orders: ASC

6. **updatedAt_index**
   - Type: Key
   - Attributes: updatedAt
   - Orders: DESC

7. **name_search**
   - Type: Fulltext
   - Attributes: name

### Permissions:

- **Create**: Users
- **Read**: Users
- **Update**: Users
- **Delete**: Users

## Storage Bucket Setup

You also need to create a storage bucket for file uploads:

### Bucket ID: Use the same as `appwriteConfig.bucketId` in your config

### Permissions:
- **Create**: Users
- **Read**: Any
- **Update**: Users
- **Delete**: Users

### File Security:
- Maximum file size: 50MB (or as needed)
- Allowed file extensions: * (all)
- Antivirus: Enabled (recommended)

## Environment Variables

Make sure your `.env.local` includes:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

This is used for generating file URLs and email links.

## How to Create in Appwrite Console:

1. Go to your Appwrite Console
2. Navigate to Databases
3. Select your database
4. Click "Create Collection"
5. Set Collection ID as "files"
6. Add all the attributes listed above
7. Create the indexes
8. Set the permissions
9. Go to Storage and create a bucket
10. Configure bucket permissions and settings

After setting up the database, your dashboard will have full functionality including:
- File upload and management
- Folder creation and organization
- Favorites and trash
- Search functionality
- Storage usage tracking
- Real-time file operations