import logging

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_verification_email(email: str, code: str) -> bool:
    """Send verification code via SMTP."""
    subject = "Ваш код подтверждения"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Код подтверждения</h2>
        <p>Ваш код: <strong style="font-size: 24px; color: #2563eb;">{code}</strong></p>
        <p>Код действителен в течение 10 минут.</p>
        <p style="color: #666; font-size: 12px;">Если вы не запрашивали этот код, просто проигнорируйте письмо.</p>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = getattr(settings, "SMTP_FROM", "noreply@newsparser.app")
    msg["To"] = email
    msg.attach(MIMEText(body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=getattr(settings, "SMTP_HOST", "smtp.gmail.com"),
            port=int(getattr(settings, "SMTP_PORT", "587")),
            username=getattr(settings, "SMTP_USERNAME", ""),
            password=getattr(settings, "SMTP_PASSWORD", ""),
            start_tls=True,
        )
        logger.info("Verification email sent to %s", email)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", email, e)
        return False
