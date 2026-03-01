package com.backend.service;

import com.github.petrovich4j.Case;
import com.github.petrovich4j.Gender;
import com.github.petrovich4j.NameType;
import com.github.petrovich4j.Petrovich;
import org.apache.jena.query.*;
import org.apache.jena.rdf.model.RDFNode;
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
 *
 * Template placeholders (e.g. "имяСтудентаР") are mapped from ontology
 * variable names (e.g. "фио_студента") using the same conventions as hepler.
 *
 * Returns a ZIP containing all filled templates for the student.
 */
@Service
public class DocumentFillService {

    private static final Logger log = LoggerFactory.getLogger(DocumentFillService.class);

    private static final String NS = "http://www.semanticweb.org/oleyn/ontologies/2022/4/кафедра#";

    @Value("${fuseki.sparql.endpoint}")
    private String sparqlEndpoint;

    private final Petrovich petrovich = new Petrovich();

    // ── public API ────────────────────────────────────────────────────────────

    /**
     * Generates all applicable templates for the given student URI.
     * Returns a ZIP archive as byte[].
     */
    public byte[] generateZip(String studentUri) throws IOException {
        Map<String, String> vars = fetchStudentVars(studentUri);
        if (vars.isEmpty()) {
            throw new IllegalArgumentException("Student not found or has no data: " + studentUri);
        }

        String degreeClass = fetchDegreeClass(studentUri);
        String templateDir = resolveTemplateDir(degreeClass, vars.getOrDefault("профиль", ""));

        Map<String, String> placeholders = buildPlaceholders(vars);
        log.debug("Placeholders built: {}", placeholders.keySet());

        ByteArrayOutputStream zipBuffer = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(zipBuffer)) {
            fillTemplateDir(templateDir, placeholders, zos);
        }
        return zipBuffer.toByteArray();
    }

    // ── SPARQL data fetching ──────────────────────────────────────────────────

    /**
     * Runs the full StudentQuery (adapted from hepler) for the given student URI.
     * Returns variable_name → string_value map.
     */
    private Map<String, String> fetchStudentVars(String studentUri) {
        String query = """
            PREFIX my: <%s>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            SELECT * WHERE {
                <%s> my:ФИО ?фио_студента .
                OPTIONAL { <%s> my:группа ?группа_студента . }
                OPTIONAL { <%s> my:Место_прохождения_практики ?место_практики . }
                OPTIONAL { <%s> my:Приказ_на_прохождение_практики ?приказ_практика . }
                OPTIONAL { <%s> my:Место_практики_полное_наименование ?место_практики_полное_наименование . }
                OPTIONAL { <%s> my:Наименование_организации ?наименование_организации . }
                OPTIONAL { <%s> my:Профиль_обучения ?профиль . }

                OPTIONAL {
                    <%s> my:на_НГУ_практике_у ?нгу_рук .
                    ?нгу_рук my:ФИО ?фио_НГУ_руководителя .
                    OPTIONAL { ?нгу_рук my:Должность_в_НГУ ?должность_НГУ_руководителя . }
                }
                OPTIONAL {
                    <%s> my:на_орг_практике_у ?орг_рук .
                    ?орг_рук my:ФИО ?фио_орг_руководителя .
                    OPTIONAL { ?орг_рук my:Должность_в_организации ?должность_орг_руководителя . }
                    OPTIONAL { ?орг_рук my:ФИО_для_подписи ?фио_подпись . }
                    OPTIONAL { ?орг_рук my:ДатаБакРук ?бак_дата_рук . }
                    OPTIONAL { ?орг_рук my:ДатаМагМДА ?маг_дата_рук_мда . }
                    OPTIONAL { ?орг_рук my:ДатаМагТРПС ?маг_дата_рук_трпс . }
                }
                OPTIONAL {
                    <%s> my:защищает ?вкр .
                    OPTIONAL { ?вкр my:Тема ?тема_вкр . }
                    OPTIONAL {
                        ?рук my:согласовывает ?вкр .
                        ?рук my:ФИО ?фио_руководителя .
                        OPTIONAL { ?рук my:Должность_руководителя_ВКР ?должность_руководителя_вкр . }
                        OPTIONAL { ?рук my:Ученая_степень_руководителя_ВКР ?ученая_степень_руководителя_ВКР . }
                        OPTIONAL { ?рук my:Должность_руководителя_ВКР_кратко ?должность_руководителя_вкр_кратко . }
                    }
                    OPTIONAL {
                        ?рец my:рецензирует ?вкр .
                        ?рец my:ФИО ?фио_рецензента .
                        OPTIONAL { ?рец my:Должность ?должность_рецензента . }
                    }
                    OPTIONAL {
                        ?сорук my:руководит_с ?вкр .
                        ?сорук my:ФИО ?фио_соруководителя_вкр .
                        OPTIONAL { ?сорук my:Должность ?должность_соруководителя_вкр . }
                    }
                }
            }
            """.formatted(NS,
                studentUri, studentUri, studentUri, studentUri,
                studentUri, studentUri, studentUri, studentUri,
                studentUri, studentUri);

        Map<String, String> vars = new LinkedHashMap<>();
        try (QueryExecution qe = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint).query(query).build()) {
            ResultSet rs = qe.execSelect();
            if (rs.hasNext()) {
                QuerySolution sol = rs.nextSolution();
                for (String varName : rs.getResultVars()) {
                    RDFNode node = sol.get(varName);
                    if (node != null && node.isLiteral()) {
                        vars.put(varName, node.asLiteral().getString());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch student data for {}: {}", studentUri, e.getMessage());
        }
        return vars;
    }

    private String fetchDegreeClass(String studentUri) {
        String query = """
            PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX owl:  <http://www.w3.org/2002/07/owl#>
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
                if (local.equals("Бакалавриат") || local.equals("Магистратура")) {
                    return local;
                }
            }
        } catch (Exception e) {
            log.warn("Could not determine degree class for {}: {}", studentUri, e.getMessage());
        }
        return "Бакалавриат";
    }

    // ── template directory resolution ─────────────────────────────────────────

    private String resolveTemplateDir(String degreeClass, String profile) {
        if ("Бакалавриат".equals(degreeClass)) {
            return "bachelors/4th_course";
        }
        // Master: distinguish by profile
        String p = profile.toLowerCase();
        if (p.contains("модел") || p.contains("мда") || p.contains("кмиад")) {
            return "masters/2nd_course/mda";
        }
        return "masters/2nd_course/tprs";
    }

    // ── placeholder building ──────────────────────────────────────────────────

    /**
     * Maps variable values from Fuseki to template placeholder strings,
     * applying Petrovich declension and gender detection as needed.
     * Mirrors the DOC_FIELD_TO_SOLUTION maps in hepler template classes.
     */
    private Map<String, String> buildPlaceholders(Map<String, String> vars) {
        Map<String, String> p = new LinkedHashMap<>();

        String fio = vars.get("фио_студента");
        if (fio != null) {
            p.put("имяСтудента",     fio);
            p.put("фиоСтудента",     fio);
            p.put("имяСтудентаР",    declineFio(fio, Case.Genitive));
            p.put("имяСтудентаД",    declineFio(fio, Case.Dative));
            p.put("имяСтудентаВ",    declineFio(fio, Case.Accusative));
            p.put("имяСтудентаТ",    declineFio(fio, Case.Instrumental));
            p.put("имяСтудентаП",    declineFio(fio, Case.Prepositional));
            p.put("обучСтудОбрПадеж", genderObuchRod(fio));
            p.put("обучСтудИмПадеж",  genderObuchIm(fio));
            p.put("гендерСтудента",   genderForm(fio));
        }

        ifPresent(vars, "группа_студента",                         p, "группаСтудента");
        ifPresent(vars, "место_практики",                          p, "местоПрактики");
        ifPresent(vars, "приказ_практика",                         p, "приказПрактика");
        ifPresent(vars, "место_практики_полное_наименование",      p, "полноеНаименованиеМестаПрактики");
        ifPresent(vars, "наименование_организации",                p, "наименованиеОрганизации");

        // NGU supervisor
        String fioNgu = vars.get("фио_НГУ_руководителя");
        if (fioNgu != null) {
            p.put("имяНГУРуководителя",   fioNgu);
            p.put("имяНГУРуководителяР",  declineFio(fioNgu, Case.Genitive));
        }
        ifPresent(vars, "должность_НГУ_руководителя", p, "должностьНГУРуководителя");

        // Org supervisor
        String fioOrg = vars.get("фио_орг_руководителя");
        if (fioOrg != null) {
            p.put("имяОргРуководителя",  fioOrg);
            p.put("имяОргРуководителяР", declineFio(fioOrg, Case.Genitive));
        }
        ifPresent(vars, "должность_орг_руководителя", p, "должностьОргРуководителя");
        ifPresent(vars, "фио_подпись",                p, "фиоПодпись");
        ifPresent(vars, "бак_дата_рук",               p, "бакДатаРук");
        ifPresent(vars, "маг_дата_рук_мда",           p, "магДатаРукМДА");
        ifPresent(vars, "маг_дата_рук_трпс",          p, "магДатаРукТРПС");

        // VKR supervisor
        String fioRuk = vars.get("фио_руководителя");
        if (fioRuk != null) {
            p.put("имяРуководителяВКР",  fioRuk);
            p.put("имяРуководителяР",    declineFio(fioRuk, Case.Genitive));
        }
        ifPresent(vars, "должность_руководителя_вкр",        p, "должностьРуководителяПолноВКР");
        ifPresent(vars, "должность_руководителя_вкр_кратко", p, "должностьРуководителяКраткоВКР");
        ifPresent(vars, "ученая_степень_руководителя_ВКР",   p, "ученаяСтепеньРуководителяВКР");
        ifPresent(vars, "тема_вкр",                           p, "темаВКР");

        // Reviewer
        String fioRec = vars.get("фио_рецензента");
        if (fioRec != null) {
            p.put("имяРецензента",  fioRec);
            p.put("имяРецензентаР", declineFio(fioRec, Case.Genitive));
        }
        ifPresent(vars, "должность_рецензента", p, "должностьРецензента");

        // Co-supervisor
        String fioSoRuk = vars.get("фио_соруководителя_вкр");
        if (fioSoRuk != null) {
            p.put("имяСоруководителяВКР",  fioSoRuk);
            p.put("имяСоруководителяВКРР", declineFio(fioSoRuk, Case.Genitive));
        }
        ifPresent(vars, "должность_соруководителя_вкр", p, "должностьСоруководителяВКР");

        return p;
    }

    private static void ifPresent(Map<String, String> vars, String varName,
                                   Map<String, String> placeholders, String placeholder) {
        String v = vars.get(varName);
        if (v != null && !v.isBlank()) {
            placeholders.put(placeholder, v);
        }
    }

    // ── Petrovich name declension ─────────────────────────────────────────────

    /**
     * Declines a Russian full name (Фамилия Имя Отчество) to the given grammatical case.
     * Falls back to the original if the input is not in 3-word format.
     */
    private String declineFio(String fio, Case wordCase) {
        String[] parts = fio.trim().split("\\s+");
        if (parts.length != 3) {
            return fio; // unknown format — return as-is
        }
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

    // ── DOCX filling (Apache POI) ─────────────────────────────────────────────

    private void fillTemplateDir(String relDir, Map<String, String> placeholders,
                                  ZipOutputStream zos) throws IOException {
        String resourceBase = "/templates/" + relDir;
        // Enumerate templates from the classpath resource directory
        try (InputStream listing = getClass().getResourceAsStream(resourceBase + "/.index")) {
            // Fallback: scan known template filenames via resource listing
        }
        // Walk the directory on disk (works when running from IDE/jar with exploded resources)
        java.net.URL dirUrl = getClass().getResource(resourceBase);
        if (dirUrl == null) {
            log.warn("Template directory not found on classpath: {}", resourceBase);
            return;
        }
        java.nio.file.Path dirPath;
        try {
            dirPath = java.nio.file.Paths.get(dirUrl.toURI());
        } catch (java.net.URISyntaxException e) {
            throw new IOException("Cannot resolve template directory URI", e);
        }
        try (java.nio.file.DirectoryStream<java.nio.file.Path> stream =
                     java.nio.file.Files.newDirectoryStream(dirPath, "*.docx")) {
            for (java.nio.file.Path file : stream) {
                String filename = file.getFileName().toString();
                log.debug("Filling template: {}", filename);
                byte[] filled = fillDocx(java.nio.file.Files.newInputStream(file), placeholders);
                zos.putNextEntry(new ZipEntry(filename));
                zos.write(filled);
                zos.closeEntry();
            }
        }
    }

    /**
     * Opens a DOCX template stream and replaces all placeholder occurrences
     * in paragraph runs and table cell runs. Returns filled document bytes.
     */
    private byte[] fillDocx(InputStream templateStream, Map<String, String> replacements)
            throws IOException {
        try (XWPFDocument doc = new XWPFDocument(templateStream)) {
            for (XWPFParagraph para : doc.getParagraphs()) {
                for (XWPFRun run : para.getRuns()) {
                    replaceInRun(run, replacements);
                }
            }
            for (XWPFTable table : doc.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        for (XWPFParagraph para : cell.getParagraphs()) {
                            for (XWPFRun run : para.getRuns()) {
                                replaceInRun(run, replacements);
                            }
                        }
                    }
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            return out.toByteArray();
        }
    }

    private void replaceInRun(XWPFRun run, Map<String, String> replacements) {
        int chunks = run.getCTR().getTArray().length;
        for (int i = 0; i < chunks; i++) {
            String text = run.getText(i);
            if (text == null) continue;
            for (Map.Entry<String, String> e : replacements.entrySet()) {
                text = text.replace(e.getKey(), e.getValue());
            }
            run.setText(text, i);
        }
    }
}
