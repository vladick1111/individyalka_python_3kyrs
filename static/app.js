const API_URL = '';
let token = localStorage.getItem('token');
let currentUser = null;

// Проверяем авторизацию при загрузке
document.addEventListener('DOMContentLoaded', function() {
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }
});

// Функции переключения форм
function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadCurrentUser();
    loadStatistics();
}

// Загрузка текущего пользователя
async function loadCurrentUser() {
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            document.getElementById('auth-section').innerHTML = `
                <span class="navbar-text">Добро пожаловать, ${currentUser.email}!</span>
                <button class="btn btn-outline-light btn-sm ms-2" onclick="logout()">Выйти</button>
            `;
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
    }
}

// Логин
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('username', document.getElementById('email').value);
    formData.append('password', document.getElementById('password').value);

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            token = data.access_token;
            localStorage.setItem('token', token);
            showDashboard();
        } else {
            alert('Ошибка входа: неверный email или пароль');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
});

// Регистрация
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const userData = {
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
    };

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            alert('Регистрация успешна! Теперь войдите в систему.');
            showLogin();
        } else {
            const error = await response.json();
            alert('Ошибка регистрации: ' + error.detail);
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
});

// Загрузка статистики
async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/admin/statistics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            document.getElementById('projects-count').textContent = stats.total_projects;
            document.getElementById('tasks-count').textContent = stats.total_tasks;
            document.getElementById('employees-count').textContent = stats.total_employees;
            document.getElementById('users-count').textContent = stats.total_users;
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// ========== ПРОЕКТЫ ==========
async function loadProjects() {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const projects = await response.json();
            displayProjects(projects);
        }
    } catch (error) {
        console.error('Ошибка загрузки проектов:', error);
    }
}

function displayProjects(projects) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Проекты (${projects.length})</h5>
                <button class="btn btn-primary btn-sm" onclick="showCreateProjectForm()">+ Новый проект</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Название</th>
                                <th>Описание</th>
                                <th>Статус</th>
                                <th>Дата начала</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${projects.map(project => `
                                <tr>
                                    <td>${project.id}</td>
                                    <td>${project.name}</td>
                                    <td>${project.description || '-'}</td>
                                    <td><span class="badge bg-${getStatusBadge(project.status)}">${project.status}</span></td>
                                    <td>${new Date(project.start_date).toLocaleDateString()}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="viewProject(${project.id})">Просмотр</button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProject(${project.id})">Удалить</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function showCreateProjectForm() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Создать новый проект</h5>
            </div>
            <div class="card-body">
                <form id="createProjectForm">
                    <div class="mb-3">
                        <label class="form-label">Название проекта</label>
                        <input type="text" class="form-control" id="projectName" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Описание</label>
                        <textarea class="form-control" id="projectDescription" rows="3"></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Статус</label>
                        <select class="form-select" id="projectStatus">
                            <option value="planned">Запланирован</option>
                            <option value="active">Активен</option>
                            <option value="completed">Завершен</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Дата начала</label>
                        <input type="datetime-local" class="form-control" id="projectStartDate" required>
                    </div>
                    <button type="submit" class="btn btn-success">Создать проект</button>
                    <button type="button" class="btn btn-secondary" onclick="loadProjects()">Отмена</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('createProjectForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const projectData = {
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDescription').value,
            status: document.getElementById('projectStatus').value,
            start_date: document.getElementById('projectStartDate').value + ':00'
        };

        try {
            const response = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(projectData)
            });

            if (response.ok) {
                alert('Проект успешно создан!');
                loadProjects();
            } else {
                alert('Ошибка создания проекта');
            }
        } catch (error) {
            alert('Ошибка подключения к серверу');
        }
    });
}

// ========== ЗАДАЧИ ==========
async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const tasks = await response.json();
            displayTasks(tasks);
        }
    } catch (error) {
        console.error('Ошибка загрузки задач:', error);
    }
}

function displayTasks(tasks) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Задачи (${tasks.length})</h5>
                <button class="btn btn-primary btn-sm" onclick="showCreateTaskForm()">+ Новая задача</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Название</th>
                                <th>Статус</th>
                                <th>Приоритет</th>
                                <th>Проект</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tasks.map(task => `
                                <tr>
                                    <td>${task.id}</td>
                                    <td>${task.title}</td>
                                    <td><span class="badge bg-${getStatusBadge(task.status)}">${task.status}</span></td>
                                    <td><span class="badge bg-${getPriorityBadge(task.priority)}">${task.priority}</span></td>
                                    <td>${task.project_name || '-'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="viewTask(${task.id})">Просмотр</button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteTask(${task.id})">Удалить</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}


function showCreateTaskForm() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Создать новую задачу</h5>
            </div>
            <div class="card-body">
                <form id="createTaskForm">
                    <div class="mb-3">
                        <label class="form-label">Название задачи</label>
                        <input type="text" class="form-control" id="taskTitle" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Описание</label>
                        <textarea class="form-control" id="taskDescription" rows="3"></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Статус</label>
                                <select class="form-select" id="taskStatus">
                                    <option value="pending">Ожидает</option>
                                    <option value="in_progress">В работе</option>
                                    <option value="completed">Завершена</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Приоритет</label>
                                <select class="form-select" id="taskPriority">
                                    <option value="low">Низкий</option>
                                    <option value="medium" selected>Средний</option>
                                    <option value="high">Высокий</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Срок выполнения (опционально)</label>
                        <input type="datetime-local" class="form-control" id="taskDueDate">
                    </div>
                    <button type="submit" class="btn btn-success">Создать задачу</button>
                    <button type="button" class="btn btn-secondary" onclick="loadTasks()">Отмена</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('createTaskForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            due_date: document.getElementById('taskDueDate').value ?
                     document.getElementById('taskDueDate').value + ':00' : null
        };

        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                alert('Задача успешно создана!');
                loadTasks();
            } else {
                const error = await response.json();
                alert('Ошибка создания задачи: ' + error.detail);
            }
        } catch (error) {
            alert('Ошибка подключения к серверу: ' + error.message);
        }
    });
}


