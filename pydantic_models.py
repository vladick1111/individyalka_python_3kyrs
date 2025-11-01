from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# === USER MODELS ===
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# === EMPLOYEE MODELS ===
class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    middle_name: str = ""
    birth_date: datetime
    phone: str
    address: str

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int
    hire_date: datetime
    is_active: bool

    class Config:
        from_attributes = True

# === PROJECT MODELS ===
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str = "planned"

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# === TASK MODELS ===
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    status: str = "pending"
    priority: str = "medium"
    due_date: Optional[datetime] = None
    project_id: Optional[int] = None
    assigned_to_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# === CATEGORY MODELS ===
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True

# === COMMENT MODELS ===
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)

class CommentCreate(CommentBase):
    task_id: int  # Для создания - используем task_id

class Comment(CommentBase):
    id: int
    task: int  # Для ответа - используем task (как в базе)
    author: int  # author вместо author_id
    created_at: datetime

    class Config:
        from_attributes = True




# === FILE MODELS ===
class FileBase(BaseModel):
    filename: str = Field(..., min_length=1)
    file_path: str
    file_size: int
    mime_type: str
    task_id: Optional[int] = None

class FileCreate(FileBase):
    pass

class File(FileBase):
    id: int
    uploaded_by: int
    upload_date: datetime

    class Config:
        from_attributes = True

# === NOTE MODELS ===
class NoteBase(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)

class NoteCreate(NoteBase):
    pass

class Note(NoteBase):
    id: int
    author: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# === SIMPLIFIED MODELS FOR LISTS ===
class ProjectSummary(BaseModel):
    id: int
    name: str
    status: str
    created_at: datetime

class TaskSummary(BaseModel):
    id: int
    title: str
    status: str
    priority: str
    due_date: Optional[datetime]