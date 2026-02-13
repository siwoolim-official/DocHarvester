package com.docharvester.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * URL 수집을 위한 서비스 클래스.
 * BFS 알고리즘을 사용하여 주어진 시작 URL로부터 하위 링크들을 수집합니다.
 */
@Service
public class UrlCrawlerService {

    private static final int MAX_DEPTH = 10;
    private static final int MAX_COUNT = 10000;

    /**
     * 주어진 시작 URL로부터 링크를 수집합니다.
     *
     * @param startUrl 수집을 시작할 URL
     * @return 수집된 고유 URL 리스트
     */
    public List<String> crawl(String startUrl) {
        String normalizedStartUrl = normalizeUrl(startUrl);
        Set<String> visited = ConcurrentHashMap.newKeySet();
        List<String> collectedUrls = new ArrayList<>();
        Queue<CrawlNode> queue = new LinkedList<>();

        // 시작점 초기화
        visited.add(normalizedStartUrl);
        collectedUrls.add(normalizedStartUrl);
        queue.add(new CrawlNode(normalizedStartUrl, 0));

        while (!queue.isEmpty() && collectedUrls.size() < MAX_COUNT) {
            CrawlNode currentNode = queue.poll();
            String currentUrl = currentNode.url;
            int currentDepth = currentNode.depth;

            if (currentDepth >= MAX_DEPTH) {
                continue;
            }

            try {
                // Jsoup을 사용하여 페이지 내용 가져오기
                System.out.println("Crawling: " + currentUrl); // LOGGING
                Document document = Jsoup.connect(currentUrl)
                        .userAgent(
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                        .timeout(10000)
                        .ignoreContentType(true) // PDF 등 다른 타입 무시하고 진행 (링크 추출 목적)
                        .ignoreHttpErrors(true) // 404 등 에러 무시
                        .get();
                Elements links = document.select("a[href]");
                System.out.println(" - Found " + links.size() + " links"); // LOGGING

                for (Element link : links) {
                    if (collectedUrls.size() >= MAX_COUNT) {
                        break;
                    }

                    String nextUrl = link.attr("abs:href"); // 절대 경로로 변환

                    // 유효성 검사 및 필터링
                    if (isValidUrl(nextUrl)) {
                        String normalizedNextUrl = normalizeUrl(nextUrl);

                        // 1. 시작 URL의 하위 경로인지 확인 (도메인 및 경로 제한)
                        // 2. 이미 방문하지 않았는지 확인
                        if (normalizedNextUrl.startsWith(normalizedStartUrl) && !visited.contains(normalizedNextUrl)) {
                            visited.add(normalizedNextUrl);
                            collectedUrls.add(normalizedNextUrl);
                            queue.add(new CrawlNode(normalizedNextUrl, currentDepth + 1));
                        }
                    }
                }

            } catch (org.jsoup.HttpStatusException e) {
                System.err
                        .println("HTTP Error fetching " + currentUrl + ": " + e.getStatusCode() + " " + e.getMessage()); // LOGGING
            } catch (IOException e) {
                System.err.println("Failed to crawl: " + currentUrl + " - " + e.getMessage());
                // 실패한 URL은 무시하고 계속 진행
            }
        }

        System.out.println("Crawl finished. Total collected: " + collectedUrls.size()); // LOGGING
        return collectedUrls;
    }

    /**
     * URL 정규화 메서드.
     * - 맨 끝의 슬래시(/)를 제거하여 중복을 방지합니다.
     * - 예: "http://example.com/docs/" -> "http://example.com/docs"
     *
     * @param url 정규화할 URL
     * @return 정규화된 URL
     */
    private String normalizeUrl(String url) {
        if (url == null) {
            return "";
        }
        // 해시(#) 제거 (프래그먼트 무시)
        int hashIndex = url.indexOf("#");
        if (hashIndex != -1) {
            url = url.substring(0, hashIndex);
        }

        // 끝 쪽에 있는 슬래시 제거
        if (url.endsWith("/")) {
            return url.substring(0, url.length() - 1);
        }
        return url;
    }

    /**
     * URL 유효성 검사.
     * - http/https 프로토콜만 허용
     * - mailto, tel 등 제외
     *
     * @param url 검사할 URL
     * @return 유효 여부
     */
    private boolean isValidUrl(String url) {
        if (url == null || url.isEmpty()) {
            return false;
        }
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (URISyntaxException e) {
            return false;
        }
    }

    // BFS 탐색을 위한 내부 클래스
    private static class CrawlNode {
        String url;
        int depth;

        CrawlNode(String url, int depth) {
            this.url = url;
            this.depth = depth;
        }
    }
}
