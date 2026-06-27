package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.dto.ObjectiveDTO;
import com.example.gpiApp.entity.KeyResult;
import com.example.gpiApp.entity.Objective;
import com.example.gpiApp.repository.KeyResultRepository;
import com.example.gpiApp.repository.ObjectiveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Tenant-scoped CRUD for OKRs (objectives + their key results). */
@Service
@RequiredArgsConstructor
public class OkrService {

    private final ObjectiveRepository objectiveRepository;
    private final KeyResultRepository keyResultRepository;

    // ── Read ──
    @Transactional(readOnly = true)
    public List<ObjectiveDTO> list() {
        Long org = TenantContext.getOrganizationId();
        List<Objective> objectives = org != null
                ? objectiveRepository.findByOrganizationIdOrderByCreatedAtDesc(org)
                : objectiveRepository.findAll();
        return objectives.stream().map(o -> ObjectiveDTO.builder()
                .id(o.getId()).title(o.getTitle()).description(o.getDescription())
                .period(o.getPeriod()).ownerId(o.getOwnerId()).ownerName(o.getOwnerName())
                .status(o.getStatus()).createdAt(o.getCreatedAt())
                .keyResults(keyResultRepository.findByObjectiveIdOrderByIdAsc(o.getId()))
                .build()).toList();
    }

    // ── Objectives ──
    @Transactional
    public Objective createObjective(Objective o) {
        o.setId(null);
        if (o.getTitle() == null || o.getTitle().isBlank()) throw new IllegalArgumentException("An objective title is required.");
        if (o.getStatus() == null) o.setStatus(Objective.Status.ON_TRACK);
        return objectiveRepository.save(o); // TenantListener stamps the org
    }

    @Transactional
    public Objective updateObjective(Long id, Objective patch) {
        Objective o = getOwnedObjective(id);
        if (patch.getTitle() != null) o.setTitle(patch.getTitle());
        o.setDescription(patch.getDescription());
        o.setPeriod(patch.getPeriod());
        o.setOwnerId(patch.getOwnerId());
        o.setOwnerName(patch.getOwnerName());
        if (patch.getStatus() != null) o.setStatus(patch.getStatus());
        return objectiveRepository.save(o);
    }

    @Transactional
    public void deleteObjective(Long id) {
        Objective o = getOwnedObjective(id);
        keyResultRepository.deleteByObjectiveId(o.getId());
        objectiveRepository.delete(o);
    }

    // ── Key results ──
    @Transactional
    public KeyResult addKeyResult(Long objectiveId, KeyResult kr) {
        getOwnedObjective(objectiveId); // tenant check on the parent
        kr.setId(null);
        kr.setObjectiveId(objectiveId);
        if (kr.getTitle() == null || kr.getTitle().isBlank()) throw new IllegalArgumentException("A key result title is required.");
        return keyResultRepository.save(kr);
    }

    @Transactional
    public KeyResult updateKeyResult(Long krId, KeyResult patch) {
        KeyResult kr = getOwnedKeyResult(krId);
        if (patch.getTitle() != null) kr.setTitle(patch.getTitle());
        if (patch.getStartValue() != null) kr.setStartValue(patch.getStartValue());
        if (patch.getTargetValue() != null) kr.setTargetValue(patch.getTargetValue());
        if (patch.getCurrentValue() != null) kr.setCurrentValue(patch.getCurrentValue());
        kr.setUnit(patch.getUnit());
        return keyResultRepository.save(kr);
    }

    @Transactional
    public void deleteKeyResult(Long krId) {
        keyResultRepository.delete(getOwnedKeyResult(krId));
    }

    // ── Tenant guards ──
    private Objective getOwnedObjective(Long id) {
        Objective o = objectiveRepository.findById(id)
                .orElseThrow(() -> new AccessDeniedException("Objective not found"));
        assertTenant(o.getOrganizationId());
        return o;
    }

    private KeyResult getOwnedKeyResult(Long id) {
        KeyResult kr = keyResultRepository.findById(id)
                .orElseThrow(() -> new AccessDeniedException("Key result not found"));
        assertTenant(kr.getOrganizationId());
        return kr;
    }

    private void assertTenant(Long ownerOrg) {
        Long org = TenantContext.getOrganizationId();
        if (org != null && ownerOrg != null && !org.equals(ownerOrg))
            throw new AccessDeniedException("This item belongs to another organization.");
    }
}
