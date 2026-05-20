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
import { BranchService } from "./branch.service";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";
import { FilterBranch } from "./dto/fiter-branch.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles, GetUser } from "../../common/decorators";
import { UserRole } from "../auth/entities/user.entity";

@ApiTags("branch")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("branch")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Create branch (Admin only)" })
  @ApiBody({ type: CreateBranchDto })
  @ApiCreatedWrapped()
  async create(@Body() createBranchDto: CreateBranchDto, @GetUser('id') userId: string) {
    return ok(await this.branchService.create(createBranchDto, userId));
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "List branches" })
  @ApiOkWrapped()
  async findAll(@Query() filters:FilterBranch, @GetUser() user: any) {
    const userContext = user ? {
      userId: user.sub || user.id,
      role: user.role,
      branch_id: user.branch_id,
    } : undefined;
    return ok(await this.branchService.findAll(filters, userContext));
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Get branch by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: any) {
    const userContext = user ? {
      userId: user.sub || user.id,
      role: user.role,
      branch_id: user.branch_id,
    } : undefined;
    return ok(await this.branchService.findOne(id, userContext));
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update branch" })
  @ApiBody({ type: UpdateBranchDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.branchService.update(id, updateBranchDto, userId));
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Soft-delete branch" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string, @GetUser('id') userId: string) {
    return ok(await this.branchService.remove(id, userId));
  }
}
