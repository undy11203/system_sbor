package com.backend.service;

import com.github.petrovich4j.Case;
import com.github.petrovich4j.Gender;
import com.github.petrovich4j.NameType;
import com.github.petrovich4j.Petrovich;
import org.apache.jena.query.*;
import org.apache.jena.sparql.exec.http.QueryExecutionHTTP;
import org.apache.poi.xwpf.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Fetches student data from Fuseki and fills DOCX templates using Apache POI.
 * All templates are stored in backend/src/main/resources/templates/.
 * No external library dependency for generation.
 */
@Service
public class DocumentFillService {

    private static final Logger log = LoggerFactory.getLogger(DocumentFillService.class);

    private static final String NS = "http://www.semanticweb.org/oleyn/ontologies/2022/4/кафедра#";

    // ── Template registry: degree dir → list of template filenames ────────────
    private static final Map<String, List<String>> TEMPLATE_REGISTRY = Map.of(
        "bachelors/4th_course", List.of(
            "Прил 1_ИЗ на практику_Бакалавриат_ПИиКН_8 семестр.docx",
            "Прил 2_Отчет о практике_Бакалавриат_ПииКН_8 семестр.docx",
            "Прил 3_Отзыв руководителя практики_Бакалавриат_ПИиКН_8 семестр.docx",
            "Прил 4_Заявление на практику_Бакалавриат_ПИиКН_8 семестр.docx",
            "09.03.01_PliKN_VKR_otzyv.docx",
            "09.03.01_PIiKN_VKR_otzyv_2.docx",
            "09.03.01_PIiKN_VKR_recenziya.docx"
        ),
        "masters/2nd_course/mda", List.of(
            "Прил 1_ИЗ на практику_Магистратура_КМиАД_4 сем.docx",
            "Прил 2_Отчет о практике_Магистратура_КМиАД_4 сем.docx",
            "Прил 3_Отзыв руководителя_Магистратура_КМиАД_4 сем.docx",
            "Прил 4_Заявление на практику_Магистратура_КМиАД_4 сем.docx",
            "09.04.01_KMiAD_VKR_otzyv.docx",
            "09.04.01_KMiAD_VKR_otzyv_2.docx",
            "09.04.01_KMiAD_VKR_recenziya.docx"
        ),
        "masters/2nd_course/tprs", List.of(
            "Прил 1_ИЗ на практику_Магистратура_ТРПС_4 сем.docx",
            "Прил 2_Отчет о практике_Магистратура_ТРПС_4 сем.docx",
            "Прил 3_Отзыв руководителя практики_Магистратура_ТРПС_4 сем.docx",
            "Прил 4_Заявление на практику_Магистратура_ТРПС_4 сем.docx",
            "09.04.01_TRPS_VKR_otzyv.docx",
            "09.04.01_TRPS_VKR_otzyv_2.docx",
            "09.04.01_TRPS_VKR_recenziya.docx"
        )
    );

    @Value("${fuseki.sparql.endpoint}")
    private String sparqlEndpoint;

    private final Petrovich petrovich = new Petrovich();

    // ── public API ────────────────────────────────────────────────────────────

