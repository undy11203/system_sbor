package com.backend.dto;

import lombok.Data;

import java.util.List;

/** Top-level form schema loaded from form-schema.yaml. */
@Data
public class FormSchema {
    private String namespace;
    private List<FormSection> sections;
}
