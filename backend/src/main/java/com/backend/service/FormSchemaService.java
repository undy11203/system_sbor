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

/**
 * Loads form-schema.yaml from the classpath at startup,
 * expands local property names to full OWL URIs, and caches the result.
 */
@Service
public class FormSchemaService {

    private static final Logger log = LoggerFactory.getLogger(FormSchemaService.class);

    private static final String SCHEMA_PATH = "form-schema.yaml";

    private FormSchema schema;

    @PostConstruct
    public void init() throws IOException {
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        mapper.findAndRegisterModules();

        ClassPathResource resource = new ClassPathResource(SCHEMA_PATH);
        try (InputStream is = resource.getInputStream()) {
            schema = mapper.readValue(is, FormSchema.class);
        }

        String ns = schema.getNamespace();
        if (ns == null || ns.isBlank()) {
            throw new IllegalStateException("form-schema.yaml: 'namespace' field is required");
        }

        // Expand short local names to full URIs
        for (FormSection section : schema.getSections()) {
            for (FormFieldSpec field : section.getFields()) {
                field.setPropUri(expand(ns, field.getProp()));
                if (field.getRange() != null && !field.getRange().isBlank()) {
                    field.setRangeUri(expand(ns, field.getRange()));
                }
            }
        }

        int fieldCount = schema.getSections().stream()
                .mapToInt(s -> s.getFields().size()).sum();
        log.info("Form schema loaded: {} sections, {} fields", schema.getSections().size(), fieldCount);
    }

    public FormSchema getSchema() {
        return schema;
    }

    private static String expand(String ns, String localName) {
        // If already a full URI, return as-is
        if (localName.startsWith("http://") || localName.startsWith("https://")) {
            return localName;
        }
        return ns + localName;
    }
}
