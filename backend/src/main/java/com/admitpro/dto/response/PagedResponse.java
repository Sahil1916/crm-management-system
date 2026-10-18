package com.admitpro.dto.response;

import com.admitpro.model.*;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class PagedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public static <T> PagedResponse<T> of(org.springframework.data.domain.Page<T> page) {
        return PagedResponse.<T>builder()
            .content(page.getContent()).page(page.getNumber())
            .size(page.getSize()).totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages()).build();
    }
}