// ========== СОТРУДНИКИ ==========
async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const employees = await response.json();
            displayEmployees(employees);
        }
    } catch (error) {
        console.error('Ошибка загрузки сотрудников:', error);
    }
}

function displayEmployees(employees) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Сотрудники (${employees.length})</h5>
                <button class="btn btn-primary btn-sm" onclick="showCreateEmployeeForm()">+ Новый сотрудник</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>ФИО</th>
                                <th>Телефон</th>
                                <th>Дата рождения</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${employees.map(emp => `
                                <tr>
                                    <td>${emp.id}</td>
                                    <td>${emp.last_name} ${emp.first_name} ${emp.middle_name}</td>
                                    <td>${emp.phone}</td>
                                    <td>${new Date(emp.birth_date).toLocaleDateString()}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="viewEmployee(${emp.id})">Просмотр</button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${emp.id})">Удалить</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function showCreateEmployeeForm() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Добавить нового сотрудника</h5>
            </div>
            <div class="card-body">
                <form id="createEmployeeForm">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Фамилия</label>
                                <input type="text" class="form-control" id="employeeLastName" required>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Имя</label>
                                <input type="text" class="form-control" id="employeeFirstName" required>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Отчество</label>
                                <input type="text" class="form-control" id="employeeMiddleName">
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Дата рождения</label>
                        <input type="date" class="form-control" id="employeeBirthDate" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Телефон</label>
                        <input type="tel" class="form-control" id="employeePhone" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Адрес</label>
                        <textarea class="form-control" id="employeeAddress" rows="2" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-success">Добавить сотрудника</button>
                    <button type="button" class="btn btn-secondary" onclick="loadEmployees()">Отмена</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('createEmployeeForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const employeeData = {
            first_name: document.getElementById('employeeFirstName').value,
            last_name: document.getElementById('employeeLastName').value,
            middle_name: document.getElementById('employeeMiddleName').value,
            birth_date: document.getElementById('employeeBirthDate').value + 'T00:00:00',
            phone: document.getElementById('employeePhone').value,
            address: document.getElementById('employeeAddress').value
        };

        try {
            const response = await fetch(`${API_URL}/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(employeeData)
            });

            if (response.ok) {
                alert('Сотрудник успешно добавлен!');
                loadEmployees();
            } else {
                const error = await response.json();
                alert('Ошибка добавления сотрудника: ' + error.detail);
            }
        } catch (error) {
            alert('Ошибка подключения к серверу: ' + error.message);
        }
    });
}


// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function getStatusBadge(status) {
    const statusMap = {
        'active': 'success',
        'planned': 'warning',
        'completed': 'secondary',
        'in_progress': 'primary',
        'pending': 'info'
    };
    return statusMap[status] || 'primary';
}

function getPriorityBadge(priority) {
    const priorityMap = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'success'
    };
    return priorityMap[priority] || 'primary';
}

// Выход
function logout() {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    showLogin();
    document.getElementById('auth-section').innerHTML = '';
}

// Заглушки для функций которые нужно доделать
function viewProject(id) { alert('Просмотр проекта ' + id); }
function deleteProject(id) {
    if (confirm('Удалить проект?')) {
        fetch(`${API_URL}/projects/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then(() => loadProjects());
    }
}
function viewTask(id) { alert('Просмотр задачи ' + id); }
function deleteTask(id) {
    if (confirm('Удалить задачу?')) {
        fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then(() => loadTasks());
    }
}
function viewEmployee(id) { alert('Просмотр сотрудника ' + id); }
function deleteEmployee(id) {
    if (confirm('Удалить сотрудника?')) {
        fetch(`${API_URL}/employees/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then(() => loadEmployees());
    }
}


// ========== КОММЕНТАРИИ ==========
async function loadComments() {
    try {
        const response = await fetch(`${API_URL}/comments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const comments = await response.json();
            displayComments(comments);
        }
    } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
    }
}

function displayComments(comments) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Комментарии (${comments.length})</h5>
                <button class="btn btn-primary btn-sm" onclick="showCreateCommentForm()">+ Новый комментарий</button>
            </div>
            <div class="card-body">
                ${comments.length === 0 ?
                    '<p class="text-muted">Комментариев пока нет</p>' :
                    comments.map(comment => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start">
                                    <p class="card-text flex-grow-1">${comment.content}</p>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-warning" onclick="editComment(${comment.id})">✏️</button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteComment(${comment.id})">🗑️</button>
                                    </div>
                                </div>
                                <small class="text-muted">
                                    Задача ID: ${comment.task},
                                    Автор ID: ${comment.author},
                                    ${new Date(comment.created_at).toLocaleString()}
                                </small>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
}

function showCreateCommentForm() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Создать новый комментарий</h5>
            </div>
            <div class="card-body">
                <form id="createCommentForm">
                    <div class="mb-3">
                        <label class="form-label">ID задачи</label>
                        <input type="number" class="form-control" id="commentTaskId" required placeholder="Введите ID задачи">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Текст комментария</label>
                        <textarea class="form-control" id="commentContent" rows="4" required placeholder="Введите текст комментария..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-success">Добавить комментарий</button>
                    <button type="button" class="btn btn-secondary" onclick="loadComments()">Отмена</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('createCommentForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const commentData = {
            task_id: parseInt(document.getElementById('commentTaskId').value),
            content: document.getElementById('commentContent').value
        };

        try {
            const response = await fetch(`${API_URL}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(commentData)
            });

            if (response.ok) {
                alert('Комментарий успешно добавлен!');
                loadComments();
            } else {
                const error = await response.json();
                alert('Ошибка создания комментария: ' + error.detail);
            }
        } catch (error) {
            alert('Ошибка подключения к серверу: ' + error.message);
        }
    });
}

