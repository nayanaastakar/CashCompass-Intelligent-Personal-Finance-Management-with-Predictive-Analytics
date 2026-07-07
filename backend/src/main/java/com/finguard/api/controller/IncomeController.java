package com.finguard.api.controller;

import com.finguard.api.model.Income;
import com.finguard.api.security.UserDetailsImpl;
import com.finguard.api.service.IncomeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/income")
@RequiredArgsConstructor
@Tag(name = "Income", description = "Manage monthly income records")
public class IncomeController {

    private final IncomeService incomeService;

    @GetMapping
    @Operation(summary = "Get all income records for the logged-in user")
    public ResponseEntity<List<Income>> getAll(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(incomeService.getAllIncomesForUser(userDetails.getId()));
    }

    @PostMapping
    @Operation(summary = "Add a new income record")
    public ResponseEntity<Income> create(@RequestBody Income income, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(incomeService.addIncome(userDetails.getId(), income));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an income record")
    public ResponseEntity<Income> update(@PathVariable Long id, @RequestBody Income income, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(incomeService.updateIncome(id, userDetails.getId(), income));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an income record")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        incomeService.deleteIncome(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}