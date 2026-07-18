package com.cashcompass.api.controller;

import com.cashcompass.api.model.Asset;
import com.cashcompass.api.repository.AssetRepository;
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
@RequestMapping("/api/asset")
@RequiredArgsConstructor
@Tag(name = "Assets", description = "Manage user assets")
public class AssetController {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get all assets for the logged-in user")
    public ResponseEntity<List<Asset>> getAll(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(assetRepository.findByUserId(userDetails.getId()));
    }

    @PostMapping
    @Operation(summary = "Add a new asset")
    public ResponseEntity<Asset> create(@RequestBody Asset asset, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        asset.setUser(userRepository.findById(userDetails.getId()).orElseThrow());
        return ResponseEntity.ok(assetRepository.save(asset));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an asset")
    public ResponseEntity<Asset> update(@PathVariable Long id, @RequestBody Asset updated, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Asset asset = assetRepository.findById(id).orElseThrow();
        if (!asset.getUser().getId().equals(userDetails.getId())) {
            throw new RuntimeException("Asset does not belong to current user");
        }
        asset.setName(updated.getName());
        asset.setValue(updated.getValue());
        asset.setType(updated.getType());
        return ResponseEntity.ok(assetRepository.save(asset));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an asset")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Asset asset = assetRepository.findById(id).orElseThrow();
        if (!asset.getUser().getId().equals(userDetails.getId())) {
            throw new RuntimeException("Asset does not belong to current user");
        }
        assetRepository.delete(asset);
        return ResponseEntity.noContent().build();
    }
}
