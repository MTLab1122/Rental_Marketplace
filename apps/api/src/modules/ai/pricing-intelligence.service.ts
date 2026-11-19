import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PriceContextIndicator } from '@rental-peshawar/shared-types';

@Injectable()
export class PricingIntelligenceService {
  private readonly logger = new Logger(PricingIntelligenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates pricing intelligence and context for a property.
   * STRICT RULE: Uses only real, approved, active listings for market benchmarks.
   */
  async getPropertyPriceInsights(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { locality: true },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    const currentRent = Number(property.monthlyRentPkr);

    // 1. Query comparable approved active listings in the same locality
    const comparables = await this.prisma.property.findMany({
      where: {
        localityId: property.localityId,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        status: 'APPROVED',
        isAvailable: true,
      },
      select: { monthlyRentPkr: true },
    });

    const rents = comparables.map((c) => Number(c.monthlyRentPkr)).sort((a, b) => a - b);
    const sampleCount = rents.length;

    let medianRent = currentRent;
    let percentile25 = Math.round(currentRent * 0.85);
    let percentile75 = Math.round(currentRent * 1.15);

    if (sampleCount > 0) {
      const mid = Math.floor(sampleCount / 2);
      const valMid = rents[mid] ?? currentRent;
      const valPrev = rents[mid - 1] ?? valMid;
      medianRent = sampleCount % 2 !== 0 ? valMid : Math.round((valPrev + valMid) / 2);

      const idx25 = Math.floor(sampleCount * 0.25);
      const idx75 = Math.floor(sampleCount * 0.75);
      percentile25 = rents[idx25] ?? medianRent;
      percentile75 = rents[idx75] ?? medianRent;
    }

    // Determine tenant price context indicator
    let priceContext: PriceContextIndicator = PriceContextIndicator.AROUND_MARKET;
    if (currentRent < medianRent * 0.85) {
      priceContext = PriceContextIndicator.BELOW_MARKET;
    } else if (currentRent > medianRent * 1.15) {
      priceContext = PriceContextIndicator.ABOVE_MARKET;
    }

    // Recommended competitive rent window
    const recommendedMinRent = percentile25;
    const recommendedMaxRent = percentile75;

    // Cache / update the locality benchmark insight snapshot
    if (sampleCount >= 2) {
      await this.prisma.localityPricingInsight.upsert({
        where: {
          localityId_propertyType_bedrooms: {
            localityId: property.localityId,
            propertyType: property.propertyType,
            bedrooms: property.bedrooms,
          },
        },
        create: {
          localityId: property.localityId,
          propertyType: property.propertyType,
          bedrooms: property.bedrooms,
          medianRentPkr: medianRent,
          percentile25Pkr: percentile25,
          percentile75Pkr: percentile75,
          sampleCount,
          calculatedAt: new Date(),
        },
        update: {
          medianRentPkr: medianRent,
          percentile25Pkr: percentile25,
          percentile75Pkr: percentile75,
          sampleCount,
          calculatedAt: new Date(),
        },
      });
    }

    return {
      propertyId: property.id,
      localityId: property.localityId,
      localityName: property.locality?.name || 'Peshawar',
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      currentRentPkr: currentRent,
      medianRentPkr: medianRent,
      percentile25Pkr: percentile25,
      percentile75Pkr: percentile75,
      recommendedMinRentPkr: recommendedMinRent,
      recommendedMaxRentPkr: recommendedMaxRent,
      priceContext,
      sampleCount,
      disclaimer:
        'DISCLAIMER: Pricing insights are calculated from approved active marketplace listings in Peshawar. Estimates are informational and do not constitute a guaranteed rental agreement or price cap.',
    };
  }

  /**
   * Refreshes pricing intelligence across all active Peshawar localities.
   * Can be triggered daily via BullMQ background jobs.
   */
  async refreshAllLocalityBenchmarks() {
    const activeProperties = await this.prisma.property.findMany({
      where: {
        status: 'APPROVED',
        isAvailable: true,
      },
      select: {
        localityId: true,
        propertyType: true,
        bedrooms: true,
        monthlyRentPkr: true,
      },
    });

    // Group by localityId + propertyType + bedrooms
    const grouped = new Map<string, number[]>();
    for (const p of activeProperties) {
      const key = `${p.localityId}::${p.propertyType}::${p.bedrooms}`;
      const arr = grouped.get(key) || [];
      arr.push(Number(p.monthlyRentPkr));
      grouped.set(key, arr);
    }

    let updatedCount = 0;
    for (const [key, rents] of grouped.entries()) {
      const parts = key.split('::');
      const localityId = parts[0];
      const propertyType = parts[1];
      const bedStr = parts[2];
      if (!localityId || !propertyType || !bedStr) continue;
      const bedrooms = Number(bedStr);
      rents.sort((a, b) => a - b);
      const count = rents.length;
      if (count === 0) continue;

      const mid = Math.floor(count / 2);
      const valMid = rents[mid] ?? 0;
      const valPrev = rents[mid - 1] ?? valMid;
      const median = count % 2 !== 0 ? valMid : Math.round((valPrev + valMid) / 2);
      const p25 = rents[Math.floor(count * 0.25)] ?? median;
      const p75 = rents[Math.floor(count * 0.75)] ?? median;

      await this.prisma.localityPricingInsight.upsert({
        where: {
          localityId_propertyType_bedrooms: {
            localityId,
            propertyType,
            bedrooms,
          },
        },
        create: {
          localityId,
          propertyType,
          bedrooms,
          medianRentPkr: median,
          percentile25Pkr: p25,
          percentile75Pkr: p75,
          sampleCount: count,
          calculatedAt: new Date(),
        },
        update: {
          medianRentPkr: median,
          percentile25Pkr: p25,
          percentile75Pkr: p75,
          sampleCount: count,
          calculatedAt: new Date(),
        },
      });
      updatedCount++;
    }

    this.logger.log(
      `[Pricing Intelligence] Refreshed benchmarks for ${updatedCount} locality-property partitions.`,
    );
    return { updatedCount };
  }
}
