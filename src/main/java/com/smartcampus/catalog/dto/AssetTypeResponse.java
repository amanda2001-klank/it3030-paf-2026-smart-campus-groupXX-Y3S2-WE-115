package com.smartcampus.catalog.dto;

import com.smartcampus.catalog.model.AssetType;

public class AssetTypeResponse {

    private String id;
    private String code;
    private String name;

    public static AssetTypeResponse fromAssetType(AssetType assetType) {
        AssetTypeResponse response = new AssetTypeResponse();
        response.setId(assetType.getId());
        response.setCode(assetType.getCode());
        response.setName(assetType.getName());
        return response;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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
