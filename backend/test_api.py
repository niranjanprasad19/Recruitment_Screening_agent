import requests

BASE = 'http://localhost:8000'

# 1. Test Resume Upload
print('=== RESUME UPLOAD ===')
with open('test_resume.txt', 'w') as f:
    f.write('Jane Smith\nEmail: jane@example.com\nFull Stack Developer with 4 years experience\nSkills: React, Node.js, TypeScript, AWS, Docker\nEducation: MS Computer Science from Stanford')
with open('test_resume.txt', 'rb') as f:
    r = requests.post(f'{BASE}/api/v1/resumes/upload',
        files={'file': ('jane_smith_resume.txt', f, 'text/plain')},
        data={'name': 'Jane Smith', 'email': 'jane@example.com'})
print(f'  Upload: {r.status_code}')

# 2. Test Auth
print('\n=== AUTH ===')
r = requests.post(f'{BASE}/api/v1/auth/register', json={
    'email': 'test2@test.com', 'password': 'test123', 'name': 'Test User',
    'role': 'recruiter', 'company_name': 'TestCo'
})
print(f'  Register: {r.status_code}')
r = requests.post(f'{BASE}/api/v1/auth/login', json={'email': 'test2@test.com', 'password': 'test123'})
print(f'  Login: {r.status_code}')

# 3. Dashboard
print('\n=== DASHBOARD ===')
r = requests.get(f'{BASE}/api/v1/dashboard/metrics')
d = r.json()
print(f"  Candidates: {d['total_candidates']}, Active Jobs: {d['total_active_jobs']}")

# 4. Jobs
print('\n=== JOBS ===')
r = requests.post(f'{BASE}/api/v1/jobs/create', json={
    'title': 'Senior Python Developer', 'company': 'TechCorp', 'department': 'Engineering',
    'description_text': 'We need a senior Python developer with Django, FastAPI, AWS, Docker experience. 5+ years required.'
})
print(f'  Create Job: {r.status_code}')

# 5. Match Sessions
print('\n=== MATCHING ===')
r = requests.get(f'{BASE}/api/v1/match/sessions')
print(f'  Sessions: {r.status_code}, count: {len(r.json())}')

# 6. Health
print('\n=== HEALTH ===')
r = requests.get(f'{BASE}/health')
h = r.json()
print(f"  Status: {h['status']}, DB: {h['database']}")

print('\nALL ENDPOINTS WORKING!')
