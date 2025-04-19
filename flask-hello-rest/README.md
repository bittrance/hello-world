# Testing graceful shutdown

gunicorn --workers=2 --bind unix:/tmp/sock --graceful-timeout 60 app:app

docker run --rm --name nginx -p 127.0.0.1:8080:8080 -v ./nginx.conf:/etc/nginx/nginx.conf -v /tmp/sock:/var/run/gunicorn.sock docker-hub.etraveli.net/docker/nginx-vts:1.18.0-3c6cf41

docker kill --signal=TERM nginx
docker kill --signal=QUIT nginx
