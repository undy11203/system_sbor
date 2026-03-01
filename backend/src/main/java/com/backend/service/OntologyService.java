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
     * Returns all DatatypeProperty + ObjectProperty fields for the given OWL class URI.
     * Each entry contains: type, prop, localName, label, range, comment.
     */
    public List<Map<String, String>> getFormFields(String classUri) {
        List<Map<String, String>> fields = new ArrayList<>();
        fields.addAll(getDatatypeFields(classUri));
        fields.addAll(getObjectFields(classUri));
        return fields;
    }

    // DatatypeProperty — instance-based discovery.
    // Uses UNION instead of rdfs:subClassOf* to avoid property-path issues in Fuseki.
    private List<Map<String, String>> getDatatypeFields(String classUri) {
        String query = """
            PREFIX owl:  <http://www.w3.org/2002/07/owl#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            SELECT DISTINCT ?prop ?label ?range ?comment WHERE {
                {
                    ?ind rdf:type <%s> .
                } UNION {
                    ?ind rdf:type ?sub .
                    ?sub rdfs:subClassOf <%s> .
                }
                ?ind ?prop ?val .
                ?prop rdf:type owl:DatatypeProperty .
                OPTIONAL { ?prop rdfs:label ?label }
                OPTIONAL { ?prop rdfs:range ?range }
                OPTIONAL { ?prop rdfs:comment ?comment }
            } ORDER BY ?label
            """.formatted(classUri, classUri);
        return executeSelect(query, "datatype");
    }

    // ObjectProperty — via rdfs:domain, only those pointing to individuals with ФИО.
    // Uses UNION instead of rdfs:subClassOf+ to avoid property-path issues in Fuseki.
    private List<Map<String, String>> getObjectFields(String classUri) {
        String query = """
            PREFIX owl:  <http://www.w3.org/2002/07/owl#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            SELECT DISTINCT ?prop ?label ?range ?comment WHERE {
                ?prop rdf:type owl:ObjectProperty .
                {
                    ?prop rdfs:domain <%s> .
                } UNION {
                    ?prop rdfs:domain ?domain .
                    <%s> rdfs:subClassOf ?domain .
                }
                ?prop rdfs:range ?range .
                FILTER EXISTS {
                    ?rangeInd rdf:type ?range .
                    ?rangeInd <%sФИО> ?name .
                }
                OPTIONAL { ?prop rdfs:label ?label }
                OPTIONAL { ?prop rdfs:comment ?comment }
            } ORDER BY ?label
            """.formatted(classUri, classUri, ns);
        return executeSelect(query, "object");
    }

    /**
     * Returns form fields for ВКР: DatatypeProperty via rdfs:domain (schema-based,
     * works even when no ВКР individuals exist yet) + ObjectProperty pointing to people.
     */
    public List<Map<String, String>> getVkrFormFields() {
        List<Map<String, String>> fields = new ArrayList<>();
        fields.addAll(getDatatypeFieldsByDomain(ns + "ВКР"));
        fields.addAll(getObjectFields(ns + "ВКР"));
        return fields;
    }

    // DatatypeProperty — schema-based via rdfs:domain (no instances required).
    private List<Map<String, String>> getDatatypeFieldsByDomain(String classUri) {
        String query = """
            PREFIX owl:  <http://www.w3.org/2002/07/owl#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            SELECT DISTINCT ?prop ?label ?range ?comment WHERE {
                ?prop rdf:type owl:DatatypeProperty .
                {
                    ?prop rdfs:domain <%s> .
                } UNION {
                    ?prop rdfs:domain ?domain .
                    <%s> rdfs:subClassOf ?domain .
                }
                OPTIONAL { ?prop rdfs:label ?label }
                OPTIONAL { ?prop rdfs:range ?range }
                OPTIONAL { ?prop rdfs:comment ?comment }
            } ORDER BY ?label
            """.formatted(classUri, classUri);
        return executeSelect(query, "datatype");
    }

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
        }
        return results;
    }

    private List<Map<String, String>> executeSelect(String query, String fieldType) {
        log.debug("SPARQL [{}] → {}", fieldType, sparqlEndpoint);
        List<Map<String, String>> results = new ArrayList<>();
        try (QueryExecution qexec = QueryExecutionHTTP.newBuilder()
                .endpoint(sparqlEndpoint)
                .query(query)
                .build()) {
            ResultSet rs = qexec.execSelect();
            List<String> vars = rs.getResultVars();
            while (rs.hasNext()) {
                QuerySolution sol = rs.nextSolution();
                Map<String, String> row = new LinkedHashMap<>();
                row.put("type", fieldType);
                for (String var : vars) {
                    RDFNode node = sol.get(var);
                    if (node != null) row.put(var, node.toString());
                }
                String propUri = row.get("prop");
                if (propUri != null) {
                    int idx = Math.max(propUri.lastIndexOf('#'), propUri.lastIndexOf('/'));
                    row.put("localName", idx >= 0 ? propUri.substring(idx + 1) : propUri);
                }
                results.add(row);
            }
        }
        return results;
    }
}
