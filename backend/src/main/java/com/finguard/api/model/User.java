package com.finguard.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private Integer age;

    private Integer familySize;

    // JSON string storing marriage plan details (e.g., cost, targetYear)
    @Column(name = "marriage_info", columnDefinition = "TEXT")
    private String marriageInfo;

    // JSON string storing family settings (e.g. emergency months, education targets, other members)
    @Column(name = "family_info", columnDefinition = "TEXT")
    private String familyInfo;

    @Enumerated(EnumType.STRING)
    private EmploymentType employmentType;

    public enum EmploymentType {
        SALARIED, FREELANCER, BUSINESS_OWNER, SELF_EMPLOYED
    }
}
