package com.finguard.api.repository;

import com.finguard.api.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByUserIdOrderByGeneratedAtDesc(Long userId);
}