// ========== ЗАМЕТКИ ==========
async function loadNotes() {
    try {
        const response = await fetch(`${API_URL}/notes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const notes = await response.json();
            displayNotes(notes);
        }
    } catch (error) {
        console.error('Ошибка загрузки заметок:', error);
    }
}

function displayNotes(notes) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Заметки (${notes.length})</h5>
                <button class="btn btn-primary btn-sm" onclick="showCreateNoteForm()">+ Новая заметка</button>
            </div>
            <div class="card-body">
                ${notes.length === 0 ?
                    '<p class="text-muted">Заметок пока нет</p>' :
                    notes.map(note => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1">
                                        <h6 class="card-title">${note.title}</h6>
                                        <p class="card-text">${note.content}</p>
                                        <small class="text-muted">
                                            Создано: ${new Date(note.created_at).toLocaleString()},
                                            Обновлено: ${new Date(note.updated_at).toLocaleString()}
                                        </small>
                                    </div>
                                    <div class="btn-group ms-3">
                                        <button class="btn btn-sm btn-outline-warning" onclick="editNote(${note.id})">✏️</button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteNote(${note.id})">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
}

function showCreateNoteForm() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Создать новую заметку</h5>
            </div>
            <div class="card-body">
                <form id="createNoteForm">
                    <div class="mb-3">
                        <label class="form-label">Заголовок</label>
                        <input type="text" class="form-control" id="noteTitle" required placeholder="Введите заголовок заметки">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Содержание</label>
                        <textarea class="form-control" id="noteContent" rows="6" required placeholder="Введите содержание заметки..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-success">Создать заметку</button>
                    <button type="button" class="btn btn-secondary" onclick="loadNotes()">Отмена</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('createNoteForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const noteData = {
            title: document.getElementById('noteTitle').value,
            content: document.getElementById('noteContent').value
        };

        try {
            const response = await fetch(`${API_URL}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(noteData)
            });

            if (response.ok) {
                alert('Заметка успешно создана!');
                loadNotes();
            } else {
                const error = await response.json();
                alert('Ошибка создания заметки: ' + error.detail);
            }
        } catch (error) {
            alert('Ошибка подключения к серверу: ' + error.message);
        }
    });
}


// ========== ПРОСМОТР ПРОЕКТА ==========
async function viewProject(projectId) {
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const project = await response.json();
            displayProjectDetails(project);
        } else {
            alert('Ошибка загрузки проекта');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
}

