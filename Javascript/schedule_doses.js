
(function(){
  var schedulesRef = firebase.database().ref('doseSchedules');
  var patientsRef = firebase.database().ref('animalbiteclinic');
  var patientCache = {};

  function loadPatientsCache(){
    return patientsRef.once('value').then(function(snap){
      patientCache = {};
      snap.forEach(function(child){
        var d = child.val() || {};
        patientCache[child.key] = {
          name: d.fullName || 'Unnamed',
          patientId: d.patientId || ''
        };
      });
    });
  }

  function formatDateStr(d){
    if (!d) return '';
    var dt = new Date(d);
    if (isNaN(dt)) return d;
    var y = dt.getFullYear();
    var m = ('0'+(dt.getMonth()+1)).slice(-2);
    var da = ('0'+dt.getDate()).slice(-2);
    return y+'-'+m+'-'+da;
  }

  function renderRowsForDate(dateStr){
    var tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var target = formatDateStr(dateStr);
    schedulesRef.orderByChild('date').equalTo(target).once('value').then(function(snap){
      snap.forEach(function(child){
        var s = child.val() || {};
        var info = patientCache[s.patientKey] || {};
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>'+(info.patientId||'-')+'</td>'+
                       '<td>'+(info.name||'-')+'</td>'+
                       '<td>'+(s.dose||'-')+'</td>'+
                       '<td>'+(s.time||'-')+'</td>'+
                       '<td>'+(s.status||'Scheduled')+'</td>';
        tbody.appendChild(tr);
      });
    });
  }

  function init(){
    var dateInput = document.getElementById('scheduleDate');
    var todayBtn = document.getElementById('todayBtn');
    var today = formatDateStr(new Date());
    if (dateInput) dateInput.value = today;
    loadPatientsCache().then(function(){ renderRowsForDate(today); });

    if (dateInput){
      dateInput.addEventListener('change', function(){
        renderRowsForDate(this.value);
      });
    }
    if (todayBtn){
      todayBtn.addEventListener('click', function(){
        var t = formatDateStr(new Date());
        if (dateInput) dateInput.value = t;
        renderRowsForDate(t);
      });
    }
  }

  init();
})();




