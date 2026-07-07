import { backendApi } from '../api/axiosConfig';

export const exportPDF = async (summary, forecast, setExporting) => {
  setExporting(true);
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, M = 18, CW = W - M * 2;
    let y = 0;

    const C = {
      brand: [37, 99, 235], dark: [15, 23, 42], mid: [71, 85, 105], light: [148, 163, 184],
      muted: [241, 245, 249], green: [22, 163, 74], amber: [217, 119, 6], red: [220, 38, 38],
      indigo: [79, 70, 229], teal: [20, 184, 166], white: [255, 255, 255],
    };

    const setFC   = (c) => doc.setTextColor(...c);
    const setFill = (c) => doc.setFillColor(...c);
    const setDraw = (c) => doc.setDrawColor(...c);
    const bold    = (sz) => { doc.setFont('helvetica', 'bold');   doc.setFontSize(sz); };
    const normal  = (sz) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(sz); };
    const italic  = (sz) => { doc.setFont('helvetica', 'italic'); doc.setFontSize(sz); };
    const fmtRs   = (n)  => `Rs. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    const addFooter = () => {
      setDraw(C.muted); doc.setLineWidth(0.3); doc.line(M, 287, W - M, 287);
      italic(7); setFC(C.light);
      doc.text('FinGuard AI - Confidential Financial Report', M, 291);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, W - M, 291, { align: 'right' });
    };

    const newPage = () => { doc.addPage(); addFooter(); y = 20; };
    const checkPage = (needed = 20) => { if (y + needed > 278) newPage(); };

    const sectionHeader = (title) => {
      checkPage(14);
      setFill(C.brand); doc.roundedRect(M, y, CW, 9, 2, 2, 'F');
      bold(10); setFC(C.white); doc.text(title, M + 4, y + 6.2);
      y += 14;
    };

    const subHeader = (title) => {
      checkPage(12);
      bold(9); setFC(C.brand); doc.text(title, M, y); y += 5;
      setDraw(C.brand); doc.setLineWidth(0.4);
      doc.line(M, y, M + doc.getTextWidth(title) + 2, y); y += 5;
    };

    const kpiRow = (label, value, color = C.dark) => {
      checkPage(9);
      normal(9); setFC(C.mid); doc.text(label, M + 2, y);
      bold(9); setFC(color); doc.text(String(value), M + CW * 0.55, y);
      setDraw(C.muted); doc.setLineWidth(0.2); doc.line(M, y + 2, M + CW, y + 2);
      y += 8;
    };

    const textBlock = (text, indent = 0) => {
      const lines = doc.splitTextToSize(text, CW - indent);
      checkPage(lines.length * 5 + 3);
      normal(9); setFC(C.mid); doc.text(lines, M + indent, y);
      y += lines.length * 5 + 3;
    };

    const bullet = (text, color = C.indigo) => {
      const lines = doc.splitTextToSize(text, CW - 9);
      checkPage(lines.length * 5 + 3);
      setFill(color); doc.circle(M + 3, y - 1, 1, 'F');
      normal(9); setFC(C.mid); doc.text(lines, M + 7, y);
      y += lines.length * 5 + 3;
    };

    const adviceBox = (text, bg, fg) => {
      const lines = doc.splitTextToSize(text, CW - 8);
      checkPage(lines.length * 5 + 12);
      setFill(bg); setDraw(bg); doc.roundedRect(M, y, CW, lines.length * 5 + 9, 3, 3, 'F');
      normal(9); setFC(fg); doc.text(lines, M + 4, y + 7);
      y += lines.length * 5 + 13;
    };

    // ── PAGE 1: Cover ──────────────────────────────────────────────────────
    setFill(C.brand); doc.rect(0, 0, W, 68, 'F');
    bold(28); setFC(C.white); doc.text('FinGuard AI', M, 32);
    normal(12); setFC([199, 210, 254]); doc.text('Comprehensive Financial Report', M, 43);
    italic(9);  setFC([165, 180, 252]);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}`, M, 53);
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    bold(10); setFC(C.white); doc.text(`Prepared for: ${u.name || 'Account Holder'}`, M, 63);

    y = 82;
    bold(11); setFC(C.dark); doc.text('Report Contents', M, y); y += 9;
    [
      '1.  Key Financial Metrics',
      '2.  AI Stability Score & Analysis',
      '3.  Monthly Income & Expense Breakdown',
      '4.  Expense by Category',
      '5.  AI Cash Flow Forecast',
      '6.  Net Worth Summary',
      '7.  Family Stability Hub',
      '8.  My Future Plans',
      '9.  Personalised Financial Advice',
      '10. 30-Day Action Plan',
    ].forEach(item => {
      setFill(C.muted); doc.roundedRect(M, y, CW, 7, 1.5, 1.5, 'F');
      normal(8); setFC(C.dark); doc.text(item, M + 4, y + 4.8); y += 9;
    });

    y += 6;
    const dlines = doc.splitTextToSize(
      'This report is AI-generated for informational purposes only and does not constitute financial advice. Consult a certified financial planner before making investment decisions.',
      CW - 8
    );
    setFill([254, 252, 232]); setDraw([253, 224, 71]); doc.setLineWidth(0.4);
    doc.roundedRect(M, y, CW, dlines.length * 5 + 10, 3, 3, 'FD');
    bold(8); setFC([146, 64, 14]); doc.text('Disclaimer', M + 4, y + 6);
    normal(7); setFC([120, 53, 15]); doc.text(dlines, M + 4, y + 11);
    y += dlines.length * 5 + 14;
    addFooter();

    // ── PAGE 2: Key Metrics + AI Score ────────────────────────────────────
    newPage();
    sectionHeader('1.  Key Financial Metrics');
    if (summary) {
      const sc = summary.stabilityScore || 0;
      const sc_c = sc >= 70 ? C.green : sc >= 40 ? C.amber : C.red;
      kpiRow('Total Income (All Time)',     fmtRs(summary.totalIncome),   C.green);
      kpiRow('Total Expenses (All Time)',   fmtRs(summary.totalExpense),  C.red);
      kpiRow('Net Worth (Assets - Liab.)',  fmtRs(summary.netWorth),      (summary.netWorth || 0) >= 0 ? C.green : C.red);
      kpiRow('Monthly Cash Surplus',        fmtRs(summary.cashFlow),      (summary.cashFlow || 0) >= 0 ? C.green : C.red);
      kpiRow('Savings Rate',                summary.savingsRate != null ? `${Number(summary.savingsRate).toFixed(1)}%` : 'N/A', C.teal);
      kpiRow('Total Assets',                fmtRs(summary.totalAssets),   C.green);
      kpiRow('Total Liabilities',           fmtRs(summary.totalLiabilities), C.red);
      if (summary.debtToIncomeRatio != null) {
        kpiRow('Debt-to-Income Ratio', `${Number(summary.debtToIncomeRatio).toFixed(1)}%`,
          (summary.debtToIncomeRatio || 0) < 35 ? C.green : (summary.debtToIncomeRatio || 0) < 50 ? C.amber : C.red);
      }
      kpiRow('AI Stability Score',          `${sc}/100`, sc_c);
      kpiRow('Risk Outlook',                summary.weatherForecast || 'N/A', C.brand);
    } else {
      textBlock('Summary data unavailable. Add income and expense records first.');
    }

    y += 5;
    sectionHeader('2.  AI Stability Score & Analysis');
    const sc = summary?.stabilityScore || 0;
    const sc_c = sc >= 70 ? C.green : sc >= 40 ? C.amber : C.red;
    checkPage(18);
    bold(9); setFC(C.dark); doc.text(`Score: ${sc}/100`, M, y); y += 5;
    setFill(C.muted); doc.roundedRect(M, y, CW, 6, 3, 3, 'F');
    setFill(sc_c); doc.roundedRect(M, y, CW * (sc / 100), 6, 3, 3, 'F');
    y += 10;
    bold(9); setFC(sc_c); doc.text(sc >= 70 ? 'Financially Stable' : sc >= 40 ? 'Needs Attention' : 'At Risk', M, y); y += 7;
    if (summary?.scoreExplanation) {
      summary.scoreExplanation.split('\n').filter(l => l.trim()).forEach(p => textBlock(p));
    }

    // ── PAGE 3: Monthly Breakdown + Expense Category ──────────────────────
    newPage();
    sectionHeader('3.  Monthly Income & Expense Breakdown');
    if (summary?.monthlyTrend) {
      const entries = Object.entries(summary.monthlyTrend);
      setFill(C.brand); doc.roundedRect(M, y, CW, 7, 1, 1, 'F');
      bold(8); setFC(C.white);
      doc.text('Month', M + 3, y + 5);
      doc.text('Income', M + 65, y + 5);
      doc.text('Expense', M + 100, y + 5);
      doc.text('Surplus', M + 140, y + 5);
      y += 9;
      entries.slice(-12).forEach(([month, v], i) => {
        const sur = (v.income || 0) - (v.expense || 0);
        if (i % 2 === 0) { setFill(C.muted); doc.rect(M, y - 4, CW, 7, 'F'); }
        normal(8); setFC(C.dark); doc.text(month, M + 3, y + 1);
        setFC(C.green);  doc.text(fmtRs(v.income || 0),  M + 62,  y + 1, { align: 'right' });
        setFC(C.red);    doc.text(fmtRs(v.expense || 0), M + 105, y + 1, { align: 'right' });
        setFC(sur >= 0 ? C.green : C.red); doc.text(fmtRs(sur), M + 145, y + 1, { align: 'right' });
        y += 7;
      });
      y += 5;
    }

    sectionHeader('4.  Expense by Category');
    if (summary?.expenseByCategory && Object.keys(summary.expenseByCategory).length > 0) {
      const cats = Object.entries(summary.expenseByCategory).sort((a, b) => b[1] - a[1]);
      const total = cats.reduce((s, [, v]) => s + v, 0);
      cats.forEach(([cat, val]) => {
        checkPage(9);
        const pct = total > 0 ? (val / total * 100) : 0;
        normal(8); setFC(C.mid); doc.text(cat, M + 2, y);
        setFC(C.dark); doc.text(fmtRs(val), M + 80, y);
        setFC(C.light); doc.text(`${pct.toFixed(1)}%`, M + 120, y);
        setFill(C.muted); doc.roundedRect(M + 140, y - 4, 44, 5, 2, 2, 'F');
        setFill(C.brand); doc.roundedRect(M + 140, y - 4, 44 * (pct / 100), 5, 2, 2, 'F');
        y += 8;
      });
    } else {
      textBlock('No expense category data available.');
    }

    // ── PAGE 4: Forecast + Net Worth ──────────────────────────────────────
    newPage();
    sectionHeader('5.  AI Cash Flow Forecast');
    if (forecast?.predictions) {
      const p = forecast.predictions;
      [['Next 1 Month', p.next_1_month], ['Next 3 Months', p.next_3_months], ['Next 6 Months', p.next_6_months]].forEach(([lbl, d]) => {
        if (!d) return;
        subHeader(lbl);
        const sur = (d.income || 0) - (d.expense || 0);
        kpiRow('Predicted Income',  fmtRs(d.income),  C.green);
        kpiRow('Predicted Expense', fmtRs(d.expense), C.red);
        kpiRow('Predicted Surplus', fmtRs(sur), sur >= 0 ? C.green : C.red);
        y += 2;
      });
      if (forecast.guardian_alert) adviceBox(`Guardian Alert: ${forecast.guardian_alert}`, [239, 246, 255], C.brand);
      if (forecast.predicted_cash_flow != null) {
        kpiRow('Overall Predicted Cash Flow', fmtRs(forecast.predicted_cash_flow), forecast.predicted_cash_flow >= 0 ? C.green : C.red);
      }
    } else {
      textBlock('Forecast unavailable. Ensure the AI service is running.');
    }

    y += 4;
    sectionHeader('6.  Net Worth Summary');
    kpiRow('Total Assets',      fmtRs(summary?.totalAssets),      C.green);
    kpiRow('Total Liabilities', fmtRs(summary?.totalLiabilities), C.red);
    kpiRow('Net Worth',         fmtRs(summary?.netWorth), (summary?.netWorth || 0) >= 0 ? C.green : C.red);

    // ── PAGE 5: Family Hub ────────────────────────────────────────────────
    newPage();
    sectionHeader('7.  Family Stability Hub');
    let fam = null;
    try { const fr = await backendApi.get(`/family/stability/${u.id}`); fam = fr.data; } catch { /* optional */ }

    if (fam) {
      kpiRow('Stability Score',          `${fam.stabilityScore}/100`, C.brand);
      kpiRow('Stability Level',          fam.stabilityLevel || 'N/A', C.dark);
      kpiRow('Risk Level',               fam.riskLevel || 'N/A', fam.riskLevel === 'Low' ? C.green : fam.riskLevel === 'Medium' ? C.amber : C.red);
      kpiRow('Risk Reason',              fam.riskReason || 'N/A', C.mid);
      kpiRow('Survival Days',            `${fam.survivalDays} days`, C.dark);
      kpiRow('Emergency Savings Needed', fmtRs(fam.emergencySavingsRequired), C.red);
      kpiRow('Emergency Readiness',      `${fam.emergencyReadinessScore}/100`, fam.emergencyReadinessScore >= 70 ? C.green : C.amber);
      const fi = JSON.parse(fam.familyInfoJson || '{}');
      kpiRow('Child Education Ready',    fam.childReady ? 'Yes - On Track' : 'No - Gap Detected', fam.childReady ? C.green : C.red);
      if (Number(fi.childSavedAmount) > 0) {
        kpiRow('Dedicated Child Savings', fmtRs(fi.childSavedAmount), C.green);
        if (fi.childSavedLocation) kpiRow('Saved At', fi.childSavedLocation, C.mid);
      }
      if (!fam.childReady && fam.monthlySavingsNeeded > 0) {
        kpiRow('Monthly Savings for Education', fmtRs(fam.monthlySavingsNeeded), C.amber);
      }
      if (fam.marriageCostEstimate > 0) {
        y += 3; subHeader('Marriage Plan');
        kpiRow('Wedding Target',      fmtRs(fam.marriageCostEstimate), C.brand);
        if (Number(fi.marriageSavedAmount) > 0) {
          kpiRow('Dedicated Wedding Savings', fmtRs(fi.marriageSavedAmount), C.green);
          if (fi.marriageSavedLocation) kpiRow('Saved At', fi.marriageSavedLocation, C.mid);
        }
        kpiRow('Marriage Plan Score', `${fam.marriagePlanScore}/100`,  C.brand);
        kpiRow('Months to Save',      fam.monthsToSaveForMarriage > 0 ? `${fam.monthsToSaveForMarriage} months` : 'Goal Met!', fam.monthsToSaveForMarriage === 0 ? C.green : C.amber);
      }
      if (fam.recommendations?.length) {
        y += 3; subHeader('AI Family Recommendations');
        fam.recommendations.forEach(r => bullet(r, C.indigo));
      }

      // Future Plans
      try {
        const fi = JSON.parse(fam.familyInfoJson || '{}');
        const plans = fi.futurePlans || [];
        if (plans.length > 0) {
          y += 4;
          sectionHeader('8.  My Future Plans');
          plans.forEach(plan => {
            const mo = plan.timelineMonths > 0 ? Math.ceil(plan.targetAmount / plan.timelineMonths) : plan.targetAmount;
            checkPage(24);
            setFill(C.muted); doc.roundedRect(M, y, CW, 18, 2, 2, 'F');
            bold(9); setFC(C.dark); doc.text(`${plan.emoji || ''}  ${plan.title}`, M + 3, y + 6);
            const pr = plan.priority === 'High' ? C.red : plan.priority === 'Low' ? C.green : C.amber;
            bold(8); setFC(pr); doc.text(plan.priority, W - M - 3, y + 6, { align: 'right' });
            normal(8); setFC(C.mid);
            doc.text(`Target: ${fmtRs(plan.targetAmount)}   |   Timeline: ${plan.timelineMonths} months`, M + 3, y + 11.5);
            setFC(C.indigo); doc.text(`Monthly saving needed: ${fmtRs(mo)}/mo`, M + 3, y + 16.5);
            y += 22;
            if (plan.notes) {
              italic(7); setFC(C.light);
              const nl = doc.splitTextToSize(plan.notes, CW - 4);
              doc.text(nl, M + 3, y); y += nl.length * 4 + 2;
            }
          });
        }
      } catch { /* noop */ }
    } else {
      textBlock('Family stability data not available. Visit the Family Hub to set up your details.');
    }

    // ── PAGE 6: Personalised Advice ───────────────────────────────────────
    newPage();
    sectionHeader('9.  Personalised Financial Advice');
    const savRate = summary?.savingsRate || 0;
    const dti     = summary?.debtToIncomeRatio || 0;
    const nw      = summary?.netWorth || 0;
    const cf      = summary?.cashFlow || 0;
    const er      = fam?.emergencyReadinessScore || 0;

    subHeader('Cash Flow & Budget');
    if (cf >= 0) {
      adviceBox(`Your monthly surplus of ${fmtRs(cf)} is positive! Automate transfers to a high-yield savings account or SIP mutual fund on the 1st of every month to make your money work before you spend it.`, [240, 253, 244], C.green);
    } else {
      adviceBox(`Expenses exceed income by ${fmtRs(Math.abs(cf))}. This is urgent. Review all fixed costs, cancel unused subscriptions, and aim to cut discretionary spending by at least 15% this month.`, [254, 242, 242], C.red);
    }

    checkPage(25); subHeader('Savings Rate');
    if (savRate >= 30) {
      adviceBox(`Excellent savings rate of ${savRate.toFixed(1)}%! You are saving above the recommended 20-30%. Channel the extra into long-term equity mutual funds, PPF, or NPS for compounding wealth and tax benefits.`, [240, 253, 244], C.green);
    } else if (savRate >= 20) {
      adviceBox(`Savings rate of ${savRate.toFixed(1)}% meets the minimum recommendation. Increase by 2-3% each quarter using "pay yourself first" — automate a transfer before expenses are deducted.`, [255, 251, 235], C.amber);
    } else {
      adviceBox(`Savings rate of ${savRate.toFixed(1)}% is below the recommended 20%. Create a zero-based budget — assign every rupee a purpose. Cut discretionary spending by 20% this month.`, [254, 242, 242], C.red);
    }

    checkPage(25); subHeader('Debt Management');
    if (dti < 20) {
      adviceBox(`Debt-to-income ratio of ${dti.toFixed(1)}% is excellent (below 20%). You have capacity for a home loan if needed, or invest more aggressively in growth equity assets.`, [240, 253, 244], C.green);
    } else if (dti < 40) {
      adviceBox(`Debt-to-income ratio of ${dti.toFixed(1)}% is moderate. Avoid new loans. Use the avalanche method — pay the highest-interest debt first to save significantly on interest.`, [255, 251, 235], C.amber);
    } else {
      adviceBox(`Debt-to-income ratio of ${dti.toFixed(1)}% is dangerously high (above 40%). Consider debt consolidation, negotiate lower EMI rates, and pause all non-essential spending until DTI drops below 35%.`, [254, 242, 242], C.red);
    }

    checkPage(25); subHeader('Emergency Fund');
    if (er >= 70) {
      adviceBox(`Emergency fund is in great shape (${er}/100)! Maintain it and invest your surplus. Review annually to adjust for inflation.`, [240, 253, 244], C.green);
    } else if (er >= 40) {
      adviceBox(`Emergency fund score of ${er}/100 is partial. Target 6 months of expenses in a liquid FD or savings account before increasing equity investments.`, [255, 251, 235], C.amber);
    } else {
      adviceBox(`Emergency fund score is critically low at ${er}/100. Pause investments temporarily and build a fund covering 3-6 months of expenses. Use a liquid mutual fund or FD for easy access.`, [254, 242, 242], C.red);
    }

    checkPage(22); subHeader('Net Worth & Investments');
    if (nw > 0) {
      bullet(`Net worth is positive (${fmtRs(nw)}). Diversify: Equity 60%, Debt 20%, Gold 10%, Real Estate/REITs 10%.`, C.green);
      bullet('Step up SIP investments by 10% every year to harness the power of compounding.', C.teal);
      bullet('Review and rebalance your portfolio every 6 months.', C.teal);
    } else {
      bullet('Net worth is negative — liabilities exceed assets. Focus on paying down debt before acquiring new assets.', C.red);
      bullet('Set a 12-month goal to bring net worth to zero, then grow positively.', C.amber);
    }

    checkPage(30); subHeader('Insurance & Tax Planning');
    bullet('Term insurance: ensure cover of at least 15-20x your annual income.', C.indigo);
    bullet('Health insurance: minimum Rs. 10-20 lakh floater policy for the entire family.', C.indigo);
    bullet('Maximise Section 80C (PPF, ELSS, life insurance premiums) — up to Rs. 1.5 lakh/year.', C.indigo);
    bullet('Use NPS for additional Rs. 50,000 deduction under Section 80CCD(1B).', C.indigo);
    bullet('File ITR on time to maintain a clean credit history and loan eligibility.', C.indigo);

    // ── PAGE 7: Action Plan ───────────────────────────────────────────────
    newPage();
    sectionHeader('10.  Your Personalised Action Plan');

    const actions = [
      {
        tf: 'This Week', c: C.red, items: [
          cf < 0 ? 'List all monthly expenses — identify 3 items to eliminate immediately.' : 'Set up auto-transfer of monthly surplus to a dedicated savings account.',
          er < 40 ? 'Open a liquid mutual fund or FD and deposit at least Rs. 5,000 as your emergency fund start.' : 'Check emergency fund balance and top up by 5% for inflation.',
          'Download last 3 months bank statements and categorise every expense.',
        ]
      },
      {
        tf: 'This Month', c: C.amber, items: [
          savRate < 20 ? 'Create a zero-based budget — assign every rupee before the month starts.' : 'Increase SIP amount by Rs. 500-1,000 this month.',
          dti > 40 ? 'Call your bank — explore EMI restructuring or balance transfer to reduce interest burden.' : 'Open a PPF account if not already done — Rs. 500 minimum/year.',
          fam?.marriageCostEstimate > 0 ? `Start a dedicated recurring deposit for your wedding goal of ${fmtRs(fam.marriageCostEstimate)}.` : 'Set at least one specific goal in the Goal Planner.',
        ]
      },
      {
        tf: 'Next 3 Months', c: C.green, items: [
          'Review all insurance policies: term life, health, vehicle. Fill gaps immediately.',
          'Consult a tax advisor — maximise 80C, 80D, and 80CCD before March 31.',
          nw < 0 ? 'Set up a debt payoff calendar and follow it strictly.' : 'Rebalance portfolio across equity, debt, and gold.',
          'Run the AI Scenario Simulator to stress-test your financial plans.',
        ]
      },
      {
        tf: 'Next 6-12 Months', c: C.brand, items: [
          'Target savings rate of at least 25% of monthly income.',
          er < 70 ? 'Complete emergency fund to cover 6 months of expenses before increasing investments.' : 'Step up SIP investments by 10% — compounding works best with time.',
          'Review and update Family Hub targets every 6 months.',
          'Consider a professional review with a SEBI-registered fee-only financial planner.',
          'Track net worth monthly and celebrate milestone improvements.',
        ]
      },
    ];

    actions.forEach(({ tf, c, items }) => {
      checkPage(items.length * 8 + 16);
      setFill(c); doc.roundedRect(M, y, 55, 7, 2, 2, 'F');
      bold(8); setFC(C.white); doc.text(tf, M + 3, y + 5); y += 11;
      items.forEach(item => bullet(item, c)); y += 4;
    });

    // Motivational close
    checkPage(28);
    setFill([238, 242, 255]); setDraw([199, 210, 254]);
    doc.setLineWidth(0.5); doc.roundedRect(M, y, CW, 24, 4, 4, 'FD');
    bold(10); setFC(C.brand);
    doc.text('"Financial freedom is available to those who learn about it and work for it."', M + CW / 2, y + 9, { align: 'center' });
    italic(8); setFC(C.mid); doc.text('— Robert Kiyosaki', M + CW / 2, y + 16, { align: 'center' });
    normal(7); setFC(C.light); doc.text('Powered by FinGuard AI  |  finguard.ai', M + CW / 2, y + 22, { align: 'center' });

    doc.save(`FinGuard_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    console.error('PDF export error:', err);
    alert('PDF generation failed: ' + err.message);
  }
  setExporting(false);
};
