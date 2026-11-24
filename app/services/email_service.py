import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
from typing import Any, Dict, Optional

from app.core.config import settings
from app.models.enums import OrderStatus
from app.models.order import Order

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def _extract_order_context(order: Order) -> Optional[Dict[str, Any]]:
        """
        Extracts recipient information, items, address, and tracking link
        for either an authenticated buyer or a guest customer.
        """
        # 1. Recipient email: Buyer account email first, fallback to guest_email
        recipient_email = None
        if getattr(order, "buyer", None) and getattr(order.buyer, "email", None):
            recipient_email = order.buyer.email.strip()
        elif getattr(order, "guest_email", None):
            recipient_email = order.guest_email.strip()

        if not recipient_email:
            logger.warning(f"Order #{order.id} has no recipient email. Skipping email dispatch.")
            return None

        # 2. Customer Name
        customer_name = None
        if getattr(order, "buyer", None) and getattr(order.buyer, "name", None):
            customer_name = order.buyer.name.strip()
        elif getattr(order, "guest_name", None):
            customer_name = order.guest_name.strip()
        elif getattr(order, "shipping_address", None) and getattr(order.shipping_address, "full_name", None):
            customer_name = order.shipping_address.full_name.strip()
        else:
            customer_name = "Valued Customer"

        # 3. Delivery / Shipping Details
        if getattr(order, "shipping_address", None):
            addr = order.shipping_address
            shipping_name = addr.full_name or customer_name
            shipping_phone = addr.phone or "N/A"
            addr_parts = [addr.address_line, addr.city]
            if addr.postal_code:
                addr_parts.append(str(addr.postal_code))
            shipping_address_str = ", ".join(p for p in addr_parts if p)
            shipping_country = addr.country or "Pakistan"
        else:
            shipping_name = getattr(order, "guest_name", None) or customer_name
            shipping_phone = getattr(order, "guest_phone", None) or "N/A"
            addr_parts = [getattr(order, "guest_address", None) or "", getattr(order, "guest_city", None) or ""]
            if getattr(order, "guest_postal_code", None):
                addr_parts.append(str(order.guest_postal_code))
            shipping_address_str = ", ".join(p for p in addr_parts if p)
            shipping_country = "Pakistan"

        # 4. Tracking Link
        if getattr(order, "tracking_token", None):
            tracking_link = f"{settings.FRONTEND_URL.rstrip('/')}/track-order/{order.tracking_token}"
        elif getattr(order, "buyer_id", None):
            tracking_link = f"{settings.FRONTEND_URL.rstrip('/')}/my-orders"
        else:
            tracking_link = f"{settings.FRONTEND_URL.rstrip('/')}"

        # 5. Items Rows and Plain Text
        items_rows_html = ""
        items_text_list = ""
        items = getattr(order, "items", []) or []
        for item in items:
            price_formatted = f"Rs. {float(item.unit_price):,.2f}"
            subtotal_formatted = f"Rs. {float(item.subtotal):,.2f}"
            size_badge = (
                f' <span style="display: inline-block; font-size: 11px; background-color: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-left: 4px;">Size: {item.size}</span>'
                if getattr(item, "size", None)
                else ""
            )
            size_text = f" (Size: {item.size})" if getattr(item, "size", None) else ""
            items_rows_html += f"""
            <tr>
              <td style="padding: 12px 14px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #1a202c;">
                <strong>{item.product_name}</strong>{size_badge}
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
            items_text_list += f"- {item.product_name}{size_text} x {item.quantity} = {subtotal_formatted}\n"

        total_formatted = f"Rs. {float(order.total_amount):,.2f}"
        order_date_str = (
            order.created_at.strftime("%B %d, %Y at %I:%M %p")
            if getattr(order, "created_at", None)
            else "Today"
        )

        return {
            "recipient_email": recipient_email,
            "customer_name": customer_name,
            "shipping_name": shipping_name,
            "shipping_phone": shipping_phone,
            "shipping_address_str": shipping_address_str,
            "shipping_country": shipping_country,
            "tracking_link": tracking_link,
            "items_rows_html": items_rows_html,
            "items_text_list": items_text_list,
            "total_formatted": total_formatted,
            "order_date_str": order_date_str,
            "is_authenticated": bool(getattr(order, "buyer_id", None)),
        }

    @classmethod
    def _dispatch_email(
        cls,
        recipient_email: str,
        customer_name: str,
        subject: str,
        html_content: str,
        plain_text: str,
        order_id: int,
    ) -> bool:
        """
        Sends email via Brevo HTTPS REST API (Port 443) or Gmail SMTP fallback (587 / 465).
        Fails gracefully without raising exceptions.
        """
        brevo_key = (getattr(settings, "BREVO_API_KEY", None) or "").strip()
        has_smtp = bool(settings.SMTP_EMAIL and settings.SMTP_PASSWORD)

        if not brevo_key and not has_smtp:
            logger.warning(
                f"No email credentials configured (neither BREVO_API_KEY nor SMTP credentials). Skipping email for Order #{order_id}."
            )
            return False

        clean_email = (settings.SMTP_EMAIL or "subhanulhaq935@gmail.com").strip()
        clean_password = (settings.SMTP_PASSWORD or "").replace(" ", "").strip()

        # 1. Try Brevo HTTPS REST API first (Bypasses cloud provider SMTP blocks)
        if brevo_key:
            try:
                import httpx
                payload = {
                    "sender": {"name": "EShop Store", "email": clean_email},
                    "to": [{"email": recipient_email, "name": customer_name}],
                    "replyTo": {"email": clean_email, "name": "EShop Store"},
                    "subject": subject,
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
                    logger.info(f"Order #{order_id} email sent via Brevo HTTPS API to {recipient_email}")
                    print(f"[EMAIL SERVICE] Order #{order_id} email sent via Brevo HTTPS API to {recipient_email}")
                    return True
                else:
                    logger.warning(f"Brevo API error ({resp.status_code}): {resp.text}. Trying SMTP...")
                    print(f"[EMAIL SERVICE] Brevo API error ({resp.status_code}): {resp.text}. Trying SMTP...")
            except Exception as e_brevo:
                logger.warning(f"Brevo API request failed: {e_brevo}. Trying SMTP...")
                print(f"[EMAIL SERVICE] Brevo API request failed: {e_brevo}. Trying SMTP...")

        # 2. Direct SMTP fallback (Port 587 STARTTLS, then Port 465 SSL)
        if not has_smtp:
            logger.warning(f"No SMTP credentials configured to fallback for Order #{order_id}. Skipping.")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
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

            # Attempt Port 587 (TLS)
            try:
                with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT or 587), timeout=5) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(clean_email, clean_password)
                    server.sendmail(clean_email, [recipient_email], msg.as_string())
                sent = True
                print(f"[EMAIL SERVICE] Order #{order_id} email sent via Port 587 (TLS) to {recipient_email}")
            except Exception as e587:
                last_err = e587
                print(f"[EMAIL SERVICE] Port 587 failed: {e587}. Trying Port 465 (SSL) fallback...")
                try:
                    with smtplib.SMTP_SSL(settings.SMTP_HOST, 465, timeout=5) as server:
                        server.login(clean_email, clean_password)
                        server.sendmail(clean_email, [recipient_email], msg.as_string())
                    sent = True
                    print(f"[EMAIL SERVICE] Order #{order_id} email sent via Port 465 (SSL) to {recipient_email}")
                except Exception as e465:
                    last_err = e465
                    print(f"[EMAIL SERVICE ERROR] Both Port 587 and 465 failed! Port 587: {e587} | Port 465: {e465}")

            if sent:
                logger.info(f"Email sent successfully to {recipient_email} for Order #{order_id}")
                return True
            else:
                logger.error(f"Failed to send email for Order #{order_id}: {last_err}")
                return False

        except Exception as e:
            print(f"[EMAIL SERVICE ERROR] Unexpected error dispatching email for Order #{order_id}: {e}")
            logger.error(f"Failed to send email for Order #{order_id} to {recipient_email}: {e}")
            return False

    @classmethod
    def send_order_confirmation(cls, order: Order) -> bool:
        """
        Sends order confirmation email with order details and tracking link
        to either an authenticated customer or guest customer.
        Fails gracefully without raising exceptions.
        """
        ctx = cls._extract_order_context(order)
        if not ctx:
            return False

        customer_name = ctx["customer_name"]
        recipient_email = ctx["recipient_email"]
        tracking_link = ctx["tracking_link"]
        order_date_str = ctx["order_date_str"]
        total_formatted = ctx["total_formatted"]
        items_rows_html = ctx["items_rows_html"]
        items_text_list = ctx["items_text_list"]
        shipping_name = ctx["shipping_name"]
        shipping_phone = ctx["shipping_phone"]
        shipping_address_str = ctx["shipping_address_str"]
        shipping_country = ctx["shipping_country"]
        is_authenticated = ctx["is_authenticated"]

        auth_subnote = (
            "You can also view this and all your past orders at any time from your account under <strong>My Orders</strong>."
            if is_authenticated
            else "You can track your real-time delivery status securely anytime without logging in."
        )

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
                        Thank you for shopping with us! We have received your order and our team is preparing it for dispatch. Below are your complete order details. {auth_subnote}
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
                        <strong style="color: #1a202c;">{shipping_name}</strong><br>
                        Phone: {shipping_phone}<br>
                        Address: {shipping_address_str}<br>
                        Country: {shipping_country}
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
                        Or open this link in your browser:<br>
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
{shipping_name}
{shipping_phone}
{shipping_address_str}

Track your order live:
{tracking_link}

Best regards,
E-Shop.pk Team
"""

        subject = f"Order #{order.id} Confirmed - EShop Store"
        return cls._dispatch_email(
            recipient_email=recipient_email,
            customer_name=customer_name,
            subject=subject,
            html_content=html_content,
            plain_text=plain_text,
            order_id=order.id,
        )

    @classmethod
    def send_guest_order_confirmation(cls, order: Order) -> bool:
        """
        Backwards-compatible alias for send_order_confirmation.
        """
        return cls.send_order_confirmation(order)

    @classmethod
    def send_order_status_update(
        cls,
        order: Order,
        new_status: OrderStatus,
        old_status: Optional[OrderStatus] = None,
    ) -> bool:
        """
        Sends order status change notification email (Processing, Shipped, Delivered, Cancelled)
        to either an authenticated customer or guest customer.
        Fails gracefully without raising exceptions.
        """
        ctx = cls._extract_order_context(order)
        if not ctx:
            return False

        customer_name = ctx["customer_name"]
        recipient_email = ctx["recipient_email"]
        tracking_link = ctx["tracking_link"]
        order_date_str = ctx["order_date_str"]
        total_formatted = ctx["total_formatted"]
        items_rows_html = ctx["items_rows_html"]
        items_text_list = ctx["items_text_list"]
        shipping_name = ctx["shipping_name"]
        shipping_phone = ctx["shipping_phone"]
        shipping_address_str = ctx["shipping_address_str"]
        shipping_country = ctx["shipping_country"]

        # Status configuration mapping
        status_configs = {
            OrderStatus.processing: {
                "title": f"Order #{order.id} is Now Processing",
                "badge_label": "Processing",
                "badge_color": "#1d4ed8",
                "badge_bg": "#dbeafe",
                "banner_bg": "#eff6ff",
                "banner_border": "#3b82f6",
                "banner_title": f"⚙️ Order #{order.id} is Now Processing!",
                "banner_text": "Great news! Your order has been confirmed and is currently being prepared and packed by our fulfillment team for dispatch.",
            },
            OrderStatus.shipped: {
                "title": f"Order #{order.id} Has Been Shipped!",
                "badge_label": "Shipped / In Transit",
                "badge_color": "#6d28d9",
                "badge_bg": "#ede9fe",
                "banner_bg": "#f5f3ff",
                "banner_border": "#8b5cf6",
                "banner_title": f"🚚 Order #{order.id} Has Been Shipped!",
                "banner_text": "Your package is on its way to you! Our delivery partner has picked up your order and dispatch is underway.",
            },
            OrderStatus.delivered: {
                "title": f"Order #{order.id} Has Been Delivered",
                "badge_label": "Delivered",
                "badge_color": "#047857",
                "badge_bg": "#d1fae5",
                "banner_bg": "#ecfdf5",
                "banner_border": "#10b981",
                "banner_title": f"🎉 Order #{order.id} Has Been Delivered!",
                "banner_text": "Your order has been successfully delivered. We hope you love your purchase! If you have any questions or feedback, please reach out to us.",
            },
            OrderStatus.cancelled: {
                "title": f"Order #{order.id} Has Been Cancelled",
                "badge_label": "Cancelled",
                "badge_color": "#b91c1c",
                "badge_bg": "#fee2e2",
                "banner_bg": "#fef2f2",
                "banner_border": "#ef4444",
                "banner_title": f"Order #{order.id} Has Been Cancelled",
                "banner_text": f"Your order #{order.id} has been cancelled. Any reserved items have been released. If you believe this was in error, please contact our support team.",
            },
        }

        config = status_configs.get(
            new_status,
            {
                "title": f"Order #{order.id} Status Update: {new_status.value.capitalize()}",
                "badge_label": new_status.value.capitalize(),
                "badge_color": "#334155",
                "badge_bg": "#f1f5f9",
                "banner_bg": "#f8fafc",
                "banner_border": "#94a3b8",
                "banner_title": f"Order #{order.id} Status Updated",
                "banner_text": f"The status of your order #{order.id} has been updated to {new_status.value}.",
            },
        )

        subject = f"{config['title']} - EShop Store"

        payment_status_text = "Cash on Delivery (COD)"
        if new_status == OrderStatus.delivered:
            payment_status_text = "Paid upon Delivery (COD - Completed)"
        elif new_status == OrderStatus.cancelled:
            payment_status_text = "Cancelled (COD)"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{config['title']}</title>
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
                        Official Store • Order Status Update
                      </p>
                    </td>
                  </tr>

                  <!-- Hero Status Notification Banner -->
                  <tr>
                    <td style="padding: 32px 32px 20px 32px;">
                      <div style="background-color: {config['banner_bg']}; border-left: 4px solid {config['banner_border']}; padding: 16px 18px; border-radius: 8px; margin-bottom: 24px;">
                        <span style="color: {config['badge_color']}; font-size: 15px; font-weight: 800;">
                          {config['banner_title']}
                        </span>
                      </div>
                      <h2 style="font-size: 20px; color: #1a202c; margin: 0 0 10px 0; font-weight: 800;">
                        Hello {customer_name},
                      </h2>
                      <p style="font-size: 14px; line-height: 1.6; color: #4a5568; margin: 0;">
                        {config['banner_text']}
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
                          <td style="font-size: 13px; color: #718096; padding: 4px 0;">Payment:</td>
                          <td style="font-size: 13px; color: #1a202c; font-weight: 700; text-align: right; padding: 4px 0;">{payment_status_text}</td>
                        </tr>
                        <tr>
                          <td style="font-size: 13px; color: #718096; padding: 4px 0;">Updated Status:</td>
                          <td style="font-size: 12px; text-align: right; padding: 4px 0;">
                            <span style="display: inline-block; background-color: {config['badge_bg']}; color: {config['badge_color']}; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">
                              {config['badge_label']}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Ordered Items -->
                  <tr>
                    <td style="padding: 0 32px 24px 32px;">
                      <h3 style="font-size: 15px; font-weight: 700; color: #1a202c; margin: 0 0 12px 0;">
                        Order Summary
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
                        Shipping Destination
                      </h3>
                      <div style="background-color: #f8fafc; border-radius: 12px; padding: 14px 18px; font-size: 13px; line-height: 1.6; color: #4a5568; border: 1px solid #edf2f7;">
                        <strong style="color: #1a202c;">{shipping_name}</strong><br>
                        Phone: {shipping_phone}<br>
                        Address: {shipping_address_str}<br>
                        Country: {shipping_country}
                      </div>
                    </td>
                  </tr>

                  <!-- Tracking CTA Button -->
                  <tr>
                    <td style="padding: 0 32px 36px 32px; text-align: center;">
                      <a href="{tracking_link}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);">
                        View Real-Time Tracking →
                      </a>
                      <p style="font-size: 12px; color: #a0aec0; margin: 14px 0 0 0;">
                        Or copy-paste this link into your browser:<br>
                        <a href="{tracking_link}" style="color: #ea580c; word-break: break-all;">{tracking_link}</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #edf2f7;">
                      <p style="font-size: 12px; color: #a0aec0; margin: 0 0 4px 0;">
                        Have questions regarding this status update? Reply directly to this email or visit our help center.
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

        plain_text = f"""Order #{order.id} Status Update: {config['badge_label']}

Hello {customer_name},

{config['banner_text']}

Order Reference: #{order.id}
Date Placed: {order_date_str}
Payment: {payment_status_text}
Total Amount: {total_formatted}
Status: {config['badge_label']}

Items:
{items_text_list}

Shipping Details:
{shipping_name}
{shipping_phone}
{shipping_address_str}

Track your order:
{tracking_link}

Best regards,
E-Shop.pk Team
"""

        return cls._dispatch_email(
            recipient_email=recipient_email,
            customer_name=customer_name,
            subject=subject,
            html_content=html_content,
            plain_text=plain_text,
            order_id=order.id,
        )
