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
import { StockTransferService } from "./stock-transfer.service";
import { CreateStockTransferDto } from "./dto/create-stock-transfer.dto";
import { UpdateStockTransferDto } from "./dto/update-stock-transfer.dto";
import { FilterStockTransfer } from "./dto/filter-stock-transfer.dto";

@ApiTags("stock-transfer")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("stock-transfer")
export class StockTransferController {
  constructor(private readonly stockTransferService: StockTransferService) {}

  @Post()
  @ApiOperation({ summary: "Create stock transfer" })
  @ApiBody({ type: CreateStockTransferDto })
  @ApiCreatedWrapped()
  async create(@Body() createStockTransferDto: CreateStockTransferDto) {
    return ok(await this.stockTransferService.create(createStockTransferDto));
  }

  @Get()
  @ApiOperation({ summary: "List stock transfers with pagination and filters" })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterStockTransfer) {
    return ok(await this.stockTransferService.findAll(filters));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get stock transfer by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.stockTransferService.findOne(id));
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update stock transfer" })
  @ApiBody({ type: UpdateStockTransferDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateStockTransferDto: UpdateStockTransferDto,
  ) {
    return ok(await this.stockTransferService.update(id, updateStockTransferDto));
  }

  @Post(":id/receive")
  @ApiOperation({ summary: "Mark transfer as received" })
  @ApiOkWrapped()
  async receive(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.stockTransferService.receive(id));
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Mark transfer as rejected" })
  @ApiOkWrapped()
  async reject(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.stockTransferService.reject(id));
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete stock transfer" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.stockTransferService.remove(id));
  }
}