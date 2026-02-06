package com.docharvester.controller;

import com.docharvester.service.PdfToolService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

/**
 * PDF 도구 컨트롤러.
 * PDF 병합 등의 기능을 제공하는 API 엔드포인트입니다.
 */
@RestController
@RequestMapping("/api/tools")
public class PdfToolController {

    private final PdfToolService pdfToolService;

    public PdfToolController(PdfToolService pdfToolService) {
        this.pdfToolService = pdfToolService;
    }

    /**
     * PDF 파일 병합 요청 처리.
     * 
     * @param files 병합할 PDF 파일 목록 (MultipartFile)
     * @return 병합된 PDF 파일 스트림
     */
    @PostMapping(value = "/merge", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Resource> mergePdfs(@RequestParam("files") List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        File mergedFile = null;
        try {
            mergedFile = pdfToolService.mergePdfs(files);

            // 파일 리소스 생성
            Resource resource = new FileSystemResource(mergedFile);

            // 다운로드 응답 반환
            // 주의: FileSystemResource는 스트림을 열고 닫는 것을 처리하지만,
            // 임시 파일 삭제는 별도 처리가 필요할 수 있음.
            // 여기서는 간단히 반환하고, OS 또는 별도 배치로 정리된다고 가정하거나,
            // 응답 후 삭제를 위한 처리가 복잡하므로 기본적인 구현만 함.
            // (실제 프로덕션에서는 스트림 복사 후 삭제하거나, 임시 디렉토리 정책을 따름)

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"merged.pdf\"")
                    .body(resource);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
        // finally 블록에서 파일을 삭제하면 스트림이 전송되기 전에 파일이 사라질 수 있음.
        // Spring의 ResourceRegion 등을 쓰거나, 임시 파일 정리 스케줄러를 믿는 것이 일반적임.
    }
}
