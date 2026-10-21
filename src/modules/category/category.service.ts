import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Supply } from '../supply/entities/supply.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface CategoryWithCount extends Category {
  product_count: number;
}

@Injectable()
export class CategoryService implements OnModuleInit {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Supply)
    private readonly supplyRepository: Repository<Supply>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.syncCategoriesFromSupplies();
    } catch (err: any) {
      this.logger.warn(`No se pudo sincronizar categorías en init: ${err.message}`);
    }
  }

  async syncCategoriesFromSupplies(): Promise<{ synced: number }> {
    const rawCategories = await this.supplyRepository
      .createQueryBuilder('supply')
      .select('DISTINCT supply.category', 'name')
      .where('supply.deleted_at IS NULL AND supply.category IS NOT NULL AND supply.category != :empty', {
        empty: '',
      })
      .getRawMany();

    let count = 0;
    for (const raw of rawCategories) {
      const name = raw.name?.trim();
      if (!name) continue;

      const existing = await this.categoryRepository.findOne({
        where: { name: ILike(name), deleted_at: IsNull() },
      });

      if (!existing) {
        const cat = this.categoryRepository.create({
          name,
          description: `Catálogo de ${name.toLowerCase()} para impresoras y consumibles.`,
          icon: this.getDefaultIcon(name),
          color: this.getDefaultColor(name),
          is_active: true,
          display_order: 10,
          created_by: process.env.SYSTEM_AUDIT_USER_ID || '00000000-0000-4000-8000-000000000001',
        });
        await this.categoryRepository.save(cat);
        count++;
      }
    }

    if (count > 0) {
      this.logger.log(`Se sincronizaron ${count} categorías nuevas desde los insumos.`);
    }

    return { synced: count };
  }

  private getDefaultIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('tinta')) return 'Tintas';
    if (lower.includes('toner')) return 'Toner';
    if (lower.includes('repuesto')) return 'Repuestos';
    if (lower.includes('reset') || lower.includes('almohadill')) return 'Cajas reset y chips';
    if (lower.includes('chip')) return 'Chips';
    if (lower.includes('cabezal')) return 'Cabezales';
    if (lower.includes('ciss')) return 'CISS';
    if (lower.includes('bomba')) return 'Bombas';
    if (lower.includes('electr')) return 'Electrónica';
    if (lower.includes('impresor')) return 'Impresoras';
    if (lower.includes('papel')) return 'Papel';
    if (lower.includes('recarga')) return 'Recargas';
    if (lower.includes('quimic') || lower.includes('químic')) return 'Químicos';
    if (lower.includes('kit')) return 'Kits';
    return 'default';
  }

  private getDefaultColor(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('tinta')) return 'cyan';
    if (lower.includes('cartucho')) return 'fuchsia';
    if (lower.includes('repuesto')) return 'amber';
    if (lower.includes('reset')) return 'indigo';
    if (lower.includes('chip')) return 'blue';
    if (lower.includes('cabezal')) return 'emerald';
    if (lower.includes('ciss')) return 'teal';
    if (lower.includes('bomba')) return 'sky';
    if (lower.includes('electr')) return 'purple';
    if (lower.includes('impresor')) return 'violet';
    if (lower.includes('quimic') || lower.includes('químic')) return 'rose';
    if (lower.includes('kit')) return 'orange';
    return 'zinc';
  }

  async findAllPublic(): Promise<CategoryWithCount[]> {
    const categories = await this.categoryRepository.find({
      where: { is_active: true, deleted_at: IsNull() },
      order: { display_order: 'ASC', name: 'ASC' },
    });

    const counts = await this.supplyRepository
      .createQueryBuilder('supply')
      .select('supply.category', 'name')
      .addSelect('COUNT(*)', 'count')
      .where('supply.deleted_at IS NULL AND supply.is_active = true')
      .groupBy('supply.category')
      .getRawMany();

    const countMap: Record<string, number> = {};
    for (const c of counts) {
      countMap[c.name.toLowerCase()] = parseInt(c.count, 10) || 0;
    }

    return categories.map((cat) => ({
      ...cat,
      product_count: countMap[cat.name.toLowerCase()] || 0,
    }));
  }

  async findAll(): Promise<CategoryWithCount[]> {
    const categories = await this.categoryRepository.find({
      where: { deleted_at: IsNull() },
      order: { display_order: 'ASC', name: 'ASC' },
    });

    const counts = await this.supplyRepository
      .createQueryBuilder('supply')
      .select('supply.category', 'name')
      .addSelect('COUNT(*)', 'count')
      .where('supply.deleted_at IS NULL')
      .groupBy('supply.category')
      .getRawMany();

    const countMap: Record<string, number> = {};
    for (const c of counts) {
      countMap[c.name.toLowerCase()] = parseInt(c.count, 10) || 0;
    }

    return categories.map((cat) => ({
      ...cat,
      product_count: countMap[cat.name.toLowerCase()] || 0,
    }));
  }

  async findOne(id: string): Promise<CategoryWithCount> {
    const category = await this.categoryRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const count = await this.supplyRepository.count({
      where: { category: category.name, deleted_at: IsNull() },
    });

    return {
      ...category,
      product_count: count,
    };
  }

  async create(dto: CreateCategoryDto, userId?: string): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { name: ILike(dto.name.trim()), deleted_at: IsNull() },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una categoría llamada "${dto.name.trim()}"`);
    }

    const category = this.categoryRepository.create({
      ...dto,
      name: dto.name.trim(),
      created_by: userId || process.env.SYSTEM_AUDIT_USER_ID || '00000000-0000-4000-8000-000000000001',
      icon: dto.icon || this.getDefaultIcon(dto.name),
      color: dto.color || this.getDefaultColor(dto.name),
    });

    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto, userId?: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const oldName = category.name;
    const newName = dto.name?.trim();

    if (newName && newName.toLowerCase() !== oldName.toLowerCase()) {
      const duplicate = await this.categoryRepository.findOne({
        where: { name: ILike(newName), deleted_at: IsNull() },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Ya existe otra categoría llamada "${newName}"`);
      }
    }

    Object.assign(category, {
      ...dto,
      ...(newName ? { name: newName } : {}),
      updated_by: userId || process.env.SYSTEM_AUDIT_USER_ID || '00000000-0000-4000-8000-000000000001',
    });

    const saved = await this.categoryRepository.save(category);

    // Si se renombró la categoría, cascada a todos los insumos que la tengan asignada
    if (newName && newName !== oldName) {
      await this.supplyRepository
        .createQueryBuilder()
        .update(Supply)
        .set({ category: newName, updated_by: userId })
        .where('category = :oldName', { oldName })
        .execute();
      this.logger.log(`Se actualizaron insumos con categoría de "${oldName}" a "${newName}"`);
    }

    return saved;
  }

  async remove(id: string, reassignToName?: string, userId?: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const suppliesCount = await this.supplyRepository.count({
      where: { category: category.name, deleted_at: IsNull() },
    });

    if (suppliesCount > 0) {
      if (!reassignToName || !reassignToName.trim()) {
        throw new BadRequestException(
          `No se puede eliminar la categoría "${category.name}" porque tiene ${suppliesCount} producto(s) asignado(s). Selecciona una categoría de destino para reasignarlos o elimínalos antes.`,
        );
      }

      const targetCategory = await this.categoryRepository.findOne({
        where: { name: ILike(reassignToName.trim()), deleted_at: IsNull() },
      });

      if (!targetCategory) {
        throw new NotFoundException(
          `La categoría de destino "${reassignToName}" no existe.`,
        );
      }

      await this.supplyRepository
        .createQueryBuilder()
        .update(Supply)
        .set({ category: targetCategory.name, updated_by: userId })
        .where('category = :oldName', { oldName: category.name })
        .execute();

      this.logger.log(
        `Se reasignaron ${suppliesCount} productos de "${category.name}" a "${targetCategory.name}"`,
      );
    }

    await this.categoryRepository.softDelete(id);

    return {
      message: `Categoría "${category.name}" eliminada correctamente.${
        suppliesCount > 0 ? ` Se reasignaron ${suppliesCount} productos a "${reassignToName}".` : ''
      }`,
    };
  }
}
