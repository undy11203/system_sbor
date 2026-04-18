package com.backend.repository;

import com.backend.entity.StudentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentSubmissionRepository extends JpaRepository<StudentSubmission, String> {
    List<StudentSubmission> findByStatus(StudentSubmission.Status status);
}
