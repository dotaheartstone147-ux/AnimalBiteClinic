
(function () {
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function open(modal) {
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close(modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function populateFromRow(row) {
    var tds = row.querySelectorAll('td');
    var data = {
      '#m-id': tds[0] ? tds[0].textContent.trim() : 'N/A',
      '#m-name': tds[1] ? tds[1].textContent.trim() : 'N/A',
      '#m-contact': tds[2] ? tds[2].textContent.trim() : 'N/A',
      '#m-address': tds[3] ? tds[3].textContent.trim() : 'N/A',
      '#m-wristband': tds[4] ? tds[4].textContent.trim() : 'N/A',
      '#m-date': tds[5] ? tds[5].textContent.trim() : 'N/A',
      '#m-vaccine': 'N/A'
    };
    Object.keys(data).forEach(function (sel) { var el = $(sel); if (el) el.textContent = data[sel]; });

    // Fetch vaccine type from Firebase using the row's data-key
    var rowKey = row.getAttribute('data-key');
    if (rowKey && window.firebase && firebase.database) {
      var animalbiteclinicDB = firebase.database().ref('animalbiteclinic');
      animalbiteclinicDB.child(rowKey).once('value').then(function(snapshot) {
        var patientData = snapshot.val() || {};
        var vaccineEl = $('#m-vaccine');
        if (vaccineEl) {
          vaccineEl.textContent = patientData.vaccineType || 'N/A';
        }
      }).catch(function(error) {
        console.error('Error fetching vaccine data:', error);
      });
    }
  }

  function init() {
    var modal = $('#patientModal');
    if (!modal) return;

    $all('.records-table .btn-view').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var row = e.currentTarget.closest('tr');
        populateFromRow(row);
        open(modal);
      });
    });

    $all('[data-close]', modal).forEach(function (el) { el.addEventListener('click', function () { close(modal); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') close(modal); });

    var registerBtn = document.querySelector('.btn.btn-register');
    if (registerBtn) {
      registerBtn.addEventListener('click', function () {

        if (typeof window.loadPage === 'function') {
          var registerMenuItem = document.querySelector('.menu li:nth-child(3)') || document.querySelector('.menu li');
          window.loadPage('pages/register.html', registerMenuItem);
        } else {

          window.location.href = 'register.html';
        }
      });
    }

    var searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchRecords(this.value || '');
      });
    }
  }

  window.initBiteRecordPage = function () {
    var modal = $('#patientModal');
    if (!modal) return;
    $all('.records-table .btn-view').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var row = e.currentTarget.closest('tr');
        populateFromRow(row);
        open(modal);
      });
    });

    var searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchRecords(this.value || '');
      });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

function searchRecords(query) {
  var q = String(query || '').toLowerCase();
  var rows = document.querySelectorAll('.records-table tbody tr');
  Array.prototype.forEach.call(rows, function (row) {
    var text = row.textContent.toLowerCase();
    row.style.display = text.indexOf(q) !== -1 ? '' : 'none';
  });
}



