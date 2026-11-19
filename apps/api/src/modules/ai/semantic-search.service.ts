import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiServiceImpl } from './ai.service';
import { PiiMaskerUtil } from './pii-masker.util';
import { PropertyEligibility, PropertyType, PropertyStatus } from '@rental-peshawar/shared-types';

export interface SemanticSearchOptions {
  query: string;
  eligibility?: PropertyEligibility;
  localityId?: string;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  limit?: number;
  offset?: number;
}

@Injectable()
export class SemanticSearchService {
  // Municipal boundary bounding box for Peshawar, Pakistan
  private readonly PESHAWAR_BOUNDS = {
    minLat: 33.85,
    maxLat: 34.15,
    minLng: 71.4,
    maxLng: 71.75,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiServiceImpl,
  ) {}

  /**
   * Generates or refreshes embedding for a property.
   */
  async indexPropertyEmbedding(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        locality: true,
        amenities: { include: { amenity: true } },
      },
    });

    if (!property) return null;

    const amenityNames = property.amenities.map((a) => a.amenity.name).join(', ');
    const corpus = `
      Title: ${property.title}.
      Locality: ${property.locality?.name || 'Peshawar'}.
      Property Type: ${property.propertyType}.
      Eligibility: ${property.eligibility}.
      Bedrooms: ${property.bedrooms}. Bathrooms: ${property.bathrooms}.
      Rent: PKR ${Number(property.monthlyRentPkr)}.
      Amenities: ${amenityNames}.
      Description: ${PiiMaskerUtil.maskText(property.description)}.
    `.trim();

    const vector = await this.aiService.generateEmbedding(corpus);
    const modelVersion = this.aiService.getModelVersion();

    const record = await this.prisma.propertyEmbedding.upsert({
      where: { propertyId },
      create: {
        propertyId,
        embedding: vector,
        dimensions: vector.length,
        modelVersion,
      },
      update: {
        embedding: vector,
        dimensions: vector.length,
        modelVersion,
      },
    });

    return record;
  }

  /**
   * Hybrid Search: Filters strictly by spatial boundary, active locality,
   * approved status, availability, and eligibility, then ranks via cosine similarity.
   */
  async searchSemantic(options: SemanticSearchOptions) {
    const {
      query,
      eligibility,
      localityId,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      limit = 20,
      offset = 0,
    } = options;

    // 1. Generate query embedding vector
    const queryVector = await this.aiService.generateEmbedding(query);

    // 2. Strict SQL / Prisma Structured Filter
    const where: any = {
      status: PropertyStatus.APPROVED,
      isAvailable: true,
      locality: { isActive: true },
      // Strict Peshawar municipal boundary guard
      latitude: {
        gte: this.PESHAWAR_BOUNDS.minLat,
        lte: this.PESHAWAR_BOUNDS.maxLat,
      },
      longitude: {
        gte: this.PESHAWAR_BOUNDS.minLng,
        lte: this.PESHAWAR_BOUNDS.maxLng,
      },
    };

    if (eligibility) {
      where.eligibility = eligibility;
    }
    if (localityId) {
      where.localityId = localityId;
    }
    if (propertyType) {
      where.propertyType = propertyType;
    }
    if (bedrooms !== undefined && bedrooms > 0) {
      where.bedrooms = bedrooms;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.monthlyRentPkr = {};
      if (minPrice !== undefined) where.monthlyRentPkr.gte = minPrice;
      if (maxPrice !== undefined) where.monthlyRentPkr.lte = maxPrice;
    }

    // Fetch candidate properties with their embeddings
    const candidateProperties = await this.prisma.property.findMany({
      where,
      include: {
        locality: true,
        images: { take: 5 },
        amenities: { include: { amenity: true } },
        embedding: true,
      },
      take: Math.max(limit * 3, 60), // Candidate pool for semantic re-ranking
    });

    const queryTokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // 3. Score candidates with Hybrid Similarity (Vector Cosine + Term Boost + Recency)
    const scoredResults = candidateProperties.map((prop) => {
      let vectorScore = 0.5;
      if (prop.embedding && Array.isArray(prop.embedding.embedding)) {
        vectorScore = this.cosineSimilarity(queryVector, prop.embedding.embedding as number[]);
      }

      // Keyword / Locality / Price match indicators
      const titleLower = prop.title.toLowerCase();
      const descLower = prop.description.toLowerCase();
      const locLower = prop.locality?.name?.toLowerCase() || '';
      const amenityNames = prop.amenities.map((a) => a.amenity.name.toLowerCase());

      const localityMatch = locLower ? queryTokens.some((t) => locLower.includes(t)) : false;
      const amenityMatch = queryTokens.some((t) => amenityNames.some((a) => a.includes(t)));
      const titleMatch = queryTokens.some((t) => titleLower.includes(t));
      const descMatch = queryTokens.some((t) => descLower.includes(t));

      // New listing boost (< 7 days old)
      const ageDays = (Date.now() - new Date(prop.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const newListingBoost = ageDays <= 7;

      // Price match logic
      let priceMatch = true;
      if (maxPrice && Number(prop.monthlyRentPkr) > maxPrice) priceMatch = false;

      // Composite relevance score: 60% semantic vector, 20% locality, 10% keyword, 10% recency
      let compositeScore = vectorScore * 0.6;
      if (localityMatch) compositeScore += 0.2;
      if (titleMatch || descMatch) compositeScore += 0.1;
      if (amenityMatch) compositeScore += 0.05;
      if (newListingBoost) compositeScore += 0.05;

      const explanations: string[] = [];
      if (vectorScore > 0.65) explanations.push('Strong semantic match to your requirements');
      if (localityMatch) explanations.push(`Located in ${prop.locality?.name}`);
      if (amenityMatch) explanations.push('Features requested amenities');
      if (newListingBoost) explanations.push('Recently listed in Peshawar');

      return {
        property: {
          id: prop.id,
          title: prop.title,
          slug: prop.slug,
          description: prop.description,
          localityId: prop.localityId,
          localityName: prop.locality?.name,
          locality: prop.locality,
          eligibility: prop.eligibility,
          propertyType: prop.propertyType,
          status: prop.status,
          monthlyRentPkr: Number(prop.monthlyRentPkr),
          securityDepositPkr: Number(prop.securityDepositPkr),
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          areaSqFt: prop.areaSqFt ? Number(prop.areaSqFt) : null,
          furnishing: prop.furnishing,
          coordinates: {
            latitude: Number(prop.latitude),
            longitude: Number(prop.longitude),
          },
          addressNote: prop.addressNote,
          address: prop.address,
          isAvailable: prop.isAvailable,
          images: prop.images.map((img) => ({
            id: img.id,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            isPrimary: img.isPrimary,
          })),
          amenities: prop.amenities.map((a) => ({
            id: a.amenity.id,
            name: a.amenity.name,
            icon: a.amenity.icon,
          })),
          createdAt: prop.createdAt.toISOString(),
        },
        relevanceScore: Number(compositeScore.toFixed(4)),
        matchExplanation: {
          semanticMatch: vectorScore > 0.6,
          localityMatch,
          priceMatch,
          amenityMatch,
          newListingBoost,
          explanationText:
            explanations.length > 0
              ? explanations.join(' • ')
              : 'Matched Peshawar rental inventory criteria',
        },
      };
    });

    // 4. Sort by composite relevance score descending
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const paginated = scoredResults.slice(offset, offset + limit);

    return {
      query,
      totalMatches: scoredResults.length,
      returned: paginated.length,
      limit,
      offset,
      results: paginated,
    };
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0.5;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const valA = vecA[i] ?? 0;
      const valB = vecB[i] ?? 0;
      dot += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }

    if (normA === 0 || normB === 0) return 0.5;
    const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, similarity));
  }
}
