"""
FAQ / domain knowledge for the demo customer-support store.

The knowledge is defined here as a Python constant so it works out-of-the-box
without any DB seed step.  The same data is also seeded into the faq_entries
table (see db/seed.py) so it can be managed from the DB if desired.
"""
import re

STORE_NAME = "Customer Store"
SUPPORT_EMAIL = "support@example.com"
SUPPORT_PHONE = "+91-80-4567-8900"
STORE_WEBSITE = "example.com"

# ── Structured FAQ ────────────────────────────────────────────────────────────
FAQ: list[dict] = [
    {
        "category": "Shipping",
        "question": "Do you ship internationally?",
        "answer": (
            "Yes! We ship to 40+ countries. "
            "Standard international shipping takes 7–14 business days. "
            "Expedited (3–5 days) is available for an extra fee."
        ),
    },
    {
        "category": "Shipping",
        "question": "Do you ship to the USA?",
        "answer": (
            "Absolutely. We ship to all 50 US states. "
            "Standard delivery: 5–7 business days. "
            "Express delivery: 2–3 business days for $12.99."
        ),
    },
    {
        "category": "Shipping",
        "question": "How much does shipping cost?",
        "answer": (
            "Domestic (India): Free on orders above ₹999; ₹49 otherwise. "
            "International: starts at $9.99 USD depending on destination."
        ),
    },
    {
        "category": "Returns & Refunds",
        "question": "What is your return policy?",
        "answer": (
            "Items can be returned within 30 days of delivery, provided they are "
            "unworn, unwashed, and in original packaging with tags attached. "
            "Sale items are final sale and not eligible for return."
        ),
    },
    {
        "category": "Returns & Refunds",
        "question": "How do I get a refund?",
        "answer": (
            "Once your return is received and inspected (2–3 business days), "
            "the refund is processed to your original payment method within 5–7 business days. "
            "You will receive an email confirmation."
        ),
    },
    {
        "category": "Returns & Refunds",
        "question": "Can I exchange an item?",
        "answer": (
            "Yes. Exchanges for a different size or colour are free within 30 days. "
            f"Visit the Returns portal on our website or email {SUPPORT_EMAIL}."
        ),
    },
    {
        "category": "Orders",
        "question": "How do I track my order?",
        "answer": (
            "A tracking link is emailed as soon as your order ships. "
            f"You can also enter your order number at {STORE_WEBSITE}/track."
        ),
    },
    {
        "category": "Orders",
        "question": "Can I cancel or modify my order?",
        "answer": (
            "Orders can be cancelled or modified within 1 hour of placement. "
            "After that, the order enters fulfilment and cannot be changed. "
            f"Contact {SUPPORT_EMAIL} immediately with your order number."
        ),
    },
    {
        "category": "Products",
        "question": "How do I find my size?",
        "answer": (
            "Each product page has a detailed size guide. "
            "Our sizes run true-to-fit. If you are between sizes, we recommend sizing up."
        ),
    },
    {
        "category": "Support",
        "question": "What are your support hours?",
        "answer": (
            "Our human support team is available Monday–Friday, 9 AM–6 PM IST. "
            "This AI agent is available 24/7 for common questions. "
            f"Email: {SUPPORT_EMAIL} | Phone: {SUPPORT_PHONE}"
        ),
    },
    {
        "category": "Payments",
        "question": "What payment methods do you accept?",
        "answer": (
            "We accept all major credit/debit cards, UPI, net banking, "
            "Paytm, PhonePe, and cash on delivery (India only). "
            "International orders: Visa, Mastercard, and PayPal."
        ),
    },
]


def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    return " ".join(text.split())


def find_faq_answer(user_text: str, faq_list: list[dict] | None = None) -> str | None:
    """
    Return a canned FAQ answer when the user question matches a known entry.
    Skips the LLM for exact or close matches (e.g. suggested-question chips).
    """
    entries = faq_list if faq_list is not None else FAQ
    normalized_user = _normalize(user_text)
    if not normalized_user:
        return None

    for entry in entries:
        if normalized_user == _normalize(entry["question"]):
            return entry["answer"]

    for entry in entries:
        normalized_q = _normalize(entry["question"])
        if len(normalized_user) >= 8 and (
            normalized_user in normalized_q or normalized_q in normalized_user
        ):
            return entry["answer"]

    return None


def build_system_prompt(faq_list: list[dict] | None = None) -> str:
    """
    Build the system prompt injected into every LLM call.
    Accepts an optional list of FAQ dicts (from DB) to override the default.
    """
    entries = faq_list if faq_list is not None else FAQ
    faq_text = "\n".join(
        f"Q: {e['question']}\nA: {e['answer']}" for e in entries
    )

    refusal = (
        f"I'm only able to help with {STORE_NAME} customer support — things like "
        f"orders, shipping, returns, payments, and store policies. "
        f"I can't answer general questions like that. "
        f"For anything else, please contact {SUPPORT_EMAIL} or {SUPPORT_PHONE} "
        f"(Mon–Fri, 9 AM–6 PM IST)."
    )

    return f"""You are a customer support agent for {STORE_NAME}, a modern online store.

STRICT SCOPE — READ CAREFULLY:
You must ONLY answer questions directly related to {STORE_NAME} and its store \
knowledge below. Allowed topics include: orders, shipping, delivery, returns, \
refunds, payments, products, sizing, tracking, account issues, store hours, and \
policies listed in the knowledge base.

You must REFUSE all other questions, including but not limited to:
- General knowledge (history, geography, science, trivia)
- Questions about landmarks, celebrities, politics, news, or current events
- Homework, coding, math, writing, or personal advice unrelated to the store
- Questions about other companies, websites, or products not sold by {STORE_NAME}
- Small talk, jokes, role-play, or anything not about customer support

When a question is off-topic or not covered by the store knowledge:
1. Do NOT answer the question, even if you know the answer.
2. Do NOT provide partial or related information from general knowledge.
3. Reply briefly and politely using wording very close to this template:
"{refusal}"

IN-SCOPE QUESTIONS:
Answer accurately and concisely using ONLY the store knowledge below. \
If the question is store-related but the answer is not in the knowledge base, \
say you don't have that information and direct the customer to {SUPPORT_EMAIL} \
or {SUPPORT_PHONE} (Mon–Fri, 9 AM–6 PM IST).

RULES:
- Never make up information. Never promise things not stated in the knowledge base.
- Keep in-scope answers short (2–4 sentences unless more detail is required).
- Use a warm, professional tone.

--- STORE KNOWLEDGE ---
{faq_text}
--- END STORE KNOWLEDGE ---
"""
