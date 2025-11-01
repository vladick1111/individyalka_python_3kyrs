from database.db import *
from database.models import *
from pony.orm import db_session, select
import pydantic_models  # Импортируем как модуль
from datetime import datetime

# === USER CRUD ===
@db_session
def create_user(user: pydantic_models.UserCreate, hashed_password: str):
    """Создание пользователя"""
    existing_user = User.get(email=user.email)
    if existing_user:
        return None
    new_user = User(
        email=user.email,
        hashed_password=hashed_password
    )
    return new_user

@db_session
def get_user_by_email(email: str):
    return User.get(email=email)

@db_session
def get_user_by_id(user_id: int):
    return User[user_id]

@db_session
def update_user(user_id: int, user_data: dict):
    user = User[user_id]
    for field, value in user_data.items():
        if hasattr(user, field) and value is not None:
            setattr(user, field, value)
    return user

@db_session
def delete_user(user_id: int):
    User[user_id].delete()
    return True

# === EMPLOYEE CRUD ===
@db_session
def create_employee(employee: pydantic_models.EmployeeCreate):
    new_employee = Employee(
        first_name=employee.first_name,
        last_name=employee.last_name,
        middle_name=employee.middle_name,
        birth_date=employee.birth_date,
        phone=employee.phone,
        address=employee.address
    )
    return new_employee

@db_session
def get_employees():
    return select(e for e in Employee)[:]

@db_session
def get_employee_by_id(employee_id: int):
    return Employee[employee_id]

@db_session
def update_employee(employee_id: int, employee_data: dict):
    employee = Employee[employee_id]
    for field, value in employee_data.items():
        if hasattr(employee, field) and value is not None:
            setattr(employee, field, value)
    return employee

@db_session
def delete_employee(employee_id: int):
    Employee[employee_id].delete()
    return True

# === PROJECT CRUD ===
@db_session
def create_project(project: pydantic_models.ProjectCreate, user_id: int):
    new_project = Project(
        name=project.name,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status=project.status,
        created_by=User[user_id]
    )
    return new_project

@db_session
def get_projects():
    return select(p for p in Project)[:]

@db_session
def get_project_by_id(project_id: int):
    return Project[project_id]

@db_session
def update_project(project_id: int, project_data: dict):
    project = Project[project_id]
    for field, value in project_data.items():
        if hasattr(project, field) and value is not None:
            setattr(project, field, value)
    return project

@db_session
def delete_project(project_id: int):
    Project[project_id].delete()
    return True

# === TASK CRUD ===
@db_session
def create_task(task: pydantic_models.TaskCreate, user_id: int):
    new_task = Task(
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        project=Project[task.project_id] if task.project_id else None,
        assigned_to=Employee[task.assigned_to_id] if task.assigned_to_id else None,
        created_by=User[user_id]
    )
    return new_task

@db_session
def get_tasks():
    return select(t for t in Task)[:]

@db_session
def get_task_by_id(task_id: int):
    return Task[task_id]

@db_session
def update_task(task_id: int, task_data: dict):
    task = Task[task_id]
    for field, value in task_data.items():
        if hasattr(task, field) and value is not None:
            setattr(task, field, value)
    return task

@db_session
def delete_task(task_id: int):
    Task[task_id].delete()
    return True

# === CATEGORY CRUD ===
@db_session
def create_category(category: pydantic_models.CategoryCreate):
    new_category = Category(
        name=category.name,
        description=category.description
    )
    return new_category

@db_session
def get_categories():
    return select(c for c in Category)[:]

@db_session
def get_category_by_id(category_id: int):
    return Category[category_id]

@db_session
def update_category(category_id: int, category_data: dict):
    category = Category[category_id]
    for field, value in category_data.items():
        if hasattr(category, field) and value is not None:
            setattr(category, field, value)
    return category

@db_session
def delete_category(category_id: int):
    Category[category_id].delete()
    return True

# === COMMENT CRUD ===
@db_session
def create_comment(comment: pydantic_models.CommentCreate, user_id: int):
    new_comment = Comment(
        content=comment.content,
        task=Task[comment.task_id],
        author=User[user_id]
    )
    return new_comment

@db_session
def get_comments():
    return select(c for c in Comment)[:]

@db_session
def get_comment_by_id(comment_id: int):
    return Comment[comment_id]

@db_session
def update_comment(comment_id: int, comment_data: dict):
    comment = Comment[comment_id]
    for field, value in comment_data.items():
        if hasattr(comment, field) and value is not None:
            setattr(comment, field, value)
    return comment

@db_session
def delete_comment(comment_id: int):
    Comment[comment_id].delete()
    return True

# === FILE CRUD ===
@db_session
def create_file(file: pydantic_models.FileCreate, user_id: int):
    new_file = File(
        filename=file.filename,
        file_path=file.file_path,
        file_size=file.file_size,
        mime_type=file.mime_type,
        task=Task[file.task_id] if file.task_id else None,
        uploaded_by=User[user_id]
    )
    return new_file

@db_session
def get_files():
    return select(f for f in File)[:]

@db_session
def get_file_by_id(file_id: int):
    return File[file_id]

@db_session
def update_file(file_id: int, file_data: dict):
    file = File[file_id]
    for field, value in file_data.items():
        if hasattr(file, field) and value is not None:
            setattr(file, field, value)
    return file

@db_session
def delete_file(file_id: int):
    File[file_id].delete()
    return True

# === NOTE CRUD ===
@db_session
def create_note(note: pydantic_models.NoteCreate, user_id: int):
    new_note = Note(
        title=note.title,
        content=note.content,
        author=User[user_id]
    )
    return new_note

@db_session
def get_notes():
    return select(n for n in Note)[:]

@db_session
def get_note_by_id(note_id: int):
    return Note[note_id]

@db_session
def update_note(note_id: int, note_data: dict):
    note = Note[note_id]
    for field, value in note_data.items():
        if hasattr(note, field) and value is not None:
            setattr(note, field, value)
    note.updated_at = datetime.now()
    return note

@db_session
def delete_note(note_id: int):
    Note[note_id].delete()
    return True