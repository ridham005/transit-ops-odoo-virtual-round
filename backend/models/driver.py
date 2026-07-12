from . import db, BaseModel

class Driver(BaseModel):
    __tablename__ = 'drivers'
    
    name = db.Column(db.String(150), nullable=False)
    license_number = db.Column(db.String(50), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Available') # Available, On Duty, Off Duty
    experience = db.Column(db.Integer, default=0) # in years
    
    # Relationships
    trips = db.relationship('Trip', backref='driver', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'license_number': self.license_number,
            'phone': self.phone,
            'status': self.status,
            'experience': self.experience,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
