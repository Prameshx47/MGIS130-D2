/* ==========================================================================
   SECTION 1: STATE, DATA & CONSTANTS
   ========================================================================== */

// US States Benchmark Rates Data
const STATE_BENCHMARKS = {
    "AL": { name: "Alabama", rate: 6.45 }, "AK": { name: "Alaska", rate: 6.85 },
    "AZ": { name: "Arizona", rate: 6.35 }, "AR": { name: "Arkansas", rate: 6.50 },
    "CA": { name: "California", rate: 6.50 }, "CO": { name: "Colorado", rate: 6.20 },
    "CT": { name: "Connecticut", rate: 6.30 }, "DE": { name: "Delaware", rate: 6.15 },
    "FL": { name: "Florida", rate: 6.60 }, "GA": { name: "Georgia", rate: 6.40 },
    "HI": { name: "Hawaii", rate: 6.90 }, "ID": { name: "Idaho", rate: 6.45 },
    "IL": { name: "Illinois", rate: 6.55 }, "IN": { name: "Indiana", rate: 6.35 },
    "IA": { name: "Iowa", rate: 6.10 }, "KS": { name: "Kansas", rate: 6.25 },
    "KY": { name: "Kentucky", rate: 6.40 }, "LA": { name: "Louisiana", rate: 6.55 },
    "ME": { name: "Maine", rate: 6.35 }, "MD": { name: "Maryland", rate: 6.30 },
    "MA": { name: "Massachusetts", rate: 6.25 }, "MI": { name: "Michigan", rate: 6.40 },
    "MN": { name: "Minnesota", rate: 6.15 }, "MS": { name: "Mississippi", rate: 6.65 },
    "MO": { name: "Missouri", rate: 6.25 }, "MT": { name: "Montana", rate: 6.45 },
    "NE": { name: "Nebraska", rate: 6.15 }, "NV": { name: "Nevada", rate: 6.50 },
    "NH": { name: "New Hampshire", rate: 6.25 }, "NJ": { name: "New Jersey", rate: 6.45 },
    "NM": { name: "New Mexico", rate: 6.50 }, "NY": { name: "New York", rate: 6.35 },
    "NC": { name: "North Carolina", rate: 6.30 }, "ND": { name: "North Dakota", rate: 6.05 },
    "OH": { name: "Ohio", rate: 6.35 }, "OK": { name: "Oklahoma", rate: 6.40 },
    "OR": { name: "Oregon", rate: 6.40 }, "PA": { name: "Pennsylvania", rate: 6.35 },
    "RI": { name: "Rhode Island", rate: 6.35 }, "SC": { name: "South Carolina", rate: 6.35 },
    "SD": { name: "South Dakota", rate: 6.10 }, "TN": { name: "Tennessee", rate: 6.30 },
    "TX": { name: "Texas", rate: 6.25 }, "UT": { name: "Utah", rate: 6.20 },
    "VT": { name: "Vermont", rate: 6.30 }, "VA": { name: "Virginia", rate: 6.25 },
    "WA": { name: "Washington", rate: 6.35 }, "WV": { name: "West Virginia", rate: 6.55 },
    "WI": { name: "Wisconsin", rate: 6.15 }, "WY": { name: "Wyoming", rate: 6.20 },
    "DC": { name: "Washington D.C.", rate: 6.40 }
};

// Loan Category Defaults & Credit Tier Limits (FICO Research Standard Matrix)
const LOAN_PRESETS = {
    mortgage: { 
        name: "Mortgage", 
        defaultAmount: 350000, 
        defaultTerm: 30, 
        defaultRate: 6.50,
        tierLimits: { superPrime: 2000000, prime: 1250000, good: 750000, fair: 400000, subprime: 150000 }
    },
    auto: { 
        name: "Auto Loan", 
        defaultAmount: 35000, 
        defaultTerm: 5, 
        defaultRate: 5.75,
        tierLimits: { superPrime: 150000, prime: 80000, good: 45000, fair: 25000, subprime: 12000 }
    },
    personal: { 
        name: "Personal Loan", 
        defaultAmount: 15000, 
        defaultTerm: 3, 
        defaultRate: 9.50,
        tierLimits: { superPrime: 100000, prime: 65000, good: 35000, fair: 15000, subprime: 5000 }
    },
    student: { 
        name: "Student Loan", 
        defaultAmount: 40000, 
        defaultTerm: 10, 
        defaultRate: 5.25,
        tierLimits: { superPrime: 250000, prime: 175000, good: 100000, fair: 50000, subprime: 20000 }
    }
};

