package com.backend.service;

import com.backend.dto.ApplicationSubmitRequest;
import com.backend.dto.ApplicationSubmitResponse;
import com.backend.dto.FormFieldSpec;
import com.backend.dto.FormSection;
import org.apache.jena.sparql.exec.http.UpdateExecHTTP;
import org.apache.jena.update.UpdateFactory;
import org.apache.jena.update.UpdateRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    private static final String RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

    @Value("${fuseki.update.endpoint}")
    private String updateEndpoint;

    @Value("${ontology.base-namespace}")
    private String ns;

    private final FormSchemaService formSchemaService;

    public ApplicationService(FormSchemaService formSchemaService) {
        this.formSchemaService = formSchemaService;
    }

    /**
     * Saves a submitted student form into the ontology (Fuseki via SPARQL UPDATE).
     *
     * Uses form-schema.yaml (via FormSchemaService) to determine for each property:
     *   - which individual it belongs to (entity: student / vkr)
     *   - how to write it (datatype → literal, object → URI)
     *   - triple direction (reversed: true → value is subject, entity is object)
     *
     * Always creates a Student individual.
     * Creates a VKR individual + student→защищает→vkr only when VKR fields are present.
     */
    public ApplicationSubmitResponse submit(ApplicationSubmitRequest req) {
        String uid        = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String studentUri = ns + "Студент_" + uid;
        String vkrUri     = ns + "ВКР_" + uid;

        Map<String, String> values = req.getValues();

        // Check if any VKR field has a value
        boolean hasVkr = formSchemaService.getSchema().getSections().stream()
                .flatMap(s -> s.getFields().stream())
                .filter(f -> "vkr".equals(f.getEntity()))
                .anyMatch(f -> hasValue(values, f.getPropUri()));

        StringBuilder sb = new StringBuilder("INSERT DATA {\n");

        // Student individual typed as the chosen degree
        appendUri(sb, studentUri, RDF_TYPE, ns + req.getDegree());

        // VKR individual + link from student
        if (hasVkr) {
            appendUri(sb, vkrUri, RDF_TYPE, ns + "ВКР");
            appendUri(sb, studentUri, ns + "защищает", vkrUri);
        }

        // Write each filled property according to schema metadata
        for (FormSection section : formSchemaService.getSchema().getSections()) {
            for (FormFieldSpec field : section.getFields()) {
                String val = values.get(field.getPropUri());
                if (val == null || val.isBlank()) continue;

                String entityUri = "student".equals(field.getEntity()) ? studentUri : vkrUri;

                if ("datatype".equals(field.getType())) {
                    appendLiteral(sb, entityUri, field.getPropUri(), val);
                } else {
                    if (field.isReversed()) {
                        // e.g. <supervisorUri> согласовывает <vkrUri>
                        appendUri(sb, val, field.getPropUri(), entityUri);
                    } else {
                        // e.g. <studentUri> на_НГУ_практике_у <supervisorUri>
                        appendUri(sb, entityUri, field.getPropUri(), val);
                    }
                }
            }
        }

        sb.append("}");
        String sparql = sb.toString();
        log.debug("SPARQL UPDATE:\n{}", sparql);

        UpdateRequest update = UpdateFactory.create(sparql);
        UpdateExecHTTP.newBuilder()
                .endpoint(updateEndpoint)
                .update(update)
                .build()
                .execute();

        log.info("Application saved: student={}, vkr={}", studentUri, hasVkr ? vkrUri : "—");
        return new ApplicationSubmitResponse(studentUri, hasVkr ? vkrUri : null, "SUBMITTED");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static boolean hasValue(Map<String, String> values, String propUri) {
        String v = values.get(propUri);
        return v != null && !v.isBlank();
    }

    private void appendUri(StringBuilder sb, String subject, String pred, String object) {
        sb.append("  <").append(subject).append("> ")
          .append("<").append(pred).append("> ")
          .append("<").append(object).append("> .\n");
    }

    private void appendLiteral(StringBuilder sb, String subject, String pred, String value) {
        sb.append("  <").append(subject).append("> ")
          .append("<").append(pred).append("> ")
          .append('"').append(escapeLiteral(value)).append("\"@ru .\n");
    }

    private String escapeLiteral(String v) {
        return v.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
