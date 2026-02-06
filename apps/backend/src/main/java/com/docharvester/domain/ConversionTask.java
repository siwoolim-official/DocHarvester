package com.docharvester.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 웹 변환 작업 엔티티.
 * 작업의 고유 ID, 진행 상태, 결과 파일 경로 등을 저장합니다.
 */
@Entity
public class ConversionTask {

    @Id
    private UUID taskId;

    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    private String downloadUrl;

    private LocalDateTime createdAt;

    private int progress; // 진행률 (0-100)

    public enum TaskStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED
    }

    public ConversionTask() {
    }

    public ConversionTask(UUID taskId) {
        this.taskId = taskId;
        this.status = TaskStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.progress = 0;
    }

    // Getters and Setters
    public UUID getTaskId() {
        return taskId;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public int getProgress() {
        return progress;
    }

    public void setProgress(int progress) {
        this.progress = progress;
    }
}
