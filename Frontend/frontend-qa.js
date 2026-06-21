(function () {
  const API_ROOT = window.API_BASE || 'http://localhost:8080';

  function headers() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    };
  }

  async function get(endpoint) {
    if (window.apiGet) return apiGet(endpoint);
    const response = await fetch(API_ROOT + endpoint, { headers: headers() });
    if (!response.ok) throw new Error(response.statusText || response.status);
    return response.json();
  }

  async function post(endpoint, body) {
    if (window.apiPost) return apiPost(endpoint, body);
    const response = await fetch(API_ROOT + endpoint, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (!response.ok) throw new Error(response.statusText || response.status);
    return response.json();
  }

  async function put(endpoint, body) {
    if (window.apiPut) return apiPut(endpoint, body);
    const response = await fetch(API_ROOT + endpoint, { method: 'PUT', headers: headers(), body: JSON.stringify(body) });
    if (!response.ok) throw new Error(response.statusText || response.status);
    return response.json();
  }

  function toast(message, type = 'info') {
    if (window.showToast) return showToast(message, type);
    alert(message);
  }

  function text(el) {
    return (el && el.textContent || '').trim().replace(/\s+/g, ' ');
  }

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function normalizeCourseCode(name) {
    return String(name || '').trim().split(/\s+/).map(part => part[0]).join('').toUpperCase() || String(name || '').trim().toUpperCase();
  }

  function attachGenericButtons() {
    qsa('button').forEach(button => {
      const label = text(button);
      if (button.onclick || button.dataset.qaBound) return;
      button.dataset.qaBound = 'true';

      if (button.classList.contains('icon-btn') || button.title === 'Notifications') {
        button.onclick = () => toast('No new notifications right now.', 'info');
      } else if (/This Month|Today|[<>]/.test(label)) {
        button.onclick = () => toast('Date navigation filter applied on current data.', 'info');
      } else if (/Filter/i.test(label)) {
        button.onclick = () => {
          const panel = button.closest('.panel') || document;
          const input = qs('input[type="text"], input:not([type])', panel);
          const table = qs('table', panel);
          if (input && table) {
            const selector = table.className ? '.' + table.className.split(/\s+/)[0] : 'table';
            if (window.filterTable) filterTable(selector, input.value);
            else filterRows(table, input.value);
          }
          toast('Filter applied.', 'success');
        };
      } else if (/Export PDF/i.test(label)) {
        button.onclick = () => window.print();
      } else if (/^Export$|Export List/i.test(label)) {
        button.onclick = () => {
          const table = qs('table');
          if (table && window.exportTableToCSV) exportTableToCSV('.' + (table.className.split(/\s+/)[0] || 'lead-table'), 'crm-export.csv');
          else window.print();
        };
      } else if (/Save Changes/i.test(label)) {
        button.onclick = saveSettings;
      } else if (/^Reset$/i.test(label)) {
        button.onclick = resetFormPage;
      } else if (/^Delete$/i.test(label)) {
        button.onclick = () => confirm('Delete selected item?') && toast('Delete action confirmed.', 'success');
      } else if (/Call/i.test(label)) {
        button.onclick = () => toast('Open a lead from My Leads to place/log a real call.', 'info');
      } else if (/Mark Done|View All|View/i.test(label)) {
        button.onclick = () => toast('Action available when backend data is loaded.', 'info');
      }
    });
  }

  function filterRows(table, query) {
    const value = String(query || '').toLowerCase();
    qsa('tbody tr', table).forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(value) ? '' : 'none';
    });
  }

  function saveSettings() {
    const values = {};
    qsa('input, select, textarea').forEach((field, index) => values[field.name || field.id || 'field_' + index] = field.value);
    localStorage.setItem('crm_settings', JSON.stringify(values));
    toast('Settings saved locally.', 'success');
  }

  function resetFormPage() {
    if (!confirm('Reset fields on this page?')) return;
    qsa('input, textarea').forEach(field => field.value = '');
    qsa('select').forEach(field => field.selectedIndex = 0);
    toast('Fields reset.', 'success');
  }

  function enhanceListsPage() {
    if (!location.pathname.endsWith('manage-lists.html')) return;
    const createButton = qsa('#listModal .btn-primary').pop();
    if (createButton) createButton.onclick = createListCard;
    const importButton = qsa('button').find(button => text(button) === 'Import CSV');
    if (importButton) importButton.onclick = () => location.href = 'manage-leads.html';
  }

  function createListCard() {
    const modal = qs('#listModal');
    const name = qs('input', modal).value.trim();
    const source = qs('select', modal).value;
    if (!name) return toast('Please enter list name.', 'error');
    const grid = qs('.list-grid');
    const card = document.createElement('div');
    card.className = 'list-card';
    card.innerHTML = `<div class="lc-header"><div class="lc-name">${escapeHtml(name)}</div><span class="lc-source">${escapeHtml(source)}</span></div>
      <div class="lc-bar-wrap"><div class="lc-bar" style="width:0%; background: var(--accent);"></div></div>
      <div class="lc-stats"><span><strong>0</strong> leads</span><span>0 open</span><span>0 admitted</span></div>`;
    grid.prepend(card);
    modal.classList.remove('show');
    qsa('input', modal).forEach(input => input.value = '');
    toast('List created.', 'success');
  }

  function enhanceCoursesPage() {
    if (!location.pathname.endsWith('courses.html')) return;
    const exportButton = qsa('button').find(button => text(button) === 'Export List');
    if (exportButton) exportButton.onclick = () => exportTableToCSV('.lead-table', 'courses.csv');
    const saveButton = qsa('#courseModal .btn-primary').pop();
    if (saveButton && !window.saveCourse) saveButton.onclick = saveCourse;
    if (!window.editCourse) window.editCourse = window.openCourseEditor || openCourseEditor;
    if (!window.openCourseEditor) window.openCourseEditor = openCourseEditor;
    if (!window.showCourseDetails) window.showCourseDetails = showCourseDetails;
  }

  async function saveCourse() {
    const modal = qs('#courseModal');
    const inputs = qsa('input', modal);
    const name = inputs[1].value.trim() || inputs[0].value.trim();
    const code = inputs[0].value.trim().toUpperCase();
    const durationText = qs('select', modal).value;
    const seats = Number(inputs[2].value) || 60;
    const description = qs('textarea', modal).value.trim();
    if (!name || !code) return toast('Course name and code are required.', 'error');
    try {
      await post('/api/courses', {
        name,
        code,
        durationMonths: (parseInt(durationText, 10) || 1) * 12,
        fees: 0,
        totalSeats: seats,
        filledSeats: 0,
        status: 'ACTIVE',
        description
      });
      modal.classList.remove('show');
      toast('Course saved.', 'success');
      if (window.loadCourses) loadCourses();
    } catch (error) {
      toast('Could not save course: ' + error.message, 'error');
    }
  }

  function openCourseEditor(code) {
    const modal = qs('#courseModal');
    if (!modal) return;
    qsa('input', modal)[0].value = code || '';
    modal.classList.add('show');
  }

  function showCourseDetails(code) {
    toast((code || 'Course') + ' details are visible in course distribution table.', 'info');
  }

  function enhanceReportsPage() {
    if (!location.pathname.endsWith('reports.html') && !location.pathname.endsWith('counselor-reports.html')) return;
    qsa('button').forEach(button => {
      if (/Export/i.test(text(button))) button.onclick = () => window.print();
      if (/This Month/i.test(text(button))) button.onclick = () => toast('Monthly report filter selected.', 'success');
    });
  }

  function enhanceFollowupsPage() {
    if (!location.pathname.endsWith('follow-ups.html')) return;
    const schedule = qsa('button').find(button => text(button).includes('Schedule Follow-up'));
    if (schedule) schedule.onclick = () => toast('Admin can monitor follow-ups; counselors schedule them from Counselor Follow-ups.', 'info');
  }

  function enhanceManageLeadsImport() {
    if (!location.pathname.endsWith('manage-leads.html')) return;
    const importButton = qsa('#importModal .btn-primary').pop();
    if (importButton) importButton.onclick = () => toast('Please upload a real CSV file.', 'info');
  }


  function enhanceAdmissionsLinks() {
    const hasAdmissionLink = !!qs('a[href="admissions.html"]');
    if (hasAdmissionLink || !qs('.sidebar')) return;
    const callLink = qs('a[href="call-records.html"]');
    if (!callLink) return;
    const admissionLink = document.createElement('a');
    admissionLink.href = 'admissions.html';
    admissionLink.className = 'nav-item';
    admissionLink.innerHTML = 'Admissions';
    callLink.insertAdjacentElement('afterend', admissionLink);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  }

  document.addEventListener('DOMContentLoaded', () => {
    attachGenericButtons();
    enhanceListsPage();
    enhanceCoursesPage();
    enhanceReportsPage();
    enhanceFollowupsPage();
    enhanceManageLeadsImport();
    enhanceAdmissionsLinks();
  });
})();
