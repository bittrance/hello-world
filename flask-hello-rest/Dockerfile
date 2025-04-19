FROM python:3.13-slim

WORKDIR /app
COPY app.py requirements.txt .
RUN pip install -r requirements.txt
USER nobody
ENTRYPOINT ["gunicorn"]
EXPOSE 3000
CMD ["--workers=4", "--bind=unix:/var/run/gunicorn.sock", "--graceful-timeout=60", "app:build(delay=4.0)"]
