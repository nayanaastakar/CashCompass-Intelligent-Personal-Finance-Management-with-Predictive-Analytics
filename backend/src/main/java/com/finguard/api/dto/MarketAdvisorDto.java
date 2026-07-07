package com.finguard.api.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class MarketAdvisorDto {
    private BigDecimal totalLiquidSavings;
    private BigDecimal emergencyFundTarget;
    private BigDecimal lazyMoney;
    
    private boolean hasLazyMoney;
    private String lazyMoneyAlert;
    private String lazyMoneyRecommendation;
    
    private String marketTrend; // e.g. "Down 4%" or "Bullish"
    private String marketOpportunityAlert;
    private String smartInvestRecommendation;
}
