"""
Email utility for SpråkKollen.
Set SMTP_HOST in .env to enable — if blank, emails are silently skipped.
"""
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.api.settings import settings

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html: str, plain: str) -> None:
    if not settings.SMTP_HOST:
        logger.info("Email skipped (SMTP_HOST not configured): %s → %s", to, subject)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as s:
            s.ehlo()
            s.starttls()
            if settings.SMTP_USER:
                s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            s.sendmail(msg["From"], [to], msg.as_string())
        logger.info("Email sent to %s: %s", to, subject)
    except Exception as exc:
        logger.warning("Failed to send email to %s: %s", to, exc)


def send_welcome_email(to_email: str, first_name: str) -> None:
    name = first_name or "there"
    subject = f"Welcome to {settings.APP_NAME}! 🇸🇪"

    html = f"""
    <html><body style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
      <h1 style="color:#1e40af">Welcome to {settings.APP_NAME}, {name}!</h1>
      <p>We're glad you joined. Here's what you can do:</p>
      <ul>
        <li>🔍 <b>Checker</b> — look up whether a Swedish noun is <i>en</i> or <i>ett</i></li>
        <li>🎯 <b>Practice</b> — train your en/ett skills with instant feedback</li>
        <li>📝 <b>Grammar</b> — quick quizzes on Swedish grammar rules</li>
        <li>📚 <b>Reading</b> — read Swedish texts and answer comprehension questions</li>
        <li>🔊 <b>Audio</b> — listen and choose the correct word</li>
        <li>🎤 <b>Speech</b> — speak Swedish words and get checked</li>
      </ul>
      <p>Start with a practice session today to keep your streak going! 🔥</p>
      <a href="http://localhost:5173/dashboard"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold">
        Go to Dashboard
      </a>
      <p style="margin-top:32px;color:#94a3b8;font-size:12px">
        You received this because you registered at {settings.APP_NAME}.
      </p>
    </body></html>
    """

    plain = (
        f"Welcome to {settings.APP_NAME}, {name}!\n\n"
        "You can now:\n"
        "- Check Swedish noun articles (en/ett)\n"
        "- Practice with quizzes\n"
        "- Read texts and test comprehension\n"
        "- Train your listening and speaking\n\n"
        "Log in at http://localhost:5173/login\n"
    )

    _send(to_email, subject, html, plain)


def send_verification_email(to_email: str, first_name: str, token: str) -> None:
    name = first_name or "there"
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject = f"Verify your {settings.APP_NAME} email"

    html = f"""
    <html><body style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
      <h1 style="color:#1e40af">Verify your email</h1>
      <p>Hi {name},</p>
      <p>Thanks for registering at {settings.APP_NAME}! Please verify your email address by clicking the button below. This link expires in <strong>24 hours</strong>.</p>
      <a href="{verify_url}"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold">
        Verify my email
      </a>
      <p style="margin-top:16px;font-size:12px;color:#64748b">Or copy this link:<br>{verify_url}</p>
      <p style="margin-top:32px;color:#94a3b8;font-size:12px">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </body></html>
    """

    plain = (
        f"Hi {name},\n\n"
        f"Verify your {settings.APP_NAME} email by visiting:\n{verify_url}\n\n"
        "This link expires in 24 hours.\n\n"
        "If you didn't create an account, ignore this email."
    )

    _send(to_email, subject, html, plain)


def send_password_reset_email(to_email: str, first_name: str, token: str) -> None:
    name = first_name or "there"
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    subject = f"Reset your {settings.APP_NAME} password"

    html = f"""
    <html><body style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
      <h1 style="color:#1e40af">Password Reset</h1>
      <p>Hi {name},</p>
      <p>We received a request to reset your {settings.APP_NAME} password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <a href="{reset_url}"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold">
        Reset my password
      </a>
      <p style="margin-top:16px;font-size:12px;color:#64748b">Or copy this link:<br>{reset_url}</p>
      <p style="margin-top:32px;color:#94a3b8;font-size:12px">
        If you didn't request this, you can safely ignore this email.
      </p>
    </body></html>
    """

    plain = (
        f"Hi {name},\n\n"
        f"Reset your {settings.APP_NAME} password by visiting:\n{reset_url}\n\n"
        "This link expires in 1 hour.\n\n"
        "If you didn't request this, ignore this email."
    )

    _send(to_email, subject, html, plain)
