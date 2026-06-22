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
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiCreatedWrapped,
  ApiErrorResponseDto,
  ApiOkWrapped,
  ok,
} from 'src/common/response';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterOrder } from './dto/filter-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, GetUser } from '../../common/decorators';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('order')
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller('order')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Create order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedWrapped()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.orderService.create(createOrderDto, userId));
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'List orders with pagination and filters' })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterOrder) {
    return ok(await this.orderService.findAll(filters));
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Get order by id' })
  @ApiOkWrapped()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.orderService.findOne(id));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Update order (only while Pending)' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiOkWrapped()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.orderService.update(id, updateOrderDto, userId));
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Update order status (transactional — deducts stock on Delivered)' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiOkWrapped()
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @GetUser('id') userId: string,
  ) {
    return ok(
      await this.orderService.updateStatus(id, updateOrderStatusDto, userId),
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete order (cannot delete delivered)' })
  @ApiOkWrapped()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.orderService.remove(id, userId));
  }
}
