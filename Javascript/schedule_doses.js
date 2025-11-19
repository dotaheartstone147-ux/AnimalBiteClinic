(function(){
  var schedulesRef;
  var patientsRef;
  var patientCache = {};
  var isLoadingCompleted = false; // Flag to prevent multiple simultaneous loads

  function loadPatientsCache(){
    if (!patientsRef) return Promise.resolve();
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
    // If it's already in YYYY-MM-DD format (from date input), return as is
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.trim())) {
      return d.trim();
    }
    // If it's a Date object, format it
    if (d instanceof Date) {
      if (isNaN(d.getTime())) return '';
      var y = d.getFullYear();
      var m = ('0'+(d.getMonth()+1)).slice(-2);
      var da = ('0'+d.getDate()).slice(-2);
      return y+'-'+m+'-'+da;
    }
    // For other types, try to parse as date string
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    var y = dt.getFullYear();
    var m = ('0'+(dt.getMonth()+1)).slice(-2);
    var da = ('0'+dt.getDate()).slice(-2);
    return y+'-'+m+'-'+da;
  }

  function markAsCompleted(scheduleKey, tr){
    if (!schedulesRef) return;
    schedulesRef.child(scheduleKey).once('value').then(function(snap){
      var schedule = snap.val() || {};
      schedulesRef.child(scheduleKey).update({status: 'Completed'}).then(function(){
        // Remove from active table
        if (tr && tr.parentNode) {
          tr.parentNode.removeChild(tr);
        }
        // Reload completed schedules table to show the newly completed one
        loadAllCompletedSchedules();
        // Reload active schedules if a date is selected
        var dateInput = document.getElementById('scheduleDate');
        if (dateInput && dateInput.value) {
          renderRowsForDate(dateInput.value);
        }
      }).catch(function(err){
        console.error('Error updating status:', err);
        alert('Failed to update status. Please try again.');
      });
    });
  }

  function rescheduleDose(scheduleKey, currentDate, currentTime){
    if (!schedulesRef) return;
    var newDate = prompt('Enter new date (YYYY-MM-DD):', currentDate);
    if (!newDate) return;
    
    var newTime = prompt('Enter new time (HH:MM):', currentTime || '09:00');
    if (!newTime) return;
    
    schedulesRef.child(scheduleKey).update({
      date: newDate,
      time: newTime,
      status: 'Rescheduled'
    }).then(function(){
      alert('Dose rescheduled successfully!');
      var dateInput = document.getElementById('scheduleDate');
      if (dateInput) {
        dateInput.value = newDate;
        renderRowsForDate(newDate);
      }
    }).catch(function(err){
      console.error('Error rescheduling:', err);
      alert('Failed to reschedule. Please try again.');
    });
  }

  function normalizeDate(dateStr) {
    // Normalize date string to YYYY-MM-DD format
    if (!dateStr) return '';
    
    // Convert to string and trim whitespace
    var str = String(dateStr).trim();
    
    // If already in YYYY-MM-DD format, return as is (no parsing needed)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    
    // Only try to parse if it's not already in the correct format
    // This avoids timezone issues with Date parsing
    var dt = new Date(str);
    if (isNaN(dt.getTime())) {
      return '';
    }
    
    // Format using local timezone components
    var y = dt.getFullYear();
    var m = ('0'+(dt.getMonth()+1)).slice(-2);
    var da = ('0'+dt.getDate()).slice(-2);
    return y+'-'+m+'-'+da;
  }

  function formatDateWithMonth(dateStr) {
    // Format date as "Dec 15" or "Dec 15, 2024"
    if (!dateStr) return '';
    var dt = new Date(dateStr + 'T00:00:00');
    if (isNaN(dt.getTime())) return dateStr;
    
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var month = months[dt.getMonth()];
    var day = dt.getDate();
    var year = dt.getFullYear();
    
    return month + ' ' + day;
  }

  function loadAllCompletedSchedules(){
    // Load all completed schedules regardless of date
    if (!schedulesRef) return;
    var completedTbody = document.getElementById('completedTableBody');
    if (!completedTbody) return;
    
    // Prevent multiple simultaneous loads
    if (isLoadingCompleted) {
      return;
    }
    isLoadingCompleted = true;
    
    // Clear the table first to avoid duplicates
    completedTbody.innerHTML = '';
    
    // Track which schedule keys we've already added to prevent duplicates
    var addedScheduleKeys = {};
    
    schedulesRef.once('value').then(function(snap){
      if (!snap.exists()) {
        isLoadingCompleted = false;
        return;
      }
      
      snap.forEach(function(child){
        var s = child.val() || {};
        if (!s.date || s.status !== 'Completed') return;
        
        // Skip if we've already added this schedule key
        if (addedScheduleKeys[child.key]) {
          return;
        }
        
        // Mark this schedule key as added
        addedScheduleKeys[child.key] = true;
        
        var info = patientCache[s.patientKey] || {};
        var scheduleDate = normalizeDate(s.date);
        var dateDisplay = formatDateWithMonth(scheduleDate);
        
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>'+(info.patientId||'-')+'</td>'+
                       '<td>'+(info.name||'-')+'</td>'+
                       '<td>'+(s.dose||'-')+'</td>'+
                       '<td>'+(s.time||'-')+'</td>'+
                       '<td class="status-completed">' + dateDisplay + ' - Completed</td>';
        completedTbody.appendChild(tr);
      });
      
      // Reset the loading flag
      isLoadingCompleted = false;
    }).catch(function(err){
      console.error('Error loading completed schedules:', err);
      // Reset the loading flag even on error
      isLoadingCompleted = false;
    });
  }

  function renderRowsForDate(dateStr){
    if (!schedulesRef) return;
    var activeTbody = document.getElementById('scheduleTableBody');
    var completedTbody = document.getElementById('completedTableBody');
    if (!activeTbody || !completedTbody) return;
    
    // Clear active table, but keep completed table (it shows all completed)
    activeTbody.innerHTML = '';
    
    if (!dateStr) {
      return;
    }
    
    // Normalize the target date - if it's already YYYY-MM-DD, use it directly
    var target = normalizeDate(dateStr);
    
    if (!target) {
      // If normalizeDate failed, try formatDateStr as fallback
      target = formatDateStr(dateStr);
    }
    
    if (!target) {
      console.error('Invalid date:', dateStr);
      return;
    }
    
    // Ensure target is in YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(target)) {
      console.error('Target date not in correct format:', target);
      return;
    }
    
    // Query Firebase - get all schedules and filter client-side for exact match
    schedulesRef.once('value').then(function(snap){
      if (!snap.exists()) {
        // No schedules found
        return;
      }
      
      snap.forEach(function(child){
        var s = child.val() || {};
        if (!s.date) return;
        
        // Normalize the schedule date for comparison
        var scheduleDate = normalizeDate(s.date);
        
        // Skip if normalization failed
        if (!scheduleDate) {
          return;
        }
        
        // Ensure scheduleDate is in YYYY-MM-DD format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduleDate)) {
          return;
        }
        
        // Strict string comparison - both must be exactly the same
        if (scheduleDate !== target) {
          return; // Skip if date doesn't match exactly
        }
        
        var info = patientCache[s.patientKey] || {};
        var scheduleKey = child.key;
        var status = s.status || 'Scheduled';
        var tr = document.createElement('tr');
        
        // Only show active schedules in the active table (completed are shown separately)
        if (status !== 'Completed') {
          // Add to active table (with actions)
          var statusClass = '';
          var statusText = status;
          if (status === 'Rescheduled') {
            statusClass = 'status-rescheduled';
          }
          
          var actionButtons = '<button class="admin-btn action-btn complete-btn" data-key="' + scheduleKey + '">Mark Complete</button>' +
                             '<button class="admin-btn action-btn reschedule-btn" data-key="' + scheduleKey + '" data-date="' + (s.date||'') + '" data-time="' + (s.time||'') + '">Reschedule</button>';
          
          // Add month display to date in status
          var dateDisplay = formatDateWithMonth(scheduleDate);
          tr.innerHTML = '<td>'+(info.patientId||'-')+'</td>'+
                         '<td>'+(info.name||'-')+'</td>'+
                         '<td>'+(s.dose||'-')+'</td>'+
                         '<td>'+(s.time||'-')+'</td>'+
                         '<td class="' + statusClass + '">' + dateDisplay + ' - ' + statusText + '</td>'+
                         '<td class="actions-cell">' + actionButtons + '</td>';
          
          // Add event listeners for action buttons
          var completeBtn = tr.querySelector('.complete-btn');
          if (completeBtn) {
            completeBtn.addEventListener('click', function(){
              markAsCompleted(scheduleKey, tr);
            });
          }
          
          var rescheduleBtn = tr.querySelector('.reschedule-btn');
          if (rescheduleBtn) {
            rescheduleBtn.addEventListener('click', function(){
              rescheduleDose(scheduleKey, s.date || '', s.time || '');
            });
          }
          
          activeTbody.appendChild(tr);
        }
      });
    }).catch(function(err){
      console.error('Error loading schedules:', err);
    });
  }

  function init(){
    // Wait for Firebase to be ready
    if (!window.firebase || !firebase.database) {
      setTimeout(init, 100);
      return;
    }

    // Initialize Firebase refs
    schedulesRef = firebase.database().ref('doseSchedules');
    patientsRef = firebase.database().ref('animalbiteclinic');

    // Wait for DOM elements to be available
    var dateInput = document.getElementById('scheduleDate');
    var todayBtn = document.getElementById('todayBtn');
    
    if (!dateInput || !todayBtn) {
      setTimeout(init, 100);
      return;
    }

    // Clear the date input and active table initially
    dateInput.value = '';
    var activeTbody = document.getElementById('scheduleTableBody');
    if (activeTbody) {
      activeTbody.innerHTML = '';
    }
    
    // Load patient cache and then load all completed schedules
    loadPatientsCache().then(function() {
      // Load all completed schedules automatically on page load
      loadAllCompletedSchedules();
    }).catch(function(err) {
      console.error('Error loading patient cache:', err);
      // Still try to load completed schedules
      loadAllCompletedSchedules();
    });

    // Remove any existing event listeners by cloning and replacing the element
    var newDateInput = dateInput.cloneNode(true);
    dateInput.parentNode.replaceChild(newDateInput, dateInput);
    dateInput = newDateInput;
    
    var newTodayBtn = todayBtn.cloneNode(true);
    todayBtn.parentNode.replaceChild(newTodayBtn, todayBtn);
    todayBtn = newTodayBtn;

    // Add event listener for date change
    dateInput.addEventListener('change', function(){
      var selectedDate = this.value;
      var activeTbody = document.getElementById('scheduleTableBody');
      if (activeTbody) {
        activeTbody.innerHTML = ''; // Clear active table immediately
      }
      // Don't clear completed table - it shows all completed schedules
      
      if (selectedDate) {
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
          console.error('Invalid date format:', selectedDate);
          return;
        }
        
        // Make sure patient cache is loaded before rendering
        loadPatientsCache().then(function(){ 
          renderRowsForDate(selectedDate); 
        }).catch(function(err) {
          console.error('Error loading patient cache:', err);
          // Still try to render even if cache fails
          renderRowsForDate(selectedDate);
        });
      }
    });

    // Add event listener for Today button
    todayBtn.addEventListener('click', function(){
      // Get today's date in local timezone, not UTC
      var now = new Date();
      var year = now.getFullYear();
      var month = ('0' + (now.getMonth() + 1)).slice(-2);
      var day = ('0' + now.getDate()).slice(-2);
      var todayStr = year + '-' + month + '-' + day;
      
      // Clear active table immediately
      var activeTbody = document.getElementById('scheduleTableBody');
      if (activeTbody) {
        activeTbody.innerHTML = '';
      }
      // Don't clear completed table - it shows all completed schedules
      
      dateInput.value = todayStr;
      
      // Make sure patient cache is loaded before rendering
      loadPatientsCache().then(function(){ 
        renderRowsForDate(todayStr); 
      }).catch(function(err) {
        console.error('Error loading patient cache:', err);
        // Still try to render even if cache fails
        renderRowsForDate(todayStr);
      });
    });
  }

  // Expose init function for external calls
  window.initScheduleDosesPage = function() {
    init();
  };

  // Auto-init if DOM is already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Try to init immediately, but it will retry if elements aren't ready
    setTimeout(init, 50);
  }
})();




