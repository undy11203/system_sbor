package com.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ApplicationSubmitResponse {
    /** URI of the newly created student individual in the ontology */
    private String studentUri;
    /** URI of the newly created ВКР individual (null if no VKR fields were filled) */
    private String vkrUri;
    /** Submission status, e.g. "SUBMITTED" */
    private String status;
}
