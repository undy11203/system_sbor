# Apache Jena Fuseki — SPARQL server
# Build context must be the project root:
#   docker build -f jena/Dockerfile -t jena-fuseki .
#
# Or use docker-compose from the project root.
#
# After start:
#   Web UI:            http://localhost:3030/
#   SPARQL query:      http://localhost:3030/ontology/sparql
#   SPARQL update:     http://localhost:3030/ontology/update
#   Graph store:       http://localhost:3030/ontology/data

FROM stain/jena-fuseki:4.8.0

# Copy the ontology into the image
COPY hepler/src/main/resources/main_students_all.owl /data/ontology.owl

EXPOSE 3030

# Bypass docker-entrypoint.sh — it doesn't support --file arguments.
# Call fuseki-server directly.
ENTRYPOINT ["/jena-fuseki/fuseki-server"]

# --update  — enables SPARQL Update (INSERT/DELETE)
# /ontology — the dataset name (accessible at /ontology/sparql)
CMD ["--update", "--file=/data/ontology.owl", "/ontology"]
