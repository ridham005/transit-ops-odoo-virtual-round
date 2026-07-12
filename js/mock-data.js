// mock-data.js
// Provides static mock data for the TransitOps UI scaffold and handles localStorage persistence.

const initialData = {
    vehicles: [
        { regNo: 'GJ01AB452', name: 'VAN-05', type: 'Van', capacity: '500 kg', capacityVal: 500, odometer: '74,000', cost: '6,20,000', status: 'Available' },
        { regNo: 'GJ01AB998', name: 'TRUCK-11', type: 'Truck', capacity: '5 Ton', capacityVal: 5000, odometer: '182,000', cost: '24,50,000', status: 'On Trip' },
        { regNo: 'GJ01AB1120', name: 'MINI-03', type: 'Mini', capacity: '1 Ton', capacityVal: 1000, odometer: '66,000', cost: '4,10,000', status: 'In Shop' },
        { regNo: 'GJ01AB008', name: 'VAN-09', type: 'Van', capacity: '750 kg', capacityVal: 750, odometer: '241,900', cost: '5,90,000', status: 'Retired' }
    ],
    
    drivers: [
        { name: 'Alex', license: 'DL-88213', category: 'LMV', expiry: '2028-12-31', contact: '98765xxxxx', compl: '96%', status: 'Available' },
        { name: 'John', license: 'DL-44120', category: 'HMV', expiry: '2025-03-01', contact: '98220xxxxx', compl: '81%', status: 'Suspended' },
        { name: 'Priya', license: 'DL-77031', category: 'LMV', expiry: '2027-08-15', contact: '99110xxxxx', compl: '99%', status: 'On Trip' },
        { name: 'Suresh', license: 'DL-90045', category: 'HMV', expiry: '2027-01-10', contact: '97440xxxxx', compl: '88%', status: 'Off Duty' }
    ],
    
    trips: [
        { id: 'TR001', vehicle: 'VAN-05', driver: 'Alex', status: 'On Trip', eta: '45 min', source: 'Gandhinagar Depot', dest: 'Ahmedabad Hub', cargoWeight: 300 },
        { id: 'TR002', vehicle: 'TRK-12', driver: 'John', status: 'Completed', eta: '-', source: 'Surat', dest: 'Bharuch', cargoWeight: 4000 },
        { id: 'TR003', vehicle: 'MINI-08', driver: 'Priya', status: 'Dispatched', eta: '1h 10m', source: 'Vadodara', dest: 'Anand', cargoWeight: 800 },
        { id: 'TR004', vehicle: '-', driver: '-', status: 'Draft', eta: 'Awaiting vehicle', source: 'Vatva Industrial Area', dest: 'Sanand Warehouse', cargoWeight: 600 }
    ],

    maintenance: [
        { vehicle: 'VAN-05', service: 'Oil Change', cost: 2500, status: 'In Shop' },
        { vehicle: 'TRUCK-11', service: 'Engine Repair', cost: 18000, status: 'Completed' },
        { vehicle: 'MINI-03', service: 'Tyre Replace', cost: 6200, status: 'In Shop' }
    ],

    fuelLogs: [
        { vehicle: 'VAN-05', date: '05 Jul 2026', liters: '42 L', cost: 3150 },
        { vehicle: 'TRUCK-11', date: '06 Jul 2026', liters: '110 L', cost: 8400 },
        { vehicle: 'MINI-08', date: '06 Jul 2026', liters: '28 L', cost: 2050 }
    ]
};

// Initialize State from localStorage or use initial data
let appState = JSON.parse(localStorage.getItem('transitOpsState'));
if (!appState) {
    appState = initialData;
    saveState();
}

function saveState() {
    localStorage.setItem('transitOpsState', JSON.stringify(appState));
    // Dispatch a custom event so other parts of the app can react to state changes
    window.dispatchEvent(new Event('stateChanged'));
}

