package com.backend.service;

import com.backend.dto.ApplicationSubmitRequest;
import com.backend.dto.ApplicationSubmitResponse;
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

    /**
     * Saves a submitted student form into the ontology (Fuseki via SPARQL UPDATE).
     *
     * Creates two individuals:
     *   1. Student individual (typed as Бакалавриат or Магистратура) with all filled properties.
     *   2. VKR individual (typed as ВКР) — only if any VKR fields were filled.
     *
     * Returns URIs of created individuals and "SUBMITTED" status.
     */
    public ApplicationSubmitResponse submit(ApplicationSubmitRequest req) {
        String uid = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String studentUri = ns + "Студент_" + uid;
        String vkrUri     = ns + "ВКР_" + uid;

        boolean hasVkr = req.getVkrDatatype().values().stream().anyMatch(v -> v != null && !v.isBlank())
                      || req.getVkrObject().values().stream().anyMatch(v -> v != null && !v.isBlank());

        StringBuilder sb = new StringBuilder("INSERT DATA {\n");

        // ── Student individual ────────────────────────────────────────────────
        appendUri(sb, studentUri, RDF_TYPE, ns + req.getDegree());

        for (Map.Entry<String, String> e : req.getStudentDatatype().entrySet()) {
            if (e.getValue() != null && !e.getValue().isBlank()) {
                appendLiteral(sb, studentUri, e.getKey(), e.getValue());
            }
        }
        for (Map.Entry<String, String> e : req.getStudentObject().entrySet()) {
            if (e.getValue() != null && !e.getValue().isBlank()) {
                appendUri(sb, studentUri, e.getKey(), e.getValue());
            }
        }

        // ── VKR individual ────────────────────────────────────────────────────
        if (hasVkr) {
            appendUri(sb, vkrUri, RDF_TYPE, ns + "ВКР");

            for (Map.Entry<String, String> e : req.getVkrDatatype().entrySet()) {
                if (e.getValue() != null && !e.getValue().isBlank()) {
                    appendLiteral(sb, vkrUri, e.getKey(), e.getValue());
                }
            }
            for (Map.Entry<String, String> e : req.getVkrObject().entrySet()) {
                if (e.getValue() != null && !e.getValue().isBlank()) {
                    appendUri(sb, vkrUri, e.getKey(), e.getValue());
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
