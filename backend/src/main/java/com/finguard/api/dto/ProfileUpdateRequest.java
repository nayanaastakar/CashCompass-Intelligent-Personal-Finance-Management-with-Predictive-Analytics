package com.finguard.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProfileUpdateRequest {
    @NotBlank
    private String name;

    private Integer age;
    private Integer familySize;
    private String employmentType;
}
