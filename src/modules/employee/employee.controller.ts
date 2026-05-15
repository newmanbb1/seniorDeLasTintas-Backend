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
import { EmployeeService } from "./employee.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { FilterEmployee } from "./dto/filter-employee.dto";

@ApiTags("employee")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("employee")
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @ApiOperation({ summary: "Create employee" })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiCreatedWrapped()
  async create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return ok(await this.employeeService.create(createEmployeeDto));
  }

  @Get()
  @ApiOperation({ summary: "List employees with pagination and filters" })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterEmployee) {
    return ok(await this.employeeService.findAll(filters));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get employee by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.employeeService.findOne(id));
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update employee" })
  @ApiBody({ type: UpdateEmployeeDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return ok(await this.employeeService.update(id, updateEmployeeDto));
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete employee" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.employeeService.remove(id));
  }

  @Patch(":id/toggle-active")
  @ApiOperation({ summary: "Toggle employee active status" })
  @ApiOkWrapped()
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.employeeService.toggleActive(id));
  }
}