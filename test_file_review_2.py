def divide_numbers(a, b):
    # BUG: No check for division by zero
    return a / b

def get_admin_credentials():
    # SECURITY ISSUE: Hardcoded sensitive information
    password = "SuperSecretAdminPassword123!"
    return {"username": "admin", "password": password}

def main():
    print(divide_numbers(10, 0))

if __name__ == "__main__":
    main()