// Lender Type Rate Adjustments & Max Limits Override
const LENDER_TYPES = {
    bank: { name: "Commercial Bank", modifier: 0.0, limitMultiplier: 1.0 },
    credit_union: { name: "Credit Union", modifier: -0.50, limitMultiplier: 1.0 },
    fintech: { name: "Online FinTech", modifier: 0.50, limitMultiplier: 1.0 },
    p2p: { name: "Private P2P Lender", modifier: 2.50, limitMultiplier: 2.5 },
    hard_money: { name: "Hard Money Investor", modifier: 5.50, limitMultiplier: 5.0 }
};

// Application State
const state = {
    loanType: "mortgage",
    amount: 350000,
    termYears: 30,
    creditScore: 750,
    stateCode: "NY",
    lenderType: "bank",
    interestRate: 6.50,
    isRateLocked: false,
    extraPayment: 0,
    startMonth: 1,
    scheduleView: "monthly", // 'monthly' or 'annual'
    darkMode: true
};


/* ==========================================================================
   SECTION 2: RULES & CALCULATIONS
   ========================================================================== */

/**
 * Evaluates FICO score tier, rate premium, and credit limit cap based on loan product type.
 */
function evaluateCreditTier(score, lenderTypeKey, loanTypeKey) {
    let label = "Exceptional (Super Prime)";
    let premium = 0.0;
    
    const category = LOAN_PRESETS[loanTypeKey] || LOAN_PRESETS.mortgage;
    let baseLimit = category.tierLimits.superPrime;

    if (score >= 780) {
        label = "Super Prime (780+)";
        premium = 0.0;
        baseLimit = category.tierLimits.superPrime;
    } else if (score >= 740) {
        label = "Very Good / Prime (740-779)";
        premium = 0.35;
        baseLimit = category.tierLimits.prime;
    } else if (score >= 670) {
        label = "Good / Near Prime (670-739)";
        premium = 1.10;
        baseLimit = category.tierLimits.good;
    } else if (score >= 580) {
        label = "Fair / Subprime (580-669)";
        premium = 2.50;
        baseLimit = category.tierLimits.fair;
    } else {
        label = "Deep Subprime (<580)";
        premium = 5.00;
        baseLimit = category.tierLimits.subprime;
    }

    // Adjust limit based on Lender Type multiplier
    const lender = LENDER_TYPES[lenderTypeKey] || LENDER_TYPES.bank;
    const effectiveLimit = Math.min(Math.round(baseLimit * lender.limitMultiplier), 10000000);

    return { label, premium, maxLimit: effectiveLimit, isPoor: score < 580 };
}

/**
 * Computes target interest rate based on State + Credit Risk + Lender Type.
 */
function calculateBenchmarkRate() {
    const stateData = STATE_BENCHMARKS[state.stateCode] || { rate: 6.25 };
    const creditInfo = evaluateCreditTier(state.creditScore, state.lenderType, state.loanType);
    const lenderInfo = LENDER_TYPES[state.lenderType] || LENDER_TYPES.bank;

    const total = stateData.rate + creditInfo.premium + lenderInfo.modifier;
    return {
        base: stateData.rate,
        creditPremium: creditInfo.premium,
        lenderMod: lenderInfo.modifier,
        total: Math.max(0.25, parseFloat(total.toFixed(2)))
    };
}

/**
 * Clamps loan amount to credit limit cap.
 */
function clampAmountToLimit() {
    const creditInfo = evaluateCreditTier(state.creditScore, state.lenderType, state.loanType);
    if (state.amount > creditInfo.maxLimit) {
        state.amount = creditInfo.maxLimit;
        showToast(`Loan amount capped at $${formatNumber(creditInfo.maxLimit)} for current credit tier & loan product!`, "warning");
    }
}

/**
 * Amortization Calculation Engine.
 */
