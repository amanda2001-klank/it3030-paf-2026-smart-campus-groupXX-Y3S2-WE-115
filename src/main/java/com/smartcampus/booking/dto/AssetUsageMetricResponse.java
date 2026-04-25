package com.smartcampus.booking.dto;

public class AssetUsageMetricResponse {

    private String resourceId;
    private String resourceName;
    private long totalBookings;
    private long approvedBookings;
    private long pendingBookings;
    private long rejectedBookings;
    private long cancelledBookings;
    private double bookedHours;
    private double bookingSharePercent;

    public AssetUsageMetricResponse() {
    }

    public AssetUsageMetricResponse(
            String resourceId,
            String resourceName,
            long totalBookings,
            long approvedBookings,
            long pendingBookings,
            long rejectedBookings,
            long cancelledBookings,
            double bookedHours,
            double bookingSharePercent
    ) {
        this.resourceId = resourceId;
        this.resourceName = resourceName;
        this.totalBookings = totalBookings;
        this.approvedBookings = approvedBookings;
        this.pendingBookings = pendingBookings;
        this.rejectedBookings = rejectedBookings;
        this.cancelledBookings = cancelledBookings;
        this.bookedHours = bookedHours;
        this.bookingSharePercent = bookingSharePercent;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public long getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(long totalBookings) {
        this.totalBookings = totalBookings;
    }

    public long getApprovedBookings() {
        return approvedBookings;
    }

    public void setApprovedBookings(long approvedBookings) {
        this.approvedBookings = approvedBookings;
    }

    public long getPendingBookings() {
        return pendingBookings;
    }

    public void setPendingBookings(long pendingBookings) {
        this.pendingBookings = pendingBookings;
    }

    public long getRejectedBookings() {
        return rejectedBookings;
    }

    public void setRejectedBookings(long rejectedBookings) {
        this.rejectedBookings = rejectedBookings;
    }

    public long getCancelledBookings() {
        return cancelledBookings;
    }

    public void setCancelledBookings(long cancelledBookings) {
        this.cancelledBookings = cancelledBookings;
    }

    public double getBookedHours() {
        return bookedHours;
    }

    public void setBookedHours(double bookedHours) {
        this.bookedHours = bookedHours;
    }

    public double getBookingSharePercent() {
        return bookingSharePercent;
    }

    public void setBookingSharePercent(double bookingSharePercent) {
        this.bookingSharePercent = bookingSharePercent;
    }
}