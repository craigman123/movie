import sqlite3
import os

db_path = 'instance/luma.db'
if os.path.exists(db_path):
    print(f"DB exists at {db_path}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = c.fetchall()
    print("Tables:", [t[0] for t in tables])
    
    c.execute("SELECT COUNT(*) FROM schedule")
    sched_count = c.fetchone()[0]
    print(f"Schedules count: {sched_count}")
    
    c.execute("SELECT COUNT(*) FROM movies")
    movie_count = c.fetchone()[0]
    print(f"Movies count: {movie_count}")
    
    if sched_count > 0:
        c.execute("SELECT m.movie_name, s.date, s.start_time, s.end_time FROM schedule s JOIN movies m ON s.movie_id = m.id LIMIT 3")
        schedules = c.fetchall()
        print("Recent schedules:", schedules)
    
    conn.close()
else:
    print("DB not found - run app first to create tables")

