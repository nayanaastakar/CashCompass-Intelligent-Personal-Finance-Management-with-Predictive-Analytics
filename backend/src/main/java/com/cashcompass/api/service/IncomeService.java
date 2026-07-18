package com.cashcompass.api.service;

import com.cashcompass.api.model.Income;
import com.cashcompass.api.repository.IncomeRepository;
import com.cashcompass.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;

    public List<Income> getAllIncomesForUser(Long userId) {
        return incomeRepository.findByUserIdOrderByDateReceivedDesc(userId);
    }

    public Income addIncome(Long userId, Income incomeRequest) {
        incomeRequest.setUser(userRepository.findById(userId).orElseThrow());
        return incomeRepository.save(incomeRequest);
    }

    public Income updateIncome(Long id, Long userId, Income updated) {
        Income income = incomeRepository.findById(id).orElseThrow();
        if (!income.getUser().getId().equals(userId)) {
            throw new RuntimeException("Income record does not belong to current user");
        }
        income.setSource(updated.getSource());
        income.setAmount(updated.getAmount());
        income.setDateReceived(updated.getDateReceived());
        income.setDescription(updated.getDescription());
        return incomeRepository.save(income);
    }

    public void deleteIncome(Long id, Long userId) {
        Income income = incomeRepository.findById(id).orElseThrow();
        if (!income.getUser().getId().equals(userId)) {
            throw new RuntimeException("Income record does not belong to current user");
        }
        incomeRepository.delete(income);
    }
}
