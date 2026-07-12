from flask import Blueprint, request, jsonify
from models import db
from models.driver import Driver
from models.activity import Activity
from datetime import datetime

drivers_bp = Blueprint('drivers', __name__)

@drivers_bp.route('', strict_slashes=False, methods=['GET'])
def get_drivers():
    status = request.args.get('status')
    query = Driver.query
    if status:
        query = query.filter_by(status=status)
    drivers = query.all()
    return jsonify([d.to_dict() for d in drivers]), 200

@drivers_bp.route('/<int:id>', methods=['GET'])
def get_driver(id):
    driver = Driver.query.get_or_404(id)
    return jsonify(driver.to_dict()), 200

@drivers_bp.route('', strict_slashes=False, methods=['POST'])
def add_driver():
    data = request.get_json()
    
    if not data or not data.get('license_number'):
        return jsonify({'error': 'License number is required'}), 400
        
    existing = Driver.query.filter_by(license_number=data.get('license_number')).first()
    if existing:
        return jsonify({'error': 'Driver with this license number already exists'}), 400
        
    driver = Driver(
        name=data.get('name'),
        license_number=data.get('license_number'),
        phone=data.get('phone'),
        status=data.get('status', 'Active'),
        experience=data.get('experience', 0)
    )
    
    db.session.add(driver)
    db.session.flush()
    
    activity = Activity(
        action="Added Driver",
        description=f"Added new driver {driver.name}",
        user_id=data.get('user_id', 1)
    )
    db.session.add(activity)
    
    db.session.commit()
    return jsonify(driver.to_dict()), 201

@drivers_bp.route('/<int:id>', methods=['PUT'])
def update_driver(id):
    driver = Driver.query.get_or_404(id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Invalid data'}), 400
        
    if 'license_number' in data and data['license_number'] != driver.license_number:
        existing = Driver.query.filter_by(license_number=data['license_number']).first()
        if existing:
            return jsonify({'error': 'Driver with this license number already exists'}), 400
        driver.license_number = data['license_number']
        
    for field in ['name', 'phone', 'status', 'experience']:
        if field in data:
            setattr(driver, field, data[field])

    activity = Activity(
        action="Updated Driver",
        description=f"Updated driver {driver.name}",
        user_id=data.get('user_id', 1)
    )
    db.session.add(activity)

    db.session.commit()
    return jsonify(driver.to_dict()), 200

@drivers_bp.route('/<int:id>', methods=['DELETE'])
def delete_driver(id):
    driver = Driver.query.get_or_404(id)
    
    activity = Activity(
        action="Deleted Driver",
        description=f"Deleted driver {driver.name}",
        user_id=request.args.get('user_id', 1)
    )
    db.session.add(activity)
    
    db.session.delete(driver)
    db.session.commit()
    return jsonify({'message': 'Driver deleted successfully'}), 200
