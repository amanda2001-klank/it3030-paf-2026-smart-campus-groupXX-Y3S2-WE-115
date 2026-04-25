package com.smartcampus.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service for sending email notifications.
 * Currently implements a placeholder that logs email actions.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    /**
     * Send booking approval email with a PDF receipt attachment.
     *
     * @param toEmail      recipient email address
     * @param userName     recipient name
     * @param resourceName name of the booked resource
     * @param bookingId    ID of the booking
     * @param pdfContent   byte array of the PDF receipt
     */
    public void sendBookingApprovalEmailWithReceipt(
            String toEmail,
            String userName,
            String resourceName,
            String bookingId,
            byte[] pdfContent
    ) {
        logger.info("PREPARING EMAIL: Booking Approved");
        logger.info("TO: {}", toEmail);
        logger.info("USER: {}", userName);
        logger.info("RESOURCE: {}", resourceName);
        logger.info("BOOKING ID: {}", bookingId);
        logger.info("ATTACHMENT: receipt_{}.pdf ({} bytes)", bookingId, pdfContent != null ? pdfContent.length : 0);
        
        // In a real application, you would use JavaMailSender to send the email:
        /*
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setSubject("Booking Approved - " + resourceName);
            helper.setText("Dear " + userName + ",\n\nYour booking for " + resourceName + " has been approved. Please find your receipt attached.");
            helper.addAttachment("receipt_" + bookingId + ".pdf", new ByteArrayResource(pdfContent));
            mailSender.send(message);
            logger.info("Email sent successfully to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send email to {}", toEmail, e);
        }
        */
        
        logger.info("SIMULATION: Email sent successfully to {}", toEmail);
    }
}
