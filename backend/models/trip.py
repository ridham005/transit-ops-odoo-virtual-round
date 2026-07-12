from . import db, BaseModel

class Trip(BaseModel):
    __tablename__ = 'trips'
    
    source = db.Column(db.String(150), nullable=False)
    destination = db.Column(db.String(150), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=False)
    distance = db.Column(db.String(50), nullable=False)
    weight = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Draft') # Draft, Dispatched, In Transit, Delayed, Completed, Cancelled
    
    trip_cost = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': f"T-{9000 + self.id}",
            'real_id': self.id,
            'source': self.source,
            'destination': self.destination,
            'vehicle_id': self.vehicle_id,
            'vehicle': self.vehicle.reg_number if self.vehicle else None,
            'driver_id': self.driver_id,
            'driver': self.driver.name if self.driver else None,
            'distance': self.distance,
            'weight': self.weight,
            'status': self.status,
            'trip_cost': self.trip_cost,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
