import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class CityDistancePairDto {
  @IsUUID()
  fromCityId: string;

  @IsUUID()
  toCityId: string;
}

export class CityDistancePairsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CityDistancePairDto)
  pairs: CityDistancePairDto[];
}