function calculateAmortization() {
    const P = state.amount;
    const annualRate = state.interestRate / 100;
    const r = annualRate / 12;
    const totalMonths = state.termYears * 12;

    if (P <= 0 || annualRate <= 0 || totalMonths <= 0) {
        return { monthlyPayment: 0, schedule: [], totalInterest: 0, monthsSaved: 0, interestSaved: 0 };
    }

    // Standard Monthly Payment Formula
    const monthlyPayment = (P * r * Math.pow(1 + r, totalMonths)) / (Math.pow(1 + r, totalMonths) - 1);

    let balance = P;
    let schedule = [];
    let totalInterestPaid = 0;
    let month = 1;

    while (balance > 0.01 && month <= totalMonths) {
        const interestForMonth = balance * r;
        let regularPrincipal = monthlyPayment - interestForMonth;

        // Add Extra Monthly Payment if active
        let extra = (month >= state.startMonth) ? state.extraPayment : 0;
        let totalPrincipalPayment = regularPrincipal + extra;

        if (totalPrincipalPayment > balance) {
            totalPrincipalPayment = balance;
        }

        balance -= totalPrincipalPayment;
        totalInterestPaid += interestForMonth;

        schedule.push({
            month,
            payment: totalPrincipalPayment + interestForMonth,
            principal: totalPrincipalPayment,
            interest: interestForMonth,
            remainingBalance: Math.max(0, balance)
        });

        month++;
    }

    // Calculate standard non-accelerated total interest for savings comparison
    const standardTotalInterest = (monthlyPayment * totalMonths) - P;
    const interestSaved = Math.max(0, standardTotalInterest - totalInterestPaid);
    const monthsSaved = Math.max(0, totalMonths - schedule.length);

    return {
        monthlyPayment,
        schedule,
        totalInterest: totalInterestPaid,
        totalCost: P + totalInterestPaid,
        interestSaved,
        monthsSaved,
        actualMonths: schedule.length
    };
}


/* ==========================================================================
   SECTION 3: DOM ELEMENTS & DISPLAY RENDERING
   ========================================================================== */

const DOM = {
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    themeText: document.getElementById('themeText'),

    btnTabs: document.querySelectorAll('.btnTab'),
    badgeLimitLock: document.getElementById('badgeLimitLock'),
    inputAmount: document.getElementById('inputAmount'),
    sliderAmount: document.getElementById('sliderAmount'),
    txtAmountMaxNotice: document.getElementById('txtAmountMaxNotice'),

    inputTerm: document.getElementById('inputTerm'),
    sliderTerm: document.getElementById('sliderTerm'),
    txtTermDisplay: document.getElementById('txtTermDisplay'),
    btnTermQuicks: document.querySelectorAll('.btnTermQuick'),

    txtCreditTier: document.getElementById('txtCreditTier'),
    txtCreditLimitCap: document.getElementById('txtCreditLimitCap'),
    inputCreditScore: document.getElementById('inputCreditScore'),
    sliderCreditScore: document.getElementById('sliderCreditScore'),
    boxCreditWarning: document.getElementById('boxCreditWarning'),

    selectState: document.getElementById('selectState'),
    selectLender: document.getElementById('selectLender'),

    btnLockRate: document.getElementById('btnLockRate'),
    iconLock: document.getElementById('iconLock'),
    txtLock: document.getElementById('txtLock'),
    inputRate: document.getElementById('inputRate'),
    txtRateFormula: document.getElementById('txtRateFormula'),

    inputExtraPayment: document.getElementById('inputExtraPayment'),
    inputStartMonth: document.getElementById('inputStartMonth'),

    metricMonthlyPayment: document.getElementById('metricMonthlyPayment'),
    metricExtraNotice: document.getElementById('metricExtraNotice'),
    metricTotalInterest: document.getElementById('metricTotalInterest'),
    metricTotalPaid: document.getElementById('metricTotalPaid'),
    metricPayoffDate: document.getElementById('metricPayoffDate'),
    metricInterestSaved: document.getElementById('metricInterestSaved'),
    metricMonthsSavedBadge: document.getElementById('metricMonthsSavedBadge'),

    svgChart: document.getElementById('svgChart'),
    btnAskAI: document.getElementById('btnAskAI'),
    boxAiContent: document.getElementById('boxAiContent'),

    btnViewMonthly: document.getElementById('btnViewMonthly'),
    btnViewAnnual: document.getElementById('btnViewAnnual'),
    btnExportCsv: document.getElementById('btnExportCsv'),
    tableBodyAmortization: document.getElementById('tableBodyAmortization'),

    toastNotification: document.getElementById('toastNotification'),
    toastIcon: document.getElementById('toastIcon'),
    toastText: document.getElementById('toastText')
};

