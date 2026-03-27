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
