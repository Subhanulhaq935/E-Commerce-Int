import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
from typing import Any

from app.core.config import settings
from app.models.order import Order

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def send_guest_order_confirmation(order: Order) -> bool:
        """
        Sends order confirmation email with secure tracking link to the guest customer.
        Fails gracefully without throwing an exception or rolling back the order.
        """
        recipient_email = order.guest_email
        if not recipient_email:
            logger.warning(f"Order #{order.id} has no guest email. Skipping email dispatch.")
            return False

        brevo_key = (getattr(settings, "BREVO_API_KEY", None) or "").strip()
        has_smtp = bool(settings.SMTP_EMAIL and settings.SMTP_PASSWORD)

        if not brevo_key and not has_smtp:
            logger.warning(
                "No email credentials configured (Neither BREVO_API_KEY nor SMTP credentials found). Skipping email dispatch."
            )
            return False

        tracking_link = f"{settings.FRONTEND_URL.rstrip('/')}/track-order/{order.tracking_token}"
        customer_name = order.guest_name or "Valued Customer"

        # Generate Items HTML Table Rows
        items_rows_html = ""
        items_text_list = ""
        for item in order.items:
            price_formatted = f"Rs. {float(item.unit_price):,.2f}"
            subtotal_formatted = f"Rs. {float(item.subtotal):,.2f}"
            items_rows_html += f"""
            <tr>
              <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #1a202c;">
                <strong>{item.product_name}</strong>
              </td>
              <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #4a5568; text-align: center;">
                {item.quantity}
              </td>
              <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #4a5568; text-align: right;">
                {price_formatted}
              </td>
              <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #1a202c; font-weight: bold; text-align: right;">
                {subtotal_formatted}
              </td>
            </tr>
            """
            items_text_list += f"- {item.product_name} x {item.quantity} = {subtotal_formatted}\n"

        total_formatted = f"Rs. {float(order.total_amount):,.2f}"
        order_date_str = order.created_at.strftime("%B %d, %Y at %I:%M %p") if order.created_at else "Today"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation #{order.id}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f7fafc; color: #2d3748;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; padding: 35px 15px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #1a202c; padding: 28px 32px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                        E-Shop<span style="color: #ea580c;">.pk</span>
                      </h1>
                      <p style="color: #cbd5e0; margin: 6px 0 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
                        Official Store • Order Confirmation
                      </p>
                    </td>
                  </tr>

                  <!-- Hero Greeting -->
                  <tr>
                    <td style="padding: 32px 32px 20px 32px;">
                      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px;">
                        <span style="color: #047857; font-size: 14px; font-weight: 700;">
                          ✓ Order #{order.id} Confirmed Successfully!
                        </span>
                      </div>
                      <h2 style="font-size: 20px; color: #1a202c; margin: 0 0 10px 0; font-weight: 800;">
                        Hello {customer_name},
                      </h2>
                      <p style="font-size: 14px; line-height: 1.6; color: #4a5568; margin: 0;">
                        Thank you for shopping with us! We have received your order and our team is preparing it for dispatch. Below are your order details and a secure link to track real-time delivery status without logging in.
                      </p>
                    </td>
                  </tr>

                  <!-- Order Meta Box -->
                  <tr>
                    <td style="padding: 0 32px 20px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #edf2f7;">
                        <tr>
                          <td style="font-size: 13px; color: #718096; padding: 4px 0;">Order Reference:</td>
                          <td style="font-size: 14px; color: #1a202c; font-weight: 800; text-align: right; padding: 4px 0;">#{order.id}</td>
                        </tr>
                        <tr>
                          <td style="font-size: 13px; color: #718096; padding: 4px 0;">Date Placed:</td>
                          <td style="font-size: 13px; color: #1a202c; font-weight: 600; text-align: right; padding: 4px 0;">{order_date_str}</td>
                        </tr>
                        <tr>
                          <td style="font-size: 13px; color: #718096; padding: 4px 0;">Payment Method:</td>
                          <td style="font-size: 13px; color: #1a202c; font-weight: 700; text-align: right; padding: 4px 0;">Cash on Delivery (COD)</td>
                        </tr>
                        <tr>
                          <td style="font-size: 13px; color: #718096; padding: 4px 0;">Current Status:</td>
                          <td style="font-size: 12px; color: #b45309; font-weight: 800; text-align: right; padding: 4px 0; text-transform: uppercase;">Pending Dispatch</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Ordered Items -->
                  <tr>
                    <td style="padding: 0 32px 24px 32px;">
                      <h3 style="font-size: 15px; font-weight: 700; color: #1a202c; margin: 0 0 12px 0;">
                        Order Items
                      </h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                        <thead>
                          <tr style="background-color: #f1f5f9;">
                            <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; border-radius: 8px 0 0 8px;">Product</th>
                            <th style="padding: 10px 14px; text-align: center; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">Qty</th>
                            <th style="padding: 10px 14px; text-align: right; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">Price</th>
                            <th style="padding: 10px 14px; text-align: right; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; border-radius: 0 8px 8px 0;">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items_rows_html}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colspan="3" style="padding: 12px 14px 6px 14px; text-align: right; font-size: 13px; color: #718096;">Delivery Charge:</td>
                            <td style="padding: 12px 14px 6px 14px; text-align: right; font-size: 13px; color: #10b981; font-weight: bold;">FREE COD</td>
                          </tr>
                          <tr>
                            <td colspan="3" style="padding: 6px 14px 12px 14px; text-align: right; font-size: 15px; color: #1a202c; font-weight: 800;">Total Amount:</td>
                            <td style="padding: 6px 14px 12px 14px; text-align: right; font-size: 17px; color: #ea580c; font-weight: 900;">{total_formatted}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </td>
                  </tr>

                  <!-- Delivery Address -->
                  <tr>
                    <td style="padding: 0 32px 28px 32px;">
                      <h3 style="font-size: 15px; font-weight: 700; color: #1a202c; margin: 0 0 10px 0;">
                        Shipping Details
                      </h3>
                      <div style="background-color: #f8fafc; border-radius: 12px; padding: 14px 18px; font-size: 13px; line-height: 1.6; color: #4a5568; border: 1px solid #edf2f7;">
                        <strong style="color: #1a202c;">{order.guest_name}</strong><br>
                        Phone: {order.guest_phone}<br>
                        Address: {order.guest_address}, {order.guest_city} {order.guest_postal_code or ''}<br>
                        Country: Pakistan
                      </div>
                    </td>
                  </tr>

                  <!-- Tracking CTA Button -->
                  <tr>
                    <td style="padding: 0 32px 36px 32px; text-align: center;">
                      <a href="{tracking_link}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);">
                        Track Your Order Live →
                      </a>
                      <p style="font-size: 12px; color: #a0aec0; margin: 14px 0 0 0;">
                        Or copy-paste this secure link into your browser:<br>
                        <a href="{tracking_link}" style="color: #ea580c; word-break: break-all;">{tracking_link}</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #edf2f7;">
                      <p style="font-size: 12px; color: #a0aec0; margin: 0 0 4px 0;">
                        Have questions about your order? Reply directly to this email or visit our help center.
                      </p>
                      <p style="font-size: 11px; color: #cbd5e0; margin: 0;">
                        © 2026 E-Shop.pk. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """

        plain_text = f"""Order #{order.id} Confirmed!

