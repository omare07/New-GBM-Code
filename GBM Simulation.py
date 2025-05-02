Explain this,"import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import time

# --- Configuration ---

stocks = {
"ZOOM": {"S0": 100, "mu": 0.0005, "sigma": 0.02},
"SLPH": {"S0": 60,  "mu": 0.0003, "sigma": 0.015},
"VIST": {"S0": 80,  "mu": 0.0004, "sigma": 0.025},
"GRWN": {"S0": 40,  "mu": 0.0006, "sigma": 0.03},
"SCAT": {"S0": 120, "mu": 0.0004, "sigma": 0.02},
}

# Shock events: {minute: {ticker: shock\_percentage}}

shock\_events = {
30: {"SCAT": 0.10},  # SCAT earnings beat +10%
45: {"ZOOM": 0.20},  # Meme pump +20%
60: {"VIST": -0.15}, # Bad travel news -15%
90: {"GRWN": 0.18},  # Green energy subsidy +18%
}

# Volatility adjustments: {minute: new\_sigma}

volatility\_events = {
30: 0.04,
45: 0.06,
60: 0.05,
90: 0.06,
110: 0.07,
}

runtime\_seconds = 7200  # total simulation time
sleep\_time = 0.2  # seconds between updates (set 60 for real minutes, set smaller for testing)

# --- Simulation Functions ---

def update\_price(S\_prev, mu, sigma, dt=1/390):
"""Update price using GBM."""
dW = np.random.normal(0, np.sqrt(dt))
S\_new = S\_prev \* np.exp((mu - 0.5 \* sigma\*\*2) \* dt + sigma \* dW)
return S\_new

# --- Main Simulation Loop ---

price\_history = {ticker: \[params\["S0"]] for ticker, params in stocks.items()}
current\_prices = {ticker: params\["S0"] for ticker, params in stocks.items()}

plt.ion()  # Turn on interactive mode
fig, axes = plt.subplots(3, 2, figsize=(15, 8))
axes = axes.flatten()

for minute in range(1, runtime\_seconds + 1):
print(f"\n--- Minute {minute} ---")

```
# Adjust volatility if needed
if minute in volatility_events:
    for ticker in stocks:
        stocks[ticker]["sigma"] = volatility_events[minute]
    print(f"Volatility changed to {volatility_events[minute]}")

# Apply shocks if needed
if minute in shock_events:
    for ticker, pct_change in shock_events[minute].items():
        current_prices[ticker] *= (1 + pct_change)
        print(f"Shock Event: {ticker} price changed by {pct_change*100:.1f}%")

# Update each stock price
for ticker, params in stocks.items():
    current_prices[ticker] = update_price(current_prices[ticker], params["mu"], params["sigma"])
    price_history[ticker].append(current_prices[ticker])

# Plotting
for idx, (ticker, prices) in enumerate(price_history.items()):
    axes[idx].clear()
    axes[idx].plot(prices, label=ticker, color='tab:blue')
    axes[idx].set_title(ticker)
    axes[idx].set_xlabel("Minutes")
    axes[idx].set_ylabel("Price ($)")
    axes[idx].grid(True)
    axes[idx].set_xlim(0, 7200)
fig.suptitle(f"Market Simulation - Minute {minute}", fontsize=16)
fig.tight_layout(rect=[0, 0.03, 1, 0.95])
plt.pause(0.001)

time.sleep(sleep_time)
```

plt.ioff()
plt.show()"
