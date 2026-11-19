import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiServiceImpl } from './ai.service';
import { PiiMaskerUtil } from './pii-masker.util';
import { AiSuggestionStatus, AiSuggestionType } from '@rental-peshawar/shared-types';

@Injectable()
export class ListingQualityService {
  private readonly logger = new Logger(ListingQualityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiServiceImpl,
  ) {}

  /**
   * Generates quality improvement suggestions for a landlord listing.
   * NOTE: Suggestions NEVER modify, publish, or reject property status.
   */
  async generateQualitySuggestions(propertyId: string, landlordId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        images: true,
        amenities: { include: { amenity: true } },
        locality: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    if (property.landlordId !== landlordId) {
      throw new NotFoundException('You do not have permission to inspect this property');
    }

    // Sanitize listing data removing any PII before AI processing
    const sanitized = PiiMaskerUtil.sanitizeListingForAi({
      id: property.id,
      title: property.title,
      description: property.description,
      propertyType: property.propertyType,
      eligibility: property.eligibility,
      monthlyRentPkr: Number(property.monthlyRentPkr),
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqFt: property.areaSqFt ? Number(property.areaSqFt) : null,
      furnishing: property.furnishing,
      localityName: property.locality?.name,
      amenities: property.amenities.map((a) => a.amenity.name),
    });
    sanitized.imagesCount = property.images.length;

    // 1. Get AI quality suggestions
    const aiResults = await this.aiService.analyzeListingQuality(sanitized);

    // 2. Add Price Outlier checks against locality benchmarks
    const localityMedian = await this.getLocalityMedianRent(
      property.localityId,
      property.propertyType,
      property.bedrooms,
    );

    if (localityMedian > 0) {
      const rent = Number(property.monthlyRentPkr);
      if (rent > localityMedian * 2.2) {
        aiResults.push({
          suggestionType: AiSuggestionType.PRICE_OUTLIER,
          title: 'Rent is significantly above locality average',
          message: `The listed rent (PKR ${rent.toLocaleString()}) is more than double the median for ${property.locality.name} (PKR ${localityMedian.toLocaleString()}). High prices can lead to prolonged vacancy.`,
          actionableStep: 'Review nearby comparable listings or consider adjusting to market rate.',
          severity: 'WARNING',
        });
      } else if (rent < localityMedian * 0.4) {
        aiResults.push({
          suggestionType: AiSuggestionType.PRICE_OUTLIER,
          title: 'Rent is unusually below market rate',
          message: `The rent is more than 60% below the locality average. Listings with extremely low rents may trigger automated fraud safety flags.`,
          actionableStep:
            'Ensure monthly rent includes only base rent and excludes security deposit.',
          severity: 'WARNING',
        });
      }
    }

    // 3. Duplicate listing check (image hash or title match from same/other landlord)
    const duplicateMatch = await this.prisma.property.findFirst({
      where: {
        id: { not: property.id },
        title: { equals: property.title, mode: 'insensitive' },
        localityId: property.localityId,
        bedrooms: property.bedrooms,
        status: { notIn: ['DELETED', 'REJECTED'] },
      },
    });

    if (duplicateMatch) {
      aiResults.push({
        suggestionType: AiSuggestionType.DUPLICATE_LISTING,
        title: 'Potential duplicate listing detected',
        message: `An active listing with identical title and specifications exists in ${property.locality.name}.`,
        actionableStep:
          'Verify if this property was previously submitted or update the title with unique unit details.',
        severity: 'CRITICAL',
      });
    }

    // 4. Upsert/Save suggestions in DB without touching property status
    const modelVersion = this.aiService.getModelVersion();
    const createdSuggestions = [];

    for (const item of aiResults) {
      const existing = await this.prisma.listingQualitySuggestion.findFirst({
        where: {
          propertyId: property.id,
          suggestionType: item.suggestionType,
          status: AiSuggestionStatus.PENDING,
        },
      });

      if (!existing) {
        const record = await this.prisma.listingQualitySuggestion.create({
          data: {
            propertyId: property.id,
            suggestionType: item.suggestionType,
            title: item.title,
            message: item.message,
            actionableStep: item.actionableStep,
            status: AiSuggestionStatus.PENDING,
            modelVersion,
            metadata: { severity: item.severity },
          },
        });
        createdSuggestions.push(record);
      } else {
        createdSuggestions.push(existing);
      }
    }

    this.logger.log(
      `[Quality Assistant] Evaluated property ${property.id}: ${createdSuggestions.length} suggestions generated. Property status remains ${property.status}.`,
    );

    return {
      propertyId: property.id,
      propertyStatus: property.status, // Verify status remains untouched
      suggestionsCount: createdSuggestions.length,
      suggestions: createdSuggestions,
      modelVersion,
    };
  }

  /**
   * Retrieves active quality suggestions for a landlord's property.
   */
  async getQualitySuggestions(propertyId: string, landlordId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, landlordId: true, status: true },
    });

    if (!property || property.landlordId !== landlordId) {
      throw new NotFoundException('Property not found or access denied');
    }

    const suggestions = await this.prisma.listingQualitySuggestion.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      propertyId,
      status: property.status,
      suggestions,
    };
  }

  /**
   * Allows landlord to accept or dismiss a suggestion.
   */
  async updateSuggestionStatus(
    suggestionId: string,
    status: AiSuggestionStatus,
    landlordId: string,
  ) {
    const suggestion = await this.prisma.listingQualitySuggestion.findUnique({
      where: { id: suggestionId },
      include: { property: true },
    });

    if (!suggestion || suggestion.property.landlordId !== landlordId) {
      throw new NotFoundException('Suggestion not found or access denied');
    }

    const updated = await this.prisma.listingQualitySuggestion.update({
      where: { id: suggestionId },
      data: { status },
    });

    return updated;
  }

  private async getLocalityMedianRent(
    localityId: string,
    propertyType: string,
    bedrooms: number,
  ): Promise<number> {
    const insight = await this.prisma.localityPricingInsight.findUnique({
      where: {
        localityId_propertyType_bedrooms: {
          localityId,
          propertyType,
          bedrooms,
        },
      },
    });

    if (insight && Number(insight.medianRentPkr) > 0) {
      return Number(insight.medianRentPkr);
    }

    // Fallback query across approved active properties
    const properties = await this.prisma.property.findMany({
      where: {
        localityId,
        propertyType: propertyType as any,
        bedrooms,
        status: 'APPROVED',
        isAvailable: true,
      },
      select: { monthlyRentPkr: true },
    });

    if (properties.length === 0) return 0;

    const rents = properties.map((p) => Number(p.monthlyRentPkr)).sort((a, b) => a - b);
    const mid = Math.floor(rents.length / 2);
    const valMid = rents[mid] ?? 0;
    const valPrev = rents[mid - 1] ?? valMid;
    return rents.length % 2 !== 0 ? valMid : (valPrev + valMid) / 2;
  }
}
