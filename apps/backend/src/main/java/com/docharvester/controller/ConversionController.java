package com.docharvester.controller;

import com.docharvester.domain.ConversionTask;
import com.docharvester.dto.ExtractionRequest;
import com.docharvester.repository.ConversionTaskRepository;
import com.docharvester.service.ContentExtractionService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

/**
 * 변환 작업 컨트롤러.
 * 비동기 작업 요청을 처리하고 상태를 반환합니다.
 */
@RestController
@RequestMapping("/api/extract")
public class ConversionController {

    private final ContentExtractionService extractionService;
    private final ConversionTaskRepository taskRepository;

    public ConversionController(ContentExtractionService extractionService, ConversionTaskRepository taskRepository) {
        this.extractionService = extractionService;
        this.taskRepository = taskRepository;
    }

    /**
     * 변환 작업을 요청하고 Task ID를 반환합니다.
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> startConversion(@RequestBody ExtractionRequest request) {
        UUID taskId = UUID.randomUUID();

        // 초기 태스크 저장
        ConversionTask task = new ConversionTask(taskId);
        taskRepository.save(task);

        // 비동기 작업 시작
        extractionService.processUrlsAsync(taskId, request.urls(), request.type());

        return ResponseEntity.ok(Map.of("taskId", taskId.toString()));
    }

    /**
     * 작업 상태 및 진행률 조회.
     */
    @GetMapping("/status/{taskId}")
    public ResponseEntity<ConversionTask> getStatus(@PathVariable UUID taskId) {
        return taskRepository.findById(taskId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 서버 상태 확인.
     */
    @GetMapping("/health")
    public String healthCheck() {
        return "OK";
    }

    /**
     * 완료된 파일 다운로드.
     */
    @GetMapping("/download/{taskId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID taskId) {
        ConversionTask task = taskRepository.findById(taskId).orElse(null);

        if (task == null || task.getStatus() != ConversionTask.TaskStatus.COMPLETED || task.getDownloadUrl() == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            Path path = Paths.get(task.getDownloadUrl());
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            }
        } catch (MalformedURLException e) {
            // ignore
        }
        return ResponseEntity.notFound().build();
    }
}
