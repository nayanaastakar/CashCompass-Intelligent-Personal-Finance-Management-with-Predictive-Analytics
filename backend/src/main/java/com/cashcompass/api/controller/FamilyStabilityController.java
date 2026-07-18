package com.cashcompass.api.controller;

import com.cashcompass.api.dto.FamilyStabilityDto;
import com.cashcompass.api.service.FamilyStabilityService;
import com.cashcompass.api.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/family")
public class FamilyStabilityController {

    @Autowired
    private FamilyStabilityService familyStabilityService;

    @Autowired
    private com.cashcompass.api.repository.UserRepository userRepository;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper mapper;

    // Simple endpoint: GET /api/family/stability/{userId}
    @GetMapping("/stability/{userId}")
    public ResponseEntity<FamilyStabilityDto> getFamilyStability(@PathVariable Long userId) {
        FamilyStabilityDto dto = familyStabilityService.getFamilyStability(userId);
        return ResponseEntity.ok(dto);
    }

    // POST /api/family/marriage/{userId} to save marriage target details
    @org.springframework.web.bind.annotation.PostMapping("/marriage/{userId}")
    public ResponseEntity<?> updateMarriagePlan(@PathVariable Long userId, @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> payload) {
        User user = userRepository.findById(userId).orElseThrow();
        try {
            String json = mapper.writeValueAsString(payload);
            user.setMarriageInfo(json);
            userRepository.save(user);
            return ResponseEntity.ok(java.util.Map.of("message", "Marriage plan updated successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Failed to save marriage data"));
        }
    }

    // POST /api/family/settings/{userId} to save emergency/child/income custom settings
    @org.springframework.web.bind.annotation.PostMapping("/settings/{userId}")
    public ResponseEntity<?> updateFamilySettings(@PathVariable Long userId, @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> payload) {
        User user = userRepository.findById(userId).orElseThrow();
        try {
            String json = mapper.writeValueAsString(payload);
            user.setFamilyInfo(json);
            userRepository.save(user);
            return ResponseEntity.ok(java.util.Map.of("message", "Family settings updated successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Failed to save family settings"));
        }
    }
}
