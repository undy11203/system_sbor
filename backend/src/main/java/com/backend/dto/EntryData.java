package com.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

/**
 * Data returned when reading a single ontology individual for editing.
 *
 * values — propUri → literal string (for datatype fields) or individual URI (for object fields).
 *          Used as the value to submit when updating.
 *
 * labels — propUri → human-readable display string (only for object fields).
 *          Used to pre-populate the text input in the edit form.
 */
@Data
@AllArgsConstructor
public class EntryData {
    private Map<String, String> values;
    private Map<String, String> labels;
}
