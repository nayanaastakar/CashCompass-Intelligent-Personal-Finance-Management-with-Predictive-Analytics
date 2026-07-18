package com.cashcompass.api.repository;

import com.cashcompass.api.model.FinancialScore;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FinancialScoreRepository extends JpaRepository<FinancialScore, Long> {
    List<FinancialScore> findByUserIdOrderByCalculatedAtDesc(Long userId);
    Optional<FinancialScore> findTopByUserIdOrderByCalculatedAtDesc(Long userId);
}
