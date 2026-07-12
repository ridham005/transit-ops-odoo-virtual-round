from flask import Blueprint, request, jsonify
from models import db
from models.maintenance import Maintenance
from models.vehicle import Vehicle
from models.activity import Activity
from datetime import datetime

maintenance_bp = Blueprint('maintenance', __name__)

@maintenance_bp.route('', strict_slashes=False, methods=['GET'])
def get_maintenance():
    status = request.args.get('status')
    query = Maintenance.query
    if status:
        query = query.filter_by(status=status)
    records = query.all()
    
    result = []
    for r in records:
        r_dict = r.to_dict()
        vehicle = Vehicle.query.get(r.vehicle_id)
        if vehicle:
            r_dict['vehicle_reg'] = vehicle.reg_number
        result.append(r_dict)
        
    return jsonify(result), 200

@maintenance_bp.route('/<int:id>', methods=['GET'])
def get_maintenance_record(id):
    record = Maintenance.query.get_or_404(id)
    r_dict = record.to_dict()
    vehicle = Vehicle.query.get(record.vehicle_id)
    if vehicle:
        r_dict['vehicle_reg'] = vehicle.reg_number
    return jsonify(r_dict), 200

@maintenance_bp.route('', strict_slashes=False, methods=['POST'])
def add_maintenance():
    data = request.get_json()
    
    if not data or not data.get('vehicle_id') or not data.get('type'):
        return jsonify({'error': 'Missing required fields'}), 400
        
    vehicle = Vehicle.query.get(data['vehicle_id'])
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
        
    record = Maintenance(
        vehicle_id=data.get('vehicle_id'),
        service_type=data.get('type'),
        garage=data.get('garage', 'Not Specified'),
        date=data.get('date'),
        cost=data.get('cost', 0.0),
        status=data.get('status', 'Scheduled'),
        remarks=data.get('description')
    )
    
    db.session.add(record)
    db.session.flush()
    
    activity = Activity(
        action="Scheduled Maintenance",
        description=f"Scheduled {record.service_type} for vehicle {vehicle.reg_number}",
        user_id=data.get('user_id', 1)
    )
    db.session.add(activity)
    
    db.session.commit()
    return jsonify(record.to_dict()), 201

@maintenance_bp.route('/<int:id>', methods=['PUT'])
def update_maintenance(id):
    record = Maintenance.query.get_or_404(id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Invalid data'}), 400
        
    for field in ['vehicle_id', 'cost', 'status']:
        if field in data:
            setattr(record, field, data[field])
            
    if 'type' in data:
        record.service_type = data['type']
    if 'description' in data:
        record.remarks = data['description']
            
    if 'date' in data:
        record.date = data['date']

    vehicle = Vehicle.query.get(record.vehicle_id)
    activity = Activity(
        action="Updated Maintenance",
        description=f"Updated maintenance for vehicle {vehicle.reg_number if vehicle else record.vehicle_id}",
        user_id=data.get('user_id', 1)
    )
    db.session.add(activity)

    db.session.commit()
    return jsonify(record.to_dict()), 200

@maintenance_bp.route('/<int:id>', methods=['DELETE'])
def delete_maintenance(id):
    record = Maintenance.query.get_or_404(id)
    
    vehicle = Vehicle.query.get(record.vehicle_id)
    activity = Activity(
        action="Deleted Maintenance",
        description=f"Deleted maintenance record for vehicle {vehicle.reg_number if vehicle else record.vehicle_id}",
        user_id=request.args.get('user_id', 1)
    )
    db.session.add(activity)
    
    db.session.delete(record)
    db.session.commit()
    return jsonify({'message': 'Maintenance record deleted successfully'}), 200
