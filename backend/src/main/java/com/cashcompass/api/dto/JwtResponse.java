package com.cashcompass.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private Long id;
    private String name;
    private String email;
    private Integer age;
    private Integer familySize;
    private String employmentType;
}
