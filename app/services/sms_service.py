import os

from twilio.rest import Client


def get_twilio_client():
    return Client(
        os.getenv("TWILIO_ACCOUNT_SID"),
        os.getenv("TWILIO_AUTH_TOKEN"),
    )


def send_verification_code(phone_number: str):
    client = get_twilio_client()

    print("SENDING SMS TO:", phone_number)

    result = client.verify.v2.services(
        os.getenv("TWILIO_VERIFY_SERVICE_SID")
    ).verifications.create(
        to=phone_number,
        channel="sms",
    )

    print("TWILIO RESULT:", result.status)

    return result

def verify_code(
    phone_number: str,
    code: str,
) -> bool:
    client = get_twilio_client()

    result = client.verify.v2.services(
        os.getenv("TWILIO_VERIFY_SERVICE_SID")
    ).verification_checks.create(
        to=phone_number,
        code=code,
    )

    return result.status == "approved"