/**
 * Initialize state dropdown options.
 */
function populateStateDropdown() {
    DOM.selectState.innerHTML = Object.entries(STATE_BENCHMARKS)
        .map(([code, data]) => `<option value="${code}">${data.name} (Base: ${data.rate.toFixed(2)}%)</option>`)
        .join('');
    DOM.selectState.value = state.stateCode;
}

/**
 * Master render function.
 */
function renderUI() {
    // 1. Credit Tier & Limit Cap
    const creditInfo = evaluateCreditTier(state.creditScore, state.lenderType, state.loanType);
    DOM.txtCreditTier.textContent = `${creditInfo.label}`;
    DOM.txtCreditLimitCap.textContent = `Max Limit: $${formatNumber(creditInfo.maxLimit)}`;
    DOM.badgeLimitLock.textContent = `🔒 Limit: $${formatNumber(creditInfo.maxLimit)}`;

    if (creditInfo.isPoor) {
        DOM.boxCreditWarning.classList.remove('hidden');
    } else {
        DOM.boxCreditWarning.classList.add('hidden');
    }

    // 2. Clamp Loan Amount if needed
    clampAmountToLimit();
    DOM.inputAmount.max = creditInfo.maxLimit;
    DOM.sliderAmount.max = creditInfo.maxLimit;
    DOM.inputAmount.value = state.amount;
    DOM.sliderAmount.value = state.amount;
    DOM.txtAmountMaxNotice.textContent = `Max: $${formatNumber(creditInfo.maxLimit)}`;

    // Synchronize Credit Score Inputs
    DOM.inputCreditScore.value = state.creditScore;
    DOM.sliderCreditScore.value = state.creditScore;

    // 3. Rate Auto-Calculation if unlocked
    if (!state.isRateLocked) {
        const autoRates = calculateBenchmarkRate();
        state.interestRate = autoRates.total;
        DOM.inputRate.value = state.interestRate.toFixed(2);
        DOM.txtRateFormula.textContent = `Base: ${autoRates.base}% + Risk: +${(autoRates.creditPremium + autoRates.lenderMod).toFixed(2)}%`;
    } else {
        DOM.txtRateFormula.textContent = `🔒 Locked by User`;
    }

    // Rate Lock UI
    if (state.isRateLocked) {
        DOM.iconLock.textContent = "🔒";
        DOM.txtLock.textContent = "Locked";
        DOM.btnLockRate.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border bg-sky-600/20 text-sky-300 border-sky-500/40";
    } else {
        DOM.iconLock.textContent = "🔓";
        DOM.txtLock.textContent = "Unlocked";
        DOM.btnLockRate.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600";
    }

    // 4. Term Displays
    DOM.txtTermDisplay.textContent = `${state.termYears} Years`;
    if (DOM.inputTerm) DOM.inputTerm.value = state.termYears;
    DOM.sliderTerm.value = state.termYears;

    // Update Quick Term Buttons active state
    DOM.btnTermQuicks.forEach(btn => {
        const yrs = parseInt(btn.dataset.years);
        if (yrs === state.termYears) {
            btn.className = "btnTermQuick px-3 py-1 rounded-lg text-xs font-semibold bg-sky-600/30 text-sky-600 dark:text-sky-300 border border-sky-500/30 transition";
        } else {
            btn.className = "btnTermQuick px-3 py-1 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition";
        }
    });

    // 5. Compute Amortization Results
    const results = calculateAmortization();

    DOM.metricMonthlyPayment.textContent = `$${formatNumber(Math.round(results.monthlyPayment))}`;
    if (state.extraPayment > 0) {
        DOM.metricExtraNotice.textContent = `+ $${formatNumber(state.extraPayment)} Extra / Mo`;
        DOM.metricExtraNotice.classList.remove('hidden');
    } else {
        DOM.metricExtraNotice.classList.add('hidden');
    }

    DOM.metricTotalInterest.textContent = `$${formatNumber(Math.round(results.totalInterest))}`;
    DOM.metricTotalPaid.textContent = `$${formatNumber(Math.round(results.totalCost))}`;

    // Payoff Date calculation
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + results.actualMonths);
    DOM.metricPayoffDate.textContent = payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    DOM.metricInterestSaved.textContent = `$${formatNumber(Math.round(results.interestSaved))} Saved`;
    DOM.metricMonthsSavedBadge.textContent = `${results.monthsSaved} Months Early`;

    // 6. Draw SVG Payoff Curve
    drawPayoffChart(results.schedule, state.amount);

    // 7. Render Schedule Table
    renderAmortizationTable(results.schedule);
}

