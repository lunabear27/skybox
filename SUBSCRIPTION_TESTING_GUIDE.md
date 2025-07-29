# 🚀 Subscription System Testing Guide

## 📋 **Quick Setup Checklist**

### ✅ **Step 1: Database Setup**

1. **Visit Setup Page**: Go to `/setup-subscriptions`
2. **Create Collection**: Click "Setup Subscriptions Collection"
3. **Verify Setup**: Click "Check Setup Status"
4. **Confirm Success**: Should see green success message

### ✅ **Step 2: Test Basic Functionality**

1. **Load Subscription**: Click "Load Current Subscription"
2. **Start Trial**: Try "Start Basic Trial"
3. **Upgrade Plan**: Test "Upgrade to Pro"
4. **Cancel Subscription**: Test cancellation

### ✅ **Step 3: Test Upload Limits**

1. **Small Files**: Upload files under plan limits
2. **Large Files**: Try uploading files exceeding limits
3. **Verify Errors**: Check for proper error messages

---

## 🧪 **Detailed Testing Scenarios**

### **1. Database Setup Testing**

#### **Test Case: Create Subscriptions Collection**

- **Action**: Click "Setup Subscriptions Collection"
- **Expected**: Green success message with collection details
- **Verify**: Collection created with all required attributes and indexes

#### **Test Case: Check Setup Status**

- **Action**: Click "Check Setup Status"
- **Expected**: "Subscriptions collection is properly configured"
- **Verify**: All attributes and indexes are present

### **2. Subscription Management Testing**

#### **Test Case: Load Current Subscription**

- **Action**: Click "Load Current Subscription"
- **Expected**: Shows current plan (Free by default)
- **Verify**: Displays plan ID, status, and period dates

#### **Test Case: Start Free Trial**

- **Action**: Click "Start Basic Trial"
- **Expected**: Trial started successfully
- **Verify**:
  - Status changes to "trialing"
  - Trial end date is 14 days from now
  - Can't start another trial

#### **Test Case: Upgrade Plan**

- **Action**: Click "Upgrade to Pro"
- **Expected**: Plan upgraded successfully
- **Verify**:
  - Status changes to "active"
  - Plan ID updates to "pro"
  - Period end date extends

#### **Test Case: Cancel Subscription**

- **Action**: Click "Cancel Subscription"
- **Expected**: Subscription canceled
- **Verify**:
  - Status changes to "canceled"
  - cancelAtPeriodEnd becomes true
  - Still has access until period end

### **3. Upload Limit Testing**

#### **Test Case: Upload Within Limits**

- **Action**: Upload file smaller than plan limit
- **Expected**: Upload succeeds
- **Verify**: File appears in file list

#### **Test Case: Upload Exceeding Limits**

- **Action**: Upload file larger than plan limit
- **Expected**: Upload fails with error message
- **Verify**: Clear error message about plan limits

### **4. UI Integration Testing**

#### **Test Case: Upgrade Plan Page**

- **Action**: Visit dashboard "Upgrade Plan" section
- **Expected**: Shows current plan status
- **Verify**:
  - Current plan is highlighted
  - Trial status is displayed
  - Buttons are properly disabled/enabled

#### **Test Case: Plan Comparison**

- **Action**: View plan comparison table
- **Expected**: Accurate feature comparison
- **Verify**: All plan features are listed correctly

---

## 🔧 **Troubleshooting Common Issues**

### **Issue: "Setup failed" Error**

**Possible Causes:**

- Database permissions not set correctly
- Collection already exists
- Network connectivity issues

**Solutions:**

1. Check Appwrite console for collection existence
2. Verify database permissions
3. Check network connection
4. Try running setup again

### **Issue: "No session found" Error**

**Possible Causes:**

- User not logged in
- Session expired
- Cookie issues

**Solutions:**

1. Log out and log back in
2. Clear browser cookies
3. Check authentication status

### **Issue: "Upload permission check failed"**

**Possible Causes:**