    /**
     * Generates all templates for the student, returns a ZIP archive.
     */
    public byte[] generateZip(String studentUri) throws IOException {
        Map<String, String> vars = fetchStudentVars(studentUri);
        if (vars.isEmpty()) {
            throw new IllegalArgumentException("Student not found or has no data: " + studentUri);
        }

        String degreeClass = fetchDegreeClass(studentUri);
        String templateDir = resolveTemplateDir(degreeClass, vars.getOrDefault("Профиль_обучения", ""));
        log.info("Student vars fetched: {}", vars);
        Map<String, String> placeholders = buildReplacements(vars);
        log.info("Placeholders keys: {}", placeholders.keySet());

        List<String> templates = TEMPLATE_REGISTRY.getOrDefault(templateDir, List.of());
        ByteArrayOutputStream zipBuffer = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(zipBuffer)) {
            for (String filename : templates) {
                String resourcePath = "/templates/" + templateDir + "/" + filename;
                try (InputStream is = getClass().getResourceAsStream(resourcePath)) {
                    if (is == null) {
                        log.warn("Template not found on classpath: {}", resourcePath);
                        continue;
                    }
                    byte[] filled = fillDocx(is, placeholders);
                    String studentPrefix = vars.getOrDefault("ФИО", "").replace(" ", "_");
                    String outName = studentPrefix.isBlank() ? filename : studentPrefix + "_" + filename;
                    zos.putNextEntry(new ZipEntry(outName));
                    zos.write(filled);
                    zos.closeEntry();
                    log.debug("Filled template: {}", outName);
                }
            }
        }
        log.info("ZIP built for uri={}, {} templates, size={}", studentUri, templates.size(), zipBuffer.size());
        return zipBuffer.toByteArray();
    }

    /**
     * Returns the NGU supervisor email from fetched vars, or empty string if not set.
     */
    public String getSupervisorEmail(String studentUri) {
        Map<String, String> vars = fetchStudentVars(studentUri);
        return vars.getOrDefault("на_НГУ_практике_у/Электронная_почта", "");
    }

    // ── SPARQL data fetching ──────────────────────────────────────────────────

    /**
     * Fetches all data for the student using two generic SPARQL queries.
     *
     * Result keys:
     *   Direct literals  → local property name, e.g. "ФИО", "группа"
     *   2-hop literals   → "objectProp/relProp",  e.g. "на_НГУ_практике_у/ФИО"
     *
     * Adding a new field to the form schema automatically makes it available here
     * without any backend changes.
     */
    public Map<String, String> fetchStudentVars(String studentUri) {
        Map<String, String> vars = new LinkedHashMap<>();

        // Query 1: all direct literal properties
        String q1 = "SELECT ?p ?v WHERE { <" + studentUri + "> ?p ?v . FILTER(isLiteral(?v)) }";
        try (QueryExecution qe = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint).query(q1).build()) {
            ResultSet rs = qe.execSelect();
            while (rs.hasNext()) {
                QuerySolution sol = rs.nextSolution();
                vars.put(localName(sol.getResource("p").getURI()),
                         sol.getLiteral("v").getString());
            }
        } catch (Exception e) {
            log.error("Failed to fetch direct properties for {}: {}", studentUri, e.getMessage());
        }

        // Query 2: all 2-hop literal properties via object relations
        String q2 = """
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            SELECT ?op ?rp ?v WHERE {
                <%s> ?op ?rel .
                ?rel ?rp ?v .
                FILTER(isLiteral(?v))
                FILTER(?op != rdf:type && ?op != owl:sameAs)
            }""".formatted(studentUri);
        try (QueryExecution qe = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint).query(q2).build()) {
            ResultSet rs = qe.execSelect();
            while (rs.hasNext()) {
                QuerySolution sol = rs.nextSolution();
                String key = localName(sol.getResource("op").getURI())
                           + "/" + localName(sol.getResource("rp").getURI());
                vars.put(key, sol.getLiteral("v").getString());
            }
        } catch (Exception e) {
            log.error("Failed to fetch related properties for {}: {}", studentUri, e.getMessage());
        }

        return vars;
    }

    private static String localName(String uri) {
        int i = Math.max(uri.lastIndexOf('#'), uri.lastIndexOf('/'));
        return uri.substring(i + 1);
    }

    private String fetchDegreeClass(String studentUri) {
        String query = """
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            SELECT ?cls WHERE {
                <%s> rdf:type ?cls .
                FILTER(?cls != owl:NamedIndividual)
            }
            """.formatted(studentUri);
        try (QueryExecution qe = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint).query(query).build()) {
            ResultSet rs = qe.execSelect();
            while (rs.hasNext()) {
                String uri = rs.nextSolution().getResource("cls").getURI();
                String local = uri.substring(uri.lastIndexOf('#') + 1);
                if (local.equals("Бакалавриат") || local.equals("Магистратура")) return local;
            }
        } catch (Exception e) {
            log.warn("Could not determine degree class for {}: {}", studentUri, e.getMessage());
        }
        return "Бакалавриат";
    }

    private String resolveTemplateDir(String degreeClass, String profile) {
        if ("Бакалавриат".equals(degreeClass)) return "bachelors/4th_course";
        String p = profile.toLowerCase();
        if (p.contains("модел") || p.contains("мда") || p.contains("кмиад")) return "masters/2nd_course/mda";
        return "masters/2nd_course/tprs";
    }

    // ── placeholder map ───────────────────────────────────────────────────────

    /**
     * Builds replacement map from SPARQL result vars using "varname:transform" format.
     *
     * Each var produces:
     *   "varname:"        → plain value
     *   "varname:род"     → genitive declension  (fields starting with "фио")
     *   "varname:обучРод" → "Обучающегося/ей"    (fields starting with "фио")
     *   "varname:обучИм"  → "Обучающийся/аяся"   (fields starting with "фио")
     *   "varname:форма"   → "студенту/студентке"  (fields starting with "фио")
     *
     * DOCX templates must use these placeholders (e.g. фио_студента:род).
     */
    private Map<String, String> buildReplacements(Map<String, String> vars) {
        // Sort longest keys first so "ФИО:обучРод" is replaced before "ФИО:"
        Map<String, String> p = new TreeMap<>(
                Comparator.comparingInt(String::length).reversed().thenComparing(Comparator.naturalOrder()));
        for (Map.Entry<String, String> e : vars.entrySet()) {
            String var = e.getKey();
            String val = e.getValue();
            if (val == null || val.isBlank()) continue;

            p.put(var + ":", val);

            if (var.equals("ФИО") || var.endsWith("/ФИО")) {
                p.put(var + ":род",     declineFio(val, Case.Genitive));
                p.put(var + ":обучРод", genderObuchRod(val));
                p.put(var + ":обучИм",  genderObuchIm(val));
                p.put(var + ":форма",   genderForm(val));
            }
        }
        return p;
    }

    // ── Petrovich name declension ─────────────────────────────────────────────

    private String declineFio(String fio, Case wordCase) {
        String[] parts = fio.trim().split("\\s+");
        if (parts.length != 3) return fio;
        try {
            Gender gender = petrovich.gender(parts[2], Gender.Both);
            String last  = petrovich.say(parts[0], NameType.LastName,       gender, wordCase);
            String first = petrovich.say(parts[1], NameType.FirstName,      gender, wordCase);
            String patr  = petrovich.say(parts[2], NameType.PatronymicName, gender, wordCase);
            return last + " " + first + " " + patr;
        } catch (Exception e) {
            log.warn("Could not decline name '{}': {}", fio, e.getMessage());
            return fio;
        }
    }

    private String genderObuchRod(String fio) {
        return isFemale(fio) ? "Обучающейся" : "Обучающегося";
    }

    private String genderObuchIm(String fio) {
        return isFemale(fio) ? "Обучающаяся" : "Обучающийся";
    }

    private String genderForm(String fio) {
        return isFemale(fio) ? "студентке" : "студенту";
    }

    private boolean isFemale(String fio) {
        String[] parts = fio.trim().split("\\s+");
        if (parts.length < 3) return false;
        return petrovich.gender(parts[2], Gender.Both) == Gender.Female;
    }

    // ── DOCX filling ──────────────────────────────────────────────────────────

    private byte[] fillDocx(InputStream templateStream, Map<String, String> replacements)
            throws IOException {
        try (XWPFDocument doc = new XWPFDocument(templateStream)) {
            for (XWPFParagraph para : doc.getParagraphs()) {
                replaceParagraph(para, replacements);
            }
            for (XWPFTable table : doc.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        for (XWPFParagraph para : cell.getParagraphs()) {
                            replaceParagraph(para, replacements);
                        }
                    }
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Replaces placeholders in a paragraph by merging all run texts first.
     * This handles placeholders that Word splits across multiple runs.
     * The replaced text is written into the first run; remaining runs are cleared.
     */
    private void replaceParagraph(XWPFParagraph para, Map<String, String> replacements) {
        List<XWPFRun> runs = para.getRuns();
        if (runs.isEmpty()) return;

        StringBuilder sb = new StringBuilder();
        for (XWPFRun run : runs) {
            String t = run.getText(0);
            sb.append(t != null ? t : "");
        }

        String text = sb.toString();
        boolean changed = false;
        for (Map.Entry<String, String> e : replacements.entrySet()) {
            if (text.contains(e.getKey())) {
                text = text.replace(e.getKey(), e.getValue());
                changed = true;
            }
        }

        if (changed) {
            runs.get(0).setText(text, 0);
            for (int i = 1; i < runs.size(); i++) {
                runs.get(i).setText("", 0);
            }
        }
    }
}
