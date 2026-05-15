import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateBranchDto {
  @ApiProperty({ example: "Central", maxLength: 255 })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: "Av. Principal 123, Ciudad",
    description: "Physical address",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  address: string;

  @ApiProperty({
    example: "Mon–Fri 9:00–18:00, Sat 9:00–13:00",
    description: "Opening hours text for clients / chatbot",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  opening_hours: string;

  @ApiProperty({
    example: "https://maps.google.com/?q=...",
    description: "Google Maps (or other) location URL",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  location_link: string;
}
