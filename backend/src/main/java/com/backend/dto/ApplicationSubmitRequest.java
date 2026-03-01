package com.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class ApplicationSubmitRequest {

    /** Degree class local name: "Бакалавриат" or "Магистратура" */
    @NotBlank
    private String degree;

    /** Student DatatypeProperty values: full prop URI → literal value */
    private Map<String, String> studentDatatype = new HashMap<>();

    /** Student ObjectProperty values: full prop URI → individual URI */
    private Map<String, String> studentObject = new HashMap<>();

    /** VKR DatatypeProperty values: full prop URI → literal value */
    private Map<String, String> vkrDatatype = new HashMap<>();

    /** VKR ObjectProperty values: full prop URI → individual URI */
    private Map<String, String> vkrObject = new HashMap<>();
}
