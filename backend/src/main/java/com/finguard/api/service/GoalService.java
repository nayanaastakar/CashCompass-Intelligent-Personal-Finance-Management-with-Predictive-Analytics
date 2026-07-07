package com.finguard.api.service;

import com.finguard.api.model.Goal;
import com.finguard.api.repository.GoalRepository;
import com.finguard.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public List<Goal> getAllGoalsForUser(Long userId) {
        return goalRepository.findByUserId(userId);
    }

    public Goal addGoal(Long userId, Goal goalRequest) {
        goalRequest.setUser(userRepository.findById(userId).orElseThrow());
        return goalRepository.save(goalRequest);
    }

    public Goal updateGoal(Long id, Long userId, Goal updated) {
        Goal goal = goalRepository.findById(id).orElseThrow();
        if (!goal.getUser().getId().equals(userId)) {
            throw new RuntimeException("Goal does not belong to current user");
        }
        goal.setName(updated.getName());
        goal.setTargetAmount(updated.getTargetAmount());
        goal.setCurrentAmount(updated.getCurrentAmount());
        goal.setTargetDate(updated.getTargetDate());
        return goalRepository.save(goal);
    }

    public void deleteGoal(Long id, Long userId) {
        Goal goal = goalRepository.findById(id).orElseThrow();
        if (!goal.getUser().getId().equals(userId)) {
            throw new RuntimeException("Goal does not belong to current user");
        }
        goalRepository.delete(goal);
    }
}