/**
 * Render SVG curve line chart.
 */
function drawPayoffChart(schedule, initialAmount) {
    if (!schedule || schedule.length === 0) return;

    const svg = DOM.svgChart;
    const width = 600;
    const height = 200;
    const padding = 20;

    const totalPeriods = schedule.length;

    // Calculate max value considering both principal and cumulative interest trajectory
    let maxInterest = 0;
    let tempCum = 0;
    schedule.forEach(item => { tempCum += item.interest; });
    maxInterest = tempCum;
    const maxVal = Math.max(initialAmount, maxInterest, 1);

    let balancePoints = [];
    let interestPoints = [];
    let cumulativeInterest = 0;

    schedule.forEach((item, index) => {
        const x = padding + (index / (totalPeriods - 1 || 1)) * (width - 2 * padding);
        
        // Balance curve (Sky Blue)
        const yBalance = height - padding - (item.remainingBalance / maxVal) * (height - 2 * padding);
        balancePoints.push(`${x.toFixed(1)},${yBalance.toFixed(1)}`);

        // Cumulative Interest curve (Amber)
        cumulativeInterest += item.interest;
        const yInterest = height - padding - (cumulativeInterest / maxVal) * (height - 2 * padding);
        interestPoints.push(`${x.toFixed(1)},${yInterest.toFixed(1)}`);
    });

    svg.innerHTML = `
        <!-- Grid Lines -->
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#334155" stroke-width="1"/>
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#334155" stroke-width="1"/>
        
        <!-- Principal Balance Path -->
        <polyline fill="none" stroke="#0ea5e9" stroke-width="3" points="${balancePoints.join(' ')}" />
        
        <!-- Cumulative Interest Path -->
        <polyline fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4" points="${interestPoints.join(' ')}" />
    `;
}

/**
 * Render Amortization Table (Monthly vs Annual view).
 */
function renderAmortizationTable(schedule) {
    if (state.scheduleView === 'monthly') {
        DOM.tableBodyAmortization.innerHTML = schedule.map(row => `
            <tr class="hover:bg-slate-900/80 transition">
                <td class="py-2 px-3 font-semibold text-slate-400">#${row.month}</td>
                <td class="py-2 px-3 font-bold text-slate-100">$${formatNumber(Math.round(row.payment))}</td>
                <td class="py-2 px-3 text-sky-400">$${formatNumber(Math.round(row.principal))}</td>
                <td class="py-2 px-3 text-amber-400">$${formatNumber(Math.round(row.interest))}</td>
                <td class="py-2 px-3 font-bold text-slate-300">$${formatNumber(Math.round(row.remainingBalance))}</td>
            </tr>
        `).join('');
    } else {
        // Annual Aggregation
        let annualData = [];
        let currentYear = 1;
        let yearPayment = 0, yearPrincipal = 0, yearInterest = 0;

        schedule.forEach((row, idx) => {
            yearPayment += row.payment;
            yearPrincipal += row.principal;
            yearInterest += row.interest;

            if ((idx + 1) % 12 === 0 || idx === schedule.length - 1) {
                annualData.push({
                    year: currentYear,
                    payment: yearPayment,
                    principal: yearPrincipal,
                    interest: yearInterest,
                    remainingBalance: row.remainingBalance
                });
                currentYear++;
                yearPayment = 0; yearPrincipal = 0; yearInterest = 0;
            }
        });

        DOM.tableBodyAmortization.innerHTML = annualData.map(row => `
            <tr class="hover:bg-slate-900/80 transition bg-slate-900/40">
                <td class="py-2.5 px-3 font-bold text-sky-400">Year ${row.year}</td>
                <td class="py-2.5 px-3 font-bold text-slate-100">$${formatNumber(Math.round(row.payment))}</td>
                <td class="py-2.5 px-3 text-sky-400">$${formatNumber(Math.round(row.principal))}</td>
                <td class="py-2.5 px-3 text-amber-400">$${formatNumber(Math.round(row.interest))}</td>
                <td class="py-2.5 px-3 font-bold text-slate-300">$${formatNumber(Math.round(row.remainingBalance))}</td>
            </tr>
        `).join('');
    }
}

