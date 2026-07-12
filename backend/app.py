from flask import Flask, jsonify
from flask_cors import CORS
from models import db
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for all routes
    CORS(app)
    
    # Initialize SQLAlchemy
    db.init_app(app)
    
    from routes.auth import auth_bp
    from routes.vehicles import vehicles_bp
    from routes.drivers import drivers_bp
    from routes.trips import trips_bp
    from routes.maintenance import maintenance_bp
    from routes.expenses import expenses_bp
    from routes.dashboard import dashboard_bp
    from routes.activities import activities_bp
    from routes.users import users_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(vehicles_bp, url_prefix='/api/vehicles')
    app.register_blueprint(drivers_bp, url_prefix='/api/drivers')
    app.register_blueprint(trips_bp, url_prefix='/api/trips')
    app.register_blueprint(maintenance_bp, url_prefix='/api/maintenance')
    app.register_blueprint(expenses_bp, url_prefix='/api/expenses')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(activities_bp, url_prefix='/api/activities')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'version': '1.0.0'
        }), 200

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
