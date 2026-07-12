from . import db, BaseModel

class Vehicle(BaseModel):
    __tablename__ = 'vehicles'
    
    reg_number = db.Column(db.String(20), unique=True, nullable=False) # e.g. MH-12-AB-3456
    manufacturer = db.Column(db.String(100), nullable=False)
    model = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    capacity = db.Column(db.String(20), nullable=False)
    fuel_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Available')
    mileage = db.Column(db.Integer, default=0)
    current_location = db.Column(db.String(150))
    last_service_date = db.Column(db.String(50))
    
    # Relationships
    trips = db.relationship('Trip', backref='vehicle', lazy=True)
    maintenances = db.relationship('Maintenance', backref='vehicle', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'registration_number': self.reg_number,
            'manufacturer': self.manufacturer,
            'model': self.model,
            'type': self.type,
            'capacity': self.capacity,
            'fuel_type': self.fuel_type,
            'status': self.status,
            'mileage': self.mileage,
            'current_location': self.current_location,
            'last_service_date': self.last_service_date,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
