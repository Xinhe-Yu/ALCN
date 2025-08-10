import smtplib
from email.mime.text import MIMEText
from app.core.config import settings

def send_verification_email(to_email: str, code: str):
    msg = MIMEText(f"Your verification code is: {code}")
    msg["Subject"] = "Login Verification Code"
    msg["From"] = settings.email_from
    msg["To"] = to_email

    with smtplib.SMTP_SSL(settings.email_host, settings.email_port) as server:
        server.login(settings.email_username, settings.email_password)
        server.send_message(msg)
