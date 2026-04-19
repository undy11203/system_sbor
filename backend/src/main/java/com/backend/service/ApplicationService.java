package com.backend.service;

import com.backend.dto.ApplicationSubmitRequest;
import com.backend.dto.ApplicationSubmitResponse;
import com.backend.dto.EntryData;
import com.backend.dto.FormFieldSpec;
import com.backend.dto.FormSection;
import com.backend.entity.StudentSubmission;
import com.backend.repository.StudentSubmissionRepository;
import org.apache.jena.sparql.exec.http.UpdateExecHTTP;
import org.apache.jena.update.UpdateFactory;
import org.apache.jena.update.UpdateRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
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
    private final OntologyService ontologyService;
    private final DocumentFillService documentFillService;
    private final EmailService emailService;
    private final TaskScheduler taskScheduler;
    private final StudentSubmissionRepository submissionRepo;

    public ApplicationService(FormSchemaService formSchemaService,
                               OntologyService ontologyService,
                               DocumentFillService documentFillService,
                               EmailService emailService,
                               TaskScheduler taskScheduler,
                               StudentSubmissionRepository submissionRepo) {
        this.formSchemaService = formSchemaService;
        this.ontologyService = ontologyService;
        this.documentFillService = documentFillService;
        this.emailService = emailService;
        this.taskScheduler = taskScheduler;
        this.submissionRepo = submissionRepo;
    }

    /** Returns all individuals of the entity class defined by the schema, with their main name. */
    public java.util.List<java.util.Map<String, String>> listEntries(String schemaType) {
        var schema = formSchemaService.getSchema(schemaType);
        String fioUri = ns + "ФИО";

        if ("student".equals(schemaType)) {
            return ontologyService.listStudents(ns,
                    java.util.List.of("Бакалавриат", "Магистратура"), fioUri);
        }

        String classUri = ns + classForSchema(schemaType);
        String mainNamePropUri = schema.getSections().stream()
                .flatMap(s -> s.getFields().stream())
                .filter(FormFieldSpec::isMainName)
                .map(FormFieldSpec::getPropUri)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Schema " + schemaType + " has no mainName field"));
        return ontologyService.listIndividuals(classUri, mainNamePropUri);
    }

    /**
     * Returns current property values and display labels for the given individual.
     * values: propUri → literal or object URI (used for submission)
     * labels: propUri → human-readable name (only for object fields, used for display)
     */
    public EntryData getEntry(String individualUri, String schemaType) {
        var schema = formSchemaService.getSchema(schemaType);
        java.util.Map<String, String> values = new java.util.LinkedHashMap<>();
        java.util.Map<String, String> labels = new java.util.LinkedHashMap<>();
        String fioUri = ns + "ФИО";

        for (FormSection section : schema.getSections()) {
            for (FormFieldSpec field : section.getFields()) {
                if ("datatype".equals(field.getType())) {
                    String val = ontologyService.getLiteralValue(individualUri, field.getPropUri());
                    if (val != null) values.put(field.getPropUri(), val);
                } else {
                    String objUri = ontologyService.getObjectValue(
                            individualUri, field.getPropUri(), field.isReversed());
                    if (objUri != null) {
                        values.put(field.getPropUri(), objUri);
                        String label = ontologyService.getLiteralValue(objUri, fioUri);
                        if (label != null) labels.put(field.getPropUri(), label);
                    }
                }
            }
        }
        return new EntryData(values, labels);
    }

    /**
     * Replaces all property values for an existing individual (datatype + object fields).
     * Uses SPARQL DELETE { } WHERE { } ; INSERT DATA { } to overwrite old values.
     */
    public void updateEntry(String individualUri, ApplicationSubmitRequest req, String schemaType) {
        var schema = formSchemaService.getSchema(schemaType);
        java.util.List<FormFieldSpec> allFields = schema.getSections().stream()
                .flatMap(s -> s.getFields().stream())
                .toList();

        StringBuilder deletePatterns = new StringBuilder();
        StringBuilder optionals = new StringBuilder();
        StringBuilder insertData = new StringBuilder();
        int i = 0;

        for (FormFieldSpec field : allFields) {
            String alias = "?v" + i++;
            String val = req.getValues().get(field.getPropUri());

            if ("datatype".equals(field.getType())) {
                deletePatterns.append("  <").append(individualUri).append("> <")
                        .append(field.getPropUri()).append("> ").append(alias).append(" .\n");
                optionals.append("  OPTIONAL { <").append(individualUri).append("> <")
                        .append(field.getPropUri()).append("> ").append(alias).append(" }\n");
                if (val != null && !val.isBlank()) {
                    appendLiteral(insertData, individualUri, field.getPropUri(), val);
                }
            } else {
                // object field — triple direction depends on reversed flag
                if (field.isReversed()) {
                    deletePatterns.append("  ").append(alias).append(" <")
                            .append(field.getPropUri()).append("> <").append(individualUri).append("> .\n");
                    optionals.append("  OPTIONAL { ").append(alias).append(" <")
                            .append(field.getPropUri()).append("> <").append(individualUri).append("> }\n");
                    if (val != null && !val.isBlank()) {
                        appendUri(insertData, val, field.getPropUri(), individualUri);
                    }
                } else {
                    deletePatterns.append("  <").append(individualUri).append("> <")
                            .append(field.getPropUri()).append("> ").append(alias).append(" .\n");
                    optionals.append("  OPTIONAL { <").append(individualUri).append("> <")
                            .append(field.getPropUri()).append("> ").append(alias).append(" }\n");
                    if (val != null && !val.isBlank()) {
                        appendUri(insertData, individualUri, field.getPropUri(), val);
                    }
                }
            }
        }

        String sparql = "DELETE {\n" + deletePatterns + "}\nWHERE {\n" + optionals + "} ;\n"
                + "INSERT DATA {\n" + insertData + "}";
        log.debug("SPARQL UPDATE (update):\n{}", sparql);

        UpdateRequest update = UpdateFactory.create(sparql);
        UpdateExecHTTP.newBuilder().endpoint(updateEndpoint).update(update).build().execute();
        log.info("Entry updated: uri={}", individualUri);
    }

    private String classForSchema(String schemaType) {
        return switch (schemaType) {
            case "supervisor-ngu" -> "Руководитель_от_НГУ";
            default -> throw new IllegalArgumentException("listEntries not supported for schema: " + schemaType);
        };
    }

    /**
     * Saves a submitted student form into the ontology (Fuseki via SPARQL UPDATE).
     *
     * Uses form-schema.yaml (via FormSchemaService) to determine for each property:
     *   - how to write it (datatype → literal, object → URI)
     *   - triple direction (reversed: true → value is subject, entity is object)
     *
     * The individual's URI local name is taken from the field marked mainName: true in the schema
     * (spaces removed). Falls back to a random suffix if that field has no value.
     */
    public ApplicationSubmitResponse submitStudent(ApplicationSubmitRequest req, String schemaType, String studentEmail) {
        Map<String, String> values = req.getValues();
        var schema = formSchemaService.getSchema(schemaType);

        // Determine individual local name from the mainName field
        String localName = schema.getSections().stream()
                .flatMap(s -> s.getFields().stream())
                .filter(FormFieldSpec::isMainName)
                .map(f -> values.get(f.getPropUri()))
                .filter(v -> v != null && !v.isBlank())
                .map(v -> v.replace(" ", ""))
                .findFirst()
                .orElseGet(() -> UUID.randomUUID().toString().replace("-", "").substring(0, 8));

        String studentUri = ns + localName;

        StringBuilder sb = new StringBuilder("INSERT DATA {\n");

        // Student individual typed as the chosen degree
        appendUri(sb, studentUri, RDF_TYPE, ns + req.getDegree());

        // Write each filled property according to schema metadata
        for (FormSection section : schema.getSections()) {
            for (FormFieldSpec field : section.getFields()) {
                String val = values.get(field.getPropUri());
                if (val == null || val.isBlank()) continue;

                if ("datatype".equals(field.getType())) {
                    appendLiteral(sb, studentUri, field.getPropUri(), val);
                } else {
                    if (field.isReversed()) {
                        appendUri(sb, val, field.getPropUri(), studentUri);
                    } else {
                        // e.g. <studentUri> на_НГУ_практике_у <supervisorUri>
                        appendUri(sb, studentUri, field.getPropUri(), val);
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

        log.info("Application saved: uri={}", studentUri);

        if (!"student".equals(schemaType)) {
            return new ApplicationSubmitResponse(studentUri, "SUBMITTED");
        }

        // Save submission record in DB
        submissionRepo.save(new StudentSubmission(studentUri, studentEmail));

        // Generate documents, email to student and supervisor
        final String finalStudentUri = studentUri;
        try {
            byte[] zip = documentFillService.generateZip(finalStudentUri);

            // Send to student
            emailService.sendDocuments(studentEmail, zip);
            log.info("Documents sent to student {}", studentEmail);

            // Send to NGU supervisor if they have an email
            Map<String, String> studentVars = documentFillService.fetchStudentVars(finalStudentUri);
            String supervisorEmail = studentVars.getOrDefault("на_НГУ_практике_у/Электронная_почта", "");
            String studentName = studentVars.getOrDefault("ФИО", finalStudentUri);
            if (!supervisorEmail.isBlank()) {
                emailService.sendDocumentsToSupervisor(supervisorEmail, studentName, zip);
                log.info("Documents sent to supervisor {}", supervisorEmail);
            } else {
                log.info("Supervisor email not set for student {}, skipping supervisor notification", finalStudentUri);
            }
        } catch (Exception e) {
            log.error("Failed to generate/send documents for {}: {}", finalStudentUri, e.getMessage(), e);
        }

        // Schedule reminders every 3 days, stop when status becomes RECEIVED
        scheduleReminders(studentUri, studentEmail, 1);

        return new ApplicationSubmitResponse(studentUri, "SUBMITTED");
    }

    private static final int MAX_REMINDERS = 5;
    private static final long REMINDER_INTERVAL_DAYS = 3;

    private void scheduleReminders(String studentUri, String email, int attempt) {
        if (attempt > MAX_REMINDERS) return;
        taskScheduler.schedule(() -> {
            submissionRepo.findById(studentUri).ifPresent(sub -> {
                if (sub.getStatus() == StudentSubmission.Status.RECEIVED) {
                    log.info("Reminder skipped — already received: {}", studentUri);
                    return;
                }
                try {
                    emailService.sendReminder(email, attempt);
                    log.info("Reminder #{} sent to {}", attempt, email);
                } catch (Exception e) {
                    log.error("Reminder #{} failed for {}: {}", attempt, email, e.getMessage());
                }
                scheduleReminders(studentUri, email, attempt + 1);
            });
        }, Instant.now().plusSeconds(REMINDER_INTERVAL_DAYS * 24 * 3600));
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
