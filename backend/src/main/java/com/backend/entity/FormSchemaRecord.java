package com.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "form_schemas")
public class FormSchemaRecord {

    @Id
    @Column(nullable = false)
    private String type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String schemaJson;

    public FormSchemaRecord() {}

    public FormSchemaRecord(String type, String schemaJson) {
        this.type = type;
        this.schemaJson = schemaJson;
    }

    public String getType() { return type; }
    public String getSchemaJson() { return schemaJson; }
    public void setSchemaJson(String schemaJson) { this.schemaJson = schemaJson; }
}
