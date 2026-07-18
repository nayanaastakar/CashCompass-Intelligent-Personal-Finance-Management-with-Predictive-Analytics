package com.cashcompass.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "forecasts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Forecast {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    private LocalDate generatedAt;
    private Double next1MonthIncome;
    private Double next1MonthExpense;
    private Double next3MonthIncome;
    private Double next3MonthExpense;
    private Double next6MonthIncome;
    private Double next6MonthExpense;
    private String algorithm;
    private Integer dataPointsUsed;
    private String assumption;
    private Double confidenceScore;
}
