const mockData = {
  kpis: {
    activeVehicles: 42,
    availableVehicles: 15,
    inShopVehicles: 3,
    activeTrips: 28,
    pendingTrips: 12,
    driversOnDuty: 40,
    fleetUtilization: '78%'
  },
  vehicles: [
    { id: 'V-1001', regNumber: 'MH-12-AB-3456', model: 'Tata Signa 4923.S', type: 'Heavy Truck', loadCapacity: '40t', odometer: '120,500 km', status: 'Available' },
    { id: 'V-1002', regNumber: 'DL-01-CD-7654', model: 'Ashok Leyland 4220', type: 'Heavy Truck', loadCapacity: '42t', odometer: '85,200 km', status: 'On Trip' },
    { id: 'V-1003', regNumber: 'KA-05-MN-8901', model: 'Mahindra Bolero MaxiTruck', type: 'Light Commercial', loadCapacity: '1.2t', odometer: '45,100 km', status: 'In Shop' },
    { id: 'V-1004', regNumber: 'UP-16-RS-4567', model: 'Maruti Suzuki Eeco Cargo', type: 'Van', loadCapacity: '0.6t', odometer: '210,000 km', status: 'Retired' }
  ],
  drivers: [
    { id: 'D-201', name: 'Rajesh Kumar', licenseType: 'HMV', phone: '98765-43210', status: 'Available' },
    { id: 'D-202', name: 'Sanjay Singh', licenseType: 'HMV', phone: '91234-56789', status: 'On Trip' },
    { id: 'D-203', name: 'Amit Sharma', licenseType: 'LMV', phone: '99887-76655', status: 'Off Duty' },
    { id: 'D-204', name: 'Mohammed Ali', licenseType: 'HMV', phone: '98989-89898', status: 'Suspended' }
  ],
  trips: [
    { id: 'T-9001', source: 'Mumbai Port Trust', destination: 'Pune Warehouse', vehicle: 'V-1002', driver: 'D-202', weight: '38t', distance: '150 km', status: 'Dispatched' },
    { id: 'T-9002', source: 'Delhi Distribution Hub', destination: 'Noida Store 15', vehicle: 'V-1001', driver: 'D-201', weight: '15t', distance: '45 km', status: 'Draft' },
    { id: 'T-9003', source: 'Bengaluru Factory', destination: 'Mysuru Warehouse', vehicle: 'V-1003', driver: 'D-203', weight: '1t', distance: '145 km', status: 'Completed' },
    { id: 'T-9004', source: 'Chennai Port', destination: 'Sriperumbudur Factory', vehicle: 'V-1004', driver: 'D-204', weight: '0.5t', distance: '50 km', status: 'Cancelled' }
  ]
};

// Helper function to map status to badge class
function getStatusBadgeClass(status) {
  const map = {
    'Available': 'badge-success',
    'On Trip': 'badge-info',
    'In Shop': 'badge-warning',
    'Retired': 'badge-danger',
    'Suspended': 'badge-danger',
    'Dispatched': 'badge-info',
    'Draft': 'badge-secondary',
    'Completed': 'badge-success',
    'Cancelled': 'badge-danger',
    'Off Duty': 'badge-secondary'
  };
  return map[status] || 'badge-secondary';
}
