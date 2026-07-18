package com.cashcompass.api.controller;

import com.cashcompass.api.model.*;
import com.cashcompass.api.repository.*;
import com.cashcompass.api.security.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Analytics", description = "AI-powered financial forecasting and stability scoring")
public class AIController {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final AssetRepository assetRepository;
    private final LiabilityRepository liabilityRepository;
    private final FinancialScoreRepository financialScoreRepository;
    private final ForecastRepository forecastRepository;
    private final UserRepository userRepository;
    private final GoalRepository goalRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String AI_SERVICE_URL = "http://localhost:5000";

    @PostMapping("/forecast")
    @Operation(summary = "Generate AI income & expense forecast using Linear Regression")
    public ResponseEntity<Map<String, Object>> forecast(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        List<Income> incomes = incomeRepository.findByUserId(userId);
        List<Expense> expenses = expenseRepository.findByUserId(userId);

        // Build monthly aggregated data
        Map<String, Double> monthlyIncome = new TreeMap<>();
        Map<String, Double> monthlyExpense = new TreeMap<>();
        incomes.forEach(i -> {
            String key = i.getDateReceived().getYear() + "-" + String.format("%02d", i.getDateReceived().getMonthValue());
            monthlyIncome.merge(key, i.getAmount().doubleValue(), Double::sum);
        });
        expenses.forEach(e -> {
            String key = e.getDateIncurred().getYear() + "-" + String.format("%02d", e.getDateIncurred().getMonthValue());
            monthlyExpense.merge(key, e.getAmount().doubleValue(), Double::sum);
        });

        // Combine keys
        Set<String> allMonths = new TreeSet<>(monthlyIncome.keySet());
        allMonths.addAll(monthlyExpense.keySet());
        List<Map<String, Object>> historicalData = new ArrayList<>();
        int idx = 1;
        for (String month : allMonths) {
            Map<String, Object> row = new HashMap<>();
            row.put("month", idx++);
            row.put("income", monthlyIncome.getOrDefault(month, 0.0));
            row.put("expense", monthlyExpense.getOrDefault(month, 0.0));
            historicalData.add(row);
        }

        if (historicalData.size() < 6) {
            return ResponseEntity.ok(Map.of(
                "error", "Insufficient historical data for reliable forecasting.",
                "min_required", 6,
                "provided", historicalData.size()
            ));
        }

        Map<String, Object> payload = Map.of("historical_data", historicalData);
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> aiResponse = restTemplate.postForObject(AI_SERVICE_URL + "/forecast/income-expense", payload, Map.class);
            if (aiResponse != null && aiResponse.get("predictions") instanceof Map<?, ?> predictions) {
                @SuppressWarnings("unchecked")
                Map<String, Object> typedPredictions = (Map<String, Object>) predictions;
                @SuppressWarnings("unchecked")
                Map<String, Object> oneMonth = (Map<String, Object>) typedPredictions.get("next_1_month");
                @SuppressWarnings("unchecked")
                Map<String, Object> threeMonths = (Map<String, Object>) typedPredictions.get("next_3_months");
                @SuppressWarnings("unchecked")
                Map<String, Object> sixMonths = (Map<String, Object>) typedPredictions.get("next_6_months");

                User user = userRepository.findById(userId).orElseThrow();
                Forecast forecast = Forecast.builder()
                    .user(user)
                    .generatedAt(LocalDate.now())
                    .next1MonthIncome(((Number) oneMonth.get("income")).doubleValue())
                    .next1MonthExpense(((Number) oneMonth.get("expense")).doubleValue())
                    .next3MonthIncome(((Number) threeMonths.get("income")).doubleValue())
                    .next3MonthExpense(((Number) threeMonths.get("expense")).doubleValue())
                    .next6MonthIncome(((Number) sixMonths.get("income")).doubleValue())
                    .next6MonthExpense(((Number) sixMonths.get("expense")).doubleValue())
                    .algorithm("Linear Regression")
                    .dataPointsUsed(historicalData.size())
                    .assumption("Future income and expenses follow historical linear trends.")
                    .confidenceScore(Math.min(0.95, 0.55 + (historicalData.size() * 0.03)))
                    .build();
                forecastRepository.save(forecast);
                aiResponse.put("historical_data_used", historicalData);
                aiResponse.put("confidence_level", forecast.getConfidenceScore());

                double next1CashFlow = forecast.getNext1MonthIncome() - forecast.getNext1MonthExpense();
                double next3CashFlow = forecast.getNext3MonthIncome() - forecast.getNext3MonthExpense();
                double next6CashFlow = forecast.getNext6MonthIncome() - forecast.getNext6MonthExpense();
                String guardianAlert = (next1CashFlow < 0 || next3CashFlow < 0 || next6CashFlow < 0)
                    ? "Projected expenses may exceed income in the near term. Review your budget and build liquidity."
                    : "Projected cash flow remains positive across the next 6 months. Continue saving consistently.";

                aiResponse.put("predicted_cash_flow", Map.of(
                    "next_1_month", round(next1CashFlow),
                    "next_3_months", round(next3CashFlow),
                    "next_6_months", round(next6CashFlow)
                ));
                aiResponse.put("guardian_alert", guardianAlert);
            }
            return ResponseEntity.ok(aiResponse);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", "AI service unavailable. Please ensure Python service is running on port 5000."));
        }
    }

    @PostMapping("/stability-score")
    @Operation(summary = "Calculate AI financial stability score using Weighted Scoring Algorithm")
    public ResponseEntity<Map<String, Object>> stabilityScore(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        List<Income> incomes = incomeRepository.findByUserId(userId);
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        List<Asset> assets = assetRepository.findByUserId(userId);
        List<Liability> liabilities = liabilityRepository.findByUserId(userId);

        double totalIncome = incomes.stream().mapToDouble(i -> i.getAmount().doubleValue()).sum();
        double totalExpense = expenses.stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();
        double totalAssets = assets.stream().mapToDouble(a -> a.getValue().doubleValue()).sum();
        double totalLiabilities = liabilities.stream().mapToDouble(l -> l.getAmount().doubleValue()).sum();
        double netWorth = totalAssets - totalLiabilities;
        double averageMonthlyExpense = totalExpense / Math.max(1, expenses.size());
        double liquidAssets = assets.stream()
            .filter(a -> a.getType() != null && a.getType().toLowerCase().contains("liquid"))
            .mapToDouble(a -> a.getValue().doubleValue())
            .sum();
        double shockResistanceIndex = averageMonthlyExpense > 0 ? Math.min(12.0, liquidAssets / averageMonthlyExpense) : 0.0;
        double savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0.0;
        double debtToIncomeRatio = totalIncome > 0 ? totalLiabilities / totalIncome : 0.0;

        Map<String, Object> payload = new HashMap<>();
        payload.put("net_worth", netWorth);
        payload.put("monthly_income", totalIncome / Math.max(1, incomes.size()));
        payload.put("monthly_expense", totalExpense / Math.max(1, expenses.size()));
        payload.put("liabilities", totalLiabilities);
        payload.put("savings_rate", savingsRate);
        payload.put("debt_to_income_ratio", debtToIncomeRatio);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> aiResponse = restTemplate.postForObject(AI_SERVICE_URL + "/stability-score", payload, Map.class);

            // Construct a detailed multi-line XAI explanation
            double srPct = savingsRate * 100;
            double dtiPct = debtToIncomeRatio * 100;
            
            StringBuilder explanation = new StringBuilder();
            explanation.append("Your financial stability score is ")
                       .append(((Number) aiResponse.get("financial_stability_score")).intValue())
                       .append("/100. ")
                       .append("Outlook: ").append(aiResponse.get("financial_weather_forecast")).append(". ")
                       .append("Detailed Factor Analysis: ");
                       
            if (savingsRate > 0.2) {
                explanation.append("[Savings Rate: Excellent (").append(String.format("%.1f", srPct)).append("%), +20 pts] ");
            } else if (savingsRate > 0.1) {
                explanation.append("[Savings Rate: Healthy (").append(String.format("%.1f", srPct)).append("%), +10 pts] ");
            } else if (savingsRate < 0) {
                explanation.append("[Savings Rate: Deficit (").append(String.format("%.1f", srPct)).append("%), -20 pts] ");
            } else {
                explanation.append("[Savings Rate: Neutral (").append(String.format("%.1f", srPct)).append("%)] ");
            }
            
            if (debtToIncomeRatio < 0.3) {
                explanation.append("[Debt-to-Income: Manageable (").append(String.format("%.1f", dtiPct)).append("%), +15 pts] ");
            } else if (debtToIncomeRatio > 0.5) {
                explanation.append("[Debt-to-Income: High Risk (").append(String.format("%.1f", dtiPct)).append("%), -20 pts] ");
            } else {
                explanation.append("[Debt-to-Income: Neutral (").append(String.format("%.1f", dtiPct)).append("%)] ");
            }
            
            if (netWorth > 50000) {
                explanation.append("[Net Worth Buffer: Solid (Rs. ").append(Math.round(netWorth)).append("), +15 pts]");
            } else if (netWorth > 10000) {
                explanation.append("[Net Worth Buffer: Moderate (Rs. ").append(Math.round(netWorth)).append("), +5 pts]");
            } else {
                explanation.append("[Net Worth Buffer: Low (Rs. ").append(Math.round(netWorth)).append(")]");
            }

            // Save score to DB
            User user = userRepository.findById(userId).orElseThrow();
            FinancialScore score = FinancialScore.builder()
                .user(user)
                .calculatedAt(LocalDate.now())
                .stabilityScore(((Number) aiResponse.get("financial_stability_score")).intValue())
                .weatherForecast((String) aiResponse.get("financial_weather_forecast"))
                .netWorth(netWorth)
                .shockResistanceIndex(shockResistanceIndex)
                .savingsRate(savingsRate)
                .debtToIncomeRatio(debtToIncomeRatio)
                .algorithm("Weighted Scoring Algorithm + Formula-Based Shock Resistance Index")
                .explanation(explanation.toString())
                .build();
            financialScoreRepository.save(score);

            aiResponse.put("savings_rate", round(savingsRate * 100.0));
            aiResponse.put("debt_to_income_ratio", round(debtToIncomeRatio * 100.0));
            aiResponse.put("net_worth", round(netWorth));
            aiResponse.put("monthly_surplus", round(totalIncome - totalExpense));
            aiResponse.put("shock_resistance_index", Math.round(shockResistanceIndex * 100.0) / 100.0);
            aiResponse.put("shock_resistance_logic", "Liquid assets divided by average monthly expenses, capped at 12 months.");
            aiResponse.put("risk_alert", generateRiskAlert(score.getStabilityScore(), dtiToPercent(debtToIncomeRatio), shockResistanceIndex));
            return ResponseEntity.ok(aiResponse);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", "AI service unavailable. Please ensure Python service is running on port 5000."));
        }
    }

    @PostMapping("/scenario")
    @Operation(summary = "Run a What-If financial simulation scenario")
    public ResponseEntity<Map<String, Object>> runScenario(@RequestBody Map<String, Object> scenarioPayload,
                                                            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        User user = userRepository.findById(userId).orElseThrow();

        List<Income> incomes = incomeRepository.findByUserId(userId);
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        List<Asset> assets = assetRepository.findByUserId(userId);
        List<Liability> liabilities = liabilityRepository.findByUserId(userId);
        List<Goal> goals = goalRepository.findByUserId(userId);

        double totalIncome = incomes.stream().mapToDouble(i -> i.getAmount().doubleValue()).sum();
        double totalExpense = expenses.stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();
        double totalAssets = assets.stream().mapToDouble(a -> a.getValue().doubleValue()).sum();
        double totalLiabilities = liabilities.stream().mapToDouble(l -> l.getAmount().doubleValue()).sum();
        double liquidAssets = assets.stream()
            .filter(a -> a.getType() != null && a.getType().equalsIgnoreCase("LIQUID"))
            .mapToDouble(a -> a.getValue().doubleValue())
            .sum();
        if (liquidAssets == 0) {
            liquidAssets = totalAssets * 0.35;
        }

        int activeMonths = Math.max(1, countActiveMonths(incomes, expenses));
        double monthlyIncome = totalIncome / activeMonths;
        double monthlyExpense = totalExpense / activeMonths;

        String scenarioType = String.valueOf(scenarioPayload.getOrDefault("scenario_type", "custom"));
        Map<String, Double> preset = scenarioPreset(scenarioType);
        int durationMonths = Math.max(1, (int) parseDouble(scenarioPayload.getOrDefault("duration_months", preset.getOrDefault("duration_months", 3.0))));
        double incomeChangePercent = parseDouble(scenarioPayload.getOrDefault("income_change_percent", preset.getOrDefault("income_change_percent", 0.0)));
        double expenseChangePercent = parseDouble(scenarioPayload.getOrDefault("expense_change_percent", preset.getOrDefault("expense_change_percent", 0.0)));
        double oneTimeExpense = parseDouble(scenarioPayload.getOrDefault("one_time_expense", preset.getOrDefault("one_time_expense", 0.0)));
        double liabilityIncrease = parseDouble(scenarioPayload.getOrDefault("liability_increase", preset.getOrDefault("liability_increase", 0.0)));
        double emiIncrease = parseDouble(scenarioPayload.getOrDefault("emi_increase", preset.getOrDefault("emi_increase", 0.0)));
        double assetChangePercent = parseDouble(scenarioPayload.getOrDefault("asset_change_percent", preset.getOrDefault("asset_change_percent", 0.0)));

        double projectedMonthlyIncome = Math.max(0, monthlyIncome * (1 + incomeChangePercent / 100.0));
        double projectedMonthlyExpense = Math.max(0, (monthlyExpense * (1 + expenseChangePercent / 100.0)) + emiIncrease + (oneTimeExpense / durationMonths));
        double projectedAssets = Math.max(0, (totalAssets * (1 + assetChangePercent / 100.0)) - oneTimeExpense);
        double projectedLiquidAssets = Math.max(0, (liquidAssets * (1 + assetChangePercent / 100.0)) - oneTimeExpense);
        double projectedLiabilities = Math.max(0, totalLiabilities + liabilityIncrease);
        double projectedNetWorth = projectedAssets - projectedLiabilities;
        double projectedCashFlow = projectedMonthlyIncome - projectedMonthlyExpense;
        double survivalMonths = projectedMonthlyExpense > 0 ? projectedLiquidAssets / projectedMonthlyExpense : 12.0;
        double debtToIncomeRatio = projectedMonthlyIncome > 0 ? projectedLiabilities / (projectedMonthlyIncome * 12.0) : 99.0;

        Map<String, Object> aiPayload = new LinkedHashMap<>();
        aiPayload.put("net_worth", projectedNetWorth);
        aiPayload.put("monthly_income", projectedMonthlyIncome);
        aiPayload.put("monthly_expense", projectedMonthlyExpense);
        aiPayload.put("liabilities", projectedLiabilities);

        Map<String, Object> aiResponse = new LinkedHashMap<>();
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(AI_SERVICE_URL + "/stability-score", aiPayload, Map.class);
            if (response != null) {
                aiResponse.putAll(response);
            }
        } catch (Exception e) {
            aiResponse.put("financial_stability_score", fallbackScenarioScore(projectedCashFlow, projectedMonthlyIncome, debtToIncomeRatio, survivalMonths, projectedNetWorth));
            aiResponse.put("financial_weather_forecast", classifyScore((int) aiResponse.get("financial_stability_score")));
            aiResponse.put("explainable_ai", Map.of("logic", "Score estimated from personalized cash flow, debt ratio, net worth, and survival months because AI service was unavailable."));
        }

        int projectedScore = ((Number) aiResponse.getOrDefault("financial_stability_score", 0)).intValue();
        Map<String, Object> result = new LinkedHashMap<>(aiResponse);
        result.put("scenario_type", scenarioType);
        result.put("risk_level", classifyScenario(projectedScore, survivalMonths, projectedCashFlow));
        result.put("baseline", Map.of(
            "monthly_income", round(monthlyIncome),
            "monthly_expense", round(monthlyExpense),
            "cash_flow", round(monthlyIncome - monthlyExpense),
            "net_worth", round(totalAssets - totalLiabilities),
            "liquid_assets", round(liquidAssets),
            "liabilities", round(totalLiabilities)
        ));
        result.put("projected", Map.of(
            "monthly_income", round(projectedMonthlyIncome),
            "monthly_expense", round(projectedMonthlyExpense),
            "cash_flow", round(projectedCashFlow),
            "net_worth", round(projectedNetWorth),
            "liquid_assets", round(projectedLiquidAssets),
            "liabilities", round(projectedLiabilities),
            "debt_to_income_ratio", round(debtToIncomeRatio),
            "survival_months", round(Math.min(24.0, survivalMonths))
        ));
        result.put("scenario_inputs", Map.of(
            "duration_months", durationMonths,
            "income_change_percent", incomeChangePercent,
            "expense_change_percent", expenseChangePercent,
            "one_time_expense", oneTimeExpense,
            "liability_increase", liabilityIncrease,
            "emi_increase", emiIncrease,
            "asset_change_percent", assetChangePercent
        ));
        result.put("goal_impact", goalImpact(goals, projectedCashFlow));
        result.put("personalized_factors", personalizedFactors(user, activeMonths, goals.size()));
        result.put("action_plan", actionPlan(projectedCashFlow, projectedMonthlyExpense, survivalMonths, debtToIncomeRatio, goals));
        return ResponseEntity.ok(result);
    }

    private int countActiveMonths(List<Income> incomes, List<Expense> expenses) {
        Set<String> months = new HashSet<>();
        incomes.forEach(i -> months.add(i.getDateReceived().getYear() + "-" + i.getDateReceived().getMonthValue()));
        expenses.forEach(e -> months.add(e.getDateIncurred().getYear() + "-" + e.getDateIncurred().getMonthValue()));
        return months.size();
    }

    private Map<String, Double> scenarioPreset(String scenarioType) {
        Map<String, Double> preset = new HashMap<>();
        switch (scenarioType.toLowerCase()) {
            case "job_loss" -> {
                preset.put("income_change_percent", -100.0);
                preset.put("duration_months", 3.0);
            }
            case "medical_emergency" -> preset.put("one_time_expense", 100000.0);
            case "emi_increase" -> preset.put("emi_increase", 10000.0);
            case "income_drop" -> preset.put("income_change_percent", -30.0);
            case "inflation" -> preset.put("expense_change_percent", 15.0);
            case "market_crash" -> preset.put("asset_change_percent", -20.0);
            case "house_purchase" -> {
                preset.put("one_time_expense", 500000.0);
                preset.put("liability_increase", 1500000.0);
                preset.put("emi_increase", 18000.0);
            }
            default -> {
            }
        }
        return preset;
    }

    private Map<String, Object> goalImpact(List<Goal> goals, double projectedCashFlow) {
        double requiredMonthlySavings = goals.stream().mapToDouble(goal -> {
            double remaining = Math.max(0, goal.getTargetAmount().doubleValue() - goal.getCurrentAmount().doubleValue());
            long months = Math.max(1, java.time.temporal.ChronoUnit.MONTHS.between(LocalDate.now(), goal.getTargetDate()));
            return remaining / months;
        }).sum();
        double monthlyGap = Math.max(0, requiredMonthlySavings - Math.max(0, projectedCashFlow));
        return Map.of(
            "goal_count", goals.size(),
            "required_monthly_savings", round(requiredMonthlySavings),
            "available_monthly_savings", round(Math.max(0, projectedCashFlow)),
            "monthly_gap", round(monthlyGap),
            "status", monthlyGap > 0 ? "AT_RISK" : "ON_TRACK"
        );
    }

    private Map<String, Object> personalizedFactors(User user, int activeMonths, int goalCount) {
        Map<String, Object> factors = new LinkedHashMap<>();
        factors.put("age", user.getAge());
        factors.put("family_size", user.getFamilySize());
        factors.put("employment_type", user.getEmploymentType() != null ? user.getEmploymentType().name() : "UNKNOWN");
        factors.put("historical_months_used", activeMonths);
        factors.put("goal_count", goalCount);
        return factors;
    }

    private List<String> actionPlan(double cashFlow, double monthlyExpense, double survivalMonths, double debtToIncomeRatio, List<Goal> goals) {
        List<String> plan = new ArrayList<>();
        if (cashFlow < 0) {
            plan.add("Cut or defer at least Rs. " + Math.round(Math.abs(cashFlow)) + " per month to stop deficit spending during this scenario.");
        }
        if (survivalMonths < 3) {
            plan.add("Build liquid emergency reserves to at least Rs. " + Math.round(monthlyExpense * 3) + " before taking new high-risk commitments.");
        } else if (survivalMonths < 6) {
            plan.add("Increase emergency reserves toward six months of expenses for stronger shock resistance.");
        }
        if (debtToIncomeRatio > 0.5) {
            plan.add("Avoid new debt and redirect surplus toward liabilities until debt pressure falls below 50% of annual income.");
        }
        if (!goals.isEmpty() && cashFlow > 0) {
            plan.add("Prioritize goals by nearest target date and fund them from the projected monthly surplus first.");
        }
        if (plan.isEmpty()) {
            plan.add("Scenario remains manageable. Maintain current savings discipline and review this simulation monthly.");
        }
        return plan;
    }

    private int fallbackScenarioScore(double cashFlow, double income, double debtToIncomeRatio, double survivalMonths, double netWorth) {
        int score = 50;
        if (income > 0) {
            double savingsRate = cashFlow / income;
            if (savingsRate > 0.2) score += 20;
            else if (savingsRate > 0.1) score += 10;
            else if (savingsRate < 0) score -= 25;
        } else {
            score -= 30;
        }
        if (debtToIncomeRatio < 0.3) score += 15;
        else if (debtToIncomeRatio > 0.5) score -= 20;
        if (survivalMonths >= 6) score += 15;
        else if (survivalMonths < 3) score -= 20;
        if (netWorth > 0) score += 5;
        return Math.max(0, Math.min(100, score));
    }

    private String classifyScore(int score) {
        if (score < 40) return "High Risk";
        if (score < 70) return "Caution";
        return "Stable";
    }

    private String classifyScenario(int score, double survivalMonths, double cashFlow) {
        if (score < 40 || survivalMonths < 2 || cashFlow < 0) return "HIGH_RISK";
        if (score < 70 || survivalMonths < 6) return "WATCH";
        return "RESILIENT";
    }

    private double parseDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number number) return number.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0.0;
        }
    }

    private String generateRiskAlert(int score, double debtToIncomePercent, double shockResistanceIndex) {
        if (score < 40 || debtToIncomePercent > 50 || shockResistanceIndex < 3) {
            return "Your family finance guard is issuing a high-risk alert: improve savings, reduce debt, and strengthen emergency reserves.";
        }
        if (score < 70 || debtToIncomePercent > 35 || shockResistanceIndex < 6) {
            return "Caution alert: take action on discretionary spending and keep at least 3-6 months of liquid coverage.";
        }
        return "Healthy outlook: maintain discipline, keep saving, and review your plan quarterly.";
    }

    private double dtiToPercent(double dti) {
        return round(dti * 100.0);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