// Global Store API for the app
window.TransitStore = {
    getState: () => appState,
    
    addVehicle: (vehicle) => {
        // Validation: Unique Reg Number
        const exists = appState.vehicles.find(v => v.regNo === vehicle.regNo);
        if (exists) {
            throw new Error(`Registration number ${vehicle.regNo} already exists.`);
        }
        appState.vehicles.push(vehicle);
        saveState();
    },

    updateVehicleStatus: (regNo, status) => {
        const v = appState.vehicles.find(v => v.regNo === regNo || v.name === regNo);
        if (v && v.status !== 'Retired') { // Never override Retired automatically
            v.status = status;
            saveState();
        }
    },

    updateDriverStatus: (name, status) => {
        const d = appState.drivers.find(d => d.name === name);
        if (d) {
            d.status = status;
            saveState();
        }
    },
    
    dispatchTrip: (tripId, vehicleName, driverName, cargoWeight) => {
        const trip = appState.trips.find(t => t.id === tripId) || { id: tripId };
        trip.vehicle = vehicleName;
        trip.driver = driverName;
        trip.cargoWeight = cargoWeight;
        trip.status = 'Dispatched';
        
        if (!appState.trips.find(t => t.id === tripId)) {
            appState.trips.push(trip);
        }

        window.TransitStore.updateVehicleStatus(vehicleName, 'On Trip');
        window.TransitStore.updateDriverStatus(driverName, 'On Trip');
        saveState();
    },

    completeTrip: (tripId) => {
        const trip = appState.trips.find(t => t.id === tripId);
        if (trip) {
            trip.status = 'Completed';
            window.TransitStore.updateVehicleStatus(trip.vehicle, 'Available');
            window.TransitStore.updateDriverStatus(trip.driver, 'Available');
            saveState();
        }
    },

    cancelTrip: (tripId) => {
        const trip = appState.trips.find(t => t.id === tripId);
        if (trip && trip.status === 'Dispatched') {
            trip.status = 'Cancelled';
            window.TransitStore.updateVehicleStatus(trip.vehicle, 'Available');
            window.TransitStore.updateDriverStatus(trip.driver, 'Available');
            saveState();
        }
    },

    addMaintenance: (record) => {
        appState.maintenance.push(record);
        if (record.status === 'Active') {
            window.TransitStore.updateVehicleStatus(record.vehicle, 'In Shop');
        }
        saveState();
    },

    completeMaintenance: (index) => {
        const record = appState.maintenance[index];
        if (record) {
            record.status = 'Completed';
            window.TransitStore.updateVehicleStatus(record.vehicle, 'Available');
            saveState();
        }
    },

    addFuelLog: (log) => {
        appState.fuelLogs.push(log);
        saveState();
    },

    getCalculatedMetrics: () => {
        const v = appState.vehicles;
        const activeVehicles = v.filter(v => v.status !== 'Retired').length;
        const availableVehicles = v.filter(v => v.status === 'Available').length;
        const inMaintenance = v.filter(v => v.status === 'In Shop').length;
        
        const t = appState.trips;
        const activeTrips = t.filter(t => t.status === 'On Trip' || t.status === 'Dispatched').length;
        const pendingTrips = t.filter(t => t.status === 'Draft').length;
        
        const d = appState.drivers;
        const driversOnDuty = d.filter(d => d.status === 'On Trip').length;
        
        const fleetUtilization = activeVehicles > 0 ? Math.round(((activeVehicles - availableVehicles - inMaintenance) / activeVehicles) * 100) : 0;
        
        return {
            activeVehicles,
            availableVehicles,
            inMaintenance,
            activeTrips,
            pendingTrips,
            driversOnDuty,
            fleetUtilization
        };
    },

    getTotalOperationalCost: () => {
        const fuelCost = appState.fuelLogs.reduce((sum, log) => sum + parseFloat(log.cost), 0);
        const maintCost = appState.maintenance.reduce((sum, rec) => sum + parseFloat(rec.cost), 0);
        return fuelCost + maintCost;
    }
};

// Helper function to get badge class based on status string
function getBadgeClass(status) {
    if (!status) return 'badge-neutral';
    status = status.toLowerCase();
    if (status.includes('available') || status.includes('completed')) return 'badge-success';
    if (status.includes('on trip') || status.includes('dispatched')) return 'badge-info';
    if (status.includes('in shop') || status.includes('suspended')) return 'badge-warning';
    if (status.includes('retired') || status.includes('cancelled')) return 'badge-danger';
    return 'badge-neutral'; // Draft, Off Duty, etc.
}
