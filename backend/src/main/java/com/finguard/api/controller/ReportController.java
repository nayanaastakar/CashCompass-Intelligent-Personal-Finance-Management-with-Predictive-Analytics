package com.finguard.api.controller;

import com.finguard.api.model.*;
import com.finguard.api.repository.*;
import com.finguard.api.security.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Monthly, quarterly, and annual smart financial reports")
public class ReportController {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final AssetRepository assetRepository;
    private final LiabilityRepository liabilityRepository;
    private final GoalRepository goalRepository;
    private final ForecastRepository forecastRepository;
    private final FinancialScoreRepository financialScoreRepository;
    private final RecommendationRepository recommendationRepository;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;

    @GetMapping
    @Operation(summary = "List saved report metadata")
    public ResponseEntity<List<Report>> list(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(reportRepository.findByUserIdOrderByGeneratedAtDesc(userDetails.getId()));
    }

    @PostMapping("/{type}")
    @Operation(summary = "Generate report metadata and structured report payload")
    public ResponseEntity<Map<String, Object>> generate(@PathVariable String type, @RequestParam(defaultValue = "JSON") String format,
                                                        @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        User user = userRepository.findById(userId).orElseThrow();
        Report report = saveReport(type, format, user);
        Map<String, Object> payload = reportPayload(userId);
        payload.put("report", report);
        payload.put("period", type.toUpperCase());
        payload.put("format", format.toUpperCase());
        return ResponseEntity.ok(payload);
    }

