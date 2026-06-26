package com.anansu.promptvault.dto.response;

import java.util.List;

public record ScanResponse(List<String> matchedKeywords, boolean flagged) {}
