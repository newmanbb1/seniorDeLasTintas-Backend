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
import { BranchService } from "./branch.service";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";
import { FilterBranch } from "./dto/fiter-branch.dto";

@ApiTags("branch")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("branch")
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @ApiOperation({ summary: "Create branch" })
  @ApiBody({ type: CreateBranchDto })
  @ApiCreatedWrapped()
  async create(@Body() createBranchDto: CreateBranchDto) {
    return ok(await this.branchService.create(createBranchDto));
  }

  @Get()
  @ApiOperation({ summary: "List branches" })
  @ApiOkWrapped()
  async findAll(@Query() filters:FilterBranch) {
    return ok(await this.branchService.findAll(filters));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get branch by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.branchService.findOne(id));
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update branch" })
  @ApiBody({ type: UpdateBranchDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return ok(await this.branchService.update(id, updateBranchDto));
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete branch" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.branchService.remove(id));
  }
}
