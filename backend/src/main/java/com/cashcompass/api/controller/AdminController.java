package com.cashcompass.api.controller;

import com.cashcompass.api.model.*;
import com.cashcompass.api.repository.*;
import com.cashcompass.api.security.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin utilities for export and diagnostics")
public class AdminController {

    private final UserRepository userRepository;
    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final AssetRepository assetRepository;
    private final LiabilityRepository liabilityRepository;
    private final GoalRepository goalRepository;

    @GetMapping("/export-seeds")
    @Operation(summary = "Export seeded data for backup or inspection (authenticated users)")
    public ResponseEntity<Map<String, Object>> exportSeeds(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Map<String, Object> out = new HashMap<>();
        List<User> users = userRepository.findAll();
        List<Income> incomes = incomeRepository.findAll();
        List<Expense> expenses = expenseRepository.findAll();
        List<Asset> assets = assetRepository.findAll();
        List<Liability> liabilities = liabilityRepository.findAll();
        List<Goal> goals = goalRepository.findAll();

        out.put("users", users);
        out.put("incomes", incomes);
        out.put("expenses", expenses);
        out.put("assets", assets);
        out.put("liabilities", liabilities);
        out.put("goals", goals);

        return ResponseEntity.ok(out);
    }
}
