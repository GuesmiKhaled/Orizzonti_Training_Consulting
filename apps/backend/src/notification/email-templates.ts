export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const BRAND = 'Orizzonti Training & Consulting';
const BRAND_TEXT = 'Orizzonti Training & Consulting';

function wrapHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fbfcfb;border-radius:16px;overflow:hidden;border:1px solid #10231f16">
<tr><td style="background:#0f2d29;padding:20px 32px"><span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.04em">${BRAND}</span></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:22px;color:#10231f">${title}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:0 32px 24px;border-top:1px solid #10231f16;padding-top:20px">
<p style="margin:0;font-size:13px;color:#586a65">This is an automated message. Please do not reply to this email.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export function otpEmailTemplate(code: string): EmailTemplate {
  const subject = 'Your verification code';
  const bodyHtml = `
<p style="margin:0 0 12px;color:#10231f">Use the following code to verify your identity:</p>
<div style="margin:24px 0;text-align:center">
<span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:#0d5c55;background:#d7efe4;padding:16px 32px;border-radius:12px">${code}</span>
</div>
<p style="margin:0 0 8px;color:#586a65;font-size:14px">This code expires in 5 minutes. If you did not request this code, you can safely ignore this email.</p>`;
  const text = `Your verification code is: ${code}\n\nThis code expires in 5 minutes. If you did not request this code, you can safely ignore this email.\n\n${BRAND_TEXT}`;
  return { subject, html: wrapHtml('Verify Your Identity', bodyHtml), text };
}

export interface CourseReservationData {
  fullName: string;
  courseName: string;
  level?: string | null;
  reservationReference: string;
  reservationDate: string;
  startDate?: string | null;
  status: string;
}

export function courseReservationEmailTemplate(data: CourseReservationData): EmailTemplate {
  const subject = `Course Reservation Confirmation — ${data.courseName}`;
  const rows = [
    `Course: ${data.courseName}`,
    data.level ? `Level: ${data.level}` : null,
    `Reservation Reference: ${data.reservationReference}`,
    `Reservation Date: ${data.reservationDate}`,
    data.startDate ? `Course Start Date: ${data.startDate}` : null,
    `Reservation Status: ${data.status}`,
  ].filter(Boolean).join('\n');
  const bodyHtml = `
<p style="margin:0 0 12px">Hello ${data.fullName.split(' ')[0]},</p>
<p style="margin:0 0 16px">Thank you for choosing our training center! Your reservation for <strong>${data.courseName}</strong> has been registered.</p>
<table width="100%" cellpadding="8" cellspacing="0" style="background:#f4f7f5;border-radius:12px;margin:16px 0">
${data.courseName ? `<tr><td style="color:#586a65;font-size:14px;width:180px">Course</td><td style="color:#10231f;font-size:14px">${data.courseName}</td></tr>` : ''}
${data.level ? `<tr><td style="color:#586a65;font-size:14px">Level</td><td style="color:#10231f;font-size:14px">${data.level}</td></tr>` : ''}
<tr><td style="color:#586a65;font-size:14px">Reservation Reference</td><td style="color:#10231f;font-size:14px;font-weight:600">${data.reservationReference}</td></tr>
<tr><td style="color:#586a65;font-size:14px">Reservation Date</td><td style="color:#10231f;font-size:14px">${data.reservationDate}</td></tr>
${data.startDate ? `<tr><td style="color:#586a65;font-size:14px">Course Start Date</td><td style="color:#10231f;font-size:14px">${data.startDate}</td></tr>` : ''}
<tr><td style="color:#586a65;font-size:14px">Status</td><td style="color:#10231f;font-size:14px">${data.status}</td></tr>
</table>
<p style="margin:0 0 8px;color:#586a65;font-size:14px">Our team will contact you if additional information is required. We look forward to welcoming you!</p>`;
  const text = `Hello ${data.fullName.split(' ')[0]},\n\nThank you for choosing our training center!\n\nYour reservation for ${data.courseName} has been registered.\n\n${rows}\n\nOur team will contact you if additional information is required.\n\nBest regards,\n${BRAND_TEXT}`;
  return { subject, html: wrapHtml('Course Reservation Confirmation', bodyHtml), text };
}

export interface ExamBookingData {
  fullName: string;
  languageName: string;
  cefrLevel?: string | null;
  examDate: string;
  location?: string | null;
  bookingReference: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export function examBookingEmailTemplate(data: ExamBookingData): EmailTemplate {
  const isPending = data.status === 'pending';
  const subject = `Language Examination Booking ${isPending ? 'Received' : 'Confirmed'} — ${data.examDate}`;
  const title = isPending ? 'Examination Booking Received' : 'Examination Booking Confirmed';
  const bodyHtml = `
<p style="margin:0 0 12px">Hello ${data.fullName.split(' ')[0]},</p>
<p style="margin:0 0 16px">${isPending
    ? `We received your booking request for a language examination. Our team will review it and contact you shortly.`
    : `Your examination booking has been confirmed. A place is reserved for you.`}</p>
<table width="100%" cellpadding="8" cellspacing="0" style="background:#f4f7f5;border-radius:12px;margin:16px 0">
<tr><td style="color:#586a65;font-size:14px;width:180px">Language</td><td style="color:#10231f;font-size:14px">${data.languageName}</td></tr>
${data.cefrLevel ? `<tr><td style="color:#586a65;font-size:14px">Level</td><td style="color:#10231f;font-size:14px">${data.cefrLevel}</td></tr>` : ''}
<tr><td style="color:#586a65;font-size:14px">Exam Date</td><td style="color:#10231f;font-size:14px">${data.examDate}</td></tr>
${data.location ? `<tr><td style="color:#586a65;font-size:14px">Location</td><td style="color:#10231f;font-size:14px">${data.location}</td></tr>` : ''}
<tr><td style="color:#586a65;font-size:14px">Booking Reference</td><td style="color:#10231f;font-size:14px;font-weight:600">${data.bookingReference}</td></tr>
<tr><td style="color:#586a65;font-size:14px">Status</td><td style="color:#10231f;font-size:14px">${isPending ? 'Pending Review' : 'Confirmed'}</td></tr>
</table>
<p style="margin:0;color:#586a65;font-size:14px">If you have any questions, please contact us.</p>`;
  const text = `Hello ${data.fullName.split(' ')[0]},\n\n${isPending
    ? 'We received your booking request for a language examination. Our team will review it and contact you shortly.'
    : 'Your examination booking has been confirmed. A place is reserved for you.'}\n\nLanguage: ${data.languageName}\n${data.cefrLevel ? `Level: ${data.cefrLevel}\n` : ''}Exam Date: ${data.examDate}\n${data.location ? `Location: ${data.location}\n` : ''}Booking Reference: ${data.bookingReference}\nStatus: ${isPending ? 'Pending Review' : 'Confirmed'}\n\n${BRAND_TEXT}`;
  return { subject, html: wrapHtml(title, bodyHtml), text };
}
