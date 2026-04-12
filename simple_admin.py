import sqlite3

# Pre-hashed password for "admin123" using bcrypt
hashed_password = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fMmiPuXa"

# Connect to database
conn = sqlite3.connect('connect_hub.db')
c = conn.cursor()

# Insert admin user
try:
    c.execute("""
        INSERT OR IGNORE INTO users
        (username, email, full_name, hashed_password, is_admin, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    """, ('admin', 'admin@connecthub.com', 'Administrator', hashed_password, 1))

    conn.commit()
    print("Admin user created successfully!")
    print("Username: admin")
    print("Password: admin123")

    # Check if inserted
    c.execute("SELECT id, username, is_admin FROM users WHERE username = 'admin'")
    row = c.fetchone()
    if row:
        print(f"User ID: {row[0]}, Username: {row[1]}, Is Admin: {bool(row[2])}")
    else:
        print("Failed to create admin user")

except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()