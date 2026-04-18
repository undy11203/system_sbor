package com.backend.service;

import com.backend.dto.FormFieldSpec;
import com.backend.dto.FormSchema;
import com.backend.dto.FormSection;
import com.backend.entity.FormSchemaRecord;
import com.backend.repository.FormSchemaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

/**
 * Loads form schemas from the database.
 * On first startup, seeds the DB from YAML files if the table is empty.
 */
@Service
public class FormSchemaService {

    private static final Logger log = LoggerFactory.getLogger(FormSchemaService.class);

    private static final Map<String, String> SCHEMA_FILES = Map.of(
        "student",        "form-schema.yaml",
        "supervisor-ngu", "supervisor-ngu-schema.yaml"
    );

    private final FormSchemaRepository schemaRepo;
    private final ObjectMapper jsonMapper;

    public FormSchemaService(FormSchemaRepository schemaRepo) {
        this.schemaRepo = schemaRepo;
        this.jsonMapper = new ObjectMapper();
        this.jsonMapper.findAndRegisterModules();
    }

    @PostConstruct
    @Transactional
    public void init() throws IOException {
        ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
        yamlMapper.findAndRegisterModules();

        for (Map.Entry<String, String> entry : SCHEMA_FILES.entrySet()) {
            String type = entry.getKey();
            String file = entry.getValue();

            FormSchema schema = loadFromYaml(yamlMapper, file);
            expandUris(schema);
            String json = jsonMapper.writeValueAsString(schema);
            FormSchemaRecord record = schemaRepo.findById(type)
                    .orElse(new FormSchemaRecord(type, json));
            record.setSchemaJson(json);
            schemaRepo.save(record);
            log.info("Schema '{}' synced from {}", type, file);
        }
    }

    /** Returns schema for the given type. Throws if type is unknown. */
    @Transactional(readOnly = true)
    public FormSchema getSchema(String type) {
        FormSchemaRecord record = schemaRepo.findById(type)
                .orElseThrow(() -> new IllegalArgumentException("Unknown schema type: " + type));
        try {
            return jsonMapper.readValue(record.getSchemaJson(), FormSchema.class);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to deserialize schema: " + type, e);
        }
    }

    /** Convenience method for the default student schema. */
    public FormSchema getSchema() {
        return getSchema("student");
    }

    /** Returns all known schema type keys stored in the DB. */
    @Transactional(readOnly = true)
    public java.util.List<String> listTypes() {
        return schemaRepo.findAll().stream()
                .map(FormSchemaRecord::getType)
                .sorted()
                .toList();
    }

    /** Updates schema in DB (allows editing schema at runtime without redeploy). */
    @Transactional
    public void saveSchema(String type, FormSchema schema) throws IOException {
        expandUris(schema);
        String json = jsonMapper.writeValueAsString(schema);
        FormSchemaRecord record = schemaRepo.findById(type)
                .orElse(new FormSchemaRecord(type, json));
        record.setSchemaJson(json);
        schemaRepo.save(record);
        log.info("Schema '{}' updated in DB", type);
    }

    private FormSchema loadFromYaml(ObjectMapper yamlMapper, String file) throws IOException {
        ClassPathResource resource = new ClassPathResource(file);
        try (InputStream is = resource.getInputStream()) {
            FormSchema schema = yamlMapper.readValue(is, FormSchema.class);
            if (schema.getNamespace() == null || schema.getNamespace().isBlank()) {
                throw new IllegalStateException(file + ": 'namespace' field is required");
            }
            return schema;
        }
    }

    private void expandUris(FormSchema schema) {
        String ns = schema.getNamespace();
        for (FormSection section : schema.getSections()) {
            for (FormFieldSpec field : section.getFields()) {
                field.setPropUri(expand(ns, field.getProp()));
                if (field.getRange() != null && !field.getRange().isBlank()) {
                    field.setRangeUri(expand(ns, field.getRange()));
                }
            }
        }
    }

    private static String expand(String ns, String localName) {
        if (localName.startsWith("http://") || localName.startsWith("https://")) {
            return localName;
        }
        return ns + localName;
    }
}
