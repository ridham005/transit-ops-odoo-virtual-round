from . import db, BaseModel

class Maintenance(BaseModel):
    __tablename__ = 'maintenances'
    
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    service_type = db.Column(db.String(100), nullable=False)
    garage = db.Column(db.String(150), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    cost = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(50), nullable=False, default='Scheduled') # Scheduled, In Progress, Completed
    remarks = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'vehicle': self.vehicle.reg_number if self.vehicle else None,
            'service_type': self.service_type,
            'garage': self.garage,
            'date': self.date,
            'cost': self.cost,
            'status': self.status,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
