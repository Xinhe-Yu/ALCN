from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from app.core.config import settings

def send_verification_email(to_email: str, code: str):
    msg = MIMEMultipart("alternative")

    msg["Subject"] = "Login Verification Code"
    msg["From"] = settings.email_from
    msg["To"] = to_email

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 500px; margin: auto; background: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #4CAF50;">Login Verification</h2>
          <p style="font-size: 16px; color: #555;">
            Use the verification code below to complete your login:
          </p>
          <div style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 4px; margin: 20px 0;">
            {code}
          </div>
          <p style="font-size: 14px; color: #999;">
            This code will expire in 15 minutes. If you did not request this, please ignore this email.
          </p>
        </div>
      </body>
    </html>
    """

    # Attach HTML version
    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP_SSL(settings.email_host, settings.email_port) as server:
        server.login(settings.email_username, settings.email_password)
        server.send_message(msg)
