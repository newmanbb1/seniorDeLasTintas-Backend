export const seedAdmin = {
  email: 'admin@senordelastintas.com',
  password: 'admin123',
  full_name: 'Administrador Principal',
};

export const seedSecretarias = [
  {
    email: 'secretaria.centro@senordelastintas.com',
    password: 'secretaria123',
    full_name: 'Laura Rodríguez',
  },
  {
    email: 'secretaria.norte@senordelastintas.com',
    password: 'secretaria123',
    full_name: 'Roberto Díaz',
  },
];

export const seedBranches = [
  {
    name: 'Sucursal Centro',
    address: 'Av. Principal #123, Centro',
    opening_hours: 'Lun-Sáb: 9:00-20:00, Dom: 10:00-18:00',
    location_link: 'https://maps.google.com/?q=19.4326,-99.1332',
  },
  {
    name: 'Sucursal Norte',
    address: 'Blvd. Norte #456, Colonia Industrial',
    opening_hours: 'Lun-Sáb: 8:00-21:00, Dom: 9:00-19:00',
    location_link: 'https://maps.google.com/?q=19.4500,-99.1500',
  },
  {
    name: 'Sucursal Sur',
    address: 'Calle Sur #789, Col. Sur',
    opening_hours: 'Lun-Sáb: 9:00-20:00',
    location_link: 'https://maps.google.com/?q=19.4000,-99.1200',
  },
];

export const seedSupplies = [
  { name: 'Tinta Negra', category: 'Tintas', unit_of_measure: 'litros' },
  { name: 'Tinta Cyan', category: 'Tintas', unit_of_measure: 'litros' },
  { name: 'Tinta Magenta', category: 'Tintas', unit_of_measure: 'litros' },
  { name: 'Tinta Amarilla', category: 'Tintas', unit_of_measure: 'litros' },
  { name: 'Resma Papel A4', category: 'Papel', unit_of_measure: 'unidades' },
  { name: 'Resma Papel Carta', category: 'Papel', unit_of_measure: 'unidades' },
  {
    name: 'Cabezal Impresora',
    category: 'Repuestos',
    unit_of_measure: 'unidades',
  },
  {
    name: 'Rodillo de Alimentación',
    category: 'Repuestos',
    unit_of_measure: 'unidades',
  },
  { name: 'Toner HP 85A', category: 'Toner', unit_of_measure: 'unidades' },
  { name: 'Toner Canon 337', category: 'Toner', unit_of_measure: 'unidades' },
];

export const seedEmployees = [
  { full_name: 'Juan Pérez', access_pin: '1234', position: 'Vendedor' },
  { full_name: 'María González', access_pin: '5678', position: 'Cajera' },
  { full_name: 'Carlos López', access_pin: '9012', position: 'Técnico' },
  { full_name: 'Ana Martínez', access_pin: '3456', position: 'Vendedor' },
  { full_name: 'Pedro Sánchez', access_pin: '7890', position: 'Encargado' },
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
