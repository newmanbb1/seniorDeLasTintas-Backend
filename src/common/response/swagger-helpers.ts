import { ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";
import { ApiSuccessResponseDto } from "./api-response.dto";

export function ApiOkWrapped(description?: string) {
  return ApiOkResponse({
    type: ApiSuccessResponseDto,
    description: description ?? "Standard success envelope: { success, data?, message? }",
  });
}

export function ApiCreatedWrapped(description?: string) {
  return ApiCreatedResponse({
    type: ApiSuccessResponseDto,
    description: description ?? "Standard success envelope: { success, data?, message? }",
  });
}
