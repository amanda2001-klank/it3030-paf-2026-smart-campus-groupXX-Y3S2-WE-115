package com.smartcampus.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AssetTypeRequest {

    @NotBlank(message = "Asset type code is required")
    @Size(max = 50, message = "Asset type code cannot exceed 50 characters")
    private String code;

    @NotBlank(message = "Asset type name is required")
    @Size(max = 100, message = "Asset type name cannot exceed 100 characters")
    private String name;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
