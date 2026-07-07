package com.finguard.api.config;

import com.finguard.api.model.*;
import com.finguard.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Seeds a demo user with 12 months of sample financial data on startup.
 * This provides realistic data for AI forecasting, scoring, and charts.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final AssetRepository assetRepository;
    private final LiabilityRepository liabilityRepository;
    private final GoalRepository goalRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        boolean demoExists = userRepository.existsByEmail("demo@finguard.ai");
        if (!demoExists) {
            log.info("Seeding 12-month demo financial dataset...");

            // Create demo user
            User demo = User.builder()
                .name("Demo User")
                .email("demo@finguard.ai")
                .password(passwordEncoder.encode("demo1234"))
                .age(28)
                .familySize(2)
                .employmentType(User.EmploymentType.FREELANCER)
                .build();
            userRepository.save(demo);
            seedFinancialDataForUser(demo, 1.0);
            log.info("✅ Demo data seeded successfully! Login: demo@finguard.ai / demo1234");
        } else {
            log.info("Demo user already exists; skipping demo data seeding.");
        }

        // Additional seeded users for login/testing
        if (!userRepository.existsByEmail("sana@gmail.com")) {
            User sana = User.builder()
                .name("Sana")
                .email("sana@gmail.com")
                .password(passwordEncoder.encode("SanaPass1!"))
                .age(32)
                .familySize(1)
                .employmentType(User.EmploymentType.SALARIED)
                .build();
            userRepository.save(sana);
            seedFinancialDataForUser(sana, 1.5); // slightly higher income/expenses
        }

        if (!userRepository.existsByEmail("nayana@gmail.com")) {
            User nayana = User.builder()
                .name("Nayana")
                .email("nayana@gmail.com")
                .password(passwordEncoder.encode("NayanaPass2!"))
                .age(35)
                .familySize(3)
                .employmentType(User.EmploymentType.BUSINESS_OWNER)
                .build();
            userRepository.save(nayana);
            seedFinancialDataForUser(nayana, 2.0); // even higher
        }

        if (!userRepository.existsByEmail("poornima@gmail.com")) {
            User poornima = User.builder()
                .name("Poornima")
                .email("poornima@gmail.com")
                .password(passwordEncoder.encode("PoornimaPass3!"))
                .age(29)
                .familySize(4)
                .employmentType(User.EmploymentType.SELF_EMPLOYED)
                .build();
            userRepository.save(poornima);
            seedFinancialDataForUser(poornima, 1.2);
        }

        log.info("✅ Additional seeded accounts available: sana@gmail.com, nayana@gmail.com, poornima@gmail.com");
    }

    private void seedFinancialDataForUser(User user, double multiplier) {
        // 12 months of sample income (variable - simulates freelancer)
        double[] incomeAmounts = {52000, 45000, 61000, 38000, 70000, 55000, 48000, 66000, 42000, 74000, 58000, 63000};
        String[] sources = {"Client Project A", "Upwork Gig", "Consulting Fee", "Client Project B", "Fiverr", "Client Project C",
            "Referral Work", "Remote Contract", "Freelance Design", "App Development", "Content Writing", "SaaS Subscription"};

        for (int i = 0; i < 12; i++) {
            LocalDate date = LocalDate.now().minusMonths(11 - i).withDayOfMonth(1);
            incomeRepository.save(Income.builder()
                .user(user)
                .amount(BigDecimal.valueOf(incomeAmounts[i] * multiplier))
                .source(sources[i])
                .description("Monthly income for " + date.getMonth().name())
                .dateReceived(date)
                .build());
        }

        // 12 months of sample expenses by category
        String[][] expenseCats = {
            {"Rent", "Food", "Transport"},
            {"Rent", "Food", "Entertainment"},
            {"Rent", "Food", "Utilities"},
            {"Rent", "Food", "Medical"},
            {"Rent", "Food", "Transport"},
            {"Rent", "Food", "Shopping"},
            {"Rent", "Food", "Utilities"},
            {"Rent", "Food", "Education"},
            {"Rent", "Food", "Transport"},
            {"Rent", "Food", "Entertainment"},
            {"Rent", "Food", "Utilities"},
            {"Rent", "Food", "Shopping"},
        };
        double[][] expenseAmounts = {
            {18000, 8000, 3000},
            {18000, 7500, 4500},
            {18000, 8500, 2500},
            {18000, 7000, 9000},
            {18000, 8000, 3500},
            {18000, 8000, 6000},
            {18000, 7500, 2500},
            {18000, 8000, 12000},
            {18000, 7000, 3500},
            {18000, 8500, 5000},
            {18000, 7500, 2500},
            {18000, 8000, 7000},
        };

        for (int i = 0; i < 12; i++) {
            LocalDate date = LocalDate.now().minusMonths(11 - i).withDayOfMonth(5);
            for (int j = 0; j < 3; j++) {
                expenseRepository.save(Expense.builder()
                    .user(user)
                    .amount(BigDecimal.valueOf(expenseAmounts[i][j] * multiplier))
                    .category(expenseCats[i][j])
                    .description(expenseCats[i][j] + " expense")
                    .dateIncurred(date.plusDays(j * 3))
                    .build());
            }
        }

        // Assets
        assetRepository.save(Asset.builder().user(user).name("Savings Account").value(BigDecimal.valueOf(85000 * multiplier)).type("Liquid").build());
        assetRepository.save(Asset.builder().user(user).name("Mutual Fund Portfolio").value(BigDecimal.valueOf(150000 * multiplier)).type("Investment").build());
        assetRepository.save(Asset.builder().user(user).name("Laptop & Equipment").value(BigDecimal.valueOf(45000 * multiplier)).type("Fixed").build());

        // Liabilities
        liabilityRepository.save(Liability.builder().user(user).name("Education Loan").amount(BigDecimal.valueOf(120000 * multiplier)).interestRate(BigDecimal.valueOf(8.5)).build());
        liabilityRepository.save(Liability.builder().user(user).name("Credit Card Balance").amount(BigDecimal.valueOf(18000 * multiplier)).interestRate(BigDecimal.valueOf(14.0)).build());

        // Goals
        goalRepository.save(Goal.builder().user(user).name("Emergency Fund (6 months)").targetAmount(BigDecimal.valueOf(180000 * multiplier)).currentAmount(BigDecimal.valueOf(85000 * multiplier)).targetDate(LocalDate.now().plusMonths(6)).build());
        goalRepository.save(Goal.builder().user(user).name("House Down Payment").targetAmount(BigDecimal.valueOf(500000 * multiplier)).currentAmount(BigDecimal.valueOf(50000 * multiplier)).targetDate(LocalDate.now().plusYears(2)).build());
        goalRepository.save(Goal.builder().user(user).name("Vacation Fund").targetAmount(BigDecimal.valueOf(60000 * multiplier)).currentAmount(BigDecimal.valueOf(22000 * multiplier)).targetDate(LocalDate.now().plusMonths(8)).build());
    }
}
