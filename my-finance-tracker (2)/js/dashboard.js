import { supabase } from './supabase.js'

const transactionForm = document.getElementById('transaction-form')
const txTypeInput = document.getElementById('tx-type')
const txCategoryInput = document.getElementById('tx-category')
const txAmountInput = document.getElementById('tx-amount')
const txDateInput = document.getElementById('tx-date')
const txDescInput = document.getElementById('tx-desc')

const budgetForm = document.getElementById('budget-form')
const budgetCategoryInput = document.getElementById('budget-category')
const budgetAmountInput = document.getElementById('budget-amount')
const budgetMonthInput = document.getElementById('budget-month')

let allTransactions = []
let allBudgets = []
let earnedCodes = new Set()

const BADGES = {
    first_saving:  { name: 'Анхны хэмнэлт',      desc: 'Нэг сарын орлого зарлагаасаа давсан', icon: 'fa-seedling',      color: 'success' },
    budget_keeper: { name: 'Төсвөө сахигч',      desc: 'Төсөв тогтоосон сард хязгаараасаа хэтрээгүй', icon: 'fa-shield-halved', color: 'info' },
    streak_3:      { name: 'Тогтмол хэмнэгч',    desc: '3 сар дараалан хэмнэсэн', icon: 'fa-fire',          color: 'warning' },
    streak_6:      { name: 'Хэмнэлтийн мастер',  desc: '6 сар дараалан хэмнэсэн', icon: 'fa-crown',         color: 'primary' }
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = await getUser()
    if (!user) {
        window.location.href = 'index.html'
        return
    }

    document.getElementById('user-email').textContent = user.email
    txDateInput.value = new Date().toLocaleDateString('sv-SE')
    budgetMonthInput.value = txDateInput.value.substring(0, 7)

    await refreshAll()
})

transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const type = txTypeInput.value
    const category = txCategoryInput.value
    const amount = parseFloat(txAmountInput.value)
    const date = txDateInput.value
    const description = txDescInput.value.trim() || null

    const user = await getUser()
    if (!user) {
        alert("Сешн дууссан байна. Дахин нэвтэрнэ үү!")
        window.location.href = 'index.html'
        return
    }

    if (type === 'expense') {
        const month = date.substring(0, 7)

        const { data: budget } = await supabase
            .from('budgets')
            .select('limit_amount')
            .eq('user_id', user.id)
            .eq('category', category)
            .eq('month_year', month)
            .maybeSingle()

        if (budget) {
            const { data: expenses } = await supabase
                .from('transactions')
                .select('amount, date')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .eq('category', category)

            let spent = 0
            ;(expenses || []).forEach(tx => {
                if (tx.date.substring(0, 7) === month) {
                    spent += tx.amount
                }
            })

            if (spent + amount > budget.limit_amount) {
                const proceed = confirm(
                    `АНХААРУУЛГА!\n\nТаны ${month} сарын "${category}" ангиллын төсвийн хязгаар: ${budget.limit_amount.toLocaleString()} ₮\nОдоогийн нийт зарцуулалт: ${(spent + amount).toLocaleString()} ₮ болох гэж байна.\n\nТөсөв хэтрүүлж гүйлгээг үргэлжлүүлэх үү?`
                )
                if (!proceed) return
            }
        }
    }

    const { error } = await supabase
        .from('transactions')
        .insert([{ user_id: user.id, type, category, amount, description, date }])

    if (error) {
        alert("Гүйлгээг хадгалахад алдаа гарлаа: " + error.message)
        console.error(error)
        return
    }

    alert("Гүйлгээ амжилттай бүртгэгдлээ!")
    transactionForm.reset()
    txDateInput.value = new Date().toLocaleDateString('sv-SE')
    refreshAll()
})

async function fetchTransactions() {
    const user = await getUser()
    if (!user) return

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

    if (error) {
        console.error("Гүйлгээ уншихад алдаа гарлаа:", error.message)
        return
    }

    let totalIncome = 0
    let totalExpense = 0

    transactions.forEach(tx => {
        if (tx.type === 'income') {
            totalIncome += tx.amount
        } else if (tx.type === 'expense') {
            totalExpense += tx.amount
        }
    })

    const totalBalance = totalIncome - totalExpense

    document.getElementById('total-balance').textContent = `${totalBalance.toLocaleString()} ₮`
    document.getElementById('total-income').textContent = `${totalIncome.toLocaleString()} ₮`
    document.getElementById('total-expense').textContent = `${totalExpense.toLocaleString()} ₮`

    allTransactions = transactions
    renderTransactions(transactions)
}

