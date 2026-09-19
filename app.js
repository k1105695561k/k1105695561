const STORAGE_KEY = 'accounting_app_state_v1';

const defaultState = {
  companyName: 'مؤسستي',
  customers: [
    { id: 1, name: 'محمد علي', phone: '0500000000', email: 'm@example.com', creditLimit: 5000 },
    { id: 2, name: 'سارة حسن', phone: '0555555555', email: 's@example.com', creditLimit: 2500 }
  ],
  suppliers: [
    { id: 1, name: 'مورد رئيسي', phone: '0566666666', email: 'supplier@example.com', creditLimit: 7000 }
  ],
  transactions: [
    { id: 1, type: 'income', category: 'مبيعات', amount: 8500, date: '2026-09-10', description: 'بيع لعميل', account: 'بنك', status: 'paid' },
    { id: 2, type: 'expense', category: 'رواتب', amount: 3200, date: '2026-09-12', description: 'رواتب الموظفين', account: 'نقدي', status: 'paid' },
    { id: 3, type: 'income', category: 'خدمة', amount: 1500, date: '2026-09-15', description: 'خدمة استشارية', account: 'بنك', status: 'pending' }
  ]
};

let state = loadState();

const el = {
  companyNameDisplay: document.getElementById('company-name-display'),
  totalIncome: document.getElementById('total-income'),
  totalExpenses: document.getElementById('total-expenses'),
  netProfit: document.getElementById('net-profit'),
  currentBalance: document.getElementById('current-balance'),
  receivablesTotal: document.getElementById('receivables-total'),
  payablesTotal: document.getElementById('payables-total'),
  transactionsCount: document.getElementById('transactions-count'),
  customersCount: document.getElementById('customers-count'),
  suppliersCount: document.getElementById('suppliers-count'),
  pendingTotal: document.getElementById('pending-total'),
  transactionsTableBody: document.getElementById('transactions-table-body'),
  customersList: document.getElementById('customers-list'),
  suppliersList: document.getElementById('suppliers-list'),
  transactionForm: document.getElementById('transaction-form'),
  customerForm: document.getElementById('customer-form'),
  supplierForm: document.getElementById('supplier-form'),
  reportIncome: document.getElementById('report-income'),
  reportExpenses: document.getElementById('report-expenses'),
  reportProfit: document.getElementById('report-profit'),
  resetDataBtn: document.getElementById('reset-data')
};

initialize();

function initialize() {
  wireNavigation();
  wireForms();
  setDefaultDate();
  render();
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(stored);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      customers: Array.isArray(parsed.customers) ? parsed.customers : defaultState.customers,
      suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : defaultState.suppliers,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : defaultState.transactions
    };
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  el.companyNameDisplay.textContent = state.companyName;
  renderDashboard();
  renderTransactions();
  renderCustomers();
  renderSuppliers();
  renderReports();
}

function renderDashboard() {
  const income = totalByType('income');
  const expenses = totalByType('expense');
  const balance = income - expenses;
  const pending = state.transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  el.totalIncome.textContent = formatCurrency(income);
  el.totalExpenses.textContent = formatCurrency(expenses);
  el.netProfit.textContent = formatCurrency(balance);
  el.currentBalance.textContent = formatCurrency(balance);
  el.receivablesTotal.textContent = formatCurrency(getReceivables());
  el.payablesTotal.textContent = formatCurrency(getPayables());
  el.transactionsCount.textContent = state.transactions.length;
  el.customersCount.textContent = state.customers.length;
  el.suppliersCount.textContent = state.suppliers.length;
  el.pendingTotal.textContent = formatCurrency(pending);
}

