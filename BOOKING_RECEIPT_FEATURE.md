# Booking Receipt Generation & Email Feature

## Overview
This feature automatically generates and sends a downloadable PDF receipt to users when an admin approves their booking. Users can download the receipt anytime to prove their booking.

## Components Created

### 1. **BookingReceiptService** 
📄 Location: `src/main/java/com/smartcampus/booking/service/BookingReceiptService.java`

Generates professional PDF receipts with:
- Booking confirmation header with receipt ID
- Booking details (resource name, status, purpose)
- User information (requester name & ID)
- Booking schedule (start/end dates and times)
- Professional formatting with sections and dividers
- Generated timestamp
- Auto-calculations for booking duration

**Key Method:**
```java
public byte[] generateBookingReceiptPdf(Booking booking)
```

### 2. **EmailService**
📄 Location: `src/main/java/com/smartcampus/notification/service/EmailService.java`

Handles email sending with:
- Simple email support
- Email with PDF attachment support
- HTML email body formatting
- SMTP configuration support
- Logging for tracking sent emails
- Graceful handling when email is disabled

**Key Methods:**
- `sendSimpleEmail()` - Send plain text emails
- `sendEmailWithAttachment()` - Send emails with PDF attachments
- `sendBookingApprovalEmailWithReceipt()` - Send approval with receipt PDF

### 3. **Modified BookingService**
📄 Location: `src/main/java/com/smartcampus/booking/service/BookingService.java`

Enhanced `approveBooking()` method now:
- Approves the booking (existing functionality)
- Notifies admin (existing functionality)
- **Generates PDF receipt**
- **Sends email with receipt to user**
- Handles email errors gracefully (doesn't block approval)

**New Methods:**
- `getBookingEntity()` - Internal method to retrieve booking entity
- `sendBookingReceiptToUser()` - Helper to generate and send receipt

### 4. **BookingController Updates**
📄 Location: `src/main/java/com/smartcampus/booking/controller/BookingController.java`

New endpoint:
```
GET /api/bookings/{id}/receipt
```

**Features:**
- Download receipt PDF anytime
- Authorization check (users can download own, admins can download any)
- Returns PDF file with proper headers
- Filename: `Booking_Receipt_{bookingId}.pdf`

### 5. **Email Configuration**
📄 Location: `src/main/resources/application.properties`

Added SMTP configuration:
```properties
spring.mail.enabled=false  # Set to true to enable
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${SPRING_MAIL_USERNAME}
spring.mail.password=${SPRING_MAIL_PASSWORD}
spring.mail.from=noreply@smartcampus.com
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### 6. **Maven Dependencies Added**
📄 Location: `pom.xml`

```xml
<!-- PDF Generation -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itext7-core</artifactId>
    <version>7.2.5</version>
    <type>pom</type>
</dependency>

<!-- Email Sending -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

## Workflow

### When Admin Approves a Booking:

1. **Approval Triggered**
   ```
   PUT /api/bookings/{id}/approve
   ```

2. **System Actions:**
   - ✅ Booking status changed to APPROVED
   - ✅ Admin notification sent (existing)
   - ✅ PDF receipt generated with booking details
   - ✅ Email sent to user with PDF attachment
   - ✅ Error handling - email failures don't block approval

3. **User Receives:**
   - ✅ Notification in system
   - ✅ Email with subject "Booking Approved - Receipt Attached"
   - ✅ HTML formatted email body
   - ✅ PDF attachment (Booking_Receipt_{{bookingId}}.pdf)

### User Downloads Receipt Anytime:

1. **Download Request**
   ```
   GET /api/bookings/{id}/receipt
   ```

2. **System Returns:**
   - ✅ PDF file download
   - ✅ Proper Content-Type header
   - ✅ Proper filename in response

## PDF Receipt Format

```
┌─────────────────────────────────────┐
│        BOOKING RECEIPT              │
│  Smart Campus Booking System        │
├─────────────────────────────────────┤
│ Receipt #: {id}    Date: {date}     │
├─────────────────────────────────────┤
│ BOOKING DETAILS                      │
│  Resource Name: {resource}           │
│  Booking ID: {id}                    │
│  Status: APPROVED                    │
│  Purpose: {purpose}                  │
├─────────────────────────────────────┤
│ USER INFORMATION                     │
│  Requested By: {userName}            │
│  User ID: {userId}                   │
├─────────────────────────────────────┤
│ BOOKING SCHEDULE                     │
│  Start: {date} at {time}             │
│  End: {date} at {time}               │
│  Expected Attendees: {count}         │
├─────────────────────────────────────┤
│ [Footer text & generation time]     │
└─────────────────────────────────────┘
```

## Configuration Guide

### Enable Email Sending

1. **For Gmail:**
   ```
   SPRING_MAIL_ENABLED=true
   SPRING_MAIL_HOST=smtp.gmail.com
   SPRING_MAIL_PORT=587
   SPRING_MAIL_USERNAME=your-email@gmail.com
   SPRING_MAIL_PASSWORD=your-app-password
   SPRING_MAIL_FROM=your-email@gmail.com
   ```

   Note: Use Gmail App Password, not regular password

2. **For Other SMTP Providers:**
   Set appropriate host, port, and credentials

3. **Disable Email (Development):**
   ```
   SPRING_MAIL_ENABLED=false
   ```
   System will log a warning but won't fail

## Error Handling

- **Missing User Email:** Log warning, skip email, receipt still sent to system
- **Email Service Disabled:** Log warning, skip email
- **PDF Generation Failure:** Log error, throw exception (rare)
- **Booking Approval:** Never fails due to email issues

## Security

- ✅ Users can only download their own receipts (except admins)
- ✅ Admin can download any receipt
- ✅ Requires authentication
- ✅ PDF content includes only booking information (no sensitive data)

## Future Enhancements

- [ ] Email templates customization
- [ ] Support for multiple recipients
- [ ] Receipt history/archive
- [ ] Resend receipt option
- [ ] Digital signatures on PDF
- [ ] Multi-language support
- [ ] SMS notifications option

## Testing

### Test Receipt Generation:
```bash
# Approve a booking
PUT http://localhost:8080/api/bookings/{bookingId}/approve

# Download receipt
GET http://localhost:8080/api/bookings/{bookingId}/receipt
```

### Check Email Configuration:
Monitor logs for messages like:
- "Email sent successfully to: user@example.com"
- "Booking receipt sent successfully"
- "Email sending is disabled"

## Dependencies Installed

- **iText 7.2.5** - Professional PDF generation
- **Spring Boot Mail Starter** - Email support

Both libraries are production-ready and widely used.