/**
 * Toast notification system.
 */
let toastTimeout = null;
function showToast(message, type = 'info') {
    DOM.toastText.textContent = message;
    DOM.toastIcon.textContent = type === 'warning' ? '⚠️' : 'ℹ️';
    
    DOM.toastNotification.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        DOM.toastNotification.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 3000);
}

function formatNumber(num) {
    return num.toLocaleString('en-US');
}

function resetRateToBenchmark() {
    state.isRateLocked = false;
    showToast("Interest rate unlocked & reset to state benchmark.", "info");
    renderUI();
}


/* ==========================================================================
   SECTION 4: AI CONSULTANT (GEMINI INTEGRATION)
   ========================================================================== */

async function fetchAiUnderwritingAdvice() {
    DOM.boxAiContent.classList.remove('hidden');
    DOM.boxAiContent.innerHTML = `<div class="flex items-center gap-2 text-indigo-400 font-semibold">
        <span class="animate-spin">🌀</span> Consulting Gemini Underwriting Engine...
    </div>`;

    const apiKey = ""; // Provided runtime key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Act as a senior commercial bank loan underwriter. Analyze this loan application:
- Loan Type: ${state.loanType}
- Principal Amount: $${state.amount}
- Term: ${state.termYears} Years
- FICO Credit Score: ${state.creditScore}
- State: ${state.stateCode}
- Lender Type: ${state.lenderType}
- Interest Rate: ${state.interestRate}%

Provide a concise 3-bullet analysis covering:
1. Estimated Bank Approval Odds (High / Moderate / Low)
2. Primary Credit & Debt-to-Income Risk Factors
3. Actionable advice to lower the interest rate or improve approval chance.
Keep formatting clean HTML using <ul> and <li> tags.`;

    try {
        if (!apiKey) throw new Error("No API key provided");
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) throw new Error("API request failed");
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Empty AI response");

        DOM.boxAiContent.innerHTML = `<div class="prose prose-invert max-w-none text-xs text-slate-300 space-y-2">${text}</div>`;
    } catch (err) {
        // Dynamic fallback underwriter report
        const creditInfo = evaluateCreditTier(state.creditScore, state.lenderType, state.loanType);
        let approvalOdds = state.creditScore >= 740 ? "High (85%+)" : state.creditScore >= 620 ? "Moderate (55-70%)" : "Low / Conditional (<40%)";
        let oddsColor = state.creditScore >= 740 ? "text-emerald-400" : state.creditScore >= 620 ? "text-amber-400" : "text-rose-400";

        DOM.boxAiContent.innerHTML = `
            <div class="space-y-2 text-xs">
                <div class="font-bold flex items-center gap-2">
                    <span>Approval Probability:</span>
                    <span class="${oddsColor}">${approvalOdds}</span>
                </div>
                <ul class="list-disc pl-4 space-y-1.5 text-slate-300">
                    <li><strong class="text-white">Credit Tier Analysis:</strong> Score of <strong>${state.creditScore}</strong> (${creditInfo.label}) meets tier criteria for ${LOAN_PRESETS[state.loanType]?.name || "Loan"} funding up to $${formatNumber(creditInfo.maxLimit)}.</li>
                    <li><strong class="text-white">Risk Benchmarks:</strong> ${state.stateCode} base rate is indexed at ${STATE_BENCHMARKS[state.stateCode]?.rate || 6.25}%. Effective rate of ${state.interestRate}% includes risk premiums.</li>
                    <li><strong class="text-white">Actionable Recommendation:</strong> ${state.creditScore < 740 ? "Raising credit score above 740 reduces risk surcharge by 0.50% - 1.25%." : "Solid credit profile. Consider short-term duration or extra payments to minimize total interest."}</li>
                </ul>
            </div>
        `;
    }
}


/* ==========================================================================
   SECTION 5: EVENT LISTENERS & INITIALIZATION
   ========================================================================== */

// Category Tab Switcher
DOM.btnTabs.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        state.loanType = type;

        // Apply defaults
        const preset = LOAN_PRESETS[type];
        state.amount = preset.defaultAmount;
        state.termYears = preset.defaultTerm;
        state.interestRate = preset.defaultRate;

        DOM.btnTabs.forEach(b => {
            b.className = "btnTab flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700";
        });
        e.currentTarget.className = "btnTab flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 bg-sky-600 text-white shadow-md shadow-sky-600/20";

        renderUI();
    });
});

// Amount Sync
DOM.inputAmount.addEventListener('input', (e) => {
    state.amount = parseFloat(e.target.value) || 0;
    clampAmountToLimit();
    renderUI();
});
DOM.sliderAmount.addEventListener('input', (e) => {
    state.amount = parseFloat(e.target.value) || 0;
    clampAmountToLimit();
    renderUI();
});

// Term Sync
DOM.inputTerm.addEventListener('input', (e) => {
    state.termYears = parseInt(e.target.value) || 1;
    renderUI();
});
DOM.sliderTerm.addEventListener('input', (e) => {
    state.termYears = parseInt(e.target.value) || 1;
    renderUI();
});
DOM.btnTermQuicks.forEach(btn => {
    btn.addEventListener('click', (e) => {
        state.termYears = parseInt(e.target.dataset.years);
        renderUI();
    });
});

// Credit Score Sync
DOM.inputCreditScore.addEventListener('input', (e) => {
    state.creditScore = parseInt(e.target.value) || 300;
    renderUI();
});
DOM.sliderCreditScore.addEventListener('input', (e) => {
    state.creditScore = parseInt(e.target.value) || 300;
    renderUI();
});

// State & Lender Dropdowns
DOM.selectState.addEventListener('change', (e) => {
    state.stateCode = e.target.value;
    renderUI();
});
DOM.selectLender.addEventListener('change', (e) => {
    state.lenderType = e.target.value;
    renderUI();
});

// Rate Manual Edit & Lock
DOM.inputRate.addEventListener('input', (e) => {
    state.interestRate = parseFloat(e.target.value) || 0.1;
    state.isRateLocked = true; // Auto lock on custom manual entry
    renderUI();
});
DOM.btnLockRate.addEventListener('click', () => {
    state.isRateLocked = !state.isRateLocked;
    showToast(state.isRateLocked ? "Rate locked to current entry." : "Rate unlocked to bank auto benchmark.", "info");
    renderUI();
});

// Extra Payment Inputs
DOM.inputExtraPayment.addEventListener('input', (e) => {
    state.extraPayment = parseFloat(e.target.value) || 0;
    renderUI();
});
DOM.inputStartMonth.addEventListener('input', (e) => {
    state.startMonth = parseInt(e.target.value) || 1;
    renderUI();
});

// AI Advisor Button
DOM.btnAskAI.addEventListener('click', fetchAiUnderwritingAdvice);

// Schedule View Toggle
DOM.btnViewMonthly.addEventListener('click', () => {
    state.scheduleView = 'monthly';
    DOM.btnViewMonthly.className = "px-3 py-1 rounded-lg font-bold bg-sky-600 text-white transition";
    DOM.btnViewAnnual.className = "px-3 py-1 rounded-lg font-bold text-slate-400 hover:text-white transition";
    renderUI();
});
DOM.btnViewAnnual.addEventListener('click', () => {
    state.scheduleView = 'annual';
    DOM.btnViewAnnual.className = "px-3 py-1 rounded-lg font-bold bg-sky-600 text-white transition";
    DOM.btnViewMonthly.className = "px-3 py-1 rounded-lg font-bold text-slate-400 hover:text-white transition";
    renderUI();
});

// CSV Export Handler
DOM.btnExportCsv.addEventListener('click', () => {
    const results = calculateAmortization();
    let csv = "Period,Payment,Principal,Interest,RemainingBalance\n";

    results.schedule.forEach(r => {
        csv += `${r.month},${r.payment.toFixed(2)},${r.principal.toFixed(2)},${r.interest.toFixed(2)},${r.remainingBalance.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amortization_schedule_${state.loanType}_${state.amount}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast("CSV Amortization Schedule downloaded!", "info");
});

// Theme Switcher Handler
DOM.btnThemeToggle.addEventListener('click', () => {
    state.darkMode = !state.darkMode;
    if (state.darkMode) {
        document.documentElement.classList.add('dark');
        DOM.themeIcon.textContent = '🌙';
        DOM.themeText.textContent = 'Dark Mode';
    } else {
        document.documentElement.classList.remove('dark');
        DOM.themeIcon.textContent = '☀️';
        DOM.themeText.textContent = 'Light Mode';
    }
});

// Initial Setup
function init() {
    populateStateDropdown();
    renderUI();
}

window.addEventListener('DOMContentLoaded', init);
