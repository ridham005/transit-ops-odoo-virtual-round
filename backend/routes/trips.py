from flask import Blueprint, request, jsonify
from models import db
from models.trip import Trip
from models.vehicle import Vehicle
from models.driver import Driver
from models.activity import Activity
from datetime import datetime

trips_bp = Blueprint('trips', __name__)

@trips_bp.route('', strict_slashes=False, methods=['GET'])
def get_trips():
    status = request.args.get('status')
    query = Trip.query
    if status:
        query = query.filter_by(status=status)
    trips = query.all()
    
    # Need to include vehicle and driver names for frontend
    result = []
    for t in trips:
        t_dict = t.to_dict()
        vehicle = Vehicle.query.get(t.vehicle_id)
        driver = Driver.query.get(t.driver_id)
        if vehicle:
            t_dict['vehicle_reg'] = vehicle.reg_number
        if driver:
            t_dict['driver_name'] = driver.name
        result.append(t_dict)
        
    return jsonify(result), 200

@trips_bp.route('/<int:id>', methods=['GET'])
def get_trip(id):
    trip = Trip.query.get_or_404(id)
    t_dict = trip.to_dict()
    vehicle = Vehicle.query.get(trip.vehicle_id)
    driver = Driver.query.get(trip.driver_id)
    if vehicle:
        t_dict['vehicle_reg'] = vehicle.reg_number
    if driver:
        t_dict['driver_name'] = driver.name
    return jsonify(t_dict), 200

@trips_bp.route('', strict_slashes=False, methods=['POST'])
def add_trip():
    data = request.get_json()
    
    if not data or not data.get('source') or not data.get('destination') or not data.get('vehicle_id') or not data.get('driver_id'):
        return jsonify({'error': 'Missing required fields'}), 400
        
    vehicle = Vehicle.query.get(data['vehicle_id'])
    driver = Driver.query.get(data['driver_id'])
    
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404
        
    trip = Trip(
        source=data.get('source'),
        destination=data.get('destination'),
        vehicle_id=data.get('vehicle_id'),
        driver_id=data.get('driver_id'),
        status=data.get('status', 'Scheduled'),
        distance=data.get('distance', '0 km'),
        weight=data.get('weight', '0 tons'),
        trip_cost=data.get('trip_cost', 0.0)
    )
    
    db.session.add(trip)
    db.session.flush()
    
    activity = Activity(
        action="Created Trip",
        description=f"Created trip from {trip.source} to {trip.destination}",
        user_id=data.get('user_id', 1)
    )
    db.session.add(activity)
    
    db.session.commit()
    return jsonify(trip.to_dict()), 201

@trips_bp.route('/<int:id>', methods=['PUT'])
def update_trip(id):
    trip = Trip.query.get_or_404(id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Invalid data'}), 400
        
    for field in ['source', 'destination', 'vehicle_id', 'driver_id', 'status', 'distance', 'weight', 'trip_cost']:
        if field in data:
            setattr(trip, field, data[field])

    activity = Activity(
        action="Updated Trip",
        description=f"Updated trip from {trip.source} to {trip.destination}",
        user_id=data.get('user_id', 1)
    )
    db.session.add(activity)

    db.session.commit()
    return jsonify(trip.to_dict()), 200

@trips_bp.route('/<int:id>', methods=['DELETE'])
def delete_trip(id):
    trip = Trip.query.get_or_404(id)
    
    activity = Activity(
        action="Deleted Trip",
        description=f"Deleted trip from {trip.source} to {trip.destination}",
        user_id=request.args.get('user_id', 1)
    )
    db.session.add(activity)
    
    db.session.delete(trip)
    db.session.commit()
    return jsonify({'message': 'Trip deleted successfully'}), 200