function renderTransactions(transactions) {
    const listContainer = document.getElementById('transaction-list')

    if (transactions.length === 0) {
        listContainer.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fa-solid fa-folder-open fs-3 d-block mb-2"></i>
                    Одоогоор ямар нэгэн гүйлгээ бүртгэгдээгүй байна.
                </td>
            </tr>
        `
        return
    }

    let htmlContent = ''

    transactions.forEach(tx => {
        const isIncome = tx.type === 'income'
        const badgeColor = isIncome ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
        const typeText = isIncome ? 'Орлого' : 'Зарлага'
        const amountSign = isIncome ? '+' : '-'
        const amountColor = isIncome ? 'text-success' : 'text-danger'

        htmlContent += `
            <tr>
                <td>${tx.date}</td>
                <td><span class="badge bg-light text-dark shadow-sm border">${escapeHtml(tx.category)}</span></td>
                <td class="text-secondary fw-medium">${escapeHtml(tx.description || '')}</td>
                <td><span class="badge ${badgeColor}">${typeText}</span></td>
                <td class="text-end fw-bold ${amountColor}">${amountSign}${tx.amount.toLocaleString()} ₮</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteTransaction('${tx.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `
    })

    listContainer.innerHTML = htmlContent
}

window.deleteTransaction = async function (id) {
    if (!confirm("Та энэ гүйлгээг устгахдаа итгэлтэй байна уу?")) return

    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

    if (error) {
        alert("Гүйлгээ устгахад алдаа гарлаа: " + error.message)
        console.error(error)
        return
    }

    alert("Гүйлгээ амжилттай устгагдлаа.")
    refreshAll()
}

document.getElementById('btn-logout').addEventListener('click', async () => {
    if (!confirm("Та системээс гарахдаа итгэлтэй байна уу?")) return

    const { error } = await supabase.auth.signOut()

    if (error) {
        alert("Системээс гарахад алдаа гарлаа: " + error.message)
        console.error(error)
        return
    }

    window.location.href = 'index.html'
})

budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const user = await getUser()
    if (!user) {
        alert("Сешн дууссан байна!")
        window.location.href = 'index.html'
        return
    }

    const category = budgetCategoryInput.value
    const monthYear = budgetMonthInput.value

    const { error } = await supabase
        .from('budgets')
        .upsert([{
            user_id: user.id,
            category: category,
            limit_amount: parseFloat(budgetAmountInput.value),
            month_year: monthYear
        }], { onConflict: 'user_id,category,month_year' })

    if (error) {
        alert("Төсөв тогтооход алдаа гарлаа: " + error.message)
        return
    }

    alert(`${monthYear} сарын ${category} ангилалд төсөв амжилттай тогтоогдлоо!`)
    budgetForm.reset()
    budgetMonthInput.value = monthYear

    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasBudget'))
    if (offcanvas) offcanvas.hide()

    refreshAll()
})

async function fetchBudgets() {
    const user = await getUser()
    if (!user) return

    const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month_year', { ascending: false })

    if (error) {
        console.error("Төсөв уншихад алдаа гарлаа:", error.message)
        return
    }

    const container = document.getElementById('current-budgets-list')
    let htmlContent = `<h6 class="fw-bold text-dark mb-3">Одоогийн тогтоосон төсвүүд:</h6>`

    allBudgets = budgets

    if (budgets.length === 0) {
        htmlContent += `<div class="text-center py-3 text-muted small bg-light rounded">Одоогоор төсөв тогтоогоогүй байна.</div>`
        container.innerHTML = htmlContent
        return
    }

    budgets.forEach(b => {
        htmlContent += `
            <div class="card p-2 mb-2 bg-light border-0 shadow-sm">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fw-bold small text-dark">${escapeHtml(b.category)}</span>
                        <span class="text-muted mx-1">•</span>
                        <span class="small text-secondary">${b.month_year}</span>
                    </div>
                    <div>
                        <span class="fw-bold text-primary small me-2">${b.limit_amount.toLocaleString()} ₮</span>
                        <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteBudget('${b.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
                ${progressHtml(b)}
            </div>
        `
    })

    container.innerHTML = htmlContent
}

window.deleteBudget = async function (id) {
    if (!confirm("Энэ төсвийг устгахдаа итгэлтэй байна уу?")) return

    const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)

    if (error) {
        alert("Төсөв устгахад алдаа гарлаа: " + error.message)
        return
    }

    refreshAll()
}


// ---------- Төсвийн ахиц, анхааруулга ----------

function spentFor(category, month) {
    return allTransactions
        .filter(tx => tx.type === 'expense' && tx.category === category && tx.date.substring(0, 7) === month)
        .reduce((sum, tx) => sum + tx.amount, 0)
}

function progressHtml(b) {
    const spent = spentFor(b.category, b.month_year)
    const pct = Math.round((spent / b.limit_amount) * 100)
    const color = pct > 100 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-success'
    return `
        <div class="progress mt-2" style="height: 6px;">
            <div class="progress-bar ${color}" style="width: ${Math.min(pct, 100)}%"></div>
        </div>
        <div class="small text-muted mt-1">${spent.toLocaleString()} / ${b.limit_amount.toLocaleString()} ₮ (${pct}%)</div>`
}

