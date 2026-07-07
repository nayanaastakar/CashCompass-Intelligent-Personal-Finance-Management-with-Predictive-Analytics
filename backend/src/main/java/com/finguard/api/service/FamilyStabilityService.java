package com.finguard.api.service;

import com.finguard.api.dto.FamilyStabilityDto;
import com.finguard.api.dto.FamilyStabilityDto.IncomeShare;
import com.finguard.api.model.*;
import com.finguard.api.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FamilyStabilityService {

    @Autowired private UserRepository userRepository;
    @Autowired private IncomeRepository incomeRepository;
    @Autowired private ExpenseRepository expenseRepository;
    @Autowired private AssetRepository assetRepository;
    @Autowired private LiabilityRepository liabilityRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    public FamilyStabilityDto getFamilyStability(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        // Gather data
        List<Income> incomes = incomeRepository.findByUserId(userId);
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        List<Asset> assets = assetRepository.findByUserId(userId);
        List<Liability> liabilities = liabilityRepository.findByUserId(userId);

        double totalIncome = incomes.stream().mapToDouble(i -> i.getAmount().doubleValue()).sum();
        double totalExpense = expenses.stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();
        double totalAssets = assets.stream().mapToDouble(a -> a.getValue().doubleValue()).sum();
        double totalLiabilities = liabilities.stream().mapToDouble(l -> l.getAmount().doubleValue()).sum();
        double saved = totalAssets - totalLiabilities;
        double monthlyNet = totalIncome - totalExpense;

        int familySize = user.getFamilySize() != null ? user.getFamilySize() : 1;
        // Parse custom settings if present
        int emergencyBufferMonths = 6;
        double childEducationTarget = 500000.0;
        int childTimelineYears = 20;
        List<Map<String, Object>> customIncomes = null;

        if (user.getFamilyInfo() != null && !user.getFamilyInfo().isBlank()) {
            try {
                Map<String, Object> map = mapper.readValue(user.getFamilyInfo(), Map.class);
                if (map.containsKey("emergencyBufferMonths")) {
                    emergencyBufferMonths = ((Number) map.get("emergencyBufferMonths")).intValue();
                }
                if (map.containsKey("childEducationTarget")) {
                    childEducationTarget = ((Number) map.get("childEducationTarget")).doubleValue();
                }
                if (map.containsKey("childTimelineYears")) {
                    childTimelineYears = ((Number) map.get("childTimelineYears")).intValue();
                }
                if (map.containsKey("customIncomes")) {
                    customIncomes = (List<Map<String, Object>>) map.get("customIncomes");
                }
            } catch (Exception e) {
                // ignore parsing exceptions
            }
        }

        // 1. Stability Score (simple weighted formula)
        double score = Math.min(100,
                0.4 * (saved / Math.max(totalExpense, 1)) * 100 +
                0.3 * (monthlyNet / Math.max(totalIncome, 1)) * 100 +
                0.2 * (1.0 / (Math.max(familySize - 2, 1))) * 100 +
                0.1 * (user.getEmploymentType() != null ? 80 : 0) // placeholder
        );

        // 2. Early Warning (very naive)
        String riskLevel;
        String riskReason;
        if (monthlyNet < 0) {
            riskLevel = "High";
            riskReason = "Cash flow negative";
        } else if (saved < totalExpense * emergencyBufferMonths) {
            riskLevel = "Medium";
            riskReason = "Low emergency cushion";
        } else {
            riskLevel = "Low";
            riskReason = "Healthy finances";
        }
        String preventiveSuggestion = riskLevel.equals("Low") ? "Maintain current habits" : "Consider increasing savings";

        // 3. Survival Planner (days based on expenses)
        int survivalDays = (int) Math.max(0, saved / Math.max(totalExpense / 30.0, 1) * 30);
        int emergencySavingsRequired = (int) Math.max(0, (totalExpense * emergencyBufferMonths) - saved);

        // 4. Child Future Readiness (placeholder)
        int numChildren = Math.max(0, familySize - 2);
        double targetFund = childEducationTarget * numChildren;
        boolean childReady = saved >= targetFund;
        BigDecimal monthlySavingsNeeded = childReady ? BigDecimal.ZERO : BigDecimal.valueOf((targetFund - saved) / Math.max(1, childTimelineYears * 12));

        // 5. Multi-Income Analyzer
        List<IncomeShare> shares = new ArrayList<>();
        double sum = 0;
        if (customIncomes != null && !customIncomes.isEmpty()) {
            for (Map<String, Object> ci : customIncomes) {
                sum += ((Number) ci.getOrDefault("income", 0)).doubleValue();
            }
            for (Map<String, Object> ci : customIncomes) {
                IncomeShare share = new IncomeShare();
                share.setMemberName(String.valueOf(ci.getOrDefault("memberName", "Member")));
                share.setContributionPct(sum == 0 ? 0 : (((Number) ci.getOrDefault("income", 0)).doubleValue() / sum) * 100);
                shares.add(share);
            }
        } else {
            Map<String, Double> contributionMap = new HashMap<>();
            for (Income inc : incomes) {
                String name = user.getName(); // use the already fetched user to avoid lazy init exception
                contributionMap.put(name, contributionMap.getOrDefault(name, 0.0) + inc.getAmount().doubleValue());
            }
            sum = contributionMap.values().stream().mapToDouble(Double::doubleValue).sum();
            for (Map.Entry<String, Double> e : contributionMap.entrySet()) {
                IncomeShare share = new IncomeShare();
                share.setMemberName(e.getKey());
                share.setContributionPct(sum == 0 ? 0 : (e.getValue() / sum) * 100);
                shares.add(share);
            }
        }
        boolean singleIncomeDependency = shares.size() <= 1 && (shares.isEmpty() || shares.get(0).getContributionPct() > 80);
        String dependencyImpact = singleIncomeDependency ? "High risk if primary earner loses income" : "Balanced income sources";

        // 6. Emergency Readiness (simple)
        int emergencyReadinessScore = (int) Math.min(100, (saved / (totalExpense * Math.max(1, emergencyBufferMonths))) * 100);
        String emergencySuggestions = emergencyReadinessScore < 70 ? "Boost emergency fund" : "Good level of preparedness";

        // 7. Marriage Plan (parse JSON if present)
        int marriagePlanScore = 0;
        BigDecimal marriageCostEstimate = BigDecimal.ZERO;
        int monthsToSaveForMarriage = 0;
        List<String> marriageRecommendations = new ArrayList<>();
        if (user.getMarriageInfo() != null && !user.getMarriageInfo().isBlank()) {
            try {
                Map<String, Object> map = mapper.readValue(user.getMarriageInfo(), Map.class);
                Number costNum = (Number) map.getOrDefault("cost", 0);
                marriageCostEstimate = BigDecimal.valueOf(costNum.doubleValue());
                double cost = marriageCostEstimate.doubleValue();
                marriagePlanScore = (int) Math.min(100, (saved / cost) * 100);
                if (cost > saved) {
                    monthsToSaveForMarriage = (int) Math.ceil((cost - saved) / Math.max(monthlyNet, 1));
                }
                if (marriagePlanScore < 70) {
                    marriageRecommendations.add("Increase savings to reach marriage goal faster.");
                } else {
                    marriageRecommendations.add("On track for marriage plan.");
                }
            } catch (Exception e) {
                // ignore parsing errors
            }
        }

        // 8. AI Recommendations placeholder
        List<String> recommendations = new ArrayList<>();
        recommendations.add("Maintain a cash‑flow surplus of at least 20 % of income.");
        recommendations.add("Build an emergency fund covering " + emergencyBufferMonths + " months of expenses.");
        if (singleIncomeDependency) {
            recommendations.add("Diversify income sources to reduce dependency risk.");
        }
        if (monthsToSaveForMarriage > 12) {
            recommendations.add("Consider extending marriage timeline or adjusting budget.");
        }

        // Assemble DTO
        FamilyStabilityDto dto = new FamilyStabilityDto();
        dto.setStabilityScore((int) Math.round(score));
        dto.setStabilityLevel(score >= 70 ? "Green" : score >= 40 ? "Yellow" : "Red");
        dto.setRiskLevel(riskLevel);
        dto.setRiskReason(riskReason);
        dto.setPreventiveSuggestion(preventiveSuggestion);
        dto.setSurvivalDays(survivalDays);
        dto.setEmergencySavingsRequired(emergencySavingsRequired);
        dto.setChildReady(childReady);
        dto.setMonthlySavingsNeeded(monthlySavingsNeeded);
        dto.setIncomeShares(shares);
        dto.setOverallIncomeStability(singleIncomeDependency ? "High dependency" : "Balanced");
        dto.setSingleIncomeDependency(singleIncomeDependency);
        dto.setDependencyImpact(dependencyImpact);
        dto.setEmergencyReadinessScore(emergencyReadinessScore);
        dto.setEmergencySuggestions(emergencySuggestions);
        dto.setRecommendations(recommendations);
        dto.setMarriagePlanScore(marriagePlanScore);
        dto.setMarriageCostEstimate(marriageCostEstimate);
        dto.setMonthsToSaveForMarriage(monthsToSaveForMarriage);
        dto.setMarriageRecommendations(marriageRecommendations);

        // custom properties for pre-filling input forms
        dto.setEmergencyBufferMonths(emergencyBufferMonths);
        dto.setChildEducationTarget(BigDecimal.valueOf(childEducationTarget));
        dto.setChildTimelineYears(childTimelineYears);
        dto.setFamilyInfoJson(user.getFamilyInfo());

        return dto;
    }
}
