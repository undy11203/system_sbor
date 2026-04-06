package com.backend.service;

import org.apache.jena.query.*;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.sparql.exec.http.QueryExecutionHTTP;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class OntologyService {

    private static final Logger log = LoggerFactory.getLogger(OntologyService.class);

    @Value("${fuseki.sparql.endpoint}")
    private String sparqlEndpoint;

    @Value("${ontology.base-namespace}")
    private String ns;

    /**
     * Searches existing literal values of a DatatypeProperty across all individuals.
     * Returns list of {value} maps (up to 10). Used for datatype field autocomplete.
     */
    public List<Map<String, String>> searchPropertyValues(String propUri, String search) {
        String safeSearch = search.replace("\\", "\\\\").replace("\"", "\\\"");
        String query = """
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            SELECT DISTINCT ?val WHERE {
                ?ind <%s> ?val .
                FILTER(isLiteral(?val))
                FILTER(CONTAINS(LCASE(STR(?val)), LCASE("%s")))
            } ORDER BY STR(?val) LIMIT 10
            """.formatted(propUri, safeSearch);
        List<Map<String, String>> results = new ArrayList<>();
        try (QueryExecution qexec = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint)
                .query(query)
                .build()) {
            ResultSet rs = qexec.execSelect();
            while (rs.hasNext()) {
                QuerySolution sol = rs.nextSolution();
                RDFNode val = sol.get("val");
                if (val != null) {
                    String str = val.isLiteral() ? val.asLiteral().getString() : val.toString();
                    results.add(Map.of("value", str));
                }
            }
        }
        return results;
    }

    /**
     * Returns the first literal value of a datatype property for an individual, or null.
     */
    public String getLiteralValue(String subjectUri, String propUri) {
        String query = """
            SELECT ?val WHERE {
                <%s> <%s> ?val .
                FILTER(isLiteral(?val))
            } LIMIT 1
            """.formatted(subjectUri, propUri);
        try (QueryExecution qexec = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint).query(query).build()) {
            ResultSet rs = qexec.execSelect();
            if (rs.hasNext()) {
                RDFNode val = rs.nextSolution().get("val");
                return val != null ? val.asLiteral().getString() : null;
            }
        } catch (Exception e) {
            log.error("getLiteralValue failed uri={} prop={}: {}", subjectUri, propUri, e.getMessage());
        }
        return null;
    }

    /**
     * Returns the URI of the individual linked via an object property, or null if not found.
     * If reversed=true the triple direction is {@code <obj> <prop> <subjectUri>}.
     */
    public String getObjectValue(String subjectUri, String propUri, boolean reversed) {
        String query = reversed
            ? "SELECT ?obj WHERE { ?obj <%s> <%s> . FILTER(isIRI(?obj)) } LIMIT 1"
                .formatted(propUri, subjectUri)
            : "SELECT ?obj WHERE { <%s> <%s> ?obj . FILTER(isIRI(?obj)) } LIMIT 1"
                .formatted(subjectUri, propUri);
        try (QueryExecution qexec = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint).query(query).build()) {
            ResultSet rs = qexec.execSelect();
            if (rs.hasNext()) {
                RDFNode obj = rs.nextSolution().get("obj");
                return obj != null ? obj.toString() : null;
            }
        } catch (Exception e) {
            log.error("getObjectValue failed uri={} prop={}: {}", subjectUri, propUri, e.getMessage());
        }
        return null;
    }

    /**
     * Lists individuals belonging to any of the given classes (UNION).
     * Returns list of {uri, label, degree} maps, ordered by name.
     * {@code classLocalNames} entries are used as human-readable degree labels.
     */
    public List<Map<String, String>> listStudents(String ns, List<String> degreeLocalNames, String fioUri) {
        StringBuilder unions = new StringBuilder();
        for (String deg : degreeLocalNames) {
            unions.append("  { ?ind rdf:type <").append(ns).append(deg)
                  .append("> . BIND(\"").append(deg).append("\" AS ?degree) }\n  UNION\n");
        }
        // Remove trailing UNION
        String unionsStr = unions.toString().replaceAll("\\s*UNION\\s*$", "").trim();
        String query = """
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            SELECT ?ind ?name ?degree WHERE {
              %s
              OPTIONAL { ?ind <%s> ?name }
            } ORDER BY ?name
            """.formatted(unionsStr, fioUri);
        List<Map<String, String>> results = new ArrayList<>();
        try (QueryExecution qexec = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint).query(query).build()) {
            ResultSet rs = qexec.execSelect();
            while (rs.hasNext()) {
                QuerySolution sol = rs.nextSolution();
                Map<String, String> row = new LinkedHashMap<>();
                RDFNode ind = sol.get("ind");
                RDFNode name = sol.get("name");
                RDFNode degree = sol.get("degree");
                if (ind != null) {
                    row.put("uri", ind.toString());
                    row.put("label", name != null ? name.asLiteral().getString() : ind.toString());
                    row.put("degree", degree != null ? degree.asLiteral().getString() : "");
                    results.add(row);
                }
            }
        } catch (Exception e) {
            log.error("listStudents failed: {}", e.getMessage());
        }
        return results;
    }

    /**
     * Lists all individuals of the given class with their main name property value.
     * Returns list of {uri, label} maps, ordered by name.
     */
    public List<Map<String, String>> listIndividuals(String classUri, String mainNamePropUri) {
        String query = """
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            SELECT ?ind ?name WHERE {
                ?ind rdf:type <%s> .
                OPTIONAL { ?ind <%s> ?name }
            } ORDER BY ?name
            """.formatted(classUri, mainNamePropUri);
        List<Map<String, String>> results = new ArrayList<>();
        try (QueryExecution qexec = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint).query(query).build()) {
            ResultSet rs = qexec.execSelect();
            while (rs.hasNext()) {
                QuerySolution sol = rs.nextSolution();
                Map<String, String> row = new LinkedHashMap<>();
                RDFNode ind = sol.get("ind");
                RDFNode name = sol.get("name");
                if (ind != null) {
                    row.put("uri", ind.toString());
                    row.put("label", name != null ? name.asLiteral().getString() : ind.toString());
                    results.add(row);
                }
            }
        } catch (Exception e) {
            log.error("listIndividuals failed for class={}: {}", classUri, e.getMessage());
        }
        return results;
    }

    /**
     * Returns current literal values of the given properties for an individual.
     * Result map: propUri → literal string.
     */
    public Map<String, String> getIndividualProperties(String individualUri, List<String> propUris) {
        if (propUris.isEmpty()) return Map.of();
        StringBuilder optionals = new StringBuilder();
        for (int i = 0; i < propUris.size(); i++) {
            optionals.append("  OPTIONAL { <%s> <%s> ?v%d . FILTER(isLiteral(?v%d)) }\n"
                    .formatted(individualUri, propUris.get(i), i, i));
        }
        StringBuilder selects = new StringBuilder("SELECT");
        for (int i = 0; i < propUris.size(); i++) selects.append(" ?v").append(i);
        String query = selects + " WHERE {\n" + optionals + "} LIMIT 1";
        Map<String, String> result = new LinkedHashMap<>();
        try (QueryExecution qexec = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint).query(query).build()) {
            ResultSet rs = qexec.execSelect();
            if (rs.hasNext()) {
                QuerySolution sol = rs.nextSolution();
                for (int i = 0; i < propUris.size(); i++) {
                    RDFNode val = sol.get("v" + i);
                    if (val != null) result.put(propUris.get(i), val.asLiteral().getString());
                }
            }
        } catch (Exception e) {
            log.error("getIndividualProperties failed for uri={}: {}", individualUri, e.getMessage());
        }
        return result;
    }

    /**
     * Searches individuals of the given class by ФИО (case-insensitive substring match).
     * Returns list of {uri, label} maps. Max 10 results.
     */
    public List<Map<String, String>> searchIndividuals(String classUri, String search) {
        String safeSearch = search.replace("\\", "\\\\").replace("\"", "\\\"");
        // Uses UNION instead of rdfs:subClassOf* to avoid property-path issues in Fuseki.
        String query = """
            PREFIX owl:  <http://www.w3.org/2002/07/owl#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            SELECT ?ind ?name WHERE {
                {
                    ?ind rdf:type <%s> .
                } UNION {
                    ?ind rdf:type ?sub .
                    ?sub rdfs:subClassOf <%s> .
                }
                ?ind <%sФИО> ?name .
                FILTER(CONTAINS(LCASE(STR(?name)), LCASE("%s")))
            } ORDER BY ?name LIMIT 10
            """.formatted(classUri, classUri, ns, safeSearch);
        List<Map<String, String>> results = new ArrayList<>();
        try (QueryExecution qexec = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint)
                .query(query)
                .build()) {
            ResultSet rs = qexec.execSelect();
            while (rs.hasNext()) {
                QuerySolution sol = rs.nextSolution();
                Map<String, String> row = new LinkedHashMap<>();
                RDFNode ind = sol.get("ind");
                RDFNode name = sol.get("name");
                if (ind != null) row.put("uri", ind.toString());
                if (name != null) row.put("label", name.asLiteral().getString());
                if (!row.isEmpty()) results.add(row);
            }
        } catch (Exception e) {
            log.error("searchIndividuals failed for class={}: {}", classUri, e.getMessage());
        }
        return results;
    }
}