function renderTransactions() {
  el.transactionsTableBody.innerHTML = '';

  if (!state.transactions.length) {
    el.transactionsTableBody.innerHTML = '<tr><td colspan="8">لا توجد معاملات حالياً.</td></tr>';
    return;
  }

  state.transactions
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(transaction => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(transaction.date)}</td>
        <td>${transaction.type === 'income' ? 'إيراد' : 'مصروف'}</td>
        <td>${escapeHtml(transaction.category)}</td>
        <td>${escapeHtml(transaction.description)}</td>
        <td><span class="badge ${transaction.status}">${transaction.status === 'paid' ? 'مدفوع' : 'معلق'}</span></td>
        <td>${formatCurrency(transaction.amount)}</td>
        <td>${escapeHtml(transaction.account)}</td>
        <td><button class="delete-btn" data-id="${transaction.id}">حذف</button></td>
      `;
      el.transactionsTableBody.appendChild(row);
    });

  el.transactionsTableBody.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      const id = Number(event.target.dataset.id);
      state.transactions = state.transactions.filter(item => item.id !== id);
      saveState();
      render();
    });
  });
}

function renderCustomers() {
  el.customersList.innerHTML = '';

  state.customers.forEach(customer => {
    const card = document.createElement('div');
    card.className = 'person-card';
    card.innerHTML = `
      <h4>${escapeHtml(customer.name)}</h4>
      <p>الهاتف: ${escapeHtml(customer.phone || '—')}</p>
      <p>البريد: ${escapeHtml(customer.email || '—')}</p>
      <p>الحد الائتماني: ${formatCurrency(customer.creditLimit || 0)}</p>
      <button class="delete-btn" data-customer-id="${customer.id}">حذف</button>
    `;
    el.customersList.appendChild(card);
  });

  el.customersList.querySelectorAll('[data-customer-id]').forEach(button => {
    button.addEventListener('click', (event) => {
      const id = Number(event.target.dataset.customerId);
      state.customers = state.customers.filter(customer => customer.id !== id);
      saveState();
      render();
    });
  });
}

function renderSuppliers() {
  el.suppliersList.innerHTML = '';

  state.suppliers.forEach(supplier => {
    const card = document.createElement('div');
    card.className = 'person-card';
    card.innerHTML = `
      <h4>${escapeHtml(supplier.name)}</h4>
      <p>الهاتف: ${escapeHtml(supplier.phone || '—')}</p>
      <p>البريد: ${escapeHtml(supplier.email || '—')}</p>
      <p>الحد الائتماني: ${formatCurrency(supplier.creditLimit || 0)}</p>
      <button class="delete-btn" data-supplier-id="${supplier.id}">حذف</button>
    `;
    el.suppliersList.appendChild(card);
  });

  el.suppliersList.querySelectorAll('[data-supplier-id]').forEach(button => {
    button.addEventListener('click', (event) => {
      const id = Number(event.target.dataset.supplierId);
      state.suppliers = state.suppliers.filter(supplier => supplier.id !== id);
      saveState();
      render();
    });
  });
}

function renderReports() {
  const income = totalByType('income');
  const expenses = totalByType('expense');
  const net = income - expenses;

  el.reportIncome.textContent = formatCurrency(income);
  el.reportExpenses.textContent = formatCurrency(expenses);
  el.reportProfit.textContent = formatCurrency(net);
}

function totalByType(type) {
  return state.transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

function getReceivables() {
  return state.transactions
    .filter(t => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

function getPayables() {
  return state.transactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

function wireNavigation() {
  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active-panel'));
      button.classList.add('active');
      document.getElementById(target).classList.add('active-panel');
    });
  });
}

function wireForms() {
  el.transactionForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const transaction = {
      id: Date.now(),
      type: document.getElementById('transaction-type').value,
      category: document.getElementById('transaction-category').value.trim(),
      amount: Number(document.getElementById('transaction-amount').value),
      date: document.getElementById('transaction-date').value,
      description: document.getElementById('transaction-description').value.trim(),
      account: document.getElementById('transaction-account').value.trim(),
      status: document.getElementById('transaction-status').value
    };

    if (!transaction.category || !transaction.description || !transaction.account || !transaction.date || Number.isNaN(transaction.amount)) {
      return;
    }

    state.transactions.push(transaction);
    saveState();
    render();
    el.transactionForm.reset();
    setDefaultDate();
  });

  el.customerForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const customer = {
      id: Date.now(),
      name: document.getElementById('customer-name').value.trim(),
      phone: document.getElementById('customer-phone').value.trim(),
      email: document.getElementById('customer-email').value.trim(),
      creditLimit: Number(document.getElementById('customer-limit').value || 0)
    };

    if (!customer.name) return;

    state.customers.push(customer);
    saveState();
    render();
    el.customerForm.reset();
  });

  el.supplierForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const supplier = {
      id: Date.now(),
      name: document.getElementById('supplier-name').value.trim(),
      phone: document.getElementById('supplier-phone').value.trim(),
      email: document.getElementById('supplier-email').value.trim(),
      creditLimit: Number(document.getElementById('supplier-limit').value || 0)
    };

    if (!supplier.name) return;

    state.suppliers.push(supplier);
    saveState();
    render();
    el.supplierForm.reset();
  });

  el.resetDataBtn.addEventListener('click', () => {
    if (window.confirm('هل تريد إعادة تعيين جميع البيانات إلى القيم الافتراضية؟')) {
      state = structuredClone(defaultState);
      saveState();
      render();
    }
  });
}

function setDefaultDate() {
  const dateField = document.getElementById('transaction-date');
  if (dateField && !dateField.value) {
    dateField.value = new Date().toISOString().split('T')[0];
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('ar-SA');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

































































































































