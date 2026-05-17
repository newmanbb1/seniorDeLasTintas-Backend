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
import { EmployeeService } from "./employee.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { FilterEmployee } from "./dto/filter-employee.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles, GetUser } from "../../common/decorators";
import { UserRole } from "../auth/entities/user.entity";

@ApiTags("employee")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("employee")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Create employee (Admin only)" })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiCreatedWrapped()
  async create(@Body() createEmployeeDto: CreateEmployeeDto, @GetUser('id') userId: string) {
    return ok(await this.employeeService.create(createEmployeeDto, userId));
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "List employees with pagination and filters" })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterEmployee) {
    return ok(await this.employeeService.findAll(filters));
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get employee by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.employeeService.findOne(id));
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update employee" })
  @ApiBody({ type: UpdateEmployeeDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @GetUser('id') userId: string,
  ) {
    return ok(await this.employeeService.update(id, updateEmployeeDto, userId));
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Soft-delete employee" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string, @GetUser('id') userId: string) {
    return ok(await this.employeeService.remove(id, userId));
  }

  @Patch(":id/toggle-active")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Toggle employee active status" })
  @ApiOkWrapped()
  async toggleActive(@Param("id", ParseUUIDPipe) id: string, @GetUser('id') userId: string) {
    return ok(await this.employeeService.toggleActive(id, userId));
  }
}