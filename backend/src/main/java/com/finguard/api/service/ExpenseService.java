package com.finguard.api.service;

import com.finguard.api.model.Expense;
import com.finguard.api.repository.ExpenseRepository;
import com.finguard.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public List<Expense> getAllExpensesForUser(Long userId) {
        return expenseRepository.findByUserIdOrderByDateIncurredDesc(userId);
    }

    public Expense addExpense(Long userId, Expense expenseRequest) {
        expenseRequest.setUser(userRepository.findById(userId).orElseThrow());
        return expenseRepository.save(expenseRequest);
    }

    public Expense updateExpense(Long id, Long userId, Expense updated) {
        Expense expense = expenseRepository.findById(id).orElseThrow();
        if (!expense.getUser().getId().equals(userId)) {
            throw new RuntimeException("Expense record does not belong to current user");
        }
        expense.setCategory(updated.getCategory());
        expense.setAmount(updated.getAmount());
        expense.setDateIncurred(updated.getDateIncurred());
        expense.setDescription(updated.getDescription());
        return expenseRepository.save(expense);
    }

    public void deleteExpense(Long id, Long userId) {
        Expense expense = expenseRepository.findById(id).orElseThrow();
        if (!expense.getUser().getId().equals(userId)) {
            throw new RuntimeException("Expense record does not belong to current user");
        }
        expenseRepository.delete(expense);
    }
}