function renderBudgetAlerts() {
    const box = document.getElementById('budget-alerts')
    const currentMonth = new Date().toLocaleDateString('sv-SE').substring(0, 7)
    let html = ''

    allBudgets.filter(b => b.month_year === currentMonth).forEach(b => {
        const spent = spentFor(b.category, b.month_year)
        if (spent > b.limit_amount) {
            html += `<div class="alert alert-danger py-2 mb-2"><i class="fa-solid fa-triangle-exclamation me-1"></i>
                <b>${escapeHtml(b.category)}</b> ангилалд ${currentMonth} сарын төсөв хэтэрлээ:
                ${spent.toLocaleString()} ₮ / ${b.limit_amount.toLocaleString()} ₮</div>`
        } else if (spent >= b.limit_amount * 0.8) {
            html += `<div class="alert alert-warning py-2 mb-2"><i class="fa-solid fa-circle-exclamation me-1"></i>
                <b>${escapeHtml(b.category)}</b> ангиллын төсвийн 80%-иас илүүг зарцууллаа:
                ${spent.toLocaleString()} ₮ / ${b.limit_amount.toLocaleString()} ₮</div>`
        }
    })

    box.innerHTML = html
}

// ---------- Урамшууллын тэмдэг (badges) ----------

function monthIndex(m) {
    const [y, mo] = m.split('-').map(Number)
    return y * 12 + mo
}

function computeBadges() {
    const currentMonth = new Date().toLocaleDateString('sv-SE').substring(0, 7)
    const monthly = {}
    allTransactions.forEach(tx => {
        const m = tx.date.substring(0, 7)
        if (!monthly[m]) monthly[m] = { income: 0, expense: 0 }
        monthly[m][tx.type] += tx.amount
    })

    // Хэмнэлт хийсэн сар: орлого > зарлага
    const savedIdx = Object.keys(monthly)
        .filter(m => monthly[m].income > monthly[m].expense)
        .map(monthIndex)
        .sort((a, b) => a - b)

    let best = 0, run = 0
    savedIdx.forEach((idx, i) => {
        run = (i > 0 && idx === savedIdx[i - 1] + 1) ? run + 1 : 1
        best = Math.max(best, run)
    })

    // Одоогийн дараалал (энэ сар эсвэл өнгөрсөн сараас төгссөн)
    let current = 0
    const curIdx = monthIndex(currentMonth)
    let cursor = savedIdx.includes(curIdx) ? curIdx : curIdx - 1
    while (savedIdx.includes(cursor)) { current++; cursor-- }

    // Төсвөө сахисан өнгөрсөн сар байгаа эсэх
    const budgetMonths = [...new Set(allBudgets.map(b => b.month_year))].filter(m => m < currentMonth)
    const keeper = budgetMonths.some(m =>
        allBudgets.filter(b => b.month_year === m).every(b => spentFor(b.category, m) <= b.limit_amount)
    )

    const earned = new Set()
    if (savedIdx.length >= 1) earned.add('first_saving')
    if (keeper) earned.add('budget_keeper')
    if (best >= 3) earned.add('streak_3')
    if (best >= 6) earned.add('streak_6')

    return { earned, current }
}

async function updateBadges() {
    const user = await getUser()
    if (!user) return

    const { data: saved, error } = await supabase.from('badges').select('badge_code').eq('user_id', user.id)
    if (error) {
        console.error("Тэмдэг уншихад алдаа гарлаа:", error.message)
        return
    }
    earnedCodes = new Set((saved || []).map(r => r.badge_code))

    const { earned, current } = computeBadges()
    const fresh = [...earned].filter(code => !earnedCodes.has(code))

    if (fresh.length > 0) {
        const { error: insErr } = await supabase
            .from('badges')
            .upsert(fresh.map(code => ({ user_id: user.id, badge_code: code })),
                    { onConflict: 'user_id,badge_code', ignoreDuplicates: true })
        if (!insErr) {
            fresh.forEach(code => earnedCodes.add(code))
            alert("Шинэ тэмдэг авлаа!\n\n" + fresh.map(c => "🏅 " + BADGES[c].name).join("\n"))
        } else {
            console.error("Тэмдэг хадгалахад алдаа гарлаа:", insErr.message)
        }
    }

    renderBadges(current)
}

function renderBadges(streak) {
    document.getElementById('streak-text').textContent =
        streak > 0 ? `Одоогийн хэмнэлтийн дараалал: ${streak} сар` : 'Сар бүр орлогоосоо бага зарцуулж тэмдэг цуглуулаарай.'

    document.getElementById('badges-list').innerHTML = Object.entries(BADGES).map(([code, b]) => {
        const has = earnedCodes.has(code)
        return `
            <div class="col-6">
                <div class="badge-item ${has ? '' : 'locked'}" title="${escapeHtml(b.desc)}">
                    <div class="badge-icon bg-${b.color}-subtle text-${b.color}"><i class="fa-solid ${b.icon}"></i></div>
                    <div class="small fw-bold">${b.name}</div>
                    <div class="text-muted" style="font-size: 0.7rem;">${b.desc}</div>
                </div>
            </div>`
    }).join('')
}

async function refreshAll() {
    await fetchTransactions()
    await fetchBudgets()
    renderBudgetAlerts()
    await updateBadges()
}
