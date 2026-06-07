package com.sahilcrm.controller;

import com.sahilcrm.entity.CallRecord;
import com.sahilcrm.repository.CallRecordRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/callrecords")
@RequiredArgsConstructor
public class CallRecordController {

    private final CallRecordRepository callRecordRepository;

    @GetMapping
    public ResponseEntity<List<CallRecord>> getAllCallRecords() {
        return ResponseEntity.ok(callRecordRepository.findAll());
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<CallRecord>> getCallRecordsByLead(@PathVariable Long leadId) {
        return ResponseEntity.ok(callRecordRepository.findByLeadId(leadId));
    }

    @GetMapping("/counselor/{counselorId}")
    public ResponseEntity<List<CallRecord>> getCallRecordsByCounselor(@PathVariable Long counselorId) {
        return ResponseEntity.ok(callRecordRepository.findByCounselorId(counselorId));
    }

    @PostMapping
    public ResponseEntity<CallRecord> createCallRecord(@Valid @RequestBody CallRecord callRecord) {
        callRecord.setId(null);
        return ResponseEntity.ok(callRecordRepository.save(callRecord));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCallRecord(@PathVariable Long id) {
        if (!callRecordRepository.existsById(id)) return ResponseEntity.notFound().build();
        callRecordRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
