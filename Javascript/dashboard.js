// Chart instances
let bitesChart = null;
let vaccineChart = null;
let wristbandChart = null;

function initializeCharts() {
  console.log("✅ Initializing charts...");

  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded');
    return;
  }

  // Initialize Bites per Month Chart
  const bitesCtx = document.getElementById('bitesChart');
  if (bitesCtx) {
    console.log("Creating bites chart...");
    bitesChart = new Chart(bitesCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Bites',
          data: [],
          backgroundColor: 'rgba(61,124,166,0.8)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  } else {
    console.error('bitesChart canvas not found');
  }

  // Initialize Vaccine Usage Chart
  const vaccineCtx = document.getElementById('vaccineChart');
  if (vaccineCtx) {
    console.log("Creating vaccine chart...");
    vaccineChart = new Chart(vaccineCtx, {
      type: 'doughnut',
      data: {
        labels: ['Anti-Rabies', 'Tetanus'],
        datasets: [{
          data: [0, 0],
          backgroundColor: ['rgba(61,124,166,0.7)', 'rgba(61,124,166,1)']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          }
        }
      }
    });
  } else {
    console.error('vaccineChart canvas not found');
  }

  // Initialize Wristband Chart
  const wristbandCtx = document.getElementById('wristbandChart');
  if (wristbandCtx) {
    console.log("Creating wristband chart...");
    wristbandChart = new Chart(wristbandCtx, {
      type: 'pie',
      data: {
        labels: ['Active', 'Inactive'],
        datasets: [{
          data: [0, 0],
          backgroundColor: ['#4caf50', '#f44336']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          }
        }
      }
    });
  } else {
    console.error('wristbandChart canvas not found');
  }

  // Load data from Firebase
  loadChartData();
}

function loadChartData() {
  if (!window.firebase || !firebase.database) {
    console.error('Firebase not available');
    return;
  }

  const animalbiteclinicDB = firebase.database().ref('animalbiteclinic');
  
  animalbiteclinicDB.once('value').then(function(snapshot) {
    // Data for calculations
    const monthData = {};
    let antiRabiesCount = 0;
    let tetanusCount = 0;
    let activeWristbands = 0;
    let inactiveWristbands = 0;

    // Month names
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

    snapshot.forEach(function(child) {
      const data = child.val() || {};
      
      // Calculate bites per month
      if (data.dateRegistered) {
        try {
          const date = new Date(data.dateRegistered);
          if (!isNaN(date.getTime())) {
            const monthKey = date.getFullYear() + '-' + (date.getMonth() + 1);
            monthData[monthKey] = (monthData[monthKey] || 0) + 1;
          }
        } catch (e) {
          console.error('Error parsing date:', e);
        }
      }

      // Count vaccines: All patients get Anti-Rabies, Category 3 also get Tetanus
      antiRabiesCount++;
      if (data.biteCategory === '3' || data.biteCategory === 3) {
        tetanusCount++;
      }

      // Count wristbands
      if (data.assignedWB) {
        activeWristbands++;
      } else {
        inactiveWristbands++;
      }
    });

    // Update Bites per Month Chart
    if (bitesChart) {
      // Get last 7 months
      const now = new Date();
      const labels = [];
      const biteCounts = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.getFullYear() + '-' + (date.getMonth() + 1);
        const monthName = monthNames[date.getMonth()];
        labels.push(monthName);
        biteCounts.push(monthData[monthKey] || 0);
      }

      bitesChart.data.labels = labels;
      bitesChart.data.datasets[0].data = biteCounts;
      
      // Auto-adjust max value
      const maxValue = Math.max(...biteCounts, 1);
      bitesChart.options.scales.y.max = Math.ceil(maxValue * 1.2);
      bitesChart.update();
    }

    // Update Vaccine Chart
    if (vaccineChart) {
      vaccineChart.data.datasets[0].data = [antiRabiesCount, tetanusCount];
      vaccineChart.update();
    }

    // Update Wristband Chart
    if (wristbandChart) {
      wristbandChart.data.datasets[0].data = [activeWristbands, inactiveWristbands];
      wristbandChart.update();
    }

    console.log("✅ Charts updated with real data");
  }).catch(function(error) {
    console.error('Error loading chart data:', error);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Dashboard script loaded");
  initializeCharts();
});