function displayProjectDetails(project) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Проект: ${project.name}</h5>
                <div>
                    <button class="btn btn-sm btn-outline-secondary me-1" onclick="loadProjects()">← Назад</button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="editProject(${project.id})">Редактировать</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProject(${project.id})">Удалить</button>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Основная информация</h6>
                        <table class="table table-sm">
                            <tr>
                                <td><strong>ID:</strong></td>
                                <td>${project.id}</td>
                            </tr>
                            <tr>
                                <td><strong>Название:</strong></td>
                                <td>${project.name}</td>
                            </tr>
                            <tr>
                                <td><strong>Статус:</strong></td>
                                <td><span class="badge bg-${getStatusBadge(project.status)}">${project.status}</span></td>
                            </tr>
                            <tr>
                                <td><strong>Дата начала:</strong></td>
                                <td>${new Date(project.start_date).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td><strong>Дата окончания:</strong></td>
                                <td>${project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Не установлена'}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Дополнительно</h6>
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Создатель ID:</strong></td>
                                <td>${project.created_by}</td>
                            </tr>
                            <tr>
                                <td><strong>Дата создания:</strong></td>
                                <td>${new Date(project.created_at).toLocaleString()}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="mt-3">
                    <h6>Описание</h6>
                    <div class="card">
                        <div class="card-body">
                            ${project.description || '<span class="text-muted">Описание отсутствует</span>'}
                        </div>
                    </div>
                </div>

                <div class="mt-3">
                    <button class="btn btn-info" onclick="loadProjectTasks(${project.id})">Показать задачи проекта</button>
                </div>
            </div>
        </div>
    `;
}

// ========== ПРОСМОТР ЗАДАЧИ ==========
async function viewTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const task = await response.json();
            displayTaskDetails(task);
        } else {
            alert('Ошибка загрузки задачи');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
}

function displayTaskDetails(task) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Задача: ${task.title}</h5>
                <div>
                    <button class="btn btn-sm btn-outline-secondary me-1" onclick="loadTasks()">← Назад</button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="editTask(${task.id})">Редактировать</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTask(${task.id})">Удалить</button>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Основная информация</h6>
                        <table class="table table-sm">
                            <tr>
                                <td><strong>ID:</strong></td>
                                <td>${task.id}</td>
                            </tr>
                            <tr>
                                <td><strong>Название:</strong></td>
                                <td>${task.title}</td>
                            </tr>
                            <tr>
                                <td><strong>Статус:</strong></td>
                                <td><span class="badge bg-${getStatusBadge(task.status)}">${task.status}</span></td>
                            </tr>
                            <tr>
                                <td><strong>Приоритет:</strong></td>
                                <td><span class="badge bg-${getPriorityBadge(task.priority)}">${task.priority}</span></td>
                            </tr>
                            <tr>
                                <td><strong>Проект ID:</strong></td>
                                <td>${task.project || 'Не назначен'}</td>
                            </tr>
                            <tr>
                                <td><strong>Исполнитель ID:</strong></td>
                                <td>${task.assigned_to || 'Не назначен'}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Дополнительно</h6>
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Создатель ID:</strong></td>
                                <td>${task.created_by}</td>
                            </tr>
                            <tr>
                                <td><strong>Дата создания:</strong></td>
                                <td>${new Date(task.created_at).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td><strong>Срок выполнения:</strong></td>
                                <td>${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Не установлен'}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="mt-3">
                    <h6>Описание</h6>
                    <div class="card">
                        <div class="card-body">
                            ${task.description || '<span class="text-muted">Описание отсутствует</span>'}
                        </div>
                    </div>
                </div>

                <div class="mt-3">
                    <button class="btn btn-info me-2" onclick="loadTaskComments(${task.id})">Комментарии к задаче</button>
                    <button class="btn btn-secondary" onclick="loadTaskFiles(${task.id})">Файлы задачи</button>
                </div>
            </div>
        </div>
    `;
}

// ========== ПРОСМОТР СОТРУДНИКА ==========
async function viewEmployee(employeeId) {
    try {
        const response = await fetch(`${API_URL}/employees/${employeeId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const employee = await response.json();
            displayEmployeeDetails(employee);
        } else {
            alert('Ошибка загрузки сотрудника');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
}

function displayEmployeeDetails(employee) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Сотрудник: ${employee.last_name} ${employee.first_name} ${employee.middle_name}</h5>
                <div>
                    <button class="btn btn-sm btn-outline-secondary me-1" onclick="loadEmployees()">← Назад</button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="editEmployee(${employee.id})">Редактировать</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${employee.id})">Удалить</button>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Личная информация</h6>
                        <table class="table table-sm">
                            <tr>
                                <td><strong>ID:</strong></td>
                                <td>${employee.id}</td>
                            </tr>
                            <tr>
                                <td><strong>Фамилия:</strong></td>
                                <td>${employee.last_name}</td>
                            </tr>
                            <tr>
                                <td><strong>Имя:</strong></td>
                                <td>${employee.first_name}</td>
                            </tr>
                            <tr>
                                <td><strong>Отчество:</strong></td>
                                <td>${employee.middle_name || 'Не указано'}</td>
                            </tr>
                            <tr>
                                <td><strong>Дата рождения:</strong></td>
                                <td>${new Date(employee.birth_date).toLocaleDateString()}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Контактная информация</h6>
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Телефон:</strong></td>
                                <td>${employee.phone}</td>
                            </tr>
                            <tr>
                                <td><strong>Адрес:</strong></td>
                                <td>${employee.address}</td>
                            </tr>
                            <tr>
                                <td><strong>Дата приема:</strong></td>
                                <td>${new Date(employee.hire_date).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td><strong>Статус:</strong></td>
                                <td><span class="badge bg-${employee.is_active ? 'success' : 'secondary'}">${employee.is_active ? 'Активен' : 'Неактивен'}</span></td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="mt-3">
                    <button class="btn btn-info" onclick="loadEmployeeTasks(${employee.id})">Задачи сотрудника</button>
                </div>
            </div>
        </div>
    `;
}

// ========== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ==========
async function loadProjectTasks(projectId) {
    try {
        const response = await fetch(`${API_URL}/tasks/?project_id=${projectId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const tasks = await response.json();
            displayTasks(tasks);
        }
    } catch (error) {
        console.error('Ошибка загрузки задач проекта:', error);
    }
}

async function loadTaskComments(taskId) {
    try {
        const response = await fetch(`${API_URL}/comments/task/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const comments = await response.json();
            displayComments(comments);
        }
    } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
    }
}

async function loadTaskFiles(taskId) {
    try {
        const response = await fetch(`${API_URL}/files`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const files = await response.json();
            const taskFiles = files.filter(file => file.task === taskId);
            displayFiles(taskFiles);
        }
    } catch (error) {
        console.error('Ошибка загрузки файлов:', error);
    }
}

function displayFiles(files) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Файлы (${files.length})</h5>
            </div>
            <div class="card-body">
                ${files.length === 0 ?
                    '<p class="text-muted">Файлов нет</p>' :
                    files.map(file => `
                        <div class="card mb-2">
                            <div class="card-body">
                                <h6 class="card-title">${file.filename}</h6>
                                <p class="card-text">
                                    <strong>Размер:</strong> ${(file.file_size / 1024).toFixed(2)} KB<br>
                                    <strong>Тип:</strong> ${file.mime_type}<br>
                                    <strong>Путь:</strong> ${file.file_path}
                                </p>
                                <small class="text-muted">
                                    Загружено: ${new Date(file.upload_date).toLocaleString()}
                                </small>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
}


// ========== РЕДАКТИРОВАНИЕ КОММЕНТАРИЕВ ==========
async function editComment(commentId) {
    try {
        // Загружаем текущий комментарий
        const response = await fetch(`${API_URL}/comments/${commentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const comment = await response.json();
            showEditCommentForm(comment);
        } else {
            alert('Ошибка загрузки комментария');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
}

function showEditCommentForm(comment) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Редактирование комментария</h5>
            </div>
            <div class="card-body">
                <form id="editCommentForm">
                    <div class="mb-3">
                        <label class="form-label">ID задачи</label>
                        <input type="number" class="form-control" id="editCommentTaskId" value="${comment.task}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Текст комментария</label>
                        <textarea class="form-control" id="editCommentContent" rows="4" required>${comment.content}</textarea>
                    </div>
                    <button type="submit" class="btn btn-warning">Сохранить изменения</button>
                    <button type="button" class="btn btn-secondary" onclick="loadComments()">Отмена</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('editCommentForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const commentData = {
            task_id: parseInt(document.getElementById('editCommentTaskId').value),
            content: document.getElementById('editCommentContent').value
        };

        try {
            const response = await fetch(`${API_URL}/comments/${comment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(commentData)
            });

            if (response.ok) {
                alert('Комментарий успешно обновлен!');
                loadComments();
            } else {
                const error = await response.json();
                alert('Ошибка обновления комментария: ' + error.detail);
            }
        } catch (error) {
            alert('Ошибка подключения к серверу: ' + error.message);
        }
    });
}

async function deleteComment(commentId) {
    if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
        try {
            const response = await fetch(`${API_URL}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Комментарий успешно удален!');
                loadComments();
            } else {
                alert('Ошибка удаления комментария');
            }
        } catch (error) {
            alert('Ошибка подключения к серверу');
        }
    }
}

// ========== РЕДАКТИРОВАНИЕ ЗАМЕТОК ==========
async function editNote(noteId) {
    try {
        const response = await fetch(`${API_URL}/notes/${noteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const note = await response.json();
            showEditNoteForm(note);
        } else {
            alert('Ошибка загрузки заметки');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
}

function showEditNoteForm(note) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Редактирование заметки</h5>
            </div>
            <div class="card-body">
                <form id="editNoteForm">
                    <div class="mb-3">
                        <label class="form-label">Заголовок</label>
                        <input type="text" class="form-control" id="editNoteTitle" value="${note.title}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Содержание</label>
                        <textarea class="form-control" id="editNoteContent" rows="6" required>${note.content}</textarea>
                    </div>
                    <button type="submit" class="btn btn-warning">Сохранить изменения</button>
                    <button type="button" class="btn btn-secondary" onclick="loadNotes()">Отмена</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('editNoteForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const noteData = {
            title: document.getElementById('editNoteTitle').value,
            content: document.getElementById('editNoteContent').value
        };

        try {
            const response = await fetch(`${API_URL}/notes/${note.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(noteData)
            });

            if (response.ok) {
                alert('Заметка успешно обновлена!');
                loadNotes();
            } else {
                const error = await response.json();
                alert('Ошибка обновления заметки: ' + error.detail);
            }
        } catch (error) {
            alert('Ошибка подключения к серверу: ' + error.message);
        }
    });
}

