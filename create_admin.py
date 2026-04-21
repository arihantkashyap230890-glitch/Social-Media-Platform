print("Starting admin creation script...")

from database import SessionLocal, Base, engine
from models import User
from auth import hash_password

print("Creating tables...")
# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

print("Creating session...")
# Create a session
db = SessionLocal()

try:
    print("Checking for existing admin...")
    # Check if admin user already exists
    admin_user = db.query(User).filter(User.username == "admin").first()
    if admin_user:
        print("Admin user already exists")
        print(f"ID: {admin_user.id}, Username: {admin_user.username}, Is Admin: {admin_user.is_admin}")
    else:
        print("Creating admin user...")
        # Create admin user
        hashed_password = hash_password("admin123")
        admin = User(
            username="admin",
            email="admin@connecthub.com",
            full_name="Administrator",
            hashed_password=hashed_password,
            is_admin=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("Admin user created successfully!")
        print(f"ID: {admin.id}, Username: {admin.username}, Password: admin123")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
    print("Done.")