from . import db, BaseModel

class Expense(BaseModel):
    __tablename__ = 'expenses'
    
    type = db.Column(db.String(100), nullable=False) # Fuel, Toll, Parking, Misc, Maintenance
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), default='Pending')
    description = db.Column(db.Text)
    
    # Optional vehicle reference
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'amount': self.amount,
            'date': self.date,
            'status': self.status,
            'description': self.description,
            'vehicle_id': self.vehicle_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
