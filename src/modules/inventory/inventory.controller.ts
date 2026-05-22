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
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiCreatedWrapped,
  ApiErrorResponseDto,
  ApiOkWrapped,
  ok,
} from "src/common/response";
import { InventoryService, UserContext } from "./inventory.service";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";
import { FilterInventory } from "./dto/filter-inventory.dto";
import { TransferDto } from "./dto/transfer.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles, GetUser } from "../../common/decorators";
import { UserRole } from "../auth/entities/user.entity";

function getUserContext(user: any): UserContext | undefined {
  if (!user) return undefined;
  return {
    userId: user.id,
    role: user.role,
    branch_id: user.branch_id,
  };
}

@ApiTags("inventory")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Create inventory record (Admin o Secretaria)" })
  @ApiBody({ type: CreateInventoryDto })
  @ApiCreatedWrapped()
  async create(@Body() createInventoryDto: CreateInventoryDto, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.inventoryService.create(createInventoryDto, user?.id, userContext));
  }

  @Post('transfer')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: 'Transferir insumo entre sucursales (transacción atómica)' })
  @ApiBody({ type: TransferDto })
  @ApiOkWrapped()
  async transfer(@Body() transferDto: TransferDto, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.inventoryService.transfer(transferDto, user?.id, userContext));
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "List inventory with pagination and filters" })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterInventory, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.inventoryService.findAll(filters, userContext));
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Get inventory by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.inventoryService.findOne(id, userContext));
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Update inventory" })
  @ApiBody({ type: UpdateInventoryDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @GetUser() user: any,
  ) {
    const userContext = getUserContext(user);
    return ok(await this.inventoryService.update(id, updateInventoryDto, user?.id, userContext));
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Soft-delete inventory (Admin only)" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.inventoryService.remove(id, user?.id, userContext));
  }

  @Patch(":id/adjust")
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Adjust inventory quantity" })
  @ApiOkWrapped()
  async adjustQuantity(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("adjustment") adjustment: number,
    @GetUser() user: any,
  ) {
    const userContext = getUserContext(user);
    return ok(await this.inventoryService.adjustQuantity(id, adjustment, user?.id, userContext));
  }
}