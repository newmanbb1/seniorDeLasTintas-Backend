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
import { EmployeeService, UserContext } from "./employee.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { FilterEmployee } from "./dto/filter-employee.dto";
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

@ApiTags("employee")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("employee")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Create employee (Admin o Secretaria)" })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiCreatedWrapped()
  async create(@Body() createEmployeeDto: CreateEmployeeDto, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.employeeService.create(createEmployeeDto, user?.id, userContext));
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "List employees with pagination and filters" })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterEmployee, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.employeeService.findAll(filters, userContext));
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Get employee by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.employeeService.findOne(id, userContext));
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Update employee" })
  @ApiBody({ type: UpdateEmployeeDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @GetUser() user: any,
  ) {
    const userContext = getUserContext(user);
    return ok(await this.employeeService.update(id, updateEmployeeDto, user?.id, userContext));
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Soft-delete employee (Admin only)" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.employeeService.remove(id, user?.id, userContext));
  }

  @Patch(":id/toggle-active")
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Toggle employee active status" })
  @ApiOkWrapped()
  async toggleActive(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.employeeService.toggleActive(id, user?.id, userContext));
  }
}