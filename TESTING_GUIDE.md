# Booking Management - Testing & Finalization Guide

## 🎯 Overview
This document provides a complete testing guide for the Smart Campus Booking Management system, including API testing with Postman and frontend error handling validation.

---

## 📋 TASK 1: Postman Collection Tests

### Setup Instructions

1. **Import Postman Collection**
   - Open Postman
   - Click `Import` → `Upload Files`
   - Select: `SmartCampus_Booking_API.postman_collection.json`
   - Collection will appear with all 10 endpoints organized

2. **Set Variables** (Optional - optional, hardcoded in examples)
   - Go to collection → `Variables`
   - Set `baseUrl`: `http://localhost:8080`
   - Set `bookingId`: (you'll get this from Test 1 response)

3. **Backend Requirements**
   - Ensure Spring Boot server is running on `http://localhost:8080`
   - Database should be initialized and ready
   - CORS is enabled for `http://localhost:3000` (frontend)

---

## 🧪 Test Cases (10 Total)

### Test 1: Create Booking - Success ✅
**Endpoint:** `POST /api/bookings`
**Headers:**
- X-User-Id: user123
- X-User-Role: USER
- X-User-Name: John Doe

**Body:**
```json
{
  "resourceId": "res1",
  "resourceName": "Auditorium A",
  "startTime": "2026-05-01T09:00:00",
  "endTime": "2026-05-01T11:00:00",
  "purpose": "Workshop",
  "expectedAttendees": 50
}
```

**Expected Response:** `201 Created`
```json
{
  "id": "booking-uuid-123",
  "resourceId": "res1",
  "resourceName": "Auditorium A",
  "status": "PENDING",
  "startTime": "2026-05-01T09:00:00",
  "endTime": "2026-05-01T11:00:00",
  "purpose": "Workshop",
  "expectedAttendees": 50,
  "requestedById": "user123",
  "requestedByName": "John Doe",
  "createdAt": "2026-03-31T12:00:00"
}
```

**Validation Checklist:**
- [ ] Status code is 201
- [ ] Response contains booking ID
- [ ] Status is PENDING
- [ ] All fields are correctly saved
- [ ] createdAt timestamp is set

---

### Test 2: Create Booking - Conflict ⚠️
**Endpoint:** `POST /api/bookings`
**Same headers and body as Test 1**

**Expected Response:** `409 Conflict`
```json
{
  "status": 409,
  "message": "Resource already booked during this time period",
  "timestamp": "2026-03-31T12:00:00"
}
```

**Validation Checklist:**
- [ ] Status code is 409
- [ ] Error message mentions conflict
- [ ] First booking is not duplicated

---

### Test 3: Get All Bookings 📋
**Endpoint:** `GET /api/bookings`
**Headers:**
- X-User-Id: admin123
- X-User-Role: ADMIN

**Expected Response:** `200 OK`
```json
[
  {
    "id": "booking-uuid-123",
    "resourceName": "Auditorium A",
    "status": "PENDING",
    "startTime": "2026-05-01T09:00:00",
    "endTime": "2026-05-01T11:00:00",
    "requestedByName": "John Doe"
  }
]
```

**Validation Checklist:**
- [ ] Status code is 200
- [ ] Returns array of bookings
- [ ] Contains all bookings regardless of status
- [ ] Contains Test 1 booking with PENDING status

---

### Test 4: Get Bookings - Filtered by Status 🔍
**Endpoint:** `GET /api/bookings?status=PENDING`
**Headers:** (Admin user)

**Expected Response:** `200 OK`
```json
[
  {
    "id": "booking-uuid-123",
    "resourceName": "Auditorium A",
    "status": "PENDING",
    ...
  }
]
```

**Validation Checklist:**
- [ ] Status code is 200
- [ ] Only PENDING bookings returned
- [ ] All returned items have status = PENDING

---

### Test 5: Get My Bookings 👤
**Endpoint:** `GET /api/bookings/my`
**Headers:**
- X-User-Id: user123
- X-User-Role: USER

**Expected Response:** `200 OK`
```json
[
  {
    "id": "booking-uuid-123",
    "resourceName": "Auditorium A",
    "status": "PENDING",
    "requestedById": "user123",
    ...
  }
]
```

**Validation Checklist:**
- [ ] Status code is 200
- [ ] Only bookings for user123 returned
- [ ] Array contains the booking from Test 1
- [ ] No bookings from other users included

---

### Test 6: Approve Booking ✅
**Endpoint:** `PUT /api/bookings/{bookingId}/approve`
**Replace {bookingId} with ID from Test 1**
**Headers:** (Admin user)

**Expected Response:** `200 OK`
```json
{
  "id": "booking-uuid-123",
  "resourceName": "Auditorium A",
  "status": "APPROVED",
  "approvedBy": "admin123",
  "approvedAt": "2026-03-31T12:00:00",
  ...
}
```

**Validation Checklist:**
- [ ] Status code is 200
- [ ] Status changed to APPROVED
- [ ] Booking ID unchanged
- [ ] approvedBy field shows admin123
- [ ] approvedAt timestamp is set

---

### Test 7: Reject Booking ❌
**Endpoint:** `PUT /api/bookings/{bookingId}/reject`
**Replace {bookingId} with ID from a different booking (create a new one first)**
**Headers:** (Admin user)
**Body:**
```json
{
  "reason": "Conflicting university event"
}
```

**Expected Response:** `200 OK`
```json
{
  "id": "booking-uuid-xyz",
  "resourceName": "Meeting Room B",
  "status": "REJECTED",
  "rejectionReason": "Conflicting university event",
  "rejectedBy": "admin123",
  "rejectedAt": "2026-03-31T12:00:00",
  ...
}
```

**Validation Checklist:**
- [ ] Status code is 200
- [ ] Status changed to REJECTED
- [ ] rejectionReason is stored correctly
- [ ] rejectedBy shows admin ID
- [ ] rejectedAt timestamp is set

---

### Test 8: Cancel Booking - Authorized ✅
**Endpoint:** `DELETE /api/bookings/{bookingId}`
**Replace {bookingId} with an APPROVED booking from Test 6**
**Headers:**
- X-User-Id: user123 (the owner)
- X-User-Role: USER

**Expected Response:** `200 OK`
```json
{
  "id": "booking-uuid-123",
  "resourceName": "Auditorium A",
  "status": "CANCELLED",
  "cancelledBy": "user123",
  "cancelledAt": "2026-03-31T12:00:00",
  ...
}
```

**Validation Checklist:**
- [ ] Status code is 200
- [ ] Status changed to CANCELLED
- [ ] cancelledBy is user123
- [ ] cancelledAt timestamp is set

---

### Test 9: Cancel Booking - Unauthorized 🔒
**Endpoint:** `DELETE /api/bookings/{bookingId}`
**Same booking from Test 8 OR another user's booking**
**Headers:**
- X-User-Id: wronguser
- X-User-Role: USER

**Expected Response:** `403 Forbidden`
```json
{
  "status": 403,
  "message": "You can only cancel your own bookings",
  "timestamp": "2026-03-31T12:00:00"
}
```

**Validation Checklist:**
- [ ] Status code is 403
- [ ] Error message about unauthorized access
- [ ] Booking is NOT cancelled

---

### Test 10: Create Booking - Validation Errors ❌
**Endpoint:** `POST /api/bookings`
**Headers:** (Same as Test 1)
**Body (Missing required fields):**
```json
{
  "resourceId": "res1"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "resourceName": "Resource name is required",
    "startTime": "Start time is required",
    "endTime": "End time is required",
    "purpose": "Purpose is required",
    "expectedAttendees": "Expected attendees is required"
  },
  "timestamp": "2026-03-31T12:00:00"
}
```

**Validation Checklist:**
- [ ] Status code is 400
- [ ] errors object contains all missing fields
- [ ] Booking is NOT created
- [ ] Helpful error messages provided

---

## 🎨 TASK 2: Frontend Error Handling Review

### Testing Error Scenarios

#### 1. API Server Down / Connection Error
**Scenario:** Stop the Spring Boot server, try to load bookings

**Expected Behavior:**
- [ ] Page shows error message: "🌐 Server Unavailable"
- [ ] Displays: "The server is not responding. Please try again in a moment."
- [ ] A red/orange error box appears (not blocking the page)
- [ ] "🔄 Retry" button is available
- [ ] Clicking retry attempts to reconnect once server is restarted

**Component:** BookingManagement.jsx
**Code Review:**
```javascript
if (!err.response) {
  setError({
    type: 'connection',
    title: '🌐 Server Unavailable',
    message: 'The server is not responding. Please try again in a moment.'
  });
}
```

---

#### 2. Empty Bookings List
**Scenario:** Filter by "My Bookings" when user has no bookings

**Expected Behavior:**
- [ ] No skeleton loader shown (no bookings to load)
- [ ] Shows empty state: "📭 No bookings found"
- [ ] Message: "You haven't made any bookings yet."
- [ ] "Create Booking" button is available below message
- [ ] Proper spacing and typography

**Component:** BookingManagement.jsx
**Code Review:**
```javascript
{bookings.length === 0 ? (
  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
    <div className="text-5xl mb-4">📭</div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">No bookings found</h3>
    <p className="text-gray-600 mb-6">
      {activeTab === 'my' && "You haven't made any bookings yet."}
      ...
    </p>
```

---

#### 3. Approve/Reject Fails
**Scenario:** Network error while approving a booking

**Expected Behavior:**
- [ ] Button shows spinner while loading: "⏳ Approving..."
- [ ] Button is disabled during action
- [ ] On error, shows toast: "❌ Failed to approve booking. Please try again."
- [ ] Toast appears at top-right
- [ ] Toast auto-dismisses after 3 seconds
- [ ] User can retry the action

**Component:** BookingTable.jsx
**Code Review:**
```javascript
<button
  onClick={() => onApprove(booking.id)}
  disabled={isApproving === booking.id || isRejecting === booking.id}
  className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
>
  {isApproving === booking.id ? (
    <>
      <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      Approving...
    </>
  ) : (
    '✓ Approve'
  )}
</button>
```

---

#### 4. Form Submit with Past Date
**Scenario:** Try to create booking with past date (e.g., 2026-01-01 when today is 2026-03-31)

**Expected Behavior:**
- [ ] Date input has `min` attribute set to today
- [ ] Users cannot select past dates in date picker
- [ ] If somehow past date is submitted, validation catches it
- [ ] Shows error: "📅 Cannot book for past dates"
- [ ] Error appears below date field in red
- [ ] Form does not submit

**Component:** CreateBookingModal.jsx
**Code Review:**
```javascript
if (!formData.date) {
  newErrors.date = 'Date is required';
} else {
  const selectedDate = new Date(formData.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    newErrors.date = '📅 Cannot book for past dates';
  }
}
```

---

### Additional Error Handling Tests

#### Authorization Error
**Scenario:** Try canceling another user's booking

**Expected Behavior:**
- [ ] Toast shows: "🔒 You can only cancel your own bookings"
- [ ] Booking is NOT cancelled
- [ ] Status remains unchanged

---

#### Network Error During Form Submission
**Scenario:** Create booking while network disconnects

**Expected Behavior:**
- [ ] Submit button shows "Submitting..." with spinner
- [ ] On network error: "🌐 Unable to connect to server. Please check your connection."
- [ ] User can retry submission
- [ ] Form data is preserved

---

## ⚙️ TASK 3: Loading States Implementation

### Table Loading State
**File:** BookingManagement.jsx

**Validation:**
- [ ] When loading=true, shows 3 skeleton rows
- [ ] Each row has animated gray placeholder blocks
- [ ] Skeleton covers: Resource Name, Requested By, Date & Time, Purpose, Status, Actions
- [ ] Animation is smooth and continuous
- [ ] Skeleton rows disappear once data loads

**Code:**
```javascript
{loading ? (
  <div className="bg-white rounded-lg border border-gray-200">
    <table className="w-full">
      <thead>...headers...</thead>
      <tbody>
        {[...Array(3)].map((_, idx) => (
          <tr key={idx} className="bg-white border-b border-gray-200 h-16">
            <td className="px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </td>
            ...
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : ...}
```

---

### Button Loading States
**File:** BookingTable.jsx

**Validation:**
- [ ] Approve button shows spinner + "Approving..." while loading
- [ ] Reject button shows spinner + "Rejecting..." while loading
- [ ] Cancel button shows spinner + "Cancelling..." while loading
- [ ] Buttons are disabled (opacity-50, cursor-not-allowed) during action
- [ ] Only the clicked button shows loading state
- [ ] Other buttons on same row remain enabled
- [ ] Spinner animates smoothly

**Code:**
```javascript
{isApproving === booking.id ? (
  <>
    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
    Approving...
  </>
) : (
  '✓ Approve'
)}
```

---

### Modal Submit Loading State
**File:** CreateBookingModal.jsx

**Validation:**
- [ ] Submit button shows "Submitting..." with spinner
- [ ] Button is disabled during submission
- [ ] Cancel button remains enabled (allows canceling submission)
- [ ] All form fields remain visible but may be disabled
- [ ] On success, modal closes automatically
- [ ] On error, form stays open and user can retry

---

## 📝 Frontend Component Improvements Summary

### Files Modified:
1. **BookingManagement.jsx**
   - ✅ Added better error handling for API failures
   - ✅ Added connection error detection
   - ✅ Skeleton loader for table rows
   - ✅ Empty state with icon
   - ✅ Individual loading states for approve/reject/cancel actions
   - ✅ Better error messages with retry button

2. **BookingTable.jsx**
   - ✅ Added isApproving, isRejecting, isCancelling props
   - ✅ Button loading states with spinner animation
   - ✅ Disabled state during actions
   - ✅ Better button labels with icons

3. **CreateBookingModal.jsx**
   - ✅ Client-side validation for past dates
   - ✅ Date input min attribute to prevent past date selection
   - ✅ Better error messages with icons
   - ✅ Red border on error fields
   - ✅ Purpose field now requires minimum 10 characters
   - ✅ Submit button with loading state and spinner

4. **SkeletonLoader.jsx** (New)
   - ✅ Created new component for table skeleton loading
   - ✅ 3 animated placeholder rows
   - ✅ Matches table structure

---

## 🚀 Running the Complete Test Suite

### Step 1: Start Services
```bash
# Terminal 1: Start Spring Boot Backend
mvn spring-boot:run

# Terminal 2: Start React Frontend
npm run dev

# Terminal 3: Open Postman
# Import the Postman collection
```

### Step 2: Run Postman Tests
1. Import `SmartCampus_Booking_API.postman_collection.json`
2. Run each test sequentially (Tests 1-10)
3. For each test:
   - [ ] Verify expected status code
   - [ ] Check response format
   - [ ] Validate all fields
   - [ ] Document any discrepancies

### Step 3: Manual Frontend Testing
1. Open http://localhost:3000
2. Test all error scenarios from Task 2
3. Test loading states during slower connections (DevTools Network Throttling)
4. Test form validation with various inputs

---

## ✅ Final Checklist

### Backend
- [ ] All 10 Postman tests pass
- [ ] Status codes match expected values
- [ ] Error messages are clear and helpful
- [ ] Proper validation for all fields
- [ ] Authorization checks work correctly

### Frontend
- [ ] Error messages display correctly
- [ ] Loading states show properly
- [ ] Skeleton loaders animate smoothly
- [ ] Empty state shows with icon
- [ ] Form validation works for past dates
- [ ] All buttons have proper loading states
- [ ] Toast notifications appear and disappear correctly
- [ ] Network errors are handled gracefully

### User Experience
- [ ] No unexpected redirects
- [ ] Clear feedback for all actions
- [ ] Proper error recovery options
- [ ] Smooth loading animations
- [ ] Consistent styling throughout

---

## 📚 Additional Resources

### Common Issues & Solutions

**Issue:** Postman returns 401 Unauthorized
- **Solution:** Check X-User-Id, X-User-Role headers are set correctly

**Issue:** Frontend shows loading spinner indefinitely
- **Solution:** Check backend server is running on port 8080

**Issue:** Conflict error not appearing when booking same time
- **Solution:** Ensure first booking was created (201), then immediately run conflict test

**Issue:** Past dates accepted despite validation
- **Solution:** Ensure date input has `min` attribute and browser supports it

---

## 🎓 Next Steps (For Team)

1. **Authentication Integration**: Replace headers with OAuth2
2. **Email Notifications**: Send confirmation/approval emails
3. **Calendar View**: Add visual calendar for bookings
4. **Analytics**: Track booking trends and resource utilization
5. **Mobile Responsiveness**: Optimize for mobile devices

---

Generated: March 31, 2026
Project: Smart Campus Booking Management
Version: 1.0
