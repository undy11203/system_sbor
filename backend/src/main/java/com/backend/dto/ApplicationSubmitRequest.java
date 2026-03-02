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

    /**
     * Flat map of all filled form values: full OWL property URI → value.
     * For datatype properties the value is a literal string.
     * For object properties the value is an individual URI.
     * The service uses the form schema to determine how each property is written.
     */
    private Map<String, String> values = new HashMap<>();
}
