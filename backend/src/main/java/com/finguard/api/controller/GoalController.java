package com.finguard.api.controller;

import com.finguard.api.model.Goal;
import com.finguard.api.security.UserDetailsImpl;
import com.finguard.api.service.GoalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goal")
@RequiredArgsConstructor
@Tag(name = "Goals", description = "Manage financial goals")
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    @Operation(summary = "Get all goals for the logged-in user")
    public ResponseEntity<List<Goal>> getAll(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(goalService.getAllGoalsForUser(userDetails.getId()));
    }

    @PostMapping
    @Operation(summary = "Create a financial goal")
    public ResponseEntity<Goal> create(@RequestBody Goal goal, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(goalService.addGoal(userDetails.getId(), goal));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a financial goal")
    public ResponseEntity<Goal> update(@PathVariable Long id, @RequestBody Goal goal, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(goalService.updateGoal(id, userDetails.getId(), goal));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a financial goal")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        goalService.deleteGoal(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}