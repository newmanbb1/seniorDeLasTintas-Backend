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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FilterCustomer } from './dto/filter-customer.dto';
import { FilterCustomerOrders } from './dto/filter-customer-orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, GetUser } from '../../common/decorators';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('customer')
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Create customer' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiCreatedWrapped()
  async create(
    @Body() dto: CreateCustomerDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.customerService.create(dto, userId));
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'List customers with pagination and filters' })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterCustomer) {
    return ok(await this.customerService.findAll(filters));
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Get customer by id' })
  @ApiOkWrapped()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.customerService.findOne(id));
  }

  @Get(':id/orders')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Get order history by customer' })
  @ApiOkWrapped()
  async findOrders(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filters: FilterCustomerOrders,
  ) {
    return ok(await this.customerService.findOrders(id, filters));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Update customer' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiOkWrapped()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.customerService.update(id, dto, userId));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete customer' })
  @ApiOkWrapped()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.customerService.remove(id, userId));
  }
}
