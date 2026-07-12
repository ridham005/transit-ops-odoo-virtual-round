from flask import Blueprint, request, jsonify
from models import db
from models.expense import Expense
from models.activity import Activity
from datetime import datetime

expenses_bp = Blueprint('expenses', __name__)

@expenses_bp.route('', strict_slashes=False, methods=['GET'])
def get_expenses():
    category = request.args.get('category')
    query = Expense.query
    if category:
        query = query.filter_by(type=category)
    expenses = query.all()
    return jsonify([e.to_dict() for e in expenses]), 200

@expenses_bp.route('/<int:id>', methods=['GET'])
def get_expense(id):
    expense = Expense.query.get_or_404(id)
    return jsonify(expense.to_dict()), 200

@expenses_bp.route('', strict_slashes=False, methods=['POST'])
def add_expense():
    data = request.get_json()
    
    if not data or not data.get('category') or not data.get('amount'):
        return jsonify({'error': 'Missing required fields'}), 400
        
    expense = Expense(
        type=data.get('category'),
        amount=data.get('amount'),
        date=data.get('date'),
        status=data.get('status', 'Pending'),
        description=data.get('description'),
        vehicle_id=data.get('vehicle_id')
    )
    
    db.session.add(expense)
    db.session.flush()
    
    activity = Activity(
        action="Added Expense",
        description=f"Added {expense.type} expense of ₹{expense.amount}",
        user_id=data.get('user_id', 1)
    )
    db.session.add(activity)
    
    db.session.commit()
    return jsonify(expense.to_dict()), 201

@expenses_bp.route('/<int:id>', methods=['PUT'])
def update_expense(id):
    expense = Expense.query.get_or_404(id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Invalid data'}), 400
        
    for field in ['amount', 'description', 'vehicle_id', 'status']:
        if field in data:
            setattr(expense, field, data[field])
            
    if 'category' in data:
        expense.type = data['category']
            
    if 'date' in data:
        expense.date = data['date']

    activity = Activity(
        action="Updated Expense",
        description=f"Updated {expense.type} expense",
        user_id=data.get('user_id', 1)
    )
    db.session.add(activity)

    db.session.commit()
    return jsonify(expense.to_dict()), 200

@expenses_bp.route('/<int:id>', methods=['DELETE'])
def delete_expense(id):
    expense = Expense.query.get_or_404(id)
    
    activity = Activity(
        action="Deleted Expense",
        description=f"Deleted {expense.type} expense",
        user_id=request.args.get('user_id', 1)
    )
    db.session.add(activity)
    
    db.session.delete(expense)
    db.session.commit()
    return jsonify({'message': 'Expense deleted successfully'}), 200
