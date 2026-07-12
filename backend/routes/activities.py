from flask import Blueprint, jsonify
from models.activity import Activity
from models.user import User

activities_bp = Blueprint('activities', __name__)

@activities_bp.route('', strict_slashes=False, methods=['GET'])
def get_activities():
    activities = Activity.query.order_by(Activity.created_at.desc()).limit(20).all()
    
    result = []
    for a in activities:
        a_dict = a.to_dict()
        user = User.query.get(a.user_id)
        if user:
            a_dict['user_name'] = user.name
        result.append(a_dict)
        
    return jsonify(result), 200
