package com.docharvester.controller;

import com.docharvester.dto.CrawlRequest;
import com.docharvester.service.UrlCrawlerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tools")
public class UrlCrawlerController {

    private final UrlCrawlerService urlCrawlerService;

    public UrlCrawlerController(UrlCrawlerService urlCrawlerService) {
        this.urlCrawlerService = urlCrawlerService;
    }

    @PostMapping("/crawl")
    public ResponseEntity<List<String>> crawlUrls(@RequestBody CrawlRequest request) {
        List<String> results = urlCrawlerService.crawl(request.url());
        return ResponseEntity.ok(results);
    }
}
