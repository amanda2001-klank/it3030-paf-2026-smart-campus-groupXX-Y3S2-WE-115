package com.smartcampus.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Service to handle email notifications with attachments
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@smartcampus.com}")
    private String fromEmail;

    @Value("${spring.mail.enabled:false}")
    private boolean emailEnabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send a simple text email
     *
     * @param to recipient email
     * @param subject email subject
     * @param text email body
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        if (!emailEnabled) {
            logger.warn("Email sending is disabled. Would have sent email to: {}", to);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email to: {}", to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send an email with PDF attachment
     *
     * @param to recipient email
     * @param subject email subject
     * @param text email body
     * @param attachmentName name of the attachment
     * @param attachmentContent byte array of the attachment
     * @param mimeType MIME type of the attachment
     */
    public void sendEmailWithAttachment(String to, String subject, String text,
                                       String attachmentName, byte[] attachmentContent, String mimeType) {
        if (!emailEnabled) {
            logger.warn("Email sending is disabled. Would have sent email with attachment to: {}", to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, true); // true indicates HTML

            // Add attachment
            helper.addAttachment(attachmentName, () -> new java.io.ByteArrayInputStream(attachmentContent), mimeType);

            mailSender.send(message);
            logger.info("Email with attachment sent successfully to: {} with file: {}", to, attachmentName);
        } catch (MessagingException e) {
            logger.error("Failed to send email with attachment to: {}", to, e);
            throw new RuntimeException("Failed to send email with attachment", e);
        }
    }

    /**
     * Send booking approval email with receipt PDF
     *
     * @param userEmail recipient email
     * @param userName user name
     * @param resourceName booked resource name
     * @param bookingId booking ID
     * @param pdfContent PDF receipt as byte array
     */
    public void sendBookingApprovalEmailWithReceipt(String userEmail, String userName, String resourceName,
                                                    String bookingId, byte[] pdfContent) {
        String subject = "Booking Approved - Receipt Attached";

        String htmlBody = "<html>" +
                "<body style=\"font-family: Arial, sans-serif;\">" +
                "<p>Dear " + userName + ",</p>" +
                "<p>Great news! Your booking has been <strong>approved</strong>.</p>" +
                "<p><strong>Booking Details:</strong></p>" +
                "<ul>" +
                "<li><strong>Resource:</strong> " + resourceName + "</li>" +
                "<li><strong>Booking ID:</strong> " + bookingId + "</li>" +
                "</ul>" +
                "<p>Please find the booking receipt attached. You can use this receipt to prove your booking.</p>" +
                "<p>If you need to make any changes or have questions, please contact the Smart Campus administration.</p>" +
                "<br/>" +
                "<p>Best regards,<br/>" +
                "Smart Campus Administration</p>" +
                "</body>" +
                "</html>";

        String pdfFileName = "Booking_Receipt_" + bookingId + ".pdf";
        sendEmailWithAttachment(userEmail, subject, htmlBody, pdfFileName, pdfContent, "application/pdf");
    }

    /**
     * Check if email sending is enabled
     */
    public boolean isEmailEnabled() {
        return emailEnabled;
    }
}
