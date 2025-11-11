const firebaseConfig = {
    apiKey: "AIzaSyDW85ZEb-dQ-0XpTQ3OVWsna9tG6C5PZYU",
    authDomain: "animalbiteclinic-84ca7.firebaseapp.com",
    databaseURL: "https://animalbiteclinic-84ca7-default-rtdb.firebaseio.com",
    projectId: "animalbiteclinic-84ca7",
    storageBucket: "animalbiteclinic-84ca7.firebasestorage.app",
    messagingSenderId: "69405337111",
    appId: "1:69405337111:web:8323902876ede3bbc61e52"
  };

  function ensurePatientIds() {
    return animalbiteclinicDB.once('value').then(function (snapshot) {
      var maxId = 0;
      var toUpdate = [];
      var idMap = {}; // Track which IDs are already used
      var duplicates = []; // Track records with duplicate IDs
      
      snapshot.forEach(function (child) {
        var data = child.val() || {};
        var pidNum = parseInt((data.patientId || '').toString(), 10);
        
        if (!isNaN(pidNum)) {
          if (pidNum > maxId) maxId = pidNum;
          
          // Check for duplicates
          if (idMap[pidNum]) {
            // This ID is already used, mark both as duplicates
            if (!duplicates.includes(idMap[pidNum])) {
              duplicates.push(idMap[pidNum]);
            }
            duplicates.push(child.key);
          } else {
            idMap[pidNum] = child.key;
          }
        }
        
        if (!data.patientId) {
          toUpdate.push(child.key);
        }
      });
      
      var updates = [];
      var nextId = maxId + 1;
      
      // Fix missing IDs
      toUpdate.forEach(function (key) {
        var newId = String(nextId).padStart(2, '0');
        updates.push(animalbiteclinicDB.child(key).update({ patientId: newId }));
        idMap[nextId] = key;
        nextId++;
      });
      
      // Fix duplicate IDs (keep the first occurrence, reassign others)
      duplicates.forEach(function (key) {
        var newId = String(nextId).padStart(2, '0');
        updates.push(animalbiteclinicDB.child(key).update({ patientId: newId }));
        idMap[nextId] = key;
        nextId++;
      });
      
      return Promise.all(updates);
    });
  }

  firebase.initializeApp(firebaseConfig);

  var animalbiteclinicDB = firebase.database().ref('animalbiteclinic');
  var billsDB = firebase.database().ref('bills');
  var checkinsDB = firebase.database().ref('checkins');
  var rolesByEmailDB = firebase.database().ref('userRolesByEmail');
  var ADMIN_EMAILS = [
    'animalbiteadmin@gmail.com'
  ];

  function initRegisterForm() {
    var formElement = document.getElementById('registerform');
    if (formElement) {
      formElement.onsubmit = animalB;
    }

    if (typeof filterAvailableWristbands === 'function') {
      filterAvailableWristbands();
    }

    // Setup contact number validation
    var contactInput = document.getElementById('contactNo');
    if (contactInput && !contactInput.hasAttribute('data-validated')) {
      contactInput.setAttribute('data-validated', 'true');
      contactInput.setAttribute('maxlength', '11');
      
      // Only allow numeric input
      contactInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
      });

      // Prevent non-numeric keys
      contactInput.addEventListener('keypress', function(e) {
        if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
          return;
        }
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
          e.preventDefault();
        }
      });

      // Validate on paste
      contactInput.addEventListener('paste', function(e) {
        e.preventDefault();
        var paste = (e.clipboardData || window.clipboardData).getData('text');
        var numbersOnly = paste.replace(/[^0-9]/g, '').substring(0, 11);
        this.value = numbersOnly;
      });
    }
  }
  window.initRegisterForm = initRegisterForm;

  function animalB(e) {

    e.preventDefault();
    var fullName = getElementVal('fullname');
    var contactNo = getElementVal('contactNo');
    var adress = getElementVal('Address');
    var selected = getElementVal('select');
    var vaccineType = getElementVal('vaccineType');

    // Validate contact number: must be exactly 11 digits
    if (!contactNo || contactNo.length !== 11 || !/^\d{11}$/.test(contactNo)) {
      alert('Please enter a valid 11-digit contact number.');
      var contactInput = document.getElementById('contactNo');
      if (contactInput) {
        contactInput.focus();
      }
      return;
    }

    // Validate vaccine selection
    if (!vaccineType) {
      alert('Please select a vaccine type.');
      var vaccineSelect = document.getElementById('vaccineType');
      if (vaccineSelect) {
        vaccineSelect.focus();
      }
      return;
    }

    saveRegister(fullName, contactNo, adress, selected, vaccineType)

  }

  const saveRegister = (fullName, contactNo, adress, selected, vaccineType) => {

    animalbiteclinicDB.once('value').then(function (snapshot) {
      // Find the maximum existing patient ID to avoid duplicates
      var maxId = 0;
      snapshot.forEach(function (child) {
        var data = child.val() || {};
        var pidNum = parseInt((data.patientId || '').toString(), 10);
        if (!isNaN(pidNum) && pidNum > maxId) {
          maxId = pidNum;
        }
      });
      // Generate new patient ID based on max ID + 1
      var patientId = String(maxId + 1).padStart(2, '0');
      var animalForm = animalbiteclinicDB.push();

      return animalForm
        .set({
          patientId: patientId,
          fullName: fullName,
          contactNumber: contactNo,
          address: adress,
          assignedWB: selected,
          vaccineType: vaccineType,
          dateRegistered: new Date().toISOString()
        })
        .then(function () {
          console.log('Saved record with key:', animalForm.key, 'patientId:', patientId);
          var formElement = document.getElementById('registerform');
          if (formElement) formElement.reset();

          var now = new Date();
          var y = now.getFullYear();
          var m = ('0'+(now.getMonth()+1)).slice(-2);
          var d = ('0'+now.getDate()).slice(-2);
          var hh = ('0'+now.getHours()).slice(-2);
          var mm = ('0'+now.getMinutes()).slice(-2);
          var checkinPayload = {
            date: y+'-'+m+'-'+d,
            time: hh+':'+mm,
            wristbandId: selected,
            patientKey: animalForm.key,
            createdAt: now.toISOString()
          };
          return checkinsDB.push(checkinPayload).then(function(){

            try {
              var kpi = document.querySelector('.stats .card:nth-child(3) .number');
              if (kpi) {
                var current = parseInt(kpi.textContent || '0', 10);
                if (!isNaN(current)) kpi.textContent = String(current + 1);
              }
              var reportToday = document.getElementById('checkinsTodayValue');
              if (reportToday) {
                var curr2 = parseInt(reportToday.textContent || '0', 10);
                if (!isNaN(curr2)) reportToday.textContent = String(curr2 + 1);
              }
            } catch(_){}
          });
        });
    }).catch(function (err) {
      console.error('Failed to save record:', err);
    });
  };

  function loadBiteRecords() {
    var tableBody = document.querySelector('.records-table tbody');
    if (!tableBody) return;

    console.log('Attaching Firebase listeners for bite records...');

    tableBody.innerHTML = '';
    var rowCount = 0;

    function createRow(key, data) {
      var tr = document.createElement('tr');
      tr.setAttribute('data-key', key);

      var idTd = document.createElement('td');
      var index = ++rowCount;
      var displayedId = (data && data.patientId) ? data.patientId : (index < 10 ? '0' + index : String(index));
      idTd.textContent = displayedId;
      tr.appendChild(idTd);

      var nameTd = document.createElement('td');
      nameTd.textContent = (data && data.fullName) || 'N/A';
      tr.appendChild(nameTd);

      var contactTd = document.createElement('td');
      contactTd.textContent = (data && data.contactNumber) || 'N/A';
      tr.appendChild(contactTd);

      var addressTd = document.createElement('td');
      addressTd.textContent = (data && data.address) || 'N/A';
      tr.appendChild(addressTd);

      var wbTd = document.createElement('td');
      wbTd.textContent = (data && data.assignedWB) || 'N/A';
      tr.appendChild(wbTd);

      var dateTd = document.createElement('td');
      try {
        var d = data && data.dateRegistered ? new Date(data.dateRegistered) : null;
        dateTd.textContent = d ? (('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2) + '-' + d.getFullYear()) : 'N/A';
      } catch (e) {
        dateTd.textContent = 'N/A';
      }
      tr.appendChild(dateTd);

      var actionTd = document.createElement('td');
      var viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-view';
      viewBtn.textContent = 'View';
      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-delete';
      deleteBtn.textContent = 'Delete';
      actionTd.appendChild(viewBtn);
      actionTd.appendChild(deleteBtn);
      tr.appendChild(actionTd);

      deleteBtn.addEventListener('click', function() {
        animalbiteclinicDB.child(key).remove();
      });

      tableBody.appendChild(tr);

      if (typeof window.initBiteRecordPage === 'function') {
        window.initBiteRecordPage();
      }
    }

    ensurePatientIds().then(function () {

      animalbiteclinicDB.on('child_added', function (snapshot) {
        var key = snapshot.key;
        var data = snapshot.val();
        console.log('child_added:', key, data);
        createRow(key, data);
      }, function (err) {
        console.error('child_added listener error:', err);
      });

      animalbiteclinicDB.on('child_removed', function (snapshot) {
        var key = snapshot.key;
        console.log('child_removed:', key);
        var row = tableBody.querySelector('tr[data-key="' + key + '"]');
        if (row) row.remove();
        rowCount = Math.max(0, rowCount - 1);
      }, function (err) {
        console.error('child_removed listener error:', err);
      });
    });
  }
  window.loadBiteRecords = loadBiteRecords;

  function loadWristbands() {
    var tableBody = document.querySelector('.wristbands-table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    ensurePatientIds().then(function () { return animalbiteclinicDB.once('value'); }).then(function(snapshot) {
      snapshot.forEach(function(child) {
        var data = child.val() || {};
        if (!data.assignedWB) return;
        var tr = document.createElement('tr');

        var wbId = document.createElement('td');
        wbId.textContent = data.assignedWB;
        tr.appendChild(wbId);

        var rfidTd = document.createElement('td');
        rfidTd.textContent = data.assignedWB;
        tr.appendChild(rfidTd);

        var statusTd = document.createElement('td');
        var span = document.createElement('span');
        span.className = 'status active';
        span.textContent = 'Active';
        statusTd.appendChild(span);
        tr.appendChild(statusTd);

        var batteryTd = document.createElement('td');
        // Randomize battery between 20% and 100%
        var batteryPct = Math.floor(Math.random() * 81) + 20; // 20..100
        var batteryClass = batteryPct >= 70 ? 'high' : (batteryPct >= 40 ? 'mid' : 'low');
        batteryTd.innerHTML = '<div class="battery"><div class="battery-bar"><div class="battery-fill ' + batteryClass + '" style="width:' + batteryPct + '%"></div></div>' + batteryPct + '%</div>';
        tr.appendChild(batteryTd);

        var patientIdTd = document.createElement('td');
        patientIdTd.textContent = (data.patientId || '-')
        tr.appendChild(patientIdTd);

        tableBody.appendChild(tr);
      });
    });
  }
  window.loadWristbands = loadWristbands;

  function populatePatientSelect() {
    var select = document.getElementById('patientSelect');
    if (!select) return;
    var billsList = document.querySelector('.bills-list');
    var historyTbody = document.querySelector('.billing-table tbody');
    if (billsList) billsList.innerHTML = '';
    if (historyTbody) historyTbody.innerHTML = '';

    select.innerHTML = '<option value="">Select patient</option>';
    animalbiteclinicDB.once('value').then(function(snapshot) {
      snapshot.forEach(function(child) {
        var data = child.val() || {};
        var key = child.key;
        var option = document.createElement('option');
        option.value = key;
        option.textContent = (data.fullName || 'Unnamed') + ' (ID: ' + (key.substring(0,6)) + ')';
        select.appendChild(option);
      });
    });
  }
  window.populatePatientSelect = populatePatientSelect;

  function filterAvailableWristbands() {
    var selectEl = document.getElementById('select');
    if (!selectEl) return;
    animalbiteclinicDB.once('value').then(function(snapshot){
      var used = {};
      snapshot.forEach(function(child){
        var data = child.val() || {};
        if (data.assignedWB) used[String(data.assignedWB).toUpperCase()] = true;
      });

      var options = Array.prototype.slice.call(selectEl.querySelectorAll('option'));
      var kept = 0;
      options.forEach(function(opt){
        var val = (opt.value || '').toUpperCase();
        if (!val) return; 
        if (used[val]) {
          opt.remove();
        } else {
          kept++;
        }
      });
      if (kept === 0) {
        var noOpt = document.createElement('option');
        noOpt.value = '';
        noOpt.textContent = 'No wristbands available';
        noOpt.disabled = true;
        noOpt.selected = true;
        selectEl.appendChild(noOpt);
      }
    });
  }
  window.filterAvailableWristbands = filterAvailableWristbands;

  var patientKeyToNameCache = {};
  var patientKeyToIdCache = {};

  function loadPatientNameCache() {
    return animalbiteclinicDB.once('value').then(function(snapshot) {
      patientKeyToNameCache = {};
      patientKeyToIdCache = {};
      snapshot.forEach(function(child) {
        var data = child.val() || {};
        patientKeyToNameCache[child.key] = data.fullName || 'Unnamed';
        patientKeyToIdCache[child.key] = data.patientId || '';
      });
    });
  }

  function getPatientNameByKey(key) {
    return patientKeyToNameCache[key] || ('ID ' + (key ? key.substring(0,6) : '-'));
  }

  function createBill(patientKey, amount) {

    return animalbiteclinicDB.child(patientKey).once('value').then(function(snap) {
      var pdata = snap.val() || {};
      var patientId = pdata.patientId || patientKeyToIdCache[patientKey] || '';
      var billRef = billsDB.push();
      return billRef.set({
        id: patientId || '-',
        patientId: patientId || '-',
        patientKey: patientKey,
        amount: Number(amount),
        date: new Date().toISOString().split('T')[0],
        status: 'unpaid'
      });
    });
  }
  window.createBill = createBill;

  function markBillPaid(billKey) {
    return billsDB.child(billKey).update({ status: 'paid' });
  }
  window.markBillPaid = markBillPaid;

  function clearBillingUI() {
    var billsList = document.querySelector('.bills-list');
    var historyTbody = document.querySelector('.billing-table tbody');
    if (billsList) billsList.innerHTML = '';
    if (historyTbody) historyTbody.innerHTML = '';
  }

  function renderBillItem(key, bill) {
    var billsList = document.querySelector('.bills-list');
    if (!billsList) return;
    var item = document.createElement('div');
    item.className = 'bill-item';
    item.setAttribute('data-key', key);
    item.innerHTML =
      '<div class="bill-info">' +
      '  <div class="bill-id">ID: ' + (bill.patientId || bill.id || '-') + '</div>' +
      '  <div class="bill-amount">₱ ' + (bill.amount || 0) + '</div>' +
      '  <div class="bill-date">' + (bill.date || '-') + '</div>' +
      '</div>' +
      '<div class="bill-actions">' +
      '  <span class="status ' + (bill.status || 'unpaid') + '">' + ((bill.status === 'paid') ? 'Paid' : 'Unpaid') + '</span>' +
      (bill.status === 'unpaid' ? '  <button class="mark-paid-btn" data-key="' + key + '">Mark Paid</button>' : '') +
      '</div>';

    var first = billsList.firstChild;
    billsList.insertBefore(item, first);

    var items = billsList.querySelectorAll('.bill-item');
    if (items.length > 4) {
      billsList.removeChild(items[items.length - 1]);
    }

    var btn = item.querySelector('.mark-paid-btn');
    if (btn) {
      btn.addEventListener('click', function() {
        var k = this.getAttribute('data-key');
        markBillPaid(k);
      });
    }
  }

  function renderBillHistoryRow(key, bill) {
    var tbody = document.querySelector('.billing-table tbody');
    if (!tbody) return;
    var tr = document.createElement('tr');
    tr.setAttribute('data-key', key);
    tr.innerHTML =
      '<td>' + (bill.patientId || bill.id || '-') + '</td>' +
      '<td>' + getPatientNameByKey(bill.patientKey) + '</td>' +
      '<td>₱ ' + (bill.amount || 0) + '</td>' +
      '<td><span class="status-text ' + (bill.status || 'unpaid') + '">' + ((bill.status === 'paid') ? 'Paid' : 'Unpaid') + '</span></td>' +
      '<td>' + (bill.date || '-') + '</td>';
    var first = tbody.firstChild;
    tbody.insertBefore(tr, first);
  }

  function updateBillUIToPaid(key) {
    var item = document.querySelector('.bill-item[data-key="' + key + '"]');
    if (item) {
      var status = item.querySelector('.status');
      var btn = item.querySelector('.mark-paid-btn');
      if (status) status.className = 'status paid', status.textContent = 'Paid';
      if (btn) btn.remove();
    }
    var row = document.querySelector('.billing-table tbody tr[data-key="' + key + '"] .status-text');
    if (row) {
      row.className = 'status-text paid';
      row.textContent = 'Paid';
    }
  }

  function listenBills() {
    clearBillingUI();
    loadPatientNameCache().then(function() {
      billsDB.off();
      billsDB.on('child_added', function(snapshot) {
        var key = snapshot.key;
        var bill = snapshot.val() || {};
        renderBillItem(key, bill);
        renderBillHistoryRow(key, bill);
      });
      billsDB.on('child_changed', function(snapshot) {
        var key = snapshot.key;
        var bill = snapshot.val() || {};
        if (bill.status === 'paid') updateBillUIToPaid(key);
      });
      billsDB.on('child_removed', function(snapshot) {
        var key = snapshot.key;
        var item = document.querySelector('.bill-item[data-key="' + key + '"]');
        if (item) item.remove();
        var row = document.querySelector('.billing-table tbody tr[data-key="' + key + '"]');
        if (row) row.remove();
      });
    });
  }
  window.initBillingData = listenBills;

  function sanitizeEmail(email) {
    return (email || '').toLowerCase().replace(/\./g, ',');
  }

  function fetchRoleForCurrentUser() {
    return new Promise(function(resolve) {
      firebase.auth().onAuthStateChanged(function(user) {
        if (!user || !user.email) return resolve('staff');
        var key = sanitizeEmail(user.email);
        rolesByEmailDB.child(key).child('role').once('value').then(function(snap) {
          var role = snap.val();
          if (role === 'admin' || role === 'staff') return resolve(role);

          var lower = user.email.toLowerCase();
          if (ADMIN_EMAILS.indexOf(lower) !== -1) {
            rolesByEmailDB.child(key).set({ email: lower, role: 'admin' }).then(function(){
              resolve('admin');
            }).catch(function(){ resolve('admin'); });
          } else {
            resolve('staff');
          }
        }).catch(function() { resolve('staff'); });
      });
    });
  }

  function ensureAdminMenu(role) {
    if (role !== 'admin') return;
    var menu = document.querySelector('.menu');
    if (!menu) return;

    menu.innerHTML = '';

    var makeItem = function(icon, text, pageUrl) {
      var li = document.createElement('li');
      li.setAttribute('data-admin', '1');
      var img = document.createElement('img');
      img.src = '../icons/dash-icons/' + icon;
      img.alt = '';
      li.appendChild(img);
      li.appendChild(document.createTextNode(' ' + text));
      li.onclick = function() { loadPage(pageUrl, li); };
      return li;
    };

    var adminItems = [];
    adminItems.push(makeItem('1.png', 'Dashboard (Admin)', 'pages/admin/dashboard.html'));
    adminItems.push(makeItem('2.png', 'Animal Bite Record (Admin)', 'pages/admin/animal_bite_record.html'));
    adminItems.push(makeItem('7.png', 'SMS (Admin)', 'pages/admin/sms.html'));
    adminItems.push(makeItem('8.png', 'Staff Management', 'pages/admin/staff_management.html'));

    adminItems.forEach(function(li){ menu.appendChild(li); });

    var liLogout = document.createElement('li');
    var img = document.createElement('img');
    img.src = '../icons/dash-icons/master.png';
    img.alt = '';
    liLogout.appendChild(img);
    liLogout.appendChild(document.createTextNode(' Logout'));
    liLogout.onclick = function(){ if (window.logout) logout(); };
    menu.appendChild(liLogout);

    var first = menu.querySelector('li');
    if (first) {
      loadPage('pages/admin/dashboard.html', first);
    }
  }

  function initRoleMenu() {
    fetchRoleForCurrentUser().then(function(role) {
      ensureAdminMenu(role);
    });
  }
  window.initRoleMenu = initRoleMenu;

  function loadDashboardStats() {
    var totalPatientsEl = document.querySelector('.stats .card:nth-child(1) .number');
    var activeWbEl = document.querySelector('.stats .card:nth-child(2) .number');
    var checkinsTodayEl = document.querySelector('.stats .card:nth-child(3) .number');
    var devicesList = document.querySelector('.devices ul');
    if (!totalPatientsEl && !devicesList) return;

    animalbiteclinicDB.once('value').then(function(snapshot) {
      var total = 0;
      var active = 0;
      if (devicesList) devicesList.innerHTML = '';
      snapshot.forEach(function(child) {
        total++;
        var data = child.val() || {};
        if (data.assignedWB) {
          active++;
          if (devicesList) {
            var li = document.createElement('li');
            li.innerHTML = '<span class="device-icon">📶</span>' +
              '<span class="device-info"><span class="device-name">' + (data.fullName || 'Patient') + '</span>' +
              '<span class="device-id">WB: ' + data.assignedWB + '</span></span>' +
              '<span class="status active">Assigned</span>';
            devicesList.appendChild(li);
          }
        }
      });
      if (totalPatientsEl) totalPatientsEl.textContent = String(total);
      if (activeWbEl) activeWbEl.textContent = String(active);

      if (checkinsTodayEl) {
        var today = new Date();
        var y = today.getFullYear();
        var m = ('0' + (today.getMonth() + 1)).slice(-2);
        var d = ('0' + today.getDate()).slice(-2);
        var todayKey = y + '-' + m + '-' + d;
        checkinsDB.orderByChild('date').equalTo(todayKey).once('value').then(function(csnap){
          var count = csnap.numChildren() || 0;
          checkinsTodayEl.textContent = String(count);
        }).catch(function(){ checkinsTodayEl.textContent = '0'; });
      }
    });
  }
  window.loadDashboardStats = loadDashboardStats;
  const getElementVal = (id) => {
    return document.getElementById(id).value;
  }



