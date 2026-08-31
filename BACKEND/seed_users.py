from app import app, db
from models.user import User
from utils.security import hash_password


DEVELOPMENT_USERS = [
    {
        "full_name": "Test Researcher",
        "email": "researcher@test.com",
        "role": "researcher",
    },
    {
        "full_name": "Test IEC Secretariat",
        "email": "secretariat@test.com",
        "role": "iec_secretariat",
    },
    {
        "full_name": "Test IEC Member",
        "email": "member@test.com",
        "role": "iec_member",
    },
    {
        "full_name": "Test Regulatory Admin",
        "email": "admin@test.com",
        "role": "regulatory_admin",
    },
]


def seed_users():
    with app.app_context():
        for user_data in DEVELOPMENT_USERS:
            existing_user = User.query.filter_by(
                email=user_data["email"]
            ).first()

            if existing_user:
                print(f"Already exists: {user_data['email']}")
                continue

            password = input(
                f"Enter development password for "
                f"{user_data['email']}: "
            )

            if not password:
                print("Password cannot be empty. Skipping user.")
                continue

            user = User(
                full_name=user_data["full_name"],
                email=user_data["email"],
                password_hash=hash_password(password),
                role=user_data["role"],
                is_active=True,
            )

            db.session.add(user)

        db.session.commit()
        print("Development users created successfully.")


if __name__ == "__main__":
    seed_users()