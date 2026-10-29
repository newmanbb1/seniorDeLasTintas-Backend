-- ==============================================================================
-- SCRIPT DE MIGRACIÓN/SEED: RESETEADORES DIGITALES (69 PRODUCTOS)
-- Categoría: Reseteadores digitales
-- ==============================================================================
BEGIN;

-- 1. Asegurar la existencia de la categoría Reseteadores digitales
INSERT INTO category (id, name, description, icon, color, is_active, display_order, created_by)
VALUES (
    uuid_generate_v4(),
    'Reseteadores digitales',
    'Software y programas de ajuste (Adjustment Program) para reseteo de almohadillas Epson y Canon.',
    'Cajas reset y chips',
    'sky',
    true,
    5,
    '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    is_active = true,
    display_order = 5,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

-- 2. Insertar / Actualizar los 69 productos de Reseteadores Digitales
INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0001', 'Reset Epson L110 L200 L210 L300 L350 L355 L550 L555 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2016.webp'], true,
    5.00, 'Epson', 'Epson serie L', 'Reset Epson L110 L200 L210 L300 L350 L355 L550 L555 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0002', 'Reset Epson L1110 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-141.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L1110 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0003', 'Reset Epson L120 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-139.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L120 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0004', 'Reset Epson L1210 L3210 L3250 L3251 L3260 L5290 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2028.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L1210 L3210 L3250 L3251 L3260 L5290 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0005', 'Reset Epson L1211 L1216 L1250 L1251 L1256 L3210 L3211 L3216 L3250 L3251 L3256 L3260 L5290 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2030.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L1211 L1216 L1250 L1251 L1256 L3210 L3211 L3216 L3250 L3251 L3256 L3260 L5290 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0006', 'Reset Epson L130 L220 L310 L360 L365 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2014.webp'], true,
    10.00, 'Epson', 'Epson serie L', 'Reset Epson L130 L220 L310 L360 L365 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0007', 'Reset Epson L1300 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2024.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L1300 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0008', 'Reset Epson L1800 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2026.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L1800 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0009', 'Reset Epson L3050, L3070 Adjustment Program epson', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-96.webp'], true,
    7.00, 'Epson', 'Epson serie L', 'Reset Epson L3050, L3070 Adjustment Program epson (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0010', 'Reset Epson L3060 Adjustment Program epson', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-105.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L3060 Adjustment Program epson (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0011', 'Reset Epson L3100 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2033.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L3100 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0012', 'Reset Epson L3110 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-70.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L3110 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0013', 'Reset Epson L3150 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-72.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L3150 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0014', 'Reset Epson L3160 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2035.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L3160 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0015', 'Reset Epson L3550 L3556 L5590 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2037.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L3550 L3556 L5590 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0016', 'Reset Epson L375 L475 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2018.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L375 L475 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0017', 'Reset Epson L380, L383, L385 ,L485 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-87.webp'], true,
    7.00, 'Epson', 'Epson serie L', 'Reset Epson L380, L383, L385 ,L485 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0018', 'Reset Epson L395-495 Adjustment Program epson', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-88.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L395-495 Adjustment Program epson (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0019', 'Reset Epson L396 Adjustment Program epson', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-89.webp'], true,
    7.00, 'Epson', 'Epson serie L', 'Reset Epson L396 Adjustment Program epson (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0020', 'Reset Epson L405 Adjustment Program epson', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-90.webp'], true,
    7.00, 'Epson', 'Epson serie L', 'Reset Epson L405 Adjustment Program epson (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0021', 'Reset Epson L4150, 4160', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-91.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L4150, 4160 (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0022', 'Reset Epson L4260 L4261 L4267 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2039.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L4260 L4261 L4267 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0023', 'Reset Epson L455', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-134.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L455 (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0024', 'Reset Epson L5190 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2041.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L5190 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0025', 'Reset Epson L565 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2020.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L565 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0026', 'Reset Epson L575', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-128.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L575 (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0027', 'Reset Epson L6161, L6171, L6190, L6091Adjustment Program epson', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-92.webp'], true,
    5.00, 'Epson', 'Epson serie L', 'Reset Epson L6161, L6171, L6190, L6091Adjustment Program epson (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0028', 'Reset Epson L655 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2022.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L655 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0029', 'Reset Epson L656 Adjustment Program epson', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-129.webp'], true,
    7.00, 'Epson', 'Epson serie L', 'Reset Epson L656 Adjustment Program epson (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0030', 'Reset Epson L800 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-137.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L800 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0031', 'Reset Epson L805 Adjustment Program epson', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-135.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L805 Adjustment Program epson (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0032', 'Reset Epson L810-L850 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-138.webp'], true,
    9.00, 'Epson', 'Epson serie L', 'Reset Epson L810-L850 Adjustment Program (Epson serie L). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0033', 'Reset Epson XP101 XP201 XP204 XP401 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2051.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP101 XP201 XP204 XP401 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0034', 'Reset Epson XP2101 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2074.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP2101 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0035', 'Reset Epson XP211 XP214 XP411 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2053.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP211 XP214 XP411 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0036', 'Reset Epson XP2200 – XP2205 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2787.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP2200 – XP2205 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0037', 'Reset Epson XP225 XP322 XP323 XP325 XP422 XP423 XP425 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2057.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP225 XP322 XP323 XP325 XP422 XP423 XP425 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0038', 'Reset Epson XP231 XP341 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2055.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP231 XP341 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0039', 'Reset Epson XP235 XP332 XP335 XP432 XP435 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2060.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP235 XP332 XP335 XP432 XP435 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0040', 'Reset Epson XP243 XP245 XP247 XP342 XP343 XP345XP442 XP445 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2062.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP243 XP245 XP247 XP342 XP343 XP345XP442 XP445 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0041', 'Reset Epson XP255 XP257 XP352 XP355 XP452 XP455 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2064.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP255 XP257 XP352 XP355 XP452 XP455 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0042', 'Reset Epson XP320 XP420 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2068.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP320 XP420 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0043', 'Reset Epson XP340 XP440 XP446 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2066.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP340 XP440 XP446 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0044', 'Reset Epson XP520 XP620 XP720 XP760 XP820 XP860 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2072.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson XP520 XP620 XP720 XP760 XP820 XP860 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0045', 'Reset Epson Xp241', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-130.webp'], true,
    8.00, 'Epson', 'Epson XP', 'Reset Epson Xp241 (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0046', 'Reset Epson Xp400 Xp401 XP402 XP403 XP405 XP410 XP411 XP415 XP425 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2070.webp'], true,
    9.00, 'Epson', 'Epson XP', 'Reset Epson Xp400 Xp401 XP402 XP403 XP405 XP410 XP411 XP415 XP425 Adjustment Program (Epson XP). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0047', 'Reset Epson ET16600 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2008.webp'], true,
    15.00, 'Epson', 'Epson EcoTank ET', 'Reset Epson ET16600 Adjustment Program (Epson EcoTank ET). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0048', 'Reset Epson ET2500 – ET2550 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-1990.webp'], true,
    9.00, 'Epson', 'Epson EcoTank ET', 'Reset Epson ET2500 – ET2550 Adjustment Program (Epson EcoTank ET). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0049', 'Reset Epson ET2600 – ET2650 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-1992.webp'], true,
    9.00, 'Epson', 'Epson EcoTank ET', 'Reset Epson ET2600 – ET2650 Adjustment Program (Epson EcoTank ET). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0050', 'Reset Epson ET2710 – ET2711 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-1994.webp'], true,
    9.00, 'Epson', 'Epson EcoTank ET', 'Reset Epson ET2710 – ET2711 Adjustment Program (Epson EcoTank ET). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0051', 'Reset Epson ET2720 – ET2726 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-1996.webp'], true,
    9.00, 'Epson', 'Epson EcoTank ET', 'Reset Epson ET2720 – ET2726 Adjustment Program (Epson EcoTank ET). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0052', 'Reset Epson ET2750 – ET2760 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-1998.webp'], true,
    9.00, 'Epson', 'Epson EcoTank ET', 'Reset Epson ET2750 – ET2760 Adjustment Program (Epson EcoTank ET). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0053', 'Reset Epson ET4500 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2001.webp'], true,
    9.00, 'Epson', 'Epson EcoTank ET', 'Reset Epson ET4500 Adjustment Program (Epson EcoTank ET). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0054', 'Reset Epson ET4550 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2003.webp'], true,
    9.00, 'Epson', 'Epson EcoTank ET', 'Reset Epson ET4550 Adjustment Program (Epson EcoTank ET). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0055', 'Reset Epson ET4700 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2005.webp'], true,
    9.00, 'Epson', 'Epson EcoTank ET', 'Reset Epson ET4700 Adjustment Program (Epson EcoTank ET). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0056', 'Reset Epson Reset Epson ET1810 ET2800 ET2803 ET2810 ET281 ET2812 ET2814 ET2815 ET2820 ET2821 ET2825 ET2826 ET4800O Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2007.webp'], true,
    9.00, 'Epson', 'Epson EcoTank ET', 'Reset Epson Reset Epson ET1810 ET2800 ET2803 ET2810 ET281 ET2812 ET2814 ET2815 ET2820 ET2821 ET2825 ET2826 ET4800O Adjustment Program (Epson EcoTank ET). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0057', 'Reset Epson WF 2110 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2325.webp'], true,
    10.00, 'Epson', 'Epson WorkForce WF', 'Reset Epson WF 2110 Adjustment Program (Epson WorkForce WF). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0058', 'Reset Epson WF2630', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-95.webp'], true,
    9.00, 'Epson', 'Epson WorkForce WF', 'Reset Epson WF2630 (Epson WorkForce WF). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0059', 'Reset Epson WF2650 WF2660 WF2750 WF2751 WF2760 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2047.webp'], true,
    9.00, 'Epson', 'Epson WorkForce WF', 'Reset Epson WF2650 WF2660 WF2750 WF2751 WF2760 Adjustment Program (Epson WorkForce WF). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0060', 'Reset Epson WF2650, WF2660, WF2750, WF2751, WF2760 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-94.webp'], true,
    9.00, 'Epson', 'Epson WorkForce WF', 'Reset Epson WF2650, WF2660, WF2750, WF2751, WF2760 Adjustment Program (Epson WorkForce WF). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0061', 'Reset Epson WF3720 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2049.webp'], true,
    9.00, 'Epson', 'Epson WorkForce WF', 'Reset Epson WF3720 Adjustment Program (Epson WorkForce WF). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0062', 'Reset Epson M1108 M1128 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2043.webp'], true,
    9.00, 'Epson', 'Epson serie M', 'Reset Epson M1108 M1128 Adjustment Program (Epson serie M). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0063', 'Reset Epson M2100 M2120 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2045.webp'], true,
    9.00, 'Epson', 'Epson serie M', 'Reset Epson M2100 M2120 Adjustment Program (Epson serie M). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0064', 'La almohadilla de tinta para impresión sin bordes ha alcanzado el final de su vida útil ET16600, WF7820 WF7840 EC7000', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2323.webp'], true,
    15.00, 'Epson', 'Otros Epson', 'La almohadilla de tinta para impresión sin bordes ha alcanzado el final de su vida útil ET16600, WF7820 WF7840 EC7000 (Otros Epson). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0065', 'Reset Epson Stylus Photo 1390 1400 1410 Adjustment Program', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-2012.webp'], true,
    9.00, 'Epson', 'Otros Epson', 'Reset Epson Stylus Photo 1390 1400 1410 Adjustment Program (Otros Epson). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0066', 'Reset Canon St5302', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-17.webp'], true,
    12.00, 'Canon', 'Reseteadores Canon', 'Reset Canon St5302 (Reseteadores Canon). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0067', 'Reset Canon St55510', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-1222.webp'], true,
    15.00, 'Canon', 'Reseteadores Canon', 'Reset Canon St55510 (Reseteadores Canon). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0068', 'ServiPack Redirector: reseteo de impresoras a distancia (plan anual 365 días)', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-6744.webp'], true,
    80.00, 'ServiPack', 'ServiPack (software para técnicos)', 'ServiPack Redirector: reseteo de impresoras a distancia (plan anual 365 días) (ServiPack (software para técnicos)). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

