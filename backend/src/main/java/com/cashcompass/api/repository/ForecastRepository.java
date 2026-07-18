package com.cashcompass.api.repository;

import com.cashcompass.api.model.Forecast;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ForecastRepository extends JpaRepository<Forecast, Long> {
    List<Forecast> findByUserIdOrderByGeneratedAtDesc(Long userId);
    Optional<Forecast> findTopByUserIdOrderByGeneratedAtDesc(Long userId);
}
