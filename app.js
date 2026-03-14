const KEYS = {
  usuarios: 'usuarios',
  sesion: 'usuarioActivo',
  data: 'schoolSystemDataV2',
};

const DEFAULT_USUARIO = {
  id: 1,
  nombre: 'Administrador',
  usuario: 'admin',
  password: '1234',
  rol: 'admin',
};

const defaultData = {
  alumnos: [],
  carreras: [],
  clases: [],
  anios: [],
};

let data = loadData();

const refs = {
  loginView: document.getElementById('login-view'),
  appView: document.getElementById('app-view'),
  loginForm: document.getElementById('login-form'),
  loginUsuario: document.getElementById('login-usuario'),
  loginPassword: document.getElementById('login-password'),
  loginMessage: document.getElementById('login-message'),
  welcomeText: document.getElementById('welcome-text'),
  logoutBtn: document.getElementById('logout-btn'),

  tabButtons: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),

  statAlumnos: document.getElementById('stat-alumnos'),
  statCarreras: document.getElementById('stat-carreras'),
  statClases: document.getElementById('stat-clases'),
  statAnios: document.getElementById('stat-anios'),

  formAlumno: document.getElementById('form-alumno'),
  alumnoId: document.getElementById('alumno-id'),
  alumnoNombre: document.getElementById('alumno-nombre'),
  alumnoApellido: document.getElementById('alumno-apellido'),
  alumnoDocumento: document.getElementById('alumno-documento'),
  alumnoCorreo: document.getElementById('alumno-correo'),
  alumnoSearch: document.getElementById('alumno-search'),
  alumnoMessage: document.getElementById('alumno-message'),
  alumnoSubmit: document.getElementById('alumno-submit'),
  tablaAlumnos: document.getElementById('tabla-alumnos'),

  formCarrera: document.getElementById('form-carrera'),
  carreraId: document.getElementById('carrera-id'),
  carreraNombre: document.getElementById('carrera-nombre'),
  carreraMessage: document.getElementById('carrera-message'),
  carreraSubmit: document.getElementById('carrera-submit'),
  tablaCarreras: document.getElementById('tabla-carreras'),

  formClase: document.getElementById('form-clase'),
  claseId: document.getElementById('clase-id'),
  claseNombre: document.getElementById('clase-nombre'),
  claseMessage: document.getElementById('clase-message'),
  claseSubmit: document.getElementById('clase-submit'),
  tablaClases: document.getElementById('tabla-clases'),

  formAnio: document.getElementById('form-anio'),
  anioId: document.getElementById('anio-id'),
  anioNombre: document.getElementById('anio-nombre'),
  anioMessage: document.getElementById('anio-message'),
  anioSubmit: document.getElementById('anio-submit'),
  tablaAnios: document.getElementById('tabla-anios'),
};

// ---------------------- utilidades ----------------------
function loadJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return structuredClone(fallback);
  try {
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallback);
  }
}

function saveData() {
  localStorage.setItem(KEYS.data, JSON.stringify(data));
}

function loadData() {
  const parsed = loadJSON(KEYS.data, defaultData);
  return {
    ...structuredClone(defaultData),
    ...parsed,
  };
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function nextId(list) {
  if (!list.length) return 1;
  return Math.max(...list.map((item) => Number(item.id) || 0)) + 1;
}

function showMessage(element, text, type = '') {
  element.textContent = text;
  element.className = `message ${type}`.trim();
}

function clearMessage(element) {
  showMessage(element, '', '');
}

function ensureDefaultUsuarios() {
  const usuarios = loadJSON(KEYS.usuarios, []);
  if (!usuarios.length) {
    localStorage.setItem(KEYS.usuarios, JSON.stringify([DEFAULT_USUARIO]));
  }
}

// ---------------------- autenticación ----------------------
function obtenerUsuarios() {
  return loadJSON(KEYS.usuarios, []);
}

function obtenerSesion() {
  return loadJSON(KEYS.sesion, null);
}

function guardarSesion(usuario) {
  localStorage.setItem(
    KEYS.sesion,
    JSON.stringify({
      id: usuario.id,
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      rol: usuario.rol,
    }),
  );
}

function cerrarSesion() {
  localStorage.removeItem(KEYS.sesion);
  refs.loginForm.reset();
  clearMessage(refs.loginMessage);
  toggleViews();
}

function validarCredenciales(usuarioIngresado, passwordIngresado) {
  const usuarios = obtenerUsuarios();
  return usuarios.find(
    (u) => u.usuario === usuarioIngresado && u.password === passwordIngresado,
  );
}

function toggleViews() {
  const sesion = obtenerSesion();
  const haySesion = Boolean(sesion);

  refs.loginView.classList.toggle('hidden', haySesion);
  refs.appView.classList.toggle('hidden', !haySesion);

  if (haySesion) {
    refs.welcomeText.textContent = `Bienvenido, ${sesion.nombre} (${sesion.rol})`;
    renderAll();
  }
}

function setupAuthEvents() {
  refs.loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const usuario = refs.loginUsuario.value.trim();
    const password = refs.loginPassword.value.trim();

    if (!usuario || !password) {
      showMessage(refs.loginMessage, 'Debe completar usuario y contraseña.', 'error');
      return;
    }

    const encontrado = validarCredenciales(usuario, password);
    if (!encontrado) {
      showMessage(refs.loginMessage, 'Credenciales inválidas.', 'error');
      return;
    }

    guardarSesion(encontrado);
    refs.loginForm.reset();
    clearMessage(refs.loginMessage);
    toggleViews();
  });

  refs.logoutBtn.addEventListener('click', cerrarSesion);
}

