package com.cashcompass.api.controller;

import com.cashcompass.api.model.Liability;
import com.cashcompass.api.repository.LiabilityRepository;
import com.cashcompass.api.repository.UserRepository;
import com.cashcompass.api.security.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/liability")
@RequiredArgsConstructor
@Tag(name = "Liabilities", description = "Manage user liabilities")
public class LiabilityController {

    private final LiabilityRepository liabilityRepository;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get all liabilities for the logged-in user")
    public ResponseEntity<List<Liability>> getAll(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(liabilityRepository.findByUserId(userDetails.getId()));
    }

    @PostMapping
    @Operation(summary = "Add a new liability")
    public ResponseEntity<Liability> create(@RequestBody Liability liability, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        liability.setUser(userRepository.findById(userDetails.getId()).orElseThrow());
        return ResponseEntity.ok(liabilityRepository.save(liability));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a liability")
    public ResponseEntity<Liability> update(@PathVariable Long id, @RequestBody Liability updated, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Liability liability = liabilityRepository.findById(id).orElseThrow();
        if (!liability.getUser().getId().equals(userDetails.getId())) {
            throw new RuntimeException("Liability does not belong to current user");
        }
        liability.setName(updated.getName());
        liability.setAmount(updated.getAmount());
        liability.setInterestRate(updated.getInterestRate());
        return ResponseEntity.ok(liabilityRepository.save(liability));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a liability")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Liability liability = liabilityRepository.findById(id).orElseThrow();
        if (!liability.getUser().getId().equals(userDetails.getId())) {
            throw new RuntimeException("Liability does not belong to current user");
        }
        liabilityRepository.delete(liability);
        return ResponseEntity.noContent().build();
    }
}
