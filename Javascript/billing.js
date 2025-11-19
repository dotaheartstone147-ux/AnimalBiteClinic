



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
            showNotification('Bill marked as paid! Receipt generated.', 'success');
        }).catch(function() {
            showNotification('Failed to mark bill as paid', 'error');
        });
    }
}

// Generate and display receipt
window.generateReceipt = function(billKey, bill) {
    if (!window.firebase || !firebase.database) return;
    
    var animalbiteclinicDB = firebase.database().ref('animalbiteclinic');
    var patientKey = bill.patientKey;
    
    animalbiteclinicDB.child(patientKey).once('value').then(function(snap) {
        var patient = snap.val() || {};
        var receiptWindow = window.open('', '_blank', 'width=600,height=800');
        
        var receiptDate = new Date();
        var formattedDate = receiptDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        var formattedTime = receiptDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        receiptWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${bill.patientId || 'N/A'}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { margin: 0; color: #333; }
                    .header p { margin: 5px 0; color: #666; }
                    .receipt-info { margin: 20px 0; }
                    .receipt-info p { margin: 8px 0; }
                    .receipt-info strong { display: inline-block; width: 150px; }
                    .line { border-top: 1px solid #ddd; margin: 20px 0; }
                    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
                    @media print { button { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>MALARIA ANIMAL BITE CLINIC</h1>
                    <p>MedBandAlert</p>
                    <p>Official Receipt</p>
                </div>
                
                <div class="receipt-info">
                    <p><strong>Receipt No:</strong> ${billKey.substring(0, 8).toUpperCase()}</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${formattedTime}</p>
                    <p><strong>Patient ID:</strong> ${bill.patientId || 'N/A'}</p>
                    <p><strong>Patient Name:</strong> ${patient.fullName || 'N/A'}</p>
                    <p><strong>Contact:</strong> ${patient.contactNumber || 'N/A'}</p>
                </div>
                
                <div class="line"></div>
                
                <div class="receipt-info">
                    <p><strong>Service:</strong> Vaccination Fee</p>
                    <p><strong>Amount:</strong> ₱ ${(bill.amount || 0).toFixed(2)}</p>
                    <p><strong>Status:</strong> Paid</p>
                </div>
                
                <div class="line"></div>
                
                <div class="total">
                    <p>Total: ₱ ${(bill.amount || 0).toFixed(2)}</p>
                </div>
                
                <div class="footer">
                    <p>Thank you for your payment!</p>
                    <p>This is a computer-generated receipt.</p>
                    <button onclick="window.print()" style="padding: 10px 20px; margin-top: 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Receipt</button>
                </div>
            </body>
            </html>
        `);
        receiptWindow.document.close();
    });
};



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


