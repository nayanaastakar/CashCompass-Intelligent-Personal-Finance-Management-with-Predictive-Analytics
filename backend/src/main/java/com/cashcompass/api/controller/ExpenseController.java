package com.cashcompass.api.controller;

import com.cashcompass.api.model.Expense;
import com.cashcompass.api.security.UserDetailsImpl;
import com.cashcompass.api.service.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expense")
@RequiredArgsConstructor
@Tag(name = "Expenses", description = "Manage expense records")
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    @Operation(summary = "Get all expense records for the logged-in user")
    public ResponseEntity<List<Expense>> getAll(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(expenseService.getAllExpensesForUser(userDetails.getId()));
    }

    @PostMapping
    @Operation(summary = "Add a new expense record")
    public ResponseEntity<Expense> create(@RequestBody Expense expense, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(expenseService.addExpense(userDetails.getId(), expense));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an expense record")
    public ResponseEntity<Expense> update(@PathVariable Long id, @RequestBody Expense expense, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(expenseService.updateExpense(id, userDetails.getId(), expense));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an expense record")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        expenseService.deleteExpense(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
