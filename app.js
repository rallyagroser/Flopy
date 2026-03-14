const STORAGE_KEY = 'schoolSystemData';

const defaultState = {
  careers: [],
  classes: [],
  years: [],
  students: [],
  links: {
    careerYear: [],
    yearClass: [],
    studentYear: [],
  },
};

const state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      links: {
        ...structuredClone(defaultState).links,
        ...(parsed.links || {}),
      },
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

const refs = {
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),

  careerForm: document.getElementById('career-form'),
  classForm: document.getElementById('class-form'),
  yearForm: document.getElementById('year-form'),
  studentForm: document.getElementById('student-form'),

  careerList: document.getElementById('career-list'),
  classList: document.getElementById('class-list'),
  yearList: document.getElementById('year-list'),
  studentList: document.getElementById('student-list'),

  careerYearForm: document.getElementById('career-year-form'),
  yearClassForm: document.getElementById('year-class-form'),
  studentYearForm: document.getElementById('student-year-form'),

  careerSelect: document.getElementById('career-select'),
  yearForCareerSelect: document.getElementById('year-for-career-select'),
  yearForClassSelect: document.getElementById('year-for-class-select'),
  classSelect: document.getElementById('class-select'),
  studentSelect: document.getElementById('student-select'),
  yearForStudentSelect: document.getElementById('year-for-student-select'),

  careerYearList: document.getElementById('career-year-list'),
  yearClassList: document.getElementById('year-class-list'),
  studentYearList: document.getElementById('student-year-list'),

  summaryBody: document.getElementById('student-summary-body'),
  emptyRowTemplate: document.getElementById('empty-row-template'),
};

function setTabs() {
  refs.tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      refs.tabButtons.forEach((b) => b.classList.remove('active'));
      refs.tabContents.forEach((s) => s.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

function renderSimpleList(container, items, formatter) {
  container.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = 'Sin registros.';
    container.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = formatter(item);
    container.appendChild(li);
  });
}

function fillSelect(select, items, placeholder, format = (i) => i.name) {
  select.innerHTML = '';
  const option = document.createElement('option');
  option.value = '';
  option.disabled = true;
  option.selected = true;
  option.textContent = placeholder;
  select.appendChild(option);

  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = format(item);
    select.appendChild(opt);
  });
}

function byId(list, id) {
  return list.find((item) => item.id === id);
}

function renderEntityLists() {
  renderSimpleList(refs.careerList, state.careers, (c) => c.name);
  renderSimpleList(refs.classList, state.classes, (c) => c.name);
  renderSimpleList(refs.yearList, state.years, (y) => y.name);
  renderSimpleList(refs.studentList, state.students, (s) => `${s.firstName} ${s.lastName} | ${s.document} | ${s.email}`);
}

function renderAssociationLists() {
  renderSimpleList(refs.careerYearList, state.links.careerYear, (link) => {
    const career = byId(state.careers, link.careerId);
    const year = byId(state.years, link.yearId);
    return `${career?.name || 'Carrera eliminada'} ↔ ${year?.name || 'Año eliminado'}`;
  });

  renderSimpleList(refs.yearClassList, state.links.yearClass, (link) => {
    const year = byId(state.years, link.yearId);
    const classItem = byId(state.classes, link.classId);
    return `${year?.name || 'Año eliminado'} ↔ ${classItem?.name || 'Clase eliminada'}`;
  });

  renderSimpleList(refs.studentYearList, state.links.studentYear, (link) => {
    const student = byId(state.students, link.studentId);
    const year = byId(state.years, link.yearId);
    return `${student ? `${student.firstName} ${student.lastName}` : 'Alumno eliminado'} ↔ ${year?.name || 'Año eliminado'}`;
  });
}

function renderSelectors() {
  fillSelect(refs.careerSelect, state.careers, 'Selecciona carrera');
  fillSelect(refs.yearForCareerSelect, state.years, 'Selecciona año');
  fillSelect(refs.yearForClassSelect, state.years, 'Selecciona año');
  fillSelect(refs.classSelect, state.classes, 'Selecciona clase');
  fillSelect(refs.studentSelect, state.students, 'Selecciona alumno', (s) => `${s.firstName} ${s.lastName}`);
  fillSelect(refs.yearForStudentSelect, state.years, 'Selecciona año');
}