    @GetMapping(value = "/{type}/csv", produces = "text/csv")
    @Operation(summary = "Download a CSV smart financial report")
    public ResponseEntity<String> csv(@PathVariable String type, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        User user = userRepository.findById(userId).orElseThrow();
        saveReport(type, "CSV", user);
        Map<String, Object> payload = reportPayload(userId);
        StringBuilder csv = new StringBuilder();
        csv.append("FinGuard.ai Detailed Financial Report\n");
        csv.append("Report Type,").append(type.toUpperCase()).append("\n");
        csv.append("Generated,").append(LocalDate.now().format(DateTimeFormatter.ISO_DATE)).append("\n");
        csv.append("User,").append(user.getName()).append("\n\n");

        csv.append("FINANCIAL SUMMARY\n");
        csv.append("Metric,Value\n");
        csv.append("Total Income,Rs. ").append(formatNumber(payload.get("totalIncome"))).append("\n");
        csv.append("Total Expenses,Rs. ").append(formatNumber(payload.get("totalExpense"))).append("\n");
        csv.append("Net Worth,Rs. ").append(formatNumber(payload.get("netWorth"))).append("\n");
        csv.append("Cash Flow,Rs. ").append(formatNumber(payload.get("cashFlow"))).append("\n");
        csv.append("Stability Score,").append(payload.get("stabilityScore")).append("/100\n");
        csv.append("Shock Resistance Index,").append(formatNumber(payload.get("shockResistanceIndex"))).append(" months\n\n");

        // Income breakdown
        List<Income> incomes = incomeRepository.findByUserId(userId);
        csv.append("INCOME DETAILS\n");
        csv.append("Source,Amount,Date\n");
        for (Income inc : incomes) {
            csv.append(inc.getSource()).append(",Rs. ").append(formatNumber(inc.getAmount())).append(",").append(inc.getDateReceived()).append("\n");
        }
        csv.append("\n");

        // Expense breakdown
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        csv.append("EXPENSE DETAILS\n");
        csv.append("Category,Amount,Date,Description\n");
        for (Expense exp : expenses) {
            csv.append(exp.getCategory()).append(",Rs. ").append(formatNumber(exp.getAmount())).append(",").append(exp.getDateIncurred()).append(",").append(exp.getDescription() != null ? exp.getDescription() : "").append("\n");
        }
        csv.append("\n");

        // Asset breakdown
        List<Asset> assets = (List<Asset>) payload.get("assets");
        csv.append("ASSET DETAILS\n");
        csv.append("Name,Type,Value\n");
        for (Asset asset : assets) {
            csv.append(asset.getName()).append(",").append(asset.getType()).append(",Rs. ").append(formatNumber(asset.getValue())).append("\n");
        }
        csv.append("\n");

        // Liability breakdown
        List<Liability> liabilities = (List<Liability>) payload.get("liabilities");
        csv.append("LIABILITY DETAILS\n");
        csv.append("Name,Amount,Interest Rate\n");
        for (Liability lib : liabilities) {
            csv.append(lib.getName()).append(",Rs. ").append(formatNumber(lib.getAmount())).append(",").append(formatNumber(lib.getInterestRate())).append("%\n");
        }
        csv.append("\n");

        // Goal breakdown
        List<Goal> goals = (List<Goal>) payload.get("goals");
        csv.append("GOAL DETAILS\n");
        csv.append("Name,Target,Saved,Progress,Deadline\n");
        for (Goal goal : goals) {
            double pct = goal.getTargetAmount().doubleValue() > 0 ? (goal.getCurrentAmount().doubleValue() / goal.getTargetAmount().doubleValue()) * 100 : 0;
            csv.append(goal.getName()).append(",Rs. ").append(formatNumber(goal.getTargetAmount())).append(",Rs. ").append(formatNumber(goal.getCurrentAmount())).append(",").append(String.format("%.1f", pct)).append("%,").append(goal.getTargetDate()).append("\n");
        }
        csv.append("\n");

        // Recommendations
        List<Recommendation> recs = (List<Recommendation>) payload.get("recommendations");
        csv.append("AI RECOMMENDATIONS\n");
        csv.append("Type,Title,Description\n");
        for (Recommendation rec : recs) {
            csv.append(rec.getType()).append(",").append(rec.getTitle()).append(",").append(rec.getDescription()).append("\n");
        }
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=finguard-" + type.toLowerCase() + "-report.csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv.toString());
    }

    @GetMapping(value = "/{type}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Download a PDF smart financial report")
    public ResponseEntity<byte[]> pdf(@PathVariable String type, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long userId = userDetails.getId();
        User user = userRepository.findById(userId).orElseThrow();
        saveReport(type, "PDF", user);
        Map<String, Object> payload = reportPayload(userId);
        byte[] pdf = buildPdf(type, user, payload);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=finguard-" + type.toLowerCase() + "-report.pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }

    private Report saveReport(String type, String format, User user) {
        LocalDate now = LocalDate.now();
        Report report = Report.builder()
            .user(user)
            .generatedAt(now)
            .reportType(type.toUpperCase())
            .format(format.toUpperCase())
            .filePath("generated-in-api")
            .periodStart(now.minusMonths(type.equalsIgnoreCase("annual") ? 12 : type.equalsIgnoreCase("quarterly") ? 3 : 1).toString())
            .periodEnd(now.toString())
            .build();
        return reportRepository.save(report);
    }

    private Map<String, Object> reportPayload(Long userId) {
        double totalIncome = incomeRepository.findByUserId(userId).stream().mapToDouble(i -> i.getAmount().doubleValue()).sum();
        double totalExpense = expenseRepository.findByUserId(userId).stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();
        double totalAssets = assetRepository.findByUserId(userId).stream().mapToDouble(a -> a.getValue().doubleValue()).sum();
        double totalLiabilities = liabilityRepository.findByUserId(userId).stream().mapToDouble(l -> l.getAmount().doubleValue()).sum();
        FinancialScore score = financialScoreRepository.findTopByUserIdOrderByCalculatedAtDesc(userId).orElse(null);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("totalIncome", totalIncome);
        payload.put("totalExpense", totalExpense);
        payload.put("assets", assetRepository.findByUserId(userId));
        payload.put("liabilities", liabilityRepository.findByUserId(userId));
        payload.put("goals", goalRepository.findByUserId(userId));
        payload.put("netWorth", totalAssets - totalLiabilities);
        payload.put("cashFlow", totalIncome - totalExpense);
        payload.put("stabilityScore", score != null ? score.getStabilityScore() : 0);
        payload.put("shockResistanceIndex", score != null ? score.getShockResistanceIndex() : 0.0);
        payload.put("latestForecast", forecastRepository.findTopByUserIdOrderByGeneratedAtDesc(userId).orElse(null));
        payload.put("recommendations", recommendationRepository.findByUserIdOrderByGeneratedAtDesc(userId));
        return payload;
    }

    @SuppressWarnings("unchecked")
    private byte[] buildPdf(String type, User user, Map<String, Object> payload) {
        List<String> lines = new ArrayList<>();
        lines.add("FinGuard.ai - Smart Financial Report");
        lines.add(type.toUpperCase() + " REPORT");
        lines.add("Generated: " + LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        lines.add("User: " + user.getName() + " | Email: " + user.getEmail());
        lines.add("Employment: " + (user.getEmploymentType() != null ? user.getEmploymentType() : "N/A") + " | Family Size: " + (user.getFamilySize() != null ? user.getFamilySize() : "N/A"));
        lines.add("");
        lines.add("--- FINANCIAL SUMMARY ---");
        lines.add("Total Income:           Rs. " + formatNumber(payload.get("totalIncome")));
        lines.add("Total Expenses:         Rs. " + formatNumber(payload.get("totalExpense")));
        lines.add("Cash Flow (Surplus):    Rs. " + formatNumber(payload.get("cashFlow")));
        lines.add("Net Worth:              Rs. " + formatNumber(payload.get("netWorth")));
        lines.add("AI Stability Score:     " + payload.get("stabilityScore") + "/100");
        lines.add("Shock Resistance:       " + formatNumber(payload.get("shockResistanceIndex")) + " months");
        lines.add("");

        // Asset details
        List<Asset> assets = (List<Asset>) payload.get("assets");
        lines.add("--- ASSETS (" + assets.size() + ") ---");
        for (Asset a : assets) {
            lines.add("  " + a.getName() + " (" + a.getType() + "): Rs. " + formatNumber(a.getValue()));
        }
        lines.add("");

        // Liability details
        List<Liability> libs = (List<Liability>) payload.get("liabilities");
        lines.add("--- LIABILITIES (" + libs.size() + ") ---");
        for (Liability l : libs) {
            lines.add("  " + l.getName() + ": Rs. " + formatNumber(l.getAmount()) + " | Rate: " + formatNumber(l.getInterestRate()) + "%");
        }
        lines.add("");

        // Goal details
        List<Goal> goals = (List<Goal>) payload.get("goals");
        lines.add("--- GOALS (" + goals.size() + ") ---");
        for (Goal g : goals) {
            double pct = g.getTargetAmount().doubleValue() > 0 ? (g.getCurrentAmount().doubleValue() / g.getTargetAmount().doubleValue()) * 100 : 0;
            lines.add("  " + g.getName() + ": Rs. " + formatNumber(g.getCurrentAmount()) + " / Rs. " + formatNumber(g.getTargetAmount()) + " (" + String.format("%.1f", pct) + "%) | Due: " + g.getTargetDate());
        }
        lines.add("");

        // Recommendations
        List<Recommendation> recs = (List<Recommendation>) payload.get("recommendations");
        lines.add("--- AI RECOMMENDATIONS (" + recs.size() + ") ---");
        for (Recommendation r : recs) {
            lines.add("  [" + r.getType().toUpperCase() + "] " + r.getTitle());
            lines.add("    " + r.getDescription());
        }
        lines.add("");
        lines.add("--- AI INSIGHT ---");
        lines.add("This report is generated from your authenticated financial records");
        lines.add("and latest AI stability analysis outputs.");

        StringBuilder content = new StringBuilder();
        content.append("BT\n/F1 18 Tf\n50 790 Td\n");
        appendPdfLine(content, lines.get(0));
        content.append("/F1 11 Tf\n0 -24 Td\n");
        for (int i = 1; i < lines.size(); i++) {
            appendPdfLine(content, lines.get(i));
            content.append("0 -18 Td\n");
        }
        content.append("ET\n");

        byte[] stream = content.toString().getBytes(StandardCharsets.US_ASCII);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        List<Integer> offsets = new ArrayList<>();
        write(out, "%PDF-1.4\n");
        offsets.add(out.size());
        write(out, "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n");
        offsets.add(out.size());
        write(out, "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n");
        offsets.add(out.size());
        write(out, "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n");
        offsets.add(out.size());
        write(out, "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n");
        offsets.add(out.size());
        write(out, "5 0 obj << /Length " + stream.length + " >> stream\n");
        out.writeBytes(stream);
        write(out, "\nendstream endobj\n");
        int xref = out.size();
        write(out, "xref\n0 6\n0000000000 65535 f \n");
        for (Integer offset : offsets) {
            write(out, String.format("%010d 00000 n \n", offset));
        }
        write(out, "trailer << /Size 6 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF");
        return out.toByteArray();
    }

    private void appendPdfLine(StringBuilder content, String value) {
        content.append("(").append(escapePdfText(value)).append(") Tj\n");
    }

    private String escapePdfText(String value) {
        return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }

    private String formatNumber(Object value) {
        if (value == null || "null".equalsIgnoreCase(String.valueOf(value).trim()) || String.valueOf(value).trim().isEmpty()) {
            return "0.00";
        }
        try {
            return String.format("%.2f", Double.parseDouble(String.valueOf(value)));
        } catch (Exception e) {
            return "0.00";
        }
    }

    private void write(ByteArrayOutputStream out, String value) {
        out.writeBytes(value.getBytes(StandardCharsets.US_ASCII));
    }
}
