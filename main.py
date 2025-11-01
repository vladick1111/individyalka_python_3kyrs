from fastapi import FastAPI, HTTPException, Depends, status
from database.db import db
import database.crud as crud
import pydantic_models
from datetime import datetime
from auth import get_password_hash, create_access_token, authenticate_user, get_current_user, get_current_user_depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pony.orm import db_session, select
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime
import json
import csv
import io
from fastapi import FastAPI, HTTPException, Depends, status, Response
from fastapi.responses import StreamingResponse
from pony.orm import db_session, select, count
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse


# Импортируем модели для аннотаций
from database.models import User, Employee, Project, Task, Category, Comment, File, Note

# Создаем таблицы в базе
db.generate_mapping(create_tables=True)

# Настройка OAuth2 для Swagger
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI(
    title="Company Management System",
    swagger_ui_parameters={"defaultModelsExpandDepth": -1}
)

# Настройка логирования
# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
#     handlers=[
#         logging.FileHandler('app.log'),
#         logging.StreamHandler()
#     ]
# )

# Упрощенная настройка логирования
logger = logging.getLogger("uvicorn")


# Настройка CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем все домены для теста
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели для запросов
class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@app.get("/")
def serve_frontend():
    return FileResponse("static/index.html")

@app.get("/api")
def read_root():
    return {"message": "Company Management System API"}

# ЭНДПОИНТЫ АУТЕНТИФИКАЦИИ
@app.post("/register/", response_model=pydantic_models.User)
@db_session
def register(user: pydantic_models.UserCreate):
    """Регистрация нового пользователя"""
    existing_user = crud.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = crud.create_user(user, hashed_password)
    return new_user.to_dict()


