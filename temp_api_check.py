import requests
import sys
sys.stdout.reconfigure(encoding='utf-8')
base='http://127.0.0.1:8085/api'
cred={'email':'demo@finguard.ai','password':'demo1234'}
print('--- AUTHENTICATION ---')
login=requests.post(base+'/auth/signin', json=cred, timeout=20)
print('login status', login.status_code)
print('login text', login.text)
if login.status_code != 200:
    raise SystemExit('login failed')
token=login.json().get('token')
headers={'Authorization': 'Bearer ' + token}
endpoints=[
    ('dashboard_summary','get', base + '/dashboard/summary', None),
    ('recommendations_list','get', base + '/recommendations', None),
    ('recommendations_generate','post', base + '/recommendations/generate', None),
    ('recommendations_regret','post', base + '/recommendations/regret', None),
    ('stability_score','post', base + '/ai/stability-score', {'net_worth':150000,'monthly_income':65000,'monthly_expense':42000,'liabilities':35000}),
    ('forecast','post', base + '/ai/forecast', {'historical_data':[{'month':i+1,'income':52000 + i*1200,'expense':30000 + i*500} for i in range(12)]}),
    ('scenario','post', base + '/ai/scenario', {'scenario_type':'income_drop','duration_months':3,'income_change_percent':-30,'expense_change_percent':5}),
]
for name, method, url, payload in endpoints:
    print('\n---', name, '---')
    if method == 'get':
        r=requests.get(url, headers=headers, timeout=30)
    else:
        r=requests.post(url, headers=headers, json=payload, timeout=30)
    print('status', r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)
