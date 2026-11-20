import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
from app.core.config import settings

def test_smtp():
    email = (settings.SMTP_EMAIL or "").strip()
    password = (settings.SMTP_PASSWORD or "").replace(" ", "").strip()
    host = settings.SMTP_HOST
    port = int(settings.SMTP_PORT or 587)

    print(f"Testing SMTP with:")
    print(f"  Host: {host}")
    print(f"  Port: {port}")
    print(f"  Email: {email}")
    print(f"  Password Length: {len(password)} characters (spaces stripped)")

    msg = MIMEText("This is a test email from EShop Store to verify Gmail SMTP delivery.", "plain", "utf-8")
    msg["Subject"] = "Test Order Confirmation - EShop Store"
    msg["From"] = formataddr(("EShop Store", email))
    msg["To"] = email
    msg["Reply-To"] = email
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="gmail.com")

    print("\n[1/2] Attempting Port 587 (TLS)...")
    try:
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(email, password)
            server.sendmail(email, [email], msg.as_string())
        print(" SUCCESS! Email sent via Port 587 (TLS). Check your inbox (or Spam/Promotions tab).")
        return True
    except Exception as e587:
        print(f" Port 587 failed: {e587}")

    print("\n[2/2] Attempting Fallback to Port 465 (SSL)...")
    try:
        with smtplib.SMTP_SSL(host, 465, timeout=15) as server:
            server.login(email, password)
            server.sendmail(email, [email], msg.as_string())
        print(" SUCCESS! Email sent via Port 465 (SSL). Check your inbox (or Spam/Promotions tab).")
        return True
    except Exception as e465:
        print(f" Port 465 failed: {e465}")

    print("\n SMTP authentication failed. Please check your App Password in .env.")
    return False

if __name__ == "__main__":
    test_smtp()
