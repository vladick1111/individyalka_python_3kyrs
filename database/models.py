from datetime import datetime
from pony.orm import *
from database.db import db

class User(db.Entity):
    id = PrimaryKey(int, auto=True)
    email = Required(str, unique=True)
    hashed_password = Required(str)
    is_active = Required(bool, default=True)
    created_at = Required(datetime, default=datetime.now)
    # Relationships
    created_tasks = Set('Task', reverse='created_by')
    created_projects = Set('Project', reverse='created_by')
    comments = Set('Comment', reverse='author')
    files = Set('File', reverse='uploaded_by')
    notes = Set('Note', reverse='author')

# Остальные модели без изменений...
class Employee(db.Entity):
    id = PrimaryKey(int, auto=True)
    first_name = Required(str)
    last_name = Required(str)
    middle_name = Optional(str)
    birth_date = Required(datetime)
    phone = Required(str)
    address = Required(str)
    hire_date = Required(datetime, default=datetime.now)
    is_active = Required(bool, default=True)
    # Relationships
    assigned_tasks = Set('Task', reverse='assigned_to')

class Project(db.Entity):
    id = PrimaryKey(int, auto=True)
    name = Required(str)
    description = Optional(str)
    start_date = Required(datetime)
    end_date = Optional(datetime)
    status = Required(str, default="planned")
    created_by = Required(User)
    created_at = Required(datetime, default=datetime.now)
    # Relationships
    tasks = Set('Task', reverse='project')

class Task(db.Entity):
    id = PrimaryKey(int, auto=True)
    title = Required(str)
    description = Optional(str)
    status = Required(str, default="pending")
    priority = Required(str, default="medium")
    due_date = Optional(datetime)
    project = Optional(Project)
    assigned_to = Optional(Employee)
    created_by = Required(User)
    created_at = Required(datetime, default=datetime.now)
    # Relationships
    comments = Set('Comment', reverse='task')
    files = Set('File', reverse='task')
    categories = Set('Category', reverse='tasks')

class Category(db.Entity):
    id = PrimaryKey(int, auto=True)
    name = Required(str, unique=True)
    description = Optional(str)
    # Relationships
    tasks = Set(Task, reverse='categories')

class Comment(db.Entity):
    id = PrimaryKey(int, auto=True)
    content = Required(str)
    task = Required(Task)
    author = Required(User)
    created_at = Required(datetime, default=datetime.now)

class File(db.Entity):
    id = PrimaryKey(int, auto=True)
    filename = Required(str)
    file_path = Required(str)
    file_size = Required(int)
    mime_type = Required(str)
    task = Optional(Task)
    uploaded_by = Required(User)
    upload_date = Required(datetime, default=datetime.now)

class Note(db.Entity):
    id = PrimaryKey(int, auto=True)
    title = Required(str)
    content = Required(str)
    author = Required(User)
    created_at = Required(datetime, default=datetime.now)
    updated_at = Required(datetime, default=datetime.now)