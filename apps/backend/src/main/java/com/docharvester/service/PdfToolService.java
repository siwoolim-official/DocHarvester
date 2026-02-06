package com.docharvester.service;

import org.apache.pdfbox.io.IOUtils;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

/**
 * PDF 도구 서비스.
 * Apache PDFBox를 사용하여 PDF조작 기능을 제공합니다.
 */
@Service
public class PdfToolService {

    /**
     * 여러 PDF 파일을 하나로 병합합니다.
     * 메모리 효율성을 위해 스트림과 임시 파일을 사용합니다.
     *
     * @param files 병합할 PDF 파일 목록
     * @return 병합된 PDF 파일 (임시 파일)
     * @throws IOException 입출력 오류 발생 시
     */
    public File mergePdfs(List<MultipartFile> files) throws IOException {
        PDFMergerUtility merger = new PDFMergerUtility();
        List<File> tempFiles = new ArrayList<>();

        // 출력용 임시 파일 생성
        File tempOutputFile = File.createTempFile("merged_", ".pdf");
        merger.setDestinationFileName(tempOutputFile.getAbsolutePath());

        try {
            // 입력 파일들을 임시 파일로 변환하여 추가 (PDFBox 3.0 호환성 및 메모리 최적화)
            for (MultipartFile file : files) {
                File tempFile = File.createTempFile("upload_", ".pdf");
                Files.copy(file.getInputStream(), tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                tempFiles.add(tempFile);
                merger.addSource(tempFile);
            }

            // 병합 실행 (메모리 사용 최소화를 위해 임시 파일 버퍼링 사용)
            // PDFBox 3.0: IOUtils.createTempFileOnlyStreamCache() 사용
            merger.mergeDocuments(IOUtils.createTempFileOnlyStreamCache());

            return tempOutputFile;

        } finally {
            // 입력용 임시 파일 삭제
            for (File f : tempFiles) {
                try {
                    Files.deleteIfExists(f.toPath());
                } catch (IOException ignored) {
                }
            }
        }
    }
}
