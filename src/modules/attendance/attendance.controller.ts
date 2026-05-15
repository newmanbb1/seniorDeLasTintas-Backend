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
import { AttendanceService } from "./attendance.service";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";
import { FilterAttendance } from "./dto/filter-attendance.dto";
import { CheckOutDto } from "./dto/check-out.dto";

@ApiTags("attendance")
@ApiBadRequestResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post("check-in")
  @ApiOperation({ summary: "Registrar hora de entrada del empleado" })
  @ApiBody({ type: CreateAttendanceDto })
  @ApiCreatedWrapped()
  async checkIn(@Body() createAttendanceDto: CreateAttendanceDto) {
    return ok(await this.attendanceService.checkIn(createAttendanceDto));
  }

  @Post("check-out")
  @ApiOperation({ summary: "Registrar hora de salida del empleado" })
  @ApiBody({ type: CheckOutDto })
  @ApiOkWrapped()
  async checkOut(@Body() checkOutDto: CheckOutDto) {
    return ok(await this.attendanceService.checkOut(checkOutDto));
  }

  @Get()
  @ApiOperation({ summary: "List attendance records with pagination and filters" })
  @ApiOkWrapped()
  async findAll(@Query() filters: FilterAttendance) {
    return ok(await this.attendanceService.findAll(filters));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get attendance record by id" })
  @ApiOkWrapped()
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.attendanceService.findOne(id));
  }

  @Get("report/employee/:employee_id")
  @ApiOperation({ summary: "Get attendance report by employee" })
  @ApiOkWrapped()
  async getReportByEmployee(
    @Param("employee_id", ParseUUIDPipe) employee_id: string,
    @Query("start_date") startDate?: string,
    @Query("end_date") endDate?: string,
  ) {
    return ok(
      await this.attendanceService.getReportByEmployee(employee_id, startDate, endDate),
    );
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update attendance record (admin)" })
  @ApiBody({ type: UpdateAttendanceDto })
  @ApiOkWrapped()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return ok(await this.attendanceService.update(id, updateAttendanceDto));
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete attendance record" })
  @ApiOkWrapped()
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return ok(await this.attendanceService.remove(id));
  }
}