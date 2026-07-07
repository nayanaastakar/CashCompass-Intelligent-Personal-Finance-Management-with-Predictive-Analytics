package com.finguard.api.controller;

import com.finguard.api.model.*;
import com.finguard.api.repository.*;
import com.finguard.api.security.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Aggregated financial analytics for the dashboard")
public class DashboardController {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final AssetRepository assetRepository;
    private final LiabilityRepository liabilityRepository;
    private final GoalRepository goalRepository;
    private final FinancialScoreRepository financialScoreRepository;

    @GetMapping("/summary")
    @Operation(summary = "Get complete dashboard summary: totals, net worth, cash flow, AI score")
    public ResponseEntity<Map<String, Object>> getSummary(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();

        List<Income> incomes = incomeRepository.findByUserId(userId);
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        List<Asset> assets = assetRepository.findByUserId(userId);
        List<Liability> liabilities = liabilityRepository.findByUserId(userId);
        List<Goal> goals = goalRepository.findByUserId(userId);

        double totalIncome = incomes.stream().mapToDouble(i -> i.getAmount().doubleValue()).sum();
        double totalExpense = expenses.stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();
        double totalAssets = assets.stream().mapToDouble(a -> a.getValue().doubleValue()).sum();
        double totalLiabilities = liabilities.stream().mapToDouble(l -> l.getAmount().doubleValue()).sum();
        double netWorth = totalAssets - totalLiabilities;
        double cashFlow = totalIncome - totalExpense;

        // Latest stability score
        Optional<FinancialScore> latestScore = financialScoreRepository.findTopByUserIdOrderByCalculatedAtDesc(userId);

        // Build monthly trend (last 12 months grouped)
        Map<String, Map<String, Double>> monthlyTrend = new LinkedHashMap<>();
        incomes.forEach(i -> {
            String month = i.getDateReceived().getYear() + "-" + String.format("%02d", i.getDateReceived().getMonthValue());
            monthlyTrend.computeIfAbsent(month, k -> new HashMap<>()).merge("income", i.getAmount().doubleValue(), Double::sum);
        });
        expenses.forEach(e -> {
            String month = e.getDateIncurred().getYear() + "-" + String.format("%02d", e.getDateIncurred().getMonthValue());
            monthlyTrend.computeIfAbsent(month, k -> new HashMap<>()).merge("expense", e.getAmount().doubleValue(), Double::sum);
        });

        // Expense by category
        Map<String, Double> expenseByCategory = new LinkedHashMap<>();
        expenses.forEach(e -> expenseByCategory.merge(e.getCategory(), e.getAmount().doubleValue(), Double::sum));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalIncome", totalIncome);
        result.put("totalExpense", totalExpense);
        result.put("netWorth", netWorth);
        result.put("cashFlow", cashFlow);
        result.put("totalAssets", totalAssets);
        result.put("totalLiabilities", totalLiabilities);
        result.put("goalCount", goals.size());
        result.put("monthlyTrend", monthlyTrend);
        result.put("expenseByCategory", expenseByCategory);
        result.put("stabilityScore", latestScore.map(FinancialScore::getStabilityScore).orElse(0));
        result.put("weatherForecast", latestScore.map(FinancialScore::getWeatherForecast).orElse("Not calculated"));
        result.put("shockResistanceIndex", latestScore.map(FinancialScore::getShockResistanceIndex).orElse(0.0));
        result.put("scoreExplanation", latestScore.map(FinancialScore::getExplanation).orElse("Add income & expense data to generate your AI score."));
        result.put("riskAlert", buildRiskAlert(latestScore));

        return ResponseEntity.ok(result);
    }

    private String buildRiskAlert(Optional<FinancialScore> latestScore) {
        if (latestScore.isEmpty()) {
            return "Add more financial records to enable your Guardian alert.";
        }

        FinancialScore score = latestScore.get();
        double dti = Optional.ofNullable(score.getDebtToIncomeRatio()).orElse(0.0);
        double shock = Optional.ofNullable(score.getShockResistanceIndex()).orElse(0.0);
        int stability = Optional.ofNullable(score.getStabilityScore()).orElse(0);

        if (stability < 40 || dti > 0.5 || shock < 3) {
            return "High-risk alert: reduce debt, rebuild emergency reserves, and trim discretionary spending.";
        }
        if (stability < 70 || dti > 0.35 || shock < 6) {
            return "Caution alert: strengthen savings and keep at least 3-6 months of liquid buffer.";
        }
        return "Healthy outlook: maintain discipline, save consistently, and review your family plan quarterly.";
    }
}