function careerNamesByYear(yearId) {
  return state.links.careerYear
    .filter((link) => link.yearId === yearId)
    .map((link) => byId(state.careers, link.careerId)?.name)
    .filter(Boolean);
}

function renderSummaryTable() {
  refs.summaryBody.innerHTML = '';
  if (!state.students.length) {
    const row = refs.emptyRowTemplate.content.firstElementChild.cloneNode(true);
    refs.summaryBody.appendChild(row);
    return;
  }

  state.students.forEach((student) => {
    const relation = state.links.studentYear.find((link) => link.studentId === student.id);
    const yearName = relation ? byId(state.years, relation.yearId)?.name || 'Año no encontrado' : 'Sin año asignado';

    let career = 'Sin carrera asociada';
    if (relation) {
      const careers = careerNamesByYear(relation.yearId);
      if (careers.length) career = careers.join(', ');
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${student.firstName} ${student.lastName}</td>
      <td>${career}</td>
      <td>${yearName}</td>
    `;
    refs.summaryBody.appendChild(tr);
  });
}

function rerender() {
  saveState();
  renderEntityLists();
  renderSelectors();
  renderAssociationLists();
  renderSummaryTable();
}

function isDuplicate(list, check) {
  return list.some(check);
}

refs.careerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.getElementById('career-name');
  const name = input.value.trim();
  if (!name || isDuplicate(state.careers, (item) => item.name.toLowerCase() === name.toLowerCase())) return;

  state.careers.push({ id: uid('career'), name });
  input.value = '';
  rerender();
});

refs.classForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.getElementById('class-name');
  const name = input.value.trim();
  if (!name || isDuplicate(state.classes, (item) => item.name.toLowerCase() === name.toLowerCase())) return;

  state.classes.push({ id: uid('class'), name });
  input.value = '';
  rerender();
});

refs.yearForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.getElementById('year-name');
  const name = input.value.trim();
  if (!name || isDuplicate(state.years, (item) => item.name.toLowerCase() === name.toLowerCase())) return;

  state.years.push({ id: uid('year'), name });
  input.value = '';
  rerender();
});

refs.studentForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const firstNameInput = document.getElementById('student-firstname');
  const lastNameInput = document.getElementById('student-lastname');
  const documentInput = document.getElementById('student-id');
  const emailInput = document.getElementById('student-email');

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const documentNumber = documentInput.value.trim();
  const email = emailInput.value.trim();

  if (!firstName || !lastName || !documentNumber || !email) return;
  if (isDuplicate(state.students, (s) => s.document === documentNumber || s.email.toLowerCase() === email.toLowerCase())) return;

  state.students.push({
    id: uid('student'),
    firstName,
    lastName,
    document: documentNumber,
    email,
  });

  refs.studentForm.reset();
  rerender();
});

refs.careerYearForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const careerId = refs.careerSelect.value;
  const yearId = refs.yearForCareerSelect.value;
  if (!careerId || !yearId) return;

  const exists = isDuplicate(state.links.careerYear, (link) => link.careerId === careerId && link.yearId === yearId);
  if (!exists) state.links.careerYear.push({ careerId, yearId });

  refs.careerYearForm.reset();
  rerender();
});

refs.yearClassForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const yearId = refs.yearForClassSelect.value;
  const classId = refs.classSelect.value;
  if (!yearId || !classId) return;

  const exists = isDuplicate(state.links.yearClass, (link) => link.yearId === yearId && link.classId === classId);
  if (!exists) state.links.yearClass.push({ yearId, classId });

  refs.yearClassForm.reset();
  rerender();
});

refs.studentYearForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const studentId = refs.studentSelect.value;
  const yearId = refs.yearForStudentSelect.value;
  if (!studentId || !yearId) return;

  const idx = state.links.studentYear.findIndex((link) => link.studentId === studentId);
  if (idx >= 0) {
    state.links.studentYear[idx].yearId = yearId;
  } else {
    state.links.studentYear.push({ studentId, yearId });
  }

  refs.studentYearForm.reset();
  rerender();
});

setTabs();
rerender();
