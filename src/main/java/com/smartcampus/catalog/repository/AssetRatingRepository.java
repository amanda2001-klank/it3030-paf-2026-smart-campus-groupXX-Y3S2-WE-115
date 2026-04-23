package com.smartcampus.catalog.repository;

import com.smartcampus.catalog.model.AssetRating;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRatingRepository extends MongoRepository<AssetRating, String> {

    boolean existsByAssetIdAndUserId(String assetId, String userId);

    Optional<AssetRating> findByAssetIdAndUserId(String assetId, String userId);

    List<AssetRating> findByAssetIdOrderByUpdatedAtDesc(String assetId);

    void deleteByAssetId(String assetId);
}
