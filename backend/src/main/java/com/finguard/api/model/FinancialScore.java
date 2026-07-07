package com.finguard.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "financial_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDate calculatedAt;
    private Integer stabilityScore;
    private String weatherForecast;
    private Double shockResistanceIndex;
    private Double savingsRate;
    private Double debtToIncomeRatio;
    private Double netWorth;
    private String algorithm;
    private String explanation;
}
