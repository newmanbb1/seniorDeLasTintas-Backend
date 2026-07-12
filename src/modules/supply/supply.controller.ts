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
import { AllowAnonymous } from '../../common/guards/allow-anon.decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiCreatedWrapped,
  ApiErrorResponseDto,
  ApiOkWrapped,
  ok,
} from 'src/common/response';
import { SupplyService } from './supply.service';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { FilterSupply } from './dto/filter-supply.dto';
import { FilterPublicSupply } from './dto/filter-public-supply.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, GetUser } from '../../common/decorators';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('supply')
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller('supply')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupplyController {
  constructor(private readonly supplyService: SupplyService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create supply (Admin only)' })
  @ApiBody({ type: CreateSupplyDto })
  @ApiCreatedWrapped()
  async create(
    @Body() createSupplyDto: CreateSupplyDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.supplyService.create(createSupplyDto, userId));
  }

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'List supplies with pagination and filters' })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterSupply) {
    return ok(await this.supplyService.findAll(filters));
  }

  @Get('public')
  @AllowAnonymous()
  @ApiOperation({ summary: 'List public catalog (active supplies only, paginated)' })
  @ApiOkWrapped()
  async findAllPublic(@Query() filters: FilterPublicSupply) {
    return ok(await this.supplyService.findAllPublicPaginated(filters));
  }

  @Get('public/:id')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get public supply detail by id (catalog)' })
  @ApiOkWrapped()
  async findOnePublic(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.supplyService.findOnePublic(id));
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Get supply by id' })
  @ApiOkWrapped()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.supplyService.findOne(id));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update supply' })
  @ApiBody({ type: UpdateSupplyDto })
  @ApiOkWrapped()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupplyDto: UpdateSupplyDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.supplyService.update(id, updateSupplyDto, userId));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete supply' })
  @ApiOkWrapped()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.supplyService.remove(id, userId));
  }
}
