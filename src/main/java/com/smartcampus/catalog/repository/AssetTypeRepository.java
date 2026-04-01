package com.smartcampus.catalog.repository;

import com.smartcampus.catalog.model.AssetType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssetTypeRepository extends MongoRepository<AssetType, String> {

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, String id);

    Optional<AssetType> findByCodeIgnoreCase(String code);
}
