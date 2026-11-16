"""Transactional token delivery. Never return recovery tokens in production responses."""
import os
import smtplib
from email.message import EmailMessage


def send_token(recipient, token, purpose):
    host = os.environ.get('SMTP_HOST')
    if not host:
        raise RuntimeError('Email delivery is not configured. Contact the application administrator.')
    message = EmailMessage()
    message['From'] = os.environ['SMTP_FROM']
    message['To'] = recipient
    message['Subject'] = f'MindSense {purpose}'
    message.set_content(f'Your MindSense {purpose} token is:\n\n{token}\n\nIf you did not request this, ignore this email. Password-reset tokens expire after 30 minutes.')
    with smtplib.SMTP(host, int(os.environ.get('SMTP_PORT', '587')), timeout=15) as server:
        server.starttls()
        if os.environ.get('SMTP_USERNAME'):
            server.login(os.environ['SMTP_USERNAME'], os.environ['SMTP_PASSWORD'])
        server.send_message(message)
