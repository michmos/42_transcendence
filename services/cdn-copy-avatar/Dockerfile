# Nginx stage to serve the web application
FROM nginx:stable-alpine

# Update packages for security-fixes
RUN set -eux; \
	apk update && apk upgrade --no-cache && \
	rm -rf /var/cache/apk/*

COPY ./data/base_avatar.png ./tmp

CMD ["cp", "./tmp/base_avatar.png", "/data/cdn/avatars"]