INSERT INTO supply (
    id, code, name, category, unit_of_measure, images, is_active,
    sale_price, brand, compatibility, commercial_description, created_by
) VALUES (
    uuid_generate_v4(), 'RD-0069', 'ServiPack: software para técnicos de impresoras Epson (licencia ilimitada 1 PC)', 'Reseteadores digitales', 'licencia', ARRAY['https://xn--elseordelastintas-ixb.com/wp-content/uploads/2026/10/cm-6616.webp'], true,
    80.00, 'ServiPack', 'ServiPack (software para técnicos)', 'ServiPack: software para técnicos de impresoras Epson (licencia ilimitada 1 PC) (ServiPack (software para técnicos)). Software de reseteo de almohadillas Adjustment Program / ServiPack. Licencia digital.', '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_of_measure = EXCLUDED.unit_of_measure,
    images = EXCLUDED.images,
    is_active = true,
    sale_price = EXCLUDED.sale_price,
    brand = EXCLUDED.brand,
    compatibility = EXCLUDED.compatibility,
    commercial_description = EXCLUDED.commercial_description,
    deleted_at = NULL,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

-- 3. Asignar inventario para cada producto en todas las sucursales activas (100 unidades por sucursal)
INSERT INTO inventory (id, branch_id, supply_id, current_quantity, minimum_stock, created_by)
SELECT
    uuid_generate_v4(),
    b.id AS branch_id,
    s.id AS supply_id,
    100 AS current_quantity,
    0 AS minimum_stock,
    '00000000-0000-4000-8000-000000000001' AS created_by
FROM branch b
CROSS JOIN supply s
WHERE b.deleted_at IS NULL
  AND s.category = 'Reseteadores digitales'
  AND s.deleted_at IS NULL
ON CONFLICT (branch_id, supply_id) DO UPDATE SET
    current_quantity = 100,
    minimum_stock = 0,
    updated_at = NOW(),
    updated_by = '00000000-0000-4000-8000-000000000001';

COMMIT;