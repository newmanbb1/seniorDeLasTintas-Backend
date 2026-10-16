import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiCreatedWrapped,
  ApiErrorResponseDto,
  ApiOkWrapped,
  ok,
} from 'src/common/response';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AllowAnonymous } from '../../common/guards/allow-anon.decorator';
import { Roles, GetUser } from '../../common/decorators';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('category')
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller('category')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('public')
  @AllowAnonymous()
  @ApiOperation({ summary: 'List public active categories with product counts' })
  @ApiOkWrapped()
  async findAllPublic() {
    return ok(await this.categoryService.findAllPublic());
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'List all categories with product counts' })
  @ApiOkWrapped()
  async findAll() {
    return ok(await this.categoryService.findAll());
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Get category by id' })
  @ApiOkWrapped()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.categoryService.findOne(id));
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create category (Admin only)' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedWrapped()
  async create(
    @Body() dto: CreateCategoryDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.categoryService.create(dto, userId));
  }

  @Post('sync')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Sync missing categories from existing supplies (Admin only)' })
  @ApiOkWrapped()
  async sync() {
    return ok(await this.categoryService.syncCategoriesFromSupplies());
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkWrapped()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.categoryService.update(id, dto, userId));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete category with optional reassignment of products (Admin only)' })
  @ApiQuery({
    name: 'reassignTo',
    required: false,
    description: 'Target category name to reassign associated products to before deleting',
  })
  @ApiOkWrapped()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('reassignTo') reassignTo: string,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.categoryService.remove(id, reassignTo, userId));
  }
}