Hello {customer_name},

Thank you for your order on E-Shop.pk!
Order Reference: #{order.id}
Date: {order_date_str}
Total Amount: {total_formatted} (Cash on Delivery)
Status: Pending Dispatch

Items:
{items_text_list}

Delivery Address:
{order.guest_name}
{order.guest_phone}
{order.guest_address}, {order.guest_city}

You can track your order at any time using your secure link:
{tracking_link}

Best regards,
E-Shop.pk Team
"""

        clean_email = (settings.SMTP_EMAIL or "subhanulhaq935@gmail.com").strip()
        clean_password = (settings.SMTP_PASSWORD or "").replace(" ", "").strip()

        # 1. Try Brevo HTTPS REST API first (Bypasses Render Free Tier SMTP port blocks)
        if brevo_key:
            try:
                import httpx
                payload = {
                    "sender": {"name": "EShop Store", "email": clean_email},
                    "to": [{"email": recipient_email, "name": customer_name}],
                    "replyTo": {"email": clean_email, "name": "EShop Store"},
                    "subject": f"Order #{order.id} Confirmed - EShop Store",
                    "htmlContent": html_content,
                    "textContent": plain_text,
                }
                headers = {
                    "accept": "application/json",
                    "api-key": brevo_key,
                    "content-type": "application/json",
                }
                with httpx.Client(timeout=15.0) as client:
                    resp = client.post("https://api.brevo.com/v3/smtp/email", json=payload, headers=headers)
                if resp.status_code in (200, 201, 202):
                    logger.info(f"Order #{order.id} confirmation sent via Brevo HTTPS API to {recipient_email}")
                    print(f"[EMAIL SERVICE] Order #{order.id} confirmation sent via Brevo HTTPS API to {recipient_email}")
                    return True
                else:
                    logger.warning(f"Brevo API error ({resp.status_code}): {resp.text}. Trying SMTP...")
                    print(f"[EMAIL SERVICE] Brevo API error ({resp.status_code}): {resp.text}. Trying SMTP...")
            except Exception as e_brevo:
                logger.warning(f"Brevo API error: {e_brevo}. Trying SMTP...")
                print(f"[EMAIL SERVICE] Brevo API request failed: {e_brevo}. Trying SMTP...")

        # 2. Fallback to direct SMTP (for local dev or hosts allowing port 587/465)
        if not has_smtp:
            logger.warning("No SMTP credentials configured to fallback to. Skipping.")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"Order #{order.id} Confirmed - EShop Store"
            msg["From"] = formataddr(("EShop Store", clean_email))
            msg["To"] = recipient_email
            msg["Reply-To"] = clean_email
            msg["Date"] = formatdate(localtime=True)
            msg["Message-ID"] = make_msgid(domain="gmail.com")

            part1 = MIMEText(plain_text, "plain", "utf-8")
            part2 = MIMEText(html_content, "html", "utf-8")

            msg.attach(part1)
            msg.attach(part2)

            sent = False
            last_err = None

            # 1. Try Port 587 with STARTTLS first
            try:
                with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT or 587), timeout=15) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(clean_email, clean_password)
                    server.sendmail(clean_email, [recipient_email], msg.as_string())
                sent = True
                print(f"[EMAIL SERVICE] Order #{order.id} confirmation sent via Port 587 (TLS) to {recipient_email}")
            except Exception as e587:
                last_err = e587
                print(f"[EMAIL SERVICE] Port 587 failed: {e587}. Trying Port 465 (SSL) fallback...")
                # 2. Fallback to Port 465 (SSL) if ISP blocks Port 587
                try:
                    with smtplib.SMTP_SSL(settings.SMTP_HOST, 465, timeout=15) as server:
                        server.login(clean_email, clean_password)
                        server.sendmail(clean_email, [recipient_email], msg.as_string())
                    sent = True
                    print(f"[EMAIL SERVICE] Order #{order.id} confirmation sent via Port 465 (SSL) to {recipient_email}")
                except Exception as e465:
                    last_err = e465
                    print(f"[EMAIL SERVICE ERROR] Both Port 587 and 465 failed! Port 587: {e587} | Port 465: {e465}")

            if sent:
                logger.info(f"Order confirmation email sent successfully to {recipient_email} for Order #{order.id}")
                return True
            else:
                logger.error(f"Failed to send email for Order #{order.id}: {last_err}")
                return False
        except Exception as e:
            print(f"[EMAIL SERVICE ERROR] Unexpected error: {e}")
            logger.error(f"Failed to send order confirmation email for Order #{order.id} to {recipient_email}: {e}")
            return False
