package com.ipp.api.repository;

import com.ipp.api.model.ProblemAsset;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import java.util.UUID;

public interface ProblemAssetRepository extends ReactiveCrudRepository<ProblemAsset, UUID> {
}
