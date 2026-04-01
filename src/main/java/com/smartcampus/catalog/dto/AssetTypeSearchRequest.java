package com.smartcampus.catalog.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AssetTypeSearchRequest {

    @Size(max = 100, message = "Search query cannot exceed 100 characters")
    private String query;

    @Size(max = 50, message = "Code filter cannot exceed 50 characters")
    private String code;

    @Min(value = 0, message = "Page must be 0 or greater")
    private int page = 0;

    @Min(value = 1, message = "Size must be at least 1")
    @Max(value = 100, message = "Size cannot exceed 100")
    private int size = 10;

    @Pattern(regexp = "(?i)asc|desc", message = "sortDir must be ASC or DESC")
    private String sortDir = "asc";

    private String sortBy = "name";

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public String getSortDir() {
        return sortDir;
    }

    public void setSortDir(String sortDir) {
        this.sortDir = sortDir;
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }
}
