(function(){
  function $(s, r){ return (r||document).querySelector(s); }

  function setNumber(id, value){ var el = $(id); if (el) el.textContent = String(value); }

  var charts = { week: null, pie: null };

  function initCharts(){
    if (typeof Chart === 'undefined') return;
    const ctxWeek = document.getElementById('weekCheckinsChart');
    if (ctxWeek) {
      charts.week = new Chart(ctxWeek.getContext('2d'), {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Check-ins', data: [], backgroundColor: '#66d2e3' }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    const ctxPie = document.getElementById('vaccinePieChart');
    if (ctxPie) {
      charts.pie = new Chart(ctxPie.getContext('2d'), {
        type: 'pie',
        data: { labels: ['Full','Ongoing','Missed'], datasets: [{ data: [0,0,0], backgroundColor: ['#37c2b1','#ffd166','#ef476f'] }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }

  function loadFromFirebase(){
    if (!window.firebase || !firebase.apps || !firebase.apps.length) return;
    var db = firebase.database().ref('animalbiteclinic');
    var checkinsDB = firebase.database().ref('checkins');
    var billsDB = firebase.database().ref('bills');
    db.once('value').then(function(snapshot){
      var total = 0; var full=0, ongoing=0, missed=0; var c1=0,c2=0,c3=0;

      var days = [];
      var counts = [];
      for (var i=6; i>=0; i--) {
        var d = new Date(); d.setDate(d.getDate()-i);
        var key = d.toISOString().slice(0,10);
        days.push(key.slice(5)); 
        counts.push(0);
      }
      snapshot.forEach(function(child){
        total++;
        var d = child.val() || {};
        if (d.vaccineStatus === 'full') full++; else if (d.vaccineStatus === 'ongoing') ongoing++; else if (d.vaccineStatus === 'missed') missed++;
        if (d.biteCategory === '1') c1++; else if (d.biteCategory === '2') c2++; else if (d.biteCategory === '3') c3++;

        if (d.dateRegistered) {
          try {
            var dateKey = new Date(d.dateRegistered).toISOString().slice(0,10).slice(5);
            var idx = days.indexOf(dateKey);
            if (idx >= 0) counts[idx] += 1;
          } catch(_){}
        }
      });
      setNumber('#totalPatientsValue', total);
      setNumber('#fullVaccinatedValue', full);
      setNumber('#ongoingVaccinatedValue', ongoing);
      setNumber('#missedVaccinatedValue', missed);
      setNumber('#category1Count', c1);
      setNumber('#category2Count', c2);
      setNumber('#category3Count', c3);

      if (charts.pie) {
        charts.pie.data.datasets[0].data = [full, ongoing, missed];
        charts.pie.update();
      }
      if (charts.week) {
        charts.week.data.labels = days;
        charts.week.data.datasets[0].data = counts;
        charts.week.update();
      }
    });


    (function(){
      var today = new Date();
      var y = today.getFullYear();
      var m = ('0' + (today.getMonth() + 1)).slice(-2);
      var d = ('0' + today.getDate()).slice(-2);
      var todayKey = y + '-' + m + '-' + d;
      checkinsDB.orderByChild('date').equalTo(todayKey).once('value').then(function(s){
        setNumber('#checkinsTodayValue', s.numChildren() || 0);
      });
    })();


    billsDB.orderByChild('status').equalTo('unpaid').once('value').then(function(s){
      setNumber('#outstandingBillsValue', s.numChildren() || 0);
    });
  }

  function init(){ initCharts(); loadFromFirebase(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();




