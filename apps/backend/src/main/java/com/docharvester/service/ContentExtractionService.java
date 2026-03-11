package com.docharvester.service;

import com.docharvester.domain.ConversionTask;
import com.docharvester.domain.ConversionTask.TaskStatus;
import com.docharvester.repository.ConversionTaskRepository;
import com.microsoft.playwright.*;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * 웹 콘텐츠 추출 서비스 (비동기).
 * Playwright를 사용하여 URL 목록을 순회하며 PDF 또는 HTML로 변환합니다.
 * 변환 상태는 DB에 업데이트됩니다.
 */
@Service
public class ContentExtractionService {

    private final ConversionTaskRepository taskRepository;
    private Playwright playwright;
    private Browser browser;
    private final java.util.Map<UUID, Boolean> cancellationRequests = new java.util.concurrent.ConcurrentHashMap<>();

    @Value("${app.storage.path:./storage/temp}")
    private String STORAGE_PATH;

    @Value("${app.playwright.timeout:30000}")
    private double TIMEOUT;

    @Value("${app.playwright.headless:true}")
    private boolean HEADLESS;

    public ContentExtractionService(ConversionTaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public enum ExtractionType {
        PDF,
        HTML_NO_CSS,
        HTML_WITH_CSS
    }

    /**
     * 애플리케이션 시작 시 Playwright 및 Browser 인스턴스 초기화 (Singleton 전략).
     */
    @PostConstruct
    public void init() {
        playwright = Playwright.create();
        browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(HEADLESS));
        createStorageDirectory();

        // 서버 시작 시 중단된 작업 정리
        cleanupInterruptedTasks();
    }

    private void cleanupInterruptedTasks() {
        List<ConversionTask> tasks = taskRepository.findAll();
        for (ConversionTask task : tasks) {
            if (task.getStatus() == TaskStatus.PROCESSING || task.getStatus() == TaskStatus.PENDING) {
                task.setStatus(TaskStatus.FAILED);
                // 에러 로그 파일 생성 등 추가 처리가 가능하지만, 우선 DB 상태만 업데이트
                taskRepository.save(task);
                System.out.println("중단된 작업 정리 완료: " + task.getTaskId());
            }
        }
    }

    /**
     * 애플리케이션 종료 시 리소스 정리.
     */
    @PreDestroy
    public void close() {
        if (browser != null) {
            browser.close();
        }
        if (playwright != null) {
            playwright.close();
        }
    }

    private void createStorageDirectory() {
        try {
            Files.createDirectories(Paths.get(STORAGE_PATH));
        } catch (IOException e) {
            System.err.println("스토리지 디렉토리 생성 실패: " + e.getMessage());
        }
    }

    /**
     * 비동기 변환 작업 수행.
     * 별도의 스레드에서 실행되며, 작업 진행 상황을 DB에 업데이트합니다.
     *
     * @param taskId 작업 ID
     * @param urls   처리할 URL 리스트
     * @param type   추출 타입
     */
    @Async("taskExecutor")
    @Transactional
    public void processUrlsAsync(UUID taskId, List<String> urls, ExtractionType type, Double scale) {
        ConversionTask task = taskRepository.findById(taskId).orElseThrow();
        task.setStatus(TaskStatus.PROCESSING);
        taskRepository.save(task);

        Path batchDir = Paths.get(STORAGE_PATH, taskId.toString());
        try {
            Files.createDirectories(batchDir);

            // Context 생성 (요청 단위 격리)
            try (BrowserContext context = browser.newContext()) {

                int total = urls.size();
                for (int i = 0; i < total; i++) {
                    // 취소 요청 확인
                    if (cancellationRequests.getOrDefault(taskId, false)) {
                        break; // 루프 탈출
                    }

                    String url = urls.get(i);
                    String fileName = String.format("doc_%d", i + 1);

                    // Page 생성 (URL 단위 격리하여 안정성 높임)
                    try (Page page = context.newPage()) {
                        processSingleUrl(page, url, type, batchDir, fileName, scale);
                    } catch (Exception e) {
                        createErrorLog(batchDir, fileName, url, e.getMessage());
                    }

                    // 진행률 업데이트 (트랜잭션 분리 고려 필요하나, 간편하게 여기서 저장)
                    // 주의: 대량 업데이트 시 성능 이슈 가능성 있지만 현재 규모에선 OK
                    // 실시간성을 위해 직접 save 호출
                    updateProgress(taskId, (int) ((double) (i + 1) / total * 100));
                }
            }

            // 취소 여부 확인 후 처리
            if (cancellationRequests.getOrDefault(taskId, false)) {
                task = taskRepository.findById(taskId).orElseThrow();
                task.setStatus(TaskStatus.CANCELLED);
                taskRepository.save(task);
                cancellationRequests.remove(taskId); // 요청 제거
                return; // 여기서 종료 (압축 등 수행 안함)
            }

            // 결과 압축
            String zipPath = createZipFile(batchDir, taskId.toString());

            // 완료 처리
            // 트랜잭션 내에서 엔티티 다시 조회 (JPA 영속성 컨텍스트)
            task = taskRepository.findById(taskId).orElseThrow();
            task.setStatus(TaskStatus.COMPLETED);
            task.setDownloadUrl(zipPath);
            task.setProgress(100);
            taskRepository.save(task);

        } catch (Exception e) {
            e.printStackTrace();
            task.setStatus(TaskStatus.FAILED);
            taskRepository.save(task);
        }
    }

