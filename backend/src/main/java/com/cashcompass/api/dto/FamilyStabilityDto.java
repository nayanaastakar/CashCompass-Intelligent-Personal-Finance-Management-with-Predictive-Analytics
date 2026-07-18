package com.cashcompass.api.dto;

import java.math.BigDecimal;
import java.util.List;

public class FamilyStabilityDto {
    // 1. Overall stability score (0-100)
    private int stabilityScore;
    private String stabilityLevel; // e.g., Green/Yellow/Red

    // 2. Financial Crisis Early Warning
    private String riskLevel; // Low, Medium, High
    private String riskReason;
    private String preventiveSuggestion;

    // 3. Household Survival Planner (days/months)
    private int survivalDays;
    private int emergencySavingsRequired;

    // 4. Child Future Readiness
    private boolean childReady;
    private BigDecimal monthlySavingsNeeded;

    // 5. Multi-Income Family Analyzer
    private List<IncomeShare> incomeShares; // member name and %
    private String overallIncomeStability;

    // 6. Financial Dependency Risk
    private boolean singleIncomeDependency;
    private String dependencyImpact;

    // 7. Family Emergency Readiness
    private int emergencyReadinessScore;
    private String emergencySuggestions;

    // 8. AI Recommendations
    private List<String> recommendations;

    // Marriage plan fields
    private int marriagePlanScore;
    private BigDecimal marriageCostEstimate;
    private int monthsToSaveForMarriage;
    private List<String> marriageRecommendations;

    // Custom Family Hub setting inputs
    private int emergencyBufferMonths;
    private BigDecimal childEducationTarget;
    private int childTimelineYears;
    private String familyInfoJson;

    // Nested class for income share
    public static class IncomeShare {
        private String memberName;
        private double contributionPct;

        public String getMemberName() { return memberName; }
        public void setMemberName(String memberName) { this.memberName = memberName; }

        public double getContributionPct() { return contributionPct; }
        public void setContributionPct(double contributionPct) { this.contributionPct = contributionPct; }
    }

    // Getters and Setters
    public int getStabilityScore() { return stabilityScore; }
    public void setStabilityScore(int stabilityScore) { this.stabilityScore = stabilityScore; }

    public String getStabilityLevel() { return stabilityLevel; }
    public void setStabilityLevel(String stabilityLevel) { this.stabilityLevel = stabilityLevel; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getRiskReason() { return riskReason; }
    public void setRiskReason(String riskReason) { this.riskReason = riskReason; }

    public String getPreventiveSuggestion() { return preventiveSuggestion; }
    public void setPreventiveSuggestion(String preventiveSuggestion) { this.preventiveSuggestion = preventiveSuggestion; }

    public int getSurvivalDays() { return survivalDays; }
    public void setSurvivalDays(int survivalDays) { this.survivalDays = survivalDays; }

    public int getEmergencySavingsRequired() { return emergencySavingsRequired; }
    public void setEmergencySavingsRequired(int emergencySavingsRequired) { this.emergencySavingsRequired = emergencySavingsRequired; }

    public boolean isChildReady() { return childReady; }
    public void setChildReady(boolean childReady) { this.childReady = childReady; }

    public BigDecimal getMonthlySavingsNeeded() { return monthlySavingsNeeded; }
    public void setMonthlySavingsNeeded(BigDecimal monthlySavingsNeeded) { this.monthlySavingsNeeded = monthlySavingsNeeded; }

    public List<IncomeShare> getIncomeShares() { return incomeShares; }
    public void setIncomeShares(List<IncomeShare> incomeShares) { this.incomeShares = incomeShares; }

    public String getOverallIncomeStability() { return overallIncomeStability; }
    public void setOverallIncomeStability(String overallIncomeStability) { this.overallIncomeStability = overallIncomeStability; }

    public boolean isSingleIncomeDependency() { return singleIncomeDependency; }
    public void setSingleIncomeDependency(boolean singleIncomeDependency) { this.singleIncomeDependency = singleIncomeDependency; }

    public String getDependencyImpact() { return dependencyImpact; }
    public void setDependencyImpact(String dependencyImpact) { this.dependencyImpact = dependencyImpact; }

    public int getEmergencyReadinessScore() { return emergencyReadinessScore; }
    public void setEmergencyReadinessScore(int emergencyReadinessScore) { this.emergencyReadinessScore = emergencyReadinessScore; }

    public String getEmergencySuggestions() { return emergencySuggestions; }
    public void setEmergencySuggestions(String emergencySuggestions) { this.emergencySuggestions = emergencySuggestions; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public int getMarriagePlanScore() { return marriagePlanScore; }
    public void setMarriagePlanScore(int marriagePlanScore) { this.marriagePlanScore = marriagePlanScore; }

    public BigDecimal getMarriageCostEstimate() { return marriageCostEstimate; }
    public void setMarriageCostEstimate(BigDecimal marriageCostEstimate) { this.marriageCostEstimate = marriageCostEstimate; }

    public int getMonthsToSaveForMarriage() { return monthsToSaveForMarriage; }
    public void setMonthsToSaveForMarriage(int monthsToSaveForMarriage) { this.monthsToSaveForMarriage = monthsToSaveForMarriage; }

    public List<String> getMarriageRecommendations() { return marriageRecommendations; }
    public void setMarriageRecommendations(List<String> marriageRecommendations) { this.marriageRecommendations = marriageRecommendations; }

    public int getEmergencyBufferMonths() { return emergencyBufferMonths; }
    public void setEmergencyBufferMonths(int emergencyBufferMonths) { this.emergencyBufferMonths = emergencyBufferMonths; }
    public BigDecimal getChildEducationTarget() { return childEducationTarget; }
    public void setChildEducationTarget(BigDecimal childEducationTarget) { this.childEducationTarget = childEducationTarget; }
    public int getChildTimelineYears() { return childTimelineYears; }
    public void setChildTimelineYears(int childTimelineYears) { this.childTimelineYears = childTimelineYears; }
    public String getFamilyInfoJson() { return familyInfoJson; }
    public void setFamilyInfoJson(String familyInfoJson) { this.familyInfoJson = familyInfoJson; }
}
