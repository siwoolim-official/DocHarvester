package com.docharvester.domain;

import com.docharvester.service.ContentExtractionService.ExtractionType;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
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
        FAILED,
        CANCELLED
    }

    public ConversionTask() {
    }

    @ElementCollection
    @CollectionTable(name = "conversion_task_urls", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "url")
    private List<String> urls;

    @Enumerated(EnumType.STRING)
    private ExtractionType type;

    private Double scale;

    public ConversionTask(UUID taskId, List<String> urls, ExtractionType type, Double scale) {
        this.taskId = taskId;
        this.urls = urls;
        this.type = type;
        this.scale = scale != null ? scale : 1.0;
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

    public List<String> getUrls() {
        return urls;
    }

    public void setUrls(List<String> urls) {
        this.urls = urls;
    }

    public ExtractionType getType() {
        return type;
    }

    public void setType(ExtractionType type) {
        this.type = type;
    }

    public Double getScale() {
        return scale;
    }

    public void setScale(Double scale) {
        this.scale = scale;
    }
}
