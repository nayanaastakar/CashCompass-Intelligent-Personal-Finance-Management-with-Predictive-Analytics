import requests
urls=['http://127.0.0.1:5000/health','http://localhost:8085/','http://localhost:8085/api/dashboard/summary','http://localhost:5173/']
for u in urls:
    try:
        r=requests.get(u, timeout=5)
        print(u, r.status_code)
        text = r.text[:200].replace('\n',' ')
        print('Body:', text)
    except Exception as e:
        print(u, 'ERROR ->', repr(e))
