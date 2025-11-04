



function initializeBilling() {

    const patientSelect = document.getElementById('patientSelect');
    const amountInput = document.getElementById('amountInput');
    const createBillBtn = document.querySelector('.create-bill-btn');
    const markPaidBtns = document.querySelectorAll('.mark-paid-btn');
    

    createBillBtn.addEventListener('click', function() {
        createNewBill();
    });
    

    markPaidBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            markBillAsPaid(this);
        });
    });
    

    amountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            createNewBill();
        }
    });
}

function createNewBill() {
    const patientSelect = document.getElementById('patientSelect');
    const amountInput = document.getElementById('amountInput');
    
    const selectedPatient = patientSelect.value;
    const amount = parseFloat(amountInput.value);
    

    if (!selectedPatient) {
        alert('Please select a patient');
        return;
    }
    
    if (isNaN(amount) || amount < 0) {
        alert('Please enter a valid amount');
        return;
    }
    

    if (typeof createBill === 'function') {
        createBill(selectedPatient, amount).then(function() {
            amountInput.value = '';
            showNotification('Bill created successfully!', 'success');
        }).catch(function() {
            showNotification('Failed to create bill', 'error');
        });
    }
}







function markBillAsPaid(button) {
    var key = button && button.getAttribute('data-key');
    if (!key && button && button.closest) {
        var item = button.closest('.bill-item');
        if (item) key = item.getAttribute('data-key');
    }
    if (typeof markBillPaid === 'function' && key) {
        markBillPaid(key).then(function() {
            showNotification('Bill marked as paid!', 'success');
        }).catch(function() {
            showNotification('Failed to mark bill as paid', 'error');
        });
    }
}



function showNotification(message, type = 'info') {

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    

    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#dc3545';
    } else {
        notification.style.backgroundColor = '#007bff';
    }
    

    document.body.appendChild(notification);
    

    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}


function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}


function searchBills(searchTerm) {
    const tableRows = document.querySelectorAll('.billing-table tbody tr');
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}


window.BillingModule = {
    createNewBill,
    markBillAsPaid,
    searchBills,
    showNotification
};


