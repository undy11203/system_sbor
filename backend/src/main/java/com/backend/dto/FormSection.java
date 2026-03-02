package com.backend.dto;

import lombok.Data;

import java.util.List;

/** A named group of form fields. */
@Data
public class FormSection {
    private String title;
    private List<FormFieldSpec> fields;
}
