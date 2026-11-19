import { AiSuggestionType, ContentModerationFlag } from '@rental-peshawar/shared-types';

export interface QualitySuggestionResult {
  suggestionType: AiSuggestionType;
  title: string;
  message: string;
  actionableStep?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  metadata?: Record<string, any>;
}

export interface TextModerationResult {
  flagged: boolean;
  flags: ContentModerationFlag[];
  confidence: number;
  reason?: string;
  suggestedAction: 'APPROVED' | 'FLAGGED' | 'BLOCKED' | 'REQUIRES_HUMAN_REVIEW';
}

export interface ImageModerationResult {
  flagged: boolean;
  flags: ContentModerationFlag[];
  confidence: number;
  reason?: string;
  isLowQuality: boolean;
  suggestedAction: 'APPROVED' | 'FLAGGED' | 'BLOCKED' | 'REQUIRES_HUMAN_REVIEW';
}

export interface AiService {
  /**
   * Generates a normalized semantic embedding vector for a given text.
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Analyzes property listing details and returns actionable suggestions.
   */
  analyzeListingQuality(sanitizedListing: Record<string, any>): Promise<QualitySuggestionResult[]>;

  /**
   * Moderates user-generated text for safety violations, scraping, and hate speech.
   */
  moderateText(text: string): Promise<TextModerationResult>;

  /**
   * Moderates property or profile images for safety and quality.
   */
  moderateImage(imageUrl: string): Promise<ImageModerationResult>;

  /**
   * Returns current active model descriptor/version.
   */
  getModelVersion(): string;

  /**
   * Returns true if external AI provider is enabled and active.
   */
  isAiEnabled(): boolean;
}
