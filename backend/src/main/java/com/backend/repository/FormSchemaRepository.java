package com.backend.repository;

import com.backend.entity.FormSchemaRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FormSchemaRepository extends JpaRepository<FormSchemaRecord, String> {
}
