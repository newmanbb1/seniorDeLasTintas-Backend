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
import { StockTransferService } from "./stock-transfer.service";
import { CreateStockTransferDto } from "./dto/create-stock-transfer.dto";
import { UpdateStockTransferDto } from "./dto/update-stock-transfer.dto";
import { FilterStockTransfer } from "./dto/filter-stock-transfer.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles, GetUser } from "../../common/decorators";
import { UserRole } from "../auth/entities/user.entity";

@ApiTags("stock-transfer")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("stock-transfer")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StockTransferController {
  constructor(private readonly stockTransferService: StockTransferService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Create stock transfer" })
  @ApiBody({ type: CreateStockTransferDto })
  @ApiCreatedWrapped()
  async create(@Body() createStockTransferDto: CreateStockTransferDto, @GetUser('id') userId: string, @GetUser() user: any) {
    const userContext = user ? {
      userId: user.sub || user.id,
      role: user.role,
      branch_id: user.branch_id,
    } : undefined;
    return ok(await this.stockTransferService.create(createStockTransferDto, userId, userContext));
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "List stock transfers with pagination and filters" })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterStockTransfer, @GetUser() user: any) {
    const userContext = user ? {
      userId: user.sub || user.id,
      role: user.role,
      branch_id: user.branch_id,
    } : undefined;
    return ok(await this.stockTransferService.findAll(filters, userContext));
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Get stock transfer by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: any) {
    const userContext = user ? {
      userId: user.sub || user.id,
      role: user.role,
      branch_id: user.branch_id,
    } : undefined;
    return ok(await this.stockTransferService.findOne(id, userContext));
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update stock transfer" })
  @ApiBody({ type: UpdateStockTransferDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateStockTransferDto: UpdateStockTransferDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.stockTransferService.update(id, updateStockTransferDto, userId));
  }

  @Post(":id/receive")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Mark transfer as received" })
  @ApiOkWrapped()
  async receive(@Param("id", ParseUUIDPipe) id: string, @GetUser('id') userId: string) {
    return ok(await this.stockTransferService.receive(id, userId));
  }

  @Post(":id/reject")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Mark transfer as rejected" })
  @ApiOkWrapped()
  async reject(@Param("id", ParseUUIDPipe) id: string, @GetUser('id') userId: string) {
    return ok(await this.stockTransferService.reject(id, userId));
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Soft-delete stock transfer" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string, @GetUser('id') userId: string) {
    return ok(await this.stockTransferService.remove(id, userId));
  }
}