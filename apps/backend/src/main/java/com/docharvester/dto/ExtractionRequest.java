package com.docharvester.dto;

import com.docharvester.service.ContentExtractionService.ExtractionType;
import java.util.List;

public record ExtractionRequest(
        List<String> urls,
        ExtractionType type) {
}