    private void updateProgress(UUID taskId, int progress) {
        // 트랜잭션 전파 문제 회피를 위해 간단히 구현.
        // 실제로는 별도 트랜잭션으로 커밋해야 중간 상태가 보임.
        // 여기서는 @Transactional이 메서드 전체에 걸려있어 커밋이 안 될 수 있음.
        // 따라서 repository.saveAndFlush() 사용하거나 별도 서비스 메서드 호출 필요.
        // 간단하게 flush 호출.
        ConversionTask t = taskRepository.findById(taskId).orElse(null);
        if (t != null) {
            t.setProgress(progress);
            taskRepository.saveAndFlush(t);
        }
    }

    private void processSingleUrl(Page page, String url, ExtractionType type, Path batchDir, String fileName, Double scale) {
        page.setDefaultTimeout(TIMEOUT);
        page.setDefaultNavigationTimeout(TIMEOUT);

        // 페이지 이동 및 대기
        page.navigate(url,
                new Page.NavigateOptions().setWaitUntil(com.microsoft.playwright.options.WaitUntilState.NETWORKIDLE));

        // 쿠키 동의 팝업 자동 처리
        handleCookiePopups(page);

        // 화면 비율 축소 적용 (줌 조작)
        if (scale != null && scale != 1.0) {
            try {
                page.evaluate("() => { document.body.style.zoom = '" + scale + "'; }");
                page.waitForTimeout(500); // 렌더링 반영 대기
            } catch (Exception e) {
                System.err.println("Failed to apply zoom: " + e.getMessage());
            }
        }

        if (type == ExtractionType.PDF) {
            page.pdf(new Page.PdfOptions().setPath(batchDir.resolve(fileName + ".pdf")));
        } else if (type == ExtractionType.HTML_NO_CSS || type == ExtractionType.HTML_WITH_CSS) {
            // HTML 저장
            String content = page.content();
            try {
                Files.writeString(batchDir.resolve(fileName + ".html"), content);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    /**
     * 쿠키 및 안내 팝업을 닫거나 가리는 로직
     * JS 주입을 통해 흔히 쓰이는 쿠키 동의 버튼을 클릭하고, 잔여 팝업을 강제로 숨김 처리합니다.
     */
    private void handleCookiePopups(Page page) {
        try {
            // 1. JS를 이용하여 공통 쿠키/동의 버튼 클릭 시도
            Boolean clicked = (Boolean) page.evaluate("() => {" +
                    "  const keywords = ['allow all', 'accept all', 'accept cookies', 'i accept', 'got it', '모두 동의', '동의', '허용', '확인', '동의합니다', 'accept', '동의하고 계속하기'];" +
                    "  const buttons = document.querySelectorAll('button, a, [role=\"button\"]');" +
                    "  for (const btn of buttons) {" +
                    "    const text = (btn.innerText || '').trim().toLowerCase();" +
                    "    if (keywords.includes(text) && btn.offsetHeight > 0) {" +
                    "      btn.click();" +
                    "      return true;" +
                    "    }" +
                    "  }" +
                    "  return false;" +
                    "}");
                    
            if (Boolean.TRUE.equals(clicked)) {
                page.waitForTimeout(1000); // 클릭 후 모달이 닫히도록 1초 대기
            }
        } catch (Exception e) {
            // 에러 발생 시 무시
        }

        try {
            // 2. 강제로 화면 구조를 방해하는 쿠키/안내 고정 배너 숨기기
            page.evaluate("() => {" +
                    "  const tags = document.querySelectorAll('div, section, aside, iframe');" +
                    "  for (const el of tags) {" +
                    "    const style = window.getComputedStyle(el);" +
                    "    if (style.position === 'fixed' || style.position === 'sticky') {" +
                    "      const txt = el.textContent ? el.textContent.toLowerCase() : '';" +
                    "      const zIndex = parseInt(style.zIndex, 10);" +
                    "      if ((txt.includes('cookie') || txt.includes('쿠키') || txt.includes('gdpr')) && (zIndex > 50 || isNaN(zIndex))) {" +
                    "        el.style.display = 'none';" +
                    "      }" +
                    "    }" +
                    "  }" +
                    "}");
            page.waitForTimeout(500); // 렌더링 반영 대기
        } catch (Exception e) {
            // 에러 발생 시 무시
        }
    }

    // ... createErrorLog, createZipFile 메서드는 기존과 동일하게 유지하거나 아래에 포함 ...

    private void createErrorLog(Path dir, String fileName, String url, String errorMessage) {
        try {
            String log = String.format("URL: %s\nError: %s\nDate: %s", url, errorMessage,
                    java.time.LocalDateTime.now());
            Files.writeString(dir.resolve(fileName + "_error.txt"), log);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private String createZipFile(Path sourceDir, String zipName) throws IOException {
        Path zipPath = Paths.get(STORAGE_PATH, zipName + ".zip");
        try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipPath.toFile()))) {
            Files.walk(sourceDir)
                    .filter(path -> !Files.isDirectory(path))
                    .forEach(path -> {
                        ZipEntry zipEntry = new ZipEntry(sourceDir.relativize(path).toString());
                        try {
                            zos.putNextEntry(zipEntry);
                            Files.copy(path, zos);
                            zos.closeEntry();
                        } catch (IOException e) {
                            System.err.println(e.getMessage());
                        }
                    });
        }
        return zipPath.toAbsolutePath().toString();
    }

    public void cancelTask(UUID taskId) {
        cancellationRequests.put(taskId, true);
    }
}
