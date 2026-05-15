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
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
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

@ApiTags("inventory")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: "Create inventory record" })
  @ApiBody({ type: CreateInventoryDto })
  @ApiCreatedWrapped()
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    return ok(await this.inventoryService.create(createInventoryDto));
  }

  @Get()
  @ApiOperation({ summary: "List inventory with pagination and filters" })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterInventory) {
    return ok(await this.inventoryService.findAll(filters));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get inventory by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.inventoryService.findOne(id));
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update inventory" })
  @ApiBody({ type: UpdateInventoryDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return ok(await this.inventoryService.update(id, updateInventoryDto));
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete inventory" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.inventoryService.remove(id));
  }

  @Patch(":id/adjust")
  @ApiOperation({ summary: "Adjust inventory quantity" })
  @ApiOkWrapped()
  async adjustQuantity(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("adjustment") adjustment: number,
  ) {
    return ok(await this.inventoryService.adjustQuantity(id, adjustment));
  }
}