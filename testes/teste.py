import pandas as pd
import plotly.express as px

# Read CSV file
df = pd.read_csv("gastos_fake.csv")

# Convert 'Data' to datetime
df['Data'] = pd.to_datetime(df['Data'], errors='coerce')

# Drop rows where 'Data' or 'Valor' is NaN
df = df.dropna(subset=['Data', 'Valor'])

# Sort by date
df = df.sort_values('Data')

# Plot using Plotly Express
fig = px.line(df, x='Data', y='Valor', color='Tipo', title='Valor Over Time by Tipo')

# Ensure x-axis is treated as date
fig.update_xaxes(type='date')

# Show figure
fig.write_html("plot.html", auto_open=True)

