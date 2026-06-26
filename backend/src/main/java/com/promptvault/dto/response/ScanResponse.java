package com.promptvault.dto.response;

import java.util.List;

public record ScanResponse(List<String> matchedKeywords, boolean flagged) {}
