import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OtpService } from './otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { Public } from '../auth/decorators/public.decorator';
import { MailerService } from '../mail/mailer.service';
import { otpEmailTemplate } from '../notification/email-templates';

@Controller('auth')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
    private readonly mailer: MailerService,
  ) {}

  @Post('verify-otp')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const userId = await this.otpService.verifyAndConsume(
      dto.challengeId,
      dto.code,
    );
    return { userId, verified: true };
  }

  @Post('resend-otp')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async resendOtp(@Body() dto: ResendOtpDto) {
    const { challengeId, code, email } = await this.otpService.resend(
      dto.challengeId,
    );
    if (email) {
      const template = otpEmailTemplate(code);
      try {
        await this.mailer.sendMail({
          to: email,
          subject: template.subject,
          text: template.text,
          html: template.html,
        });
      } catch {
        // Log in dev; the email failure should not block the resend response.
      }
    } else if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(
        `[DEV] OTP resend for challenge ${challengeId.slice(0, 8)}: ${code} (no email on user)`,
      );
    }
    return { resent: true };
  }
}
