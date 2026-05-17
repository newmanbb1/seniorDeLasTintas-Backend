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
import { InventoryService } from "./inventory.service";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";
import { FilterInventory } from "./dto/filter-inventory.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles, GetUser } from "../../common/decorators";
import { UserRole } from "../auth/entities/user.entity";

@ApiTags("inventory")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Create inventory record (Admin only)" })
  @ApiBody({ type: CreateInventoryDto })
  @ApiCreatedWrapped()
  async create(@Body() createInventoryDto: CreateInventoryDto, @GetUser('id') userId: string) {
    return ok(await this.inventoryService.create(createInventoryDto, userId));
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "List inventory with pagination and filters" })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterInventory) {
    return ok(await this.inventoryService.findAll(filters));
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get inventory by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.inventoryService.findOne(id));
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update inventory" })
  @ApiBody({ type: UpdateInventoryDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.inventoryService.update(id, updateInventoryDto, userId));
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Soft-delete inventory" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string, @GetUser('id') userId: string) {
    return ok(await this.inventoryService.remove(id, userId));
  }

  @Patch(":id/adjust")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Adjust inventory quantity" })
  @ApiOkWrapped()
  async adjustQuantity(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("adjustment") adjustment: number,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.inventoryService.adjustQuantity(id, adjustment, userId));
  }
}