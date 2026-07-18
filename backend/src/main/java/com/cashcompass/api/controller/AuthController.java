package com.cashcompass.api.controller;

import com.cashcompass.api.dto.JwtResponse;
import com.cashcompass.api.dto.LoginRequest;
import com.cashcompass.api.dto.MessageResponse;
import com.cashcompass.api.dto.SignupRequest;
import com.cashcompass.api.model.User;
import com.cashcompass.api.repository.UserRepository;
import com.cashcompass.api.security.JwtUtils;
import com.cashcompass.api.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();

        return ResponseEntity.ok(toJwtResponse(jwt, user));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        String name = signUpRequest.getName();
        if (name == null || name.isBlank()) {
            name = signUpRequest.getEmail().split("@")[0];
        }

        User user = User.builder()
                .name(name)
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .age(signUpRequest.getAge())
                .familySize(signUpRequest.getFamilySize())
                .employmentType(signUpRequest.getEmploymentType() != null ? User.EmploymentType.valueOf(signUpRequest.getEmploymentType()) : null)
                .build();

        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @GetMapping("/profile")
    public ResponseEntity<JwtResponse> profile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        return ResponseEntity.ok(toJwtResponse(null, user));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetailsImpl userDetails, @Valid @RequestBody com.cashcompass.api.dto.ProfileUpdateRequest updateRequest) {
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        
        user.setName(updateRequest.getName());
        user.setAge(updateRequest.getAge());
        user.setFamilySize(updateRequest.getFamilySize());
        if (updateRequest.getEmploymentType() != null && !updateRequest.getEmploymentType().isBlank()) {
            user.setEmploymentType(User.EmploymentType.valueOf(updateRequest.getEmploymentType()));
        } else {
            user.setEmploymentType(null);
        }
        
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Profile updated successfully!"));
    }

    private JwtResponse toJwtResponse(String jwt, User user) {
        return new JwtResponse(
                jwt,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAge(),
                user.getFamilySize(),
                user.getEmploymentType() != null ? user.getEmploymentType().name() : null);
    }
}
