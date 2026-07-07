package com.finguard.api.repository;

import com.finguard.api.model.Liability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LiabilityRepository extends JpaRepository<Liability, Long> {
    List<Liability> findByUserId(Long userId);
}
