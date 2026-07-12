from flask import Blueprint, request, jsonify
from models import db
from models.vehicle import Vehicle
from models.activity import Activity
from datetime import datetime

vehicles_bp = Blueprint('vehicles', __name__)

@vehicles_bp.route('', strict_slashes=False, methods=['GET'])
def get_vehicles():
    status = request.args.get('status')
    query = Vehicle.query
    if status:
        query = query.filter_by(status=status)
    vehicles = query.all()
    return jsonify([v.to_dict() for v in vehicles]), 200

@vehicles_bp.route('/<int:id>', methods=['GET'])
def get_vehicle(id):
    vehicle = Vehicle.query.get_or_404(id)
    return jsonify(vehicle.to_dict()), 200

@vehicles_bp.route('', strict_slashes=False, methods=['POST'])
def add_vehicle():
    data = request.get_json()
    
    if not data or not data.get('registration_number'):
        return jsonify({'error': 'Registration number is required'}), 400
        
    existing = Vehicle.query.filter_by(reg_number=data.get('registration_number')).first()
    if existing:
        return jsonify({'error': 'Vehicle with this registration number already exists'}), 400
        
    vehicle = Vehicle(
        reg_number=data.get('registration_number'),
        type=data.get('type', 'Truck'),
        manufacturer=data.get('make'),
        model=data.get('model'),
        capacity=data.get('capacity'),
        status=data.get('status', 'Active'),
        mileage=data.get('mileage', 0),
        fuel_type=data.get('fuel_type', 'Diesel'),
        last_service_date=data.get('last_maintenance')
    )
    
    db.session.add(vehicle)
    db.session.flush() # to get vehicle id
    
    activity = Activity(
        action="Added Vehicle",
        description=f"Added new vehicle {vehicle.reg_number}",
        user_id=data.get('user_id', 1)
    )
    db.session.add(activity)
    
    db.session.commit()
    return jsonify(vehicle.to_dict()), 201

@vehicles_bp.route('/<int:id>', methods=['PUT'])
def update_vehicle(id):
    vehicle = Vehicle.query.get_or_404(id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Invalid data'}), 400
        
    if 'registration_number' in data and data['registration_number'] != vehicle.reg_number:
        existing = Vehicle.query.filter_by(reg_number=data['registration_number']).first()
        if existing:
            return jsonify({'error': 'Vehicle with this registration number already exists'}), 400
        vehicle.reg_number = data['registration_number']
        
    for field in ['type', 'model', 'capacity', 'status', 'mileage', 'fuel_type']:
        if field in data:
            setattr(vehicle, field, data[field])
            
    if 'make' in data:
        vehicle.manufacturer = data['make']
            
    if 'last_maintenance' in data:
        vehicle.last_service_date = data['last_maintenance']

    activity = Activity(
        action="Updated Vehicle",
        description=f"Updated vehicle {vehicle.reg_number}",
        user_id=data.get('user_id', 1)
    )
    db.session.add(activity)

    db.session.commit()
    return jsonify(vehicle.to_dict()), 200

@vehicles_bp.route('/<int:id>', methods=['DELETE'])
def delete_vehicle(id):
    vehicle = Vehicle.query.get_or_404(id)
    
    activity = Activity(
        action="Deleted Vehicle",
        description=f"Deleted vehicle {vehicle.reg_number}",
        user_id=request.args.get('user_id', 1)
    )
    db.session.add(activity)
    
    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({'message': 'Vehicle deleted successfully'}), 200
