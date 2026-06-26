package com.promptvault.service;

import com.promptvault.dto.request.CategoryRequest;
import com.promptvault.dto.response.CategoryResponse;
import com.promptvault.exception.ConflictException;
import com.promptvault.exception.ResourceNotFoundException;
import com.promptvault.model.Category;
import com.promptvault.repository.CategoryRepository;
import com.promptvault.repository.PromptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final PromptRepository promptRepository;

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        if (categoryRepository.existsByName(req.name())) {
            throw new ConflictException("Category name already exists");
        }
        Category saved = categoryRepository.save(
                Category.builder().name(req.name()).description(req.description()).build()
        );
        return CategoryResponse.from(saved);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        Category category = findById(id);
        category.setName(req.name());
        category.setDescription(req.description());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        if (promptRepository.existsByCategoryId(id)) {
            throw new ConflictException("Cannot delete category — prompts are linked to it");
        }
        categoryRepository.deleteById(id);
    }

    private Category findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
    }
}
