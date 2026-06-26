package com.anansu.promptvault.service;

import org.springframework.stereotype.Service;

@Service
public class AIService {

    public String simulate(String promptTitle) {
        return "[PromptVault AI] Processed: '" + promptTitle + "'. " +
               "Your prompt has been analysed. No further action required.";
    }
}