// ---------------------- navegación / dashboard ----------------------
function setupTabs() {
  refs.tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      refs.tabButtons.forEach((b) => b.classList.remove('active'));
      refs.tabContents.forEach((section) => section.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
}

function renderDashboard() {
  refs.statAlumnos.textContent = data.alumnos.length;
  refs.statCarreras.textContent = data.carreras.length;
  refs.statClases.textContent = data.clases.length;
  refs.statAnios.textContent = data.anios.length;
}

// ---------------------- alumnos ----------------------
function alumnoDuplicado(payload, excludeId = null) {
  return data.alumnos.some((alumno) => {
    if (excludeId !== null && Number(alumno.id) === Number(excludeId)) return false;
    return (
      normalize(alumno.documento) === normalize(payload.documento)
      || normalize(alumno.correo) === normalize(payload.correo)
    );
  });
}

function resetAlumnoForm() {
  refs.formAlumno.reset();
  refs.alumnoId.value = '';
  refs.alumnoSubmit.textContent = 'Guardar alumno';
}

function renderAlumnos() {
  const filtro = normalize(refs.alumnoSearch.value || '');
  const alumnosFiltrados = data.alumnos.filter((a) => {
    if (!filtro) return true;
    return `${a.nombre} ${a.apellido} ${a.documento} ${a.correo}`.toLowerCase().includes(filtro);
  });

  refs.tablaAlumnos.innerHTML = '';
  if (!alumnosFiltrados.length) {
    refs.tablaAlumnos.innerHTML = '<tr><td class="empty-row" colspan="4">No hay alumnos para mostrar.</td></tr>';
    return;
  }

  alumnosFiltrados.forEach((alumno) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${alumno.nombre} ${alumno.apellido}</td>
      <td>${alumno.documento}</td>
      <td>${alumno.correo}</td>
      <td>
        <div class="actions">
          <button type="button" class="edit-btn" data-id="${alumno.id}">Editar</button>
          <button type="button" class="delete-btn" data-id="${alumno.id}">Eliminar</button>
        </div>
      </td>
    `;
    refs.tablaAlumnos.appendChild(tr);
  });
}

function setupAlumnos() {
  refs.formAlumno.addEventListener('submit', (event) => {
    event.preventDefault();
    const payload = {
      nombre: refs.alumnoNombre.value.trim(),
      apellido: refs.alumnoApellido.value.trim(),
      documento: refs.alumnoDocumento.value.trim(),
      correo: refs.alumnoCorreo.value.trim(),
    };

    if (!payload.nombre || !payload.apellido || !payload.documento || !payload.correo) {
      showMessage(refs.alumnoMessage, 'Complete todos los campos del alumno.', 'error');
      return;
    }

    const editId = refs.alumnoId.value;
    if (alumnoDuplicado(payload, editId || null)) {
      showMessage(refs.alumnoMessage, 'Documento o correo ya existe en otro alumno.', 'error');
      return;
    }

    if (editId) {
      const idx = data.alumnos.findIndex((a) => Number(a.id) === Number(editId));
      if (idx >= 0) data.alumnos[idx] = { id: Number(editId), ...payload };
      showMessage(refs.alumnoMessage, 'Alumno actualizado correctamente.', 'success');
    } else {
      data.alumnos.push({ id: nextId(data.alumnos), ...payload });
      showMessage(refs.alumnoMessage, 'Alumno creado correctamente.', 'success');
    }

    saveData();
    resetAlumnoForm();
    renderAll();
  });

  refs.alumnoSearch.addEventListener('input', renderAlumnos);

  refs.tablaAlumnos.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const id = Number(target.dataset.id);
    const alumno = data.alumnos.find((a) => Number(a.id) === id);
    if (!alumno) return;

    if (target.classList.contains('edit-btn')) {
      refs.alumnoId.value = alumno.id;
      refs.alumnoNombre.value = alumno.nombre;
      refs.alumnoApellido.value = alumno.apellido;
      refs.alumnoDocumento.value = alumno.documento;
      refs.alumnoCorreo.value = alumno.correo;
      refs.alumnoSubmit.textContent = 'Actualizar alumno';
      showMessage(refs.alumnoMessage, 'Editando alumno seleccionado.', 'success');
    }

    if (target.classList.contains('delete-btn')) {
      const ok = confirm(`¿Seguro que desea eliminar al alumno ${alumno.nombre} ${alumno.apellido}?`);
      if (!ok) return;

      data.alumnos = data.alumnos.filter((a) => Number(a.id) !== id);
      saveData();
      showMessage(refs.alumnoMessage, 'Alumno eliminado correctamente.', 'success');
      resetAlumnoForm();
      renderAll();
    }
  });
}

// ---------------------- carreras / clases / años ----------------------
function buildSimpleCRUD(config) {
  const { nombreEntidad, collectionKey, form, idInput, nombreInput, tabla, submitBtn, message } = config;

  function duplicado(nombre, excludeId = null) {
    return data[collectionKey].some((item) => {
      if (excludeId !== null && Number(item.id) === Number(excludeId)) return false;
      return normalize(item.nombre) === normalize(nombre);
    });
  }

  function resetForm() {
    form.reset();
    idInput.value = '';
    submitBtn.textContent = `Guardar ${nombreEntidad}`;
  }

  function renderTable() {
    tabla.innerHTML = '';
    if (!data[collectionKey].length) {
      tabla.innerHTML = '<tr><td class="empty-row" colspan="2">No hay registros.</td></tr>';
      return;
    }

    data[collectionKey].forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.nombre}</td>
        <td>
          <div class="actions">
            <button type="button" class="edit-btn" data-id="${item.id}">Editar</button>
            <button type="button" class="delete-btn" data-id="${item.id}">Eliminar</button>
          </div>
        </td>
      `;
      tabla.appendChild(tr);
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const nombre = nombreInput.value.trim();
    const editId = idInput.value;

    if (!nombre) {
      showMessage(message, `El nombre de ${nombreEntidad} es obligatorio.`, 'error');
      return;
    }

    if (duplicado(nombre, editId || null)) {
      showMessage(message, `Ya existe un registro duplicado de ${nombreEntidad}.`, 'error');
      return;
    }

    if (editId) {
      const idx = data[collectionKey].findIndex((i) => Number(i.id) === Number(editId));
      if (idx >= 0) data[collectionKey][idx] = { id: Number(editId), nombre };
      showMessage(message, `${capitalize(nombreEntidad)} actualizada correctamente.`, 'success');
    } else {
      data[collectionKey].push({ id: nextId(data[collectionKey]), nombre });
      showMessage(message, `${capitalize(nombreEntidad)} creada correctamente.`, 'success');
    }

    saveData();
    resetForm();
    renderAll();
  });

  tabla.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const id = Number(target.dataset.id);
    const item = data[collectionKey].find((i) => Number(i.id) === id);
    if (!item) return;

    if (target.classList.contains('edit-btn')) {
      idInput.value = item.id;
      nombreInput.value = item.nombre;
      submitBtn.textContent = `Actualizar ${nombreEntidad}`;
      showMessage(message, `Editando ${nombreEntidad} seleccionada.`, 'success');
    }

    if (target.classList.contains('delete-btn')) {
      const ok = confirm(`¿Seguro que desea eliminar ${nombreEntidad}: ${item.nombre}?`);
      if (!ok) return;
      data[collectionKey] = data[collectionKey].filter((i) => Number(i.id) !== id);
      saveData();
      showMessage(message, `${capitalize(nombreEntidad)} eliminada correctamente.`, 'success');
      resetForm();
      renderAll();
    }
  });

  return {
    render: renderTable,
  };
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const carreraModule = buildSimpleCRUD({
  nombreEntidad: 'carrera',
  collectionKey: 'carreras',
  form: refs.formCarrera,
  idInput: refs.carreraId,
  nombreInput: refs.carreraNombre,
  tabla: refs.tablaCarreras,
  submitBtn: refs.carreraSubmit,
  message: refs.carreraMessage,
});

const claseModule = buildSimpleCRUD({
  nombreEntidad: 'clase',
  collectionKey: 'clases',
  form: refs.formClase,
  idInput: refs.claseId,
  nombreInput: refs.claseNombre,
  tabla: refs.tablaClases,
  submitBtn: refs.claseSubmit,
  message: refs.claseMessage,
});

const anioModule = buildSimpleCRUD({
  nombreEntidad: 'año escolar',
  collectionKey: 'anios',
  form: refs.formAnio,
  idInput: refs.anioId,
  nombreInput: refs.anioNombre,
  tabla: refs.tablaAnios,
  submitBtn: refs.anioSubmit,
  message: refs.anioMessage,
});

function renderAll() {
  renderDashboard();
  renderAlumnos();
  carreraModule.render();
  claseModule.render();
  anioModule.render();
}

function init() {
  ensureDefaultUsuarios();
  setupAuthEvents();
  setupTabs();
  setupAlumnos();
  toggleViews();
}

init();
