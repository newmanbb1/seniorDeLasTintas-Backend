export const seedAdmin = {
  email: 'admin@senordelastintas.com',
  password: 'Admin@123456',
  full_name: 'Administrador Principal',
};

export const seedSecretarias = [
  {
    email: 'secretaria.centro@senordelastintas.com',
    password: 'Secretaria@123',
    full_name: 'Laura Rodríguez',
  },
  {
    email: 'secretaria.norte@senordelastintas.com',
    password: 'Secretaria@123',
    full_name: 'Roberto Díaz',
  },
];

export const seedBranches = [
  {
    name: 'Sucursal Sucre',
    address: 'Calle Bolívar #123, Sucre',
    opening_hours: 'Lun-Vie: 8:00-19:00, Sáb: 9:00-17:00',
    location_link: 'https://maps.google.com/?q=-19.0333,-65.2627',
  },
  {
    name: 'Sucursal Santa Cruz',
    address: 'Av. San Martín #456, Santa Cruz',
    opening_hours: 'Lun-Vie: 8:00-20:00, Sáb: 9:00-18:00',
    location_link: 'https://maps.google.com/?q=-17.7833,-63.1821',
  },
];

export const seedSupplies = [
  { name: 'Tinta Negra', category: 'Tintas', unit_of_measure: 'litros', sale_price: 45.00, brand: 'Epson', compatibility: 'Impresoras Epson eco-tank', commercial_description: 'Tinta negra de alta duración para impresoras Epson' },
  { name: 'Tinta Cyan', category: 'Tintas', unit_of_measure: 'litros', sale_price: 45.00, brand: 'Epson', compatibility: 'Impresoras Epson eco-tank', commercial_description: 'Tinta cyan para impresoras Epson' },
  { name: 'Tinta Magenta', category: 'Tintas', unit_of_measure: 'litros', sale_price: 45.00, brand: 'Epson', compatibility: 'Impresoras Epson eco-tank', commercial_description: 'Tinta magenta para impresoras Epson' },
  { name: 'Tinta Amarilla', category: 'Tintas', unit_of_measure: 'litros', sale_price: 45.00, brand: 'Epson', compatibility: 'Impresoras Epson eco-tank', commercial_description: 'Tinta amarilla para impresoras Epson' },
  { name: 'Resma Papel A4', category: 'Papel', unit_of_measure: 'unidades', sale_price: 25.00, brand: 'Hamel', compatibility: 'Todo tipo de impresoras', commercial_description: 'Resma de papel bond A4 500 hojas' },
  { name: 'Resma Papel Carta', category: 'Papel', unit_of_measure: 'unidades', sale_price: 24.00, brand: 'Hamel', compatibility: 'Todo tipo de impresoras', commercial_description: 'Resma de papel bond Carta 500 hojas' },
  {
    name: 'Cabezal Impresora',
    category: 'Repuestos',
    unit_of_measure: 'unidades',
    sale_price: 120.00, brand: 'HP', compatibility: 'HP Deskjet 2000 series', commercial_description: 'Cabezal de impresión original HP' 
  },
  {
    name: 'Rodillo de Alimentación',
    category: 'Repuestos',
    unit_of_measure: 'unidades',
    sale_price: 35.00, brand: 'Genérico', compatibility: 'HP LaserJet 1000 series', commercial_description: 'Rodillo de alimentación de papel'
  },
  { name: 'Toner HP 85A', category: 'Toner', unit_of_measure: 'unidades', sale_price: 280.00, brand: 'HP', compatibility: 'HP LaserJet Pro M404/M428', commercial_description: 'Toner negro HP 85A original' },
  { name: 'Toner Canon 337', category: 'Toner', unit_of_measure: 'unidades', sale_price: 260.00, brand: 'Canon', compatibility: 'Canon MF240/MF260 series', commercial_description: 'Toner negro Canon 337 original' },
];

export const seedEmployees = [
  { full_name: 'Juan Pérez', access_pin: 'Pin@1234', position: 'Vendedor' },
  { full_name: 'María González', access_pin: 'Pin@5678', position: 'Cajera' },
  { full_name: 'Carlos López', access_pin: 'Pin@9012', position: 'Técnico' },
  { full_name: 'Ana Martínez', access_pin: 'Pin@3456', position: 'Vendedor' },
  { full_name: 'Pedro Sánchez', access_pin: 'Pin@7890', position: 'Encargado' },
];

export const seedInventory = [
  { current_quantity: 50, minimum_stock: 10 },
  { current_quantity: 30, minimum_stock: 5 },
  { current_quantity: 25, minimum_stock: 5 },
  { current_quantity: 40, minimum_stock: 8 },
  { current_quantity: 100, minimum_stock: 20 },
  { current_quantity: 80, minimum_stock: 15 },
  { current_quantity: 5, minimum_stock: 3 },
  { current_quantity: 8, minimum_stock: 2 },
  { current_quantity: 15, minimum_stock: 5 },
  { current_quantity: 10, minimum_stock: 3 },
];
