package com.smartcampus.booking.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.smartcampus.booking.model.Booking;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

/**
 * Service to generate PDF booking receipts
 */
@Service
public class BookingReceiptService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    /**
     * Generate a booking receipt PDF as byte array
     *
     * @param booking the booking to generate receipt for
     * @return byte array of the PDF
     */
    public byte[] generateBookingReceiptPdf(Booking booking) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);

            // Title
            Paragraph title = new Paragraph("BOOKING RECEIPT")
                    .setFontSize(24)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(5);
            document.add(title);

            Paragraph subtitle = new Paragraph("Smart Campus Booking Management System")
                    .setFontSize(11)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20)
                    .setFontColor(ColorConstants.GRAY);
            document.add(subtitle);

            // Receipt Header Info
            Table headerTable = new Table(2);
            headerTable.setMarginBottom(20);
            headerTable.setWidth(500);

            // Left column
            Cell leftCell = new Cell().add(
                    new Paragraph("RECEIPT #").setBold().setFontSize(10)).add(
                    new Paragraph(booking.getId())
                            .setFontSize(11)
                            .setMarginTop(2))
                    .setBorder(Border.NO_BORDER)
                    .setVerticalAlignment(VerticalAlignment.TOP);
            headerTable.addCell(leftCell);

            // Right column
            Cell rightCell = new Cell().add(
                    new Paragraph("DATE APPROVED").setBold().setFontSize(10)).add(
                    new Paragraph(booking.getUpdatedAt() != null ?
                            booking.getUpdatedAt().format(DATE_FORMATTER) : "N/A")
                            .setFontSize(11)
                            .setMarginTop(2))
                    .setBorder(Border.NO_BORDER)
                    .setVerticalAlignment(VerticalAlignment.TOP)
                    .setTextAlignment(TextAlignment.RIGHT);
            headerTable.addCell(rightCell);

            document.add(headerTable);

            // Divider
            Paragraph divider = new Paragraph("_".repeat(80))
                    .setFontSize(10)
                    .setMarginBottom(15)
                    .setFontColor(ColorConstants.LIGHT_GRAY);
            document.add(divider);

            // Booking Details
            addSectionTitle(document, "BOOKING DETAILS");

            Table detailsTable = new Table(2);
            detailsTable.setMarginBottom(20);
            detailsTable.setWidth(500);

            addDetailRow(detailsTable, "Resource Name:", booking.getResourceName());
            addDetailRow(detailsTable, "Booking ID:", booking.getId());
            addDetailRow(detailsTable, "Status:", booking.getStatus().toString());
            addDetailRow(detailsTable, "Purpose:", booking.getPurpose());

            document.add(detailsTable);

            // User Details
            addSectionTitle(document, "USER INFORMATION");

            Table userTable = new Table(2);
            userTable.setMarginBottom(20);
            userTable.setWidth(500);

            addDetailRow(userTable, "Requested By:", booking.getRequestedByName());
            addDetailRow(userTable, "User ID:", booking.getRequestedById());

            document.add(userTable);

            // Booking Schedule
            addSectionTitle(document, "BOOKING SCHEDULE");

            Table scheduleTable = new Table(2);
            scheduleTable.setMarginBottom(20);
            scheduleTable.setWidth(500);

            String startDate = booking.getStartTime().format(DATE_FORMATTER);
            String startTime = booking.getStartTime().format(TIME_FORMATTER);
            String endDate = booking.getEndTime().format(DATE_FORMATTER);
            String endTime = booking.getEndTime().format(TIME_FORMATTER);

            addDetailRow(scheduleTable, "Start Date & Time:", startDate + " at " + startTime);
            addDetailRow(scheduleTable, "End Date & Time:", endDate + " at " + endTime);

            if (booking.getExpectedAttendees() != null && booking.getExpectedAttendees() > 0) {
                addDetailRow(scheduleTable, "Expected Attendees:", booking.getExpectedAttendees().toString());
            }

            document.add(scheduleTable);

            // Footer
            Paragraph divider2 = new Paragraph("_".repeat(80))
                    .setFontSize(10)
                    .setMarginTop(20)
                    .setMarginBottom(15)
                    .setFontColor(ColorConstants.LIGHT_GRAY);
            document.add(divider2);

            Paragraph footer = new Paragraph(
                    "This receipt confirms that your booking has been approved by the Smart Campus administration. " +
                            "Please keep this receipt for your records. If you need to cancel or modify your booking, " +
                            "please contact the administration.")
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY)
                    .setMarginTop(10);
            document.add(footer);

            Paragraph terms = new Paragraph("Generated on: " + 
                    java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm")))
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.LIGHT_GRAY)
                    .setMarginTop(10);
            document.add(terms);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF receipt", e);
        }

        return baos.toByteArray();
    }

    /**
     * Add a section title to the document
     */
    private void addSectionTitle(Document document, String title) {
        Paragraph sectionTitle = new Paragraph(title)
                .setFontSize(12)
                .setBold()
                .setFontColor(new com.itextpdf.kernel.colors.DeviceRgb(0, 51, 102))
                .setMarginTop(15)
                .setMarginBottom(10);
        document.add(sectionTitle);
    }

    /**
     * Add a detail row to a table
     */
    private void addDetailRow(Table table, String label, String value) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setBold().setFontSize(10))
                .setBorder(Border.NO_BORDER)
                .setVerticalAlignment(VerticalAlignment.TOP);

        Cell valueCell = new Cell()
                .add(new Paragraph(value != null ? value : "N/A").setFontSize(10))
                .setBorder(Border.NO_BORDER)
                .setVerticalAlignment(VerticalAlignment.TOP)
                .setTextAlignment(TextAlignment.RIGHT);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }
}
