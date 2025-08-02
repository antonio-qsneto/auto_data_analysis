import pandas as pd
import random
from datetime import datetime, timedelta

# Categories and types
categories = ["Food", "Transport", "Leisure", "Education", "Investment", "Health", "Rent", "Others"]
types = ["Expense", "Income"]

# Data container
data_list = []

# Generate 100 random records
for _ in range(100):
    # Random date within 180 days starting from 2024-01-01
    date = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 180))

    # Random category
    category = random.choice(categories)

    # Define type: "Expense" for all except "Investment" which is "Income"
    transaction_type = "Expense" if category != "Investment" else "Income"

    # Random value: smaller for expenses, larger for income
    amount = round(random.uniform(50, 1000), 2) if transaction_type == "Expense" else round(random.uniform(500, 5000), 2)

    # Append record
    data_list.append([date.strftime('%Y-%m-%d'), category, transaction_type, amount])

# Create DataFrame
df = pd.DataFrame(data_list, columns=["Date", "Category", "Type", "Amount"])

# Save to CSV
df.to_csv("fake_expenses.csv", index=False)