@app.post("/login/", response_model=Token)
@db_session
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Авторизация пользователя"""
    logger.info(f"Попытка входа для email: {form_data.username}")

    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        logger.warning(f"Неудачная попытка входа для email: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(data={"sub": user.email})
    logger.info(f"Успешный вход пользователя: {user.email}")
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=pydantic_models.User)
@db_session
def read_users_me(current_user: User = Depends(get_current_user_depends)):
    """Получить информацию о текущем пользователе"""
    return current_user.to_dict()

# ЭНДПОИНТЫ ДЛЯ СОТРУДНИКОВ
@app.post("/employees/", response_model=pydantic_models.Employee)
@db_session
def create_employee(employee: pydantic_models.EmployeeCreate):
    return crud.create_employee(employee).to_dict()

@app.get("/employees/")
@db_session
def get_all_employees():
    employees = crud.get_employees()
    return [emp.to_dict() for emp in employees]

@app.get("/employees/{employee_id}")
@db_session
def get_employee(employee_id: int):
    employee = crud.get_employee_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee.to_dict()


# ЭНДПОИНТЫ ДЛЯ СОТРУДНИКОВ - ДОПОЛНЕНИЯ
@app.put("/employees/{employee_id}")
@db_session
def update_employee(
    employee_id: int,
    employee_data: pydantic_models.EmployeeCreate,
    current_user: User = Depends(get_current_user_depends)
):
    """Обновить сотрудника"""
    employee = crud.update_employee(employee_id, employee_data.dict())
    return employee.to_dict()

@app.delete("/employees/{employee_id}")
@db_session
def delete_employee(
    employee_id: int,
    current_user: User = Depends(get_current_user_depends)
):
    """Удалить сотрудника"""
    crud.delete_employee(employee_id)
    return {"message": "Employee deleted"}



# ЭНДПОИНТЫ ДЛЯ ПРОЕКТОВ (ИСПРАВЛЕННЫЕ)
@app.post("/projects/", response_model=pydantic_models.Project)
@db_session
def create_project(
        project: pydantic_models.ProjectCreate,
        current_user: User = Depends(get_current_user_depends)
):
    """Создать новый проект"""
    logger.info(f"User {current_user.email} создает проект: {project.name}")

    new_project = crud.create_project(project, current_user.id)

    logger.info(f"Проект создан: {new_project.name} (ID: {new_project.id})")
    return new_project.to_dict()


@app.get("/projects/")
@db_session
def get_all_projects(
        status: Optional[str] = None
):
    """Получить все проекты с фильтрацией"""
    query = select(p for p in crud.Project)

    if status:
        query = query.where(lambda p: p.status == status)

    projects = query[:]
    return [project.to_dict() for project in projects]

@app.get("/projects/{project_id}")
@db_session
def get_project(project_id: int):
    project = crud.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.to_dict()

@app.put("/projects/{project_id}")
@db_session
def update_project(
    project_id: int,
    project_data: pydantic_models.ProjectCreate,
    current_user: User = Depends(get_current_user_depends)
):
    project = crud.update_project(project_id, project_data.dict())
    return project.to_dict()

@app.delete("/projects/{project_id}")
@db_session
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user_depends)
):
    crud.delete_project(project_id)
    return {"message": "Project deleted"}

# ТЕСТОВЫЕ ЭНДПОИНТЫ
@app.get("/test-swagger-auth/")
@db_session
def test_swagger_auth(current_user: User = Depends(get_current_user_depends)):
    """Тест авторизации в Swagger"""
    return {
        "message": "Авторизация работает!",
        "user_email": current_user.email,
        "user_id": current_user.id
    }

@app.get("/create-test-employee/")
@db_session
def create_test_employee():
    test_employee = pydantic_models.EmployeeCreate(
        first_name="Иван",
        last_name="Иванов",
        middle_name="Иванович",
        birth_date=datetime(1990, 5, 15),
        phone="+79991234567",
        address="Москва, ул. Пушкина, д. 1"
    )
    new_emp = crud.create_employee(test_employee)
    return {"message": "Сотрудник создан!", "employee": new_emp.to_dict()}


# ЭНДПОИНТЫ ДЛЯ ЗАДАЧ
@app.post("/tasks/", response_model=pydantic_models.Task)
@db_session
def create_task(
    task: pydantic_models.TaskCreate,
    current_user: User = Depends(get_current_user_depends)
):
    """Создать новую задачу"""
    new_task = crud.create_task(task, current_user.id)
    return new_task.to_dict()


@app.get("/tasks/")
@db_session
def get_all_tasks(
        status: Optional[str] = None,
        priority: Optional[str] = None,
        project_id: Optional[int] = None
):
    """Получить все задачи с фильтрацией"""
    query = select(t for t in crud.Task)

    if status:
        query = query.where(lambda t: t.status == status)
    if priority:
        query = query.where(lambda t: t.priority == priority)
    if project_id:
        query = query.where(lambda t: t.project.id == project_id)

    tasks = query[:]
    return [task.to_dict() for task in tasks]

@app.get("/tasks/{task_id}")
@db_session
def get_task(task_id: int):
    """Получить задачу по ID"""
    task = crud.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task.to_dict()

@app.put("/tasks/{task_id}")
@db_session
def update_task(
    task_id: int,
    task_data: pydantic_models.TaskCreate,
    current_user: User = Depends(get_current_user_depends)
):
    """Обновить задачу"""
    task = crud.update_task(task_id, task_data.dict())
    return task.to_dict()

@app.delete("/tasks/{task_id}")
@db_session
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user_depends)
):
    """Удалить задачу"""
    crud.delete_task(task_id)
    return {"message": "Task deleted"}


# ЭНДПОИНТЫ ДЛЯ КОММЕНТАРИЕВ
@app.post("/comments/", response_model=pydantic_models.Comment)
@db_session
def create_comment(
    comment: pydantic_models.CommentCreate,
    current_user: User = Depends(get_current_user_depends)
):
    """Создать новый комментарий"""
    new_comment = crud.create_comment(comment, current_user.id)
    return new_comment.to_dict()

@app.get("/comments/")
@db_session
def get_all_comments():
    """Получить все комментарии"""
    comments = crud.get_comments()
    return [comment.to_dict() for comment in comments]

@app.get("/comments/task/{task_id}")
@db_session
def get_comments_by_task(task_id: int):
    """Получить комментарии по задаче"""
    comments = select(c for c in crud.Comment if c.task.id == task_id)[:]
    return [comment.to_dict() for comment in comments]



# ЭНДПОИНТЫ ДЛЯ КОММЕНТАРИЕВ - ДОПОЛНЕНИЯ
@app.put("/comments/{comment_id}")
@db_session
def update_comment(
    comment_id: int,
    comment_data: pydantic_models.CommentCreate,
    current_user: User = Depends(get_current_user_depends)
):
    """Обновить комментарий"""
    comment = crud.update_comment(comment_id, comment_data.dict())
    return comment.to_dict()

@app.delete("/comments/{comment_id}")
@db_session
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user_depends)
):
    """Удалить комментарий"""
    crud.delete_comment(comment_id)
    return {"message": "Comment deleted"}



# ЭНДПОИНТЫ ДЛЯ КАТЕГОРИЙ
@app.post("/categories/", response_model=pydantic_models.Category)
@db_session
def create_category(
    category: pydantic_models.CategoryCreate,
    current_user: User = Depends(get_current_user_depends)
):
    """Создать новую категорию"""
    new_category = crud.create_category(category)
    return new_category.to_dict()

@app.get("/categories/")
@db_session
def get_all_categories():
    """Получить все категории"""
    categories = crud.get_categories()
    return [category.to_dict() for category in categories]

@app.get("/categories/{category_id}")
@db_session
def get_category(category_id: int):
    """Получить категорию по ID"""
    category = crud.get_category_by_id(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category.to_dict()



# ЭНДПОИНТЫ ДЛЯ КАТЕГОРИЙ - ДОПОЛНЕНИЯ
@app.put("/categories/{category_id}")
@db_session
def update_category(
    category_id: int,
    category_data: pydantic_models.CategoryCreate,
    current_user: User = Depends(get_current_user_depends)
):
    """Обновить категорию"""
    category = crud.update_category(category_id, category_data.dict())
    return category.to_dict()

@app.delete("/categories/{category_id}")
@db_session
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_user_depends)
):
    """Удалить категорию"""
    crud.delete_category(category_id)
    return {"message": "Category deleted"}



# ЭНДПОИНТЫ ДЛЯ ФАЙЛОВ
@app.post("/files/", response_model=pydantic_models.File)
@db_session
def create_file(
    file: pydantic_models.FileCreate,
    current_user: User = Depends(get_current_user_depends)
):
    """Создать новую запись о файле"""
    new_file = crud.create_file(file, current_user.id)
    return new_file.to_dict()

@app.get("/files/")
@db_session
def get_all_files():
    """Получить все файлы"""
    files = crud.get_files()
    return [file.to_dict() for file in files]


# ЭНДПОИНТЫ ДЛЯ ФАЙЛОВ - ДОПОЛНЕНИЯ
@app.get("/files/{file_id}")
@db_session
def get_file(file_id: int):
    """Получить файл по ID"""
    file = crud.get_file_by_id(file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file.to_dict()

@app.put("/files/{file_id}")
@db_session
def update_file(
    file_id: int,
    file_data: pydantic_models.FileCreate,
    current_user: User = Depends(get_current_user_depends)
):
    """Обновить файл"""
    file = crud.update_file(file_id, file_data.dict())
    return file.to_dict()

@app.delete("/files/{file_id}")
@db_session
def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user_depends)
):
    """Удалить файл"""
    crud.delete_file(file_id)
    return {"message": "File deleted"}


# ЭНДПОИНТЫ ДЛЯ ЗАМЕТОК
@app.post("/notes/", response_model=pydantic_models.Note)
@db_session
def create_note(
    note: pydantic_models.NoteCreate,
    current_user: User = Depends(get_current_user_depends)
):
    """Создать новую заметку"""
    new_note = crud.create_note(note, current_user.id)
    return new_note.to_dict()

@app.get("/notes/")
@db_session
def get_all_notes():
    """Получить все заметки"""
    notes = crud.get_notes()
    return [note.to_dict() for note in notes]

@app.get("/notes/{note_id}")
@db_session
def get_note(note_id: int):
    """Получить заметку по ID"""
    note = crud.get_note_by_id(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note.to_dict()


# ЭНДПОИНТЫ ДЛЯ ЗАМЕТОК - ДОПОЛНЕНИЯ
@app.put("/notes/{note_id}")
@db_session
def update_note(
    note_id: int,
    note_data: pydantic_models.NoteCreate,
    current_user: User = Depends(get_current_user_depends)
):
    """Обновить заметку"""
    note = crud.update_note(note_id, note_data.dict())
    return note.to_dict()

@app.delete("/notes/{note_id}")
@db_session
def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user_depends)
):
    """Удалить заметку"""
    crud.delete_note(note_id)
    return {"message": "Note deleted"}


# Для скачивания

@app.get("/export/projects/csv-download")
@db_session
def export_projects_csv_download():
    """Экспорт проектов в CSV (версия для скачивания в Swagger)"""
    projects = crud.get_projects()

    # Создаем CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Заголовки
    writer.writerow(["ID", "Name", "Description", "Status", "Start Date", "End Date", "Created By"])

    # Данные
    for project in projects:
        writer.writerow([
            project.id,
            project.name,
            project.description or "",
            project.status,
            project.start_date.strftime("%Y-%m-%d"),
            project.end_date.strftime("%Y-%m-%d") if project.end_date else "",
            project.created_by.email
        ])

    # Возвращаем как простой текст с заголовком для скачивания
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=projects.csv"}
    )


@app.get("/export/tasks/json")
@db_session
def export_tasks_json():
    """Экспорт всех задач в JSON"""
    tasks = crud.get_tasks()

    tasks_data = []
    for task in tasks:
        task_dict = task.to_dict()
        # Добавляем дополнительные поля для экспорта
        task_dict["project_name"] = task.project.name if task.project else ""
        task_dict[
            "assigned_to_name"] = f"{task.assigned_to.first_name} {task.assigned_to.last_name}" if task.assigned_to else ""
        task_dict["created_by_email"] = task.created_by.email
        tasks_data.append(task_dict)

    # Возвращаем JSON
    return {
        "export_date": datetime.now().isoformat(),
        "total_tasks": len(tasks_data),
        "tasks": tasks_data
    }


# АДМИНИСТРАТИВНЫЕ ЭНДПОИНТЫ
@app.get("/admin/statistics")
@db_session
def admin_statistics(current_user: User = Depends(get_current_user_depends)):
    """Статистика системы"""
    stats = {
        "total_users": count(u for u in crud.User),
        "total_projects": count(p for p in crud.Project),
        "total_tasks": count(t for t in crud.Task),
        "total_employees": count(e for e in crud.Employee),
        "total_comments": count(c for c in crud.Comment),
        "total_files": count(f for f in crud.File),
        "total_notes": count(n for n in crud.Note),
        "tasks_by_status": {
            "pending": count(t for t in crud.Task if t.status == "pending"),
            "in_progress": count(t for t in crud.Task if t.status == "in_progress"),
            "completed": count(t for t in crud.Task if t.status == "completed")
        },
        "projects_by_status": {
            "planned": count(p for p in crud.Project if p.status == "planned"),
            "active": count(p for p in crud.Project if p.status == "active"),
            "completed": count(p for p in crud.Project if p.status == "completed")
        }
    }

    logger.info(f"Admin statistics requested by {current_user.email}")
    return stats


@app.get("/admin/users")
@db_session
def admin_get_users(current_user: User = Depends(get_current_user_depends)):
    """Получить список всех пользователей"""
    users = select(u for u in crud.User)[:]
    return [{
        "id": user.id,
        "email": user.email,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "projects_count": count(p for p in crud.Project if p.created_by == user),
        "tasks_count": count(t for t in crud.Task if t.created_by == user),
        "comments_count": count(c for c in crud.Comment if c.author == user)
    } for user in users]




#____________________________________________________________________________________________
#тест на хеширование пароля
# http://localhost:8000/test-password-hash/?password=mysecret

from auth import get_password_hash, create_access_token, authenticate_user, get_current_user, get_current_user_depends, verify_password


@app.get("/test-password-hash/")
def test_password_hash(password: str):
    hashed = get_password_hash(password)
    return {
        "original_password": password,
        "hashed_password": hashed,
        "verification": verify_password(password, hashed)
    }




from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Обслуживание статических файлов (CSS, JS, изображения)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Главная страница - отдаем фронтенд
@app.get("/", response_class=HTMLResponse)
def serve_frontend():
    return FileResponse("static/index.html")

# Запасной route для фронтенда
@app.get("/app", response_class=HTMLResponse)
def serve_app():
    return FileResponse("static/index.html")