# Nginx stage to serve the web application
FROM nginx:stable-alpine

COPY ./config/nginx.conf /etc/nginx/nginx.conf

# Update packages for security-fixes
RUN set -eux; \
	apk update && apk upgrade --no-cache && \
	rm -rf /var/cache/apk/*

EXPOSE 80
