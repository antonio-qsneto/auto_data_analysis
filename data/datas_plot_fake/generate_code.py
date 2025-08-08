import pandas as pd
import numpy as np
from faker import Faker

def generate_startup_growth_data(
    num_businesses=10,
    months=24,
    seed=42
):
    np.random.seed(seed)
    fake = Faker()

    regions = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania']
    data = []

    # Gerar nomes fictícios de startups/PMEs
    business_names = [fake.company() for _ in range(num_businesses)]

    for business in business_names:
        region = np.random.choice(regions)
        revenue_base = np.random.uniform(50000, 200000)  # receita base mensal
        expense_base = revenue_base * np.random.uniform(0.6, 0.9)  # despesas base entre 60%-90% receita
        market_share_base = np.random.uniform(0.5, 5.0)  # mercado pequeno (em %)

        churn_base = np.random.uniform(2, 10)  # churn rate base em %
        customers_base = np.random.randint(500, 5000)  # base de clientes

        for month_offset in range(months):
            date = pd.Timestamp('2023-01-01') + pd.DateOffset(months=month_offset)

            # Receita varia +/- 20% ao redor da base, crescendo levemente com o tempo
            growth_factor = 1 + 0.02 * month_offset
            monthly_revenue = revenue_base * growth_factor * np.random.uniform(0.8, 1.2)

            # Despesas variam +/- 15% e acompanham receita, mas com leve otimização ao longo do tempo
            monthly_expenses = expense_base * growth_factor * np.random.uniform(0.85, 1.15) * (0.98 ** month_offset)

            # Fluxo de caixa líquido
            net_cash_flow = monthly_revenue - monthly_expenses

            # Novos clientes e churn (percentual de churn aplicado sobre base anterior)
            new_customers = int(customers_base * np.random.uniform(0.05, 0.15) * growth_factor)
            churn_rate = churn_base * np.random.uniform(0.8, 1.2)  # variação churn
            churned_customers = int(customers_base * churn_rate / 100)

            # Atualiza base de clientes
            customers_base = customers_base + new_customers - churned_customers
            if customers_base < 0:
                customers_base = 0

            # Market share varia +/- 0.5% em torno da base, com crescimento lento
            market_share = market_share_base + 0.05 * month_offset + np.random.uniform(-0.5, 0.5)
            if market_share < 0:
                market_share = 0

            data.append({
                'date': date.strftime('%Y-%m'),
                'business_name': business,
                'region': region,
                'monthly_revenue': round(monthly_revenue, 2),
                'monthly_expenses': round(monthly_expenses, 2),
                'net_cash_flow': round(net_cash_flow, 2),
                'new_customers': new_customers,
                'churn_rate_%': round(churn_rate, 2),
                'active_customers': customers_base,
                'market_share_%': round(market_share, 2),
            })

    df = pd.DataFrame(data)

    # Previsão simples: média móvel 3 meses da receita para o próximo mês
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['business_name', 'date'])
    df['sales_forecast_next_month'] = df.groupby('business_name')['monthly_revenue'] \
        .rolling(window=3, min_periods=1).mean().shift(1).reset_index(level=0, drop=True).round(2)

    return df

if __name__ == "__main__":
    df = generate_startup_growth_data(num_businesses=8, months=18)
    print(df.head(20))
    df.to_csv('startup_smb_growth_data.csv', index=False)
