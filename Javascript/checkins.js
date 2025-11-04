


function setupScanModal() {
    var scanBtn = document.querySelector('.scan-btn');
    if (!scanBtn) return;

    var modal = document.querySelector('.scan-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'scan-modal';
        modal.innerHTML = '<div class="scan-modal-content">Please Scan your Wristband to check in</div>';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.background = 'rgba(0,0,0,0.3)';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    function saveCheckin(wbId) {
        if (!window.firebase || !firebase.apps || !firebase.apps.length) return;
        var patientsRef = firebase.database().ref('animalbiteclinic');
        var checkinsRef = firebase.database().ref('checkins');

        patientsRef.orderByChild('assignedWB').equalTo(wbId).once('value').then(function(snap){
            var first = null;
            snap.forEach(function(child){ if (!first) first = { key: child.key, val: child.val() }; });
            var now = new Date();
            var y = now.getFullYear();
            var m = ('0'+(now.getMonth()+1)).slice(-2);
            var d = ('0'+now.getDate()).slice(-2);
            var hh = ('0'+now.getHours()).slice(-2);
            var mm = ('0'+now.getMinutes()).slice(-2);
            var payload = {
                date: y+'-'+m+'-'+d,
                time: hh+':'+mm,
                wristbandId: wbId,
                patientKey: first ? first.key : null,
                createdAt: now.toISOString()
            };
            return checkinsRef.push(payload).then(function(){

                var list = document.querySelector('.recent-list');
                if (list) {
                    var div = document.createElement('div');
                    var name = first && first.val && first.val.fullName ? first.val.fullName : 'Unknown';
                    div.textContent = '['+payload.time+'] '+wbId+' - '+name;
                    list.insertBefore(div, list.firstChild);
                }

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

                modal.style.display = 'none';
            });
        }).catch(function(){ modal.style.display = 'none'; });
    }

    scanBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
        var input = modal.querySelector('#wbInput');
        var submit = modal.querySelector('#wbSubmit');
        if (input) input.focus();
        if (submit) {
            submit.onclick = function(){
                var wbId = (input && input.value || '').trim();
                if (!wbId) return;
                saveCheckin(wbId);
            };
        }
    });
}


if (window.location.pathname.endsWith('index.html')) {
    const observer = new MutationObserver(() => {
        setupScanModal();
    });
    observer.observe(document.getElementById('main-content'), { childList: true, subtree: true });

    setupScanModal();
} else {

    window.addEventListener('DOMContentLoaded', setupScanModal);
}


