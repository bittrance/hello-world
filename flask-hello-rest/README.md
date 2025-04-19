# Testing graceful shutdown

gunicorn --workers=2 --bind unix:/tmp/sock --graceful-timeout 60 app:app

docker run --rm --name nginx -p 127.0.0.1:8080:8080 -v ./nginx.conf:/etc/nginx/nginx.conf -v /tmp/sock:/var/run/gunicorn.sock nginx:1.28

docker kill --signal=TERM nginx
docker kill --signal=QUIT nginx
