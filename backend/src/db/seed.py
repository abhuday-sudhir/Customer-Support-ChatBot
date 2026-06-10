"""
Seed script – populates faq_entries from the hard-coded FAQ list.
Run once after migrations:  python -m src.db.seed
Re-seed (replace existing):  python -m src.db.seed --force
"""
import sys

from src.db.database import SessionLocal, engine
from src.models.orm import Base, FAQEntry
from src.utils.faq import FAQ


def seed(*, force: bool = False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(FAQEntry).count()
        if existing and not force:
            print(f"FAQ already seeded ({existing} entries). Skipping.")
            return

        if existing and force:
            db.query(FAQEntry).delete()
            db.commit()
            print(f"Cleared {existing} existing FAQ entries.")

        for item in FAQ:
            entry = FAQEntry(
                category=item["category"],
                question=item["question"],
                answer=item["answer"],
            )
            db.add(entry)

        db.commit()
        print(f"Seeded {len(FAQ)} FAQ entries.")
    finally:
        db.close()


if __name__ == "__main__":
    seed(force="--force" in sys.argv)
