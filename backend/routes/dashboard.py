from flask import Blueprint, jsonify
from models import db
from models.vehicle import Vehicle
from models.driver import Driver
from models.trip import Trip
from models.expense import Expense
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    active_vehicles = Vehicle.query.filter_by(status='Active').count()
    active_drivers = Driver.query.filter_by(status='Active').count()
    
    # Calculate total revenue from trips (using trip_cost in this case since there's no revenue column)
    total_revenue = db.session.query(func.sum(Trip.trip_cost)).scalar() or 0.0
    
    # Calculate total expenses
    total_expenses = db.session.query(func.sum(Expense.amount)).scalar() or 0.0
    
    return jsonify({
        'active_vehicles': active_vehicles,
        'active_drivers': active_drivers,
        'total_revenue': total_revenue,
        'total_expenses': total_expenses
    }), 200
