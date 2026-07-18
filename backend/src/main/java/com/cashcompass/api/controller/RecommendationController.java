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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendations", description = "Rule-based explainable financial recommendations")
public class RecommendationController {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final AssetRepository assetRepository;
    private final LiabilityRepository liabilityRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final RecommendationRepository recommendationRepository;

    @GetMapping
    @Operation(summary = "Get saved recommendations for the logged-in user")
    public ResponseEntity<List<Recommendation>> getSaved(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(recommendationRepository.findByUserIdOrderByGeneratedAtDesc(userDetails.getId()));
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate rule-based explainable financial recommendations")
    public ResponseEntity<List<Recommendation>> generate(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        User user = userRepository.findById(userId).orElseThrow();
        double totalIncome = incomeRepository.findByUserId(userId).stream().mapToDouble(i -> i.getAmount().doubleValue()).sum();
        double totalExpense = expenseRepository.findByUserId(userId).stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();
        double totalAssets = assetRepository.findByUserId(userId).stream().mapToDouble(a -> a.getValue().doubleValue()).sum();
        double totalLiabilities = liabilityRepository.findByUserId(userId).stream().mapToDouble(l -> l.getAmount().doubleValue()).sum();
        int goalCount = goalRepository.findByUserId(userId).size();

        double savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
        double dti = totalIncome > 0 ? totalLiabilities / totalIncome : 0;
        double netWorth = totalAssets - totalLiabilities;
        List<Recommendation> recs = new ArrayList<>();

        recs.add(build(user, savingsRate < 0.1 ? "critical" : "success",
            savingsRate < 0.1 ? "Low Savings Rate" : "Healthy Savings Rate",
            String.format("Savings rate is %.1f%%. Logic: (income - expenses) / income.", savingsRate * 100)));
        recs.add(build(user, dti > 0.4 ? "warning" : "success",
            dti > 0.4 ? "High Debt-to-Income Ratio" : "Manageable Debt Load",
            String.format("Debt-to-income ratio is %.1f%%. Logic: liabilities / income.", dti * 100)));
        recs.add(build(user, netWorth < totalExpense / 4 ? "critical" : "success",
            netWorth < totalExpense / 4 ? "Emergency Buffer Needs Work" : "Emergency Buffer Available",
            String.format("Net worth is %.0f against total expenses %.0f. Build 3-6 months of expense cover.", netWorth, totalExpense)));
        recs.add(build(user, goalCount == 0 ? "warning" : "success",
            goalCount == 0 ? "No Financial Goals Defined" : "Active Goal Tracking",
            "Goal count is " + goalCount + ". Logic: goal-oriented saving improves planning discipline."));

        return ResponseEntity.ok(recommendationRepository.saveAll(recs));
    }

    @PostMapping("/regret")
    @Operation(summary = "Analyze recent spending and return regret insights (no persistence)")
    public ResponseEntity<List<Map<String, Object>>> regret(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        List<Goal> goals = goalRepository.findByUserId(userId);

        Map<String, Double> byCategory = new HashMap<>();
        // consider last 6 months of expenses (approx)
        expenses.stream()
            .sorted((a,b) -> b.getDateIncurred().compareTo(a.getDateIncurred()))
            .limit(500)
            .forEach(e -> byCategory.merge(e.getCategory(), e.getAmount().doubleValue(), Double::sum));

        // compute monthly average per category (approx over 6 months)
        Map<String, Double> monthlyAvg = new HashMap<>();
        byCategory.forEach((k,v) -> monthlyAvg.put(k, v / 6.0));

        // pick top 4 discretionary categories by monthly avg
        List<Map.Entry<String, Double>> sorted = new ArrayList<>(monthlyAvg.entrySet());
        sorted.sort((a,b) -> Double.compare(b.getValue(), a.getValue()));

        List<Map<String, Object>> insights = new ArrayList<>();
        if (goals.isEmpty()) {
            for (int i = 0; i < Math.min(4, sorted.size()); i++) {
                var e = sorted.get(i);
                Map<String,Object> item = new HashMap<>();
                item.put("category", e.getKey());
                item.put("monthly_spend", Math.round(e.getValue()));
                item.put("suggestion", String.format("Reduce %s by 20%% (save ~₹%d/month)", e.getKey(), Math.round(e.getValue() * 0.2)));
                item.put("impact", "Improves monthly savings and emergency buffer.");
                insights.add(item);
            }
            return ResponseEntity.ok(insights);
        }

        Goal primary = goals.get(0);
        double remaining = primary.getTargetAmount().doubleValue() - primary.getCurrentAmount().doubleValue();
        long monthsLeft = Math.max(1, java.time.temporal.ChronoUnit.MONTHS.between(java.time.LocalDate.now(), primary.getTargetDate()));

        for (int i = 0; i < Math.min(4, sorted.size()); i++) {
            var e = sorted.get(i);
            double monthly = e.getValue();
            double save20 = monthly * 0.20; // if user reduces by 20%
            double monthsSaved = save20 > 0 ? Math.round((remaining / save20)) : 0;
            Map<String,Object> item = new HashMap<>();
            item.put("category", e.getKey());
            item.put("monthly_spend", Math.round(monthly));
            item.put("suggestion", String.format("Reduce %s by 20%% and redirect to savings (save ~₹%d/month)", e.getKey(), Math.round(save20)));
            item.put("estimated_goal_months_saved", monthsSaved);
            item.put("goal", primary.getName());
            item.put("goal_remaining", Math.round(remaining));
            insights.add(item);
        }

        return ResponseEntity.ok(insights);
    }

    private Recommendation build(User user, String type, String title, String description) {
        return Recommendation.builder()
            .user(user)
            .generatedAt(LocalDate.now())
            .type(type)
            .title(title)
            .description(description)
            .algorithm("Rule-Based Explainable Recommendation Engine")
            .build();
    }

    // DTO for apply request
    public static class ApplyRequest {
        public Long goalId;
        public Double amount; // amount to move to goal (positive)
        public String fromCategory;
        public String note;
    }

    @PostMapping("/apply")
    @Operation(summary = "Apply a spending recommendation by moving amount to a goal (simple server-side update)")
    public ResponseEntity<Goal> applyRecommendation(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                                    @RequestBody ApplyRequest req) {
        Long userId = userDetails.getId();
        if (req.goalId == null || req.amount == null || req.amount <= 0) {
            return ResponseEntity.badRequest().build();
        }
        Goal goal = goalRepository.findById(req.goalId).orElseThrow();
        if (!goal.getUser().getId().equals(userId)) return ResponseEntity.status(403).build();

        // Update goal current amount by the applied amount
        goal.setCurrentAmount(goal.getCurrentAmount().add(java.math.BigDecimal.valueOf(req.amount)));
        Goal saved = goalRepository.save(goal);

        // Persist an expense record representing the reduced spend (negative amount reduces totalExpense)
        try {
            Expense e = Expense.builder()
                    .user(goal.getUser())
                    .amount(BigDecimal.valueOf(-Math.abs(req.amount)))
                    .category(req.fromCategory != null ? req.fromCategory : "AppliedSuggestion")
                    .dateIncurred(LocalDate.now())
                    .description(req.note != null ? req.note : "Applied recommendation to goal: " + saved.getName())
                    .build();
            expenseRepository.save(e);
        } catch (Exception ex) {
            // swallow; goal update already persisted
        }

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/market-advisor")
    @Operation(summary = "Get AI Wealth Architect & Lazy Money Detector insights")
    public ResponseEntity<com.cashcompass.api.dto.MarketAdvisorDto> marketAdvisor(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        double totalExpense = expenseRepository.findByUserId(userId).stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();
        double totalAssets = assetRepository.findByUserId(userId).stream().mapToDouble(a -> a.getValue().doubleValue()).sum();
        double totalLiabilities = liabilityRepository.findByUserId(userId).stream().mapToDouble(l -> l.getAmount().doubleValue()).sum();
        double netSavings = totalAssets - totalLiabilities;
        
        double emergencyFundTarget = totalExpense * 2;
        double lazyMoney = Math.max(0, netSavings - emergencyFundTarget);
        boolean hasLazyMoney = lazyMoney > 1000;
        
        com.cashcompass.api.dto.MarketAdvisorDto dto = new com.cashcompass.api.dto.MarketAdvisorDto();
        dto.setTotalLiquidSavings(BigDecimal.valueOf(Math.max(0, netSavings)));
        dto.setEmergencyFundTarget(BigDecimal.valueOf(emergencyFundTarget));
        dto.setLazyMoney(BigDecimal.valueOf(lazyMoney));
        dto.setHasLazyMoney(hasLazyMoney);
        
        if (hasLazyMoney) {
            dto.setLazyMoneyAlert("You have ₹" + Math.round(lazyMoney) + " of 'Lazy Money' losing value to inflation.");
            dto.setLazyMoneyRecommendation("Based on current high interest rates, the AI suggests locking ₹" + Math.round(lazyMoney/2) + " in a Fixed Deposit (yielding 7.5%) and investing the remaining ₹" + Math.round(lazyMoney/2) + " in a balanced mutual fund.");
        } else {
            dto.setLazyMoneyAlert("Your savings are fully optimized for emergencies.");
            dto.setLazyMoneyRecommendation("Focus on building your emergency fund to ₹" + Math.round(emergencyFundTarget) + " before exploring other investments.");
        }
        
        dto.setMarketTrend("Down 4%");
        dto.setMarketOpportunityAlert("The market (Nifty50) recently dipped by 4%—historically, this is an excellent entry point.");
        dto.setSmartInvestRecommendation("The AI suggests starting a ₹5,000 SIP today in a Low-Cost Index Fund to ride the recovery.");
        
        return ResponseEntity.ok(dto);
    }
}
