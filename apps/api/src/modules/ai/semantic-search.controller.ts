import { Controller, Get, Query } from '@nestjs/common';
import { SemanticSearchService } from './semantic-search.service';
import { PropertyEligibility, PropertyType } from '@rental-peshawar/shared-types';

@Controller('search')
export class SemanticSearchController {
  constructor(private readonly semanticSearchService: SemanticSearchService) {}

  @Get('semantic')
  async search(
    @Query('query') query: string = '',
    @Query('eligibility') eligibility?: PropertyEligibility,
    @Query('localityId') localityId?: string,
    @Query('propertyType') propertyType?: PropertyType,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const results = await this.semanticSearchService.searchSemantic({
      query: query || 'residential rental in Peshawar',
      eligibility,
      localityId,
      propertyType,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });

    return {
      success: true,
      data: results,
    };
  }
}