async function deleteNote(noteId) {
    if (confirm('Вы уверены, что хотите удалить эту заметку?')) {
        try {
            const response = await fetch(`${API_URL}/notes/${noteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Заметка успешно удалена!');
                loadNotes();
            } else {
                alert('Ошибка удаления заметки');
            }
        } catch (error) {
            alert('Ошибка подключения к серверу');
        }
    }
}





// ========== РЕДАКТИРОВАНИЕ ПРОЕКТА ==========
async function editProject(projectId) {
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const project = await response.json();
            showEditProjectForm(project);
        } else {
            alert('Ошибка загрузки проекта');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
}

function showEditProjectForm(project) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Редактирование проекта: ${project.name}</h5>
            </div>
            <div class="card-body">
                <form id="editProjectForm">
                    <div class="mb-3">
                        <label class="form-label">Название проекта</label>
                        <input type="text" class="form-control" id="editProjectName" value="${project.name}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Описание</label>
                        <textarea class="form-control" id="editProjectDescription" rows="3">${project.description || ''}</textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Статус</label>
                                <select class="form-select" id="editProjectStatus">
                                    <option value="planned" ${project.status === 'planned' ? 'selected' : ''}>Запланирован</option>
                                    <option value="active" ${project.status === 'active' ? 'selected' : ''}>Активен</option>
                                    <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Завершен</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Дата окончания (опционально)</label>
                                <input type="date" class="form-control" id="editProjectEndDate"
                                       value="${project.end_date ? project.end_date.split('T')[0] : ''}">
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Дата начала</label>
                        <input type="datetime-local" class="form-control" id="editProjectStartDate"
                               value="${project.start_date.replace('Z', '').slice(0, 16)}" required>
                    </div>
                    <button type="submit" class="btn btn-warning">Сохранить изменения</button>
                    <button type="button" class="btn btn-secondary" onclick="viewProject(${project.id})">Отмена</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('editProjectForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const projectData = {
            name: document.getElementById('editProjectName').value,
            description: document.getElementById('editProjectDescription').value,
            status: document.getElementById('editProjectStatus').value,
            start_date: document.getElementById('editProjectStartDate').value + ':00',
            end_date: document.getElementById('editProjectEndDate').value ?
                     document.getElementById('editProjectEndDate').value + 'T00:00:00' : null
        };

        try {
            const response = await fetch(`${API_URL}/projects/${project.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(projectData)
            });

            if (response.ok) {
                alert('Проект успешно обновлен!');
                viewProject(project.id); // Возвращаемся к просмотру
            } else {
                const error = await response.json();
                alert('Ошибка обновления проекта: ' + error.detail);
            }
        } catch (error) {
            alert('Ошибка подключения к серверу: ' + error.message);
        }
    });
}

