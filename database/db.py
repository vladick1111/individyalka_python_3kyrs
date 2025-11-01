from pony.orm import Database

db = Database()

# Простой путь - база в корне проекта
db.bind(provider='sqlite', filename='company.db', create_db=True)