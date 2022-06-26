$(function() {

  function setNav(target) {
    $('.navbar .nav-item a[href="'+target+'"]').parent().addClass('active').siblings().removeClass('active');
    $(target).show().siblings().hide();
    window.sessionStorage.setItem('nav',target);
    window.history.replaceState(null,'',target);
  }

  var hash = window.location.hash;
  if(hash && $('.navbar .nav-item a[href="'+hash+'"]').length == 1) setNav(hash);
  else setNav(window.sessionStorage.getItem('nav') || $('.navbar .nav-item a').first().attr('href'));

  $('.navbar .nav-link').on('click', function(e){
    var target = $(this).attr('href');
    setNav(target);
  });

  $('a[href^="#"]').on('click', function(e) {
    e.preventDefault();
  });

  $('.year').html((new Date()).getFullYear());

  var m_agents = $('#metric-agents').gauge({label:'sFlow Agents', suffix:'', maxValue: 1e5, threshold: 4e4, logScale: true});
  var m_sflow_bps = $('#metric-sflow-bps').gauge({label:'sFlow Bytes', suffix:'bps', maxValue: 1e10, threshold: 4e9, logScale: true, counter: true});
  var m_sflow_pps = $('#metric-sflow-pps').gauge({label:'sFlow Packets', suffix: 'pps', maxValue: 1e6, threshold: 8e5, logScale: true, counter: true});
  var m_heap = $('#metric-heap').gauge({label:'Memory', suffix:'%', maxValue: 100, threshold: 90});
  var m_process = $('#metric-cpu-process').gauge({label:'CPU Process', suffix:'%', maxValue: 100, threshold: 80});
  var m_system = $('#metric-cpu-system').gauge({label:'CPU System', suffix:'%', maxValue: 100, threshold: 80});
  var m_script_run = $('#metric-script-run').gauge({label:'Scripts', suffix:'', maxValue: 100, threshold: 80});
  var m_script_err = $('#metric-script-err').gauge({label:'Scripts Failed',suffix:'', maxValue: 10, threshold: 1});
  var m_app_run = $('#metric-app-run').gauge({label:'Apps',suffix:'', maxValue: 50, threshold: 40});
  var m_app_err = $('#metric-app-err').gauge({label:'Apps Failed', suffix:'', maxValue: 10, threshold: 1});
  var m_http_conn_cur = $('#metric-http-conn-cur').gauge({label:'HTTP Connections', maxValue: 100, threshold: 80});
  var m_http_conn_tot= $('#metric-http-conn-tot').gauge({label:'HTTP Connections', suffix: 'cps', maxValue: 1000, threshold: 800, counter: true});

  function updateLicense(data) {
    var type = data.license.type;
    switch(type) {
      case 'production':
        $('#about-license').text('Production');
        $('#license-type').text('Production');
        $('#license-restriction').html('Use in production networks limited to single computer <em>' + data.license.host + '</em>.');
        break;
      case 'enterprise':
        $('#about-license').text('Enterprise');
        $('#license-type').text('Enterprise');
        $('#license-restriction').html('Use in production networks limited to single organization <em>' + data.license.account + '</em>.');
        break;
      case 'embedded':
        $('#about-license').text('Embedded');
        $('#license-type').text('Embedded');
        $('#license-restriction').html('Use in production network limited to product <em>' + data.license.product + '</em> from <em>' + data.license.account + '</em>.');
        break;
      case 'non-production':
      default:
        $('#about-license').text('Research and Evaluation');
        $('#license-type').text('Research and Evaluation');
        $('#license-restriction').html('Only use for research purposes and evaluation purposes is permitted. All use in production networks, including production networks in academic; research; and non-profit institutions, is prohibited.');
    }

    $('#about-hostname').text(data.analyzer.host);
    $('#about-sflowrate').text($.inmon.gauge.prototype.valueStr(data.analyzer.bps) + ' bps');
    $('#license-number').text(data.license.license || '');
    $('#license-account').text(data.license.account || '');
    $('#license-product').text(data.license.product || '');

    if(data.license.host) {
      $('#license-host').text(data.license.host);
      if(data.license.host_ok) $('#license-host').removeClass('text-danger').addClass('text-success');
      else $('#license-host').removeClass('text-success').addClass('text-danger');
    } else $('#license-host').text('');

    if(data.license.max_bps) {
      $('#license-rate').text($.inmon.gauge.prototype.valueStr(data.license.max_bps) + ' bps');
      if(data.license.max_bps_ok) $('#license-rate').removeClass('text-danger').addClass('text-success');
      else $('#license-rate').removeClass('text-success').addClass('text-danger');
    } else $('#license-rate').text('');

    if(data.license.expires) {
      $('#license-expires').text((new Date(data.license.expires)).toDateString());
      if(data.license.expires_ok) $('#license-expires').removeClass('text-danger').addClass('text-success');
      else $('#license-expires').removeClass('text-success').addClass('text-danger');
    } else $('#license-expires').text('');
  }

  (function pollLicense() {
    $.ajax({
      url: '../license/json',
      dataType: 'json',
      success: function(data) {
        updateLicense(data);
      },
      complete: function() {
        setTimeout(pollLicense, 5000);
      },
      timeout: 60000
    });
  })();

  function updateAnalyzer(data) {
    m_sflow_bps.gauge('update', {value: data.sFlowBytesReceived * 8});
    m_sflow_pps.gauge('update', {value: data.sFlowDatagramsReceived});
    m_process.gauge('update', {value: 100 * data.cpuLoadProcess});
    m_system.gauge('update', {value: 100 * data.cpuLoadSystem});
    m_heap.gauge('update', {value: 100 * data.heapUsed / data.heapMax});
    m_agents.gauge('update',{value: data.sFlowAgents});
    m_http_conn_cur.gauge('update',{value: data.httpConnectionsCurrent});
    m_http_conn_tot.gauge('update',{value: data.httpConnectionsTotal});

    $('#about-version').html(data.updateAvailable ? data.version + ' (<a href="https://sflow-rt.com/download.php">update available</a>)': data.version);
  }

  (function pollAnalyzer() {
    $.ajax({
      url: '../analyzer/json',
      dataType: 'json',
      success: function(data) {
        updateAnalyzer(data);
      },
      error: function() {
        $('.gauge').addClass('warn');
      },
      complete: function() {
        setTimeout(pollAnalyzer, 5000);
      },
      timeout: 60000
    });
  })();

  function updateApps(appInfo) {
    var scriptToApp = {};

    var apps = Object.keys(appInfo).sort();

    for(let i = 0; i < apps.length; i++) {
      let rec = appInfo[apps[i]];
      let scripts = rec.scripts;
      for(let s = 0; s < scripts.length; s++) scriptToApp[scripts[s]] = apps[i];
    }

    m_app_run.gauge('update', {value: apps.length});

    $.get('../scripts/json', function(scriptInfo) {
      var failed = 0, running = 0, failedApps = {}, app_failed = 0;
      var scripts = Object.keys(scriptInfo);
      for(let i = 0; i < scripts.length; i++) {
        let metrics = scriptInfo[scripts[i]];
        if(metrics.alive) running++;
        else if(!metrics.gracefulExit) {
          failed++;
          let app = scriptToApp[scripts[i]];
          if(app) {
            let appFailures = failedApps[app];
            if(appFailures) failedApps[app]++;
            else {
              failedApps[app] = 1;
              app_failed++;
            }
          }
        }
      }

      m_script_run.gauge('update', {value: scripts.length});
      m_script_err.gauge('update', {value: failed, maxValue: scripts.length });
      m_app_err.gauge('update', {value: app_failed, maxValue: apps.length });
      
      $('#app-list').empty();
      if(apps.length > 0) {
        for(let i = 0; i < apps.length; i++) {
          let rec = appInfo[apps[i]];
          let uri = rec.entry ? '../app/'+apps[i]+rec.entry  : '#';
          let status = failedApps[apps[i]] ? 'btn-outline-danger' : 'btn-outline-success';
          let disabled = rec.entry ? '' : ' disabled';
          $('#app-list').append('<a href="'+uri+'" class="btn m-1 text-truncate ' + status + disabled + '">'+apps[i]+'</a>');
        }
      } else {
        $('#app-list').append('<p class="lead"><em>No applications installed</em></p>');
      }
    }, 'json');
  }

  (function pollApps() {
    $.ajax({
      url: '../apps/json',
      dataType: 'json',
      success: function(data) {
        updateApps(data);
      },
      error: function() {
        $('#app-list a').removeClass('btn-outline-success').addClass('btn-outline-danger');
      },
      complete: function() {
        setTimeout(pollApps, 5000);
      },
      timeout: 60000
    });
  })();
});
