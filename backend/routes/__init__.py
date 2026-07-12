from .auth import auth_bp
from .vehicles import vehicles_bp
from .drivers import drivers_bp
from .trips import trips_bp
from .maintenance import maintenance_bp
from .expenses import expenses_bp
from .dashboard import dashboard_bp
from .activities import activities_bp

__all__ = [
    'auth_bp',
    'vehicles_bp',
    'drivers_bp',
    'trips_bp',
    'maintenance_bp',
    'expenses_bp',
    'dashboard_bp',
    'activities_bp'
]
