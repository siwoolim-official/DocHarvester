package com.docharvester.repository;

import com.docharvester.domain.ConversionTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * 변환 작업 저장소.
 */
@Repository
public interface ConversionTaskRepository extends JpaRepository<ConversionTask, UUID> {
}