- Subscription not loaded
- Plan limits not enforced
- Network error

**Solutions:**

1. Load subscription data first
2. Check plan limits in subscription
3. Verify network connection

### **Issue: "Trial already exists" Error**

**Possible Causes:**

- User already has active trial
- Previous trial not properly ended

**Solutions:**

1. Check current subscription status
2. Cancel existing trial first
3. Wait for trial to expire

---

## 📊 **Expected Test Results**

### **Successful Setup**

```
✅ Setup Subscriptions Collection
✅ Check Setup Status
✅ Load Current Subscription
✅ Start Basic Trial
✅ Upgrade to Pro
✅ Cancel Subscription
```

### **Upload Limit Tests**

```
✅ Upload 50MB file (Free plan) - Should fail
✅ Upload 1MB file (Free plan) - Should succeed
✅ Upload 5GB file (Basic plan) - Should fail
✅ Upload 1GB file (Basic plan) - Should succeed
```

### **UI Tests**

```
✅ Current plan displayed correctly
✅ Trial status shown
✅ Plan comparison accurate
✅ Buttons properly disabled/enabled
✅ Error messages clear and helpful
```

---

## 🎯 **Advanced Testing Scenarios**

### **Test Case: Plan Switching**

1. Start with Free plan
2. Upgrade to Basic
3. Upgrade to Pro
4. Downgrade to Basic
5. Cancel subscription
6. Verify all transitions work

### **Test Case: Trial Expiration**

1. Start a trial
2. Note trial end date
3. Wait for trial to expire (or simulate)
4. Verify plan reverts to Free
5. Check upload limits are enforced

### **Test Case: Concurrent Operations**

1. Start multiple uploads simultaneously
2. Try upgrading plan during upload
3. Cancel subscription during upload
4. Verify no conflicts occur

### **Test Case: Error Handling**

1. Try uploading without subscription data
2. Test with invalid plan IDs
3. Simulate network failures
4. Verify graceful error handling

---

## 📝 **Test Report Template**

### **Test Session Details**

- **Date**: ******\_\_\_******
- **Tester**: ******\_\_\_******
- **Environment**: ******\_\_\_******

### **Setup Results**

- [ ] Database collection created
- [ ] Attributes configured
- [ ] Indexes created
- [ ] Permissions set

### **Functionality Results**

- [ ] Load subscription works
- [ ] Start trial works
- [ ] Upgrade plan works
- [ ] Cancel subscription works
- [ ] Upload limits enforced

### **UI Results**

- [ ] Current plan displayed
- [ ] Trial status shown
- [ ] Plan comparison accurate
- [ ] Buttons work correctly
- [ ] Error messages clear

### **Issues Found**

1. ***
2. ***
3. ***

### **Recommendations**

1. ***
2. ***
3. ***

---

## 🚀 **Next Steps After Testing**

### **If All Tests Pass:**

1. ✅ Deploy to production
2. ✅ Monitor subscription usage
3. ✅ Set up payment integration (Stripe)
4. ✅ Configure email notifications

### **If Issues Found:**

1. 🔧 Fix identified problems
2. 🔧 Re-run affected tests
3. 🔧 Update documentation
4. 🔧 Consider edge cases

### **Production Readiness:**

1. 🔒 Security audit
2. 🔒 Performance testing
3. 🔒 Backup procedures
4. 🔒 Monitoring setup

---

## 💡 **Pro Tips**

### **Testing Best Practices**

- Test with different user accounts
- Test edge cases (very large files, network issues)
- Test concurrent operations
- Document any unexpected behavior

### **Performance Considerations**

- Monitor database query performance
- Check upload speed with different file sizes
- Verify subscription checks don't slow down uploads
- Test with many concurrent users

### **Security Considerations**

- Verify user can only access their own subscription
- Check that plan limits can't be bypassed
- Ensure trial abuse prevention works
- Test with invalid/malicious inputs

---

**🎉 Happy Testing! The subscription system is ready to enhance your SKYBOX application!**
