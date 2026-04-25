package com.smartcampus.booking.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AssetUsageAnalyticsResponse {

    private String period;
    private LocalDateTime rangeStart;
    private LocalDateTime rangeEnd;
    private LocalDateTime generatedAt;
    private long totalBookings;
    private double totalBookedHours;
    private List<AssetUsageMetricResponse> assets;

    public AssetUsageAnalyticsResponse() {
    }

    public AssetUsageAnalyticsResponse(
            String period,
            LocalDateTime rangeStart,
            LocalDateTime rangeEnd,
            LocalDateTime generatedAt,
            long totalBookings,
            double totalBookedHours,
            List<AssetUsageMetricResponse> assets
    ) {
        this.period = period;
        this.rangeStart = rangeStart;
        this.rangeEnd = rangeEnd;
        this.generatedAt = generatedAt;
        this.totalBookings = totalBookings;
        this.totalBookedHours = totalBookedHours;
        this.assets = assets;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public LocalDateTime getRangeStart() {
        return rangeStart;
    }

    public void setRangeStart(LocalDateTime rangeStart) {
        this.rangeStart = rangeStart;
    }

    public LocalDateTime getRangeEnd() {
        return rangeEnd;
    }

    public void setRangeEnd(LocalDateTime rangeEnd) {
        this.rangeEnd = rangeEnd;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public long getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(long totalBookings) {
        this.totalBookings = totalBookings;
    }

    public double getTotalBookedHours() {
        return totalBookedHours;
    }

    public void setTotalBookedHours(double totalBookedHours) {
        this.totalBookedHours = totalBookedHours;
    }

    public List<AssetUsageMetricResponse> getAssets() {
        return assets;
    }

    public void setAssets(List<AssetUsageMetricResponse> assets) {
        this.assets = assets;
    }
}