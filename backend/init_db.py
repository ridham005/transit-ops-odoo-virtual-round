import os
from app import create_app
from models import db
from models.user import User
from models.vehicle import Vehicle
from models.driver import Driver
from models.trip import Trip
from models.maintenance import Maintenance
from models.expense import Expense
from models.activity import Activity

def init_db():
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("Database initialized successfully.")

if __name__ == '__main__':
    init_db()
