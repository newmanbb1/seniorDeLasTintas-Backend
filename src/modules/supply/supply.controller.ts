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
import { SupplyService } from "./supply.service";
import { CreateSupplyDto } from "./dto/create-supply.dto";
import { UpdateSupplyDto } from "./dto/update-supply.dto";
import { FilterSupply } from "./dto/filter-supply.dto";

@ApiTags("supply")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("supply")
export class SupplyController {
  constructor(private readonly supplyService: SupplyService) {}

  @Post()
  @ApiOperation({ summary: "Create supply" })
  @ApiBody({ type: CreateSupplyDto })
  @ApiCreatedWrapped()
  async create(@Body() createSupplyDto: CreateSupplyDto) {
    return ok(await this.supplyService.create(createSupplyDto));
  }

  @Get()
  @ApiOperation({ summary: "List supplies with pagination and filters" })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterSupply) {
    return ok(await this.supplyService.findAll(filters));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get supply by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.supplyService.findOne(id));
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update supply" })
  @ApiBody({ type: UpdateSupplyDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateSupplyDto: UpdateSupplyDto,
  ) {
    return ok(await this.supplyService.update(id, updateSupplyDto));
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete supply" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.supplyService.remove(id));
  }
}