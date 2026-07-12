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
    { id: 'V-1001', regNumber: 'MH-12-AB-3456', model: 'Tata Signa 4923.S', type: 'Heavy Truck', loadCapacity: '40t', odometer: '1,20,500 km', status: 'Available' },
    { id: 'V-1002', regNumber: 'DL-01-CD-7654', model: 'Ashok Leyland 4220', type: 'Heavy Truck', loadCapacity: '42t', odometer: '85,200 km', status: 'On Trip' },
    { id: 'V-1003', regNumber: 'KA-05-MN-8901', model: 'Mahindra Bolero MaxiTruck', type: 'Light Commercial', loadCapacity: '1.2t', odometer: '45,100 km', status: 'In Shop' },
    { id: 'V-1004', regNumber: 'UP-16-RS-4567', model: 'Maruti Suzuki Eeco Cargo', type: 'Van', loadCapacity: '0.6t', odometer: '2,10,000 km', status: 'Retired' }
  ],
  drivers: [
    { id: 'D-201', name: 'Rahul Sharma', licenseType: 'HMV', phone: '98765-43210', status: 'Available', hoursWorked: 45, performanceScore: 92 },
    { id: 'D-202', name: 'Sanjay Singh', licenseType: 'HMV', phone: '91234-56789', status: 'On Trip', hoursWorked: 38, performanceScore: 88 },
    { id: 'D-203', name: 'Arjun Mehta', licenseType: 'LMV', phone: '99887-76655', status: 'Off Duty', hoursWorked: 0, performanceScore: 95 },
    { id: 'D-204', name: 'Mohammed Ali', licenseType: 'HMV', phone: '98989-89898', status: 'Suspended', hoursWorked: 0, performanceScore: 45 }
  ],
  trips: [
    { id: 'T-9001', source: 'Mumbai Port Trust', destination: 'Pune Warehouse', vehicle: 'V-1002', driver: 'D-202', weight: '38t', distance: '150 km', status: 'Dispatched' },
    { id: 'T-9002', source: 'Delhi Hub', destination: 'Noida Depot', vehicle: 'V-1001', driver: 'D-201', weight: '15t', distance: '45 km', status: 'Draft' },
    { id: 'T-9003', source: 'Bengaluru Factory', destination: 'Mysuru Warehouse', vehicle: 'V-1003', driver: 'D-203', weight: '1t', distance: '145 km', status: 'Completed' },
    { id: 'T-9004', source: 'Chennai Port', destination: 'Sriperumbudur Factory', vehicle: 'V-1004', driver: 'D-204', weight: '0.5t', distance: '50 km', status: 'Cancelled' }
  ],
  maintenanceRecords: [
    { id: 'M-101', vehicle: 'V-1003', type: 'Engine Repair', date: '10/07/2026', cost: '45,000', status: 'In Progress' },
    { id: 'M-102', vehicle: 'V-1001', type: 'Oil Change', date: '05/07/2026', cost: '3,500', status: 'Completed' },
    { id: 'M-103', vehicle: 'V-1002', type: 'Tire Replacement', date: '15/07/2026', cost: '12,000', status: 'Scheduled' }
  ],
  expenses: [
    { id: 'E-501', vehicle: 'V-1002', category: 'Fuel', amount: '8,500', date: '11/07/2026', status: 'Approved' },
    { id: 'E-502', vehicle: 'V-1001', category: 'Toll', amount: '450', date: '10/07/2026', status: 'Approved' },
    { id: 'E-503', vehicle: 'V-1003', category: 'Maintenance', amount: '45,000', date: '10/07/2026', status: 'Pending' },
    { id: 'E-504', vehicle: 'Fleet Wide', category: 'Other', amount: '2,500', date: '09/07/2026', status: 'Rejected' }
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
    'Off Duty': 'badge-secondary',
    'Approved': 'badge-success',
    'Pending': 'badge-warning',
    'Rejected': 'badge-danger'
  };
  return map[status] || 'badge-secondary';
}
