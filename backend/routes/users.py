from flask import Blueprint, request, jsonify
from models import db
from models.user import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/<int:id>', methods=['PUT'])
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Invalid data'}), 400
        
    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        # Avoid duplicate emails
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user.id:
            return jsonify({'error': 'Email already in use'}), 400
        user.email = data['email']
    if 'profile_picture' in data:
        user.profile_picture = data['profile_picture']
        
    db.session.commit()
    
    return jsonify(user.to_dict()), 200
