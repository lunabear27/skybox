# 🔧 File Upload Troubleshooting Guide

## 🧪 Step 1: Use the Debug Tool

I've created a debug tool to help identify the issue:

1. **Go to**: `http://localhost:3000/debug-upload`
2. **Open browser console** (F12)
3. **Click "Test File Upload"**
4. **Select a small file**
5. **Check the debug output and console logs**

## 🔍 Common Issues & Solutions

### ❌ Issue 1: "No session token found"
**Symptoms**: Debug shows "Session Token: Not Found"
**Solution**: 
- Log out and log back in
- Check if you're properly authenticated
- Verify cookies are being set

### ❌ Issue 2: Storage bucket not found
**Symptoms**: Error about bucket ID or storage access
**Solution**:
1. Go to Appwrite Console → Storage
2. Check if bucket `6880cfae003de2d90297` exists
3. If not, create a new bucket or update `.env.local`

### ❌ Issue 3: Database collection not found
**Symptoms**: Error about "files" collection
**Solution**:
1. Go to Appwrite Console → Databases
2. Select your database
3. Create "files" collection with these attributes:

```
Collection ID: files

Required Attributes:
- name (String, 255, Required)
- type (String, 10, Required) 
- userId (String, 36, Required)
- isFavorite (Boolean, Required, Default: false)
- isDeleted (Boolean, Required, Default: false)
- createdAt (String, 30, Required)
- updatedAt (String, 30, Required)

Optional Attributes:
- size (Integer, Optional)
- mimeType (String, 100, Optional)
- parentId (String, 36, Optional)
- storageId (String, 36, Optional)
- url (String, 500, Optional)
```

### ❌ Issue 4: Permission denied
**Symptoms**: 401/403 errors in console
**Solution**:

**For Storage Bucket:**
- Create: Users
- Read: Any (or Users)
- Update: Users  
- Delete: Users

**For Files Collection:**
- Create: Users
- Read: Users
- Update: Users
- Delete: Users

### ❌ Issue 5: CORS errors
**Symptoms**: CORS policy errors in console
**Solution**:
1. Go to Appwrite Console → Settings
2. Add your domain to allowed origins:
   - `http://localhost:3000`
   - `https://localhost:3000`

## 🔧 Quick Fixes

### Fix 1: Reset Session
```bash
# Clear browser cookies and localStorage
# Then log out and log back in
```

### Fix 2: Check Environment Variables
Verify your `.env.local` has:
```
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://nyc.cloud.appwrite.io/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="6880c686001ee8dd4724"
NEXT_PUBLIC_APPWRITE_DATABASE_ID="6880cd1f00122641efc5"
NEXT_PUBLIC_APPWRITE_BUCKET_ID="6880cfae003de2d90297"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Fix 3: Restart Development Server
```bash
npm run dev
```

## 📋 Debug Checklist

Run through this checklist:

- [ ] ✅ User is logged in
- [ ] ✅ Session token exists in cookies
- [ ] ✅ Storage bucket exists with correct ID
- [ ] ✅ Files collection exists with correct attributes
- [ ] ✅ Bucket permissions are set correctly
- [ ] ✅ Collection permissions are set correctly
- [ ] ✅ No CORS errors in console
- [ ] ✅ Environment variables are correct

## 🆘 Still Not Working?

If the debug tool shows specific errors, here's what to do:

1. **Copy the exact error message** from the debug output
2. **Check browser console** for additional details
3. **Verify Appwrite Console** settings match your config
4. **Try with a very small file** (< 1MB) first

## 📞 Next Steps

After running the debug tool, you'll have specific error messages that will help identify the exact issue. The debug tool will show you:

- ✅ Session status
- ✅ Configuration values  
- ✅ Storage access test
- ✅ Database access test
- ✅ Detailed error messages

Use this information to pinpoint exactly what's failing! 🎯