package com.backend.service;

import com.backend.dto.FormFieldSpec;
import com.backend.dto.FormSchema;
import com.backend.dto.FormSection;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Loads form schemas from YAML files at startup,
 * expands local property names to full OWL URIs, and caches the results.
 *
 * Schema types:
 *   "student"       → form-schema.yaml
 *   "supervisor-ngu" → supervisor-ngu-schema.yaml
 */
@Service
public class FormSchemaService {

    private static final Logger log = LoggerFactory.getLogger(FormSchemaService.class);

    private static final Map<String, String> SCHEMA_FILES = Map.of(
        "student",        "form-schema.yaml",
        "supervisor-ngu", "supervisor-ngu-schema.yaml"
    );

    private final Map<String, FormSchema> schemas = new LinkedHashMap<>();

    @PostConstruct
    public void init() throws IOException {
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        mapper.findAndRegisterModules();

        for (Map.Entry<String, String> entry : SCHEMA_FILES.entrySet()) {
            String type = entry.getKey();
            String file = entry.getValue();
            FormSchema schema = load(mapper, file);
            schemas.put(type, schema);
            int fieldCount = schema.getSections().stream()
                    .mapToInt(s -> s.getFields().size()).sum();
            log.info("Schema '{}' loaded from {}: {} sections, {} fields",
                    type, file, schema.getSections().size(), fieldCount);
        }
    }

    /** Returns schema for the given type. Throws if type is unknown. */
    public FormSchema getSchema(String type) {
        FormSchema schema = schemas.get(type);
        if (schema == null) {
            throw new IllegalArgumentException("Unknown schema type: " + type);
        }
        return schema;
    }

    /** Convenience method for the default student schema. */
    public FormSchema getSchema() {
        return getSchema("student");
    }

    private FormSchema load(ObjectMapper mapper, String file) throws IOException {
        ClassPathResource resource = new ClassPathResource(file);
        FormSchema schema;
        try (InputStream is = resource.getInputStream()) {
            schema = mapper.readValue(is, FormSchema.class);
        }
        String ns = schema.getNamespace();
        if (ns == null || ns.isBlank()) {
            throw new IllegalStateException(file + ": 'namespace' field is required");
        }
        for (FormSection section : schema.getSections()) {
            for (FormFieldSpec field : section.getFields()) {
                field.setPropUri(expand(ns, field.getProp()));
                if (field.getRange() != null && !field.getRange().isBlank()) {
                    field.setRangeUri(expand(ns, field.getRange()));
                }
            }
        }
        return schema;
    }

    private static String expand(String ns, String localName) {
        if (localName.startsWith("http://") || localName.startsWith("https://")) {
            return localName;
        }
        return ns + localName;
    }
}