// ========== РЕДАКТИРОВАНИЕ ЗАДАЧИ ==========
async function editTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const task = await response.json();
            showEditTaskForm(task);
        } else {
            alert('Ошибка загрузки задачи');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
}

function showEditTaskForm(task) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Редактирование задачи: ${task.title}</h5>
            </div>
            <div class="card-body">
                <form id="editTaskForm">
                    <div class="mb-3">
                        <label class="form-label">Название задачи</label>
                        <input type="text" class="form-control" id="editTaskTitle" value="${task.title}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Описание</label>
                        <textarea class="form-control" id="editTaskDescription" rows="3">${task.description || ''}</textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Статус</label>
                                <select class="form-select" id="editTaskStatus">
                                    <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Ожидает</option>
                                    <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>В работе</option>
                                    <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Завершена</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Приоритет</label>
                                <select class="form-select" id="editTaskPriority">
                                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Низкий</option>
                                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Средний</option>
                                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Высокий</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Проект ID</label>
                                <input type="number" class="form-control" id="editTaskProjectId"
                                       value="${task.project || ''}" placeholder="Оставьте пустым">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Исполнитель ID</label>
                                <input type="number" class="form-control" id="editTaskAssignedTo"
                                       value="${task.assigned_to || ''}" placeholder="Оставьте пустым">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Срок выполнения</label>
                                <input type="datetime-local" class="form-control" id="editTaskDueDate"
                                       value="${task.due_date ? task.due_date.replace('Z', '').slice(0, 16) : ''}">
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-warning">Сохранить изменения</button>
                    <button type="button" class="btn btn-secondary" onclick="viewTask(${task.id})">Отмена</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('editTaskForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const taskData = {
            title: document.getElementById('editTaskTitle').value,
            description: document.getElementById('editTaskDescription').value,
            status: document.getElementById('editTaskStatus').value,
            priority: document.getElementById('editTaskPriority').value,
            project_id: document.getElementById('editTaskProjectId').value ?
                       parseInt(document.getElementById('editTaskProjectId').value) : null,
            assigned_to_id: document.getElementById('editTaskAssignedTo').value ?
                          parseInt(document.getElementById('editTaskAssignedTo').value) : null,
            due_date: document.getElementById('editTaskDueDate').value ?
                     document.getElementById('editTaskDueDate').value + ':00' : null
        };

        try {
            const response = await fetch(`${API_URL}/tasks/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                alert('Задача успешно обновлена!');
                viewTask(task.id); // Возвращаемся к просмотру
            } else {
                const error = await response.json();
                alert('Ошибка обновления задачи: ' + error.detail);
            }
        } catch (error) {
            alert('Ошибка подключения к серверу: ' + error.message);
        }
    });
}

// ========== РЕДАКТИРОВАНИЕ СОТРУДНИКА ==========
async function editEmployee(employeeId) {
    try {
        const response = await fetch(`${API_URL}/employees/${employeeId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const employee = await response.json();
            showEditEmployeeForm(employee);
        } else {
            alert('Ошибка загрузки сотрудника');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
}

function showEditEmployeeForm(employee) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Редактирование сотрудника: ${employee.last_name} ${employee.first_name}</h5>
            </div>
            <div class="card-body">
                <form id="editEmployeeForm">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Фамилия</label>
                                <input type="text" class="form-control" id="editEmployeeLastName" value="${employee.last_name}" required>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Имя</label>
                                <input type="text" class="form-control" id="editEmployeeFirstName" value="${employee.first_name}" required>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Отчество</label>
                                <input type="text" class="form-control" id="editEmployeeMiddleName" value="${employee.middle_name || ''}">
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Дата рождения</label>
                        <input type="date" class="form-control" id="editEmployeeBirthDate"
                               value="${employee.birth_date.split('T')[0]}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Телефон</label>
                        <input type="tel" class="form-control" id="editEmployeePhone" value="${employee.phone}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Адрес</label>
                        <textarea class="form-control" id="editEmployeeAddress" rows="2" required>${employee.address}</textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Статус</label>
                        <select class="form-select" id="editEmployeeIsActive">
                            <option value="true" ${employee.is_active ? 'selected' : ''}>Активен</option>
                            <option value="false" ${!employee.is_active ? 'selected' : ''}>Неактивен</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-warning">Сохранить изменения</button>
                    <button type="button" class="btn btn-secondary" onclick="viewEmployee(${employee.id})">Отмена</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('editEmployeeForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const employeeData = {
            first_name: document.getElementById('editEmployeeFirstName').value,
            last_name: document.getElementById('editEmployeeLastName').value,
            middle_name: document.getElementById('editEmployeeMiddleName').value,
            birth_date: document.getElementById('editEmployeeBirthDate').value + 'T00:00:00',
            phone: document.getElementById('editEmployeePhone').value,
            address: document.getElementById('editEmployeeAddress').value,
            is_active: document.getElementById('editEmployeeIsActive').value === 'true'
        };

        try {
            const response = await fetch(`${API_URL}/employees/${employee.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(employeeData)
            });

            if (response.ok) {
                alert('Сотрудник успешно обновлен!');
                viewEmployee(employee.id); // Возвращаемся к просмотру
            } else {
                const error = await response.json();
                alert('Ошибка обновления сотрудника: ' + error.detail);
            }
        } catch (error) {
            alert('Ошибка подключения к серверу: ' + error.message);
        }
    });
}