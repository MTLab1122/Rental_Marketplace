import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';

const DEFAULT_SETTINGS: Record<
  string,
  { value: any; description: string; isFeatureFlag?: boolean }
> = {
  allow_landlord_registration: {
    value: true,
    description: 'Allow new property owners to sign up and submit listings',
  },
  require_cnic_verification: {
    value: true,
    description: 'Require verified NADRA CNIC before properties can be published',
  },
  max_images_per_property: {
    value: 12,
    description: 'Maximum allowable photos per property listing',
  },
  auto_expire_pending_inquiries_days: {
    value: 7,
    description: 'Number of days before an unanswered inquiry is closed',
  },
  enable_whatsapp_direct: {
    value: true,
    description: 'Enable WhatsApp deep link button for accepted inquiries',
  },
  peshawar_boundary_strict_mode: {
    value: true,
    description: 'Strict point-in-polygon enforcement for all new property coordinates',
  },
  feature_student_mode: {
    value: true,
    description: 'Enable Student-only mode filters, hostels and shared apartments',
    isFeatureFlag: true,
  },
  feature_family_mode: {
    value: true,
    description: 'Enable Family-only mode filters, full houses and independent portions',
    isFeatureFlag: true,
  },
  feature_instant_chat: {
    value: true,
    description: 'Enable real-time Socket.IO chat messaging for verified inquiries',
    isFeatureFlag: true,
  },
  feature_landlord_analytics: {
    value: true,
    description: 'Enable landlord telemetry and quality score computation',
    isFeatureFlag: true,
  },
};

@Injectable()
export class AdminSettingsService {
  private readonly logger = new Logger(AdminSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getSettings() {
    await this.ensureDefaults();
    const records = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return records;
  }

  async getFeatureFlags() {
    await this.ensureDefaults();
    const records = await this.prisma.systemSetting.findMany({
      where: {
        key: { startsWith: 'feature_' },
      },
      orderBy: { key: 'asc' },
    });
    return records;
  }

  async updateSetting(key: string, value: any, adminId: string, description?: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    const updated = await this.prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        description: description || DEFAULT_SETTINGS[key]?.description || '',
        updatedBy: adminId,
      },
      update: {
        value,
        description: description || undefined,
        updatedBy: adminId,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'SYSTEM_SETTING_UPDATED',
      targetType: 'SYSTEM_SETTING',
      targetId: key,
      before: existing ? { value: existing.value } : null,
      after: { value: updated.value },
    });

    this.logger.log(`Admin ${adminId} updated setting ${key} to ${JSON.stringify(value)}`);
    return updated;
  }

  private async ensureDefaults() {
    for (const [key, conf] of Object.entries(DEFAULT_SETTINGS)) {
      const exists = await this.prisma.systemSetting.findUnique({ where: { key } });
      if (!exists) {
        await this.prisma.systemSetting.create({
          data: {
            key,
            value: conf.value,
            description: conf.description,
          },
        });
      }
    }
  }
}
