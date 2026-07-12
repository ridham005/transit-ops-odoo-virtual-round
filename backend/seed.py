from app import create_app
from models import db
from models.user import User
from models.vehicle import Vehicle
from models.driver import Driver
from models.trip import Trip
from models.maintenance import Maintenance
from models.expense import Expense
from models.activity import Activity
from datetime import datetime, timezone

def seed_db():
    app = create_app()
    with app.app_context():
        print("Seeding database...")
        db.create_all()

        # Create Users
        users = [
            User(name="Rahul Sharma", email="rahul@example.com", role="Fleet Manager"),
            User(name="Priya Patel", email="priya@example.com", role="Dispatcher"),
            User(name="Amit Singh", email="amit@example.com", role="Safety Officer"),
            User(name="Sneha Desai", email="sneha@example.com", role="Financial Analyst")
        ]
        for u in users:
            u.set_password("transit123")
            db.session.add(u)
        
        db.session.commit()

        # Create Vehicles
        vehicles = [
            Vehicle(reg_number="MH-12-AB-3456", manufacturer="Tata Motors", model="Signa 4825.TK", type="Heavy Truck", capacity="38t", fuel_type="Diesel", status="Available", mileage=45000, current_location="Mumbai Port"),
            Vehicle(reg_number="GJ-01-CD-7890", manufacturer="Ashok Leyland", model="Boss 1920", type="Heavy Truck", capacity="25t", fuel_type="Diesel", status="On Trip", mileage=32000, current_location="Surat Highway"),
            Vehicle(reg_number="KA-05-EF-1234", manufacturer="Mahindra", model="Blazo X 28", type="Heavy Truck", capacity="28t", fuel_type="Diesel", status="In Shop", mileage=56000, current_location="Bengaluru Depot")
        ]
        db.session.add_all(vehicles)
        db.session.commit()

        # Create Drivers
        drivers = [
            Driver(name="Suresh Kumar", license_number="MH12-2010-0012345", phone="9876543210", status="Available", experience=8),
            Driver(name="Ramesh Desai", license_number="GJ01-2012-0054321", phone="8765432109", status="On Duty", experience=5),
            Driver(name="Kiran Reddy", license_number="KA05-2015-0098765", phone="7654321098", status="Off Duty", experience=3)
        ]
        db.session.add_all(drivers)
        db.session.commit()

        # Create Trips
        trips = [
            Trip(source="Mumbai Port Trust", destination="Pune Warehouse", vehicle_id=2, driver_id=2, distance="150 km", weight="20t", status="Dispatched", trip_cost=3500.0)
        ]
        db.session.add_all(trips)

        # Create Maintenance
        maintenances = [
            Maintenance(vehicle_id=3, service_type="Engine Overhaul", garage="Bengaluru Central Garage", date="2026-07-10", cost=45000.0, status="In Progress", remarks="Parts pending")
        ]
        db.session.add_all(maintenances)

        # Create Expenses
        expenses = [
            Expense(type="Fuel", amount=12000.0, date="2026-07-11", description="Diesel refill at Mumbai Hub", vehicle_id=2),
            Expense(type="Toll", amount=1500.0, date="2026-07-11", description="Pune-Mumbai Expressway", vehicle_id=2)
        ]
        db.session.add_all(expenses)
        
        # Create initial activity
        db.session.add(Activity(user_id=1, action="System initialized and seeded", description="Initial mock data loaded."))

        db.session.commit()
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_db()
