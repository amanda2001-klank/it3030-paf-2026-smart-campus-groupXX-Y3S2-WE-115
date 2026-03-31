# Quick Testing Reference Card

## 🚀 Quick Start

### Start Services
```bash
# Backend
mvn spring-boot:run  # runs on :8080

# Frontend
npm run dev  # runs on :3000

# Postman
# Import: SmartCampus_Booking_API.postman_collection.json
```

---

## 🧪 10 Postman Tests

| # | Test | Method | Endpoint | Expected | Notes |
|---|------|--------|----------|----------|-------|
| 1 | Create - Success | POST | /api/bookings | 201 | Save booking ID |
| 2 | Create - Conflict | POST | /api/bookings | 409 | Same resource, same time |
| 3 | Get All | GET | /api/bookings | 200 | All bookings |
| 4 | Get Filtered | GET | /api/bookings?status=PENDING | 200 | Only PENDING |
| 5 | Get My Bookings | GET | /api/bookings/my | 200 | User's bookings |
| 6 | Approve | PUT | /api/bookings/{id}/approve | 200 | Status → APPROVED |
| 7 | Reject | PUT | /api/bookings/{id}/reject | 200 | Status → REJECTED |
| 8 | Cancel - Own | DELETE | /api/bookings/{id} | 200 | Status → CANCELLED |
| 9 | Cancel - Other | DELETE | /api/bookings/{id} | 403 | Wrong user |
| 10 | Validation Error | POST | /api/bookings (missing fields) | 400 | Field errors |

---

## 💡 Error Handling Tests

### Connection Error
1. Stop backend server
2. Try to load bookings
3. **Should see:** "🌐 Server Unavailable" with orange error box

### Empty Bookings
1. Filter by "My Bookings"
2. (Assuming empty)
3. **Should see:** "📭 No bookings found" with create button

### Approve Fails
1. While approving, simulate network error
2. **Should see:** Toast "❌ Failed to approve booking"

### Past Date
1. Open create booking modal
2. Try to select past date
3. **Should see:** Date picker blocks it + validation error

---

## ⚙️ Loading States

| Component | What to Test | Expected |
|-----------|--------------|----------|
| Table | Open page | 3 skeleton rows animate |
| Approve Button | Click approve | Shows spinner "Approving..." |
| Reject Button | Click reject | Shows spinner "Rejecting..." |
| Cancel Button | Click cancel | Shows spinner "Cancelling..." |
| Submit Button | Submit form | Shows spinner "Submitting..." |

---

## 📋 Test Headers Reference

### User Request
```
X-User-Id: user123
X-User-Role: USER
X-User-Name: John Doe
```

### Admin Request
```
X-User-Id: admin123
X-User-Role: ADMIN
X-User-Name: Admin User
```

### Wrong User
```
X-User-Id: wronguser
X-User-Role: USER
```

---

## 🎯 Sample Booking Data

```json
{
  "resourceId": "res1",
  "resourceName": "Auditorium A",
  "startTime": "2026-05-01T09:00:00",
  "endTime": "2026-05-01T11:00:00",
  "purpose": "Workshop on AI and Machine Learning",
  "expectedAttendees": 50
}
```

**Dates:** Any date after 2026-03-31
**Times:** Any future times (start < end)

---

## ✅ Validation Rules

| Field | Rule | Example |
|-------|------|---------|
| Resource Name | Required, not empty | "Auditorium A" |
| Date | Not past, required | 2026-05-01 (min today) |
| Start Time | Required | 09:00 |
| End Time | After start time | 11:00 |
| Purpose | Min 10 chars recommended | "Workshop..." |
| Attendees | Min 1 | 50 |

---

## 🔴 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 409 Conflict | Resource already booked | Choose different time |
| 403 Forbidden | Wrong user canceling | Use owner's user ID |
| 400 Bad Request | Missing fields | Fill all fields |
| Server 500 | Backend error | Check server logs |
| Can't connect | Backend down | `mvn spring-boot:run` |

---

## 💾 Files in This Release

```
✅ SmartCampus_Booking_API.postman_collection.json
   └─ Import into Postman for all 10 tests

✅ TESTING_GUIDE.md
   └─ Detailed guide for each test case

✅ FINALIZATION_SUMMARY.md
   └─ Overview of all improvements

✅ src/components/common/SkeletonLoader.jsx
   └─ New: Animated loading placeholder

📝 src/pages/BookingManagement.jsx
   └─ Updated: Error handling, empty state, loading

📝 src/components/booking/BookingTable.jsx
   └─ Updated: Button loading states

📝 src/components/booking/CreateBookingModal.jsx
   └─ Updated: Date validation, error styling
```

---

## 🎓 Testing Flow

### 1. Setup (~2 min)
```bash
mvn spring-boot:run  # Terminal 1
npm run dev          # Terminal 2
# Import Postman collection
```

### 2. API Tests (~15 min)
- Run Tests 1-10 in Postman
- Verify each response
- Check status codes

### 3. Frontend Tests (~20 min)
- Test error scenarios
- Verify loading states
- Check form validation
- Test empty states

### 4. End-to-End (~15 min)
- Create booking via UI
- Approve via UI
- Cancel via UI
- Test error recovery

---

## 📊 Success Criteria

- [ ] All 10 Postman tests pass
- [ ] Error messages show correctly
- [ ] Loading spinners animate
- [ ] Empty state displays with icon
- [ ] Form validates past dates
- [ ] Buttons disabled during action
- [ ] Toast notifications work
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] All features documented

---

## 🔍 Quick Validation

### After running tests, verify:
1. ✅ Get test: Returns array of bookings
2. ✅ Create test: Returns 201 with ID
3. ✅ Conflict test: Returns 409
4. ✅ Approve test: Status = APPROVED
5. ✅ Reject test: Status = REJECTED
6. ✅ Cancel test: Status = CANCELLED
7. ✅ Auth test: Returns 403
8. ✅ Validation test: Returns 400 with errors
9. ✅ UI: Shows loading spinners
10. ✅ UI: Shows error messages

---

**Status:** ✅ Ready for Testing
**Version:** 1.0 Final
**Date:** March 31, 2026

