package com.backend.dto;

import lombok.Data;

/**
 * A single form field definition loaded from form-schema.yaml.
 * After loading, {@code propUri} and {@code rangeUri} are expanded
 * from the short local name using the schema namespace.
 */
@Data
public class FormFieldSpec {

    /** Local name of the OWL property (as written in YAML), e.g. "ФИО" */
    private String prop;

    /** Full OWL property URI (set by FormSchemaService after loading) */
    private String propUri;

    /** Which individual this property describes: currently always "student" */
    private String entity;

    /** Input type: "datatype" (text) or "object" (individual reference) */
    private String type;

    /** Display label shown to the user */
    private String label;

    /** Whether the field is required */
    private boolean required;

    /**
     * When true, the submitted value of this field is used as the individual's
     * rdf:about local name (spaces removed), e.g. "Иванов Иван Иванович" → IvanovIvanIvanovich.
     */
    private boolean mainName;

    /** Optional hint text shown below the field */
    private String hint;

    /** Local name of the OWL range class (object type only), e.g. "Руководитель" */
    private String range;

    /** Full URI of the range class (set by FormSchemaService after loading) */
    private String rangeUri;

    /**
     * When true, the OWL triple direction is reversed:
     *   normal:   {@code <entityUri> <prop> <value>}
     *   reversed: {@code <value>     <prop> <entityUri>}
     *
     * Used for properties like "согласовывает" where the supervisor (value) is the subject.
     */
    private boolean reversed;
}
