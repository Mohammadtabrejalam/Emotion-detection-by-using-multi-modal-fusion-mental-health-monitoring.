"""Local operator command. Never creates a public default password."""
import getpass
from dotenv import load_dotenv
load_dotenv()
from backend.app.database import init_db, register_developer, get_db_connection

def main():
    init_db()
    email = input('Admin email: ').strip()
    username = input('Admin username: ').strip()
    password = getpass.getpass('Admin password (at least 12 characters): ')
    if len(password) < 12 or '@' not in email or not username:
        raise SystemExit('Invalid admin details.')
    ok, data = register_developer(email, username, password, 'Administrator', 'MindSense', 'SUPER_ADMIN')
    if not ok: raise SystemExit(str(data))
    with get_db_connection() as conn:
        conn.execute("UPDATE developer_users SET account_state='ACTIVE', email_verified=1, email_verification_token=NULL WHERE id=?", (data['id'],))
    print('Administrator created. No credentials were written to source control.')

if __name__ == '__main__': main()
