import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RateLimiterService } from '../../common/guards/rate-limiter.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  RegisterRequestDto,
  LoginRequestDto,
  RefreshRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  UpdateProfileRequestDto,
} from './dto/auth.dto';
import { AuthResponseData, UserProfileDto } from '@rental-peshawar/shared-types';
import { JwtPayload } from './token.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env['NODE_ENV'] === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 mins
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/v1/auth',
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new tenant or landlord account' })
  @SwaggerResponse({ status: 201, description: 'User registered successfully' })
  @SwaggerResponse({ status: 400, description: 'Validation failed or missing eligibility' })
  @SwaggerResponse({ status: 409, description: 'Email or phone number already in use' })
  @SwaggerResponse({ status: 429, description: 'Registration rate limit exceeded' })
  async register(
    @Body() dto: RegisterRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseData> {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    // Rate Limit: 3 attempts per hour per IP
    await this.rateLimiter.enforceRateLimit(
      'register:ip',
      ip,
      3,
      3600,
      'Registration rate limit exceeded. You can register at most 3 accounts per hour.',
    );

    const result = await this.authService.register(dto, ip, userAgent);
    this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email/phone and password' })
  @SwaggerResponse({ status: 200, description: 'User authenticated successfully' })
  @SwaggerResponse({ status: 401, description: 'Invalid credentials or account locked' })
  @SwaggerResponse({ status: 429, description: 'Login rate limit exceeded' })
  async login(
    @Body() dto: LoginRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseData> {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    // Rate Limit: 5 attempts per 15 minutes per IP and identifier
    const identifierKey = `${ip}:${dto.emailOrPhone.trim().toLowerCase()}`;
    await this.rateLimiter.enforceRateLimit(
      'login:identifier',
      identifierKey,
      5,
      900,
      'Too many failed login attempts. Please try again in 15 minutes.',
    );

    const result = await this.authService.login(dto, ip, userAgent);
    this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @SwaggerResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @SwaggerResponse({ status: 401, description: 'Invalid, expired, or reused refresh token' })
  async refresh(
    @Body() dto: RefreshRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseData> {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    // Extract refresh token from body or cookie
    const token = dto.refreshToken || req.cookies?.['refreshToken'];
    if (!token) {
      throw new UnauthorizedException('Refresh token is required in body or cookie.');
    }

    // Rate Limit: 30 requests per 15 minutes per IP
    await this.rateLimiter.enforceRateLimit(
      'refresh:ip',
      ip,
      30,
      900,
      'Refresh rate limit exceeded.',
    );

    const result = await this.authService.refresh(token, dto.deviceId, ip, userAgent);
    this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out and invalidate current refresh token' })
  @SwaggerResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Body() dto: RefreshRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];
    const token = dto.refreshToken || req.cookies?.['refreshToken'];

    const user = (req as any).user as JwtPayload | undefined;
    await this.authService.logout(token, user?.sub, ip, userAgent);
    this.clearAuthCookies(res);

    return { message: 'Logged out successfully.' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset token link' })
  @SwaggerResponse({ status: 200, description: 'Password reset dispatched' })
  @SwaggerResponse({ status: 429, description: 'Reset rate limit exceeded' })
  async forgotPassword(
    @Body() dto: ForgotPasswordRequestDto,
    @Req() req: Request,
  ): Promise<{ message: string; token?: string }> {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    // Rate Limit: 3 attempts per hour per email
    await this.rateLimiter.enforceRateLimit(
      'forgot_password:email',
      dto.email.trim().toLowerCase(),
      3,
      3600,
      'Password reset request rate limit exceeded. You can request at most 3 reset links per hour.',
    );

    return this.authService.forgotPassword(dto.email, ip, userAgent);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using valid reset token' })
  @SwaggerResponse({ status: 200, description: 'Password reset successful' })
  @SwaggerResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() dto: ResetPasswordRequestDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    return this.authService.resetPassword(dto, ip, userAgent);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current authenticated user profile and permissions' })
  @SwaggerResponse({ status: 200, description: 'User profile retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser('sub') userId: string): Promise<UserProfileDto> {
    return this.authService.getMe(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update authenticated user profile information' })
  @SwaggerResponse({ status: 200, description: 'Profile updated successfully' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileRequestDto,
    @Req() req: Request,
  ): Promise<UserProfileDto> {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    return this.authService.updateMe(userId, dto, ip, userAgent);
  }
}
