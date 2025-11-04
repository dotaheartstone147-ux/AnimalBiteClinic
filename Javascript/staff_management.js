
(function(){
  function sanitizeEmail(email) { return (email || '').toLowerCase().replace(/\./g, ','); }
  var rolesRef = firebase.database().ref('userRolesByEmail');

  function renderRoles(snapshot) {
    var tbody = document.getElementById('rolesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    snapshot.forEach(function(child){
      var data = child.val() || {};
      var emailKey = child.key;
      var email = (data.email) || (emailKey || '').replace(/,/g, '.');
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + email + '</td>' +
                     '<td>' + (data.role || 'staff') + '</td>' +
                     '<td><button class="admin-btn" data-email="' + email + '">Make Admin</button></td>';
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('button[data-email]').forEach(function(btn){
      btn.onclick = function(){ setRole(this.getAttribute('data-email'), 'admin'); };
    });
  }

  function loadRoles() {
    rolesRef.off();
    rolesRef.on('value', renderRoles);
  }

  function setRole(email, role) {
    if (!email) return;
    var key = sanitizeEmail(email);
    rolesRef.child(key).set({ email: email, role: role }).then(function(){
      showMsg('Role updated');
    }).catch(function(){ showMsg('Failed to update', true); });
  }

  function showMsg(msg, err){
    var el = document.getElementById('roleMsg');
    if (!el) return;
    el.textContent = msg;
    el.style.color = err ? '#c00' : '#080';
  }

  document.addEventListener('click', function(e){
    if (e.target && e.target.id === 'assignRoleBtn'){
      var email = document.getElementById('staffEmail').value.trim();
      var role = document.getElementById('staffRole').value;
      setRole(email, role);
    }
  });


  document.addEventListener('input', function(e){
    if (e.target && e.target.id === 'searchRole'){
      var q = e.target.value.toLowerCase();
      var rows = document.querySelectorAll('#rolesTableBody tr');
      rows.forEach(function(row){
        var email = (row.firstChild && row.firstChild.textContent || '').toLowerCase();
        row.style.display = email.indexOf(q) !== -1 ? '' : 'none';
      });
    }
  });
  document.addEventListener('click', function(e){
    if (e.target && e.target.id === 'clearSearch'){
      var input = document.getElementById('searchRole');
      if (input) input.value = '';
      var rows = document.querySelectorAll('#rolesTableBody tr');
      rows.forEach(function(row){ row.style.display = ''; });
    }
  });


  loadRoles();
})();




