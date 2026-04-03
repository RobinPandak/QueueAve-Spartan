import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Spartan by QueueAve <community@queueave.com>'

export async function sendRegistrationEmail({
  to,
  name,
  eventName,
  eventDate,
  eventStartTime,
  eventVenue,
  profileUrl,
  qrUrl,
}: {
  to: string
  name: string
  eventName: string
  eventDate: string | null
  eventStartTime: string | null
  eventVenue: string | null
  profileUrl: string
  qrUrl: string
}) {
  const formattedDate = eventDate
    ? new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const formattedTime = eventStartTime
    ? new Date('1970-01-01T' + eventStartTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDF8F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8F5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:24px;">
          <img src="https://spartan.queueave.com/logo.svg" width="40" height="40" alt="Spartan" style="display:block;margin:0 auto 8px;" />
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FF6B4A;">Spartan by QueueAve</p>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);">

          <!-- Coral top bar -->
          <div style="height:5px;background:#FF6B4A;"></div>

          <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 32px 24px;">

            <!-- Status icon -->
            <tr><td align="center" style="padding-bottom:16px;">
              <div style="display:inline-block;width:56px;height:56px;background:#FFB800;border-radius:14px;text-align:center;line-height:56px;font-size:28px;">⏳</div>
            </td></tr>

            <!-- Heading -->
            <tr><td align="center" style="padding-bottom:4px;">
              <h1 style="margin:0;font-size:22px;font-weight:900;color:#1A1A1A;">Registration received!</h1>
            </td></tr>
            <tr><td align="center" style="padding-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#6B6B6B;">Hi <strong>${name}</strong>, your spot is pending coach approval.</p>
            </td></tr>

            <!-- Event info -->
            <tr><td style="background:#F5F0EB;border-radius:12px;padding:16px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1A1A1A;">${eventName}</p>
              ${formattedDate ? `<p style="margin:0 0 4px;font-size:13px;color:#6B6B6B;">📅 ${formattedDate}</p>` : ''}
              ${formattedTime ? `<p style="margin:0 0 4px;font-size:13px;color:#6B6B6B;">🕐 ${formattedTime}</p>` : ''}
              ${eventVenue ? `<p style="margin:0;font-size:13px;color:#6B6B6B;">📍 ${eventVenue}</p>` : ''}
            </td></tr>

            <!-- QR label -->
            <tr><td align="center" style="padding-top:20px;padding-bottom:12px;">
              <p style="margin:0;font-size:13px;color:#A0A0A0;">Save your QR code for instant check-in</p>
            </td></tr>

            <!-- QR code -->
            <tr><td align="center" style="padding-bottom:24px;">
              <div style="display:inline-block;background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 16px rgba(0,0,0,.08);">
                <img src="${qrUrl}" width="180" height="180" alt="Your QR Code" style="display:block;" />
              </div>
            </td></tr>

            <!-- CTA -->
            <tr><td align="center" style="padding-bottom:8px;">
              <a href="${profileUrl}" style="display:inline-block;background:#FF6B4A;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;">View my athlete profile</a>
            </td></tr>

          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#A0A0A0;">Powered by <a href="https://queueave.com" style="color:#FF6B4A;text-decoration:none;font-weight:600;">QueueAve</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Registration pending — ${eventName}`,
      html,
    })
  } catch (err) {
    console.error('[sendRegistrationEmail] failed:', err)
    // Don't throw — email failure should not break registration
  }
}

export async function sendEventGuideEmail({
  to,
  name,
  eventName,
  eventDate,
  eventStartTime,
  eventVenue,
  arrivalNote,
  parkingNote,
  accessNote,
  repName,
}: {
  to: string
  name: string
  eventName: string
  eventDate: string | null
  eventStartTime: string | null
  eventVenue: string | null
  arrivalNote: string
  parkingNote: string
  accessNote: string
  repName: string
}) {
  const formattedDate = eventDate
    ? new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null
  const formattedTime = eventStartTime
    ? new Date('1970-01-01T' + eventStartTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDF8F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8F5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding-bottom:24px;">
          <img src="https://spartan.queueave.com/logo.svg" width="40" height="40" alt="Spartan" style="display:block;margin:0 auto 8px;" />
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FF6B4A;">Spartan by QueueAve</p>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);">
          <div style="height:5px;background:#FF6B4A;"></div>
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 32px 24px;">
            <tr><td align="center" style="padding-bottom:16px;">
              <div style="display:inline-block;width:56px;height:56px;background:rgba(255,107,74,.12);border-radius:14px;text-align:center;line-height:56px;font-size:28px;">📋</div>
            </td></tr>
            <tr><td align="center" style="padding-bottom:4px;">
              <h1 style="margin:0;font-size:22px;font-weight:900;color:#1A1A1A;">Event Guide</h1>
            </td></tr>
            <tr><td align="center" style="padding-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#6B6B6B;">Hi <strong>${name}</strong>, here's everything you need to know for the event.</p>
            </td></tr>
            <tr><td style="background:#F5F0EB;border-radius:12px;padding:16px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1A1A1A;">${eventName}</p>
              ${formattedDate ? `<p style="margin:0 0 4px;font-size:13px;color:#6B6B6B;">📅 ${formattedDate}</p>` : ''}
              ${formattedTime ? `<p style="margin:0 0 4px;font-size:13px;color:#6B6B6B;">🕐 ${formattedTime}</p>` : ''}
              ${eventVenue ? `<p style="margin:0;font-size:13px;color:#6B6B6B;">📍 ${eventVenue}</p>` : ''}
            </td></tr>
            <tr><td style="padding-top:16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding-bottom:12px;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#A0A0A0;">Arrive</p>
                  <p style="margin:0;font-size:14px;color:#1A1A1A;">${arrivalNote}</p>
                </td></tr>
                <tr><td style="padding-bottom:12px;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#A0A0A0;">Parking</p>
                  <p style="margin:0;font-size:14px;color:#1A1A1A;">${parkingNote}</p>
                </td></tr>
                <tr><td style="padding-bottom:12px;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#A0A0A0;">Where to go</p>
                  <p style="margin:0;font-size:14px;color:#1A1A1A;">${accessNote}</p>
                </td></tr>
                <tr><td>
                  <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#A0A0A0;">Your coach</p>
                  <p style="margin:0;font-size:14px;color:#1A1A1A;">${repName}</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#A0A0A0;">Powered by <a href="https://queueave.com" style="color:#FF6B4A;text-decoration:none;font-weight:600;">QueueAve</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Event Guide — ${eventName}`,
    html,
  })
}
