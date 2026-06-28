def calculate_area(width, height):
    # BUG: Using addition instead of multiplication for area calculation
    return width + height

def read_user_data(user_id):
    # SECURITY ISSUE: Potential SQL injection risk
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    return query

def main():
    print(calculate_area(5, 10))

if __name__ == "__main__":
    main()
