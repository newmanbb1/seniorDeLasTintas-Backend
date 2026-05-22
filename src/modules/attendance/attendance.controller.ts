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
import { AttendanceService, UserContext } from "./attendance.service";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";
import { FilterAttendance } from "./dto/filter-attendance.dto";
import { CheckOutDto } from "./dto/check-out.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles, GetUser } from "../../common/decorators";
import { UserRole } from "../auth/entities/user.entity";
import { AllowAnonymous } from "../../common/guards/allow-anon.decorator";

function getUserContext(user: any): UserContext | undefined {
  if (!user) return undefined;
  return {
    userId: user.id,
    role: user.role,
    branch_id: user.branch_id,
  };
}

@ApiTags("attendance")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post("check-in")
  @AllowAnonymous()
  @ApiOperation({ summary: "Registrar hora de entrada del empleado (PIN)" })
  @ApiBody({ type: CreateAttendanceDto })
  @ApiCreatedWrapped()
  async checkIn(@Body() createAttendanceDto: CreateAttendanceDto) {
    return ok(await this.attendanceService.checkIn(createAttendanceDto));
  }

  @Post("check-out")
  @AllowAnonymous()
  @ApiOperation({ summary: "Registrar hora de salida del empleado (PIN)" })
  @ApiBody({ type: CheckOutDto })
  @ApiOkWrapped()
  async checkOut(@Body() checkOutDto: CheckOutDto) {
    return ok(await this.attendanceService.checkOut(checkOutDto));
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "List attendance records with pagination and filters" })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterAttendance, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.attendanceService.findAll(filters, userContext));
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Get attendance record by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.attendanceService.findOne(id, userContext));
  }

  @Get("report/employee/:employee_id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiOperation({ summary: "Get attendance report by employee" })
  @ApiOkWrapped()
  async getReportByEmployee(
    @GetUser() user: any,
    @Param("employee_id", ParseUUIDPipe) employee_id: string,
    @Query("start_date") startDate?: string,
    @Query("end_date") endDate?: string,
  ) {
    const userContext = getUserContext(user);
    return ok(
      await this.attendanceService.getReportByEmployee(employee_id, startDate, endDate, userContext),
    );
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update attendance record (admin)" })
  @ApiBody({ type: UpdateAttendanceDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @GetUser() user: any,
  ) {
    const userContext = getUserContext(user);
    return ok(await this.attendanceService.update(id, updateAttendanceDto, user?.id, userContext));
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Soft-delete attendance record" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: any) {
    const userContext = getUserContext(user);
    return ok(await this.attendanceService.remove(id, user?.id, userContext));
  }
}